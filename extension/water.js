/**
 * water.js — MindTheAI (v2)
 * Non-blocking tooltip banner that appears near the prompt field.
 * Does NOT intercept typing. Dismisses automatically when user continues.
 */

(function () {
  'use strict';

  const WATER_PER_PROMPT_ML = 39;
  const WATER_PER_CONVO_ML = 500;
  const WORD_THRESHOLD = 20;
  const BANNER_ID = 'mindtheai-water-banner';

  let bannerVisible = false;
  let popupDismissedForSession = false;
  let hideTimer = null;

  function countWords(text) {
    return text.trim().split(/\s+/).filter(Boolean).length;
  }

  function getPromptText(el) {
    if (el.tagName === 'TEXTAREA') return el.value;
    return el.innerText || el.textContent || '';
  }

  function removeBanner() {
    const el = document.getElementById(BANNER_ID);
    if (el) {
      el.style.opacity = '0';
      el.style.transform = 'translateY(-8px)';
      setTimeout(() => el?.remove(), 200);
    }
    bannerVisible = false;
    clearTimeout(hideTimer);
  }

  function showBanner(inputEl) {
    if (bannerVisible || popupDismissedForSession) return;
    bannerVisible = true;

    // Remove any existing
    document.getElementById(BANNER_ID)?.remove();

    const inputRect = inputEl.getBoundingClientRect();

    const banner = document.createElement('div');
    banner.id = BANNER_ID;
    banner.innerHTML = `
      <div class="mindtheai-banner-inner">
        <div class="mindtheai-banner-left">
          <span class="mindtheai-banner-drop">💧</span>
          <div>
            <p class="mindtheai-banner-title">Save <strong>${WATER_PER_PROMPT_ML} mL</strong> — could Google answer this?</p>
            <p class="mindtheai-banner-sub">Up to ${WATER_PER_CONVO_ML} mL saved per conversation</p>
          </div>
        </div>
        <div class="mindtheai-banner-actions">
          <button id="mindtheai-google-btn" title="Search Google instead">🔍 Google it</button>
          <button id="mindtheai-dismiss-btn" title="Continue with AI">Continue</button>
          <button id="mindtheai-close-btn" title="Close">✕</button>
        </div>
      </div>
      <label class="mindtheai-banner-check">
        <input type="checkbox" id="mindtheai-no-remind-check" />
        <span>Don't show again for this chat</span>
      </label>
    `;

    // Position: above the input field, fixed
    banner.style.cssText = `
      position: fixed;
      left: ${Math.max(8, inputRect.left)}px;
      top: ${Math.max(8, inputRect.top - 90)}px;
      width: ${Math.min(inputRect.width, window.innerWidth - 16)}px;
      z-index: 2147483645;
      opacity: 0;
      transform: translateY(-8px);
      transition: opacity 0.18s ease, transform 0.18s ease;
      pointer-events: auto;
    `;

    document.body.appendChild(banner);

    // Animate in
    requestAnimationFrame(() => {
      banner.style.opacity = '1';
      banner.style.transform = 'translateY(0)';
    });

    // Google redirect
    document.getElementById('mindtheai-google-btn').addEventListener('click', () => {
      const text = getPromptText(inputEl);
      if (text.trim()) {
        window.MindTheAI_Storage.incrementWater({ saved: true });
        window.open(`https://www.google.com/search?q=${encodeURIComponent(text.trim())}`, '_blank');
      }
      checkNoRemind();
      removeBanner();
    });

    // Continue
    document.getElementById('mindtheai-dismiss-btn').addEventListener('click', () => {
      window.MindTheAI_Storage.incrementWater({ used: true });
      checkNoRemind();
      removeBanner();
    });

    // Close (no action tracked)
    document.getElementById('mindtheai-close-btn').addEventListener('click', () => {
      checkNoRemind();
      removeBanner();
    });

    function checkNoRemind() {
      if (document.getElementById('mindtheai-no-remind-check')?.checked) {
        popupDismissedForSession = true;
      }
    }
  }

  function handleInput(inputEl) {
    const text = getPromptText(inputEl);
    const wordCount = countWords(text);

    if (wordCount > 0 && wordCount <= WORD_THRESHOLD) {
      if (!bannerVisible && !popupDismissedForSession) {
        showBanner(inputEl);
      }
    } else if (wordCount > WORD_THRESHOLD) {
      // User passed threshold — they're committed, hide the banner
      removeBanner();
    } else if (wordCount === 0) {
      // Field cleared (new prompt)
      removeBanner();
    }
  }

  window.MindTheAI_Water = {
    handleInput,
    resetSession() {
      popupDismissedForSession = false;
      removeBanner();
    },
  };
})();
