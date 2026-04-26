(function () {
  const script = document.currentScript;
  const token = script?.dataset.analyticsToken || '';
  const privacyUrl = script?.dataset.analyticsPrivacyUrl || '/privacy';
  const storageKey = 'khe.analyticsConsent.v1';
  const configured = token && !token.startsWith('__');

  function currentLocale() {
    const fromUrl = new URLSearchParams(window.location.search).get('lang');
    const fromHtml = document.documentElement.lang;
    let fromStorage = '';
    try {
      fromStorage = window.localStorage.getItem('app_locale') || '';
    } catch {
      // Ignore storage errors.
    }

    const value = (fromUrl || fromStorage || fromHtml || 'en').toLowerCase();
    return value.startsWith('et') ? 'et' : 'en';
  }

  const copy = {
    en: {
      title: 'Allow analytics?',
      body: 'I use Cloudflare Web Analytics to collect aggregate page-view and performance statistics. No advertising, profiling, analytics cookies, or cross-site tracking.',
      allow: 'Allow analytics',
      deny: 'Decline',
      privacy: 'Privacy',
      savedAllowed: 'Analytics allowed.',
      savedDenied: 'Analytics declined.',
    },
    et: {
      title: 'Lubad analüütikat?',
      body: 'Kasutan Cloudflare Web Analyticsit koondatud lehevaatamiste ja jõudluse statistika jaoks. Reklaame, profileerimist, analüütikaküpsiseid ega saitideülest jälitamist ei ole.',
      allow: 'Luba analüütika',
      deny: 'Keeldu',
      privacy: 'Privaatsus',
      savedAllowed: 'Analüütika lubatud.',
      savedDenied: 'Analüütika keelatud.',
    },
  };

  function currentCopy() {
    return copy[currentLocale()];
  }

  function localizedPrivacyUrl() {
    const locale = currentLocale();

    try {
      const url = new URL(privacyUrl, window.location.origin);
      url.searchParams.set('lang', locale);
      return `${url.pathname}${url.search}${url.hash}`;
    } catch {
      return `/privacy?lang=${locale}`;
    }
  }

  function readChoice() {
    try {
      const parsed = JSON.parse(window.localStorage.getItem(storageKey) || 'null');
      return parsed && typeof parsed.value === 'string' ? parsed.value : null;
    } catch {
      return null;
    }
  }

  function writeChoice(value) {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify({ value, updatedAt: new Date().toISOString() }));
    } catch {
      // If localStorage is blocked, apply the current page choice without persistence.
    }
  }

  function loadBeacon() {
    if (!configured || document.querySelector('script[data-cf-beacon]')) return;

    const beacon = document.createElement('script');
    beacon.defer = true;
    beacon.src = 'https://static.cloudflareinsights.com/beacon.min.js';
    beacon.setAttribute('data-cf-beacon', JSON.stringify({ token }));
    document.head.appendChild(beacon);
  }

  function injectStyles() {
    if (document.getElementById('khe-analytics-consent-style')) return;

    const style = document.createElement('style');
    style.id = 'khe-analytics-consent-style';
    style.textContent = `
      .khe-analytics-consent {
        position: fixed;
        right: 1rem;
        bottom: 1rem;
        z-index: 10000;
        width: min(27rem, calc(100vw - 2rem));
        padding: 1rem;
        border: 1px solid rgba(255,255,255,0.14);
        border-radius: 8px;
        background: rgba(12,12,15,0.96);
        color: #fafafa;
        box-shadow: 0 18px 70px rgba(0,0,0,0.45);
        font: 400 0.9rem/1.45 Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }
      .khe-analytics-consent strong {
        display: block;
        margin-bottom: 0.4rem;
        color: #fafafa;
        font-size: 1rem;
        font-weight: 650;
      }
      .khe-analytics-consent p {
        margin: 0 0 0.8rem;
        color: #c4c4cc;
      }
      .khe-analytics-consent a {
        color: #d4d4dc;
      }
      .khe-analytics-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        align-items: center;
      }
      .khe-analytics-actions button {
        min-height: 2.4rem;
        border: 1px solid rgba(255,255,255,0.18);
        border-radius: 8px;
        padding: 0 0.82rem;
        background: rgba(255,255,255,0.05);
        color: #fafafa;
        cursor: pointer;
        font: 650 0.82rem/1 Inter, system-ui, sans-serif;
      }
      .khe-analytics-actions button[data-consent-choice="granted"] {
        border-color: rgba(103,232,249,0.48);
        background: rgba(103,232,249,0.16);
      }
      .khe-analytics-status {
        min-height: 1.2rem;
        margin-top: 0.65rem;
        color: #a1a1aa;
        font-size: 0.78rem;
      }
      @media (max-width: 520px) {
        .khe-analytics-consent {
          right: 0.75rem;
          bottom: 0.75rem;
          width: calc(100vw - 1.5rem);
        }
        .khe-analytics-actions {
          align-items: stretch;
          flex-direction: column;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function closeBanner() {
    document.querySelector('[data-analytics-consent-panel]')?.remove();
  }

  function showBanner() {
    if (!configured) return;
    injectStyles();
    closeBanner();

    const text = currentCopy();
    const panel = document.createElement('section');
    panel.className = 'khe-analytics-consent';
    panel.setAttribute('data-analytics-consent-panel', '');
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', text.title);
    panel.innerHTML = `
      <strong>${text.title}</strong>
      <p>${text.body} <a href="${localizedPrivacyUrl()}">${text.privacy}</a>.</p>
      <div class="khe-analytics-actions">
        <button type="button" data-consent-choice="granted">${text.allow}</button>
        <button type="button" data-consent-choice="denied">${text.deny}</button>
      </div>
      <div class="khe-analytics-status" aria-live="polite"></div>
    `;

    panel.addEventListener('click', (event) => {
      const button = event.target.closest('[data-consent-choice]');
      if (!button) return;

      const choice = button.dataset.consentChoice;
      writeChoice(choice);
      if (choice === 'granted') loadBeacon();
      panel.querySelector('.khe-analytics-status').textContent =
        choice === 'granted' ? text.savedAllowed : text.savedDenied;
      window.setTimeout(closeBanner, 650);
    });

    document.body.appendChild(panel);
  }

  function applyChoice() {
    if (readChoice() === 'granted') {
      loadBeacon();
      return;
    }

    if (!readChoice()) {
      showBanner();
    }
  }

  window.kheAnalyticsConsent = {
    show: showBanner,
    reset() {
      try {
        window.localStorage.removeItem(storageKey);
      } catch {
        // Ignore storage errors.
      }
      showBanner();
    },
  };

  document.addEventListener('click', (event) => {
    if (event.target.closest('[data-analytics-preferences]')) {
      showBanner();
    }
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyChoice, { once: true });
  } else {
    applyChoice();
  }
})();
