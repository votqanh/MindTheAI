/**
 * google_ai.js — MindTheAI
 * Detects Google's AI Overview on search result pages and shows a
 * water-saving tooltip encouraging users to disable it.
 */

(function () {
  'use strict';

  const TOOLTIP_ID = 'mindtheai-ai-overview-tooltip';
  const STORAGE_KEY = 'mindtheai_ai_overview_dismissed';

  let tooltipVisible = false;
  let dismissed = false;

  /**
   * Attempt to locate the AI Overview element on the page.
   * Uses heading/label text matching first (most reliable),
   * then falls back to attribute-based selectors.
   */
  function findAIOverview() {
    // 1. Most reliable: look for headings with exact "AI Overview" text
    const headings = document.querySelectorAll('h1, h2, div[role="heading"]');
    for (const h of headings) {
      if (/^ai\s*overview$/i.test(h.textContent.trim())) {
        return h.closest('.MjjYud') || h.closest('[jsname]') || h.parentElement;
      }
    }

    // 2. Look for the known AI Overview label element
    const labels = document.querySelectorAll('div[jsname="cUzNTd"]');
    for (const label of labels) {
      if (/^ai\s*overview$/i.test(label.textContent.trim())) {
        return label.closest('.MjjYud') || label.closest('[jsname="N760b"]') || label.parentElement;
      }
    }

    // 3. Attribute-based fallback: data-attrid is unique to AI Overview
    const attrid = document.querySelector('div[data-attrid="AIOverview"]');
    if (attrid) return attrid;

    // 4. The container element #m-x-content (used for SGE content)
    const mxContent = document.querySelector('div#m-x-content');
    if (mxContent) return mxContent;

    return null;
  }

  /**
   * Inject the tooltip near the AI Overview element.
   */
  function showTooltip(anchorEl) {
    if (tooltipVisible || dismissed) return;

    // Double-check no existing tooltip
    if (document.getElementById(TOOLTIP_ID)) return;

    tooltipVisible = true;

    const tooltip = document.createElement('div');
    tooltip.id = TOOLTIP_ID;
    tooltip.className = 'mindtheai-ai-overview-tooltip';
    tooltip.innerHTML = `
      <div class="mindtheai-aio-inner">
        <div class="mindtheai-aio-header">
          <span class="mindtheai-aio-icon">💧</span>
          <span class="mindtheai-aio-title">AI Overview detected</span>
        </div>
        <p class="mindtheai-aio-body">
          Google's AI Overview uses water just like a chatbot.
          Consider disabling it to save more water!
        </p>
        <div class="mindtheai-aio-instructions">
          <strong>How to disable:</strong>
          <ol>
            <li>Go to <a href="https://myactivity.google.com/product/search" target="_blank" rel="noopener">Google Search Settings</a></li>
            <li>Find <em>"AI Overview"</em> and turn it off</li>
            <li>Or add <code>&udm=14</code> to search URLs for web-only results</li>
          </ol>
        </div>
        <div class="mindtheai-aio-actions">
          <label class="mindtheai-aio-check">
            <input type="checkbox" id="mindtheai-aio-no-remind" />
            <span>Don't show again</span>
          </label>
          <button id="mindtheai-aio-dismiss" class="mindtheai-aio-btn">Got it</button>
        </div>
      </div>
    `;

    // Insert above the AI Overview in the DOM
    if (anchorEl.parentElement) {
      anchorEl.parentElement.insertBefore(tooltip, anchorEl);
    } else {
      // Fallback: fixed-position overlay
      tooltip.style.position = 'fixed';
      tooltip.style.top = '80px';
      tooltip.style.left = '50%';
      tooltip.style.transform = 'translateX(-50%) translateY(-8px)';
      tooltip.style.zIndex = '2147483645';
      document.body.prepend(tooltip);
    }

    // Animate in
    requestAnimationFrame(() => {
      tooltip.style.opacity = '1';
      if (!tooltip.style.position) {
        tooltip.style.transform = 'translateY(0)';
      } else {
        tooltip.style.transform = 'translateX(-50%) translateY(0)';
      }
    });

    // Dismiss button
    document.getElementById('mindtheai-aio-dismiss').addEventListener('click', () => {
      const noRemind = document.getElementById('mindtheai-aio-no-remind')?.checked;
      if (noRemind) {
        try { chrome.storage.local.set({ [STORAGE_KEY]: true }); } catch (e) {}
      }
      removeTooltip();
    });
  }

  function removeTooltip() {
    const el = document.getElementById(TOOLTIP_ID);
    if (el) {
      el.style.opacity = '0';
      el.style.transform = 'translateY(-8px)';
      setTimeout(() => el?.remove(), 250);
    }
    tooltipVisible = false;
  }

  /**
   * Main check — called by content.js on poll intervals and DOM mutations.
   */
  function checkGoogleAI() {
    if (tooltipVisible || dismissed) return;

    const aiOverview = findAIOverview();
    if (aiOverview) {
      showTooltip(aiOverview);
    }
  }

  // On load, check if user previously chose "Don't show again"
  try {
    chrome.storage.local.get(STORAGE_KEY, (result) => {
      if (result && result[STORAGE_KEY]) {
        dismissed = true;
      }
    });
  } catch (e) {
    // chrome.storage may not be available outside extension context
  }

  // Export for content.js
  window.MindTheAI_GoogleAI = {
    checkGoogleAI,
    get tooltipVisible() {
      return tooltipVisible;
    },
  };
})();
