const cartCount = $('#cartCount');
const emptyState = $('#emptyState');
const basketLayout = $('#basketLayout');
const cartList = $('#cartList');
const itemSummary = $('#itemSummary');
const clearButton = $('#clearButton');
const orderButton = $('#orderButton');
const subtotalPrice = $('#subtotalPrice');
const totalPrice = $('#totalPrice');
const orderComplete = $('#orderComplete');
const orderMessage = $('#orderMessage');
const orderDetailLink = $('#orderDetailLink');
const toast = $('#toast');
const momoReaction = $('#momoReaction');
const couponSelectButton = $('#couponSelectButton');
const couponPicker = $('#couponPicker');
const basketCouponList = $('#basketCouponList');
const availableCouponCount = $('#availableCouponCount');
const selectedCouponName = $('#selectedCouponName');
const couponDiscount = $('#couponDiscount');
const availablePoints = $('#availablePoints');
const pointInput = $('#pointInput');
const applyPointButton = $('#applyPointButton');
const pointDiscount = $('#pointDiscount');
const stampRewardButton = $('#stampRewardButton');
const stampRewardStatus = $('#stampRewardStatus');
const rewardCount = $('#rewardCount');
const rewardDiscount = $('#rewardDiscount');

let toastTimer;
let appliedCoupon = null;
let appliedDiscount = 0;
let appliedPoints = 0;
let rewardApplied = false;
let appliedRewardDiscount = 0;

function getCartQuantity(cart = getCart()) {
  return cart.reduce((sum, item) => sum + item.quantity, 0);
}

function updateCartCount(cart = getCart()) {
  cartCount.textContent = getCartQuantity(cart);
}

function setMomoReaction(message) {
  if (!momoReaction) return;
  momoReaction.querySelector('p').textContent = message;
  momoReaction.classList.remove('is-bouncing');
  window.requestAnimationFrame(() => momoReaction.classList.add('is-bouncing'));
}

function showToast(message) {
  window.clearTimeout(toastTimer);
  toast.innerHTML = `<span class="mini-momo" aria-hidden="true"><span></span></span><span>${escapeHtml(message)}</span>`;
  toast.hidden = false;
  toastTimer = window.setTimeout(() => {
    toast.hidden = true;
  }, 2200);
}

function enrichCartItem(item) {
  const menu = getMenuById(item.menuId);
  return {
    ...item,
    name: menu ? menu.name : item.name,
    category: menu ? menu.category : item.category,
    price: menu ? menu.price : item.price,
    emoji: menu ? menu.emoji : '☕',
    image: menu ? menu.image : item.image
  };
}

function getBasketImagePath(item) {
  if (!item.image) return '';
  if (item.image.startsWith('http') || item.image.startsWith('../')) return item.image;
  return `../${item.image}`;
}

function renderItemThumb(item) {
  const imagePath = getBasketImagePath(item);
  if (!imagePath) {
    return `<span class="item-thumb item-thumb-fallback">${escapeHtml(item.emoji || item.name.slice(0, 1))}</span>`;
  }

  return `
    <span class="item-thumb">
      <img src="${escapeHtml(imagePath)}" alt="${escapeHtml(item.name)}">
    </span>
  `;
}

function renderCart() {
  const cart = getCart().map(enrichCartItem);
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const quantity = getCartQuantity(cart);

  updateCartCount(cart);
  emptyState.hidden = cart.length > 0;
  basketLayout.hidden = cart.length === 0;
  orderComplete.hidden = true;
  itemSummary.textContent = `${cart.length}개 메뉴 · 총 ${quantity}개`;
  subtotalPrice.textContent = formatPrice(total);
  renderCouponSelector(cart, total);
  renderMemberBenefits(total);

  if (cart.length > 0) {
    setMomoReaction(`모모가 ${quantity}개의 메뉴를 확인하고 있어요.`);
  }

  renderList(
    cartList,
    cart,
    (item) => `
      <article class="cart-item">
        <div class="cart-item-main">
          ${renderItemThumb(item)}
          <div class="item-info">
            <h2>${escapeHtml(item.name)}</h2>
            <p class="item-meta">${escapeHtml(getCategoryName(item.category))} · ${formatPrice(item.price)}</p>
            <p class="item-meta">옵션: ${escapeHtml(formatCartOptions(item.options))}</p>
          </div>
        </div>
        <div class="cart-item-controls">
          <div class="quantity-control" aria-label="${escapeHtml(item.name)} 수량">
            <button class="icon-button" type="button" data-action="decrease" data-menu-id="${escapeHtml(item.menuId)}" aria-label="수량 줄이기">-</button>
            <strong class="quantity-value">${item.quantity}</strong>
            <button class="icon-button" type="button" data-action="increase" data-menu-id="${escapeHtml(item.menuId)}" aria-label="수량 늘리기">+</button>
          </div>
          <span class="line-price">${formatPrice(item.price * item.quantity)}</span>
          <button class="remove-button" type="button" data-action="remove" data-menu-id="${escapeHtml(item.menuId)}">삭제</button>
        </div>
      </article>
    `
  );
}

function renderMemberBenefits(subtotal) {
  const member = window.MomoLoyalty?.getUser();
  const benefit = window.MomoLoyalty?.getBenefit();
  const afterCoupon = Math.max(0, subtotal - appliedDiscount);
  const usableRewards = Number(benefit?.rewards || 0);
  if (!member || !benefit) {
    appliedPoints = 0;
    rewardApplied = false;
    appliedRewardDiscount = 0;
    availablePoints.textContent = '0';
    pointInput.value = '0';
    pointInput.disabled = true;
    applyPointButton.disabled = true;
    stampRewardButton.disabled = true;
    stampRewardStatus.textContent = '로그인하면 주문마다 스탬프 1개를 받을 수 있어요.';
    rewardCount.textContent = '0장';
  } else {
    pointInput.disabled = false;
    applyPointButton.disabled = false;
    stampRewardButton.disabled = usableRewards < 1 || afterCoupon < 3500;
    availablePoints.textContent = Number(benefit.points).toLocaleString('ko-KR');
    rewardCount.textContent = `${usableRewards}장`;
    stampRewardStatus.textContent = usableRewards
      ? afterCoupon >= 3500 ? '3,500원 할인을 사용할 수 있어요.' : '3,500원 이상 주문할 때 사용할 수 있어요.'
      : `스탬프 ${benefit.stamps}/10 · 주문 1건당 1개 적립`;
    if (rewardApplied && (usableRewards < 1 || afterCoupon < 3500)) rewardApplied = false;
    appliedRewardDiscount = rewardApplied ? 3500 : 0;
    const maxPoints = Math.min(Number(benefit.points), Math.max(0, afterCoupon - appliedRewardDiscount));
    appliedPoints = Math.min(appliedPoints, maxPoints);
    pointInput.max = String(maxPoints);
    stampRewardButton.classList.toggle('is-applied', rewardApplied);
  }
  pointDiscount.textContent = appliedPoints ? `-${formatPrice(appliedPoints)}` : '0원';
  rewardDiscount.textContent = appliedRewardDiscount ? `-${formatPrice(appliedRewardDiscount)}` : '0원';
  pointDiscount.classList.toggle('is-applied', appliedPoints > 0);
  rewardDiscount.classList.toggle('is-applied', appliedRewardDiscount > 0);
  totalPrice.textContent = formatPrice(Math.max(0, subtotal - appliedDiscount - appliedPoints - appliedRewardDiscount));
}

function renderCouponSelector(cart, subtotal) {
  const coupons = getMomoCoupons().filter((coupon) => coupon.status === 'available');
  const selectedId = getSelectedMomoCouponId();
  availableCouponCount.textContent = `${coupons.length}장`;
  appliedCoupon = coupons.find((coupon) => Number(coupon.id) === Number(selectedId)) || null;
  const selectedResult = calculateMomoCoupon(appliedCoupon, cart);
  appliedDiscount = selectedResult.eligible ? selectedResult.discount : 0;

  if (appliedCoupon && !selectedResult.eligible) selectMomoCoupon(null);
  if (appliedCoupon && selectedResult.eligible) {
    selectedCouponName.textContent = appliedCoupon.title;
    couponSelectButton.classList.add('has-coupon');
  } else {
    appliedCoupon = null;
    selectedCouponName.textContent = coupons.length ? '쿠폰을 선택해 주세요' : '사용 가능한 쿠폰이 없습니다';
    couponSelectButton.classList.remove('has-coupon');
  }

  couponDiscount.textContent = appliedDiscount ? `-${formatPrice(appliedDiscount)}` : '0원';
  couponDiscount.classList.toggle('is-applied', appliedDiscount > 0);
  totalPrice.textContent = formatPrice(Math.max(0, subtotal - appliedDiscount));

  basketCouponList.innerHTML = `
    <button class="basket-coupon-option${!appliedCoupon ? ' is-selected' : ''}" type="button" data-coupon-id="">
      <span><strong>쿠폰 사용 안 함</strong><small>할인 없이 주문합니다.</small></span>
    </button>
    ${coupons.map((coupon) => {
      const result = calculateMomoCoupon(coupon, cart);
      return `<button class="basket-coupon-option${Number(coupon.id) === Number(appliedCoupon?.id) ? ' is-selected' : ''}" type="button" data-coupon-id="${coupon.id}" ${result.eligible ? '' : 'disabled'}>
        <b>${escapeHtml(coupon.type)}</b>
        <span><strong>${escapeHtml(coupon.title)}</strong><small>${escapeHtml(result.reason)}</small></span>
        <em>${result.eligible ? `-${formatPrice(result.discount)}` : '조건 미충족'}</em>
      </button>`;
    }).join('')}`;
}

function formatCartOptions(options = {}) {
  const labels = [];
  if (options.temperature) labels.push(options.temperature);
  if (options.size) labels.push(options.size);
  if (options.bean) labels.push(options.bean);
  if (options.shot) labels.push(`샷 ${options.shot}회 추가`);
  if (options.syrup) labels.push(`시럽 ${options.syrup}회 추가`);
  return labels.length ? labels.join(' · ') : '기본';
}

function changeQuantity(menuId, amount) {
  const item = getCart().find((cartItem) => String(cartItem.menuId) === String(menuId));
  if (!item) return;
  updateCartQuantity(menuId, item.quantity + amount);
  renderCart();
  setMomoReaction(amount > 0 ? '모모가 하나 더 담아두었어요.' : '모모가 수량을 살짝 줄였어요.');
}

cartList.addEventListener('click', (event) => {
  const button = event.target.closest('[data-action]');
  if (!button) return;

  const { action, menuId } = button.dataset;
  if (action === 'increase') changeQuantity(menuId, 1);
  if (action === 'decrease') changeQuantity(menuId, -1);
  if (action === 'remove') {
    removeFromCart(menuId);
    renderCart();
    showToast('모모가 장바구니에서 조심히 덜어냈어요.');
  }
});

clearButton.addEventListener('click', () => {
  if (getCart().length === 0) return;
  if (!window.confirm('장바구니를 모두 비울까요?')) return;
  clearCart();
  renderCart();
  showToast('모모가 장바구니를 깨끗하게 비웠어요.');
});

couponSelectButton.addEventListener('click', () => {
  const willOpen = couponPicker.hidden;
  couponPicker.hidden = !willOpen;
  couponSelectButton.setAttribute('aria-expanded', String(willOpen));
});

basketCouponList.addEventListener('click', (event) => {
  const option = event.target.closest('[data-coupon-id]');
  if (!option || option.disabled) return;
  selectMomoCoupon(option.dataset.couponId ? Number(option.dataset.couponId) : null);
  couponPicker.hidden = true;
  couponSelectButton.setAttribute('aria-expanded', 'false');
  renderCart();
  showToast(option.dataset.couponId ? '쿠폰 할인이 적용되었습니다.' : '쿠폰 적용을 해제했습니다.');
});

applyPointButton.addEventListener('click', () => {
  const benefit = window.MomoLoyalty?.getBenefit();
  if (!benefit) {
    window.location.href = '../login.html?redirect=basket/list.html&message=login-required';
    return;
  }
  const requested = Math.max(0, Math.floor(Number(pointInput.value || 0)));
  const subtotal = getCart().map(enrichCartItem).reduce((sum, item) => sum + item.price * item.quantity, 0);
  const maximum = Math.min(benefit.points, Math.max(0, subtotal - appliedDiscount - appliedRewardDiscount));
  appliedPoints = Math.min(requested, maximum);
  pointInput.value = String(appliedPoints);
  renderMemberBenefits(subtotal);
  showToast(appliedPoints ? `${appliedPoints.toLocaleString('ko-KR')}포인트를 적용했습니다.` : '포인트 사용을 해제했습니다.');
});

stampRewardButton.addEventListener('click', () => {
  const benefit = window.MomoLoyalty?.getBenefit();
  if (!benefit) {
    window.location.href = '../login.html?redirect=basket/list.html&message=login-required';
    return;
  }
  if (benefit.rewards < 1) return;
  rewardApplied = !rewardApplied;
  const subtotal = getCart().map(enrichCartItem).reduce((sum, item) => sum + item.price * item.quantity, 0);
  renderMemberBenefits(subtotal);
  showToast(rewardApplied ? '스탬프 리워드 3,500원 할인을 적용했습니다.' : '스탬프 리워드를 해제했습니다.');
});

orderButton.addEventListener('click', () => {
  const cart = getCart().map(enrichCartItem);
  if (cart.length === 0) return;

  const items = cart.map((item) => ({
    menuId: item.menuId,
    name: item.name,
    price: item.price,
    category: item.category,
    image: item.image,
    quantity: item.quantity
  }));
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const total = Math.max(0, subtotal - appliedDiscount - appliedPoints - appliedRewardDiscount);
  if (appliedPoints && !window.MomoLoyalty?.usePoints(appliedPoints)) {
    showToast('포인트 잔액을 다시 확인해주세요.');
    renderCart();
    return;
  }
  if (rewardApplied && !window.MomoLoyalty?.useReward()) {
    if (appliedPoints) window.MomoLoyalty?.addPoints(appliedPoints);
    showToast('스탬프 리워드를 다시 확인해주세요.');
    renderCart();
    return;
  }
  const order = createOrder(items, total);
  order.subtotal = subtotal;
  order.couponDiscount = appliedDiscount;
  order.coupon = appliedCoupon ? { id: appliedCoupon.id, title: appliedCoupon.title } : null;
  const orders = getOrders();
  const savedOrder = orders.find((item) => String(item.id) === String(order.id));
  if (savedOrder) Object.assign(savedOrder, { subtotal, couponDiscount: appliedDiscount, coupon: order.coupon, pointDiscount: appliedPoints, stampRewardDiscount: appliedRewardDiscount, memberKey: window.MomoLoyalty?.getUserKey() || null });
  saveOrders(orders);
  if (appliedCoupon) useMomoCoupon(appliedCoupon.id);
  const stampResult = window.MomoLoyalty?.addOrderStamp(order.id);
  const now = new Date();
  const memberKey = window.MomoLoyalty?.getUserKey();
  const monthlySpent = memberKey ? getOrders().filter((item) => {
    const date = new Date(item.createdAt);
    return (!item.memberKey || item.memberKey === memberKey) && date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
  }).reduce((sum, item) => sum + Number(item.total || 0), 0) : 0;
  const monthlyGrade = memberKey ? window.MomoLoyalty?.syncMonthlyGradeBenefits(monthlySpent) : null;

  clearCart();
  updateCartCount([]);
  basketLayout.hidden = true;
  emptyState.hidden = true;
  orderComplete.hidden = false;
  const stampMessage = stampResult?.added
    ? stampResult.rewardEarned ? ' · 스탬프 10개 완성! 3,500원 리워드가 생겼어요.' : ` · 스탬프 ${stampResult.benefit.stamps}/10 적립`
    : '';
  const gradeMessage = monthlyGrade ? ` · 이번 달 ${monthlyGrade.current} 등급` : '';
  orderMessage.textContent = `주문번호 ${order.id} · 예상 제조 시간 10분 · ${formatPrice(order.total)}${stampMessage}${gradeMessage}`;
  orderDetailLink.href = `../orders/detail.html?id=${encodeURIComponent(order.id)}`;
});

renderCart();
