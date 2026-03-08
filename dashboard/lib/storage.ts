/**
 * lib/storage.ts (v2)
 * Reads/writes MindTheAI stats from chrome.storage.local.
 * Now includes 1Password Connect settings.
 */

export interface DailyHistory {
  date: string; // ISO string YYYY-MM-DD
  saved: number;
  prompts: number;
}

export interface WaterStats {
  aiPromptsCount: number;
  googleRedirects: number;
  waterUsedMl: number;
  waterSavedMl: number;
  dailyHistory: DailyHistory[];
}

export interface PrivacyEntry {
  type: 'phone' | 'email' | 'apikey' | 'address';
  timestamp: number;
  removed: boolean;
}

export interface PrivacyStats {
  detected: PrivacyEntry[];
}

export interface SiteSettings {
  chatgpt: boolean;
  gemini: boolean;
  claude: boolean;
  grok: boolean;
  copilot: boolean;
  perplexity: boolean;
}

export interface OnePasswordSettings {
  enabled: boolean;
  authMode: 'connect' | 'service-account';
  connectUrl?: string;   // Optional for service-account mode
  accessToken?: string;  // For Connect server
  serviceAccountToken?: string; // For direct SDK usage
  vaultId: string;
}

export interface Settings {
  waterCheckEnabled: boolean;
  privacyCheckEnabled: boolean;
  monthlyGoalMl: number;
  sites: SiteSettings;
  onePassword: OnePasswordSettings;
  preferredBrowser: {
    type: 'google' | 'ecosia' | 'other';
    customUrl?: string;
  };
  autoOpenDashboard: boolean;
  hideAIOverview: boolean;
  pleasantryCheckEnabled: boolean;
  theme: 'light' | 'dark';
}

export interface AllStats {
  waterStats: WaterStats;
  privacyStats: PrivacyStats;
  settings: Settings;
}

const DEFAULT_SETTINGS: Settings = {
  waterCheckEnabled: true,
  privacyCheckEnabled: true,
  pleasantryCheckEnabled: true,
  monthlyGoalMl: 5000,
  sites: {
    chatgpt: true,
    gemini: true,
    claude: true,
    grok: false,
    copilot: true,
    perplexity: true,
  },
  onePassword: {
    enabled: false,
    authMode: 'connect',
    connectUrl: '',
    accessToken: '',
    serviceAccountToken: '',
    vaultId: '',
  },
  preferredBrowser: {
    type: 'google',
  },
  autoOpenDashboard: false,
  hideAIOverview: false,
  theme: 'dark',
};

let messageCallbacks: Record<string, Function> = {};

if (typeof window !== 'undefined') {
  window.addEventListener('message', (event) => {
    if (event.source !== window) return;
    if (event.data.type === 'MINDTHEAI_STATS_RESULT' || event.data.type === 'MINDTHEAI_SAVE_RESULT') {
      const cb = messageCallbacks[event.data.id];
      if (cb) {
        cb(event.data);
        delete messageCallbacks[event.data.id];
      }
    }
  });
}

function sendToExtension(type: string, payload: any = {}): Promise<any> {
  if (typeof window === 'undefined') return Promise.resolve(null);
  return new Promise((resolve) => {
    const id = Math.random().toString(36).substr(2, 9);
    messageCallbacks[id] = resolve;
    window.postMessage({ type, id, ...payload }, '*');
    
    // Timeout in case extension isn't running / bridge isn't active
    setTimeout(() => {
      if (messageCallbacks[id]) {
        resolve(null);
        delete messageCallbacks[id];
      }
    }, 500); 
  });
}

function isChromeAvailable(): boolean {
  return typeof window !== 'undefined' &&
    typeof (window as any).chrome !== 'undefined' &&
    typeof (window as any).chrome.storage !== 'undefined';
}

export async function getAllStats(): Promise<AllStats> {
  if (isChromeAvailable()) {
    return new Promise((resolve) => {
      (window as any).chrome.storage.local.get(
        ['waterStats', 'privacyStats', 'settings'],
        (result: any) => {
          const s = result.settings;
          const water = result.waterStats;
          const privacy = result.privacyStats;

          // Mirror to localStorage ONLY if data is "significant"
          try {
            const isSignificant = (water && (water.dailyHistory?.length > 0 || water.waterUsedMl > 0 || water.waterSavedMl > 0));
            if (isSignificant) {
              if (water) localStorage.setItem('mindtheai_water_stats', JSON.stringify(water));
              if (privacy) localStorage.setItem('mindtheai_privacy_stats', JSON.stringify(privacy));
            }
            if (s) localStorage.setItem('mindtheai_settings', JSON.stringify(s));
          } catch (e) {}

          const settings = { 
            ...DEFAULT_SETTINGS, 
            ...(s || {}),
            preferredBrowser: (s || {}).preferredBrowser || DEFAULT_SETTINGS.preferredBrowser
          };

          resolve({
            waterStats: water || { aiPromptsCount: 0, googleRedirects: 0, waterUsedMl: 0, waterSavedMl: 0, dailyHistory: [] },
            privacyStats: privacy || { detected: [] },
            settings,
          });
        }
      );
    });
  }
  
  // Bridge usage (localhost dev with extension loaded)
  const extData = await sendToExtension('MINDTHEAI_GET_STATS');
  if (extData && extData.result) {
    const s = extData.result.settings;
    const water = extData.result.waterStats;
    const privacy = extData.result.privacyStats;

    // Mirror to localStorage for consistent web fallback (especially for refreshes)
    if (typeof window !== 'undefined') {
      try {
        // Safeguard: Only mirror if data is "significant" to avoid wiping cache with empty results
        const isSignificant = (water && (water.dailyHistory?.length > 0 || water.waterUsedMl > 0 || water.waterSavedMl > 0));
        
        if (isSignificant) {
          if (water) localStorage.setItem('mindtheai_water_stats', JSON.stringify(water));
          if (privacy) localStorage.setItem('mindtheai_privacy_stats', JSON.stringify(privacy));
          if (s) localStorage.setItem('mindtheai_settings', JSON.stringify(s));
        } else {
          // If bridge data is NOT significant, try to load from localStorage as fallback
          const cachedWater = JSON.parse(localStorage.getItem('mindtheai_water_stats') || 'null');
          const cachedPrivacy = JSON.parse(localStorage.getItem('mindtheai_privacy_stats') || 'null');
          if (cachedWater) {
            return {
              waterStats: cachedWater,
              privacyStats: cachedPrivacy || { detected: [] },
              settings: { 
                ...DEFAULT_SETTINGS, 
                ...(s || {}),
                preferredBrowser: (s || {}).preferredBrowser || DEFAULT_SETTINGS.preferredBrowser
              }
            };
          }
        }
      } catch (e) {}
    }

    const settings = { 
      ...DEFAULT_SETTINGS, 
      ...(s || {}),
      preferredBrowser: (s || {}).preferredBrowser || DEFAULT_SETTINGS.preferredBrowser
    };

    return {
      waterStats: water || { aiPromptsCount: 0, googleRedirects: 0, waterUsedMl: 0, waterSavedMl: 0, dailyHistory: [] },
      privacyStats: privacy || { detected: [] },
      settings,
    };
  }

  // Fallback to localStorage for web-only mode
  if (typeof window !== 'undefined') {
    try {
      const waterStats = JSON.parse(localStorage.getItem('mindtheai_water_stats') || 'null');
      const privacyStats = JSON.parse(localStorage.getItem('mindtheai_privacy_stats') || 'null');
      const settings = JSON.parse(localStorage.getItem('mindtheai_settings') || 'null');

      return {
        waterStats: waterStats || { aiPromptsCount: 0, googleRedirects: 0, waterUsedMl: 0, waterSavedMl: 0 },
        privacyStats: privacyStats || { detected: [] },
        settings: { 
          ...DEFAULT_SETTINGS, 
          ...(settings || {}),
          preferredBrowser: settings?.preferredBrowser || DEFAULT_SETTINGS.preferredBrowser
        },
      };
    } catch (e) {
      console.error('[MindTheAI] Failed to load from localStorage', e);
    }
  }

  return Promise.resolve({
    waterStats: { aiPromptsCount: 0, googleRedirects: 0, waterUsedMl: 0, waterSavedMl: 0, dailyHistory: [] },
    privacyStats: { detected: [] },
    settings: DEFAULT_SETTINGS,
  });
}

export async function saveSettings(settings: Settings): Promise<void> {
  if (isChromeAvailable()) {
    return new Promise((resolve) => {
      (window as any).chrome.storage.local.set({ settings }, () => {
        try {
          localStorage.setItem('mindtheai_settings', JSON.stringify(settings));
        } catch (e) {}
        resolve();
      });
    });
  }

  // Bridge push
  await sendToExtension('MINDTHEAI_SAVE_SETTINGS', { settings });
  
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('mindtheai_settings', JSON.stringify(settings));
    } catch (e) {
      console.error('[MindTheAI] Failed to save to localStorage', e);
    }
  }
}

export async function saveAllStats(stats: AllStats): Promise<void> {
  if (isChromeAvailable()) {
    return new Promise((resolve) => {
      (window as any).chrome.storage.local.set({
        waterStats: stats.waterStats,
        privacyStats: stats.privacyStats,
        settings: stats.settings,
      }, resolve);
    });
  }

  // Bridge push (Bulk save isn't natively supported by the bridge yet, but we can do it via settings/stats individually if needed, 
  // or just mirror to localStorage. For now, since the bridge handles the main extension storage, we'll try to push settings at least.)
  await sendToExtension('MINDTHEAI_SAVE_SETTINGS', { settings: stats.settings });
  // Note: Extension-side stats aren't easily "pushed" via the bridge for now, but usually dashboard is the source of truth for imports.

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('mindtheai_water_stats', JSON.stringify(stats.waterStats));
      localStorage.setItem('mindtheai_privacy_stats', JSON.stringify(stats.privacyStats));
      localStorage.setItem('mindtheai_settings', JSON.stringify(stats.settings));
    } catch (e) {
      console.error('[MindTheAI] Failed to save to localStorage', e);
    }
  }
}

export function getDefaultSettings(): Settings {
  return { ...DEFAULT_SETTINGS };
}
