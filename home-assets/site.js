const menuButton = document.querySelector('.menu-button');
const siteNav = document.querySelector('.site-nav');

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
