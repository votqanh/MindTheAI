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
  let bannerWasShown = false;  // tracks if banner appeared this session
  let promptHadContent = false; // tracks if input had content before clearing

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
      el.classList.add('mindtheai-removing');
      el.style.opacity = '0';
      el.style.transform = 'translateY(-8px)';
      setTimeout(() => {
        el?.remove();
        // Notify pleasantry banner to slide down
        window.MindTheAI_Pleasantry?.updatePosition?.();
      }, 200);
    }
    bannerVisible = false;
    clearTimeout(hideTimer);
  }

  /**
   * Detect prompt submission: listen for Enter key (without Shift).
   * When the user presses Enter to send, count as AI usage.
   */
  let submitTrackedThisCycle = false;

  function attachSubmitDetection(inputEl) {
    if (inputEl._mindtheaiSubmitAttached) return;
    inputEl._mindtheaiSubmitAttached = true;

    inputEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        const text = getPromptText(inputEl);
        if (text.trim()) {
          // User is submitting a prompt to the AI — count as water used
          window.MindTheAI_Storage.incrementWater({ used: true });
          submitTrackedThisCycle = true;
          // Remove banner if it was showing
          removeBanner();
        }
      }
    });
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

    if (bannerVisible || popupDismissedForSession || document.getElementById(BANNER_ID)) return;
    bannerVisible = true;

    // Remove any existing
    document.getElementById(BANNER_ID)?.remove();

    const inputRect = inputEl.getBoundingClientRect();
    const text = getPromptText(inputEl);
    if (!text.trim()) {
      bannerVisible = false;
      return;
    }

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
    // Water banner stays at the bottom of the stack
    let offset = 80;

    banner.style.cssText = `
      position: fixed;
      left: ${Math.max(16, inputRect.left)}px;
      top: ${Math.max(16, inputRect.top - offset)}px;
      width: auto;
      max-width: ${window.innerWidth - 32}px;
      z-index: 2147483645;
      opacity: 0;
      transform: translateY(-8px);
      transition: opacity 0.18s ease, transform 0.18s ease, top 0.18s ease;
      pointer-events: auto;
    `;

    document.body.appendChild(banner);

    // Notify pleasantry banner to move up
    window.MindTheAI_Pleasantry?.updatePosition?.(inputEl);

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

          // Append &udm=14 to Google URLs when hideAIOverview is enabled
          if (s.hideAIOverview && latestPref.type === 'google') {
            url += '&udm=14';
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
    // Attach submit detection on first encounter
    attachSubmitDetection(inputEl);

    const text = getPromptText(inputEl);
    const wordCount = countWords(text);

    if (wordCount > 0) {
      promptHadContent = true;
    }

    if (wordCount > 0 && wordCount <= WORD_THRESHOLD) {
      if (!bannerVisible && !popupDismissedForSession) {
        showBanner(inputEl);
        bannerWasShown = true;
      }
    } else if (wordCount > WORD_THRESHOLD) {
      // User passed threshold — they're committed, hide the banner
      removeBanner();
    } else if (wordCount === 0 && promptHadContent) {
      // Field cleared after having content (prompt was submitted)
      // If banner was showing but user didn't interact, count as AI usage
      // (Enter key detection handles the primary tracking, this is a fallback
      //  for send-button clicks where Enter wasn't pressed)
      if (!submitTrackedThisCycle && bannerWasShown && bannerVisible) {
        window.MindTheAI_Storage.incrementWater({ used: true });
      }
      removeBanner();
      promptHadContent = false;
      bannerWasShown = false;
      submitTrackedThisCycle = false;
    }
  }

  window.MindTheAI_Water = {
    handleInput,
    resetSession() {
      popupDismissedForSession = false;
      bannerWasShown = false;
      promptHadContent = false;
      removeBanner();
    },
  };
})();
