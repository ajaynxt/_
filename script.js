(() => {
  const root = document.documentElement;
  const header = document.querySelector('[data-header]');
  const menuButton = document.querySelector('[data-menu-toggle]');
  const nav = document.querySelector('[data-nav]');
  const year = document.querySelector('[data-year]');
  const themeButton = document.querySelector('[data-theme-toggle]');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (year) year.textContent = new Date().getFullYear();

  const updateHeader = () => header?.classList.toggle('is-scrolled', window.scrollY > 24);
  updateHeader();
  window.addEventListener('scroll', updateHeader, { passive: true });

  menuButton?.addEventListener('click', () => {
    const open = menuButton.getAttribute('aria-expanded') === 'true';
    menuButton.setAttribute('aria-expanded', String(!open));
    nav?.classList.toggle('is-open', !open);
  });

  nav?.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => {
    menuButton?.setAttribute('aria-expanded', 'false');
    nav?.classList.remove('is-open');
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

  // Cursor glow only on fine-pointer devices.
  const glow = document.querySelector('[data-cursor-glow]');
  if (glow && !reduceMotion && window.matchMedia('(pointer:fine)').matches) {
    window.addEventListener('pointermove', (event) => {
      glow.style.left = `${event.clientX}px`;
      glow.style.top = `${event.clientY}px`;
      glow.style.opacity = '1';
    }, { passive: true });
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
  }));

  // Large video slider using Google Drive previews. Posters still load first.
  const videoSlides = [
    {
      preview: 'https://drive.google.com/file/d/1rHtR4uG8tW_JgPfMrMwH-0p_Bz6WKB-9/preview',
      poster: './assets/posters/film-01-wedding-song.webp',
      title: 'Wedding Song Film', category: 'Wedding Film · Colour · Rhythm', duration: '00:24',
      description: 'Music-led pacing, clean colour work and a polished cinematic finish.'
    },
    {
      preview: 'https://drive.google.com/file/d/1OEKC3RiGv8VMj5-l7efxxqF9F2RHFBvM/preview',
      poster: './assets/posters/film-02-family-moments.webp',
      title: 'Family Wedding Moments', category: 'Emotion · Monochrome · Story', duration: '00:35',
      description: 'A warm family sequence shaped around expressions, timing and memory.'
    },
    {
      preview: 'https://drive.google.com/file/d/1HdqCYTuI7mgjj67ebeQuyUjHVJKaHq6a/preview',
      poster: './assets/posters/film-03-mehndi-bride.webp',
      title: 'Mehndi Bridal Story', category: 'Portrait Motion · Detail · Flow', duration: '00:22',
      description: 'Mehndi-day atmosphere, bridal focus and elegant movement in a refined short film.'
    },
    {
      preview: 'https://drive.google.com/file/d/1VuNVLgf-9GpYKxKxCJ0Vq1yvis03Uwa_/preview',
      poster: './assets/posters/film-04-haldi.webp',
      title: 'Haldi Ceremony Film', category: 'Celebration · Colour · Motion', duration: '00:26',
      description: 'Bright haldi energy translated into a fast, clean and celebratory sequence.'
    },
    {
      preview: 'https://drive.google.com/file/d/1FXb2XyF0sv6iQj5IwKAJqvDlKHIricwn/preview',
      poster: './assets/posters/film-05-guest-entry.webp',
      title: 'Guest Entry Sequence', category: 'Entrance · Event Flow · Impact', duration: '00:18',
      description: 'An energetic guest-entry edit designed to feel polished, grand and memorable.'
    },
    {
      preview: 'https://drive.google.com/file/d/1qy1_MYpCxCqJQeyXoXspevioKa_QUF3O/preview',
      poster: './assets/posters/film-06-cinematic-song.webp',
      title: 'Cinematic Song Edit', category: 'Music Edit · Pace · Emotion', duration: '00:31',
      description: 'A music-driven cut balancing cinematic rhythm with emotional continuity.'
    },
    {
      preview: 'https://drive.google.com/file/d/1AsaZtcogvHMDCtarn8eENBBNCm5xFDJ4/preview',
      poster: './assets/posters/film-07-wedding-song-two.webp',
      title: 'Wedding Song Edit II', category: 'Wedding Film · Story · Timing', duration: '00:29',
      description: 'A second music-film treatment with clean transitions and wedding-story flow.'
    },
    {
      preview: 'https://drive.google.com/file/d/1VuULcRrXVhrOJSp4ifPdBqkmntrJXa9h/preview',
      poster: './assets/posters/film-08-final-timeline.webp',
      title: 'Final Timeline Cut', category: 'Timeline Finish · Mix · Delivery', duration: '00:27',
      description: 'A polished final-timeline sample showing rhythm, structure and finishing control.'
    },
    {
      preview: 'https://drive.google.com/file/d/1yWpUlrZkoxkRhtDMDUwH_RcU0PylV5HQ/preview',
      poster: './assets/posters/film-09-selected-wedding-film.webp',
      title: 'Selected Wedding Film', category: 'Feature Cut · Mood · Visual Recall', duration: '00:33',
      description: 'A selected wedding-film sample focused on mood, continuity and memorable finish.'
    }
  ];

  const slider = document.querySelector('[data-video-slider]');
  if (slider && videoSlides.length) {
    const screen = slider.querySelector('.cinema-screen');
    const legacyVideo = slider.querySelector('[data-main-video]');
    const playButton = slider.querySelector('[data-main-play]');
    const title = slider.querySelector('[data-video-title]');
    const category = slider.querySelector('[data-video-category]');
    const description = slider.querySelector('[data-video-description]');
    const index = slider.querySelector('[data-video-index]');
    const duration = slider.querySelector('[data-video-duration]');
    const current = slider.querySelector('[data-video-current]');
    const total = slider.querySelector('[data-video-total]');
    const prevPoster = slider.querySelector('[data-prev-poster]');
    const prevTitle = slider.querySelector('[data-prev-title]');
    const nextPoster = slider.querySelector('[data-next-poster]');
    const nextTitle = slider.querySelector('[data-next-title]');
    const dotsWrap = slider.querySelector('[data-video-dots]');
    const prevButton = slider.querySelector('[data-video-prev]');
    const nextButton = slider.querySelector('[data-video-next]');
    const prevPreview = slider.querySelector('[data-video-prev-preview]');
    const nextPreview = slider.querySelector('[data-video-next-preview]');
    const autoButton = slider.querySelector('[data-video-auto]');

    let activeIndex = 0;
    let autoEnabled = !reduceMotion;
    let autoTimer = null;
    let pointerStartX = 0;
    let playerFrame = null;

    if (total) total.textContent = String(videoSlides.length).padStart(2, '0');

    // Hide the old <video> element because Google Drive uses an iframe preview.
    if (legacyVideo) legacyVideo.hidden = true;

    function unloadPlayer() {
      if (playerFrame) {
        playerFrame.remove();
        playerFrame = null;
      }
      if (playButton) playButton.hidden = false;
      if (screen) screen.style.backgroundImage = '';
    }

    function mountPoster(item) {
      if (!screen) return;
      screen.style.backgroundImage = `linear-gradient(rgba(2,5,6,.02), rgba(2,5,6,.02)), url('${item.poster}')`;
      screen.style.backgroundSize = 'cover';
      screen.style.backgroundPosition = 'center center';
    }

    function mountPlayer(item) {
      if (!screen) return;
      unloadPlayer();
      const iframe = document.createElement('iframe');
      iframe.className = 'cinema-embed';
      iframe.src = item.preview;
      iframe.allow = 'autoplay; fullscreen';
      iframe.setAttribute('allowfullscreen', 'true');
      iframe.setAttribute('loading', 'lazy');
      iframe.setAttribute('title', item.title);
      screen.appendChild(iframe);
      playerFrame = iframe;
      if (playButton) playButton.hidden = true;
      clearInterval(autoTimer);
    }

    function showSlide(nextIndex, userAction = false) {
      activeIndex = (nextIndex + videoSlides.length) % videoSlides.length;
      const item = videoSlides[activeIndex];
      const previous = videoSlides[(activeIndex - 1 + videoSlides.length) % videoSlides.length];
      const following = videoSlides[(activeIndex + 1) % videoSlides.length];

      unloadPlayer();
      mountPoster(item);

      if (title) title.textContent = item.title;
      if (category) category.textContent = item.category;
      if (description) description.textContent = item.description;
      if (duration) duration.textContent = item.duration;
      if (index) index.textContent = String(activeIndex + 1).padStart(2, '0');
      if (current) current.textContent = String(activeIndex + 1).padStart(2, '0');

      if (prevPoster) prevPoster.src = previous.poster;
      if (prevTitle) prevTitle.textContent = previous.title;
      if (nextPoster) nextPoster.src = following.poster;
      if (nextTitle) nextTitle.textContent = following.title;

      dotsWrap?.querySelectorAll('button').forEach((dot, dotIndex) => {
        dot.classList.toggle('is-active', dotIndex === activeIndex);
      });

      if (userAction && autoEnabled) startAuto();
    }

    function next(userAction = false) {
      showSlide(activeIndex + 1, userAction);
    }

    function previous(userAction = false) {
      showSlide(activeIndex - 1, userAction);
    }

    function startAuto() {
      clearInterval(autoTimer);
      if (!autoEnabled) return;
      autoTimer = window.setInterval(() => next(false), 5200);
    }

    function toggleAuto() {
      autoEnabled = !autoEnabled;
      autoButton?.classList.toggle('is-active', autoEnabled);
      autoButton?.setAttribute('aria-pressed', String(autoEnabled));
      autoButton && (autoButton.textContent = autoEnabled ? 'Auto slide on' : 'Auto slide off');
      if (autoEnabled) startAuto();
      else clearInterval(autoTimer);
    }

    videoSlides.forEach((item, dotIndex) => {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'cinema-dot';
      dot.setAttribute('aria-label', `Show ${item.title}`);
      dot.addEventListener('click', () => showSlide(dotIndex, true));
      dotsWrap?.appendChild(dot);
    });

    playButton?.addEventListener('click', () => {
      mountPlayer(videoSlides[activeIndex]);
    });

    prevButton?.addEventListener('click', () => previous(true));
    nextButton?.addEventListener('click', () => next(true));
    prevPreview?.addEventListener('click', () => previous(true));
    nextPreview?.addEventListener('click', () => next(true));
    autoButton?.addEventListener('click', toggleAuto);

    slider.addEventListener('pointerdown', (event) => { pointerStartX = event.clientX; });
    slider.addEventListener('pointerup', (event) => {
      const distance = event.clientX - pointerStartX;
      if (Math.abs(distance) > 55) distance < 0 ? next(true) : previous(true);
    });
    slider.addEventListener('mouseenter', () => clearInterval(autoTimer));
    slider.addEventListener('mouseleave', startAuto);

    showSlide(0);
    startAuto();
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
  bookingForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    const form = new FormData(bookingForm);
    const budget = form.get('budgetAmount') ? `${form.get('budgetAmount')} ${form.get('currency')}` : 'Not specified';
    const countryCode = form.get('countryCode') === 'other' ? '' : form.get('countryCode');
    const message = [
      'Hello Ajay, I want to discuss a project.', '',
      `Name: ${form.get('name') || ''}`,
      `Email: ${form.get('email') || 'Not provided'}`,
      `Phone: ${countryCode || ''} ${form.get('phone') || ''}`,
      `Service: ${form.get('service') || ''}`,
      `Timeline: ${form.get('timeline') || ''}`,
      `Budget: ${budget}`,
      `Project details: ${form.get('details') || ''}`, '',
      'Sent from AJAY NXT portfolio.'
    ].join('\n');
    window.open(`https://wa.me/919929562585?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
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
})();
