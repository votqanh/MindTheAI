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

  async function showBanner(inputEl) {
    if (bannerVisible || popupDismissedForSession) return;

    // Fetch settings needed for button content before rendering
    const settings = await window.MindTheAI_Storage.getSettings();
    const pref = settings?.preferredBrowser || { type: 'google' };

    let btnText = '🔍 Google it';
    let btnTitle = 'Search Google instead';
    if (pref.type === 'ecosia') {
      btnText = '🌳 Ecosia it';
      btnTitle = 'Search Ecosia instead';
    } else if (pref.type === 'other') {
      btnText = '🔗 Search it';
      btnTitle = 'Search instead';
    }

    if (bannerVisible || popupDismissedForSession) return; // check again after await
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
            <p class="mindtheai-banner-title">Save <strong>${window.MindTheAI_Format.formatWater(WATER_PER_PROMPT_ML)}</strong> — could ${pref.type === 'google' ? 'Google' : 'Ecosia'} answer this?</p>
            <p class="mindtheai-banner-sub">Up to ${window.MindTheAI_Format.formatWater(WATER_PER_CONVO_ML)} saved per conversation</p>
          </div>
        </div>
        <div class="mindtheai-banner-actions">
           <button id="mindtheai-google-btn" title="${btnTitle}">${btnText}</button>
          <button id="mindtheai-dismiss-btn" title="No, don't remind me">No</button>
          <label class="mindtheai-banner-check">
            <input type="checkbox" id="mindtheai-no-remind-check" />
            <span>Don't ask again</span>
          </label>
          <button id="mindtheai-close-btn" title="Close">✕</button>
        </div>
      </div>
    `;

    // Position: above the input field, fixed
    banner.style.cssText = `
      position: fixed;
      left: ${Math.max(16, inputRect.left)}px;
      top: ${Math.max(16, inputRect.top - 100)}px;
      width: auto;
      max-width: ${window.innerWidth - 32}px;
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

    // Redirect button (Google/Ecosia/Custom)
    document.getElementById('mindtheai-google-btn').addEventListener('click', () => {
      const text = getPromptText(inputEl);
      if (text.trim()) {
        window.MindTheAI_Storage.incrementWater({ saved: true });

        chrome.storage.local.get('settings', (result) => {
          const s = result.settings || {};
          const latestPref = s.preferredBrowser || { type: 'google' };

          let url = `https://www.google.com/search?q=${encodeURIComponent(text.trim())}`;
          if (latestPref.type === 'ecosia') {
            url = `https://www.ecosia.org/search?method=index&q=${encodeURIComponent(text.trim())}`;
          } else if (latestPref.type === 'other' && latestPref.customUrl) {
            url = latestPref.customUrl.includes('?')
              ? `${latestPref.customUrl}${encodeURIComponent(text.trim())}`
              : `${latestPref.customUrl}?q=${encodeURIComponent(text.trim())}`;
          }

          window.open(url, '_blank');
        });
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
