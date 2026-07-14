const currentUser = JSON.parse(localStorage.getItem('momoCurrentUser') || 'null');

if (!currentUser) {
  window.location.href = '/auth/login.html?redirect=%2Fmy&message=login-required';
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
    value: '3,000',
    unit: '원 할인',
    title: '생일 축하 쿠폰',
    description: '15,000원 이상 주문 시 사용 가능',
    until: '2026.08.15까지'
  },
  {
    value: '무료배송',
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
    if (typeof getOrders !== 'function' || !currentUser) return [];
    const identities = [currentUser.id, currentUser.email].filter(Boolean).map((value) => String(value).trim().toLowerCase());
    return getOrders().filter((order) => [order.userId, order.userEmail, order.memberKey]
      .filter(Boolean)
      .some((value) => identities.includes(String(value).trim().toLowerCase())));
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
  const orderCount = orders.length;
  const total = orders.reduce((sum, order) => sum + Math.max(0, Number(order.totalAmount ?? order.total) || 0), 0);
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
  const availableCoupons = (() => {
    try {
      return typeof getMomoCoupons === 'function'
        ? getMomoCouponsForUser(currentUser).filter((coupon) => coupon.status === 'available' && !coupon.used)
        : [];
    } catch {
      return [];
    }
  })();
  document.querySelector('#couponCount').textContent = availableCoupons.length;
  document.querySelector('#totalSpent').textContent = won(total);
}

function renderRecentOrders() {
  const realOrders = getOrdersSafely()
    .slice()
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .map(getFirstOrderItem)
    .filter(Boolean)
    .slice(0, 3);
  const list = realOrders;

  document.querySelector('#recentOrders').innerHTML = list.length ? list.map((order) => `
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
  `).join('') : '<p class="recent-empty">아직 주문 내역이 없습니다.</p>';
}

function renderCoupons() {
  const storedCoupons = (() => {
    try {
      return typeof getMomoCoupons === 'function'
        ? getMomoCouponsForUser(currentUser).filter((coupon) => coupon.status === 'available' && !coupon.used).slice(0, 3).map((coupon) => ({
            value: coupon.type,
            unit: coupon.label,
            title: coupon.title,
            description: coupon.description || `${coupon.minimum || '제한 없음'} 이상 주문 시 사용 가능`,
            until: `${coupon.date}까지`
          }))
        : null;
    } catch {
      return null;
    }
  })();
  const visibleCoupons = Array.isArray(storedCoupons) ? storedCoupons : coupons;
  document.querySelector('#couponList').innerHTML = visibleCoupons.length ? visibleCoupons.map((coupon, index) => `
    <article class="coupon-ticket">
      <div class="coupon-value coupon-value-${index + 1}"><span>${safe(coupon.value)}</span><small>${safe(coupon.unit)}</small></div>
      <div class="coupon-info">
        <span class="coupon-kicker">MOMO BENEFIT</span>
        <strong>${safe(coupon.title)}</strong>
        <p>${safe(coupon.description)}</p>
        <time>${safe(coupon.until)}</time>
      </div>
    </article>
  `).join('') : '<p class="coupon-empty-message">현재 사용할 수 있는 쿠폰이 없습니다.</p>';
}

function renderMembershipBenefits() {
  const benefit = window.MomoLoyalty?.getBenefit();
  if (!benefit) return;
  const status = document.querySelector('#membershipStatus');
  const active = Boolean(benefit.membership && benefit.membership.status === 'active');
  status.textContent = active ? '멤버십 이용 중' : '멤버십 미가입';
  status.classList.toggle('is-active', active);
  if (!active) {
    status.innerHTML = '<a href="/community/event.html?action=membership">멤버십 시작하기</a>';
  }
  document.querySelector('#memberPoints').textContent = Number(benefit.points || 0).toLocaleString('ko-KR');
  document.querySelector('#memberRewards').textContent = Number(benefit.rewards || 0);
  document.querySelector('#stampProgress').textContent = `${benefit.stamps}/10`;
  document.querySelector('#stampGrid').innerHTML = Array.from({ length: 10 }, (_, index) => `
    <span class="stamp-slot${index < benefit.stamps ? ' is-stamped' : ''}">
      <img src="/assets/images/momo-header-logo.png?v=5" alt="${index < benefit.stamps ? '적립된 모모 스탬프' : ''}">
    </span>
  `).join('');

  const now = new Date();
  const memberOrders = getOrdersSafely().filter((order) => {
    const date = new Date(order.createdAt);
    return !Number.isNaN(date.getTime()) && date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
  });
  const monthlySpent = memberOrders.reduce((sum, order) => sum + Number(order.total || 0), 0);
  const grade = window.MomoLoyalty?.syncMonthlyGradeBenefits(monthlySpent) || window.MomoLoyalty?.getGrade(monthlySpent);
  if (grade) {
    document.querySelector('#currentGrade').textContent = grade.current;
    document.querySelector('#profileGrade').textContent = grade.current;
    document.querySelector('#gradeSpent').textContent = won(grade.amount);
    document.querySelector('#gradeBenefits').textContent = `등급 혜택 · ${grade.benefits.join(' · ')}`;
    document.querySelector('#gradePeriodLabel').textContent = `${now.getFullYear()}년 ${now.getMonth()+1}월 결제금액`;
    document.querySelector('#gradeProgress').style.width = `${grade.progress}%`;
    const gradePanel = document.querySelector('.grade-panel');
    gradePanel.classList.remove('grade-welcome','grade-silver','grade-gold','grade-vip');
    gradePanel.classList.add(`grade-${grade.current.toLowerCase()}`);
    document.querySelector('#gradeMessage').textContent = grade.next
      ? `다음 ${grade.next} 등급까지 ${won(grade.remaining)} 남았습니다.`
      : '모모커피의 최고 등급 혜택을 이용 중입니다.';
    const activeIndex = grade.grades.findIndex((item) => item.name === grade.current);
    document.querySelectorAll('#gradeSteps span').forEach((step, index) => {
      step.classList.toggle('is-reached', index <= activeIndex);
      step.classList.toggle('is-current', index === activeIndex);
    });
  }
}

function renderMyReviews() {
  const reviews = window.MomoLoyalty?.getReviews() || [];
  const orders = getOrdersSafely();
  const container = document.querySelector('#myReviewList');
  if (!reviews.length) {
    container.innerHTML = '<div class="review-empty"><span>♡</span><p>아직 작성한 리뷰가 없어요.</p><a href="/community/event.html?action=review">첫 리뷰 작성하기</a></div>';
    return;
  }
  container.innerHTML = reviews.map((review) => {
    const order = orders.find((item) => String(item.id) === String(review.orderId));
    const menuName = order?.items?.[0]?.name || '모모커피 주문';
    const date = new Date(review.createdAt).toISOString().slice(0, 10).replaceAll('-', '.');
    return `<article class="my-review-item">
      <div><strong>${safe(menuName)}</strong><span>${'♥'.repeat(Number(review.rating || 0))}${'♡'.repeat(5 - Number(review.rating || 0))}</span></div>
      <p>${safe(review.text)}</p>
      <small>${date} · ${Number(review.rewardPoints || 0).toLocaleString('ko-KR')}P 적립</small>
    </article>`;
  }).join('');
}

function bindLogout() {
  document.querySelector('#logoutButton')?.addEventListener('click', () => {
    localStorage.removeItem('momoCurrentUser');
    window.location.href = '/';
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
  renderMembershipBenefits();
  renderStats();
  renderRecentOrders();
  renderCoupons();
  renderMyReviews();
  bindLogout();
  bindSectionNavigation();
}
