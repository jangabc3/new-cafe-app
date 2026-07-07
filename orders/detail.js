const cartCount = $('#cartCount');
const detailPanel = $('#detailPanel');
const orderId = getQueryParam('id');
const order = getOrderById(orderId);

function updateCartCount() {
  cartCount.textContent = getCart().reduce((sum, item) => sum + item.quantity, 0);
}

function renderMissingOrder() {
  detailPanel.innerHTML = `
    <div>
      <span class="status-pill">Order</span>
      <h1>주문을 찾을 수 없습니다.</h1>
      <p class="missing-copy">주문 내역으로 돌아가 다시 선택해 주세요.</p>
    </div>
    <div class="detail-actions">
      <a class="primary-button" href="list.html">주문 내역으로 이동</a>
    </div>
  `;
}

function renderOrderDetail() {
  document.title = `Order ${order.id} | Cafe`;
  const completedAt = order.completedAt ? formatDate(order.completedAt) : '아직 완료되지 않음';

  detailPanel.innerHTML = `
    <div class="detail-header">
      <div>
        <span class="status-pill">${escapeHtml(getStatusLabel(order.status))}</span>
        <h1>주문번호 ${escapeHtml(order.id)}</h1>
      </div>
      <strong>${formatPrice(order.total)}</strong>
    </div>

    <section class="detail-meta" aria-label="Order metadata">
      <article>
        <span>주문 일시</span>
        <strong>${escapeHtml(formatDate(order.createdAt))}</strong>
      </article>
      <article>
        <span>상태</span>
        <strong>${escapeHtml(getStatusLabel(order.status))}</strong>
      </article>
      <article>
        <span>완료 일시</span>
        <strong>${escapeHtml(completedAt)}</strong>
      </article>
    </section>

    <section class="items-table" aria-label="Order items">
      <table>
        <thead>
          <tr>
            <th>메뉴</th>
            <th>카테고리</th>
            <th>수량</th>
            <th>단가</th>
            <th>금액</th>
          </tr>
        </thead>
        <tbody>
          ${order.items
            .map(
              (item) => `
                <tr>
                  <td>${escapeHtml(item.name)}</td>
                  <td>${escapeHtml(getCategoryName(item.category))}</td>
                  <td>${item.quantity}</td>
                  <td>${formatPrice(item.price)}</td>
                  <td>${formatPrice(item.price * item.quantity)}</td>
                </tr>
              `
            )
            .join('')}
        </tbody>
      </table>
    </section>

    <dl class="summary-list">
      <div>
        <dt>상품 금액</dt>
        <dd>${formatPrice(order.total)}</dd>
      </div>
      <div>
        <dt>할인</dt>
        <dd>0 KRW</dd>
      </div>
      <div class="summary-total">
        <dt>총 결제 금액</dt>
        <dd>${formatPrice(order.total)}</dd>
      </div>
    </dl>

    <div class="detail-actions">
      <a class="secondary-button" href="../menus/list.html">메뉴 더 보기</a>
      <a class="primary-button" href="list.html">주문 내역</a>
    </div>
  `;
}

updateCartCount();

if (order) {
  renderOrderDetail();
} else {
  renderMissingOrder();
}
