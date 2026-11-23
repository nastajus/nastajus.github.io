(() => {
  const scenes = [...document.querySelectorAll('[data-scene]')];
  const transitions = [...document.querySelectorAll('.transition')];
  const intro = document.querySelector('.intro');
  const progressBar = document.querySelector('.page-progress span');
  const navLinks = [...document.querySelectorAll('[data-nav]')];
  const galleries = new Map(
    [...document.querySelectorAll('[data-gallery]')].map((gallery) => [
      gallery.dataset.gallery,
      {
        images: [...gallery.querySelectorAll('[data-gallery-image]')],
        counter: gallery.querySelector('[data-gallery-counter]'),
        caption: gallery.querySelector('[data-gallery-caption]'),
        progress: gallery.closest('[data-scene]')?.querySelector('[data-scene-progress]'),
        scene: gallery.closest('[data-scene]'),
        orbit: gallery.querySelector('[data-gallery-orbit]') || gallery.closest('[data-scene]')?.querySelector('[data-gallery-orbit]'),
        mobileFeature: gallery.closest('[data-scene]')?.querySelector('[data-mobile-feature]'),
        current: -1
      }
    ])
  );
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  let sceneMetrics = [];
  let transitionMetrics = [];
  let viewportHeight = window.innerHeight;
  let scrollableHeight = 1;
  let ticking = false;
  let metricsDirty = true;
  let currentNav = '';

  const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
  const pageTop = (element) => element.getBoundingClientRect().top + window.scrollY;

  function measure() {
    viewportHeight = window.innerHeight;
    scrollableHeight = Math.max(1, document.documentElement.scrollHeight - viewportHeight);
    sceneMetrics = scenes.map((element) => {
      const top = pageTop(element);
      const height = element.offsetHeight;
      return {
        element,
        id: element.id,
        top,
        bottom: top + height,
        travel: Math.max(1, height - viewportHeight),
        inView: false
      };
    });
    transitionMetrics = transitions.map((element) => {
      const top = pageTop(element);
      const height = element.offsetHeight;
      return { element, top, bottom: top + height, height, renderedProgress: -1 };
    });
    metricsDirty = false;
  }

  function setGalleryFrame(gallery, index) {
    if (!gallery || index === gallery.current || reducedMotion.matches) return;
    gallery.current = index;
    gallery.images.forEach((image, imageIndex) => {
      const active = imageIndex === index;
      image.classList.toggle('is-active', active);
      image.setAttribute('aria-hidden', String(!active));
    });
    if (gallery.counter) {
      gallery.counter.textContent = `${String(index + 1).padStart(2, '0')} / ${String(gallery.images.length).padStart(2, '0')}`;
    }
    if (gallery.caption) gallery.caption.textContent = gallery.images[index].dataset.caption || '';
    if (gallery.mobileFeature) {
      const image = gallery.images[index];
      const mobileCounter = gallery.mobileFeature.querySelector('[data-mobile-counter]');
      const mobileTitle = gallery.mobileFeature.querySelector('[data-mobile-title]');
      const mobileSummary = gallery.mobileFeature.querySelector('[data-mobile-summary]');
      if (mobileCounter) mobileCounter.textContent = `${String(index + 1).padStart(2, '0')} / ${String(gallery.images.length).padStart(2, '0')}`;
      if (mobileTitle) mobileTitle.textContent = image.dataset.mobileTitle || image.dataset.title || '';
      if (mobileSummary) mobileSummary.textContent = image.dataset.mobileSummary || image.dataset.feature || image.dataset.caption || '';
    }
    if (gallery.progress) {
      gallery.progress.querySelectorAll('[data-scene-jump]').forEach((segment, segmentIndex) => {
        segment.classList.toggle('is-complete', segmentIndex <= index);
        segment.classList.toggle('is-current', segmentIndex === index);
        segment.setAttribute('aria-pressed', String(segmentIndex === index));
      });
    }
    if (gallery.orbit) {
      const positions = [
        ['0vw', '-.4rem', '-8deg'],
        ['5vw', '1.2rem', '-2deg'],
        ['10vw', '2.4rem', '5deg'],
        ['15vw', '.5rem', '11deg']
      ];
      const [x, y, rotation] = positions[index] || positions[0];
      gallery.orbit.style.setProperty('--orbit-x', x);
      gallery.orbit.style.setProperty('--orbit-y', y);
      gallery.orbit.style.setProperty('--orbit-r', rotation);
      const image = gallery.images[index];
      const orbitIndex = gallery.orbit.querySelector('[data-orbit-index]');
      const orbitTitle = gallery.orbit.querySelector('[data-orbit-title]');
      const orbitFeature = gallery.orbit.querySelector('[data-orbit-feature]');
      if (orbitIndex) orbitIndex.textContent = String(index + 1).padStart(2, '0');
      if (orbitTitle) orbitTitle.textContent = image.dataset.title || '';
      if (orbitFeature) orbitFeature.textContent = image.dataset.feature || '';
    }
  }

  function setActiveNav(id) {
    if (id === currentNav) return;
    currentNav = id;
    navLinks.forEach((link) => link.classList.toggle('is-active', link.dataset.nav === id));
  }

  function update() {
    ticking = false;
    if (metricsDirty) measure();

    const scrollY = window.scrollY;
    const viewportBottom = scrollY + viewportHeight;
    const viewportCenter = scrollY + viewportHeight / 2;
    if (progressBar) progressBar.style.transform = `scaleX(${clamp(scrollY / scrollableHeight).toFixed(4)})`;

    let activeScene = '';
    let activeDistance = Number.POSITIVE_INFINITY;

    sceneMetrics.forEach((metric) => {
      const visible = metric.bottom > scrollY && metric.top < viewportBottom;
      const progress = clamp((scrollY - metric.top) / metric.travel);
      metric.element.classList.toggle('is-gallery-focused', progress >= .04);

      if (visible !== metric.inView) {
        metric.inView = visible;
        metric.element.classList.toggle('is-in-view', visible);
      }

      if (visible) {
        const distance = Math.abs(metric.top + (metric.bottom - metric.top) / 2 - viewportCenter);
        if (distance < activeDistance) {
          activeDistance = distance;
          activeScene = metric.id;
        }

      }

      const gallery = galleries.get(metric.id);
      if (gallery) {
        if (gallery.mobileFeature) gallery.mobileFeature.setAttribute('aria-hidden', String(progress < .04));
        setGalleryFrame(gallery, Math.min(gallery.images.length - 1, Math.floor(progress * gallery.images.length)));
      }
    });

    transitionMetrics.forEach((metric) => {
      if (metric.bottom <= scrollY || metric.top >= viewportBottom || reducedMotion.matches) return;
      const progress = clamp((viewportBottom - metric.top) / (viewportHeight + metric.height));
      if (Math.abs(progress - metric.renderedProgress) < 0.008) return;
      metric.renderedProgress = progress;
      metric.element.style.setProperty('--transition-progress', progress.toFixed(3));
    });

    setActiveNav(activeScene);
  }

  function requestUpdate({ remeasure = false } = {}) {
    metricsDirty ||= remeasure;
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  }

  const introObserver = new IntersectionObserver(([entry]) => {
    intro?.classList.toggle('is-motion-active', entry.isIntersecting && !document.hidden);
  }, { threshold: 0.02 });
  if (intro) introObserver.observe(intro);

  window.addEventListener('scroll', () => {
    const activeElement = document.activeElement;
    if (activeElement instanceof HTMLElement && activeElement.matches('[data-scene-jump]')) activeElement.blur();
    requestUpdate();
  }, { passive: true });
  window.addEventListener('resize', () => requestUpdate({ remeasure: true }), { passive: true });
  window.addEventListener('load', () => requestUpdate({ remeasure: true }), { once: true });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) intro?.classList.remove('is-motion-active');
    requestUpdate();
  });
  reducedMotion.addEventListener?.('change', () => {
    galleries.forEach((gallery) => {
      gallery.current = -1;
      gallery.images.forEach((image) => image.removeAttribute('aria-hidden'));
    });
    requestUpdate({ remeasure: true });
  });

  galleries.forEach((gallery) => {
    gallery.progress?.querySelectorAll('[data-scene-jump]').forEach((button) => {
      button.addEventListener('click', () => {
        if (metricsDirty) measure();
        const metric = sceneMetrics.find((item) => item.element === gallery.scene);
        const index = Number(button.dataset.sceneJump);
        if (!metric || !Number.isInteger(index)) return;
        // Use evenly spaced frame starts; the inset keeps the final frame inside the sticky scene.
        const targetProgress = (index + .08) / gallery.images.length;
        const target = metric.top + metric.travel * targetProgress;
        window.scrollTo({ top: target, behavior: reducedMotion.matches ? 'auto' : 'smooth' });
      });
    });
  });

  galleries.forEach((gallery) => setGalleryFrame(gallery, 0));
  requestUpdate({ remeasure: true });
})();
