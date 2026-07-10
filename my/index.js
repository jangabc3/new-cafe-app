const currentUser = JSON.parse(localStorage.getItem('momoCurrentUser') || 'null');

if (!currentUser) {
  window.location.href = '../login.html?redirect=my/index.html&message=login-required';
}

const demoOrders = [
  {
    id: 'demo-1',
    name: '바닐라 라떼',
    detail: 'ICED | Tall',
    date: '2026.07.08',
    price: 4500,
    image: '../assets/images/menu-vanilla-latte.png'
  },
  {
    id: 'demo-2',
    name: '크림 슈페너',
    detail: 'ICED | Tall',
    date: '2026.07.07',
    price: 5200,
    image: '../assets/images/menu-cream-supener.png'
  },
  {
    id: 'demo-3',
    name: '딸기 크림 라떼',
    detail: 'ICED | Tall',
    date: '2026.07.06',
    price: 5600,
    image: '../assets/images/menu-strawberry-cream-latte.png'
  }
];

const coupons = [
  {
    value: '10%',
    unit: 'OFF',
    title: '모모 멤버 감사 쿠폰',
    description: '10,000원 이상 주문 시 사용 가능',
    until: '2026.07.31까지'
  },
  {
    value: '3,000원',
    unit: 'OFF',
    title: '생일 축하 쿠폰',
    description: '15,000원 이상 주문 시 사용 가능',
    until: '2026.08.15까지'
  },
  {
    value: '무료 배송',
    unit: 'FREE',
    title: '무료 배송 쿠폰',
    description: '모든 주문 사용 가능',
    until: '2026.07.20까지'
  }
];

const won = (value) => `${Number(value || 0).toLocaleString('ko-KR')}원`;
const safe = (value) => String(value ?? '').replace(/[&<>"]/g, (char) => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;'
}[char]));

function normalizeImagePath(image) {
  if (!image) return '../assets/images/momo-face-cute.png';
  if (image.startsWith('../') || image.startsWith('http')) return image;
  return `../${image}`;
}

function getOrdersSafely() {
  try {
    return typeof getOrders === 'function' ? getOrders() : [];
  } catch {
    return [];
  }
}

function getCartSafely() {
  try {
    return typeof getCart === 'function' ? getCart() : [];
  } catch {
    return [];
  }
}

function getFirstOrderItem(order) {
  const first = order?.items?.[0];
  if (!first) return null;
  const menu = typeof getMenuById === 'function' ? getMenuById(first.menuId) : null;
  return {
    name: first.name || menu?.name || '모모 메뉴',
    detail: `${first.options?.temperature || 'ICED'} | Tall`,
    date: new Date(order.createdAt || Date.now()).toISOString().slice(0, 10).replaceAll('-', '.'),
    price: Number(first.price || menu?.price || order.total || 0),
    image: normalizeImagePath(menu?.image)
  };
}

function renderUser() {
  const name = currentUser?.name || '모모';
  const email = currentUser?.email || 'momo@example.com';
  const phone = currentUser?.phone || '010-1234-5678';
  const joined = currentUser?.createdAt
    ? new Date(currentUser.createdAt).toISOString().slice(0, 10).replaceAll('-', '.')
    : '2026.06.01';

  document.querySelector('#memberName').textContent = `${name}님`;
  document.querySelector('#profileName').textContent = `${name} 고객님`;
  document.querySelector('#profileEmail').textContent = email;
  document.querySelector('#profilePhone').textContent = phone;
  document.querySelector('#profileJoined').textContent = `${joined} 가입`;
}

function renderStats() {
  const orders = getOrdersSafely();
  const cart = getCartSafely();
  const orderCount = orders.length || 17;
  const total = orders.reduce((sum, order) => sum + Number(order.total || 0), 0) || 333200;
  const likedMenus = (() => {
    try {
      const records = JSON.parse(localStorage.getItem('momoLikedMenuIds'));
      return Array.isArray(records) ? records.length : 0;
    } catch {
      return 0;
    }
  })();
  const favoriteCount = Number(localStorage.getItem('momoFavoriteCount') || 0) || likedMenus;

  document.querySelector('#totalOrders').textContent = orderCount;
  document.querySelector('#favoriteCount').textContent = favoriteCount;
  document.querySelector('#couponCount').textContent = coupons.length;
  document.querySelector('#totalSpent').textContent = won(total);
}

function renderRecentOrders() {
  const realOrders = getOrdersSafely()
    .slice()
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .map(getFirstOrderItem)
    .filter(Boolean)
    .slice(0, 3);
  const list = realOrders.length ? realOrders : demoOrders;

  document.querySelector('#recentOrders').innerHTML = list.map((order) => `
    <article class="recent-item">
      <img src="${safe(order.image)}" alt="${safe(order.name)}">
      <div>
        <span class="order-status">주문 완료</span>
        <h3>${safe(order.name)}</h3>
        <p>${safe(order.detail)}</p>
        <p>${safe(order.date)}</p>
      </div>
      <strong class="recent-price">${won(order.price)}</strong>
    </article>
  `).join('');
}

function renderCoupons() {
  document.querySelector('#couponList').innerHTML = coupons.map((coupon) => `
    <article class="coupon-ticket">
      <div class="coupon-value">${safe(coupon.value)}<small>${safe(coupon.unit)}</small></div>
      <div class="coupon-info">
        <strong>${safe(coupon.title)}</strong>
        <p>${safe(coupon.description)}<br>${safe(coupon.until)}</p>
      </div>
    </article>
  `).join('');
}

function bindLogout() {
  document.querySelector('#logoutButton')?.addEventListener('click', () => {
    localStorage.removeItem('momoCurrentUser');
    window.location.href = '../index.html';
  });
}

function bindSectionNavigation() {
  const sectionLinks = [...document.querySelectorAll('[data-section-link]')];
  const sidebarLinks = [...document.querySelectorAll('.mypage-sidebar .side-link[href]')];

  const focusSection = (hash) => {
    const target = document.querySelector(hash);
    if (!target) return;

    document.querySelectorAll('.is-section-focused').forEach((element) => {
      element.classList.remove('is-section-focused');
    });
    sidebarLinks.forEach((link) => {
      link.classList.toggle('is-active', link.getAttribute('href') === hash);
    });

    target.classList.add('is-section-focused');
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  sectionLinks.forEach((link) => {
    link.addEventListener('click', (event) => {
      const hash = link.getAttribute('href');
      if (!hash || !hash.startsWith('#')) return;

      event.preventDefault();
      history.replaceState(null, '', hash);
      focusSection(hash);
    });
  });

  if (window.location.hash) {
    window.setTimeout(() => focusSection(window.location.hash), 80);
  }
}

if (currentUser) {
  renderUser();
  renderStats();
  renderRecentOrders();
  renderCoupons();
  bindLogout();
  bindSectionNavigation();
}
