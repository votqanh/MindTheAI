/**
 * content.js — MindTheAI
 * Orchestrates feature injection: finds prompt inputs and runs water + privacy checks.
 */

(function () {
  'use strict';

  // Site-specific selectors for prompt input elements
  const SITE_SELECTORS = [
    // ChatGPT
    '#prompt-textarea',
    // Gemini
    '.ql-editor[contenteditable="true"]',
    'rich-textarea .ql-editor',
    // Claude
    '[contenteditable="true"][data-placeholder]',
    'div[contenteditable="true"].ProseMirror',
    // Grok
    'textarea[data-testid="tweetTextarea_0"]',
    'div[contenteditable="true"][aria-label*="Ask"]',
    // Copilot
    '#userInput',
    'textarea[name="q"]',
    // Perplexity
    'textarea[placeholder*="Ask"]',
    'textarea[placeholder*="Follow"]',
    // Generic fallback
    'textarea[name="prompt"]',
    'textarea[id*="prompt"]',
    'div[contenteditable="true"][role="textbox"]',
  ];

  let activeInputs = new Set();
  let settings = null;

  function getSiteKey() {
    const host = location.hostname;
    if (host.includes('chatgpt') || host.includes('openai')) return 'chatgpt';
    if (host.includes('gemini')) return 'gemini';
    if (host.includes('claude')) return 'claude';
    if (host.includes('grok') || (host.includes('x.com') && location.pathname.includes('grok'))) return 'grok';
    if (host.includes('copilot')) return 'copilot';
    if (host.includes('perplexity')) return 'perplexity';
    return 'other';
  }

  async function loadSettings() {
    settings = await window.MindTheAI_Storage.getSettings();
  }

  function isSiteEnabled() {
    if (!settings) return true;
    const key = getSiteKey();
    return settings.sites?.[key] !== false;
  }

  function isWaterEnabled() {
    return settings?.waterCheckEnabled !== false;
  }

  function isPrivacyEnabled() {
    return settings?.privacyCheckEnabled !== false;
  }

  // Debounce helper
  function debounce(fn, delay) {
    let timer;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), delay);
    };
  }

  function attachToInput(inputEl) {
    if (activeInputs.has(inputEl)) return;
    activeInputs.add(inputEl);

    const debouncedPrivacy = debounce((el) => {
      if (isSiteEnabled() && isPrivacyEnabled()) {
        window.MindTheAI_Privacy.handlePrivacyCheck(el);
      }
    }, 400);

    const handleInput = (e) => {
      if (!isSiteEnabled()) return;
      if (isWaterEnabled()) {
        window.MindTheAI_Water.handleInput(inputEl);
      }
      debouncedPrivacy(inputEl);
    };

    inputEl.addEventListener('input', handleInput);
    inputEl.addEventListener('keyup', handleInput);

    // Handle position changes (scrolling etc.) - reposition privacy overlays
    const handleScroll = debounce(() => {
      if (isSiteEnabled() && isPrivacyEnabled()) {
        window.MindTheAI_Privacy.clearOverlays(inputEl);
      }
    }, 200);

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });

    // Reset water popup per new prompt (when input is cleared after submission)
    const observer = new MutationObserver(() => {
      const text = inputEl.tagName === 'TEXTAREA' ? inputEl.value : inputEl.textContent;
      if (!text || !text.trim()) {
        window.MindTheAI_Water.resetSession && window.MindTheAI_Water.resetSession();
        window.MindTheAI_Privacy.clearOverlays(inputEl);
      }
    });
    observer.observe(inputEl, { characterData: true, childList: true, subtree: true });
  }

  function scanForInputs() {
    for (const selector of SITE_SELECTORS) {
      try {
        const els = document.querySelectorAll(selector);
        els.forEach(attachToInput);
      } catch (e) {
        // Ignore invalid selectors
      }
    }
  }

  async function init() {
    await loadSettings();

    if (!isSiteEnabled()) return;

    // Initial scan
    scanForInputs();

    // Watch for dynamically added inputs (SPAs)
    const observer = new MutationObserver(debounce(scanForInputs, 500));
    observer.observe(document.body, { childList: true, subtree: true });

    // Listen for settings changes from popup
    chrome.runtime.onMessage.addListener((msg) => {
      if (msg.type === 'SETTINGS_UPDATED') {
        loadSettings();
      }
    });
  }

  // Wait for page to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
