const goodsGrid = $('#goodsGrid');
const cartCount = $('#cartCount');
const toast = $('#toast');
let toastTimer;

function getImagePath(item) {
  if (!item.image) return '';
  if (item.image.startsWith('../')) return item.image;
  return `../${item.image}`;
}

function updateCartCount() {
  cartCount.textContent = getCart().reduce((sum, item) => sum + item.quantity, 0);
}

function showToast(message) {
  window.clearTimeout(toastTimer);
  toast.textContent = message;
  toast.hidden = false;
  toastTimer = window.setTimeout(() => {
    toast.hidden = true;
  }, 2200);
}

function renderGoods() {
  const goods = getMenus().filter((item) => item.category === 'goods');
  renderList(
    goodsGrid,
    goods,
    (item) => `
      <article class="goods-card">
        <a class="goods-thumb" href="../menus/detail.html?id=${encodeURIComponent(item.id)}" aria-label="${escapeHtml(item.name)} 상세 보기">
          <img src="${escapeHtml(getImagePath(item))}" alt="${escapeHtml(item.name)}">
        </a>
        <div class="goods-info">
          <h2>${escapeHtml(item.name)}</h2>
          <p>${escapeHtml(item.description)}</p>
          <strong class="goods-price">${formatPrice(item.price).replace(' KRW', '원')}</strong>
          <button class="goods-cart-button" type="button" data-cart-id="${escapeHtml(item.id)}">장바구니</button>
        </div>
      </article>
    `
  );
}

goodsGrid.addEventListener('click', (event) => {
  const button = event.target.closest('[data-cart-id]');
  if (!button) return;

  const item = getMenuById(button.dataset.cartId);
  if (!item) return;

  addToCart(item.id);
  updateCartCount();
  showToast(`${item.name} 1개를 장바구니에 담았어요.`);
});

renderGoods();
updateCartCount();
