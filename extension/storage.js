/**
 * storage.js — MindTheAI
 * Wrapper around chrome.storage.local for water and privacy stats.
 */

const StorageKeys = {
  WATER_STATS: 'waterStats',
  PRIVACY_STATS: 'privacyStats',
  SETTINGS: 'settings',
};

const DEFAULT_WATER_STATS = {
  aiPromptsCount: 0,
  googleRedirects: 0,
  waterUsedMl: 0,
  waterSavedMl: 0,
};

const DEFAULT_PRIVACY_STATS = {
  detected: [], // [{type, timestamp, removed}]
};

const DEFAULT_SETTINGS = {
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
  preferredBrowser: { type: 'google' },
  autoOpenDashboard: false,
};

async function getStats() {
  return new Promise((resolve) => {
    chrome.storage.local.get(
      [StorageKeys.WATER_STATS, StorageKeys.PRIVACY_STATS, StorageKeys.SETTINGS],
      (result) => {
        resolve({
          waterStats: result[StorageKeys.WATER_STATS] || DEFAULT_WATER_STATS,
          privacyStats: result[StorageKeys.PRIVACY_STATS] || DEFAULT_PRIVACY_STATS,
          settings: {
            ...DEFAULT_SETTINGS,
            ...(result[StorageKeys.SETTINGS] || {}),
            preferredBrowser: (result[StorageKeys.SETTINGS] || {}).preferredBrowser || DEFAULT_SETTINGS.preferredBrowser
          },
        });
      }
    );
  });
}

async function getSettings() {
  return new Promise((resolve) => {
    chrome.storage.local.get(StorageKeys.SETTINGS, (result) => {
      const s = result[StorageKeys.SETTINGS] || {};
      resolve({
        ...DEFAULT_SETTINGS,
        ...s,
        preferredBrowser: s.preferredBrowser || DEFAULT_SETTINGS.preferredBrowser
      });
    });
  });
}

async function saveSettings(settings) {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [StorageKeys.SETTINGS]: settings }, resolve);
  });
}

async function incrementWater({ used = false, saved = false } = {}) {
  const stats = await new Promise((resolve) => {
    chrome.storage.local.get(StorageKeys.WATER_STATS, (result) => {
      resolve(result[StorageKeys.WATER_STATS] || { ...DEFAULT_WATER_STATS });
    });
  });
  if (used) {
    stats.aiPromptsCount += 1;
    stats.waterUsedMl += 39;
  }
  if (saved) {
    stats.googleRedirects += 1;
    stats.waterSavedMl += 39;
  }
  chrome.storage.local.set({ [StorageKeys.WATER_STATS]: stats });
}

async function recordPrivacy({ type, removed }) {
  return new Promise((resolve) => {
    chrome.storage.local.get(StorageKeys.PRIVACY_STATS, (result) => {
      const stats = result[StorageKeys.PRIVACY_STATS] || { ...DEFAULT_PRIVACY_STATS };
      stats.detected.push({ type, removed, timestamp: Date.now() });
      chrome.storage.local.set({ [StorageKeys.PRIVACY_STATS]: stats }, resolve);
    });
  });
}

async function clearStats() {
  return new Promise((resolve) => {
    chrome.storage.local.set(
      {
        [StorageKeys.WATER_STATS]: { ...DEFAULT_WATER_STATS },
        [StorageKeys.PRIVACY_STATS]: { ...DEFAULT_PRIVACY_STATS },
      },
      resolve
    );
  });
}

// Export for use in other scripts (since content scripts share scope)
window.MindTheAI_Storage = {
  getStats,
  getSettings,
  saveSettings,
  incrementWater,
  recordPrivacy,
  clearStats,
  DEFAULT_SETTINGS,
};
