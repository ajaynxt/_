(() => {
  const root = document.documentElement;
  const header = document.querySelector('[data-header]');
  const menuButton = document.querySelector('[data-menu-toggle]');
  const nav = document.querySelector('[data-nav]');
  const year = document.querySelector('[data-year]');
  const themeButton = document.querySelector('[data-theme-toggle]');
  // Motion is part of the approved AJAY NXT presentation. Individual effects
  // use calmer settings when needed, but the page should not become static.
  const reduceMotion = false;

  if (year) year.textContent = new Date().getFullYear();

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
      portraitFrame = window.requestAnimationFrame(animatePortrait);
    };

    portraitReveal.addEventListener('pointerenter', (event) => {
      pointerActive = true;
      setPointerTarget(event);
      portraitReveal.classList.add('is-revealing');
    });
    portraitReveal.addEventListener('pointermove', (event) => {
      if (event.pointerType !== 'mouse' && !pressed) return;
      pointerActive = true;
      setPointerTarget(event);
      portraitReveal.classList.add('is-revealing');
    }, { passive: true });
    portraitReveal.addEventListener('pointerleave', () => {
      pointerActive = false;
      pressed = false;
      portraitReveal.classList.remove('is-revealing');
      portraitReveal.classList.remove('is-pressed');
    });
    portraitReveal.addEventListener('pointerdown', (event) => {
      pointerActive = true;
      pressed = true;
      setPointerTarget(event);
      portraitReveal.classList.add('is-revealing');
      portraitReveal.classList.add('is-pressed');
      portraitReveal.setPointerCapture?.(event.pointerId);
    });
    window.addEventListener('pointerup', (event) => {
      if (!pressed) return;
      pressed = false;
      portraitReveal.classList.remove('is-pressed');
      if (event.pointerType !== 'mouse') {
        pointerActive = false;
        portraitReveal.classList.remove('is-revealing');
      }
    });

    portraitFrame = window.requestAnimationFrame(animatePortrait);
    window.addEventListener('pagehide', () => window.cancelAnimationFrame(portraitFrame), { once: true });
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
      videoLoadingTimer = setTimeout(() => screen?.classList.remove('is-loading-video'), 3500);

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

    showSlide(0);
    startAuto();
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
      autoplayTimer = setInterval(() => nextCollaboration(false), 3200);
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
  bookingForm?.addEventListener('submit', (event) => {
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
