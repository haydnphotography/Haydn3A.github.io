/**
 * ============================================================
 *  HAYDN 3A — APPLICATION LOGIC  v2
 *  Canvas watermarking · Progress bar · Lightbox counter
 *  Contact form · Shield overlay · All protections
 * ============================================================
 */

'use strict';

/* ── STATE ─────────────────────────────────────────────────── */
const state = {
  currentCat:     'all',
  filteredPhotos: [],
  lbIndex:        0,
  zoom:           1,
  zoomMin:        1,
  zoomMax:        4,
  zoomStep:       0.5,
  heroIndex:      0,
  heroPhotos:     [],
  heroTimer:      null,
  isDragging:     false,
  panOffset:      { x: 0, y: 0 },
  panStart:       { x: 0, y: 0 },
  // Watermark cache: src → watermarked dataURL
  wmCache:        new Map(),
};

/* ── DOM REFS ───────────────────────────────────────────────── */
const $  = id  => document.getElementById(id);
const $$ = sel => document.querySelectorAll(sel);

const dom = {
  nav:          $('nav'),
  progressBar:  $('progressBar'),
  heroSlides:   $('heroSlides'),
  heroDots:     $('heroDots'),
  photoGrid:    $('photoGrid'),
  galleryCount: $('galleryCount'),
  lightbox:     $('lightbox'),
  lbCanvas:     $('lbCanvas'),
  lbMeta:       $('lbMeta'),
  lbCounter:    $('lbCounter'),
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
  contactItems: $('contactItems'),
  contactForm:  $('contactForm'),
  formSuccess:  $('formSuccess'),
};

/* ── INIT ───────────────────────────────────────────────────── */
function init() {
  animateProgressBar();
  populateSiteMeta();
  buildHero();
  bindHeroTouch();
  buildGallery('all');
  bindTabButtons();
  bindLightbox();
  bindZoom();
  bindNav();
  bindTheme();
  bindCursor();
  bindKeyboard();
  bindContactForm();
  startScrollObserver();
  startNavScrollListener();
  disableImageProtections();
}

/* ── PROGRESS BAR ───────────────────────────────────────────── */
function animateProgressBar() {
  const bar = dom.progressBar;
  if (!bar) return;
  bar.style.cssText = 'position:fixed;top:0;left:0;height:2px;width:0;background:var(--accent);z-index:9999;transition:width 0.4s ease;pointer-events:none;';
  // Fake progress: 0→70% while loading, 100% on load
  let prog = 0;
  const tick = setInterval(() => {
    prog = Math.min(prog + Math.random() * 15, 70);
    bar.style.width = prog + '%';
  }, 120);
  window.addEventListener('load', () => {
    clearInterval(tick);
    bar.style.width = '100%';
    setTimeout(() => { bar.style.opacity = '0'; setTimeout(() => bar.remove(), 400); }, 400);
  });
}

/* ── SITE META ──────────────────────────────────────────────── */
function populateSiteMeta() {
  if (dom.aboutBio) dom.aboutBio.textContent = SITE.bio;

  const total = Object.values(PHOTOS).flat().length;
  const cats  = Object.keys(PHOTOS).length;
  if (dom.aboutStats) {
    dom.aboutStats.innerHTML = `
      <div><div class="stat-num">${total}</div><div class="stat-label">Photographs</div></div>
      <div><div class="stat-num">${cats}</div><div class="stat-label">Disciplines</div></div>
      <div><div class="stat-num">∞</div><div class="stat-label">Passion</div></div>
    `;
  }
  if (dom.footerCopy) {
    dom.footerCopy.textContent = `© ${new Date().getFullYear()} ${SITE.name} · All rights reserved`;
  }
  if (dom.footerSocial) {
    const icons = { instagram: 'IG', twitter: 'TW', email: '✉' };
    let html = '';
    for (const [k, url] of Object.entries(SITE.social)) {
      if (url && url !== '#') {
        html += `<a href="${esc(url)}" aria-label="${esc(k)}" rel="noopener noreferrer" target="_blank">${icons[k] || k}</a>`;
      }
    }
    dom.footerSocial.innerHTML = html;
  }
  if (dom.contactItems) {
    let html = '';
    if (SITE.social.email && SITE.social.email !== '#') {
      html += `<div class="contact-item"><span class="ci-icon">✉</span><div><span class="ci-label">Email</span><a href="${esc(SITE.social.email)}" class="ci-value">${esc(SITE.social.email.replace('mailto:',''))}</a></div></div>`;
    }
    if (SITE.social.instagram && SITE.social.instagram !== '#') {
      html += `<div class="contact-item"><span class="ci-icon">IG</span><div><span class="ci-label">Instagram</span><a href="${esc(SITE.social.instagram)}" class="ci-value" rel="noopener" target="_blank">@haydn3a</a></div></div>`;
    }
    if (!html) html = `<div class="contact-item"><span class="ci-icon">✉</span><div><span class="ci-label">Email</span><span class="ci-value">Add your email in photos.js</span></div></div>`;
    dom.contactItems.innerHTML = html;
  }
}

/* ── WATERMARK ENGINE ───────────────────────────────────────── */
/**
 * Loads an image src, draws it to a canvas, stamps the
 * watermark text diagonally across it, and returns a
 * data URL of the result. Results are cached by src.
 */
function applyWatermark(src) {
  return new Promise((resolve, reject) => {
    if (state.wmCache.has(src)) { resolve(state.wmCache.get(src)); return; }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas  = document.createElement('canvas');
      const W = canvas.width  = img.naturalWidth  || img.width;
      const H = canvas.height = img.naturalHeight || img.height;
      const ctx = canvas.getContext('2d');

      // Draw the raw photo
      ctx.drawImage(img, 0, 0);

      // ── Watermark settings ────────────────────────────────
      const text      = '© HAYDN 3A';
      const fontSize  = Math.max(18, Math.round(Math.min(W, H) * 0.028));
      const font      = `${fontSize}px "Cormorant Garamond", Georgia, serif`;
      const opacity   = 0.30;   // adjust 0.0–1.0; lower = more subtle
      const spacing   = Math.round(Math.min(W, H) * 0.28); // gap between repeats
      const angle     = -30 * (Math.PI / 180);

      ctx.save();
      ctx.font        = font;
      ctx.fillStyle   = `rgba(255,255,255,${opacity})`;
      ctx.strokeStyle = `rgba(0,0,0,${opacity * 0.4})`;
      ctx.lineWidth   = fontSize * 0.06;
      ctx.textAlign   = 'center';
      ctx.textBaseline= 'middle';

      // Tile the watermark across the full image diagonally
      const diagonal = Math.sqrt(W * W + H * H);
      ctx.translate(W / 2, H / 2);
      ctx.rotate(angle);
      const cols = Math.ceil(diagonal / spacing) + 2;
      const rows = Math.ceil(diagonal / spacing) + 2;
      for (let r = -rows; r <= rows; r++) {
        for (let c = -cols; c <= cols; c++) {
          const x = c * spacing;
          const y = r * spacing;
          ctx.strokeText(text, x, y);
          ctx.fillText(text, x, y);
        }
      }
      ctx.restore();

      // A single, more prominent corner credit
      const credSize = Math.max(12, Math.round(Math.min(W, H) * 0.018));
      ctx.font        = `${credSize}px "DM Mono", monospace`;
      ctx.fillStyle   = `rgba(255,255,255,0.55)`;
      ctx.textAlign   = 'right';
      ctx.textBaseline= 'bottom';
      ctx.fillText('© HAYDN 3A · haydn3a.com', W - 14, H - 12);

      const dataURL = canvas.toDataURL('image/jpeg', 0.92);
      state.wmCache.set(src, dataURL);
      resolve(dataURL);
    };
    img.onerror = () => reject(new Error(`Failed to load: ${src}`));
    img.src = src;
  });
}

/* ── HERO SLIDESHOW ─────────────────────────────────────────── */
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function buildHero() {
  const allPhotos = Object.values(PHOTOS).flat();
  const numSlides = Math.min(6, allPhotos.length);
  state.heroPhotos = shuffleArray(allPhotos).slice(0, numSlides);
  if (!state.heroPhotos.length) return;

  dom.heroSlides.innerHTML = '';
  dom.heroDots.innerHTML   = '';

  state.heroPhotos.forEach((photo, i) => {
    const slide = document.createElement('div');
    slide.className = 'hero-slide' + (i === 0 ? ' active' : '');
    slide.style.backgroundImage = `url('${esc(photo.src)}')`;
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
  state.heroTimer = setInterval(() => goToHeroSlide(state.heroIndex + 1), 5500);
}

function bindHeroTouch() {
  let startX = 0;
  let startY = 0;
  let isSwiping = false;

  dom.heroSlides.addEventListener('touchstart', e => {
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
    isSwiping = true;
    clearInterval(state.heroTimer); // Pause auto-advance during swipe
  }, { passive: true });

  dom.heroSlides.addEventListener('touchmove', e => {
    if (!isSwiping) return;
    const deltaX = startX - e.touches[0].clientX;
    const deltaY = startY - e.touches[0].clientY;

    // Only consider horizontal swipes
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
      e.preventDefault(); // Prevent scrolling
    }
  }, { passive: false });

  dom.heroSlides.addEventListener('touchend', e => {
    if (!isSwiping) return;
    isSwiping = false;

    const endX = e.changedTouches[0].clientX;
    const deltaX = startX - endX;
    const deltaY = startY - e.changedTouches[0].clientY;

    // Only trigger swipe if horizontal movement is greater than vertical
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
      if (deltaX > 0) {
        // Swipe left - next slide
        goToHeroSlide(state.heroIndex + 1);
      } else {
        // Swipe right - previous slide
        goToHeroSlide(state.heroIndex - 1);
      }
    }

    // Restart timer after a short delay
    setTimeout(() => startHeroTimer(), 1000);
  }, { passive: true });
}

/* ── GALLERY ────────────────────────────────────────────────── */
function buildGallery(cat) {
  state.currentCat = cat;
  state.filteredPhotos = cat === 'all'
    ? Object.entries(PHOTOS).flatMap(([c, photos]) => photos.map(p => ({ ...p, category: c })))
    : (PHOTOS[cat] || []).map(p => ({ ...p, category: cat }));

  if (dom.galleryCount) {
    dom.galleryCount.textContent = `${state.filteredPhotos.length} photograph${state.filteredPhotos.length !== 1 ? 's' : ''}`;
  }
  dom.photoGrid.innerHTML = '';

  if (!state.filteredPhotos.length) {
    dom.photoGrid.innerHTML = `<p style="color:var(--text-dim);font-size:0.75rem;letter-spacing:0.1em;padding:3rem 0;">No photos yet — add some in photos.js</p>`;
    return;
  }

  state.filteredPhotos.forEach((photo, i) => dom.photoGrid.appendChild(buildCard(photo, i)));
  setTimeout(() => {
    dom.photoGrid.querySelectorAll('.photo-card').forEach((card, i) => {
      setTimeout(() => card.classList.add('visible'), i * 55);
    });
  }, 50);
}

function buildCard(photo, index) {
  const card = document.createElement('article');
  card.className = 'photo-card no-select';
  card.setAttribute('role', 'listitem');
  card.setAttribute('tabindex', '0');
  card.setAttribute('aria-label', photo.title || `Photo ${index + 1}`);

  // Use a canvas for the thumbnail too — watermarked from the start
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'width:100%;display:block;';
  canvas.setAttribute('aria-hidden', 'true');

  // Load image → watermark → draw into card canvas
  applyWatermark(photo.src).then(dataURL => {
    const img = new Image();
    img.onload = () => {
      canvas.width  = img.width;
      canvas.height = img.height;
      canvas.getContext('2d').drawImage(img, 0, 0);
    };
    img.src = dataURL;
  }).catch(() => {
    // Fallback: plain img if canvas/CORS fails (e.g. local file://)
    canvas.style.display = 'none';
    const fallback = document.createElement('img');
    fallback.src = photo.src;
    fallback.alt = photo.title || '';
    fallback.style.cssText = 'width:100%;display:block;pointer-events:none;';
    fallback.addEventListener('contextmenu', e => e.preventDefault());
    card.appendChild(fallback);
  });

  const overlay = document.createElement('div');
  overlay.className = 'photo-card-overlay';
  overlay.innerHTML = `
    <div class="photo-card-info">
      <h3>${esc(photo.title || '')}</h3>
      <span>${esc(photo.location || photo.category || '')}</span>
    </div>`;

  const zoomBtn = document.createElement('div');
  zoomBtn.className = 'photo-card-zoom';
  zoomBtn.innerHTML = '⊕';
  zoomBtn.setAttribute('aria-hidden', 'true');

  // Shield over canvas to block drag
  const shield = document.createElement('div');
  shield.className = 'card-shield';
  shield.setAttribute('aria-hidden', 'true');

  card.appendChild(canvas);
  card.appendChild(overlay);
  card.appendChild(zoomBtn);
  card.appendChild(shield);

  card.addEventListener('click',   () => openLightbox(index));
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

  // Update counter badge
  if (dom.lbCounter) {
    dom.lbCounter.textContent = `${state.lbIndex + 1} / ${state.filteredPhotos.length}`;
  }

  // Draw watermarked version onto the lightbox canvas
  const canvas = dom.lbCanvas;
  const ctx    = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  applyWatermark(photo.src).then(dataURL => {
    const img = new Image();
    img.onload = () => {
      canvas.width  = img.naturalWidth;
      canvas.height = img.naturalHeight;
      ctx.drawImage(img, 0, 0);
    };
    img.src = dataURL;
  }).catch(() => {
    // Fallback plain draw
    const img = new Image();
    img.onload = () => {
      canvas.width  = img.naturalWidth;
      canvas.height = img.naturalHeight;
      ctx.drawImage(img, 0, 0);
    };
    img.src = photo.src;
  });

  dom.lbPrev.style.visibility = state.lbIndex > 0 ? 'visible' : 'hidden';
  dom.lbNext.style.visibility = state.lbIndex < state.filteredPhotos.length - 1 ? 'visible' : 'hidden';

  const parts = [];
  if (photo.location) parts.push(`<span>📍 <b>${esc(photo.location)}</b></span>`);
  if (photo.date)     parts.push(`<span>📅 <b>${esc(photo.date)}</b></span>`);
  if (photo.gear)     parts.push(`<span>📷 <b>${esc(photo.gear)}</b></span>`);

  dom.lbMeta.innerHTML = `<h2>${esc(photo.title || '')}</h2><div class="lb-meta-row">${parts.join('')}</div>`;
}

function lbNavigate(dir) {
  const n = state.lbIndex + dir;
  if (n < 0 || n >= state.filteredPhotos.length) return;
  state.lbIndex = n;
  renderLightboxPhoto();
  resetZoom();
}

function bindLightbox() {
  dom.lbClose.addEventListener('click', closeLightbox);
  dom.lbPrev.addEventListener('click',  () => lbNavigate(-1));
  dom.lbNext.addEventListener('click',  () => lbNavigate(1));
  dom.lightbox.addEventListener('click', e => { if (e.target === dom.lightbox) closeLightbox(); });

  // Prevent canvas right-click save
  dom.lbCanvas.addEventListener('contextmenu', e => e.preventDefault());

  // Touch swipe
  let tx = 0;
  dom.lightbox.addEventListener('touchstart', e => { tx = e.touches[0].clientX; }, { passive: true });
  dom.lightbox.addEventListener('touchend',   e => {
    const diff = tx - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) lbNavigate(diff > 0 ? 1 : -1);
  }, { passive: true });
}

/* ── ZOOM ───────────────────────────────────────────────────── */
function applyZoom() {
  const pct = Math.round(state.zoom * 100);
  dom.lbCanvas.style.transform = `translate(${state.panOffset.x}px, ${state.panOffset.y}px) scale(${state.zoom})`;
  dom.zoomLevel.textContent = `${pct}%`;
  dom.lbCanvas.style.cursor = state.zoom > 1 ? 'grab' : 'default';
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
    clampPan(); applyZoom();
  });
  dom.zoomOut.addEventListener('click', () => {
    state.zoom = Math.max(state.zoomMin, state.zoom - state.zoomStep);
    clampPan(); applyZoom();
  });
  dom.zoomReset.addEventListener('click', resetZoom);

  dom.lbImageWrap.addEventListener('wheel', e => {
    e.preventDefault();
    const d = e.deltaY < 0 ? state.zoomStep : -state.zoomStep;
    state.zoom = Math.min(state.zoomMax, Math.max(state.zoomMin, state.zoom + d));
    clampPan(); applyZoom();
  }, { passive: false });

  // Mouse pan
  dom.lbCanvas.addEventListener('mousedown', e => {
    if (state.zoom <= 1) return;
    e.preventDefault();
    state.isDragging = true;
    state.panStart = { x: e.clientX - state.panOffset.x, y: e.clientY - state.panOffset.y };
    dom.lbCanvas.style.cursor = 'grabbing';
  });
  window.addEventListener('mousemove', e => {
    if (!state.isDragging) return;
    state.panOffset = { x: e.clientX - state.panStart.x, y: e.clientY - state.panStart.y };
    clampPan(); applyZoom();
  });
  window.addEventListener('mouseup', () => {
    if (!state.isDragging) return;
    state.isDragging = false;
    dom.lbCanvas.style.cursor = state.zoom > 1 ? 'grab' : 'default';
  });

  // Pinch zoom (touch)
  let lastDist = 0;
  dom.lbImageWrap.addEventListener('touchstart', e => {
    if (e.touches.length === 2) lastDist = Math.hypot(
      e.touches[0].clientX - e.touches[1].clientX,
      e.touches[0].clientY - e.touches[1].clientY
    );
  }, { passive: true });
  dom.lbImageWrap.addEventListener('touchmove', e => {
    if (e.touches.length !== 2) return;
    e.preventDefault();
    const d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
    state.zoom = Math.min(state.zoomMax, Math.max(state.zoomMin, state.zoom * (d / lastDist)));
    lastDist = d;
    clampPan(); applyZoom();
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

/* ── CONTACT FORM ───────────────────────────────────────────── */
function bindContactForm() {
  const form = dom.contactForm;
  if (!form) return;

  form.addEventListener('submit', e => {
    e.preventDefault();

    // Honeypot check
    const hp = form.querySelector('input[name="_hp"]');
    if (hp && hp.value) return; // bot caught

    const name    = $('contactName')?.value.trim()    || '';
    const email   = $('contactEmail')?.value.trim()   || '';
    const subject = $('contactSubject')?.value        || '';
    const message = $('contactMessage')?.value.trim() || '';

    if (!name || !email || !message) {
      // Simple validation highlight
      [$('contactName'), $('contactEmail'), $('contactMessage')].forEach(el => {
        if (el && !el.value.trim()) el.style.borderColor = '#c96e6e';
        else if (el) el.style.borderColor = '';
      });
      return;
    }

    const target  = SITE.social.email?.replace('mailto:', '') || '';
    const subj    = `Haydn 3A Enquiry${subject ? ' — ' + subject : ''}`;
    const body    = `Name: ${name}\nEmail: ${email}\n\n${message}`;
    const mailto  = `mailto:${encodeURIComponent(target)}?subject=${encodeURIComponent(subj)}&body=${encodeURIComponent(body)}`;

    window.location.href = mailto;

    if (dom.formSuccess) {
      dom.formSuccess.hidden = false;
      setTimeout(() => { dom.formSuccess.hidden = true; }, 6000);
    }
  });

  // Clear error colour on input
  form.querySelectorAll('input, textarea').forEach(el => {
    el.addEventListener('input', () => { el.style.borderColor = ''; });
  });
}

/* ── THEME ──────────────────────────────────────────────────── */
function bindTheme() {
  const saved = localStorage.getItem('h3a-theme');
  if (saved) document.documentElement.setAttribute('data-theme', saved);

  dom.themeToggle.addEventListener('click', () => {
    const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('h3a-theme', next);
  });
}

/* ── NAV ────────────────────────────────────────────────────── */
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
  const onScroll = () => dom.nav.classList.toggle('scrolled', window.scrollY > 40);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

/* ── SCROLL OBSERVER ────────────────────────────────────────── */
function startScrollObserver() {
  const links = document.querySelectorAll('.nav-links a');
  const obs = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        links.forEach(l => l.classList.remove('active'));
        const m = document.querySelector(`.nav-links a[href="#${entry.target.id}"]`);
        if (m) m.classList.add('active');
      }
    });
  }, { threshold: 0.3 });
  document.querySelectorAll('section[id]').forEach(s => obs.observe(s));

  // Hero parallax effect
  const heroSlides = dom.heroSlides;
  if (heroSlides) {
    window.addEventListener('scroll', () => {
      const scrolled = window.pageYOffset;
      const rate = scrolled * -0.5;
      heroSlides.style.transform = `translateY(${rate}px)`;
    }, { passive: true });
  }
}

/* ── CUSTOM CURSOR ──────────────────────────────────────────── */
function bindCursor() {
  if (window.matchMedia('(hover: none)').matches) return;
  const dot  = $('cursorDot');
  const ring = $('cursorRing');
  let rx = 0, ry = 0, dx = 0, dy = 0, mx = 0, my = 0;

  window.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; }, { passive: true });
  (function loop() {
    dx += (mx - dx) * 0.9; dy += (my - dy) * 0.9;
    rx += (mx - rx) * 0.12; ry += (my - ry) * 0.12;
    dot.style.left  = dx + 'px'; dot.style.top  = dy + 'px';
    ring.style.left = rx + 'px'; ring.style.top = ry + 'px';
    requestAnimationFrame(loop);
  })();

  const hov = 'a, button, .photo-card, .tab-btn, .hero-dot';
  document.addEventListener('mouseover', e => { if (e.target.closest(hov)) document.body.classList.add('cursor-hover'); });
  document.addEventListener('mouseout',  e => { if (e.target.closest(hov)) document.body.classList.remove('cursor-hover'); });
}

/* ── IMAGE PROTECTIONS ──────────────────────────────────────── */
function disableImageProtections() {
  // Global context-menu block on images and canvas
  document.addEventListener('contextmenu', e => {
    if (['IMG','CANVAS'].includes(e.target.tagName)) e.preventDefault();
  });

  // Block common devtools shortcuts
  document.addEventListener('keydown', e => {
    if (e.key === 'F12') { e.preventDefault(); return; }
    if (e.ctrlKey && e.shiftKey && ['i','I','j','J','c','C'].includes(e.key)) { e.preventDefault(); return; }
    if (e.ctrlKey && ['u','U','s','S'].includes(e.key)) { e.preventDefault(); }
  });

  // Disable text selection on photo grid
  dom.photoGrid.style.userSelect = 'none';
  dom.photoGrid.style.webkitUserSelect = 'none';
}

/* ── UTILITY ────────────────────────────────────────────────── */
function esc(str) {
  return String(str)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&#039;');
}

/* ── BOOT ───────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', init);
