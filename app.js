/**
 * ============================================================
 *  HAYDN 3A — APPLICATION LOGIC
 *  No frameworks. Pure, fast, vanilla JS.
 * ============================================================
 */

'use strict';

/* ── STATE ─────────────────────────────────────────────────── */
const state = {
  currentCat:   'all',
  filteredPhotos: [],
  lbIndex:      0,
  zoom:         1,
  zoomMin:      1,
  zoomMax:      4,
  zoomStep:     0.5,
  heroIndex:    0,
  heroPhotos:   [],
  heroTimer:    null,
  isDragging:   false,
  dragStart:    { x: 0, y: 0 },
  panOffset:    { x: 0, y: 0 },
  panStart:     { x: 0, y: 0 },
};

/* ── DOM REFS ───────────────────────────────────────────────── */
const $ = id => document.getElementById(id);
const $$ = sel => document.querySelectorAll(sel);

const dom = {
  nav:          $('nav'),
  heroSlides:   $('heroSlides'),
  heroDots:     $('heroDots'),
  photoGrid:    $('photoGrid'),
  galleryCount: $('galleryCount'),
  lightbox:     $('lightbox'),
  lbImg:        $('lbImg'),
  lbMeta:       $('lbMeta'),
  lbClose:      $('lbClose'),
  lbPrev:       $('lbPrev'),
  lbNext:       $('lbNext'),
  zoomIn:       $('zoomIn'),
  zoomOut:      $('zoomOut'),
  zoomReset:    $('zoomReset'),
  zoomLevel:    $('zoomLevel'),
  lbImageWrap:  $('lbImageWrap'),
  themeToggle:  $('themeToggle'),
  navBurger:    $('navBurger'),
  mobileNav:    $('mobileNav'),
  aboutBio:     $('aboutBio'),
  aboutStats:   $('aboutStats'),
  footerCopy:   $('footerCopy'),
  footerSocial: $('footerSocial'),
};

/* ── INIT ───────────────────────────────────────────────────── */
function init() {
  populateSiteMeta();
  buildHero();
  buildGallery('all');
  bindTabButtons();
  bindLightbox();
  bindZoom();
  bindNav();
  bindTheme();
  bindCursor();
  bindKeyboard();
  startScrollObserver();
  startNavScrollListener();
}

/* ── SITE META ──────────────────────────────────────────────── */
function populateSiteMeta() {
  if (dom.aboutBio) dom.aboutBio.textContent = SITE.bio;

  // Stats
  const total = Object.values(PHOTOS).flat().length;
  const cats  = Object.keys(PHOTOS).length;
  if (dom.aboutStats) {
    dom.aboutStats.innerHTML = `
      <div><div class="stat-num">${total}</div><div class="stat-label">Photographs</div></div>
      <div><div class="stat-num">${cats}</div><div class="stat-label">Disciplines</div></div>
      <div><div class="stat-num">∞</div><div class="stat-label">Passion</div></div>
    `;
  }

  // Footer
  if (dom.footerCopy) {
    dom.footerCopy.textContent = `© ${new Date().getFullYear()} ${SITE.name} · All rights reserved`;
  }

  // Social links
  if (dom.footerSocial) {
    const icons = { instagram: 'IG', twitter: 'TW', email: '@' };
    let html = '';
    for (const [key, url] of Object.entries(SITE.social)) {
      if (url && url !== '#') {
        html += `<a href="${escHtml(url)}" aria-label="${escHtml(key)}" rel="noopener noreferrer" target="_blank">${icons[key] || key}</a>`;
      }
    }
    dom.footerSocial.innerHTML = html;
  }
}

/* ── HERO SLIDESHOW ─────────────────────────────────────────── */
function buildHero() {
  // Collect featured photos from all categories
  state.heroPhotos = Object.values(PHOTOS).flat().filter(p => p.featured);
  if (!state.heroPhotos.length) {
    // fallback: use first of each category
    state.heroPhotos = Object.values(PHOTOS).map(arr => arr[0]).filter(Boolean);
  }
  if (!state.heroPhotos.length) return;

  // Build slides
  dom.heroSlides.innerHTML = '';
  dom.heroDots.innerHTML   = '';

  state.heroPhotos.forEach((photo, i) => {
    const slide = document.createElement('div');
    slide.className = 'hero-slide' + (i === 0 ? ' active' : '');
    slide.style.backgroundImage = `url('${escHtml(photo.src)}')`;
    slide.setAttribute('aria-label', photo.title || '');
    dom.heroSlides.appendChild(slide);

    const dot = document.createElement('button');
    dot.className = 'hero-dot' + (i === 0 ? ' active' : '');
    dot.setAttribute('role', 'tab');
    dot.setAttribute('aria-label', `Slide ${i + 1}: ${photo.title || ''}`);
    dot.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
    dot.addEventListener('click', () => goToHeroSlide(i));
    dom.heroDots.appendChild(dot);
  });

  startHeroTimer();
}

function goToHeroSlide(index) {
  const slides = dom.heroSlides.querySelectorAll('.hero-slide');
  const dots   = dom.heroDots.querySelectorAll('.hero-dot');
  if (!slides.length) return;
  slides[state.heroIndex].classList.remove('active');
  dots[state.heroIndex].classList.remove('active');
  dots[state.heroIndex].setAttribute('aria-selected', 'false');
  state.heroIndex = (index + slides.length) % slides.length;
  slides[state.heroIndex].classList.add('active');
  dots[state.heroIndex].classList.add('active');
  dots[state.heroIndex].setAttribute('aria-selected', 'true');
}

function startHeroTimer() {
  clearInterval(state.heroTimer);
  state.heroTimer = setInterval(() => {
    goToHeroSlide(state.heroIndex + 1);
  }, 5500);
}

/* ── GALLERY ────────────────────────────────────────────────── */
function buildGallery(cat) {
  state.currentCat = cat;

  if (cat === 'all') {
    state.filteredPhotos = Object.entries(PHOTOS).flatMap(([category, photos]) =>
      photos.map(p => ({ ...p, category }))
    );
  } else {
    state.filteredPhotos = (PHOTOS[cat] || []).map(p => ({ ...p, category: cat }));
  }

  if (dom.galleryCount) {
    dom.galleryCount.textContent = `${state.filteredPhotos.length} photograph${state.filteredPhotos.length !== 1 ? 's' : ''}`;
  }

  dom.photoGrid.innerHTML = '';

  if (!state.filteredPhotos.length) {
    dom.photoGrid.innerHTML = `<p style="color:var(--text-dim);font-size:0.75rem;letter-spacing:0.1em;padding:3rem 0;">No photos yet — add some in photos.js</p>`;
    return;
  }

  state.filteredPhotos.forEach((photo, i) => {
    const card = buildCard(photo, i);
    dom.photoGrid.appendChild(card);
  });

  // Stagger appearance
  setTimeout(() => {
    dom.photoGrid.querySelectorAll('.photo-card').forEach((card, i) => {
      setTimeout(() => card.classList.add('visible'), i * 60);
    });
  }, 50);
}

function buildCard(photo, index) {
  const card = document.createElement('article');
  card.className = 'photo-card';
  card.setAttribute('role', 'listitem');
  card.setAttribute('tabindex', '0');
  card.setAttribute('aria-label', photo.title || `Photo ${index + 1}`);

  const img = document.createElement('img');
  img.loading = 'lazy';
  img.decoding = 'async';
  img.alt = photo.title || '';
  img.src = photo.src;
  // Prevent right-click save
  img.addEventListener('contextmenu', e => e.preventDefault());
  img.addEventListener('dragstart',   e => e.preventDefault());
  img.style.pointerEvents = 'none';  // extra layer: drag protection

  const overlay = document.createElement('div');
  overlay.className = 'photo-card-overlay';
  overlay.innerHTML = `
    <div class="photo-card-info">
      <h3>${escHtml(photo.title || '')}</h3>
      <span>${escHtml(photo.location || photo.category || '')}</span>
    </div>
  `;

  const zoomBtn = document.createElement('div');
  zoomBtn.className = 'photo-card-zoom';
  zoomBtn.innerHTML = '⊕';
  zoomBtn.setAttribute('aria-hidden', 'true');

  card.appendChild(img);
  card.appendChild(overlay);
  card.appendChild(zoomBtn);

  card.addEventListener('click', () => openLightbox(index));
  card.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openLightbox(index); }
  });

  return card;
}

/* ── LIGHTBOX ───────────────────────────────────────────────── */
function openLightbox(index) {
  state.lbIndex = index;
  renderLightboxPhoto();
  dom.lightbox.classList.add('open');
  dom.lightbox.removeAttribute('style');
  document.body.style.overflow = 'hidden';
  dom.lightbox.focus();
  resetZoom();
}

function closeLightbox() {
  dom.lightbox.classList.remove('open');
  document.body.style.overflow = '';
  resetZoom();
}

function renderLightboxPhoto() {
  const photo = state.filteredPhotos[state.lbIndex];
  if (!photo) return;

  dom.lbImg.src = photo.src;
  dom.lbImg.alt = photo.title || '';

  // Prevent download / context-menu in lightbox too
  dom.lbImg.addEventListener('contextmenu', e => e.preventDefault(), { once: false });

  // Prev / next visibility
  dom.lbPrev.style.visibility = state.lbIndex > 0 ? 'visible' : 'hidden';
  dom.lbNext.style.visibility = state.lbIndex < state.filteredPhotos.length - 1 ? 'visible' : 'hidden';

  // Meta
  const parts = [];
  if (photo.location) parts.push(`<span>📍 <b>${escHtml(photo.location)}</b></span>`);
  if (photo.date)     parts.push(`<span>📅 <b>${escHtml(photo.date)}</b></span>`);
  if (photo.gear)     parts.push(`<span>📷 <b>${escHtml(photo.gear)}</b></span>`);

  dom.lbMeta.innerHTML = `
    <h2>${escHtml(photo.title || '')}</h2>
    <div class="lb-meta-row">${parts.join('')}</div>
  `;
}

function lbNavigate(direction) {
  const newIndex = state.lbIndex + direction;
  if (newIndex < 0 || newIndex >= state.filteredPhotos.length) return;
  state.lbIndex = newIndex;
  renderLightboxPhoto();
  resetZoom();
}

function bindLightbox() {
  dom.lbClose.addEventListener('click', closeLightbox);
  dom.lbPrev.addEventListener('click', () => lbNavigate(-1));
  dom.lbNext.addEventListener('click', () => lbNavigate(1));

  // Click outside image to close
  dom.lightbox.addEventListener('click', e => {
    if (e.target === dom.lightbox) closeLightbox();
  });

  // Touch swipe
  let touchStartX = 0;
  dom.lightbox.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; }, { passive: true });
  dom.lightbox.addEventListener('touchend', e => {
    const diff = touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) lbNavigate(diff > 0 ? 1 : -1);
  }, { passive: true });
}

/* ── ZOOM ───────────────────────────────────────────────────── */
function applyZoom() {
  const pct = Math.round(state.zoom * 100);
  dom.lbImg.style.transform = `translate(${state.panOffset.x}px, ${state.panOffset.y}px) scale(${state.zoom})`;
  dom.zoomLevel.textContent = `${pct}%`;
  dom.lbImg.style.cursor = state.zoom > 1 ? 'grab' : 'default';
}

function resetZoom() {
  state.zoom = 1;
  state.panOffset = { x: 0, y: 0 };
  applyZoom();
}

function clampPan() {
  if (state.zoom <= 1) { state.panOffset = { x: 0, y: 0 }; return; }
  const wrap = dom.lbImageWrap.getBoundingClientRect();
  const maxX = (wrap.width  * (state.zoom - 1)) / 2;
  const maxY = (wrap.height * (state.zoom - 1)) / 2;
  state.panOffset.x = Math.max(-maxX, Math.min(maxX, state.panOffset.x));
  state.panOffset.y = Math.max(-maxY, Math.min(maxY, state.panOffset.y));
}

function bindZoom() {
  dom.zoomIn.addEventListener('click', () => {
    state.zoom = Math.min(state.zoomMax, state.zoom + state.zoomStep);
    clampPan();
    applyZoom();
  });
  dom.zoomOut.addEventListener('click', () => {
    state.zoom = Math.max(state.zoomMin, state.zoom - state.zoomStep);
    clampPan();
    applyZoom();
  });
  dom.zoomReset.addEventListener('click', resetZoom);

  // Wheel zoom
  dom.lbImageWrap.addEventListener('wheel', e => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? state.zoomStep : -state.zoomStep;
    state.zoom = Math.min(state.zoomMax, Math.max(state.zoomMin, state.zoom + delta));
    clampPan();
    applyZoom();
  }, { passive: false });

  // Drag to pan
  dom.lbImg.addEventListener('mousedown', e => {
    if (state.zoom <= 1) return;
    e.preventDefault();
    state.isDragging = true;
    state.panStart = { x: e.clientX - state.panOffset.x, y: e.clientY - state.panOffset.y };
    dom.lbImg.style.cursor = 'grabbing';
  });
  window.addEventListener('mousemove', e => {
    if (!state.isDragging) return;
    state.panOffset = { x: e.clientX - state.panStart.x, y: e.clientY - state.panStart.y };
    clampPan();
    applyZoom();
  });
  window.addEventListener('mouseup', () => {
    if (!state.isDragging) return;
    state.isDragging = false;
    dom.lbImg.style.cursor = state.zoom > 1 ? 'grab' : 'default';
  });

  // Pinch-to-zoom (touch)
  let lastDist = 0;
  dom.lbImageWrap.addEventListener('touchstart', e => {
    if (e.touches.length === 2) {
      lastDist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
    }
  }, { passive: true });
  dom.lbImageWrap.addEventListener('touchmove', e => {
    if (e.touches.length === 2) {
      e.preventDefault();
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const scale = dist / lastDist;
      state.zoom = Math.min(state.zoomMax, Math.max(state.zoomMin, state.zoom * scale));
      lastDist = dist;
      clampPan();
      applyZoom();
    }
  }, { passive: false });
}

/* ── TAB BUTTONS ────────────────────────────────────────────── */
function bindTabButtons() {
  $$('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      $$('.tab-btn').forEach(b => { b.classList.remove('active'); b.setAttribute('aria-selected', 'false'); });
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');
      buildGallery(btn.dataset.cat);
    });
  });
}

/* ── KEYBOARD ───────────────────────────────────────────────── */
function bindKeyboard() {
  document.addEventListener('keydown', e => {
    if (!dom.lightbox.classList.contains('open')) return;
    switch (e.key) {
      case 'ArrowLeft':  lbNavigate(-1); break;
      case 'ArrowRight': lbNavigate(1);  break;
      case 'Escape':     closeLightbox(); break;
      case '+': case '=':
        state.zoom = Math.min(state.zoomMax, state.zoom + state.zoomStep);
        clampPan(); applyZoom(); break;
      case '-':
        state.zoom = Math.max(state.zoomMin, state.zoom - state.zoomStep);
        clampPan(); applyZoom(); break;
      case '0': resetZoom(); break;
    }
  });
}

/* ── THEME ──────────────────────────────────────────────────── */
function bindTheme() {
  // Persist theme preference
  const saved = localStorage.getItem('h3a-theme');
  if (saved) document.documentElement.setAttribute('data-theme', saved);

  dom.themeToggle.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('h3a-theme', next);
  });
}

/* ── NAV BEHAVIOUR ──────────────────────────────────────────── */
function bindNav() {
  dom.navBurger.addEventListener('click', () => {
    const isOpen = dom.mobileNav.classList.toggle('open');
    dom.navBurger.classList.toggle('open', isOpen);
    dom.navBurger.setAttribute('aria-expanded', String(isOpen));
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });
}
function closeMobileNav() {
  dom.mobileNav.classList.remove('open');
  dom.navBurger.classList.remove('open');
  dom.navBurger.setAttribute('aria-expanded', 'false');
  document.body.style.overflow = '';
}

function startNavScrollListener() {
  const nav = $('nav');
  const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 40);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

/* ── ACTIVE NAV LINK on scroll ─────────────────────────────── */
function startScrollObserver() {
  const sections = document.querySelectorAll('section[id], footer');
  const links    = document.querySelectorAll('.nav-links a');

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        links.forEach(l => l.classList.remove('active'));
        const match = document.querySelector(`.nav-links a[href="#${entry.target.id}"]`);
        if (match) match.classList.add('active');
      }
    });
  }, { threshold: 0.35 });

  sections.forEach(s => observer.observe(s));
}

/* ── CUSTOM CURSOR ──────────────────────────────────────────── */
function bindCursor() {
  // Only on non-touch devices
  if (window.matchMedia('(hover: none)').matches) return;

  const dot  = $('cursorDot');
  const ring = $('cursorRing');
  let ringX = 0, ringY = 0, dotX = 0, dotY = 0;
  let mx = 0, my = 0;

  window.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; }, { passive: true });

  function animateCursor() {
    dotX  += (mx - dotX)  * 0.9;
    dotY  += (my - dotY)  * 0.9;
    ringX += (mx - ringX) * 0.12;
    ringY += (my - ringY) * 0.12;

    dot.style.left  = dotX  + 'px';
    dot.style.top   = dotY  + 'px';
    ring.style.left = ringX + 'px';
    ring.style.top  = ringY + 'px';
    requestAnimationFrame(animateCursor);
  }
  animateCursor();

  const hoverEls = 'a, button, .photo-card, .tab-btn, .hero-dot';
  document.addEventListener('mouseover', e => {
    if (e.target.closest(hoverEls)) document.body.classList.add('cursor-hover');
  });
  document.addEventListener('mouseout', e => {
    if (e.target.closest(hoverEls)) document.body.classList.remove('cursor-hover');
  });
}

/* ── SECURITY: Disable devtools shortcuts (soft deterrent) ──── */
// Note: This is a UI-layer deterrent only. Determined users can always
// view source. For real image protection, watermark and host low-res.
document.addEventListener('keydown', e => {
  // Disable F12
  if (e.key === 'F12') { e.preventDefault(); return false; }
  // Disable Ctrl+Shift+I / Ctrl+U / Ctrl+S
  if (e.ctrlKey && e.shiftKey && ['i','I','j','J'].includes(e.key)) { e.preventDefault(); return false; }
  if (e.ctrlKey && ['u','U','s','S'].includes(e.key)) { e.preventDefault(); return false; }
});
// Disable right-click globally (images already have it disabled individually)
document.addEventListener('contextmenu', e => {
  if (e.target.tagName === 'IMG') e.preventDefault();
});

/* ── UTILITY ────────────────────────────────────────────────── */
function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/* ── BOOT ───────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', init);
