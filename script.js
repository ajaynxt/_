(() => {
  const root = document.documentElement;
  const header = document.querySelector('[data-header]');
  const menuButton = document.querySelector('[data-menu-toggle]');
  const nav = document.querySelector('[data-nav]');
  const year = document.querySelector('[data-year]');
  const themeButton = document.querySelector('[data-theme-toggle]');
  const paletteLockButton = document.querySelector('[data-palette-lock]');
  // Motion is part of the approved AJAY NXT presentation. Individual effects
  // use calmer settings when needed, but the page should not become static.
  const reduceMotion = false;
  const motionSrc = window.AJAY_NXT_MOTION_SRC;
  const firebaseSrc = window.AJAY_NXT_FIREBASE_SRC;
  let firebaseBundlePromise = null;

  function loadFirebaseBundle() {
    const config = window.AJAY_NXT_FIREBASE_CONFIG;
    const ready = Boolean(config?.apiKey && config?.authDomain && config?.projectId && config?.appId);
    if (!firebaseSrc || !ready) return Promise.resolve(null);
    if (!firebaseBundlePromise) firebaseBundlePromise = import(firebaseSrc);
    return firebaseBundlePromise;
  }

  function trackEvent(name, path) {
    loadFirebaseBundle()
      .then(() => window.AJAY_NXT_FIREBASE?.track?.(name, path))
      .catch(() => false);
  }

  function loadMotionBundle() {
    if (!motionSrc || document.querySelector('[data-motion-bundle]')) return;
    const motionScript = document.createElement('script');
    motionScript.type = 'module';
    motionScript.src = motionSrc;
    motionScript.dataset.motionBundle = '';
    document.head.appendChild(motionScript);
  }

  function scheduleMotionBundle() {
    if (!motionSrc) return;
    if (reduceMotion) {
      root.dataset.motionReady = 'reduced';
      return;
    }
    const start = () => {
      if ('requestIdleCallback' in window) {
        window.requestIdleCallback(loadMotionBundle, { timeout: 900 });
      } else {
        window.setTimeout(loadMotionBundle, 450);
      }
    };
    if (document.readyState === 'complete') start();
    else window.addEventListener('load', start, { once: true });
  }

  if (year) year.textContent = new Date().getFullYear();

  const luxuryHeadingStyles = [
    {
      font: '"Playfair Display", Georgia, serif',
      sizeAdjust: '0.50',
      lineHeight: '1.02',
      tracking: '-0.035em'
    },
    {
      font: '"Cormorant Garamond", Garamond, serif',
      sizeAdjust: '0.54',
      lineHeight: '0.98',
      tracking: '-0.025em'
    },
    {
      font: '"DM Serif Display", Georgia, serif',
      sizeAdjust: '0.48',
      lineHeight: '1',
      tracking: '-0.03em'
    }
  ];
  let luxuryHeadingIndex = Math.floor(Date.now() / 3000) % luxuryHeadingStyles.length;
  const applyLuxuryHeadingFont = () => {
    const style = luxuryHeadingStyles[luxuryHeadingIndex];
    root.style.setProperty('--luxury-heading-font', style.font);
    root.style.setProperty('--luxury-heading-size-adjust', style.sizeAdjust);
    root.style.setProperty('--luxury-heading-line-height', style.lineHeight);
    root.style.setProperty('--luxury-heading-tracking', style.tracking);
    root.dataset.luxuryHeading = String(luxuryHeadingIndex + 1);
  };
  applyLuxuryHeadingFont();
  const luxuryHeadingTimer = window.setInterval(() => {
    luxuryHeadingIndex = (luxuryHeadingIndex + 1) % luxuryHeadingStyles.length;
    applyLuxuryHeadingFont();
  }, 3000);
  window.addEventListener('pagehide', () => window.clearInterval(luxuryHeadingTimer), { once: true });

  const themeColor = document.querySelector('meta[name="theme-color"]');
  const totalPalettes = 5000;
  let paletteIndex = 0;
  let paletteDelay = new URLSearchParams(window.location.search).has('palette-preview')
    ? 1200
    : 5000;
  let paletteRotationEnabled = true;
  let paletteTimer = null;
  let paletteLocked = false;

  try {
    const savedLock = JSON.parse(localStorage.getItem('ajaynxt-palette-lock') || 'null');
    if (savedLock?.locked && Number.isInteger(savedLock.index)) {
      paletteLocked = true;
      paletteIndex = Math.max(0, Math.min(totalPalettes - 1, savedLock.index));
    }
  } catch {
    localStorage.removeItem('ajaynxt-palette-lock');
  }

  function scheduleFirebaseBundle() {
    if (!firebaseSrc || !window.AJAY_NXT_FIREBASE_CONFIG) return;
    const start = () => {
      if ('requestIdleCallback' in window) {
        window.requestIdleCallback(loadFirebaseBundle, { timeout: 2500 });
      } else {
        window.setTimeout(loadFirebaseBundle, 1800);
      }
    };
    if (document.readyState === 'complete') start();
    else window.addEventListener('load', start, { once: true });
  }

  const hslToRgb = (hue, saturation, lightness) => {
    const s = saturation / 100;
    const l = lightness / 100;
    const chroma = (1 - Math.abs(2 * l - 1)) * s;
    const segment = hue / 60;
    const x = chroma * (1 - Math.abs((segment % 2) - 1));
    const [red, green, blue] = segment < 1
      ? [chroma, x, 0]
      : segment < 2
        ? [x, chroma, 0]
        : segment < 3
          ? [0, chroma, x]
          : segment < 4
            ? [0, x, chroma]
            : segment < 5
              ? [x, 0, chroma]
              : [chroma, 0, x];
    const match = l - chroma / 2;
    return [red, green, blue].map((channel) => Math.round((channel + match) * 255));
  };

  const rgbToHex = (rgb) => `#${rgb
    .map((channel) => channel.toString(16).padStart(2, '0'))
    .join('')}`;

  const createPalette = (index) => {
    if (index === 0) {
      return {
        accent: '#c45112',
        dark: '#8f340a',
        soft: '#ffb36b',
        tint: '#fff4e8',
        rgb: [196, 81, 18]
      };
    }

    // A golden-angle hue step plus small saturation/lightness variations creates
    // 4,999 additional harmonious palettes without shipping 5,000 CSS blocks.
    const hue = (24 + index * 137.50776405) % 360;
    const saturation = 54 + ((index * 17) % 15);
    const accentLightness = hue >= 36 && hue <= 190
      ? 36 + ((index * 3) % 4)
      : 42 + ((index * 3) % 4);
    const accentRgb = hslToRgb(hue, saturation, accentLightness);
    const darkRgb = hslToRgb(hue, Math.min(74, saturation + 4), Math.max(26, accentLightness - 11));
    const softRgb = hslToRgb(hue, 58 + ((index * 5) % 10), 86 + ((index * 7) % 4));
    const tintRgb = hslToRgb(hue, 64, 97);

    return {
      accent: rgbToHex(accentRgb),
      dark: rgbToHex(darkRgb),
      soft: rgbToHex(softRgb),
      tint: rgbToHex(tintRgb),
      rgb: accentRgb
    };
  };

  const applyPalette = (index) => {
    const palette = createPalette(index);
    root.dataset.dailyPalette = index === 0 ? 'sunset' : `soft-${index}`;
    root.style.setProperty('--daily-accent', palette.accent);
    root.style.setProperty('--daily-accent-dark', palette.dark);
    root.style.setProperty('--daily-accent-soft', palette.soft);
    root.style.setProperty('--daily-rgb', palette.rgb.join(' '));
    root.style.setProperty('--daily-tint', palette.tint);
    if (themeColor) themeColor.content = palette.accent;
    return palette;
  };

  applyPalette(paletteIndex);

  const rotatePalette = () => {
    if (document.hidden || paletteLocked || !paletteRotationEnabled) return;

    paletteIndex = (paletteIndex + 1) % totalPalettes;
    root.classList.add('palette-shifting');
    const palette = applyPalette(paletteIndex);

    window.dispatchEvent(new CustomEvent('ajaynxt:palette-change', {
      detail: {
        index: paletteIndex,
        total: totalPalettes,
        palette
      }
    }));
    window.setTimeout(() => root.classList.remove('palette-shifting'), 900);
  };

  function updatePaletteLockButton() {
    if (!paletteLockButton) return;
    paletteLockButton.setAttribute('aria-pressed', String(paletteLocked));
    paletteLockButton.setAttribute('aria-label', paletteLocked
      ? 'Unlock colour rotation'
      : 'Lock the current colour palette');
    const label = paletteLockButton.querySelector('[data-palette-lock-text]');
    if (label) label.textContent = paletteLocked ? 'Colour locked' : 'Lock colour';
  }

  function stopPaletteRotation() {
    window.clearInterval(paletteTimer);
    paletteTimer = null;
  }

  function startPaletteRotation() {
    stopPaletteRotation();
    if (!paletteLocked && paletteRotationEnabled) {
      paletteTimer = window.setInterval(rotatePalette, paletteDelay);
    }
  }

  function configurePalette(settings = {}) {
    paletteRotationEnabled = settings.paletteRotationEnabled !== false;
    const nextDelay = Number(settings.paletteDelayMs);
    if (Number.isFinite(nextDelay)) paletteDelay = Math.max(5000, Math.min(3600000, nextDelay));
    startPaletteRotation();
  }

  paletteLockButton?.addEventListener('click', () => {
    paletteLocked = !paletteLocked;
    if (paletteLocked) {
      localStorage.setItem('ajaynxt-palette-lock', JSON.stringify({ locked: true, index: paletteIndex }));
      trackEvent('palette_lock');
    } else {
      localStorage.removeItem('ajaynxt-palette-lock');
    }
    updatePaletteLockButton();
    startPaletteRotation();
  });

  updatePaletteLockButton();
  startPaletteRotation();
  window.addEventListener('pagehide', stopPaletteRotation, { once: true });

  const mergeContent = (target, source) => {
    if (!source || typeof source !== 'object') return target;
    Object.entries(source).forEach(([key, value]) => {
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        target[key] = mergeContent(target[key] || {}, value);
      } else {
        target[key] = value;
      }
    });
    return target;
  };

  let siteContent = structuredClone(window.AJAY_NXT_DEFAULT_CONTENT || {});

  function valueAtPath(object, path) {
    return path.split('.').reduce((value, key) => value?.[key], object);
  }

  let activeReviewIndex = 0;
  let publicReviews = [];
  const reviewCarousel = document.querySelector('[data-review-carousel]');
  const reviewCard = document.querySelector('[data-review-card]');
  const reviewControls = document.querySelector('[data-review-controls]');
  const reviewCounter = document.querySelector('[data-review-counter]');

  function safeProofUrl(value) {
    try {
      const url = new URL(String(value || ''), window.location.origin);
      return ['http:', 'https:'].includes(url.protocol) ? url.href : '';
    } catch {
      return '';
    }
  }

  function safeMediaUrl(value) {
    try {
      const url = new URL(String(value || ''), window.location.href);
      return ['http:', 'https:'].includes(url.protocol) ? url.href : '';
    } catch {
      return '';
    }
  }

  function createCollaborationLink(label, value, primary = false) {
    const href = safeProofUrl(value);
    if (!href) return null;
    const link = document.createElement('a');
    link.className = `button ${primary ? 'button-primary' : 'button-quiet'}`;
    link.href = href;
    link.target = '_blank';
    link.rel = 'noreferrer';
    link.dataset.track = 'project_live_click';
    link.textContent = `${label} ↗`;
    return link;
  }

  function renderSiteCollaborations(source) {
    const track = document.querySelector('[data-collab-track]');
    if (!track) return;
    const items = (Array.isArray(source.collaborations) ? source.collaborations : [])
      .filter((item) => item && item.published !== false && (item.title || item.summary || item.image));
    if (!items.length) return;

    const slides = items.map((item) => {
      const slide = document.createElement('article');
      slide.className = 'collab-card collab-slide dynamic-collab-card';
      slide.dataset.collabSlide = '';

      const visual = document.createElement('div');
      visual.className = 'collab-visual-card dynamic-collab-visual';
      const image = document.createElement('img');
      image.loading = 'lazy';
      image.decoding = 'async';
      image.alt = item.imageAlt || `${item.title || 'Collaboration'} visual`;
      image.src = safeMediaUrl(item.image) || './assets/ajay-nxt-orange-mark.png';
      const shine = document.createElement('div');
      shine.className = 'collab-visual-shine';
      shine.setAttribute('aria-hidden', 'true');
      visual.append(image, shine);

      const copy = document.createElement('div');
      copy.className = 'collab-copy dynamic-collab-copy';
      const kicker = document.createElement('p');
      kicker.className = 'section-kicker';
      kicker.textContent = item.kicker || 'Creative collaboration';
      const heading = document.createElement('h3');
      heading.append(document.createTextNode(item.title || 'Collaboration'));
      if (item.highlight) {
        heading.append(document.createElement('br'));
        const accent = document.createElement('span');
        accent.className = 'accent-lime-dark';
        accent.textContent = item.highlight;
        heading.append(accent);
      }
      const summary = document.createElement('p');
      summary.textContent = item.summary || '';
      copy.append(kicker, heading, summary);

      const roles = document.createElement('div');
      roles.className = 'role-list';
      (Array.isArray(item.roles) ? item.roles : []).slice(0, 8).forEach((role) => {
        const tag = document.createElement('span');
        tag.textContent = role;
        roles.appendChild(tag);
      });
      if (roles.childElementCount) copy.appendChild(roles);

      const actions = document.createElement('div');
      actions.className = 'collab-action-grid';
      [
        ['Visit website', item.website, true],
        ['Google Business', item.googleBusiness, false],
        ['Instagram', item.instagram, false],
        ['Facebook', item.facebook, false]
      ].forEach(([label, url, primary]) => {
        const link = createCollaborationLink(label, url, primary);
        if (link) actions.appendChild(link);
      });
      if (actions.childElementCount) copy.appendChild(actions);

      slide.append(visual, copy);
      return slide;
    });

    track.replaceChildren(...slides);
    const total = document.querySelector('[data-collab-total]');
    const current = document.querySelector('[data-collab-current]');
    if (total) total.textContent = String(slides.length).padStart(2, '0');
    if (current) current.textContent = '01';
    window.dispatchEvent(new CustomEvent('ajaynxt:collaborations-rendered'));
  }

  function showReview(index, animate = false) {
    if (!publicReviews.length || !reviewCard) return;
    activeReviewIndex = (index + publicReviews.length) % publicReviews.length;
    const review = publicReviews[activeReviewIndex];
    const values = {
      'review.label': review.label,
      'review.quote': review.quote,
      'review.name': review.name,
      'review.company': review.company,
      'review.rating': review.rating || '5.0',
      'review.proofLabel': review.proofLabel || 'View project'
    };

    Object.entries(values).forEach(([path, value]) => {
      const element = reviewCard.querySelector(`[data-content="${path}"]`);
      if (element) element.textContent = value || '';
    });

    const proofLink = reviewCard.querySelector('[data-content-link="review.proofUrl"]');
    if (proofLink) {
      const url = safeProofUrl(review.proofUrl);
      proofLink.hidden = !url;
      if (url) proofLink.href = url;
    }

    if (reviewCounter) {
      reviewCounter.textContent = `${String(activeReviewIndex + 1).padStart(2, '0')} / ${String(publicReviews.length).padStart(2, '0')}`;
    }
    if (reviewControls) reviewControls.hidden = publicReviews.length < 2;
    if (animate && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      reviewCard.animate(
        [{ opacity: 0.35, transform: 'translateY(8px)' }, { opacity: 1, transform: 'translateY(0)' }],
        { duration: 320, easing: 'cubic-bezier(.2,.8,.2,1)' }
      );
    }
  }

  function renderSiteReviews(source) {
    const items = Array.isArray(source.reviews) && source.reviews.length
      ? source.reviews
      : (source.review ? [source.review] : []);
    publicReviews = items.filter((item) => item && item.published !== false && item.quote && item.name);
    if (!publicReviews.length && source.review) publicReviews = [source.review];
    activeReviewIndex = Math.min(activeReviewIndex, Math.max(0, publicReviews.length - 1));
    showReview(activeReviewIndex);
  }

  reviewCarousel?.querySelector('[data-review-prev]')?.addEventListener('click', () => showReview(activeReviewIndex - 1, true));
  reviewCarousel?.querySelector('[data-review-next]')?.addEventListener('click', () => showReview(activeReviewIndex + 1, true));

  function applySiteContent(remote = {}) {
    siteContent = mergeContent(structuredClone(window.AJAY_NXT_DEFAULT_CONTENT || {}), remote);
    if (!Array.isArray(remote.reviews) && remote.review) siteContent.reviews = [structuredClone(siteContent.review)];
    window.AJAY_NXT_SITE_CONTENT = siteContent;

    document.querySelectorAll('[data-content]').forEach((element) => {
      const value = valueAtPath(siteContent, element.dataset.content);
      if (typeof value !== 'string' || !value.trim()) return;
      if (element.dataset.contentStyle === 'about') {
        const highlights = /(design|visual storytelling)/gi;
        element.replaceChildren();
        value.split(highlights).filter(Boolean).forEach((part) => {
          if (highlights.test(part)) {
            highlights.lastIndex = 0;
            const accent = document.createElement('span');
            accent.className = /visual/i.test(part) ? 'accent-lime-dark' : 'accent-cyan-dark';
            accent.textContent = part;
            element.appendChild(accent);
          } else {
            element.appendChild(document.createTextNode(part));
          }
          highlights.lastIndex = 0;
        });
        return;
      }
      element.textContent = value;
    });

    document.querySelectorAll('[data-content-link]').forEach((element) => {
      const value = valueAtPath(siteContent, element.dataset.contentLink);
      if (typeof value === 'string' && value.trim()) element.href = value;
    });

    renderSiteCollaborations(siteContent);
    renderSiteReviews(siteContent);
    configurePalette(siteContent.settings);
  }

  applySiteContent(window.AJAY_NXT_REMOTE_CONTENT || {});
  window.addEventListener('ajaynxt:content-ready', (event) => applySiteContent(event.detail || {}));

  const updateHeader = () => header?.classList.toggle('is-scrolled', window.scrollY > 24);
  updateHeader();
  window.addEventListener('scroll', updateHeader, { passive: true });

  menuButton?.addEventListener('click', () => {
    const open = menuButton.getAttribute('aria-expanded') === 'true';
    menuButton.setAttribute('aria-expanded', String(!open));
    nav?.classList.toggle('is-open', !open);
    header?.classList.toggle('nav-open', !open);
  });

  nav?.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => {
    menuButton?.setAttribute('aria-expanded', 'false');
    nav?.classList.remove('is-open');
    header?.classList.remove('nav-open');
  }));

  // Dark / light mode with saved preference.
  function updateThemeButton() {
    if (!themeButton) return;
    const isLight = root.dataset.theme === 'light';
    const icon = themeButton.querySelector('.theme-icon');
    const text = themeButton.querySelector('.theme-text');
    if (icon) icon.textContent = isLight ? '☾' : '☀';
    if (text) text.textContent = isLight ? 'Dark' : 'Light';
    themeButton.setAttribute('aria-label', `Switch to ${isLight ? 'dark' : 'light'} mode`);
  }

  updateThemeButton();
  themeButton?.addEventListener('click', () => {
    const next = root.dataset.theme === 'light' ? 'dark' : 'light';
    root.dataset.theme = next;
    localStorage.setItem('ajay-nxt-theme', next);
    updateThemeButton();
  });

  // Scroll reveal.
  const revealElements = document.querySelectorAll('.reveal');
  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealElements.forEach((element) => element.classList.add('is-visible'));
  } else {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.11, rootMargin: '0px 0px -40px' });
    revealElements.forEach((element) => observer.observe(element));
  }

  // Give the service nearest the viewport centre an orange reading focus.
  const serviceRows = [...document.querySelectorAll('.service-row')];
  if (serviceRows.length) {
    let serviceFocusFrame = 0;
    const updateServiceFocus = () => {
      serviceFocusFrame = 0;
      const focusY = window.innerHeight * 0.54;
      let closestRow = null;
      let closestDistance = Number.POSITIVE_INFINITY;

      serviceRows.forEach((row) => {
        const rect = row.getBoundingClientRect();
        if (rect.bottom <= 0 || rect.top >= window.innerHeight) return;
        const distance = Math.abs((rect.top + rect.height / 2) - focusY);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestRow = row;
        }
      });

      serviceRows.forEach((row) => row.classList.toggle('is-scroll-active', row === closestRow));
    };
    const requestServiceFocus = () => {
      if (serviceFocusFrame) return;
      serviceFocusFrame = window.requestAnimationFrame(updateServiceFocus);
    };

    updateServiceFocus();
    window.addEventListener('scroll', requestServiceFocus, { passive: true });
    window.addEventListener('resize', requestServiceFocus);
  }

  // Cursor glow only on fine-pointer devices.
  const glow = document.querySelector('[data-cursor-glow]');
  if (glow && !reduceMotion && window.matchMedia('(pointer:fine)').matches) {
    let glowFrame = 0;
    let glowPoint = null;
    window.addEventListener('pointermove', (event) => {
      glowPoint = { x: event.clientX, y: event.clientY };
      if (glowFrame) return;
      glowFrame = window.requestAnimationFrame(() => {
        glowFrame = 0;
        if (!glowPoint) return;
        glow.style.left = `${glowPoint.x}px`;
        glow.style.top = `${glowPoint.y}px`;
        glow.style.opacity = '1';
      });
    }, { passive: true });
  }

  // Manual water-like colour reveal for the hero portrait.
  // The portrait stays monochrome until the user moves or drags over it.
  const portraitReveal = document.querySelector('[data-portrait-reveal]');
  if (portraitReveal) {
    let portraitFrame = 0;
    let pointerActive = false;
    let pressed = false;
    let revealTimer = null;
    let targetX = 50;
    let targetY = 50;
    let currentX = 50;
    let currentY = 50;

    portraitReveal.dataset.motionActive = 'true';

    const setPointerTarget = (event) => {
      const rect = portraitReveal.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      targetX = Math.max(8, Math.min(92, ((event.clientX - rect.left) / rect.width) * 100));
      targetY = Math.max(12, Math.min(88, ((event.clientY - rect.top) / rect.height) * 100));
    };

    const animatePortrait = (time) => {
      currentX += (targetX - currentX) * 0.2;
      currentY += (targetY - currentY) * 0.2;

      const pulse = 0.5 + Math.sin(time * 0.00115) * 0.5;
      portraitReveal.style.setProperty('--reveal-x', `${currentX.toFixed(2)}%`);
      portraitReveal.style.setProperty('--reveal-y', `${currentY.toFixed(2)}%`);
      portraitReveal.style.setProperty('--wave-shift-x', `${(Math.sin(time * 0.0014) * 24).toFixed(1)}px`);
      portraitReveal.style.setProperty('--wave-shift-y', `${(Math.cos(time * 0.0011) * 18).toFixed(1)}px`);
      portraitReveal.style.setProperty('--wave-pulse', pulse.toFixed(3));
      if (pointerActive || pressed) {
        portraitFrame = window.requestAnimationFrame(animatePortrait);
      } else {
        portraitFrame = 0;
      }
    };

    const ensurePortraitAnimation = () => {
      if (!portraitFrame) portraitFrame = window.requestAnimationFrame(animatePortrait);
    };

    const hidePortraitReveal = () => {
      clearTimeout(revealTimer);
      pointerActive = false;
      pressed = false;
      portraitReveal.classList.remove('is-revealing');
      portraitReveal.classList.remove('is-pressed');
      if (portraitFrame) window.cancelAnimationFrame(portraitFrame);
      portraitFrame = 0;
    };

    const showPortraitReveal = (event, temporary = false) => {
      clearTimeout(revealTimer);
      pointerActive = true;
      setPointerTarget(event);
      portraitReveal.classList.add('is-revealing');
      ensurePortraitAnimation();
      if (temporary) revealTimer = window.setTimeout(hidePortraitReveal, 3600);
    };

    portraitReveal.addEventListener('pointerenter', (event) => {
      if (event.pointerType && event.pointerType !== 'mouse') return;
      showPortraitReveal(event);
    });
    portraitReveal.addEventListener('pointermove', (event) => {
      if (event.pointerType !== 'mouse' && !pressed) return;
      showPortraitReveal(event);
    }, { passive: true });
    portraitReveal.addEventListener('pointerleave', hidePortraitReveal);
    portraitReveal.addEventListener('pointerdown', (event) => {
      pressed = true;
      portraitReveal.classList.add('is-pressed');
      showPortraitReveal(event, event.pointerType !== 'mouse');
      portraitReveal.setPointerCapture?.(event.pointerId);
    });
    window.addEventListener('pointerup', (event) => {
      if (!pressed) return;
      pressed = false;
      portraitReveal.classList.remove('is-pressed');
    });

    window.addEventListener('pagehide', () => {
      clearTimeout(revealTimer);
      if (portraitFrame) window.cancelAnimationFrame(portraitFrame);
    }, { once: true });
  }

  // Work tabs.
  const tabs = [...document.querySelectorAll('[data-work-tab]')];
  const panels = [...document.querySelectorAll('[data-work-panel]')];
  tabs.forEach((tab) => tab.addEventListener('click', () => {
    const target = tab.dataset.workTab;
    tabs.forEach((item) => {
      const active = item === tab;
      item.classList.toggle('is-active', active);
      item.setAttribute('aria-selected', String(active));
    });
    panels.forEach((panel) => panel.classList.toggle('is-active', panel.dataset.workPanel === target));
    document.dispatchEvent(new CustomEvent('work-panel-change', { detail: { target } }));
  }));

  // Large Google Drive video slider.
  const videoSlides = Array.isArray(window.AJAY_NXT_CONFIG?.videoSlides)
    ? window.AJAY_NXT_CONFIG.videoSlides
    : [];

  const slider = document.querySelector('[data-video-slider]');
  if (slider && videoSlides.length) {
    const screen = slider.querySelector('[data-video-screen]');
    const frame = slider.querySelector('[data-main-frame]');
    const localVideo = slider.querySelector('[data-main-local-video]');
    const mainPoster = slider.querySelector('[data-main-poster]');
    const playButton = slider.querySelector('[data-main-play]');
    const fullscreenButton = slider.querySelector('[data-video-fullscreen]');
    const title = slider.querySelector('[data-video-title]');
    const category = slider.querySelector('[data-video-category]');
    const description = slider.querySelector('[data-video-description]');
    const indexLabel = slider.querySelector('[data-video-index]');
    const duration = slider.querySelector('[data-video-duration]');
    const current = slider.querySelector('[data-video-current]');
    const total = slider.querySelector('[data-video-total]');
    const prevPoster = slider.querySelector('[data-prev-poster]');
    const nextPoster = slider.querySelector('[data-next-poster]');
    const prevTitle = slider.querySelector('[data-prev-title]');
    const nextTitle = slider.querySelector('[data-next-title]');
    const dotsWrap = slider.querySelector('[data-video-dots]');
    const autoButton = slider.querySelector('[data-video-auto]');
    let activeIndex = 0;
    let autoEnabled = !reduceMotion;
    let autoTimer = null;
    let pointerStartX = 0;
    let frameActive = false;
    let videoLoadingTimer = null;
    let sliderReady = false;

    if (total) total.textContent = String(videoSlides.length).padStart(2, '0');

    videoSlides.forEach((item, dotIndex) => {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'cinema-dot';
      dot.setAttribute('aria-label', `Show ${item.title}`);
      dot.addEventListener('click', () => showSlide(dotIndex, true));
      dotsWrap?.appendChild(dot);
    });

    function previewUrl(item) {
      if (item.previewUrl) return item.previewUrl;
      return item.driveId ? `https://drive.google.com/file/d/${item.driveId}/preview` : '';
    }

    function unloadFrame() {
      frameActive = false;
      clearTimeout(videoLoadingTimer);
      screen?.classList.remove('is-playing', 'is-loading-video');
      if (frame) {
        frame.src = 'about:blank';
        frame.hidden = true;
      }
      if (localVideo) {
        localVideo.pause();
        localVideo.removeAttribute('src');
        localVideo.load();
        localVideo.hidden = true;
      }
      if (mainPoster) mainPoster.hidden = false;
      if (playButton) playButton.hidden = false;
    }

    function showSlide(nextIndex, userAction = false) {
      activeIndex = (nextIndex + videoSlides.length) % videoSlides.length;
      const item = videoSlides[activeIndex];
      const previous = videoSlides[(activeIndex - 1 + videoSlides.length) % videoSlides.length];
      const following = videoSlides[(activeIndex + 1) % videoSlides.length];

      unloadFrame();

      if (mainPoster) {
        mainPoster.src = item.poster;
        mainPoster.alt = `${item.title} poster`;
      }
      if (frame) {
        frame.title = item.title;
        frame.dataset.previewUrl = previewUrl(item);
      }
      if (localVideo) {
        localVideo.dataset.localUrl = item.localUrl || '';
      }
      if (title) title.textContent = item.title;
      if (category) category.textContent = item.category;
      if (description) description.textContent = item.description;
      if (indexLabel) indexLabel.textContent = String(activeIndex + 1).padStart(2, '0');
      if (current) current.textContent = String(activeIndex + 1).padStart(2, '0');
      if (duration) duration.textContent = item.duration;
      if (prevPoster) { prevPoster.src = previous.poster; prevPoster.alt = previous.title; }
      if (nextPoster) { nextPoster.src = following.poster; nextPoster.alt = following.title; }
      if (prevTitle) prevTitle.textContent = previous.title;
      if (nextTitle) nextTitle.textContent = following.title;
      slider.querySelectorAll('.cinema-dot').forEach((dot, dotIndex) => {
        dot.classList.toggle('is-active', dotIndex === activeIndex);
      });

      if (userAction) restartAuto();
    }

    function playCurrent() {
      const localUrl = localVideo?.dataset.localUrl;
      const driveUrl = frame?.dataset.previewUrl;
      clearTimeout(videoLoadingTimer);
      screen?.classList.add('is-playing', 'is-loading-video');
      videoLoadingTimer = setTimeout(() => screen?.classList.remove('is-loading-video'), 1800);

      if (localUrl && localVideo) {
        localVideo.src = localUrl;
        localVideo.hidden = false;
        frameActive = true;
        if (mainPoster) mainPoster.hidden = true;
        if (playButton) playButton.hidden = true;
        clearInterval(autoTimer);
        localVideo.play().catch(() => {});
        return;
      }

      if (!driveUrl || !frame) return;
      frame.src = driveUrl;
      frame.hidden = false;
      frameActive = true;
      if (mainPoster) mainPoster.hidden = true;
      if (playButton) playButton.hidden = true;
      clearInterval(autoTimer);
    }

    function openFullscreen() {
      if (document.fullscreenElement) {
        document.exitFullscreen?.();
        return;
      }

      if (!localVideo?.hidden && typeof localVideo.webkitEnterFullscreen === 'function') {
        localVideo.webkitEnterFullscreen();
        return;
      }

      const request = screen?.requestFullscreen || screen?.webkitRequestFullscreen;
      if (request && screen) {
        Promise.resolve(request.call(screen)).catch(() => {
          const url = frame?.dataset.previewUrl;
          if (url) window.open(url, '_blank', 'noopener,noreferrer');
        });
        return;
      }

      const url = frame?.dataset.previewUrl;
      if (url) window.open(url, '_blank', 'noopener,noreferrer');
    }

    function next(userAction = false) { showSlide(activeIndex + 1, userAction); }
    function previous(userAction = false) { showSlide(activeIndex - 1, userAction); }

    function startAuto() {
      clearInterval(autoTimer);
      if (!autoEnabled || reduceMotion || frameActive) return;
      autoTimer = setInterval(() => {
        if (!frameActive) next(false);
      }, 2000);
    }

    function restartAuto() {
      startAuto();
    }

    function activateSlider() {
      if (!sliderReady) {
        sliderReady = true;
        showSlide(activeIndex);
      }
      startAuto();
    }

    slider.querySelector('[data-video-next]')?.addEventListener('click', () => next(true));
    slider.querySelector('[data-video-prev]')?.addEventListener('click', () => previous(true));
    slider.querySelector('[data-video-next-preview]')?.addEventListener('click', () => next(true));
    slider.querySelector('[data-video-prev-preview]')?.addEventListener('click', () => previous(true));
    playButton?.addEventListener('click', playCurrent);
    fullscreenButton?.addEventListener('click', openFullscreen);
    frame?.addEventListener('load', () => {
      clearTimeout(videoLoadingTimer);
      screen?.classList.remove('is-loading-video');
    });
    localVideo?.addEventListener('playing', () => {
      clearTimeout(videoLoadingTimer);
      screen?.classList.remove('is-loading-video');
      if (mainPoster) mainPoster.hidden = true;
    });
    localVideo?.addEventListener('ended', () => {
      frameActive = false;
      screen?.classList.remove('is-playing', 'is-loading-video');
      next(false);
      startAuto();
    });

    autoButton?.addEventListener('click', () => {
      autoEnabled = !autoEnabled;
      autoButton.classList.toggle('is-active', autoEnabled);
      autoButton.setAttribute('aria-pressed', String(autoEnabled));
      if (autoEnabled) startAuto(); else clearInterval(autoTimer);
    });

    slider.addEventListener('pointerdown', (event) => { pointerStartX = event.clientX; });
    slider.addEventListener('pointerup', (event) => {
      const distance = event.clientX - pointerStartX;
      if (Math.abs(distance) > 55) distance < 0 ? next(true) : previous(true);
    });
    slider.addEventListener('mouseenter', () => clearInterval(autoTimer));
    slider.addEventListener('mouseleave', startAuto);

    document.addEventListener('work-panel-change', (event) => {
      if (event.detail?.target === 'video') activateSlider();
      else clearInterval(autoTimer);
    });
    if (slider.closest('[data-work-panel]')?.classList.contains('is-active')) activateSlider();
  }

  // Photo work uses the same automatic, swipeable presentation as the other media.
  const photoSlider = document.querySelector('[data-photo-slider]');
  if (photoSlider) {
    const track = photoSlider.querySelector('[data-photo-track]');
    const viewport = photoSlider.querySelector('[data-photo-viewport]');
    const slides = [...photoSlider.querySelectorAll('[data-photo-slide]')];
    const prevButton = photoSlider.querySelector('[data-photo-prev]');
    const nextButton = photoSlider.querySelector('[data-photo-next]');
    const currentLabel = photoSlider.querySelector('[data-photo-current]');
    const totalLabel = photoSlider.querySelector('[data-photo-total]');
    const dotsWrap = photoSlider.querySelector('[data-photo-dots]');
    let activeIndex = 0;
    let autoTimer = null;
    let pointerStartX = 0;

    if (totalLabel) totalLabel.textContent = String(slides.length).padStart(2, '0');

    slides.forEach((slide, index) => {
      slide.setAttribute('aria-hidden', index === 0 ? 'false' : 'true');
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'photo-slider-dot';
      dot.setAttribute('aria-label', `Show photo project ${index + 1}`);
      dot.addEventListener('click', () => showPhoto(index, true));
      dotsWrap?.appendChild(dot);
    });

    function showPhoto(index, userAction = false) {
      activeIndex = (index + slides.length) % slides.length;
      track.style.transform = `translate3d(-${activeIndex * 100}%, 0, 0)`;
      if (currentLabel) currentLabel.textContent = String(activeIndex + 1).padStart(2, '0');
      slides.forEach((slide, slideIndex) => {
        slide.setAttribute('aria-hidden', slideIndex === activeIndex ? 'false' : 'true');
      });
      photoSlider.querySelectorAll('.photo-slider-dot').forEach((dot, dotIndex) => {
        dot.classList.toggle('is-active', dotIndex === activeIndex);
      });
      if (userAction) startPhotoAuto();
    }

    function startPhotoAuto() {
      clearInterval(autoTimer);
      if (reduceMotion || slides.length < 2) return;
      autoTimer = setInterval(() => showPhoto(activeIndex + 1), 3200);
    }

    prevButton?.addEventListener('click', () => {
      showPhoto(activeIndex - 1, true);
    });
    nextButton?.addEventListener('click', () => {
      showPhoto(activeIndex + 1, true);
    });
    viewport?.addEventListener('pointerdown', (event) => {
      pointerStartX = event.clientX;
    });
    viewport?.addEventListener('pointerup', (event) => {
      const distance = event.clientX - pointerStartX;
      if (Math.abs(distance) > 50) {
        showPhoto(activeIndex + (distance < 0 ? 1 : -1), true);
      }
    });
    photoSlider.addEventListener('mouseenter', () => clearInterval(autoTimer));
    photoSlider.addEventListener('mouseleave', startPhotoAuto);
    photoSlider.addEventListener('focusin', () => clearInterval(autoTimer));
    photoSlider.addEventListener('focusout', startPhotoAuto);

    showPhoto(0);
    startPhotoAuto();
  }


  // Collaboration slider. Add another .collab-slide article and the controls update automatically.
  const collabSlider = document.querySelector('[data-collab-slider]');
  if (
    collabSlider &&
    !collabSlider.hasAttribute('data-card-swap')
  ) {
    const track = collabSlider.querySelector('[data-collab-track]');
    const viewport = collabSlider.querySelector('[data-collab-viewport]');
    const slides = Array.from(collabSlider.querySelectorAll('[data-collab-slide]'));
    const prevButton = collabSlider.querySelector('[data-collab-prev]');
    const nextButton = collabSlider.querySelector('[data-collab-next]');
    const currentLabel = collabSlider.querySelector('[data-collab-current]');
    const totalLabel = collabSlider.querySelector('[data-collab-total]');
    const dotsWrap = collabSlider.querySelector('[data-collab-dots]');
    let activeIndex = 0;
    let autoplayTimer = null;
    let pointerStartX = 0;

    totalLabel.textContent = String(slides.length).padStart(2, '0');

    slides.forEach((slide, index) => {
      slide.setAttribute('aria-hidden', index === 0 ? 'false' : 'true');
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'collab-slider-dot';
      dot.setAttribute('aria-label', `Show collaboration ${index + 1}`);
      dot.addEventListener('click', () => showCollaboration(index, true));
      dotsWrap.appendChild(dot);
    });

    function showCollaboration(index, userAction = false) {
      activeIndex = (index + slides.length) % slides.length;
      track.style.transform = `translate3d(-${activeIndex * 100}%, 0, 0)`;
      currentLabel.textContent = String(activeIndex + 1).padStart(2, '0');

      slides.forEach((slide, slideIndex) => {
        slide.setAttribute('aria-hidden', slideIndex === activeIndex ? 'false' : 'true');
      });

      collabSlider.querySelectorAll('.collab-slider-dot').forEach((dot, dotIndex) => {
        dot.classList.toggle('is-active', dotIndex === activeIndex);
      });

      if (userAction) restartCollabAutoplay();
    }

    function nextCollaboration(userAction = false) {
      showCollaboration(activeIndex + 1, userAction);
    }

    function previousCollaboration(userAction = false) {
      showCollaboration(activeIndex - 1, userAction);
    }

    function startCollabAutoplay() {
      clearInterval(autoplayTimer);
      if (reduceMotion || slides.length < 2) return;
      autoplayTimer = setInterval(() => nextCollaboration(false), 2600);
    }

    function restartCollabAutoplay() {
      startCollabAutoplay();
    }

    prevButton?.addEventListener('click', () => previousCollaboration(true));
    nextButton?.addEventListener('click', () => nextCollaboration(true));

    viewport?.addEventListener('pointerdown', (event) => {
      pointerStartX = event.clientX;
    });

    viewport?.addEventListener('pointerup', (event) => {
      const distance = event.clientX - pointerStartX;
      if (Math.abs(distance) > 55) {
        distance < 0 ? nextCollaboration(true) : previousCollaboration(true);
      }
    });

    collabSlider.addEventListener('mouseenter', () => clearInterval(autoplayTimer));
    collabSlider.addEventListener('mouseleave', startCollabAutoplay);
    collabSlider.addEventListener('focusin', () => clearInterval(autoplayTimer));
    collabSlider.addEventListener('focusout', startCollabAutoplay);

    showCollaboration(0);
    startCollabAutoplay();
  }

  // Currency preview.
  const amount = document.querySelector('[data-budget-amount]');
  const currency = document.querySelector('[data-currency]');
  const preview = document.querySelector('[data-currency-preview]');
  const fallbackRates = { INR: 1, USD: 83, GBP: 106, EUR: 90, AED: 22.6, CAD: 61, AUD: 55, SGD: 62, JPY: 0.56 };
  const rateCache = { INR: 1 };
  let conversionTimer;
  const inrFormatter = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

  async function rateToINR(code) {
    if (rateCache[code]) return rateCache[code];
    try {
      const response = await fetch(`https://api.frankfurter.dev/v2/rate/${code}/INR`, { cache: 'force-cache' });
      if (!response.ok) throw new Error('Rate unavailable');
      const data = await response.json();
      const rate = Number(data.rate);
      if (rate) { rateCache[code] = rate; return rate; }
    } catch (error) {
      // Indicative fallback keeps the form usable offline.
    }
    return fallbackRates[code] || 1;
  }

  async function updateConversion() {
    const value = Number(amount?.value || 0);
    const code = currency?.value || 'INR';
    if (!preview) return;
    if (!value) {
      preview.textContent = 'Enter a budget to see an approximate INR conversion.';
      return;
    }
    preview.textContent = 'Calculating approximate conversion…';
    const rate = await rateToINR(code);
    preview.textContent = code === 'INR'
      ? `Budget preview: ${inrFormatter.format(value)}`
      : `Approximate INR value: ${inrFormatter.format(value * rate)} · reference estimate`;
  }

  [amount, currency].forEach((element) => element?.addEventListener('input', () => {
    clearTimeout(conversionTimer);
    conversionTimer = setTimeout(updateConversion, 350);
  }));

  // WhatsApp booking form.
  const bookingForm = document.querySelector('[data-booking-form]');
  const formStatus = document.querySelector('[data-form-status]');
  bookingForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = new FormData(bookingForm);
    const budgetAmount = Number(form.get('budgetAmount') || 0);
    const budgetCode = String(form.get('currency') || 'INR');
    const selectedCurrency = currency?.selectedOptions?.[0]?.textContent?.trim() || budgetCode;
    const budget = budgetAmount ? `${budgetAmount} ${selectedCurrency}` : 'Not specified';
    const budgetRate = rateCache[budgetCode] || fallbackRates[budgetCode] || 1;
    const budgetInr = budgetAmount ? inrFormatter.format(budgetAmount * budgetRate) : '';
    const countryCode = form.get('countryCode') === 'other' ? '' : form.get('countryCode');
    const message = [
      'Hello Ajay, I want to discuss a project.', '',
      `Name: ${form.get('name') || ''}`,
      `Email: ${form.get('email') || 'Not provided'}`,
      `Phone: ${countryCode || ''} ${form.get('phone') || ''}`,
      `Service: ${form.get('service') || ''}`,
      `Timeline: ${form.get('timeline') || ''}`,
      `Budget: ${budget}`,
      budgetAmount ? `Approx INR: ${budgetInr}${budgetCode === 'INR' ? '' : ' (reference estimate)'}` : '',
      `Project details: ${form.get('details') || ''}`, '',
      'Sent from AJAY NXT portfolio.'
    ].filter(Boolean).join('\n');

    const enquiry = {
      name: form.get('name') || '',
      email: form.get('email') || '',
      phone: `${countryCode || ''} ${form.get('phone') || ''}`.trim(),
      service: form.get('service') || '',
      timeline: form.get('timeline') || '',
      budget,
      budgetInr,
      details: form.get('details') || ''
    };
    const whatsappUrl = `https://wa.me/919929562585?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');

    if (formStatus) formStatus.textContent = 'WhatsApp opened. Saving your enquiry…';
    try {
      await loadFirebaseBundle();
      const result = await window.AJAY_NXT_FIREBASE?.saveEnquiry?.(enquiry);
      if (formStatus) {
        formStatus.textContent = result?.saved
          ? 'Enquiry saved. Continue in WhatsApp.'
          : 'Continue in WhatsApp.';
      }
    } catch {
      if (formStatus) formStatus.textContent = 'Opening WhatsApp. Your message is ready.';
    }
    window.AJAY_NXT_FIREBASE?.track?.('book_submit');
  });

  document.addEventListener('click', (event) => {
    const tracked = event.target.closest('[data-track]');
    if (!tracked || tracked.closest('form') && tracked.type === 'submit') return;
    trackEvent(tracked.dataset.track);
  });

  // Compact, accessible case studies. Firebase can replace their copy without
  // rebuilding the rest of the portfolio.
  const caseDialog = document.querySelector('[data-case-dialog]');
  const caseLive = caseDialog?.querySelector('[data-case-live]');

  function openCaseStudy(key) {
    const project = window.AJAY_NXT_SITE_CONTENT?.projects?.[key]
      || window.AJAY_NXT_DEFAULT_CONTENT?.projects?.[key];
    if (!caseDialog || !project) return;

    const fields = {
      '[data-case-eyebrow]': project.eyebrow,
      '[data-case-title]': project.title,
      '[data-case-summary]': project.summary,
      '[data-case-challenge]': project.challenge,
      '[data-case-solution]': project.solution,
      '[data-case-result]': project.result
    };
    Object.entries(fields).forEach(([selector, value]) => {
      const element = caseDialog.querySelector(selector);
      if (element) element.textContent = value || '';
    });

    const serviceList = caseDialog.querySelector('[data-case-services]');
    if (serviceList) {
      serviceList.innerHTML = '';
      (project.services || []).slice(0, 8).forEach((service) => {
        const tag = document.createElement('span');
        tag.textContent = service;
        serviceList.appendChild(tag);
      });
    }

    if (caseLive) {
      caseLive.hidden = !project.url;
      caseLive.href = project.url || '#';
    }

    caseDialog.showModal();
    trackEvent('case_study_open', `${window.location.pathname}#${key}`);
  }

  document.querySelectorAll('[data-case-study]').forEach((button) => {
    button.addEventListener('click', () => openCaseStudy(button.dataset.caseStudy));
  });
  caseDialog?.querySelector('[data-case-close]')?.addEventListener('click', () => caseDialog.close());
  caseDialog?.addEventListener('click', (event) => {
    if (event.target === caseDialog) caseDialog.close();
  });

  // Wedding Shedding links are kept in site-config.js so they can be replaced later.
  document.querySelectorAll('[data-collab-link]').forEach((link) => {
    const key = link.dataset.collabLink;
    const configuredUrl = window.AJAY_NXT_CONFIG?.weddingShedding?.[key]?.trim();

    if (configuredUrl) {
      link.href = configuredUrl;
      link.target = '_blank';
      link.rel = 'noreferrer';
      return;
    }

    link.classList.add('is-unavailable');
    link.setAttribute('aria-disabled', 'true');
    link.addEventListener('click', (event) => {
      event.preventDefault();
      const oldText = link.textContent;
      link.textContent = `${key === 'instagram' ? 'Instagram' : 'Facebook'} link pending`;
      setTimeout(() => { link.textContent = oldText; }, 1800);
    });
  });

  scheduleMotionBundle();
  scheduleFirebaseBundle();
})();
