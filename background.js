// ===========================================================
// PUT YOUR FREE GNEWS API KEY HERE
// Get one at: https://gnews.io  (100 requests/day free)
// ===========================================================
const GNEWS_API_KEY = "170d2875b6002c9a8a80960c9dfc0b0a";

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "negativeNews",
    title: "🔍 Search Negative News",
    contexts: ["selection"]
  });

  chrome.contextMenus.create({
    id: "summarize",
    title: "📄 Summarize This",
    contexts: ["selection"]
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  const selectedText = info.selectionText?.trim();
  if (!selectedText) return;

  const payload = {
    selectedText,
    action: info.menuItemId,
    apiKey: GNEWS_API_KEY
  };

  chrome.storage.session.set({ payload }, () => {
    chrome.tabs.update(tab.id, { url: chrome.runtime.getURL("results.html") });
  });
});
