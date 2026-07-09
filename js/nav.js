(() => {
  const oldHeader = document.querySelector('.site-header');
  if (!oldHeader || oldHeader.matches('[data-mega-header]')) return;

  const root = '../';
  const path = window.location.pathname;
  const activeCategory =
    path.includes('/menus/') || path.includes('/menu/') ? 'menu'
      : path.includes('/stores/') ? 'store'
        : path.includes('/community/') ? 'community'
          : path.includes('/story/') ? 'brand'
            : 'mypage';

  const header = document.createElement('header');
  header.className = 'site-header unified-header';
  header.dataset.megaHeader = '';
  header.innerHTML = `
    <div class="unified-header-inner">
      <a class="unified-brand" href="${root}index.html" aria-label="모모커피 홈">
        <img src="${root}assets/images/momo-cutout-tight.png" alt="">
        <strong>MOMO COFFEE</strong>
      </a>
      <nav class="unified-nav" aria-label="주요 메뉴">
        <a href="${root}menus/list.html" data-mega-category="menu" aria-controls="globalMegaDropdown" aria-expanded="false">MENU</a>
        <a href="${root}stores/finder.html" data-mega-category="store" aria-controls="globalMegaDropdown" aria-expanded="false">STORE</a>
        <a href="${root}community/event.html" data-mega-category="community" aria-controls="globalMegaDropdown" aria-expanded="false">COMMUNITY</a>
        <a href="${root}story/brand.html" data-mega-category="brand" aria-controls="globalMegaDropdown" aria-expanded="false">BRAND</a>
        <a href="${root}my/index.html" data-mega-category="mypage" aria-controls="globalMegaDropdown" aria-expanded="false">MY PAGE</a>
      </nav>
      <div class="unified-actions">
        <a class="unified-login" href="${root}my/index.html">LOGIN</a>
        <a class="unified-order" href="${root}menus/list.html">ORDER</a>
      </div>
    </div>
    <div class="global-mega-dropdown" id="globalMegaDropdown" aria-hidden="true">
      <div class="global-mega-inner">
        <section class="global-mega-column global-menu-column" data-mega-column="menu">
          <h2>MENU</h2>
          <div class="global-menu-group"><h3>음료</h3><a href="${root}menus/list.html?category=coffee">커피</a><a href="${root}menus/list.html?category=noncoffee">논커피</a><a href="${root}menus/list.html?category=tea">티</a><a href="${root}menus/list.html?category=season">시즌 메뉴</a></div>
          <div class="global-menu-group"><h3>푸드</h3><a href="${root}menus/list.html?category=dessert">디저트</a><a href="${root}menus/list.html?category=bakery">베이커리</a></div>
          <div class="global-menu-group"><h3>상품</h3><a href="${root}menu/goods.html">MD</a></div>
        </section>
        <section class="global-mega-column" data-mega-column="store"><h2>STORE</h2><a href="${root}stores/finder.html">매장 찾기</a></section>
        <section class="global-mega-column" data-mega-column="community"><h2>COMMUNITY</h2><a href="${root}community/notice.html">공지사항</a><a href="${root}community/faq.html">자주 묻는 질문</a><a href="${root}community/event.html">이벤트</a></section>
        <section class="global-mega-column" data-mega-column="brand"><h2>BRAND</h2><a href="${root}story/brand.html">브랜드 소개</a><a href="${root}story/bi.html">Brand Identity (BI)</a></section>
        <section class="global-mega-column" data-mega-column="mypage"><h2>MY PAGE</h2><a href="${root}my/index.html">마이페이지</a><a href="${root}orders/list.html">주문 내역</a><a href="${root}basket/list.html">장바구니</a><a href="${root}my/index.html#coupons">쿠폰</a><a href="${root}my/index.html#profile">회원 정보 수정</a></section>
      </div>
    </div>`;

  oldHeader.replaceWith(header);

  const dropdown = header.querySelector('.global-mega-dropdown');
  const triggers = [...header.querySelectorAll('[data-mega-category]')];
  const columns = [...header.querySelectorAll('[data-mega-column]')];
  let openCategory = '';

  const open = (category) => {
    openCategory = category;
    header.classList.add('is-mega-open');
    dropdown.setAttribute('aria-hidden', 'false');
    triggers.forEach((trigger) => {
      const isActive = trigger.dataset.megaCategory === category;
      trigger.classList.toggle('is-active', isActive);
      trigger.setAttribute('aria-expanded', String(isActive));
    });
    columns.forEach((column) => column.classList.toggle('is-active', column.dataset.megaColumn === category));
  };

  const close = () => {
    openCategory = '';
    header.classList.remove('is-mega-open');
    dropdown.setAttribute('aria-hidden', 'true');
    triggers.forEach((trigger) => {
      trigger.classList.toggle('is-current', trigger.dataset.megaCategory === activeCategory);
      trigger.classList.remove('is-active');
      trigger.setAttribute('aria-expanded', 'false');
    });
    columns.forEach((column) => column.classList.remove('is-active'));
  };

  triggers.forEach((trigger) => {
    trigger.classList.toggle('is-current', trigger.dataset.megaCategory === activeCategory);
    trigger.addEventListener('mouseenter', () => open(trigger.dataset.megaCategory));
    trigger.addEventListener('focus', () => open(trigger.dataset.megaCategory));
    trigger.addEventListener('click', (event) => {
      if (!header.classList.contains('is-mega-open') || openCategory !== trigger.dataset.megaCategory) {
        event.preventDefault();
        open(trigger.dataset.megaCategory);
      }
    });
  });

  header.addEventListener('mouseleave', close);
  header.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') close();
  });
})();
