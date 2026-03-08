/**
 * dashboard-bridge.js
 * Injected into localhost:3001 to bridge storage read/writes 
 * from the Next.js dashboard to the Chrome Extension's local storage.
 */

window.addEventListener('message', (event) => {
  if (event.source !== window) return;

  if (event.data.type === 'MINDTHEAI_GET_STATS') {
    if (window.MindTheAI_Storage) {
      window.MindTheAI_Storage.getStats().then((result) => {
        window.postMessage({ type: 'MINDTHEAI_STATS_RESULT', result, id: event.data.id }, '*');
      });
    } else {
      chrome.storage.local.get(['waterStats', 'privacyStats', 'settings'], (result) => {
        window.postMessage({ type: 'MINDTHEAI_STATS_RESULT', result, id: event.data.id }, '*');
      });
    }
  }

  if (event.data.type === 'MINDTHEAI_SAVE_SETTINGS') {
    // Keep existing settings and merge to avoid wiping anything accidentally
    chrome.storage.local.get('settings', (result) => {
      const updatedSettings = { ...result.settings, ...event.data.settings };
      chrome.storage.local.set({ settings: updatedSettings }, () => {
        window.postMessage({ type: 'MINDTHEAI_SAVE_RESULT', success: true, id: event.data.id }, '*');
        chrome.runtime.sendMessage({ type: 'SETTINGS_UPDATED' });
      });
    });
  }
});
