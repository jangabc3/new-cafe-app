const cartCount = $('#cartCount');
const detailPanel = $('#detailPanel');
const orderId = getQueryParam('id') || new URLSearchParams(location.hash.replace(/^#/, '')).get('id');
const order = getOrderById(orderId);
const detailUser = JSON.parse(localStorage.getItem('momoCurrentUser') || 'null');
const canViewOrder = order && (String(order.userId ?? order.userEmail) === String(detailUser?.id ?? detailUser?.email) || String(order.userEmail) === String(detailUser?.email));

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
    <div class="detail-actions"><a class="primary-button" href="list.html">주문 내역으로 이동</a></div>
  `;
}

function renderOrderDetail() {
  document.title = `주문 ${order.id} | 모모커피`;
  const completedAt = order.completedAt ? formatDate(order.completedAt) : '아직 완료되지 않음';
  const progress = getOrderStatusProgress(order.status);
  const statusMessages = { RECEIVED:'주문이 정상적으로 접수되었습니다.', PREPARING:'모모가 메뉴를 정성껏 준비하고 있어요.', READY:'메뉴 준비가 완료되었습니다. 선택하신 매장에서 픽업해주세요.', PICKED_UP:'픽업이 완료된 주문입니다.' };

  detailPanel.innerHTML = `
    <div class="detail-header">
      <div>
        <span class="status-pill">${escapeHtml(getStatusLabel(order.status))}</span>
        <p class="order-eyebrow">MOMO ORDER</p>
        <h1>${escapeHtml(order.orderNumber || order.id)}</h1>
        <p class="missing-copy">맛있는 커피를 정성껏 준비하고 있어요. 예상 제조 시간은 약 10분입니다.</p>
      </div>
      <strong>${formatPrice(order.total)}</strong>
    </div>

    <section class="customer-order-progress" aria-label="주문 진행 상태">
      ${ADMIN_ORDER_STATUSES.map((status,index)=>`<div class="customer-progress-step ${index<progress?'is-done':index===progress?'is-current':''}"><i>${index<progress?'✓':index+1}</i><span>${getOrderStatusLabel(status)}</span></div>`).join('')}
    </section>
    <p class="customer-status-message ${order.status==='READY'?'is-ready':''}">${statusMessages[order.status]}</p>

    <section class="detail-meta" aria-label="주문 정보">
      <article><span>주문 일시</span><strong>${escapeHtml(formatDate(order.createdAt))}</strong></article>
      <article><span>상태</span><strong>${escapeHtml(getStatusLabel(order.status))}</strong></article>
      <article><span>완료 일시</span><strong>${escapeHtml(completedAt)}</strong></article>
    </section>

    <section class="items-table" aria-label="주문 상품">
      <table>
        <thead><tr><th>주문 메뉴</th><th>선택 옵션</th><th>수량</th><th>금액</th></tr></thead>
        <tbody>
          ${order.items
            .map(
              (item) => `
                <tr>
                  <td><div class="ordered-menu"><img src="/${String(item.image || getMenuById(item.menuId)?.image || 'assets/images/momo-face-cute.png').replace(/^\.\.\//,'').replace(/^\//,'')}" alt=""><span><b>${escapeHtml(item.name)}</b><small>${escapeHtml(getCategoryName(item.category))}</small></span></div></td>
                  <td>${escapeHtml(Object.values(item.options || {}).filter(value=>value&&typeof value!=='object').join(' · ') || '기본 옵션')}</td>
                  <td>${item.quantity}</td>
                  <td>${formatPrice(item.price * item.quantity)}</td>
                </tr>
              `
            )
            .join('')}
        </tbody>
      </table>
    </section>

    <dl class="summary-list">
      <div><dt>상품 금액</dt><dd>${formatPrice(order.subtotal ?? order.total)}</dd></div>
      <div><dt>${order.coupon ? escapeHtml(order.coupon.title) : '쿠폰 할인'}</dt><dd>${order.couponDiscount ? `-${formatPrice(order.couponDiscount)}` : '0원'}</dd></div>
      <div class="summary-total"><dt>총 결제 금액</dt><dd>${formatPrice(order.total)}</dd></div>
    </dl>

    <div class="detail-actions">
      <a class="secondary-button" href="../menus/list.html">메뉴 더 보기</a>
      <a class="primary-button" href="list.html">주문 내역</a>
    </div>
  `;
}

updateCartCount();
if (canViewOrder) renderOrderDetail();
else renderMissingOrder();
