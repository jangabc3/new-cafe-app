const ordersList = $('#ordersList');
const emptyState = $('#emptyState');
const totalOrders = $('#totalOrders');
const activeOrders = $('#activeOrders');
const totalSpent = $('#totalSpent');
const recentDate = $('#recentDate');
const pagination = $('#pagination');
const logoutButton = $('#logoutButton');

const ITEMS_PER_PAGE = 7;
let currentPage = 1;

function formatWon(value) {
  return `${Number(value || 0).toLocaleString('ko-KR')}원`;
}

function getSortedOrders() {
  const currentUser = JSON.parse(localStorage.getItem('momoCurrentUser') || 'null');
  const key = currentUser?.id ?? currentUser?.email;
  return getOrders().filter((order) => String(order.userId ?? order.userEmail) === String(key) || String(order.userEmail) === String(currentUser?.email)).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function getOrderQuantity(order) {
  return order.items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
}

function getItemSummary(order) {
  const totalQuantity = getOrderQuantity(order);
  const firstItem = order.items[0];
  if (!firstItem) return { text: '주문 상품 없음', quantity: '총 0개' };
  if (order.items.length === 1) return { text: `${firstItem.name} ${totalQuantity}개`, quantity: `총 ${totalQuantity}개` };
  return { text: `${firstItem.name} 외 ${order.items.length - 1}개`, quantity: `총 ${totalQuantity}개` };
}

function getOrderThumbnail(order) {
  const firstItem = order.items[0];
  if (!firstItem) return '../assets/images/momo-face-cute.png';
  const menu = getMenuById(firstItem.menuId);
  const image = menu?.image;
  if (!image) return '../assets/images/momo-face-cute.png';
  if (image.startsWith('../') || image.startsWith('http')) return image;
  return `../${image}`;
}

function formatShortDate(date) {
  if (!date) return '-';
  return new Date(date).toISOString().slice(0, 10).replaceAll('-', '.');
}

function renderSummary(orders) {
  const active = orders.filter((order) => !['PICKED_UP', 'cancelled'].includes(order.status));
  const spent = orders.reduce((sum, order) => sum + Number(order.totalAmount ?? order.total ?? 0), 0);

  totalOrders.textContent = orders.length;
  activeOrders.textContent = active.length;
  totalSpent.textContent = formatWon(spent);
  recentDate.textContent = orders.length ? formatShortDate(orders[0].createdAt) : '-';
}

function renderOrdersPage(orders) {
  const pageCount = Math.max(1, Math.ceil(orders.length / ITEMS_PER_PAGE));
  currentPage = Math.min(currentPage, pageCount);
  const start = (currentPage - 1) * ITEMS_PER_PAGE;
  const visibleOrders = orders.slice(start, start + ITEMS_PER_PAGE);

  renderList(
    ordersList,
    visibleOrders,
    (order, index) => {
      const summary = getItemSummary(order);
      return `
        <article class="order-card" style="animation-delay: ${index * 35}ms">
          <img class="order-thumb" src="${escapeHtml(getOrderThumbnail(order))}" alt="${escapeHtml(summary.text)}">
          <div class="order-title">
            <span class="status-pill">${escapeHtml(getStatusLabel(order.status))}</span>
            <h3>주문번호 ${escapeHtml(order.id)}</h3>
            <div class="order-meta">
              <span>${escapeHtml(formatDate(order.createdAt))}</span>
              <span>${escapeHtml(summary.text)}</span>
              <span>${escapeHtml(summary.quantity)}</span>
            </div>
          </div>
          <div class="order-actions">
            <strong class="order-price">${formatWon(order.totalAmount ?? order.total)}</strong>
            <a class="detail-button" href="detail.html?id=${encodeURIComponent(order.id)}">상세</a>
          </div>
        </article>
      `;
    }
  );

  renderPagination(pageCount);
}

function renderPagination(pageCount) {
  if (pageCount <= 1) {
    pagination.innerHTML = '';
    return;
  }

  const pages = Array.from({ length: pageCount }, (_, index) => index + 1);
  pagination.innerHTML = [
    `<button class="page-button" type="button" data-page="${Math.max(1, currentPage - 1)}" aria-label="이전 페이지">‹</button>`,
    ...pages.map((page) => `<button class="page-button ${page === currentPage ? 'is-active' : ''}" type="button" data-page="${page}" ${page === currentPage ? 'aria-current="page"' : ''}>${page}</button>`),
    `<button class="page-button" type="button" data-page="${Math.min(pageCount, currentPage + 1)}" aria-label="다음 페이지">›</button>`
  ].join('');
}

function bindPagination(orders) {
  pagination.addEventListener('click', (event) => {
    const button = event.target.closest('[data-page]');
    if (!button) return;
    currentPage = Number(button.dataset.page);
    renderOrdersPage(orders);
  });
}

function bindLogout() {
  logoutButton?.addEventListener('click', () => {
    localStorage.removeItem('momoCurrentUser');
    window.location.href = '../index.html';
  });
}

function renderOrders() {
  const orders = getSortedOrders();
  renderSummary(orders);
  emptyState.hidden = orders.length > 0;
  ordersList.hidden = orders.length === 0;
  pagination.hidden = orders.length === 0;

  if (orders.length > 0) {
    renderOrdersPage(orders);
  }

  bindPagination(orders);
  bindLogout();
}

renderOrders();
