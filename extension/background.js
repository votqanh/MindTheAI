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
            google: true,
          },
          preferredBrowser: { type: 'google' },
          autoOpenDashboard: false,
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
  if (msg.type === 'FETCH_1PASSWORD_SERVICE_ACCOUNT') {
    fetch('http://localhost:3001/api/1password/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(msg.payload),
    })
      .then((res) => res.json())
      .then((data) => sendResponse({ success: true, data }))
      .catch((err) => sendResponse({ success: false, error: err.message }));
    return true; // async response
  }
  if (msg.type === 'FETCH_1PASSWORD_CONNECT') {
    const { connectUrl, accessToken, vaultId } = msg.payload;
    const base = connectUrl.replace(/\/$/, '');
    
    fetch(`${base}/v1/vaults/${vaultId}/items`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    })
      .then((res) => res.json())
      .then(async (items) => {
        if (!Array.isArray(items)) {
          sendResponse({ success: false, error: 'Invalid response' });
          return;
        }
        const creds = [];
        for (const item of items) {
          if (!item.id) continue;
          try {
            const detailRes = await fetch(`${base}/v1/vaults/${vaultId}/items/${item.id}`, {
              headers: { Authorization: `Bearer ${accessToken}` }
            });
            if (detailRes.ok) {
              const data = await detailRes.json();
              for (const field of data.fields || []) {
                if (field.value && field.value.length >= 6) {
                  creds.push({ name: item.title || 'Vault item', value: field.value });
                }
              }
            }
          } catch (e) { /* skip */ }
        }
        sendResponse({ success: true, data: creds });
      })
      .catch((err) => sendResponse({ success: false, error: err.message }));
    return true; // async response
  }
});

// Handle New Tab redirect
chrome.tabs.onCreated.addListener((tab) => {
  if (tab.pendingUrl === 'chrome://newtab/' || tab.url === 'chrome://newtab/') {
    chrome.storage.local.get('settings', (result) => {
      if (result.settings?.autoOpenDashboard) {
        chrome.tabs.update(tab.id, { url: 'http://localhost:3001' });
      }
    });
  }
});

// Also handle when a tab is updated to the newtab URL (e.g. typing it manually)
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.url === 'chrome://newtab/') {
    chrome.storage.local.get('settings', (result) => {
      if (result.settings?.autoOpenDashboard) {
        chrome.tabs.update(tabId, { url: 'http://localhost:3001' });
      }
    });
  }
});
