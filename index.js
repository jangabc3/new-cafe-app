const cartCount = $('#cartCount');
const hero = $('.hero');
const heroTrack = $('.hero-track');
const heroSlides = $$('.hero-slide');
const heroDots = $$('.hero-dots button');
const heroPrevButton = $('.hero-arrow-prev');
const heroNextButton = $('.hero-arrow-next');

function setMegaNavigation() {
  const header = document.querySelector('[data-mega-header]');
  if (!header) return;
  const dropdown = header.querySelector('.mega-dropdown');
  const triggers = [...header.querySelectorAll('.mega-trigger')];
  const columns = [...header.querySelectorAll('[data-mega-column]')];
  let activeCategory = '';

  const openDropdown = (category) => {
    activeCategory = category;
    header.classList.add('is-mega-open');
    dropdown.setAttribute('aria-hidden', 'false');
    triggers.forEach((trigger) => {
      const active = trigger.dataset.megaCategory === category;
      trigger.classList.toggle('is-active', active);
      trigger.setAttribute('aria-expanded', String(active));
    });
    columns.forEach((column) => column.classList.toggle('is-active', column.dataset.megaColumn === category));
  };

  const closeDropdown = () => {
    activeCategory = '';
    header.classList.remove('is-mega-open');
    dropdown.setAttribute('aria-hidden', 'true');
    triggers.forEach((trigger) => {
      trigger.classList.remove('is-active');
      trigger.setAttribute('aria-expanded', 'false');
    });
    columns.forEach((column) => column.classList.remove('is-active'));
  };

  triggers.forEach((trigger) => {
    trigger.addEventListener('mouseenter', () => openDropdown(trigger.dataset.megaCategory));
    trigger.addEventListener('focus', () => openDropdown(trigger.dataset.megaCategory));
    trigger.addEventListener('click', (event) => {
      if (!header.classList.contains('is-mega-open') || activeCategory !== trigger.dataset.megaCategory) {
        event.preventDefault();
        openDropdown(trigger.dataset.megaCategory);
      }
    });
  });
  header.addEventListener('mouseleave', closeDropdown);
  header.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeDropdown();
  });
}

function updateCartCount() {
  if (!cartCount) return;
  const quantity = getCart().reduce((sum, item) => sum + item.quantity, 0);
  cartCount.textContent = quantity;
  cartCount.hidden = quantity === 0;
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
    timerId = window.setInterval(nextSlide, 5600);
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
  const revealTargets = $$('.reveal, .landing-section, .summer-campaign, .story-band, .app-section');

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
    { threshold: 0.14 }
  );

  revealTargets.forEach((item) => observer.observe(item));
}

updateCartCount();
setMegaNavigation();
setHeroCarousel();
setRevealObserver();

function setSingleHeroCarousel() {
  const singleHero = $('.hero');
  const singleHeroBg = $('.hero > .hero-image');
  const label = $('.hero-content .eyebrow');
  const title = $('.hero-content .campaign-title');
  const bigTitleTop = $('.hero-content .title-cream');
  const bigTitleBottom = $('.hero-content .title-latte');
  const scriptTitle = $('.hero-content .title-script');
  const koreanTitle = $('.hero-content .campaign-support strong');
  const description = $('.hero-content .campaign-support span');
  const seasonText = $('.hero-content .campaign-support small');
  const button = $('.hero-content .primary-button');
  const dots = $$('.hero-dots button');
  const counter = $('.hero-counter');
  const prevButton = $('.hero-arrow-prev');
  const nextButton = $('.hero-arrow-next');

  const slides = [
    {
      theme: 'berry',
      image: 'assets/images/momo-strawberry-cream-latte-campaign.png',
      label: 'MOMO COFFEE · SEASON COLLECTION',
      bigTitle: 'CREAM|LATTE',
      scriptTitle: 'Sweet Berry',
      koreanTitle: '딸기 크림 라떼',
      description: '상큼한 딸기와 부드러운 크림을 담은 달콤한 한 잔',
      seasonText: '2026 SPRING SEASON LIMITED',
      buttonText: '시즌 메뉴 보기',
      href: 'menus/list.html?category=season',
      alt: 'MOMO COFFEE 딸기 크림 라떼 배너',
    },
    {
      theme: 'matcha',
      image: 'assets/images/momo-matcha-latte-campaign.png',
      label: 'MOMO COFFEE · SEASON COLLECTION',
      bigTitle: 'MATCHA|LATTE',
      scriptTitle: 'Fresh Green',
      koreanTitle: '말차 크림 라떼',
      description: '진한 말차와 달콤한 크림이 만드는 차분한 한 잔',
      seasonText: '2026 SPRING SEASON LIMITED',
      buttonText: '시즌 메뉴 보기',
      href: 'menus/list.html?category=noncoffee',
      alt: 'MOMO COFFEE 말차 크림 라떼 배너',
    },
    {
      theme: 'peach',
      image: 'assets/images/momo-peach-iced-tea-campaign.png',
      label: 'MOMO COFFEE · SUMMER COLLECTION',
      bigTitle: 'SUMMER|CAMPAIGN',
      scriptTitle: 'Summer Mood',
      koreanTitle: '여름 한정 피치 아이스 티',
      description: '복숭아 가득, 시원하게!',
      seasonText: '2026 SUMMER SEASON LIMITED',
      buttonText: '시즌 메뉴 보기',
      href: 'menus/list.html?category=season',
      alt: 'MOMO COFFEE 복숭아 아이스티 배너',
    },
    {
      theme: 'mango',
      image: 'assets/images/momo-cup-bingsu-campaign.png',
      label: 'MOMO COFFEE · SUMMER COLLECTION',
      bigTitle: 'MANGO|BINGSU',
      scriptTitle: 'Sweet Summer',
      koreanTitle: '모모커피 여름 신메뉴 컵빙수',
      description: '달콤하게, 시원하게, 한 컵 가득 행복을 담았어요!',
      seasonText: '2026 SUMMER NEW DESSERT',
      buttonText: '여름 시즌 메뉴 보기',
      href: '/menus/list.html?category=season',
      alt: 'MOMO COFFEE 컵빙수 여름 디저트 배너',
    },
  ];

  const mainSlideOrder = { mango: 0, berry: 1, peach: 2, matcha: 3 };
  slides.sort((a, b) => mainSlideOrder[a.theme] - mainSlideOrder[b.theme]);

  if (!singleHero || !singleHeroBg || !prevButton || !nextButton || slides.length <= 1) return;

  let currentIndex = 0;
  let timerId = null;

  const renderSlide = (index) => {
    const slide = slides[index];
    const [firstLine, ...restLines] = slide.bigTitle.split('|');

    singleHero.dataset.campaignTheme = slide.theme;
    singleHeroBg.src = slide.image;
    singleHeroBg.alt = slide.alt;
    if (label) label.textContent = slide.label;
    if (title) title.setAttribute('aria-label', `${slide.scriptTitle} ${slide.bigTitle.replace('|', ' ')}`);
    if (bigTitleTop) bigTitleTop.textContent = firstLine;
    if (bigTitleBottom) bigTitleBottom.textContent = restLines.join(' ') || firstLine;
    if (scriptTitle) scriptTitle.textContent = slide.scriptTitle;
    if (koreanTitle) koreanTitle.textContent = slide.koreanTitle;
    if (description) description.textContent = slide.description;
    if (seasonText) seasonText.textContent = slide.seasonText;
    if (button) {
      button.textContent = slide.buttonText;
      button.href = slide.href;
    }

    dots.forEach((dot, dotIndex) => {
      const active = dotIndex === index;
      dot.classList.toggle('is-active', active);
      dot.setAttribute('aria-selected', String(active));
    });
    if (counter) counter.textContent = `${index + 1} / ${slides.length}`;
  };

  const showSlide = (nextIndex) => {
    currentIndex = (nextIndex + slides.length) % slides.length;
    singleHero.classList.add('is-changing');

    window.setTimeout(() => {
      renderSlide(currentIndex);
      singleHero.classList.remove('is-changing');
    }, 180);
  };

  const nextSlide = () => showSlide(currentIndex + 1);
  const prevSlide = () => showSlide(currentIndex - 1);
  const stopAutoPlay = () => {
    if (timerId) window.clearInterval(timerId);
  };
  const startAutoPlay = () => {
    stopAutoPlay();
    timerId = window.setInterval(nextSlide, 3500);
  };
  const restartAutoPlay = () => startAutoPlay();

  prevButton.addEventListener('click', () => {
    prevSlide();
    restartAutoPlay();
  });

  nextButton.addEventListener('click', () => {
    nextSlide();
    restartAutoPlay();
  });

  dots.forEach((dot, index) => {
    dot.addEventListener('click', () => {
      showSlide(index);
      restartAutoPlay();
    });
  });

  renderSlide(0);
  startAutoPlay();
}

setSingleHeroCarousel();
