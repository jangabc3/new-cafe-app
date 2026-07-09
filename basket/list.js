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

let toastTimer;

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
  totalPrice.textContent = formatPrice(total);

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
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const order = createOrder(items, total);

  clearCart();
  updateCartCount([]);
  basketLayout.hidden = true;
  emptyState.hidden = true;
  orderComplete.hidden = false;
  orderMessage.textContent = `주문번호 ${order.id} · 예상 제조 시간 10분 · ${formatPrice(order.total)}`;
  orderDetailLink.href = `../orders/detail.html?id=${encodeURIComponent(order.id)}`;
});

renderCart();
