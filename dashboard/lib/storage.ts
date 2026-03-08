/**
 * lib/storage.ts (v2)
 * Reads/writes MindTheAI stats from chrome.storage.local.
 * Now includes 1Password Connect settings.
 */

export interface WaterStats {
  aiPromptsCount: number;
  googleRedirects: number;
  waterUsedMl: number;
  waterSavedMl: number;
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
}

export interface AllStats {
  waterStats: WaterStats;
  privacyStats: PrivacyStats;
  settings: Settings;
}

const DEFAULT_SETTINGS: Settings = {
  waterCheckEnabled: true,
  privacyCheckEnabled: true,
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
};

const MOCK_DATA: AllStats = {
  waterStats: {
    aiPromptsCount: 47,
    googleRedirects: 23,
    waterUsedMl: 47 * 39,
    waterSavedMl: 23 * 39,
  },
  privacyStats: {
    detected: [
      { type: 'phone', timestamp: Date.now() - 86400000, removed: true },
      { type: 'email', timestamp: Date.now() - 72000000, removed: true },
      { type: 'apikey', timestamp: Date.now() - 50000000, removed: false },
      { type: 'phone', timestamp: Date.now() - 36000000, removed: true },
      { type: 'address', timestamp: Date.now() - 20000000, removed: true },
      { type: 'apikey', timestamp: Date.now() - 10000000, removed: true },
    ],
  },
  settings: DEFAULT_SETTINGS,
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
          const s = result.settings || {};
          resolve({
            waterStats: result.waterStats || { aiPromptsCount: 0, googleRedirects: 0, waterUsedMl: 0, waterSavedMl: 0 },
            privacyStats: result.privacyStats || { detected: [] },
            settings: { 
              ...DEFAULT_SETTINGS, 
              ...s,
              preferredBrowser: s.preferredBrowser || DEFAULT_SETTINGS.preferredBrowser
            },
          });
        }
      );
    });
  }
  
  // Bridge usage (localhost dev with extension loaded)
  const extData = await sendToExtension('MINDTHEAI_GET_STATS');
  if (extData && extData.result) {
    const s = extData.result.settings || {};
    return {
      waterStats: extData.result.waterStats || { aiPromptsCount: 0, googleRedirects: 0, waterUsedMl: 0, waterSavedMl: 0 },
      privacyStats: extData.result.privacyStats || { detected: [] },
      settings: { 
        ...DEFAULT_SETTINGS, 
        ...s,
        preferredBrowser: s.preferredBrowser || DEFAULT_SETTINGS.preferredBrowser
      },
    };
  }

  // Fallback to localStorage for web-only mode
  if (typeof window !== 'undefined') {
    try {
      const waterStats = JSON.parse(localStorage.getItem('mindtheai_water_stats') || 'null');
      const privacyStats = JSON.parse(localStorage.getItem('mindtheai_privacy_stats') || 'null');
      const settings = JSON.parse(localStorage.getItem('mindtheai_settings') || 'null');

      return {
        waterStats: waterStats || MOCK_DATA.waterStats,
        privacyStats: privacyStats || MOCK_DATA.privacyStats,
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

  return Promise.resolve(MOCK_DATA);
}

export async function saveSettings(settings: Settings): Promise<void> {
  if (isChromeAvailable()) {
    return new Promise((resolve) => {
      (window as any).chrome.storage.local.set({ settings }, resolve);
    });
  }

  // Bridge push
  const extData = await sendToExtension('MINDTHEAI_SAVE_SETTINGS', { settings });
  // We no longer `return` here, so that we also mirror to localStorage
  // This avoids confusing devs examining localStorage on localhost.
  
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('mindtheai_settings', JSON.stringify(settings));
    } catch (e) {
      console.error('[MindTheAI] Failed to save to localStorage', e);
    }
  }
}

export function getDefaultSettings(): Settings {
  return { ...DEFAULT_SETTINGS };
}
