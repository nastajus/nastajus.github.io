const siteNav = document.querySelector('.site-nav');
const primaryNavigation = [
  { label: 'Selected work', href: '/#featured' },
  { label: 'All projects', href: '/work/', currentPath: '/work/' },
  { label: 'Experience', href: '/experience/', currentPath: '/experience/' },
  { label: 'Visual folio', href: '/folio/' },
  { label: 'Résumé', href: '/resume/', currentPath: '/resume/' },
  { label: 'GitHub', href: 'https://github.com/nastajus?tab=repositories' },
  { label: 'Contact', href: 'mailto:ian.nastajus@gmail.com', className: 'nav-contact' }
];

if (siteNav) {
  const currentPath = window.location.pathname.replace(/\/index\.html$/, '/');
  siteNav.replaceChildren(...primaryNavigation.map((item) => {
    const link = document.createElement('a');
    link.textContent = item.label;
    link.href = item.href;
    if (item.className) link.className = item.className;
    if (item.currentPath === currentPath) link.setAttribute('aria-current', 'page');
    return link;
  }));
}

const menuButton = document.querySelector('.menu-button');

if (menuButton && siteNav) {
  menuButton.addEventListener('click', () => {
    const expanded = menuButton.getAttribute('aria-expanded') === 'true';
    menuButton.setAttribute('aria-expanded', String(!expanded));
    siteNav.classList.toggle('open', !expanded);
  });
}

const filterButtons = [...document.querySelectorAll('.filter-button')];
const directoryCards = [...document.querySelectorAll('.directory-card')];
const filterResult = document.querySelector('#filter-result');

if (filterButtons.length && directoryCards.length) {
  const applyFilter = (filter) => {
    let visible = 0;
    directoryCards.forEach((card) => {
      const categories = (card.dataset.category || '').split(' ');
      const show = filter === 'all' || categories.includes(filter);
      card.hidden = !show;
      if (show) visible += 1;
    });
    filterButtons.forEach((button) => {
      const selected = button.dataset.filter === filter;
      button.classList.toggle('active', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
    if (filterResult) filterResult.textContent = `${visible} project${visible === 1 ? '' : 's'} shown`;
  };

  filterButtons.forEach((button) => button.addEventListener('click', () => applyFilter(button.dataset.filter)));
  applyFilter('all');
}

const zoomableImages = [...document.querySelectorAll('.directory-card > img, .feature-image > img')];

if (zoomableImages.length) {
  const lightbox = document.createElement('div');
  lightbox.className = 'image-lightbox';
  lightbox.hidden = true;
  lightbox.setAttribute('role', 'dialog');
  lightbox.setAttribute('aria-modal', 'true');
  lightbox.setAttribute('aria-label', 'Expanded project image');
  lightbox.innerHTML = `
    <div class="lightbox-dialog">
      <button class="lightbox-close" type="button" aria-label="Close expanded image">×</button>
      <img alt="">
      <p class="lightbox-caption"></p>
    </div>`;
  document.body.append(lightbox);

  const expandedImage = lightbox.querySelector('img');
  const caption = lightbox.querySelector('.lightbox-caption');
  const closeButton = lightbox.querySelector('.lightbox-close');
  let opener = null;

  const closeLightbox = () => {
    if (lightbox.hidden) return;
    lightbox.hidden = true;
    document.body.classList.remove('lightbox-open');
    expandedImage.removeAttribute('src');
    if (opener) opener.focus();
  };

  const openLightbox = (button, image) => {
    opener = button;
    expandedImage.src = image.currentSrc || image.src;
    expandedImage.alt = image.alt;
    caption.textContent = image.alt;
    lightbox.hidden = false;
    document.body.classList.add('lightbox-open');
    closeButton.focus();
  };

  zoomableImages.forEach((image) => {
    const button = document.createElement('button');
    button.className = 'image-zoom';
    button.type = 'button';
    button.setAttribute('aria-label', `View larger: ${image.alt}`);
    image.before(button);
    button.append(image);
    button.addEventListener('click', () => openLightbox(button, image));
  });

  closeButton.addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', (event) => {
    if (event.target === lightbox) closeLightbox();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !lightbox.hidden) closeLightbox();
    if (event.key === 'Tab' && !lightbox.hidden) {
      event.preventDefault();
      closeButton.focus();
    }
  });
}
