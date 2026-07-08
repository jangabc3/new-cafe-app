const cartCount = $('#cartCount');
const featuredGrid = $('#featuredGrid');
const hero = $('.hero');
const heroTrack = $('.hero-track');
const heroSlides = $$('.hero-slide');
const heroDots = $$('.hero-dots button');
const heroPrevButton = $('.hero-arrow-prev');
const heroNextButton = $('.hero-arrow-next');

function updateCartCount() {
  cartCount.textContent = getCart().reduce((sum, item) => sum + item.quantity, 0);
}

function renderFeaturedMenus() {
  const featuredIds = [1, 6, 2, 9, 5, 12];
  const featured = featuredIds.map((id) => getMenuById(id)).filter(Boolean);
  renderList(
    featuredGrid,
    featured,
    (menu, index) => `
      <a class="featured-card" href="menus/detail.html?id=${encodeURIComponent(menu.id)}">
        <span class="menu-rank">${index < 3 ? `BEST ${index + 1}` : 'NEW'}</span>
        <span class="item-art">
          ${menu.image ? `<img src="${escapeHtml(menu.image)}" alt="${escapeHtml(menu.name)}">` : `<span>${escapeHtml(menu.emoji || menu.name.slice(0, 1))}</span>`}
        </span>
        <span class="featured-info">
          <h3>${escapeHtml(menu.name)}</h3>
          <span class="featured-desc">${escapeHtml(menu.description)}</span>
          <p>${formatPrice(menu.price)}</p>
        </span>
        <span class="quick-action" aria-hidden="true">${index >= 3 ? '+' : '♡'}</span>
      </a>
    `
  );
}

function setHeroCarousel() {
  if (!hero || !heroTrack || !heroPrevButton || !heroNextButton || heroSlides.length <= 1) return;

  let currentIndex = 0;
  let timerId = null;
  let startX = 0;
  let pointerDown = false;

  const showSlide = (nextIndex) => {
    currentIndex = (nextIndex + heroSlides.length) % heroSlides.length;
    heroTrack.style.transform = `translateX(-${currentIndex * 100}%)`;

    heroSlides.forEach((slide, index) => {
      const active = index === currentIndex;
      slide.classList.toggle('is-active', active);
      slide.setAttribute('aria-hidden', String(!active));
    });

    heroDots.forEach((dot, index) => {
      const active = index === currentIndex;
      dot.classList.toggle('is-active', active);
      dot.setAttribute('aria-selected', String(active));
    });
  };

  const nextSlide = () => showSlide(currentIndex + 1);
  const prevSlide = () => showSlide(currentIndex - 1);
  const stopAutoPlay = () => {
    if (timerId) window.clearInterval(timerId);
  };
  const startAutoPlay = () => {
    stopAutoPlay();
    timerId = window.setInterval(nextSlide, 5200);
  };

  heroDots.forEach((dot, index) => {
    dot.addEventListener('click', () => {
      showSlide(index);
      startAutoPlay();
    });
  });

  heroPrevButton.addEventListener('click', () => {
    prevSlide();
    startAutoPlay();
  });

  heroNextButton.addEventListener('click', () => {
    nextSlide();
    startAutoPlay();
  });

  hero.addEventListener('pointerdown', (event) => {
    pointerDown = true;
    startX = event.clientX;
    stopAutoPlay();
  });

  hero.addEventListener('pointerup', (event) => {
    if (!pointerDown) return;
    pointerDown = false;
    const diffX = event.clientX - startX;

    if (Math.abs(diffX) > 52) {
      diffX < 0 ? nextSlide() : prevSlide();
    }

    startAutoPlay();
  });

  hero.addEventListener('pointercancel', () => {
    pointerDown = false;
    startAutoPlay();
  });

  hero.addEventListener('mouseenter', stopAutoPlay);
  hero.addEventListener('mouseleave', startAutoPlay);
  hero.addEventListener('focusin', stopAutoPlay);
  hero.addEventListener('focusout', startAutoPlay);

  showSlide(0);
  startAutoPlay();
}

function setRevealObserver() {
  const revealTargets = $$('.reveal, .section-panel, .campaign-strip, .momo-pick, .season-showcase, .signature-story');

  if (!('IntersectionObserver' in window)) {
    revealTargets.forEach((item) => item.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.18 }
  );

  revealTargets.forEach((item) => observer.observe(item));
}

updateCartCount();
setHeroCarousel();
renderFeaturedMenus();
setRevealObserver();
