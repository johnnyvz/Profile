"use strict";
/**
 * Johan van Zyl — personal profile site.
 *
 * Vanilla TypeScript, no runtime dependencies.
 * Compiled to `js/main.js` via `npm run build`.
 */
const THEME_KEY = 'theme';
const ROTATE_INTERVAL_MS = 2800;
const SCROLL_THRESHOLD = 12;
/* ------------------------------------------------------------------ utils */
function qs(selector, root = document) {
    return root.querySelector(selector);
}
function qsa(selector, root = document) {
    return Array.from(root.querySelectorAll(selector));
}
function safeReadStore(key) {
    try {
        return window.localStorage.getItem(key);
    }
    catch {
        return null;
    }
}
function safeWriteStore(key, value) {
    try {
        window.localStorage.setItem(key, value);
    }
    catch {
        /* Storage disabled (private mode) — the theme still applies for this session. */
    }
}
/* --------------------------------------------------------------- theming */
const rootEl = document.documentElement;
const themeToggle = qs('#theme-toggle');
const themeColorMeta = qs('meta[name="theme-color"]');
const systemLight = window.matchMedia('(prefers-color-scheme: light)');
function storedTheme() {
    const value = safeReadStore(THEME_KEY);
    return value === 'light' || value === 'dark' ? value : null;
}
function currentTheme() {
    return rootEl.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
}
function syncMetaAndToggle(theme) {
    if (themeColorMeta) {
        themeColorMeta.setAttribute('content', theme === 'light' ? '#f6f7fb' : '#0a0c11');
    }
    if (themeToggle) {
        const isLight = theme === 'light';
        themeToggle.setAttribute('aria-pressed', String(isLight));
        themeToggle.setAttribute('aria-label', isLight ? 'Switch to dark theme' : 'Switch to light theme');
    }
}
function applyTheme(theme, persist) {
    rootEl.setAttribute('data-theme', theme);
    if (persist) {
        safeWriteStore(THEME_KEY, theme);
    }
    syncMetaAndToggle(theme);
}
if (themeToggle) {
    themeToggle.addEventListener('click', () => {
        applyTheme(currentTheme() === 'dark' ? 'light' : 'dark', true);
    });
}
syncMetaAndToggle(currentTheme());
// Follow OS changes only while the visitor has not picked a theme explicitly.
systemLight.addEventListener('change', (event) => {
    if (storedTheme()) {
        return;
    }
    applyTheme(event.matches ? 'light' : 'dark', false);
});
/* ------------------------------------------------------------ navigation */
const nav = qs('#nav');
const burger = qs('#burger');
const navPanel = qs('#nav-links');
const mobileNavQuery = window.matchMedia('(max-width: 960px)');
function isNavOpen() {
    return burger?.getAttribute('aria-expanded') === 'true';
}
function setNavOpen(open) {
    if (!burger || !navPanel) {
        return;
    }
    burger.setAttribute('aria-expanded', String(open));
    navPanel.classList.toggle('is-open', open);
}
if (burger && navPanel) {
    burger.addEventListener('click', () => {
        setNavOpen(!isNavOpen());
    });
    // Tapping a destination always closes the mobile panel.
    qsa('.nav__link', navPanel).forEach((link) => {
        link.addEventListener('click', () => setNavOpen(false));
    });
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && isNavOpen()) {
            setNavOpen(false);
            burger.focus();
        }
    });
    document.addEventListener('pointerdown', (event) => {
        if (!isNavOpen()) {
            return;
        }
        const target = event.target;
        if (target instanceof Node && !navPanel.contains(target) && !burger.contains(target)) {
            setNavOpen(false);
        }
    });
    const handleBreakpointChange = (event) => {
        if (!event.matches) {
            setNavOpen(false);
        }
    };
    mobileNavQuery.addEventListener('change', handleBreakpointChange);
}
function handleScroll() {
    if (!nav) {
        return;
    }
    nav.classList.toggle('is-scrolled', window.scrollY > SCROLL_THRESHOLD);
}
handleScroll();
window.addEventListener('scroll', handleScroll, { passive: true });
/* ------------------------------------------------------------ reveal in */
const revealTargets = qsa('[data-reveal]');
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
function settle(element) {
    // Once the reveal has finished, drop the animated state entirely. This keeps
    // gradient text (`background-clip: text`) from lingering in a composited
    // layer, where some browsers leave stale pixels behind.
    element.removeAttribute('data-reveal');
    element.style.removeProperty('--reveal-delay');
}
function reveal(element) {
    element.classList.add('is-visible');
    element.addEventListener('transitionend', () => settle(element), { once: true });
}
if (prefersReducedMotion || typeof IntersectionObserver === 'undefined') {
    revealTargets.forEach((element) => {
        element.classList.add('is-visible');
        settle(element);
    });
}
else {
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) {
                return;
            }
            reveal(entry.target);
            revealObserver.unobserve(entry.target);
        });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    revealTargets.forEach((element) => revealObserver.observe(element));
}
/* -------------------------------------------------------------- footer */
const yearEl = qs('#year');
if (yearEl) {
    yearEl.textContent = String(new Date().getFullYear());
}
/* -------------------------------------------------------- contact address */
/**
 * The address lives split across `data-email-user` / `data-email-domain` on
 * `<body>` and is only joined here, so no page source ever contains a usable
 * address for scrapers to harvest. It serves exactly one purpose: filling the
 * `mailto:` target of the "Email me" links, which hands the address to the
 * visitor's own mail client. It is never rendered as text on the page and never
 * written to the clipboard.
 */
const emailUser = document.body.dataset.emailUser ?? '';
const emailDomain = document.body.dataset.emailDomain ?? '';
const contactEmail = emailUser && emailDomain ? `${emailUser}@${emailDomain}` : '';
if (contactEmail) {
    qsa('[data-mailto]').forEach((link) => {
        link.setAttribute('href', `mailto:${contactEmail}`);
    });
}
/* ------------------------------------------------------- tagline rotator */
const rotator = qs('#rotator');
const phrases = [
    'modern solutions for legacy systems',
    'scalable .NET and Angular applications',
    'automation that removes manual work',
    'microservices other teams can reuse',
];
if (rotator && phrases.length > 1) {
    let index = 0;
    window.setInterval(() => {
        index = (index + 1) % phrases.length;
        // Restart the entrance animation on every swap.
        rotator.classList.remove('is-swapping');
        void rotator.offsetWidth;
        rotator.textContent = phrases[index];
        rotator.classList.add('is-swapping');
    }, ROTATE_INTERVAL_MS);
}
/* ------------------------------------------------------- learning cloud */
qsa('.cloud__chip').forEach((chip, index) => {
    // Deterministic pseudo-scatter: the arrangement looks hand-placed but is
    // identical on every load, so nothing jumps around between visits.
    const angle = index * 2.39996; // golden angle in radians
    const spread = 6 + (index % 3) * 2; // 6, 8 or 10px
    chip.style.setProperty('--scatter-x', `${(Math.sin(angle) * spread).toFixed(1)}px`);
    chip.style.setProperty('--scatter-y', `${(Math.cos(angle * 1.3) * spread * 0.8).toFixed(1)}px`);
    chip.style.setProperty('--scatter-rotate', `${(Math.sin(angle * 0.7) * 2.6).toFixed(1)}deg`);
    // Varied durations plus negative delays keep the drift from moving in lockstep.
    chip.style.setProperty('--drift-duration', `${(8 + (index % 5) * 1.4).toFixed(1)}s`);
    chip.style.setProperty('--drift-delay', `-${((index % 7) * 1.35).toFixed(2)}s`);
});
/* ----------------------------------------------------- pointer-tracking */
const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
if (canHover && !prefersReducedMotion) {
    qsa('[data-glow]').forEach((card) => {
        card.addEventListener('pointermove', (event) => {
            const rect = card.getBoundingClientRect();
            card.style.setProperty('--mx', `${event.clientX - rect.left}px`);
            card.style.setProperty('--my', `${event.clientY - rect.top}px`);
        });
        card.addEventListener('pointerleave', () => {
            card.style.removeProperty('--mx');
            card.style.removeProperty('--my');
        });
    });
}
