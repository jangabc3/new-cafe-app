const cartCount = $('#cartCount');
const memberMessage = $('#memberMessage');
const totalOrders = $('#totalOrders');
const activeOrders = $('#activeOrders');
const totalSpent = $('#totalSpent');
const cartItems = $('#cartItems');
const stampCount = $('#stampCount');
const stampBoard = $('#stampBoard');
const stampMessage = $('#stampMessage');
const recentOrders = $('#recentOrders');
const emptyOrders = $('#emptyOrders');
const couponList = $('#couponList');
const recommendList = $('#recommendList');

function getImagePath(item) {
  if (!item.image) return '../assets/images/momo-cutout-tight.png';
  if (item.image.startsWith('http') || item.image.startsWith('../')) return item.image;
  return `../${item.image}`;
}

function getSortedOrders() {
  return getOrders().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function getCartQuantity() {
  return getCart().reduce((sum, item) => sum + item.quantity, 0);
}

function getOrderQuantity(order) {
  return order.items.reduce((sum, item) => sum + item.quantity, 0);
}

function getItemSummary(order) {
  const firstItem = order.items[0];
  const quantity = getOrderQuantity(order);
  if (!firstItem) return '주문 상품 없음';
  if (order.items.length === 1) return `${firstItem.name} ${quantity}개`;
  return `${firstItem.name} 외 ${order.items.length - 1}개 · 총 ${quantity}개`;
}

function getFavoriteCategory(orders) {
  const categoryCount = orders.flatMap((order) => order.items).reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + item.quantity;
    return acc;
  }, {});
  const [category] = Object.entries(categoryCount).sort((a, b) => b[1] - a[1])[0] || [];
  return category || 'signature';
}

function renderSummary(orders) {
  const active = orders.filter((order) => !['completed', 'cancelled'].includes(order.status));
  const spent = orders.reduce((sum, order) => sum + Number(order.total || 0), 0);
  const cartQuantity = getCartQuantity();

  cartCount.textContent = cartQuantity;
  totalOrders.textContent = orders.length;
  activeOrders.textContent = active.length;
  totalSpent.textContent = formatPrice(spent);
  cartItems.textContent = cartQuantity;

  memberMessage.textContent = orders.length
    ? `모모와 함께한 주문이 ${orders.length}번 쌓였어요.`
    : '첫 주문을 기다리고 있어요. 모모가 따뜻하게 준비할게요.';
}

function renderStamps(orders) {
  const cups = orders.reduce((sum, order) => sum + getOrderQuantity(order), 0);
  const filled = cups % 10;
  const displayCount = cups > 0 && filled === 0 ? 10 : filled;

  stampCount.textContent = `${displayCount} / 10`;
  stampBoard.innerHTML = Array.from({ length: 10 }, (_, index) => {
    const active = index < displayCount;
    return `<span class="stamp ${active ? 'is-filled' : ''}" aria-label="스탬프 ${index + 1}">${active ? 'M' : index + 1}</span>`;
  }).join('');

  const remaining = displayCount === 10 ? 0 : 10 - displayCount;
  stampMessage.textContent = remaining === 0
    ? '스탬프가 가득 찼어요. 다음 방문에 쿠폰을 확인해보세요.'
    : `${remaining}잔 더 마시면 모모 쿠폰에 가까워져요.`;
}

function renderRecentOrders(orders) {
  const recent = orders.slice(0, 3);
  emptyOrders.hidden = recent.length > 0;
  recentOrders.hidden = recent.length === 0;

  recentOrders.innerHTML = recent.map((order) => `
    <article class="order-card">
      <div>
        <span class="status-pill">${escapeHtml(getStatusLabel(order.status))}</span>
        <h3>주문번호 ${escapeHtml(order.id)}</h3>
        <p>${escapeHtml(formatDate(order.createdAt))}</p>
        <p>${escapeHtml(getItemSummary(order))}</p>
      </div>
      <div>
        <strong>${formatPrice(order.total)}</strong>
        <a class="text-link" href="../orders/detail.html?id=${encodeURIComponent(order.id)}">상세</a>
      </div>
    </article>
  `).join('');
}

function renderCoupons(orders) {
  const cups = orders.reduce((sum, order) => sum + getOrderQuantity(order), 0);
  const hasWelcome = orders.length === 0;
  const hasStampCoupon = cups >= 10;

  const coupons = [
    {
      label: hasWelcome ? 'WELCOME' : 'MEMBER',
      title: hasWelcome ? '첫 주문 500원 할인' : '모모 멤버 감사 쿠폰',
      description: hasWelcome ? '첫 주문을 시작하면 사용할 수 있어요.' : '다음 방문에도 따뜻한 하루를 준비할게요.'
    },
    {
      label: hasStampCoupon ? 'READY' : 'STAMP',
      title: hasStampCoupon ? '스탬프 완성 쿠폰' : '스탬프 적립 중',
      description: hasStampCoupon ? '스탬프 10개 달성 혜택을 확인하세요.' : '10잔을 채우면 모모 쿠폰이 열려요.'
    }
  ];

  couponList.innerHTML = coupons.map((coupon) => `
    <article class="coupon-card">
      <span>${escapeHtml(coupon.label)}</span>
      <strong>${escapeHtml(coupon.title)}</strong>
      <p>${escapeHtml(coupon.description)}</p>
    </article>
  `).join('');
}

function renderRecommendations(orders) {
  const favoriteCategory = getFavoriteCategory(orders);
  const menus = getMenus();
  const picks = [
    ...menus.filter((menu) => menu.category === favoriteCategory),
    ...menus.filter((menu) => ['signature', 'season'].includes(menu.category))
  ].filter((menu, index, arr) => arr.findIndex((item) => String(item.id) === String(menu.id)) === index).slice(0, 3);

  recommendList.innerHTML = picks.map((menu) => `
    <article class="recommend-card">
      <img src="${escapeHtml(getImagePath(menu))}" alt="${escapeHtml(menu.name)}">
      <div>
        <h3>${escapeHtml(menu.name)}</h3>
        <p>${escapeHtml(getCategoryName(menu.category))} · ${formatPrice(menu.price)}</p>
      </div>
      <a class="text-link" href="../menus/detail.html?id=${encodeURIComponent(menu.id)}">보기</a>
    </article>
  `).join('');
}

function renderMyPage() {
  const orders = getSortedOrders();
  renderSummary(orders);
  renderStamps(orders);
  renderRecentOrders(orders);
  renderCoupons(orders);
  renderRecommendations(orders);
}

renderMyPage();
