# 🖱️ Smart Right-Click Chrome Extension

> Highlight · Right-click · Insight

A lightweight Chrome extension that supercharges your right-click menu. Select any text on a webpage, right-click, and instantly get a **Wikipedia summary** or a **negative news search** — all without leaving your tab.

---

## ✨ Features

- **📄 Summarize This** — Fetches a Wikipedia summary for any highlighted text, complete with a thumbnail image and a link to the full article. Falls back intelligently if an exact match isn't found.
- **🔍 Search Negative News** — Searches for recent articles linked to controversies, scandals, lawsuits, fraud, and arrests using the GNews API.
- **🏷️ Smart Entity Detection** — Automatically classifies your selected text as a Person, Place, Organization, or Other.
- **⚡ Parallel Fetching** — Both summary and news results are fetched simultaneously for a fast experience.
- **🔄 Toggle Views** — Switch between Summary and Negative News results with a single click.

---

## 📋 Prerequisites

Before installing, you need a **free GNews API key**.

### Getting Your GNews API Key

1. Go to [https://gnews.io](https://gnews.io)
2. Click **Sign Up** and create a free account
3. After signing in, navigate to your dashboard
4. Copy your **API key** — the free tier includes **100 requests/day**

> ⚠️ **Important:** Every person who downloads and uses this extension must generate their own GNews API key. The extension will not return news results without a valid key.

---

## 🚀 Installation

### Step 1 — Download the Extension

Clone or download this repository to your computer:

```bash
git clone https://github.com/YOUR_USERNAME/smart-right-click-extension.git
```

Or click **Code → Download ZIP** and extract the folder.

### Step 2 — Add Your GNews API Key

1. Open the extension folder
2. Open **`background.js`** in any text editor (Notepad, VS Code, etc.)
3. Find this line near the top of the file:

```js
const GNEWS_API_KEY = "YOUR_GNEWS_API_KEY_HERE";
```

4. Replace `YOUR_GNEWS_API_KEY_HERE` with your actual API key:

```js
const GNEWS_API_KEY = "abc123youractualkey";
```

5. Save the file

### Step 3 — Load the Extension in Chrome

1. Open Chrome and go to `chrome://extensions/`
2. Enable **Developer mode** (toggle in the top-right corner)
3. Click **Load unpacked**
4. Select the extension folder
5. The **Smart Right-Click** extension will now appear in your extensions list

---

## 🧑‍💻 How to Use

1. Go to any webpage
2. **Highlight** any text (a person's name, company, place, topic, etc.)
3. **Right-click** the highlighted text
4. Choose one of the two options:
   - `📄 Summarize This` — Opens a Wikipedia summary
   - `🔍 Search Negative News` — Shows recent negative news articles
5. Use the toggle button in the results page to switch between views

---

## 🗂️ Project Structure

```
smart-right-click-extension/
├── background.js       # Service worker — context menu logic & API key
├── results.html        # Results page UI
├── results.js          # Fetching, rendering & entity detection logic
├── styles.css          # Styling for the results page
├── manifest.json       # Chrome extension manifest (v3)
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

---

## ⚙️ Tech Stack

- **Chrome Extension Manifest V3**
- **Wikipedia REST API** — free, no key required
- **GNews API** — free tier (100 requests/day), key required

---

## ⚠️ Important Notes

- The **GNews API key is personal** — do not share it publicly or commit it to a public repository.
- The free GNews tier allows **100 requests per day**. If you exceed this, news results will temporarily stop working until the quota resets.
- Wikipedia summaries are completely free and have no request limits.

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
