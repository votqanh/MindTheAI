/**
 * privacy.js — MindTheAI
 * Feature 2: Real-time sensitive data detection with red highlight overlay and tooltip.
 */

(function () {
  'use strict';

  // Common English words to exclude from API key detection
  const COMMON_WORDS = new Set([
    'information', 'application', 'development', 'environment', 'configuration',
    'authentication', 'authorization', 'documentation', 'implementation', 'organization',
    'communication', 'understanding', 'international', 'relationship', 'management',
    'responsibility', 'administration', 'infrastructure', 'performance', 'functionality',
    'requirements', 'automatically', 'successfully', 'approximately', 'particularly',
    'significantly', 'unfortunately', 'possibilities', 'recommendations', 'accessibility',
  ]);

  const PATTERNS = {
    phone: {
      regex: /(\+?1[\s.\-]?)?\(?\d{3}\)?[\s.\-]?\d{3}[\s.\-]?\d{4}/g,
      label: 'Phone number',
      type: 'phone',
    },
    email: {
      regex: /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g,
      label: 'Email address',
      type: 'email',
    },
    address: {
      // More robust address regex: Number + Street Name + Suffix + Optional Suite + Optional City/State/Zip
      regex: /\d{1,5}\s+[A-Z\d][a-z\d\s.-]{2,30}\s+(?:street|st|ave|avenue|road|rd|blvd|boulevard|ln|lane|dr|drive|court|ct|way|place|pl|circle|cr|sq|square|loop|trail)(?:\s+(?:apt|suite|ste|unit|box|#)\s*\d+[a-z]?)?[\s,]+(?:[A-Z][a-z\s.-]{2,20}[\s,]+)?(?:[A-Z]{2}\s+)?\d{5}(?:-\d{4})?/gi,
      label: 'Address',
      type: 'address',
    },
  };

  // ── 1Password vault credential cache ──
  let vaultCredentials = []; // [{ name, value }]
  let vaultCacheExpiry = 0;

  async function fetchVaultCredentials() {
    const now = Date.now();
    if (now < vaultCacheExpiry && vaultCredentials.length > 0) return; // still fresh

    let settings = null;
    try {
      settings = await new Promise((resolve) =>
        chrome.storage.local.get('settings', (r) => resolve(r.settings || null))
      );
    } catch { return; }

    const op = settings?.onePassword;
    if (!op?.enabled || !op.vaultId) return;

    try {
      if (op.authMode === 'service-account') {
        if (!op.serviceAccountToken) return;
        
        // Delegate fetch to background script to avoid Mixed Content / CSP issues on HTTPS AI sites
        const response = await new Promise((resolve) => {
          chrome.runtime.sendMessage({
            type: 'FETCH_1PASSWORD_SERVICE_ACCOUNT',
            payload: {
              serviceAccountToken: op.serviceAccountToken,
              vaultId: op.vaultId
            }
          }, resolve);
        });

        if (response && response.success && Array.isArray(response.data)) {
          vaultCredentials = response.data;
        } else {
          return;
        }
      } else {
        // Legacy Connect Server mode
        if (!op.connectUrl || !op.accessToken) return;
        
        // Also delegate Connect server fetch to background to avoid Mixed Content / CSP
        const response = await new Promise((resolve) => {
          chrome.runtime.sendMessage({
            type: 'FETCH_1PASSWORD_CONNECT',
            payload: {
              connectUrl: op.connectUrl,
              accessToken: op.accessToken,
              vaultId: op.vaultId
            }
          }, resolve);
        });

        if (response && response.success && Array.isArray(response.data)) {
          vaultCredentials = response.data;
        } else {
          return;
        }
      }
      vaultCacheExpiry = Date.now() + 5 * 60 * 1000; // 5 min cache
    } catch (e) { 
      /* network error – silently skip */ 
      console.warn("fetchVaultCredentials error", e);
    }
  }

  function detectVaultMatches(text) {
    const matches = [];
    for (const cred of vaultCredentials) {
      const idx = text.indexOf(cred.value);
      if (idx !== -1) {
        matches.push({
          type: 'vault',
          label: `Vault credential: "${cred.name}"`,
          value: cred.value,
          start: idx,
          end: idx + cred.value.length,
        });
      }
    }
    return matches;
  }


  const HIGHLIGHT_CLASS = 'mindtheai-sensitive-highlight';
  const MIRROR_ID_PREFIX = 'mindtheai-mirror-';

  const activeTooltips = new Map();

  async function detectAllSensitiveData(text) {
    // Regex-based matches
    const matches = [];
    for (const [key, patternDef] of Object.entries(PATTERNS)) {
      patternDef.regex.lastIndex = 0;
      let m;
      while ((m = patternDef.regex.exec(text)) !== null) {
        if (patternDef.filter && !patternDef.filter(m[0])) continue;
        matches.push({
          type: patternDef.type,
          label: patternDef.label,
          value: m[0],
          start: m.index,
          end: m.index + m[0].length,
        });
      }
    }
    // 1Password vault matches (async, pre-fetched)
    for (const vm of detectVaultMatches(text)) {
      matches.push(vm);
    }
    // Sort by start index and remove overlaps
    matches.sort((a, b) => a.start - b.start);
    const filtered = [];
    let lastEnd = -1;
    for (const match of matches) {
      if (match.start >= lastEnd) {
        filtered.push(match);
        lastEnd = match.end;
      }
    }
    return filtered;
  }

  /** Remove all privacy overlays for a given input */
  function clearOverlays(inputEl) {
    const id = getMirrorId(inputEl);
    const existing = document.getElementById(id + '-container');
    if (existing) existing.remove();
    activeTooltips.forEach((tip) => tip.remove());
    activeTooltips.clear();
  }

  const TOOLTIP_ID_PREFIX = 'mindtheai-tooltip-';
function getMirrorId(inputEl) {
    if (!inputEl.dataset.mindtheaiId) {
      inputEl.dataset.mindtheaiId = MIRROR_ID_PREFIX + Math.random().toString(36).slice(2);
    }
    return inputEl.dataset.mindtheaiId;
  }

  /** Show a tooltip near a detected sensitive match */
  function showTooltip(inputEl, match, rect, containerEl) {
    removeTooltip(match.start);

    const tooltip = document.createElement('div');
    tooltip.id = TOOLTIP_ID_PREFIX + match.start;
    tooltip.className = 'mindtheai-tooltip';

    tooltip.innerHTML = `
      <div class="mindtheai-tooltip-inner">
        <span class="mindtheai-tooltip-icon">⚠️</span>
        <span class="mindtheai-tooltip-text"><strong>${match.label}</strong> detected. Keep it?</span>
        <div class="mindtheai-tooltip-btns">
          <button class="mindtheai-tip-yes">Keep</button>
          <button class="mindtheai-tip-no">Remove</button>
        </div>
      </div>
    `;

    // Position above the highlight
    tooltip.style.position = 'fixed';
    
    // Position significantly above to avoid any overlap with the text line
    const safeTop = rect.top - 110; 
    
    tooltip.style.left = `${rect.left}px`;
    tooltip.style.top = `${safeTop}px`;
    tooltip.style.zIndex = '2147483646';

    document.body.appendChild(tooltip);
    activeTooltips.set(match.start, tooltip);

    // Click outside listener
    const onOutsideClick = (e) => {
      // Don't close if clicking the highlight itself or the tooltip
      const isHighlight = e.target.closest('.' + HIGHLIGHT_CLASS);
      const isTooltip = tooltip.contains(e.target);
      
      if (!isHighlight && !isTooltip) {
        removeTooltip(match.start);
        document.removeEventListener('click', onOutsideClick);
      }
    };
    // Delay adding the listener to avoid the current click closing it immediately
    setTimeout(() => document.addEventListener('click', onOutsideClick), 10);

    tooltip.querySelector('.mindtheai-tip-yes').addEventListener('click', () => {
      window.MindTheAI_Storage.recordPrivacy({ type: match.type, removed: false });
      removeTooltip(match.start);
    });

    tooltip.querySelector('.mindtheai-tip-no').addEventListener('click', () => {
      removeMatchFromInput(inputEl, match.value);
      window.MindTheAI_Storage.recordPrivacy({ type: match.type, removed: true });
      removeTooltip(match.start);
    });
  }

  function removeTooltip(key) {
    const tip = activeTooltips.get(key);
    if (tip) {
      tip.classList.add('fade-out'); // Add CSS hook for smooth exit
      setTimeout(() => tip.remove(), 150);
      activeTooltips.delete(key);
    }
    // Also by DOM id for redundancy
    const byId = document.getElementById(TOOLTIP_ID_PREFIX + key);
    if (byId) byId.remove();
  }

  function removeMatchFromInput(inputEl, value) {
    if (inputEl.tagName === 'TEXTAREA') {
      inputEl.value = inputEl.value.replace(value, '');
      inputEl.dispatchEvent(new Event('input', { bubbles: true }));
    } else if (inputEl.isContentEditable) {
      const selection = window.getSelection();
      const range = document.createRange();
      // Walk text nodes and remove the value
      const walker = document.createTreeWalker(inputEl, NodeFilter.SHOW_TEXT, null);
      let node;
      while ((node = walker.nextNode())) {
        const idx = node.nodeValue.indexOf(value);
        if (idx !== -1) {
          node.nodeValue = node.nodeValue.slice(0, idx) + node.nodeValue.slice(idx + value.length);
          inputEl.dispatchEvent(new Event('input', { bubbles: true }));
          break;
        }
      }
    }
  }

  /**
   * Main handler: run detection on the given input element and show highlights + tooltips.
   * For textareas, we use a sibling mirror div approach.
   */
  async function handlePrivacyCheck(inputEl) {
    // Pre-fetch vault credentials in background (cached)
    fetchVaultCredentials();

    clearOverlays(inputEl);

    const text = inputEl.tagName === 'TEXTAREA'
      ? inputEl.value
      : (inputEl.innerText || inputEl.textContent || '');

    if (!text.trim()) return;

    const matches = await detectAllSensitiveData(text);
    if (matches.length === 0) return;

    // Build a mirror div to position highlights over the textarea
    const mirrorId = getMirrorId(inputEl);
    const container = document.createElement('div');
    container.id = mirrorId + '-container';
    container.style.cssText = 'position:absolute;pointer-events:none;z-index:2147483640;';
    document.body.appendChild(container);

    const inputRect = inputEl.getBoundingClientRect();
    const style = window.getComputedStyle(inputEl);

    const mirror = document.createElement('div');
    mirror.className = 'mindtheai-mirror';
    mirror.style.cssText = `
      position: fixed;
      top: ${inputRect.top + window.scrollY - window.scrollY}px;
      left: ${inputRect.left}px;
      width: ${inputRect.width}px;
      height: ${inputRect.height}px;
      font-family: ${style.fontFamily};
      font-size: ${style.fontSize};
      font-weight: ${style.fontWeight};
      line-height: ${style.lineHeight};
      letter-spacing: ${style.letterSpacing};
      padding: ${style.padding};
      border: ${style.border};
      box-sizing: ${style.boxSizing};
      overflow: hidden;
      white-space: pre-wrap;
      word-wrap: break-word;
      color: transparent;
      background: transparent;
      pointer-events: none;
      z-index: 2147483641;
    `;

    // Build mirrored text with red highlights
    let lastIndex = 0;
    let html = '';
    for (const match of matches) {
      const before = escapeHtml(text.slice(lastIndex, match.start));
      const highlighted = escapeHtml(match.value);
      html += before;
      html += `<mark class="${HIGHLIGHT_CLASS}" data-type="${match.type}" data-start="${match.start}" style="background:rgba(239,68,68,0.35);color:transparent;border-radius:2px;pointer-events:auto;cursor:pointer;">${highlighted}</mark>`;
      lastIndex = match.end;
    }
    html += escapeHtml(text.slice(lastIndex));
    mirror.innerHTML = html;
    container.appendChild(mirror);

    // After rendering, ensure tooltips can be triggered on click
    requestAnimationFrame(() => {
      const marks = mirror.querySelectorAll('.' + HIGHLIGHT_CLASS);
      marks.forEach((mark) => {
        mark.style.pointerEvents = 'auto';
        mark.style.cursor = 'pointer';
        mark.onclick = (e) => {
          e.preventDefault();
          e.stopPropagation();
          const start = parseInt(mark.dataset.start, 10);
          const match = matches.find((m) => m.start === start);
          if (match) {
            const markRect = mark.getBoundingClientRect();
            showTooltip(inputEl, match, markRect, container);
          }
        };
      });
    });
  }

  function escapeHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/\n/g, '<br>');
  }

  window.MindTheAI_Privacy = {
    handlePrivacyCheck,
    clearOverlays,
  };
})();
