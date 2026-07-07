const detailPanel = $('#detailPanel');
const cartCount = $('#cartCount');
const toast = $('#toast');
const menuId = getQueryParam('id');
const menu = getMenuById(menuId);

let quantity = 1;
let toastTimer;

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

function renderMissingMenu() {
  detailPanel.classList.add('missing-panel');
  detailPanel.innerHTML = `
    <div class="detail-content">
      <span class="category-pill">Menu</span>
      <h1>메뉴를 찾을 수 없습니다.</h1>
      <p class="detail-description">목록으로 돌아가 다시 선택해 주세요.</p>
      <div class="detail-actions">
        <a class="primary-button" href="list.html">목록으로 이동</a>
      </div>
    </div>
  `;
}

function renderQuantity() {
  const quantityValue = $('#quantityValue');
  const totalPrice = $('#totalPrice');
  quantityValue.textContent = quantity;
  totalPrice.textContent = formatPrice(menu.price * quantity);
}

function renderMenuDetail() {
  document.title = `${menu.name} | Cafe`;
  const imageMarkup = menu.image
    ? `<img src="${escapeHtml(menu.image)}" alt="${escapeHtml(menu.name)}">`
    : `<span class="detail-initial">${escapeHtml(menu.name.slice(0, 1))}</span>`;

  detailPanel.innerHTML = `
    <div class="detail-media">${imageMarkup}</div>
    <article class="detail-content">
      <span class="category-pill">${escapeHtml(getCategoryName(menu.category))}</span>
      <h1>${escapeHtml(menu.name)}</h1>
      <p class="detail-price">${formatPrice(menu.price)}</p>
      <p class="detail-description">${escapeHtml(menu.description)}</p>

      <div class="order-panel">
        <div class="quantity-row">
          <span>수량</span>
          <div class="quantity-control" aria-label="Quantity control">
            <button class="icon-button" type="button" data-quantity="-1" aria-label="수량 줄이기">-</button>
            <strong id="quantityValue" class="quantity-value">1</strong>
            <button class="icon-button" type="button" data-quantity="1" aria-label="수량 늘리기">+</button>
          </div>
        </div>
        <div class="quantity-row">
          <span>합계</span>
          <strong id="totalPrice">${formatPrice(menu.price)}</strong>
        </div>
        <div class="detail-actions">
          <a class="secondary-button" href="list.html">계속 보기</a>
          <button class="primary-button" type="button" id="addToCartButton">장바구니 담기</button>
        </div>
      </div>
    </article>
  `;
}

detailPanel.addEventListener('click', (event) => {
  const quantityButton = event.target.closest('[data-quantity]');
  if (quantityButton) {
    quantity = Math.max(1, quantity + Number(quantityButton.dataset.quantity));
    renderQuantity();
    return;
  }

  const addButton = event.target.closest('#addToCartButton');
  if (!addButton || !menu) return;

  addToCart(menu.id, quantity);
  updateCartCount();
  showToast(`${menu.name} ${quantity}개를 장바구니에 담았습니다.`);
});

if (menu) {
  renderMenuDetail();
} else {
  renderMissingMenu();
}

updateCartCount();
