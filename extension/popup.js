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
  document.getElementById('water-saved').textContent = `${waterStats.waterSavedMl} mL`;

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

  // Open dashboard
  document.getElementById('open-dashboard').addEventListener('click', () => {
    // Open the dashboard Next.js app (or as extension page if bundled)
    // For development: open localhost:3000
    // For production: open the extension's dashboard page
    chrome.tabs.create({ url: 'http://localhost:3000' });
  });
});
