/**
 * @file main.js
 * @description Musonic product showcase — progressive enhancement scripts.
 *   Handles i18n (EN/FR), scroll-reveal, sticky nav, screenshot tabs, and
 *   ambient hero parallax. No external runtime dependencies.
 * @author DoodzProg
 * @version 0.9.4
 * @license CC-BY-NC-4.0
 */

'use strict';

/* ─── i18n ───────────────────────────────────────────────────────────────────── */

const TRANSLATIONS = {
  en: {
    'nav.features':    'Features',
    'nav.screenshots': 'Screenshots',
    'nav.setup':       'Setup',
    'nav.stack':       'Stack',

    'hero.badge':          'v0.9.4 · Now available',
    'hero.headline':       'Self-hosted music,',
    'hero.headline.accent':'beautifully played.',
    'hero.subline':        'Musonic is an open-source mobile client for Navidrome &amp; Subsonic, with synced lyrics, ambient artwork visuals, and zero compromises.',
    'hero.dl.android':     'Download for Android',
    'hero.dl.ios':         'iOS Sideload',

    'features.label':    'Features',
    'features.title':    'Everything your music deserves.',
    'features.subtitle': "Designed for self-hosters who don't want to compromise on experience.",
    'features.f1.title': 'Navidrome &amp; Subsonic',
    'features.f1.desc':  'Full compatibility with any Subsonic-API-compliant server. Your music library, on your hardware.',
    'features.f2.title': 'Synced Lyrics',
    'features.f2.desc':  'Real-time line-by-line lyrics with Spotify-style auto-scroll. Powered by Navidrome and LRCLIB as a fallback.',
    'features.f3.title': 'Ambient UI',
    'features.f3.desc':  'Dynamic backgrounds extracted from album artwork. Every track gets its own visual identity.',
    'features.f4.title': 'Offline Resilience',
    'features.f4.desc':  'Graceful degradation with connectivity monitoring. Cached data keeps the UI functional with no signal.',
    'features.f5.title': 'MMKV Storage',
    'features.f5.desc':  'Persistent state backed by MMKV, orders of magnitude faster than AsyncStorage for instant app resumption.',
    'features.f6.title': 'Multilingual',
    'features.f6.desc':  'English and French out of the box, with a clean i18n system ready for community-contributed translations.',

    'scr.label':    'Screenshots',
    'scr.title':    'See it in action.',
    'scr.subtitle': 'Captured on Samsung Galaxy S21 Ultra.',
    'scr.tab.player':    'Player',
    'scr.tab.browse':    'Browse',
    'scr.tab.library':   'Library',
    'scr.tab.playlists': 'Playlists',
    'scr.tab.more':      'More',
    'scr.cap.player_waves':    'Player · Waves',
    'scr.cap.player_classic':  'Player · Classic',
    'scr.cap.lyrics':          'Synced Lyrics',
    'scr.cap.queue':           'Queue',
    'scr.cap.home':            'Home',
    'scr.cap.search':          'Search',
    'scr.cap.album_detail':    'Album Detail',
    'scr.cap.artist_detail':   'Artist Detail',
    'scr.cap.library':         'Library',
    'scr.cap.sidebar':         'Sidebar',
    'scr.cap.playlist_options':'Playlist Options',
    'scr.cap.playlist_edit':   'Playlist Edit',
    'scr.cap.settings':        'Settings',

    'setup.label':       'Setup',
    'setup.title':       'Running in three steps.',
    'setup.subtitle':    'No account required. No cloud sync. Just your server and your music.',
    'setup.step1.title': 'Install Navidrome',
    'setup.step1.desc':  'Deploy your Navidrome or Subsonic-compatible server.',
    'setup.step2.title': 'Download Musonic',
    'setup.step2.desc':  'Grab the APK from GitHub Releases and install it on your Android device.',
    'setup.step3.title': 'Connect &amp; Play',
    'setup.step3.desc':  'Enter your server URL and credentials. Your library is ready.',

    'stack.label': 'Built with',
    'stack.title': 'Open, modern, and fast.',

    'cta.title':             'Ready to take back your music?',
    'cta.sub':               'Open source. Self-hosted. Yours.',
    'cta.download.android':  'Download for Android',
    'cta.download.ios':      'iOS Sideload',
    'cta.github':            'View on GitHub',
  },

  fr: {
    'nav.features':    'Fonctionnalités',
    'nav.screenshots': 'Captures',
    'nav.setup':       'Installation',
    'nav.stack':       'Stack',

    'hero.badge':          'v0.9.4 · Disponible maintenant',
    'hero.headline':       'Votre musique,',
    'hero.headline.accent':'magnifiquement jouée.',
    'hero.subline':        'Musonic est un client mobile open-source pour Navidrome &amp; Subsonic, avec paroles synchronisées, visuels ambiants et zéro compromis.',
    'hero.dl.android':     'Télécharger pour Android',
    'hero.dl.ios':         'Sideload iOS',

    'features.label':    'Fonctionnalités',
    'features.title':    'Tout ce que votre musique mérite.',
    'features.subtitle': "Conçu pour les auto-hébergeurs qui ne veulent pas de compromis.",
    'features.f1.title': 'Navidrome &amp; Subsonic',
    'features.f1.desc':  'Compatibilité totale avec tout serveur Subsonic. Votre bibliothèque musicale, sur votre matériel.',
    'features.f2.title': 'Paroles synchronisées',
    'features.f2.desc':  'Paroles ligne par ligne en temps réel façon Spotify. Propulsé par Navidrome et LRCLIB en fallback.',
    'features.f3.title': 'Interface ambiante',
    'features.f3.desc':  "Arrière-plans dynamiques extraits des pochettes d'albums. Chaque titre a sa propre identité visuelle.",
    'features.f4.title': 'Résilience hors-ligne',
    'features.f4.desc':  "Dégradation gracieuse avec surveillance de la connectivité. Les données en cache maintiennent l'UI sans signal.",
    'features.f5.title': 'Stockage MMKV',
    'features.f5.desc':  "État persistant via MMKV, des ordres de grandeur plus rapide qu'AsyncStorage pour une reprise instantanée.",
    'features.f6.title': 'Multilingue',
    'features.f6.desc':  'Anglais et français intégrés, avec un système i18n propre prêt pour les traductions communautaires.',

    'scr.label':    "Captures d'écran",
    'scr.title':    "Découvrez l'application.",
    'scr.subtitle': 'Capturé sur Samsung Galaxy S21 Ultra.',
    'scr.tab.player':    'Lecteur',
    'scr.tab.browse':    'Explorer',
    'scr.tab.library':   'Bibliothèque',
    'scr.tab.playlists': 'Playlists',
    'scr.tab.more':      'Plus',
    'scr.cap.player_waves':    'Lecteur · Waves',
    'scr.cap.player_classic':  'Lecteur · Classique',
    'scr.cap.lyrics':          'Paroles synchronisées',
    'scr.cap.queue':           "File d'attente",
    'scr.cap.home':            'Accueil',
    'scr.cap.search':          'Recherche',
    'scr.cap.album_detail':    'Détail Album',
    'scr.cap.artist_detail':   'Détail Artiste',
    'scr.cap.library':         'Bibliothèque',
    'scr.cap.sidebar':         'Menu latéral',
    'scr.cap.playlist_options':'Options Playlist',
    'scr.cap.playlist_edit':   'Modifier Playlist',
    'scr.cap.settings':        'Paramètres',

    'setup.label':       'Installation',
    'setup.title':       'Lancé en trois étapes.',
    'setup.subtitle':    'Aucun compte requis. Aucune synchronisation cloud. Juste votre serveur et votre musique.',
    'setup.step1.title': 'Installer Navidrome',
    'setup.step1.desc':  'Déployez votre serveur Navidrome ou compatible Subsonic.',
    'setup.step2.title': 'Télécharger Musonic',
    'setup.step2.desc':  "Récupérez l'APK depuis GitHub Releases et installez-le sur votre appareil Android.",
    'setup.step3.title': 'Connecter et lire',
    'setup.step3.desc':  "Entrez l'URL de votre serveur et vos identifiants. Votre bibliothèque est prête.",

    'stack.label': 'Construit avec',
    'stack.title': 'Ouvert, moderne et rapide.',

    'cta.title':             'Prêt à reprendre votre musique ?',
    'cta.sub':               'Open source. Auto-hébergé. À vous.',
    'cta.download.android':  'Télécharger pour Android',
    'cta.download.ios':      'Sideload iOS',
    'cta.github':            'Voir sur GitHub',
  },
};

let currentLang = localStorage.getItem('musonic-lang') || 'en';

function applyLanguage(lang) {
  const t = TRANSLATIONS[lang];
  if (!t) return;

  document.documentElement.lang = lang;
  currentLang = lang;
  localStorage.setItem('musonic-lang', lang);

  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.dataset.i18n;
    if (t[key] !== undefined) el.innerHTML = t[key];
  });

  // Update lang switcher active state
  document.querySelectorAll('.lang-opt').forEach((opt) => {
    opt.classList.toggle('active', opt.dataset.lang === lang);
  });
}

(function initI18n() {
  applyLanguage(currentLang);

  const btn = document.getElementById('lang-btn');
  if (!btn) return;

  btn.addEventListener('click', () => {
    applyLanguage(currentLang === 'en' ? 'fr' : 'en');
  });
})();

/* ─── Screenshot tab switching ───────────────────────────────────────────────── */

(function initScreenshotTabs() {
  const tabs = document.querySelectorAll('.scr-tab');
  if (!tabs.length) return;

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.tab;
      tabs.forEach((t) => {
        t.classList.toggle('active', t === tab);
        t.setAttribute('aria-selected', t === tab ? 'true' : 'false');
      });
      document.querySelectorAll('.scr-panel').forEach((panel) => {
        const isTarget = panel.id === `panel-${target}`;
        panel.classList.toggle('active', isTarget);
        isTarget ? panel.removeAttribute('hidden') : panel.setAttribute('hidden', '');
      });
    });
  });
})();

/* ─── Scroll-reveal via IntersectionObserver ─────────────────────────────────── */

(function initReveal() {
  const elements = document.querySelectorAll('.reveal');
  if (!elements.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
  );

  elements.forEach((el) => observer.observe(el));
})();

/* ─── Sticky Navigation ──────────────────────────────────────────────────────── */

(function initNav() {
  const nav = document.querySelector('.nav');
  if (!nav) return;

  function onScroll() {
    nav.classList.toggle('scrolled', window.scrollY > 60);
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();

/* ─── Smooth anchor scroll (Safari fallback) ─────────────────────────────────── */

(function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (event) => {
      const targetId = anchor.getAttribute('href').slice(1);
      const target = document.getElementById(targetId);
      if (!target) return;
      event.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
})();

/* ─── Ambient glow — mouse parallax on hero (desktop only) ──────────────────── */

(function initHeroParallax() {
  const hero = document.querySelector('.hero');
  if (!hero || window.matchMedia('(pointer: coarse)').matches) return;

  hero.addEventListener('mousemove', (event) => {
    const rect = hero.getBoundingClientRect();
    const x = Math.min(Math.max(((event.clientX - rect.left) / rect.width) * 100, 20), 80);
    const y = Math.min(Math.max(((event.clientY - rect.top) / rect.height) * 100, 5), 60);
    hero.style.setProperty('--hero-glow-pos', `${x}% ${y}%`);
  });

  hero.addEventListener('mouseleave', () => {
    hero.style.setProperty('--hero-glow-pos', '50% 0%');
  });
})();
