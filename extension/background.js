/**
 * background.js — MindTheAI Service Worker
 */

chrome.runtime.onInstalled.addListener(() => {
  console.log('[MindTheAI] Extension installed/updated.');
  // Initialize default settings if not set
  chrome.storage.local.get('settings', (result) => {
    if (!result.settings) {
      chrome.storage.local.set({
        settings: {
          waterCheckEnabled: true,
          privacyCheckEnabled: true,
          monthlyGoalMl: 5000,
          sites: {
            chatgpt: true,
            gemini: true,
            claude: true,
            grok: true,
            copilot: true,
            perplexity: true,
          },
        },
      });
    }
  });
});

// Relay messages between popup and content scripts
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'SETTINGS_UPDATED') {
    // Broadcast to all AI site tabs
    chrome.tabs.query({}, (tabs) => {
      const aiHosts = ['chatgpt.com', 'chat.openai.com', 'gemini.google.com', 'claude.ai', 'grok.com', 'x.com', 'copilot.microsoft.com', 'perplexity.ai'];
      tabs.forEach((tab) => {
        if (tab.url && aiHosts.some((h) => tab.url.includes(h))) {
          chrome.tabs.sendMessage(tab.id, { type: 'SETTINGS_UPDATED' }).catch(() => {});
        }
      });
    });
  }
  if (msg.type === 'GET_STATS') {
    chrome.storage.local.get(['waterStats', 'privacyStats', 'settings'], (result) => {
      sendResponse(result);
    });
    return true; // async
  }
});
