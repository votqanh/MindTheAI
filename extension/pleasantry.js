/**
 * pleasantry.js — MindTheAI
 * Detects pleasantries (hi, hello, thanks, goodbye, etc.) in the prompt.
 * Displays a tooltip banner suggesting removal to save water.
 */

(function () {
  'use strict';

  const BANNER_ID = 'mindtheai-pleasantry-banner';
  const PLEASANTRIES = [
    /\bhi\b/gi, /\bhello\b/gi, /\bhey\b/gi, /\bgreetings\b/gi,
    /\bthanks\b/gi, /\bthank you\b/gi, /\bthanks so much\b/gi, /\bthx\b/gi, /\bty\b/gi,
    /\bgoodbye\b/gi, /\bbye\b/gi, /\bcya\b/gi, /\bsee you\b/gi,
    /\bplease\b/gi, /\bcould you\b/gi, /\bwould you\b/gi, /\bcan you\b/gi,
    /\bhope you're doing well\b/gi, /\bhow are you\b/gi, /\bhow's it going\b/gi,
    /\bmy friend\b/gi, /\bai\b/gi, /\bassistant\b/gi, /\bchatgpt\b/gi, /\bgemini\b/gi, /\bclaude\b/gi
  ];

  let bannerVisible = false;
  let bannerDismissedForPrompt = false;

  function getPromptText(el) {
    if (el.tagName === 'TEXTAREA') return el.value;
    return el.innerText || el.textContent || '';
  }

  function setPromptText(el, text) {
    if (el.tagName === 'TEXTAREA') {
      el.value = text;
    } else {
      el.innerText = text;
    }
    el.dispatchEvent(new Event('input', { bubbles: true }));
  }

  function hasPleasantries(text) {
    const lowerText = text.toLowerCase();
    
    return PLEASANTRIES.some(regex => {
      // First check if the regex matches at all
      if (!regex.test(text)) return false;
      
      // Reset lastIndex because of /g flag
      regex.lastIndex = 0;
      
      // Find the specific word that matched
      const matches = text.match(regex);
      if (!matches) return false;

      // Special check for "hi" and "ai" which are prone to false positives
      for (const m of matches) {
        const word = m.toLowerCase().trim();
        if (word === 'hi' || word === 'ai') {
          // Check if it's part of a larger word
          const fullMatchContext = lowerText.match(new RegExp(`\\w*${word}\\w*`, 'g'));
          if (fullMatchContext?.some(cw => cw !== word)) {
            continue; // Skip this match, it's part of "high", "maintain", etc.
          }
        }
        
        // If we found at least one valid match, return true
        return true;
      }
      return false;
    });
  }

  function stripPleasantries(text) {
    let newText = text;
    PLEASANTRIES.forEach(regex => {
      newText = newText.replace(regex, '');
    });
    // Clean up extra spaces/newlines and punctuation at start
    return newText
      .replace(/^\s*[,.!?;:]+\s*/, '')
      .replace(/\s{2,}/g, ' ')
      .trim();
  }

  function updatePosition(inputEl) {
    const el = document.getElementById(BANNER_ID);
    if (!el || el.classList.contains('mindtheai-removing')) return;
    
    const targetEl = inputEl || document.querySelector(activeInputSelector || 'textarea, [contenteditable="true"]');
    if (!targetEl) return;

    const inputRect = targetEl.getBoundingClientRect();
    let offset = 80;
    
    // Check for water banner specifically ensuring it's not the one being removed
    const waterBanner = document.getElementById('mindtheai-water-banner');
    if (waterBanner && !waterBanner.classList.contains('mindtheai-removing')) {
      offset = 155;
    }
    
    el.style.top = `${Math.max(16, inputRect.top - offset)}px`;
  }

  let activeInputSelector = '';

  function showBanner(inputEl) {
    // Robust duplicate prevention
    if (document.getElementById(BANNER_ID)) return;
    bannerVisible = true;

    const inputRect = inputEl.getBoundingClientRect();
    const text = getPromptText(inputEl);
    if (!text.trim()) {
      bannerVisible = false;
      return;
    }

    const banner = document.createElement('div');
    banner.id = BANNER_ID;
    banner.innerHTML = `
      <div class="mindtheai-banner-inner pleasantry-banner">
        <div class="mindtheai-banner-left">
          <span class="mindtheai-banner-drop">💧</span>
          <div>
            <p class="mindtheai-banner-title">Save water by removing pleasantries</p>
            <p class="mindtheai-banner-sub">AI doesn't need "hi" or "thanks" to understand you.</p>
          </div>
        </div>
        <div class="mindtheai-banner-actions">
          <button id="mindtheai-remove-all-btn">Remove All</button>
          <button id="mindtheai-ignore-btn" class="secondary-btn">Ignore</button>
        </div>
      </div>
    `;

    // Coordination logic
    let offset = 80;
    const waterBanner = document.getElementById('mindtheai-water-banner');
    if (waterBanner && !waterBanner.classList.contains('mindtheai-removing')) {
        offset = 155;
    }

    banner.style.cssText = `
      position: fixed;
      left: ${Math.max(16, inputRect.left)}px;
      top: ${Math.max(16, inputRect.top - offset)}px;
      z-index: 2147483644;
      opacity: 0;
      transform: translateY(-8px);
      transition: opacity 0.18s ease, transform 0.18s ease, top 0.18s ease;
      pointer-events: auto;
    `;

    document.body.appendChild(banner);

    requestAnimationFrame(() => {
      banner.style.opacity = '1';
      banner.style.transform = 'translateY(0)';
    });

    document.getElementById('mindtheai-remove-all-btn').addEventListener('click', () => {
      const current = getPromptText(inputEl);
      const cleaned = stripPleasantries(current);
      if (cleaned !== current) {
        setPromptText(inputEl, cleaned);
      }
      removeBanner();
      bannerDismissedForPrompt = true;
    });

    document.getElementById('mindtheai-ignore-btn').addEventListener('click', () => {
      removeBanner();
      bannerDismissedForPrompt = true;
    });
  }

  function handleInput(inputEl) {
    const text = getPromptText(inputEl);
    
    if (!text.trim()) {
      bannerDismissedForPrompt = false;
      removeBanner();
      return;
    }

    if (hasPleasantries(text)) {
      if (!document.getElementById(BANNER_ID) && !bannerDismissedForPrompt) {
        showBanner(inputEl);
      } else if (document.getElementById(BANNER_ID)) {
        updatePosition(inputEl);
      }
    }
  }

  function removeBanner() {
    const el = document.getElementById(BANNER_ID);
    if (el) {
      el.classList.add('mindtheai-removing');
      el.style.opacity = '0';
      el.style.transform = 'translateY(-8px)';
      setTimeout(() => el?.remove(), 200);
    }
    bannerVisible = false;
  }

  window.MindTheAI_Pleasantry = {
    handleInput,
    updatePosition,
    clearBanner: removeBanner
  };
})();
