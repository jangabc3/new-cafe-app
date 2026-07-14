(() => {
  const CURRENT_USER_KEY = 'momoCurrentUser';
  const USERS_KEY = 'momoUsers';
  const COUPONS_KEY = 'momo_coffee_coupons_v1';
  const ORDERS_KEY = 'momo_coffee_orders_v1';
  const MEMBERSHIP_KEY = 'momo_memberships_v1';
  const REVIEWS_KEY = 'momo_event_reviews_v1';
  const BENEFITS_KEY = 'momo_member_benefits_v1';

  const read = (key, fallback) => {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
  };
  const write = (key, value) => localStorage.setItem(key, JSON.stringify(value));
  const user = () => read(CURRENT_USER_KEY, null);
  const userKey = (member) => String(member?.id || member?.email || '').toLowerCase();
  const toast = document.querySelector('#eventToast');
  const modal = document.querySelector('#reviewModal');
  const form = document.querySelector('#reviewEventForm');
  const orderSelect = document.querySelector('#reviewOrder');
  const reviewText = document.querySelector('#reviewText');
  const reviewLength = document.querySelector('#reviewLength');
  const ratingBox = document.querySelector('#reviewRating');
  let selectedRating = 5;

  const showToast = (message, action) => {
    if (!toast) return;
    toast.innerHTML = `<span>${message}</span>${action ? `<a href="${action.href}">${action.label}</a>` : ''}`;
    toast.hidden = false;
    requestAnimationFrame(() => toast.classList.add('is-visible'));
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => {
      toast.classList.remove('is-visible');
      setTimeout(() => { toast.hidden = true; }, 250);
    }, 3600);
  };

  const requireLogin = (action) => {
    if (user()) return true;
    const redirect = encodeURIComponent(`community/event.html?action=${action}`);
    window.location.href = `/auth/login.html?redirect=${redirect}&message=login-required`;
    return false;
  };

  const formatDate = (date) => new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric', month: '2-digit', day: '2-digit'
  }).format(new Date(date)).replace(/\. /g, '.').replace(/\.$/, '');

  const updateMemberPoints = (amount) => {
    if (window.MomoLoyalty) {
      window.MomoLoyalty.addPoints(amount);
      return;
    }
    const member = user();
    if (!member) return;
    const updated = { ...member, points: Number(member.points || 0) + amount };
    write(CURRENT_USER_KEY, updated);
    const users = read(USERS_KEY, []);
    if (Array.isArray(users)) {
      const index = users.findIndex((item) => String(item.id || item.email) === String(member.id || member.email));
      if (index >= 0) {
        users[index] = { ...users[index], points: updated.points };
        write(USERS_KEY, users);
      }
    }
  };

  const enrollMembership = () => {
    if (!requireLogin('enroll')) return;
    const member = user();
    const key = userKey(member);
    const memberships = read(MEMBERSHIP_KEY, {});
    if (!memberships[key]) {
      memberships[key] = { enrolledAt: member.createdAt || new Date().toISOString(), status: 'active', autoEnrolled: true };
      write(MEMBERSHIP_KEY, memberships);
    }
    updateMembershipButton();
    showToast('로그인 회원은 모모 멤버십을 자동으로 이용할 수 있어요.', { href: '../my/index.html#memberBenefits', label: '내 혜택 보기' });
  };

  const grantWelcomeCoupon = (notify = true) => {
    if (!requireLogin('welcome')) return;
    const member = user();
    const key = userKey(member);
    const claims = read('momo_welcome_claims_v1', {});
    if (claims[key]) {
      if (notify) showToast('웰컴 혜택을 이미 받으셨어요.', { href: '/my/coupons/coupon.html', label: '쿠폰 확인' });
      return;
    }

    const coupons = typeof getMomoCoupons === 'function' ? getMomoCoupons() : read(COUPONS_KEY, []);
    const safeCoupons = Array.isArray(coupons) ? coupons : [];
    const expires = new Date();
    expires.setFullYear(expires.getFullYear() + 1);
    safeCoupons.unshift({
      id: Date.now(), type: 'WELCOME', label: 'MEMBER', title: '신규 회원 웰컴 쿠폰',
      description: '모든 음료와 디저트 주문 시 사용할 수 있어요.', minimumAmount: 8000,
      maximumDiscount: 4000, minimum: '8,000원', maximum: '4,000원', dateLabel: '유효기간',
      date: formatDate(expires), status: 'available', tone: 'pink', discountType: 'fixed',
      discountValue: 4000, target: 'all', memberKey: key
    });
    if (typeof saveMomoCoupons === 'function') saveMomoCoupons(safeCoupons);
    else write(COUPONS_KEY, safeCoupons);
    claims[key] = { claimedAt: new Date().toISOString() };
    write('momo_welcome_claims_v1', claims);
    const benefits = read(BENEFITS_KEY, {});
    benefits[key] = { ...(benefits[key] || {}), stamps: Number(benefits[key]?.stamps || 0) + 2 };
    write(BENEFITS_KEY, benefits);
    if (notify) showToast('웰컴 쿠폰과 스탬프 2개가 지급됐어요.', { href: '/my/coupons/coupon.html', label: '쿠폰 확인' });
  };

  const updateMembershipButton = () => {
    const button = document.querySelector('[data-event-action="enroll"]');
    const member = user();
    if (!button || !member) return;
    button.textContent = '멤버십 이용 중';
    button.classList.add('is-member');
  };

  const getReviewableOrders = () => {
    const reviews = read(REVIEWS_KEY, []);
    const reviewedIds = new Set(reviews.filter((item) => item.memberKey === userKey(user())).map((item) => String(item.orderId)));
    return read(ORDERS_KEY, [])
      .filter((order) => Array.isArray(order.items) && order.items.length && !reviewedIds.has(String(order.id)))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  };

  const openReview = () => {
    if (!requireLogin('review')) return;
    const orders = getReviewableOrders();
    if (!orders.length) {
      showToast('리뷰를 작성할 주문이 아직 없어요.', { href: '../menus/list.html', label: '메뉴 주문하기' });
      return;
    }
    orderSelect.innerHTML = orders.map((order) => {
      const name = order.items[0]?.name || '모모커피 주문';
      return `<option value="${String(order.id).replace(/["&<>]/g, '')}">${formatDate(order.createdAt)} · ${name}</option>`;
    }).join('');
    selectedRating = 5;
    renderRating();
    reviewText.value = '';
    reviewLength.textContent = '0';
    modal.hidden = false;
    document.body.classList.add('has-event-modal');
    setTimeout(() => reviewText.focus(), 50);
  };

  const closeModal = () => {
    modal.hidden = true;
    document.body.classList.remove('has-event-modal');
  };

  const renderRating = () => {
    ratingBox.innerHTML = Array.from({ length: 5 }, (_, index) => {
      const value = index + 1;
      return `<button type="button" data-rating="${value}" class="${value <= selectedRating ? 'is-active' : ''}" aria-label="${value}점">♥</button>`;
    }).join('');
  };

  const showMembership = () => {
    if (!requireLogin('membership')) return;
    document.querySelector('.benefits-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    const member = user();
    showToast('현재 모모 멤버십 혜택을 이용 중이에요.', { href: '../my/index.html#memberBenefits', label: '내 혜택 보기' });
  };

  document.addEventListener('click', (event) => {
    const trigger = event.target.closest('[data-event-action]');
    if (trigger) {
      event.preventDefault();
      const action = trigger.dataset.eventAction;
      if (action === 'welcome') grantWelcomeCoupon();
      if (action === 'review') openReview();
      if (action === 'membership') showMembership();
      if (action === 'enroll') enrollMembership();
    }
    if (event.target.closest('[data-close-modal]')) closeModal();
    const rating = event.target.closest('[data-rating]');
    if (rating) { selectedRating = Number(rating.dataset.rating); renderRating(); }
  });

  reviewText?.addEventListener('input', () => { reviewLength.textContent = String(reviewText.value.length); });
  form?.addEventListener('submit', (event) => {
    event.preventDefault();
    const text = reviewText.value.trim();
    if (text.length < 5) { showToast('리뷰를 5자 이상 작성해주세요.'); return; }
    const reviews = read(REVIEWS_KEY, []);
    reviews.push({ id: Date.now(), orderId: orderSelect.value, memberKey: userKey(user()), rating: selectedRating, text, createdAt: new Date().toISOString(), rewardPoints: 500 });
    write(REVIEWS_KEY, reviews);
    updateMemberPoints(500);
    closeModal();
    showToast('리뷰가 등록되어 500포인트가 적립됐어요.', { href: '../my/index.html', label: '마이페이지 보기' });
  });

  document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && !modal.hidden) closeModal(); });

  const revealElements = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    }), { threshold: 0.12 });
    revealElements.forEach((element, index) => {
      element.style.setProperty('--reveal-delay', `${Math.min(index % 4, 3) * 70}ms`);
      observer.observe(element);
    });
  } else revealElements.forEach((element) => element.classList.add('is-visible'));

  updateMembershipButton();
  const requestedAction = new URLSearchParams(location.search).get('action');
  if (requestedAction && user()) setTimeout(() => {
    if (requestedAction === 'welcome') grantWelcomeCoupon();
    if (requestedAction === 'review') openReview();
    if (requestedAction === 'membership') showMembership();
    if (requestedAction === 'enroll') enrollMembership();
    history.replaceState({}, '', location.pathname);
  }, 250);
})();
