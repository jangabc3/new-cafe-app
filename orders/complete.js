(() => {
  const latestKey = 'momo_coffee_latest_order_v1';
  const pointHistoryKey = 'momoPointHistory';
  const requested = new URLSearchParams(location.search).get('id');
  const latest = localStorage.getItem(latestKey);
  const orderId = requested || latest;

  if (!orderId || (requested && latest && requested !== latest)) {
    location.replace('/orders/list.html');
    return;
  }

  const order = getOrderById(orderId);
  if (!order || order.paymentStatus !== 'paid') {
    location.replace('/orders/list.html');
    return;
  }

  const awardOrderPoints = () => {
    const paidAmount = Math.max(0, Number(order.totalAmount ?? order.total) || 0);
    const earned = Math.floor(paidAmount * 0.05);
    if (order.rewardAwardedAt || earned < 1 || !window.MomoLoyalty?.addPoints) return Number(order.earnedPoints || 0);

    const before = Number(window.MomoLoyalty.getBenefit?.()?.points || 0);
    const saved = window.MomoLoyalty.addPoints(earned);
    if (!saved) return 0;

    const orders = getOrders();
    const stored = orders.find(item => String(item.id) === String(order.id));
    const awardedAt = new Date().toISOString();
    if (stored) {
      stored.earnedPoints = earned;
      stored.rewardRate = 5;
      stored.rewardAwardedAt = awardedAt;
      saveOrders(orders);
    }
    order.earnedPoints = earned;
    order.rewardRate = 5;
    order.rewardAwardedAt = awardedAt;

    let history = [];
    try { history = JSON.parse(localStorage.getItem(pointHistoryKey) || '[]'); } catch { history = []; }
    if (!Array.isArray(history)) history = [];
    if (!history.some(item => item.source === 'ORDER' && String(item.orderId) === String(order.id))) {
      history.push({
        id: `PNT-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`.toUpperCase(),
        userId: order.userId ?? order.userEmail,
        type: 'EARN',
        amount: earned,
        balanceBefore: before,
        balanceAfter: Number(saved.points || before + earned),
        reason: '주문 결제 5% 자동 적립',
        source: 'ORDER',
        orderId: order.id,
        createdAt: awardedAt
      });
      localStorage.setItem(pointHistoryKey, JSON.stringify(history));
    }
    return earned;
  };

  const earnedPoints = awardOrderPoints();
  const names = { card:'신용·체크카드', kakao:'카카오페이', naver:'네이버페이', toss:'토스페이', free:'무료 주문' };
  document.querySelector('#orderMeta').innerHTML = `
    <div><dt>픽업 매장</dt><dd>${escapeHtml(order.pickupStore?.name || '-')}</dd></div>
    <div><dt>주문 번호</dt><dd>${escapeHtml(order.orderNumber || order.id)}</dd></div>
    <div><dt>예상 준비 시간</dt><dd>약 ${Number(order.pickupStore?.eta) || 10}분</dd></div>
    <div><dt>결제 수단</dt><dd>${names[order.paymentMethod] || order.paymentMethod}</dd></div>
    <div><dt>최종 결제 금액</dt><dd>${formatPrice(order.totalAmount ?? order.total)}</dd></div>
    <div><dt>적립 포인트</dt><dd>${Number(earnedPoints || order.earnedPoints || 0).toLocaleString('ko-KR')}P</dd></div>
    <div><dt>주문 상태</dt><dd>${getStatusLabel(order.status)}</dd></div>`;
  document.querySelector('#orderedItems').innerHTML = order.items.map(item => `<div class="menu-row"><span>${escapeHtml(item.name)} × ${item.quantity}</span><strong>${formatPrice(item.price * item.quantity)}</strong></div>`).join('');
  document.querySelector('#historyLink').href = `/orders/detail.html?id=${encodeURIComponent(order.id)}`;
  document.querySelector('#completeCard').hidden = false;
})();
