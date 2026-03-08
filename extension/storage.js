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
  dailyHistory: [], // [{date: 'YYYY-MM-DD', saved: 0, prompts: 0}]
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
  hideAIOverview: false,
  pleasantryCheckEnabled: true,
};

async function getStats() {
  return new Promise((resolve) => {
    chrome.storage.local.get(
      [StorageKeys.WATER_STATS, StorageKeys.PRIVACY_STATS, StorageKeys.SETTINGS],
      (result) => {
        let waterStats = result[StorageKeys.WATER_STATS] || { ...DEFAULT_WATER_STATS };
        
        // Seed historical data if incomplete for a better first-time experience
        // We do 7 days back, skipping today, so today starts at 0 for demo purposes
        if (!waterStats.dailyHistory || waterStats.dailyHistory.length < 7) {
          const history = waterStats.dailyHistory || [];
          const now = new Date();
          
          // Seed last 7 days (i=1 to 7)
          for (let i = 7; i >= 1; i--) {
            const d = new Date(now);
            d.setDate(now.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            
            // Only add if not already present
            if (!history.find(h => h.date === dateStr)) {
              const saved = Math.floor(Math.random() * 400) + 150; // 150-550 mL
              const prompts = Math.floor(Math.random() * 8) + 3;  // 3-11 prompts
              history.push({ date: dateStr, saved, prompts });
            }
          }
          
          // Sort after filling
          history.sort((a, b) => a.date.localeCompare(b.date));
          waterStats.dailyHistory = history;

          // Note: We skip adding seeded totals to waterSavedMl/waterUsedMl 
          // to allow the user to demo the number going up from 0 today.
          
          chrome.storage.local.set({ [StorageKeys.WATER_STATS]: waterStats });
        }

        resolve({
          waterStats: waterStats,
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

  // Update daily history
  const today = new Date().toISOString().split('T')[0];
  if (!stats.dailyHistory) stats.dailyHistory = [];
  let dayEntry = stats.dailyHistory.find(d => d.date === today);
  if (!dayEntry) {
    dayEntry = { date: today, saved: 0, prompts: 0 };
    stats.dailyHistory.push(dayEntry);
  }
  if (used) dayEntry.prompts += 1;
  if (saved) dayEntry.saved += 39;

  // Keep only last 30 days
  if (stats.dailyHistory.length > 30) {
    stats.dailyHistory = stats.dailyHistory.slice(-30);
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
