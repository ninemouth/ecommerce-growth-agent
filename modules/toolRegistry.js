// modules/toolRegistry.js — Tool registry and content script bridge

async function getCurrentTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

function checkTabUrl(url) {
  if (!url) return;
  const lowerUrl = url.toLowerCase();
  const restrictedPrefixes = [
    "chrome://",
    "chrome-extension://",
    "devtools://",
    "view-source:",
    "about:",
    "chrome.google.com/webstore",
    "chromewebstore.google.com"
  ];
  for (const prefix of restrictedPrefixes) {
    if (lowerUrl.includes(prefix) || lowerUrl.startsWith(prefix)) {
      throw new Error("当前网页受 Chrome 安全策略限制，无法在此类系统页面上运行。请切换到常规电商网页再试。");
    }
  }
}

async function sendToContentScript(tabId, message) {
  try {
    const tab = await chrome.tabs.get(tabId);
    checkTabUrl(tab?.url);
  } catch (err) {
    throw err;
  }

  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ["content.js"],
    });
  } catch (err) {
    if (err.message && (err.message.includes("Cannot access") || err.message.includes("restricted"))) {
      throw new Error("由于安全策略，当前网页无法注入脚本。请切换到普通电商网页再试。");
    }
    // Already injected or other minor issues, ignore
  }

  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(tabId, message, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve(response);
      }
    });
  });
}

export const tools = {
  read_current_page: async () => {
    const tab = await getCurrentTab();
    if (!tab) throw new Error("No active tab found");
    const result = await sendToContentScript(tab.id, { type: "READ_CURRENT_PAGE" });
    if (!result?.ok) throw new Error(result?.error || "Failed to read page");
    return result.data;
  },

  extract_product_info: async () => {
    const tab = await getCurrentTab();
    if (!tab) throw new Error("No active tab found");
    const result = await sendToContentScript(tab.id, { type: "EXTRACT_PRODUCT_INFO" });
    if (!result?.ok) throw new Error(result?.error || "Failed to extract product");
    return result.data;
  },

  get_selected_text: async () => {
    const tab = await getCurrentTab();
    if (!tab) throw new Error("No active tab found");
    const result = await sendToContentScript(tab.id, { type: "GET_SELECTED_TEXT" });
    if (!result?.ok) throw new Error(result?.error || "Failed to get selection");
    return result.data;
  },

  analyze_keywords: async (args) => {
    const { text = "", context = "" } = args;
    return {
      input_text: text,
      context,
      note: "LLM should analyze and extract keywords from the provided text and page context.",
    };
  },

  save_result: async (args) => {
    const existing = await new Promise((resolve) =>
      chrome.storage.local.get(["savedResults"], resolve)
    );
    const savedResults = existing.savedResults || [];
    const entry = {
      id: Date.now(),
      createdAt: new Date().toISOString(),
      ...args,
    };
    savedResults.unshift(entry);
    await new Promise((resolve) =>
      chrome.storage.local.set({ savedResults: savedResults.slice(0, 100) }, resolve)
    );
    return { ok: true, id: entry.id, message: "Result saved to library." };
  },

  get_saved_results: async (args) => {
    const { limit = 10 } = args || {};
    const existing = await new Promise((resolve) =>
      chrome.storage.local.get(["savedResults"], resolve)
    );
    return (existing.savedResults || []).slice(0, limit);
  },

  click_by_text: async (args) => {
    const { text } = args;
    if (!text) throw new Error("text is required");
    const tab = await getCurrentTab();
    if (!tab) throw new Error("No active tab found");
    const result = await sendToContentScript(tab.id, { type: "CLICK_BY_TEXT", text });
    if (result.ok) {
      await new Promise(r => setTimeout(r, 2500));
    }
    return result;
  },

  open_url: async (args) => {
    const { url } = args;
    if (!url) throw new Error("url is required");
    await chrome.tabs.create({ url, active: false });
    return { ok: true, message: `Opened: ${url}` };
  },

  navigate_to: async (args) => {
    const { url } = args;
    if (!url) throw new Error("url is required");
    const tab = await getCurrentTab();
    if (!tab) throw new Error("No active tab found");
    
    return new Promise((resolve) => {
      chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
        if (tabId === tab.id && info.status === "complete") {
          chrome.tabs.onUpdated.removeListener(listener);
          setTimeout(() => resolve({ ok: true, message: `Navigated to and loaded: ${url}` }), 2000);
        }
      });
      chrome.tabs.update(tab.id, { url });
    });
  },

  search_web: async (args) => {
    const { query, engine = "google" } = args;
    if (!query) throw new Error("query is required");
    const engines = {
      google: `https://www.google.com/search?q=${encodeURIComponent(query)}`,
      bing: `https://www.bing.com/search?q=${encodeURIComponent(query)}`,
      amazon: `https://www.amazon.com/s?k=${encodeURIComponent(query)}`,
      etsy: `https://www.etsy.com/search?q=${encodeURIComponent(query)}`,
      taobao: `https://s.taobao.com/search?q=${encodeURIComponent(query)}`,
    };
    const searchUrl = engines[engine] || engines.google;
    const tab = await getCurrentTab();
    if (!tab) throw new Error("No active tab found");
    
    return new Promise((resolve) => {
      chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
        if (tabId === tab.id && info.status === "complete") {
          chrome.tabs.onUpdated.removeListener(listener);
          setTimeout(() => resolve({ ok: true, searchUrl }), 2000);
        }
      });
      chrome.tabs.update(tab.id, { url: searchUrl });
    });
  },
};
