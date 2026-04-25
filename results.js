// ── Entity Detection ─────────────────────────────────────────
function detectEntityType(text) {
  const placeKeywords = /\b(city|country|river|mountain|lake|ocean|sea|island|forest|park|state|province|continent|village|town|bay|gulf|valley|desert|peninsula|capital|republic|kingdom|territory)\b/i;
  const orgKeywords   = /\b(inc|corp|ltd|llc|company|group|association|foundation|institute|university|college|bank|airlines?|motors?|technologies|systems)\b/i;
  const capitalizedRun = text.trim().split(/\s+/).filter(w => /^[A-Z][a-z]/.test(w)).length;

  if (placeKeywords.test(text)) return { label: "Place",          css: "place"  };
  if (orgKeywords.test(text))   return { label: "Organization",   css: "org"    };
  if (capitalizedRun >= 2)      return { label: "Person",         css: ""       };
  if (capitalizedRun === 1)     return { label: "Place / Person", css: ""       };
  return                               { label: "Other",          css: "other"  };
}

// ── DOM helpers ───────────────────────────────────────────────
function showError(title, body) {
  document.getElementById("loadingView").style.display = "none";
  const view = document.getElementById("resultsView");
  view.style.display = "block";
  view.innerHTML = `
    <div class="error-box">
      <strong>${title}</strong>
      <p>${body}</p>
    </div>`;
}

function showResults(html) {
  document.getElementById("loadingView").style.display = "none";
  const view = document.getElementById("resultsView");
  view.style.display = "block";
  view.innerHTML = html;
}

// ── Wikipedia Summary ─────────────────────────────────────────
async function fetchSummary(text) {
  const encoded = encodeURIComponent(text.trim());
  const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encoded}`;

  let res;
  try { res = await fetch(url); } catch {
    throw new Error("Network error — could not reach Wikipedia.");
  }

  if (res.status === 404) {
    // Try first word(s) as fallback
    const firstTwo = text.trim().split(/\s+/).slice(0, 2).join(" ");
    if (firstTwo !== text.trim()) {
      const res2 = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(firstTwo)}`);
      if (res2.ok) return res2.json();
    }
    throw new Error(`No Wikipedia article found for "<strong>${text}</strong>".`);
  }

  if (!res.ok) throw new Error(`Wikipedia returned status ${res.status}.`);
  return res.json();
}

// ── GNews Negative News ───────────────────────────────────────
async function fetchNegativeNews(text, apiKey) {
  if (!apiKey || apiKey === "YOUR_GNEWS_API_KEY_HERE") {
    throw new Error(
      `No GNews API key set. Open <code>background.js</code> and replace ` +
      `<code>YOUR_GNEWS_API_KEY_HERE</code> with your free key from ` +
      `<a href="https://gnews.io" target="_blank">gnews.io</a>.`
    );
  }

  const query = encodeURIComponent(`${text} controversy OR scandal OR lawsuit OR fraud OR arrest`);
  const url = `https://gnews.io/api/v4/search?q=${query}&lang=en&max=10&apikey=${apiKey}`;

  let res;
  try { res = await fetch(url); } catch {
    throw new Error("Network error — could not reach GNews API.");
  }

  if (res.status === 401 || res.status === 403) {
    throw new Error("Invalid GNews API key. Check your key at <a href='https://gnews.io' target='_blank'>gnews.io</a>.");
  }

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`GNews API error ${res.status}: ${body || "unknown error"}.`);
  }

  return res.json();
}

// ── Renderers ─────────────────────────────────────────────────
function renderSummary(data) {
  const summary  = data.extract || "No summary available.";
  const pageUrl  = data.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodeURIComponent(data.title || "")}`;
  const imageHtml = data.thumbnail?.source
    ? `<img src="${data.thumbnail.source}" alt="" class="wiki-thumb">`
    : "";

  return `
    <div class="results-header">Wikipedia Summary</div>
    <div class="summary-card">
      ${imageHtml}
      <div class="summary-text">${summary}</div>
      <a class="wiki-link" href="${pageUrl}" target="_blank">
        📖 Read full article on Wikipedia
      </a>
    </div>`;
}

function renderNews(data, query) {
  const articles = data.articles || [];

  if (articles.length === 0) {
    return `
      <div class="results-header">Negative News</div>
      <div class="error-box">
        <strong>No articles found</strong>
        <p>Try a different search term or check your API quota at <a href="https://gnews.io" target="_blank">gnews.io</a>.</p>
      </div>`;
  }

  const noteQuery = `${query} controversy OR scandal OR lawsuit OR fraud OR arrest`;
  const items = articles.map(a => {
    const date = a.publishedAt ? new Date(a.publishedAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "";
    const snippet = a.description ? `<div class="news-snippet">${a.description}</div>` : "";
    return `
      <a class="news-item" href="${a.url}" target="_blank">
        <div class="news-title">${a.title}</div>
        <div class="news-meta">
          <span class="news-source">${a.source?.name || "Unknown"}</span>
          ${date ? `<span>${date}</span>` : ""}
        </div>
        ${snippet}
      </a>`;
  }).join("");

  return `
    <div class="results-header">${articles.length} Result${articles.length !== 1 ? "s" : ""} — Negative News</div>
    <div class="query-note">Search query: <code>${noteQuery}</code></div>
    <div class="news-list">${items}</div>`;
}

// ── Main ──────────────────────────────────────────────────────
async function main() {
  const { payload } = await new Promise(resolve =>
    chrome.storage.session.get("payload", resolve)
  );

  if (!payload) {
    showError("No data found", "Close this tab and try right-clicking on highlighted text again.");
    return;
  }

  const { selectedText, action, apiKey } = payload;

  // Populate query card
  const entity = detectEntityType(selectedText);
  document.getElementById("queryText").textContent = selectedText;
  const badge = document.getElementById("entityBadge");
  badge.textContent = entity.label;
  if (entity.css) badge.classList.add(entity.css);
  document.getElementById("queryCard").style.display = "flex";

  const actionLabel = document.getElementById("actionLabel");
  actionLabel.textContent = "Fetching results…";
  document.getElementById("topBar").style.display = "flex";

  // Fetch both in parallel
  const [summaryResult, newsResult] = await Promise.allSettled([
    fetchSummary(selectedText),
    fetchNegativeNews(selectedText, apiKey)
  ]);

  const summaryHtml = summaryResult.status === "fulfilled"
    ? renderSummary(summaryResult.value)
    : `<div class="error-box"><strong>Summary failed</strong><p>${summaryResult.reason?.message || "Unknown error"}</p></div>`;

  const newsHtml = newsResult.status === "fulfilled"
    ? renderNews(newsResult.value, selectedText)
    : `<div class="error-box"><strong>News failed</strong><p>${newsResult.reason?.message || "Unknown error"}</p></div>`;

  let currentView = action === "summarize" ? "summary" : "news";
  const navBtn = document.getElementById("navBtn");

  function showView(view) {
    currentView = view;
    if (view === "summary") {
      actionLabel.textContent = "Summary";
      showResults(summaryHtml);
      navBtn.innerHTML = "🔍 Negative News →";
      navBtn.onclick = () => showView("news");
    } else {
      actionLabel.textContent = "Negative News";
      showResults(newsHtml);
      navBtn.innerHTML = "📄 Summary →";
      navBtn.onclick = () => showView("summary");
    }
  }

  showView(currentView);
}

main();
