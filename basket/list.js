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

let toastTimer;

function getCartQuantity(cart = getCart()) {
  return cart.reduce((sum, item) => sum + item.quantity, 0);
}

function updateCartCount(cart = getCart()) {
  cartCount.textContent = getCartQuantity(cart);
}

function showToast(message) {
  window.clearTimeout(toastTimer);
  toast.textContent = message;
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
    image: menu ? menu.image : '',
    description: menu ? menu.description : ''
  };
}

function renderCart() {
  const cart = getCart().map(enrichCartItem);
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const quantity = getCartQuantity(cart);

  updateCartCount(cart);
  emptyState.hidden = cart.length > 0;
  basketLayout.hidden = cart.length === 0;
  orderComplete.hidden = true;
  itemSummary.textContent = `${cart.length} menu · ${quantity} item`;
  subtotalPrice.textContent = formatPrice(total);
  totalPrice.textContent = formatPrice(total);

  renderList(
    cartList,
    cart,
    (item) => `
      <article class="cart-item">
        <div class="cart-item-main">
          <span class="item-thumb">${escapeHtml(item.name.slice(0, 1))}</span>
          <div class="item-info">
            <h2>${escapeHtml(item.name)}</h2>
            <p class="item-meta">${escapeHtml(getCategoryName(item.category))} · ${formatPrice(item.price)}</p>
          </div>
        </div>
        <div class="cart-item-controls">
          <div class="quantity-control" aria-label="${escapeHtml(item.name)} quantity">
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

function changeQuantity(menuId, amount) {
  const item = getCart().find((cartItem) => String(cartItem.menuId) === String(menuId));
  if (!item) return;

  const nextQuantity = item.quantity + amount;
  updateCartQuantity(menuId, nextQuantity);
  renderCart();
}

cartList.addEventListener('click', (event) => {
  const button = event.target.closest('[data-action]');
  if (!button) return;

  const { action, menuId } = button.dataset;
  if (action === 'increase') {
    changeQuantity(menuId, 1);
    return;
  }

  if (action === 'decrease') {
    changeQuantity(menuId, -1);
    return;
  }

  if (action === 'remove') {
    removeFromCart(menuId);
    renderCart();
    showToast('장바구니에서 삭제했습니다.');
  }
});

clearButton.addEventListener('click', () => {
  if (getCart().length === 0) return;
  const shouldClear = window.confirm('장바구니를 모두 비울까요?');
  if (!shouldClear) return;

  clearCart();
  renderCart();
  showToast('장바구니를 비웠습니다.');
});

orderButton.addEventListener('click', () => {
  const cart = getCart().map(enrichCartItem);
  if (cart.length === 0) return;

  const items = cart.map((item) => ({
    menuId: item.menuId,
    name: item.name,
    price: item.price,
    category: item.category,
    quantity: item.quantity
  }));
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const order = createOrder(items, total);

  clearCart();
  updateCartCount([]);
  basketLayout.hidden = true;
  emptyState.hidden = true;
  orderComplete.hidden = false;
  orderMessage.textContent = `주문번호 ${order.id} · ${formatPrice(order.total)}`;
  orderDetailLink.href = `../orders/detail.html?id=${encodeURIComponent(order.id)}`;
});

renderCart();
