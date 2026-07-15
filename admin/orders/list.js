(() => {
  if (!window.MomoAdmin) return;

  const admin = window.MomoAdmin.user;
  const perPage = 10;
  let page = 1;
  let busy = false;
  const byId = (id) => document.getElementById(id);
  const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
  const validDate = (value) => { const date = new Date(value); return Number.isNaN(date.getTime()) ? null : date; };
  const localDay = (value) => { const date = validDate(value); return date ? `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}` : ''; };
  const isToday = (value) => localDay(value) === localDay(new Date());
  const money = (value) => `${Math.max(0, Number(value) || 0).toLocaleString('ko-KR')}원`;
  const orderTotal = (order) => Number(order.totalAmount ?? order.finalAmount ?? order.paymentAmount ?? order.total ?? 0) || 0;
  const quantity = (order) => (order.items || []).reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
  const orderStore = (order) => order.pickupStore?.name || order.storeName || '-';
  const menuSummary = (order) => {
    const items = order.items || [];
    if (!items.length) return '메뉴 없음';
    return `${items[0].name || '메뉴'}${items.length > 1 ? ` 외 ${items.length - 1}개` : ''}`;
  };
  const formatDateTime = (value) => {
    const date = validDate(value);
    return date ? new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).format(date) : '-';
  };
  const relativeTime = (value) => {
    const date = validDate(value);
    if (!date) return '-';
    const minutes = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60000));
    if (minutes < 1) return '방금 전';
    if (minutes < 60) return `${minutes}분 전`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)}시간 전`;
    return `${Math.floor(minutes / 1440)}일 전`;
  };

  function preparationMinutes(order) {
    const started = validDate(order.createdAt);
    const history = Array.isArray(order.statusHistory) ? order.statusHistory : [];
    const ready = history.find((entry) => ['READY', 'PICKED_UP'].includes(String(entry.status || '').toUpperCase()));
    const finished = validDate(ready?.changedAt || ready?.createdAt || (['READY', 'PICKED_UP'].includes(order.status) ? order.updatedAt : null));
    if (!started || !finished || finished <= started) return null;
    const minutes = (finished - started) / 60000;
    return minutes > 0 && minutes < 1440 ? minutes : null;
  }

  function showToast(message) {
    const toast = byId('adminToast');
    toast.textContent = message;
    toast.hidden = false;
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => { toast.hidden = true; }, 2500);
  }

  function syncStoreOptions(orders) {
    const select = byId('storeFilter');
    const selected = select.value;
    const stores = [...new Set(orders.map(orderStore).filter((name) => name && name !== '-'))].sort((a, b) => a.localeCompare(b, 'ko'));
    select.innerHTML = `<option value="">전체 매장</option>${stores.map((name) => `<option value="${escapeHtml(name)}">${escapeHtml(name)}</option>`).join('')}`;
    if (stores.includes(selected)) select.value = selected;
  }

  function renderSummary(orders) {
    const today = orders.filter((order) => isToday(order.createdAt));
    const completedToday = today.filter((order) => ['READY', 'PICKED_UP'].includes(order.status)).length;
    const cards = [
      ['bag', '오늘 주문', today.length, '오늘 접수된 주문'],
      ['coffee', '제조 중', orders.filter((order) => order.status === 'PREPARING').length, '현재 제조 중'],
      ['check', '제조 완료', completedToday, '오늘 제조 완료'],
      ['pickup', '픽업 대기', orders.filter((order) => order.status === 'READY').length, '픽업 준비 완료']
    ];
    byId('orderSummary').innerHTML = cards.map(([icon, label, value, description]) => `<article><i class="summary-icon icon-${icon}" aria-hidden="true"></i><div><span>${label}</span><strong>${value}<small>건</small></strong><p>${description}</p></div></article>`).join('');

    const prepTimes = today.map(preparationMinutes).filter(Number.isFinite);
    const averagePrep = prepTimes.length ? Math.round(prepTimes.reduce((sum, value) => sum + value, 0) / prepTimes.length) : 0;
    let rawOrders = [];
    try { rawOrders = JSON.parse(localStorage.getItem('momo_coffee_orders_v1') || '[]'); } catch { rawOrders = []; }
    const cancelled = Array.isArray(rawOrders) ? rawOrders.filter((order) => String(order?.status || '').toUpperCase() === 'CANCELLED' && isToday(order.createdAt)).length : 0;
    byId('todayOrderSummary').innerHTML = [
      ['오늘 주문 수', `${today.length}건`],
      ['평균 제조 시간', averagePrep ? `${averagePrep}분` : '-'],
      ['오늘 매출', money(today.reduce((sum, order) => sum + orderTotal(order), 0))],
      ['취소 주문', `${cancelled}건`]
    ].map(([label, value]) => `<div><dt>${label}</dt><dd>${value}</dd></div>`).join('');
  }

  function renderRecent(orders) {
    const recent = [...orders].sort((a, b) => (validDate(b.createdAt)?.getTime() || 0) - (validDate(a.createdAt)?.getTime() || 0)).slice(0, 5);
    byId('recentOrders').innerHTML = recent.length ? recent.map((order) => `<a href="/admin/orders/detail.html?id=${encodeURIComponent(order.id)}"><div><strong>${escapeHtml(order.orderNumber || order.id)}</strong><span>${escapeHtml(order.customerName || '비회원')} · ${escapeHtml(menuSummary(order))}</span></div><div><b class="status-pill status-${escapeHtml(order.status)}">${escapeHtml(getOrderStatusLabel(order.status))}</b><time>${relativeTime(order.createdAt)}</time></div></a>`).join('') : '<p class="side-empty">최근 주문이 없습니다.</p>';
  }

  function paginationButtons(totalPages) {
    const visible = [];
    for (let number = 1; number <= totalPages; number += 1) {
      if (number === 1 || number === totalPages || Math.abs(number - page) <= 2) visible.push(number);
    }
    let previous = 0;
    const pages = visible.map((number) => {
      const gap = previous && number - previous > 1 ? '<span>…</span>' : '';
      previous = number;
      return `${gap}<button data-page="${number}" ${page === number ? 'aria-current="page"' : ''}>${number}</button>`;
    }).join('');
    return `<button ${page === 1 ? 'disabled' : ''} data-page="${page - 1}" aria-label="이전 페이지">‹</button>${pages}<button ${page === totalPages ? 'disabled' : ''} data-page="${page + 1}" aria-label="다음 페이지">›</button>`;
  }

  function render() {
    const all = getOrders();
    const topbarDate = document.querySelector('.admin-topbar > div:first-of-type span');
    if (topbarDate) topbarDate.textContent = new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date());
    syncStoreOptions(all);
    renderSummary(all);
    renderRecent(all);

    const term = byId('searchInput').value.trim().toLowerCase();
    const now = new Date();
    let rows = all.filter((order) =>
      (!byId('statusFilter').value || order.status === byId('statusFilter').value) &&
      (!byId('storeFilter').value || orderStore(order) === byId('storeFilter').value) &&
      (!term || `${order.orderNumber || order.id} ${order.customerName || ''} ${order.userEmail || ''}`.toLowerCase().includes(term))
    );
    if (byId('periodFilter').value === 'today') rows = rows.filter((order) => isToday(order.createdAt));
    if (byId('periodFilter').value === '7') {
      const from = new Date(now);
      from.setDate(from.getDate() - 6);
      from.setHours(0, 0, 0, 0);
      rows = rows.filter((order) => (validDate(order.createdAt)?.getTime() || 0) >= from.getTime());
    }
    rows.sort((first, second) => (byId('sortFilter').value === 'asc' ? 1 : -1) * ((validDate(first.createdAt)?.getTime() || 0) - (validDate(second.createdAt)?.getTime() || 0)));
    byId('orderResultCount').textContent = `${rows.length}건`;

    const totalPages = Math.max(1, Math.ceil(rows.length / perPage));
    page = Math.min(page, totalPages);
    const visibleRows = rows.slice((page - 1) * perPage, page * perPage);
    byId('ordersArea').innerHTML = visibleRows.length ? `<table class="orders-table"><thead><tr><th>주문번호</th><th>회원</th><th>주문 시간</th><th>메뉴</th><th>결제 금액</th><th>매장</th><th>상태</th><th>작업</th><th><span class="sr-only">상세</span></th></tr></thead><tbody>${visibleRows.map((order) => `<tr><td data-label="주문번호"><strong class="order-number">${escapeHtml(order.orderNumber || order.id)}</strong></td><td data-label="회원"><strong>${escapeHtml(order.customerName || '비회원')}</strong><small>${escapeHtml(order.userEmail || '')}</small></td><td data-label="주문 시간"><time>${formatDateTime(order.createdAt)}</time></td><td data-label="메뉴"><strong>${escapeHtml(menuSummary(order))}</strong><small>${quantity(order)}개 · ${escapeHtml(order.paymentMethod || '결제수단 미상')}</small></td><td data-label="결제 금액"><strong>${money(orderTotal(order))}</strong></td><td data-label="매장"><span>${escapeHtml(orderStore(order))}</span></td><td data-label="상태"><span class="status-pill status-${escapeHtml(order.status)}">${escapeHtml(getOrderStatusLabel(order.status))}</span></td><td data-label="작업"><button class="advance-button" data-advance="${escapeHtml(order.id)}" ${!getNextOrderStatus(order.status) ? 'disabled' : ''}>${escapeHtml(getNextOrderActionLabel(order.status))}</button></td><td data-label="상세"><a class="detail-link" href="/admin/orders/detail.html?id=${encodeURIComponent(order.id)}" aria-label="${escapeHtml(order.orderNumber || order.id)} 상세 보기">상세 보기 <span aria-hidden="true">›</span></a></td></tr>`).join('')}</tbody></table>` : '<div class="empty-orders"><strong>조건에 맞는 주문이 없습니다.</strong><span>검색어나 필터 조건을 변경해보세요.</span></div>';
    byId('pagination').innerHTML = paginationButtons(totalPages);
    byId('ordersUpdated').textContent = `마지막 업데이트 ${new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}`;
  }

  document.querySelector('.order-toolbar').addEventListener('input', () => { page = 1; render(); });
  byId('searchButton').addEventListener('click', render);
  byId('pagination').addEventListener('click', (event) => {
    const button = event.target.closest('[data-page]');
    if (button && !button.disabled) { page = Number(button.dataset.page); render(); }
  });
  byId('ordersArea').addEventListener('click', (event) => {
    const button = event.target.closest('[data-advance]');
    if (!button || button.disabled || busy) return;
    const order = getOrderById(button.dataset.advance);
    if (!order) { showToast('주문을 찾을 수 없습니다.'); return; }
    const next = getNextOrderStatus(order.status);
    if (!window.confirm(`이 주문을 ${getOrderStatusLabel(next)} 상태로 변경할까요?`)) return;
    busy = true;
    try {
      advanceOrderStatus(order.id, admin);
      showToast(`주문 상태가 ${getOrderStatusLabel(next)}로 변경되었습니다.`);
      render();
    } catch (error) {
      window.alert(error.message);
    } finally {
      busy = false;
    }
  });
  window.addEventListener('storage', render);
  window.addEventListener('momo-admin-data-changed', render);
  render();
})();
