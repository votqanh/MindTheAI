/**
 * popup.js — MindTheAI browser action popup
 */

async function loadStats() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['waterStats', 'privacyStats', 'settings'], (result) => {
      resolve({
        waterStats: result.waterStats || { waterSavedMl: 0, waterUsedMl: 0, googleRedirects: 0, aiPromptsCount: 0 },
        privacyStats: result.privacyStats || { detected: [] },
        settings: result.settings || {},
      });
    });
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  const { waterStats, privacyStats } = await loadStats();

  // Water saved
  document.getElementById('water-saved').textContent = window.MindTheAI_Format.formatWater(waterStats.waterSavedMl);

  // Privacy count (removed items only)
  const protectedCount = (privacyStats.detected || []).filter((d) => d.removed).length;
  document.getElementById('privacy-count').textContent = protectedCount;

  // Current site name
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab?.url) {
    try {
      const host = new URL(tab.url).hostname.replace('www.', '');
      document.getElementById('site-name').textContent = host;
    } catch {}
  }

  // Auto-open toggle initialization
  const { settings } = await loadStats();
  const autoOpenCheck = document.getElementById('auto-open-toggle');
  if (autoOpenCheck) {
    autoOpenCheck.checked = !!settings.autoOpenDashboard;
    autoOpenCheck.addEventListener('change', (e) => {
      chrome.storage.local.get('settings', (result) => {
        const updatedSettings = { ...result.settings, autoOpenDashboard: e.target.checked };
        chrome.storage.local.set({ settings: updatedSettings }, () => {
          chrome.runtime.sendMessage({ type: 'SETTINGS_UPDATED' });
        });
      });
    });
  }

  // Open dashboard
  document.getElementById('open-dashboard').addEventListener('click', () => {
    chrome.tabs.create({ url: 'http://localhost:3001' });
  });
});
