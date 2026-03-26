/**
 * Baumpflege F. Glüher – app.js
 * Hash-Router SPA | Vanilla JS | Alle Inhalte aus kunde.json
 */

document.addEventListener('DOMContentLoaded', async () => {

  // ── DOM-Helfer ────────────────────────────────────────────────────────────
  const $       = id  => document.getElementById(id);
  const setText = (id, val) => { const el = $(id); if (el) el.textContent = val; };
  const setAttr = (id, attr, val) => { const el = $(id); if (el) el.setAttribute(attr, val); };

  const VIEWPORT  = $('app-viewport');
  const HERO_EL   = $('hero');
  const NAV_LINKS = document.querySelectorAll('#main-nav a');

  // ─────────────────────────────────────────────────────────────────────────
  // 1. CSS-VARIABLEN AUS CONFIG INJIZIEREN
  // ─────────────────────────────────────────────────────────────────────────
  function applyCSSVars(config) {
    const root = document.documentElement.style;
    const f = config.farben || {};
    const varMap = {
      primaer:        '--color-primaer',
      primaer_dark:   '--color-primaer-dark',
      akzent:         '--color-akzent',
      akzent_hover:   '--color-akzent-hover',
      hintergrund:    '--color-bg',
      text:           '--color-text',
      text_gedaempft: '--color-text-muted',
      card_bg:        '--color-card-bg',
      footer_bg:      '--color-footer-bg',
    };
    Object.entries(varMap).forEach(([key, prop]) => {
      if (f[key]) root.setProperty(prop, f[key]);
    });
    const s = config.schriften || {};
    if (s.haupt) root.setProperty('--font-main', s.haupt);
    if (s.ui)    root.setProperty('--font-ui', s.ui);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 2. STATISCHE SHELL BEFÜLLEN
  //    – Logo-Bild aus logo_url
  //    – Hero-Hintergrund aus hero_bg
  //    – Firmennname, Footer-Copyright, CTA-Links
  // ─────────────────────────────────────────────────────────────────────────
  function populateShell(data) {
    const c    = data.config || {};
    const firm = c.firmenname || '';

    // Firmenname + Seitentitel
    setText('header-firmenname', firm);
    document.title = firm;
    setText('footer-copy', `© ${new Date().getFullYear()} ${firm}`);

    // ── Logo-Bild (logo_url) ────────────────────────────────────────────────
    const logoImg = $('logo-img');
    if (logoImg) {
      if (c.logo_url) {
        logoImg.src    = c.logo_url;
        logoImg.alt    = firm;
        logoImg.hidden = false;
      }
      // Kein logo_url → Element bleibt hidden; kein fallback nötig
    }

    // ── Hero-Hintergrund (hero_bg) ──────────────────────────────────────────
    // Schlüssel ist hero_bg; legacy-Fallback auf hero_bild falls vorhanden
    const heroBg = c.hero_bg || c.hero_bild || '';
    if (heroBg) {
      HERO_EL.style.backgroundImage = `url('${heroBg}')`;
    }

    // ── CTA-Links ───────────────────────────────────────────────────────────
    const telLink = c.telefon_link || '#';
    const waLink  = c.whatsapp_nummer
      ? `https://wa.me/${c.whatsapp_nummer}?text=${encodeURIComponent('Hallo, ich interessiere mich für Ihre Baumpflege-Leistungen.')}`
      : '#';

    ['hero-cta-tel', 'sticky-tel'].forEach(id => setAttr(id, 'href', telLink));
    ['hero-cta-wa',  'sticky-wa' ].forEach(id => setAttr(id, 'href', waLink));

    // ── Hero-Texte ──────────────────────────────────────────────────────────
    const home = (data.pages || {}).home || {};
    setText('hero-titel',   home.hero_titel   || '');
    setText('hero-subline', home.hero_subline || '');
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 3. PARALLAX (rAF-gedrosselt)
  //    Nur auf #home aktiv. background-attachment:fixed absichtlich vermieden
  //    – iOS Safari ignoriert es auf nicht-body-Elementen vollständig.
  // ─────────────────────────────────────────────────────────────────────────
  let parallaxActive = false;
  let rafPending     = false;

  function runParallax() {
    if (parallaxActive && HERO_EL && !HERO_EL.hidden) {
      // 0.32 = Parallax-Stärke: sanft, nicht ablenkend
      HERO_EL.style.backgroundPositionY = `calc(50% + ${window.scrollY * 0.32}px)`;
    }
    rafPending = false;
  }

  window.addEventListener('scroll', () => {
    if (!rafPending) {
      requestAnimationFrame(runParallax);
      rafPending = true;
    }
  }, { passive: true });

  // ─────────────────────────────────────────────────────────────────────────
  // 4. REVEAL-ON-SCROLL  (IntersectionObserver)
  //    Wird nach jedem View-Render aufgerufen.
  //    Alle Elemente mit .reveal-Klasse werden beobachtet.
  //    Stagger: jedes Element bekommt per JS ein individuelles transition-delay.
  // ─────────────────────────────────────────────────────────────────────────
  function initReveal() {
    const els = VIEWPORT.querySelectorAll('.reveal');
    if (!els.length) return;

    // Threshold 0.1: Element muss 10 % sichtbar sein bevor es eingeblendet wird
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('visible');
        obs.unobserve(entry.target); // Einmalig feuern
      });
    }, { threshold: 0.1 });

    els.forEach((el, i) => {
      // Stagger-Delay: max 400 ms damit der letzte Block nicht zu lange wartet
      el.style.transitionDelay = `${Math.min(i * 0.07, 0.4)}s`;
      obs.observe(el);
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 5. STICKY-HEADER SCROLL-KLASSE (IntersectionObserver auf Sentinel)
  // ─────────────────────────────────────────────────────────────────────────
  function setupStickyHeader() {
    const header   = $('site-header');
    const sentinel = document.createElement('div');
    sentinel.style.cssText = 'position:absolute;top:0;height:1px;width:1px;pointer-events:none;';
    document.body.prepend(sentinel);
    new IntersectionObserver(
      ([e]) => header.classList.toggle('scrolled', !e.isIntersecting),
      { rootMargin: '-1px 0px 0px 0px', threshold: 0 }
    ).observe(sentinel);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 6. MOBILE NAV TOGGLE
  // ─────────────────────────────────────────────────────────────────────────
  function setupMobileNav() {
    const toggle = $('nav-toggle');
    const nav    = $('main-nav');
    if (!toggle || !nav) return;

    toggle.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(open));
    });

    nav.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        nav.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 7. ROUTER
  // ─────────────────────────────────────────────────────────────────────────
  const ROUTES = {
    '#home':       renderHome,
    '#ueber-uns':  renderUeberUns,
    '#leistungen': renderLeistungen,
    '#galerie':    renderGalerie,
    '#rechtliches':renderRechtliches,
  };

  function router(data) {
    const hash   = location.hash || '#home';
    const isHome = hash === '#home';

    // Aktiver Nav-Link markieren
    NAV_LINKS.forEach(a => a.classList.toggle('active', a.getAttribute('href') === hash));

    // Hero ein-/ausblenden + Parallax-Flag steuern
    HERO_EL.hidden = !isHome;
    parallaxActive = isHome;
    if (isHome) HERO_EL.style.backgroundPositionY = 'center';

    // Mobile Nav schließen
    const nav = $('main-nav');
    const tog = $('nav-toggle');
    if (nav) nav.classList.remove('open');
    if (tog) tog.setAttribute('aria-expanded', 'false');

    // Viewport zum Seitenanfang + View rendern
    window.scrollTo({ top: 0, behavior: 'instant' });
    (ROUTES[hash] || renderHome)(data);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 8. VIEW-RENDERER: HOME (Bento-Grid)
  // ─────────────────────────────────────────────────────────────────────────
  function renderHome(data) {
    const p = (data.pages || {}).home;
    if (!p) { VIEWPORT.innerHTML = ''; return; }

    const items = (p.leistungen_kurz || []).map((item, i) => `
      <article class="bento-item bento-item--${i} reveal">
        <span class="bento-icon" aria-hidden="true">${escHtml(item.icon || '')}</span>
        <h3>${escHtml(item.titel)}</h3>
        <p>${escHtml(item.kurztext)}</p>
        <a href="#leistungen" class="bento-link">Details ansehen →</a>
      </article>
    `).join('');

    VIEWPORT.innerHTML = `
      <section class="view-section">
        <div class="container">
          <h2 class="section-title reveal">Was ich für Sie tue</h2>
          <div class="bento-grid">${items}</div>
          <div class="section-cta reveal">
            <a href="#leistungen" class="btn btn-outline">Alle Leistungen im Detail →</a>
          </div>
        </div>
      </section>
    `;

    initReveal();
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 9. VIEW-RENDERER: ÜBER UNS
  // ─────────────────────────────────────────────────────────────────────────
  function renderUeberUns(data) {
    const p = (data.pages || {}).ueber_uns;
    if (!p) { VIEWPORT.innerHTML = ''; return; }

    const paragraphs = (p.text || '').split('\n\n')
      .filter(Boolean)
      .map(para => `<p class="reveal">${escHtml(para).replace(/\n/g, '<br>')}</p>`)
      .join('');

    const zerts = (p.zertifikate || [])
      .map(z => `<li>${escHtml(z)}</li>`)
      .join('');

    VIEWPORT.innerHTML = `
      <section class="view-section">
        <div class="container">
          <h2 class="section-title reveal">${escHtml(p.titel || 'Über mich')}</h2>
          <div class="ueber-layout">
            <div class="ueber-text">${paragraphs}</div>
            ${zerts ? `
              <aside class="ueber-zertifikate reveal" aria-label="Zertifikate und Qualifikationen">
                <h3>Zertifikate &amp; Qualifikationen</h3>
                <ul class="zertifikat-list">${zerts}</ul>
              </aside>
            ` : ''}
          </div>
        </div>
      </section>
    `;

    initReveal();
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 10. VIEW-RENDERER: LEISTUNGEN DETAIL
  // ─────────────────────────────────────────────────────────────────────────
  function renderLeistungen(data) {
    const p = (data.pages || {}).leistungen_detail;
    if (!p || !Array.isArray(p.liste)) { VIEWPORT.innerHTML = ''; return; }

    const cards = p.liste.map(item => `
      <article class="leistung-card reveal">
        <h3>${escHtml(item.titel)}</h3>
        <p>${escHtml(item.desc)}</p>
      </article>
    `).join('');

    VIEWPORT.innerHTML = `
      <section class="view-section">
        <div class="container">
          <h2 class="section-title reveal">Meine Leistungen</h2>
          <div class="leistungen-grid">${cards}</div>
        </div>
      </section>
    `;

    initReveal();
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 11. VIEW-RENDERER: GALERIE
  // ─────────────────────────────────────────────────────────────────────────
  function renderGalerie(data) {
    const p = (data.pages || {}).galerie;
    if (!p) { VIEWPORT.innerHTML = ''; return; }

    const bilder = (p.bilder || []).map(b => `
      <figure class="galerie-item reveal">
        <img
          src="${escHtml(b.src)}"
          alt="${escHtml(b.alt)}"
          loading="lazy"
          decoding="async"
          onerror="this.closest('.galerie-item').classList.add('img-error')"
        />
        <figcaption>${escHtml(b.alt)}</figcaption>
      </figure>
    `).join('');

    VIEWPORT.innerHTML = `
      <section class="view-section">
        <div class="container">
          <h2 class="section-title reveal">${escHtml(p.titel || 'Galerie')}</h2>
          <div class="galerie-grid">${bilder}</div>
        </div>
      </section>
    `;

    initReveal();
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 12. VIEW-RENDERER: RECHTLICHES (Impressum + Datenschutz)
  // ─────────────────────────────────────────────────────────────────────────
  function renderRechtliches(data) {
    const p = (data.pages || {}).rechtliches;
    if (!p) { VIEWPORT.innerHTML = ''; return; }

    function fmtText(raw) {
      return (raw || '').split('\n\n')
        .filter(Boolean)
        .map(para => `<p class="reveal">${escHtml(para).replace(/\n/g, '<br>')}</p>`)
        .join('');
    }

    VIEWPORT.innerHTML = `
      <section class="view-section">
        <div class="container">
          <div class="rechtliches-container">
            <div class="rechtliches-block">
              <h2 class="section-title reveal">${escHtml(p.impressum_titel || 'Impressum')}</h2>
              <div class="rechtliches-text">${fmtText(p.impressum_text)}</div>
            </div>
            <div class="rechtliches-block">
              <h2 class="section-title reveal">${escHtml(p.datenschutz_titel || 'Datenschutz')}</h2>
              <div class="rechtliches-text">${fmtText(p.datenschutz_text)}</div>
            </div>
          </div>
        </div>
      </section>
    `;

    initReveal();
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 13. XSS-SCHUTZ
  // ─────────────────────────────────────────────────────────────────────────
  function escHtml(str) {
    return String(str ?? '')
      .replace(/&/g,  '&amp;')
      .replace(/</g,  '&lt;')
      .replace(/>/g,  '&gt;')
      .replace(/"/g,  '&quot;')
      .replace(/'/g,  '&#039;');
  }

  // ─────────────────────────────────────────────────────────────────────────
  // BOOTSTRAP
  // ─────────────────────────────────────────────────────────────────────────
  try {
    const response = await fetch('./kunde.json');
    if (!response.ok) throw new Error(`HTTP ${response.status} – kunde.json nicht geladen`);
    const data = await response.json();

    applyCSSVars(data.config || {});
    populateShell(data);
    setupMobileNav();
    setupStickyHeader();

    window.addEventListener('hashchange', () => router(data));
    router(data);

  } catch (err) {
    console.error('[app.js] Kritischer Ladefehler:', err.message);
    VIEWPORT.innerHTML = `
      <div style="padding:3rem 1.5rem;font-family:monospace;font-size:.875rem;color:#b91c1c;max-width:600px;margin:0 auto;">
        <strong>Fehler beim Laden der Seiteninhalte:</strong><br>${err.message}<br><br>
        Stellen Sie sicher, dass <code>kunde.json</code> im gleichen Verzeichnis liegt
        und der Dateiname exakt übereinstimmt.
      </div>
    `;
    ['site-header', 'hero', 'site-footer', 'sticky-bar'].forEach(id => {
      const el = $(id);
      if (el) el.hidden = true;
    });
  }

});
