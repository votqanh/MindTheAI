/**
 * source_check.js — MindTheAI
 * Detects citations to social media (x.com, reddit.com, quora.com)
 * and displays a "Potential unreliable source" tooltip.
 */

(function () {
  'use strict';

  const UNRELIABLE_DOMAINS = [
    'x.com',
    'twitter.com',
    'reddit.com',
    'quora.com'
  ];

  const CHECKED_ATTR = 'data-mindtheai-source-checked';
  const BADGE_CLASS = 'mindtheai-source-badge';
  const TOOLTIP_ID = 'mindtheai-source-tooltip';

  let activeTooltip = null;

  /**
   * Scans all links on the page for unreliable social media sources.
   * Injects a warning badge next to matching links.
   */
  function scanLinks() {
    const links = document.querySelectorAll(`a:not([${CHECKED_ATTR}])`);
    
    links.forEach(link => {
      try {
        const urlString = link.href;
        if (!urlString || urlString.startsWith('javascript:') || urlString.startsWith('#')) {
          link.setAttribute(CHECKED_ATTR, 'skipped');
          return;
        }

        const isUnreliable = checkUnreliable(urlString);
        
        if (isUnreliable) {
          injectBadge(link);
        }
      } catch (e) {
        // Skip on error
      }
      link.setAttribute(CHECKED_ATTR, 'true');
    });
  }

  /**
   * More robust check for unreliable domains, including redirects and parameters.
   */
  function checkUnreliable(urlString) {
    const urlLower = urlString.toLowerCase();
    
    // 1. Direct domain check
    try {
      const url = new URL(urlString);
      const domain = url.hostname.toLowerCase().replace(/^www\./, '');
      if (UNRELIABLE_DOMAINS.some(d => domain === d || domain.endsWith('.' + d))) {
        return true;
      }
    } catch (e) {}

    // 2. String-based check (handles redirects like chatgpt.com/refer?url=reddit.com)
    for (const d of UNRELIABLE_DOMAINS) {
      if (urlLower.includes(d)) {
        const regex = new RegExp(`[/.=]${d.replace('.', '\\.')}(?:[/?&]|$)`, 'i');
        if (regex.test(urlLower)) return true;
      }
    }

    return false;
  }

  /**
   * Injects a warning ⚠️ badge AFTER the link.
   */
  function injectBadge(linkEl) {
    if (linkEl.nextElementSibling && linkEl.nextElementSibling.classList.contains(BADGE_CLASS)) return;

    const badge = document.createElement('span');
    badge.className = BADGE_CLASS;
    badge.innerHTML = '⚠️';
    badge.style.cssText = `
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin-left: 4px;
      cursor: help;
      font-size: 14px;
      vertical-align: middle;
      transition: transform 0.2s ease;
      user-select: none;
      background: rgba(245, 158, 11, 0.1);
      border: 1px solid rgba(245, 158, 11, 0.3);
      border-radius: 4px;
      padding: 0 2px;
    `;
    
    badge.addEventListener('mouseenter', (e) => showTooltip(e.target));
    badge.addEventListener('mouseleave', hideTooltip);

    if (linkEl.nextSibling) {
      linkEl.parentNode.insertBefore(badge, linkEl.nextSibling);
    } else {
      linkEl.parentNode.appendChild(badge);
    }
  }

  function showTooltip(anchorEl) {
    hideTooltip();

    const tooltip = document.createElement('div');
    tooltip.id = TOOLTIP_ID;
    tooltip.className = 'mindtheai-source-tooltip';
    tooltip.innerHTML = `
      <div class="mindtheai-source-tooltip-inner">
        <strong>Potential unreliable source</strong>
        <p>Social media content (Reddit, X, Quora) may not be verified or fact-checked.</p>
      </div>
    `;

    document.body.appendChild(tooltip);
    activeTooltip = tooltip;

    const rect = anchorEl.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();
    
    let left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
    let top = rect.top - tooltipRect.height - 10;
    
    if (left < 10) left = 10;
    if (left + tooltipRect.width > window.innerWidth - 10) left = window.innerWidth - tooltipRect.width - 10;
    if (top < 10) top = rect.bottom + 10;

    tooltip.style.position = 'fixed';
    tooltip.style.zIndex = '2147483647';
    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
    tooltip.style.pointerEvents = 'none';
    
    requestAnimationFrame(() => {
      tooltip.style.opacity = '1';
      tooltip.style.transform = 'translateY(0)';
    });
  }

  function hideTooltip() {
    if (activeTooltip) {
      const el = activeTooltip;
      el.style.opacity = '0';
      el.style.transform = 'translateY(5px)';
      setTimeout(() => el.remove(), 200);
      activeTooltip = null;
    }
  }

  let observer = null;

  function init() {
    scanLinks();
    if (observer) observer.disconnect();
    observer = new MutationObserver(() => {
        clearTimeout(window._mindtheaiSourceTimeout);
        window._mindtheaiSourceTimeout = setTimeout(scanLinks, 300);
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  window.MindTheAI_SourceCheck = {
    init,
    scanLinks
  };
  
  // Auto-init for manual injection tests
  if (window.location.href.includes('source_test.html')) {
    init();
  }
})();
