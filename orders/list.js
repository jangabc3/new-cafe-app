const cartCount = $('#cartCount');
const ordersList = $('#ordersList');
const emptyState = $('#emptyState');
const totalOrders = $('#totalOrders');
const activeOrders = $('#activeOrders');
const totalSpent = $('#totalSpent');

function updateCartCount() {
  cartCount.textContent = getCart().reduce((sum, item) => sum + item.quantity, 0);
}

function getSortedOrders() {
  return getOrders().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function getItemSummary(order) {
  const totalQuantity = order.items.reduce((sum, item) => sum + item.quantity, 0);
  const firstItem = order.items[0];
  if (!firstItem) return '주문 상품 없음';
  if (order.items.length === 1) return `${firstItem.name} ${totalQuantity}개`;
  return `${firstItem.name} 외 ${order.items.length - 1}개 · 총 ${totalQuantity}개`;
}

function renderOrders() {
  const orders = getSortedOrders();
  const active = orders.filter((order) => !['completed', 'cancelled'].includes(order.status));
  const spent = orders.reduce((sum, order) => sum + Number(order.total), 0);

  totalOrders.textContent = orders.length;
  activeOrders.textContent = active.length;
  totalSpent.textContent = formatPrice(spent);
  emptyState.hidden = orders.length > 0;
  ordersList.hidden = orders.length === 0;

  renderList(
    ordersList,
    orders,
    (order) => `
      <article class="order-card">
        <div class="order-title">
          <span class="status-pill">${escapeHtml(getStatusLabel(order.status))}</span>
          <h2>주문번호 ${escapeHtml(order.id)}</h2>
          <div class="order-meta">
            <span>${escapeHtml(formatDate(order.createdAt))}</span>
            <span>${escapeHtml(getItemSummary(order))}</span>
          </div>
        </div>
        <div class="order-actions">
          <strong>${formatPrice(order.total)}</strong>
          <a class="primary-button" href="detail.html?id=${encodeURIComponent(order.id)}">상세</a>
        </div>
      </article>
    `
  );
}

updateCartCount();
renderOrders();
