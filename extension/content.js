/**
 * content.js — MindTheAI
 * Orchestrates feature injection: finds prompt inputs and runs water + privacy checks.
 */

(function () {
  'use strict';

  // 1. Nuclear Isolation: Does this script even belong here?
  const host = location.hostname;
  const path = location.pathname;
  
  const isAIPlatform = (
    host.includes('chatgpt.com') || 
    host.includes('openai.com') || 
    host === 'gemini.google.com' || 
    host.includes('claude.ai') || 
    host.includes('grok.com') || 
    (host === 'x.com' && path.includes('grok')) || 
    host === 'copilot.microsoft.com' || 
    host.includes('perplexity.ai')
  );
  
  const isGoogleSearch = (host.includes('google.com') && path.includes('/search'));

  if (!isAIPlatform && !isGoogleSearch) return;

  // Site-specific selectors for prompt input elements
  const SITE_SELECTORS = [
    '#prompt-textarea',
    '.ql-editor[contenteditable="true"]',
    'rich-textarea .ql-editor',
    '[contenteditable="true"][data-placeholder]',
    'div[contenteditable="true"].ProseMirror',
    'textarea[data-testid="tweetTextarea_0"]',
    'div[contenteditable="true"][aria-label*="Ask"]',
    '#userInput',
    'textarea[name="q"]',
    'textarea[placeholder*="Ask"]',
    'textarea[placeholder*="Follow"]',
    'textarea[name="prompt"]',
    'textarea[id*="prompt"]',
    'div[contenteditable="true"][role="textbox"]',
  ];

  let activeInputs = new Set();
  let settings = null;

  function getSiteKey() {
    if (host.includes('chatgpt.com') || host.includes('openai.com')) return 'chatgpt';
    if (host === 'gemini.google.com') return 'gemini';
    if (host.includes('claude.ai')) return 'claude';
    if (host.includes('grok.com') || (host === 'x.com' && path.includes('grok'))) return 'grok';
    if (host === 'copilot.microsoft.com') return 'copilot';
    if (host.includes('perplexity.ai')) return 'perplexity';
    return 'other';
  }

  async function loadSettings() {
    settings = await window.MindTheAI_Storage.getSettings();
  }

  function isSiteEnabled() {
    if (!settings) return true;
    const key = getSiteKey();
    if (key === 'other') return true; // Default to true if not specifically an AI site
    return settings.sites?.[key] !== false;
  }

  function debounce(fn, delay) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), delay);
    };
  }

  function attachToInput(inputEl) {
    // If it's Google Search, we ONLY attach to the input if it's NOT the main search bar 
    // This is a safety measure. On Google Search, we stick to AI Overview tooltips mostly.
    if (isGoogleSearch && inputEl.name === 'q') return;
    
    // Safety check for whitelisted AI platforms
    if (!isAIPlatform) return;

    if (activeInputs.has(inputEl)) return;
    activeInputs.add(inputEl);

    const debouncedPrivacy = debounce((el) => {
      if (isSiteEnabled() && settings?.privacyCheckEnabled !== false) {
        window.MindTheAI_Privacy?.handlePrivacyCheck(el);
      }
    }, 400);

    const handleInput = () => {
      if (!isSiteEnabled()) return;
      if (settings?.waterCheckEnabled !== false) {
        window.MindTheAI_Water?.handleInput(inputEl);
      }
      debouncedPrivacy(inputEl);
    };

    inputEl.addEventListener('input', handleInput);
    inputEl.addEventListener('keyup', handleInput);

    const handleScroll = debounce(() => {
      window.MindTheAI_Privacy?.clearOverlays(inputEl);
    }, 200);

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });

    const observer = new MutationObserver(() => {
      const text = inputEl.tagName === 'TEXTAREA' ? inputEl.value : inputEl.textContent;
      if (!text || !text.trim()) {
        window.MindTheAI_Water?.resetSession?.();
        window.MindTheAI_Privacy?.clearOverlays(inputEl);
      }
    });
    observer.observe(inputEl, { characterData: true, childList: true, subtree: true });
  }

  function scanForInputs() {
    if (!isAIPlatform) return;
    for (const selector of SITE_SELECTORS) {
      try {
        document.querySelectorAll(selector).forEach(attachToInput);
      } catch (e) {}
    }
  }

  async function init() {
    await loadSettings();

    // 1. AI Platform Initialization (Prompt Inputs)
    if (isAIPlatform && isSiteEnabled()) {
      scanForInputs();
      const observer = new MutationObserver(debounce(scanForInputs, 1000));
      observer.observe(document.body, { childList: true, subtree: true });
    }

    // 2. Google Search Initialization (AI Overview)
    if (isGoogleSearch) {
      let attempts = 0;
      const MAX = 30;
      const poll = setInterval(() => {
        attempts++;
        if (window.MindTheAI_GoogleAI) {
          window.MindTheAI_GoogleAI.checkGoogleAI();
          if (window.MindTheAI_GoogleAI.tooltipVisible || attempts >= MAX) clearInterval(poll);
        }
      }, 1000);

      const observer = new MutationObserver(debounce(() => {
        window.MindTheAI_GoogleAI?.checkGoogleAI();
      }, 1500));
      observer.observe(document.body, { childList: true, subtree: true });
    }

    chrome.runtime.onMessage.addListener((msg) => {
      if (msg.type === 'SETTINGS_UPDATED') loadSettings();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
