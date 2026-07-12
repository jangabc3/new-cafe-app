(() => {
  let operationSettings={};try{operationSettings=JSON.parse(localStorage.getItem('momoOperationSettings')||'{}')}catch{}
  document.documentElement.classList.toggle('momo-maintenance',Boolean(operationSettings.maintenanceMode));
  document.addEventListener('DOMContentLoaded',()=>{
    const visibility=[
      ['heroBannerEnabled','.landing-hero,.hero-spacer'],
      ['seasonMenuEnabled','.season-collection,.season-section'],
      ['eventSectionEnabled','.event-section,#event'],
      ['appPromotionEnabled','.app-section,#app']
    ];
    visibility.forEach(([key,selector])=>{if(operationSettings[key]===false)document.querySelectorAll(selector).forEach(node=>{node.hidden=true})});
  });
  if(operationSettings.noticeMessage||operationSettings.maintenanceMode){document.addEventListener('DOMContentLoaded',()=>{const key=operationSettings.updatedAt||operationSettings.noticeMessage;if(sessionStorage.getItem('momoNoticeClosed')===key)return;const bar=document.createElement('div');bar.className='operation-notice-bar';bar.innerHTML=`<span>${operationSettings.noticeMessage||'현재 사이트 점검 중이며 주문 기능이 제한됩니다.'}</span><button type="button" aria-label="운영 공지 닫기">×</button>`;bar.style.cssText='padding:10px 45px;text-align:center;background:#f1dfd5;color:#4a3026;font:600 13px Pretendard;position:relative;z-index:100';bar.querySelector('button').onclick=()=>{sessionStorage.setItem('momoNoticeClosed',key);bar.remove()};document.body.prepend(bar)})}
  const oldHeader = document.querySelector('.site-header');
  if (!oldHeader || oldHeader.matches('[data-mega-header]')) return;

  const root = '/';
  const path = window.location.pathname.replace(/\\/g, '/');
  const activeCategory =
    path.includes('/menus/') || path.includes('/menu/') || path.endsWith('/liked-menu.html') ? 'menu'
      : path.includes('/stores/') ? 'store'
        : path.includes('/community/') ? 'community'
          : path.includes('/story/') ? 'brand'
            : 'mypage';

  const header = document.createElement('header');
  header.className = 'site-header unified-header';
  header.dataset.megaHeader = '';
  header.innerHTML = `
    <div class="unified-header-inner">
      <a class="unified-brand" href="${root}index.html" aria-label="MOMO COFFEE home">
        <img src="${root}assets/images/momo-header-logo.png?v=5" alt="MOMO COFFEE" class="site-logo-image">
        <strong>MOMO COFFEE</strong>
      </a>
      <nav class="unified-nav" aria-label="main menu">
        <a href="${root}menus/list.html" data-mega-category="menu" aria-controls="globalMegaDropdown" aria-expanded="false">MENU</a>
        <a href="${root}stores/finder.html" data-mega-category="store" aria-controls="globalMegaDropdown" aria-expanded="false">STORE</a>
        <a href="${root}community/event.html" data-mega-category="community" aria-controls="globalMegaDropdown" aria-expanded="false">COMMUNITY</a>
        <a href="${root}story/brand.html" data-mega-category="brand" aria-controls="globalMegaDropdown" aria-expanded="false">BRAND</a>
        <a href="${root}my/index.html" data-mega-category="mypage" aria-controls="globalMegaDropdown" aria-expanded="false">MY PAGE</a>
      </nav>
      <div class="unified-actions">
        <a class="unified-login" href="${root}my/index.html">LOGIN</a>
        <a class="unified-order" href="${root}menus/list.html">ORDER</a>
        <a class="unified-cart" href="${root}basket/list.html" aria-label="장바구니">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 4h2l2.2 10.2a2 2 0 0 0 2 1.6h7.9a2 2 0 0 0 1.9-1.4L21 8H7"></path><circle cx="10" cy="20" r="1.3"></circle><circle cx="18" cy="20" r="1.3"></circle></svg>
          <span class="unified-cart-count" id="unifiedCartCount">0</span>
        </a>
      </div>
    </div>
    <div class="global-mega-dropdown" id="globalMegaDropdown" aria-hidden="true">
      <div class="global-mega-inner">
        <section class="global-mega-column global-menu-column" data-mega-column="menu">
          <h2>MENU</h2>
          <div class="global-menu-group"><h3>&#xC74C;&#xB8CC;</h3><a href="${root}menus/list.html?category=coffee">&#xCEE4;&#xD53C;</a><a href="${root}menus/list.html?category=noncoffee">&#xB17C;&#xCEE4;&#xD53C;</a><a href="${root}menus/list.html?category=tea">&#xD2F0;</a><a href="${root}menus/list.html?category=season">&#xC2DC;&#xC98C; &#xBA54;&#xB274;</a></div>
          <div class="global-menu-group"><h3>&#xD478;&#xB4DC;</h3><a href="${root}menus/list.html?category=dessert">&#xB514;&#xC800;&#xD2B8;</a><a href="${root}menus/list.html?category=bakery">&#xBCA0;&#xC774;&#xCEE4;&#xB9AC;</a></div>
          <div class="global-menu-group"><h3>&#xC0C1;&#xD488;</h3><a href="${root}menu/goods.html">MD</a></div>
        </section>
        <section class="global-mega-column" data-mega-column="store"><h2>STORE</h2><a href="${root}stores/finder.html">&#xB9E4;&#xC7A5; &#xCC3E;&#xAE30;</a></section>
        <section class="global-mega-column" data-mega-column="community"><h2>COMMUNITY</h2><a href="${root}community/notice.html">&#xACF5;&#xC9C0;&#xC0AC;&#xD56D;</a><a href="${root}community/event.html">&#xC774;&#xBCA4;&#xD2B8;</a><a href="${root}community/faq.html">FAQ</a><a href="${root}qna/list.html">1:1 문의</a></section>
        <section class="global-mega-column" data-mega-column="brand"><h2>BRAND</h2><a href="${root}story/brand.html">&#xBE0C;&#xB79C;&#xB4DC; &#xC18C;&#xAC1C;</a><a href="${root}story/bi.html">Brand Identity (BI)</a></section>
        <section class="global-mega-column" data-mega-column="mypage"><h2>MY PAGE</h2><a href="${root}my/index.html">&#xB9C8;&#xC774;&#xD398;&#xC774;&#xC9C0;</a><a href="${root}orders/list.html">&#xC8FC;&#xBB38; &#xB0B4;&#xC5ED;</a><a href="${root}liked-menu.html">&#xCC1C;&#xD55C; &#xBA54;&#xB274;</a><a href="${root}basket/list.html">&#xC7A5;&#xBC14;&#xAD6C;&#xB2C8;</a><a href="${root}coupon.html">&#xCFE0;&#xD3F0;&#xD568;</a><a href="${root}my/profile.html">&#xD68C;&#xC6D0; &#xC815;&#xBCF4; &#xC218;&#xC815;</a></section>
      </div>
    </div>`;

  oldHeader.replaceWith(header);

  try {
    const currentUser = JSON.parse(localStorage.getItem('momoCurrentUser') || 'null');
    const loginLink = header.querySelector('.unified-login');
    if (currentUser?.name && loginLink) {
      loginLink.textContent = `${currentUser.name}님`;
      loginLink.href = `${root}my/index.html`;
      const logout = document.createElement('button');
      logout.className = 'auth-logout';
      logout.type = 'button';
      logout.textContent = 'LOGOUT';
      logout.addEventListener('click', () => {
        localStorage.removeItem('momoCurrentUser');
        window.location.href = `${root}index.html`;
      });
      loginLink.insertAdjacentElement('afterend', logout);
    }
  } catch {
    // Keep the regular login link if stored member data is unavailable.
  }

  const cartCount = header.querySelector('#unifiedCartCount');
  const updateUnifiedCartCount = () => {
    let cart = [];
    try {
      cart = JSON.parse(localStorage.getItem('momo_coffee_cart_v1') || '[]');
    } catch {
      cart = [];
    }
    const quantity = Array.isArray(cart) ? cart.reduce((sum, item) => sum + Number(item.quantity || 0), 0) : 0;
    cartCount.textContent = String(quantity);
    cartCount.hidden = quantity === 0;
  };
  updateUnifiedCartCount();
  window.addEventListener('storage', updateUnifiedCartCount);
  window.addEventListener('momo-cart-updated', updateUnifiedCartCount);

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
