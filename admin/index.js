(() => {
  if (!window.MomoAdmin || !window.MomoAdminAnalytics) return;

  const A = window.MomoAdminAnalytics;
  const $ = (id) => document.getElementById(id);
  const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[character]));
  const safeDate = (value) => {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  };
  const normalizeStatus = (value) => String(value || 'RECEIVED').toUpperCase();
  const statusLabel = (value) => ({
    PENDING: '주문 접수', RECEIVED: '주문 접수', CONFIRMED: '주문 접수',
    PREPARING: '제조 중', READY: '제조 완료', COMPLETED: '픽업 완료', PICKED_UP: '픽업 완료'
  }[normalizeStatus(value)] || '주문 접수');
  const categoryLabel = (value) => ({
    coffee: '커피', signature: '시그니처', noncoffee: '논커피', tea: '티',
    dessert: '디저트', bakery: '베이커리', season: '시즌', goods: '상품'
  }[String(value || '').toLowerCase()] || '메뉴');

  const orders = A.orders();
  const rawUsers = A.get('momoUsers', []);
  const users = (Array.isArray(rawUsers) ? rawUsers : rawUsers?.users || []).filter((user) => user?.role !== 'ADMIN');
  const inquiries = Array.isArray(A.get('momoInquiries', [])) ? A.get('momoInquiries', []) : [];
  const menus = typeof getMenus === 'function' ? getMenus() : [];
  const menuCatalog = typeof MENU_ITEMS !== 'undefined' && Array.isArray(MENU_ITEMS) ? MENU_ITEMS : [];
  const settings = window.MomoAdminSettings?.get?.() || {};
  const todayKey = A.local(new Date());
  const todayOrders = orders.filter((order) => A.local(order.createdAt) === todayKey);
  const todayMembers = users.filter((user) => A.local(user.createdAt || user.joinedAt || user.signupAt) === todayKey);
  const pending = inquiries.filter((inquiry) => inquiry?.status === 'PENDING');
  const soldOut = menus.filter((menu) => menu?.isSoldOut || menu?.soldOut);
  const todaySales = todayOrders.reduce((sum, order) => sum + A.amount(order), 0);

  $('heroAdminName').textContent = window.MomoAdmin.user.name || 'MOMO 관리자';
  $('heroDate').textContent = new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' }).format(new Date());
  const storeState = settings.maintenanceMode ? '사이트 점검 중' : settings.orderEnabled === false ? '온라인 주문 중지' : settings.storeOpen === false ? '영업 종료' : '정상 영업 중';
  $('heroStoreState').innerHTML = `<i class="live-dot ${settings.maintenanceMode || settings.orderEnabled === false ? 'is-paused' : ''}"></i>${storeState}`;

  const summaryCards = [
    { icon: 'bag', label: '오늘 주문 수', value: `${todayOrders.length}건`, note: '오늘 접수된 유효 주문', href: '/admin/orders/list.html' },
    { icon: 'cup', label: '오늘 매출', value: window.MomoAdmin.formatMoney(todaySales), note: '취소·결제 실패 제외', href: '/admin/analytics/index.html' },
    { icon: 'member', label: '신규 회원 수', value: `${todayMembers.length}명`, note: `전체 고객 ${users.length}명`, href: '/admin/members/list.html' },
    { icon: 'chat', label: '문의 답변 대기', value: `${pending.length}건`, note: `전체 문의 ${inquiries.length}건`, href: '/admin/qna/list.html' },
    { icon: 'alert', label: '품절 메뉴', value: `${soldOut.length}개`, note: `전체 메뉴 ${menus.length}개`, href: '/admin/menus/list.html' }
  ];
  const icons = {
    bag: '<path d="M7 8h10l1 12H6L7 8Zm3 0V6a2 2 0 0 1 4 0v2"/>',
    cup: '<path d="M5 8h11v6a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5V8Zm11 2h2a2 2 0 0 1 0 4h-2M8 4c0 1 1 1 1 2m3-2c0 1 1 1 1 2"/>',
    member: '<circle cx="12" cy="8" r="4"/><path d="M5 21a7 7 0 0 1 14 0"/>',
    chat: '<path d="M5 5h14v11H10l-5 4V5Z"/><path d="M9 10h.01M12 10h.01M15 10h.01"/>',
    alert: '<path d="m12 3 9 17H3L12 3Z"/><path d="M12 9v5m0 3h.01"/>'
  };
  $('summaryGrid').innerHTML = summaryCards.map((card) => `<a class="summary-card" href="${card.href}">
    <div><span>${card.label}</span><strong>${card.value}</strong><p>${card.note}</p></div>
    <i aria-hidden="true"><svg viewBox="0 0 24 24">${icons[card.icon]}</svg></i>
  </a>`).join('');

  const receivedCount = orders.filter((order) => ['PENDING', 'RECEIVED', 'CONFIRMED'].includes(normalizeStatus(order.status))).length;
  const preparingCount = orders.filter((order) => normalizeStatus(order.status) === 'PREPARING').length;

  function salesDays(totalDays) {
    return Array.from({ length: totalDays }, (_, index) => {
      const date = new Date();
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - (totalDays - 1 - index));
      const key = A.local(date);
      const rows = orders.filter((order) => A.local(order.createdAt) === key);
      return { key, label: `${date.getMonth() + 1}.${date.getDate()}`, sales: rows.reduce((sum, order) => sum + A.amount(order), 0), count: rows.length };
    });
  }
  function renderSalesChart(totalDays = 7) {
    const days = salesDays(totalDays);
    const maxSales = Math.max(1, ...days.map((day) => day.sales));
    const width = 700, height = 250, left = 55, right = 18, top = 18, bottom = 42;
    const plotWidth = width - left - right, plotHeight = height - top - bottom;
    const x = (index) => left + (plotWidth / Math.max(1, days.length - 1)) * index;
    const ySales = (sales) => top + plotHeight - (sales / maxSales) * plotHeight;
    const points = days.map((day, index) => [x(index), ySales(day.sales)]);
    const smoothPath = points.reduce((path, point, index) => {
      if (index === 0) return `M ${point[0]} ${point[1]}`;
      const previous = points[index - 1];
      const middle = (previous[0] + point[0]) / 2;
      return `${path} C ${middle} ${previous[1]}, ${middle} ${point[1]}, ${point[0]} ${point[1]}`;
    }, '');
    const areaPath = `${smoothPath} L ${points.at(-1)[0]} ${top + plotHeight} L ${points[0][0]} ${top + plotHeight} Z`;
    const labelStep = totalDays <= 7 ? 1 : totalDays <= 14 ? 2 : 5;
    $('dashboardSalesChart').innerHTML = `<svg viewBox="0 0 ${width} ${height}" aria-hidden="true" preserveAspectRatio="none">
      <defs><linearGradient id="salesArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d9bda8" stop-opacity=".38"/><stop offset="1" stop-color="#f8f1eb" stop-opacity=".04"/></linearGradient></defs>
      ${[0, .25, .5, .75, 1].map((ratio) => `<g><line class="chart-grid-line" x1="${left}" y1="${top + plotHeight * ratio}" x2="${width - right}" y2="${top + plotHeight * ratio}"/><text x="${left - 10}" y="${top + plotHeight * ratio + 4}" text-anchor="end">${Math.round(maxSales * (1 - ratio) / 10000)}만</text></g>`).join('')}
      <path class="sales-area" d="${areaPath}"/>
      <path class="sales-line" d="${smoothPath}"/>
      ${days.map((day, index) => `<g class="sales-hit" data-sales-index="${index}" tabindex="0" aria-label="${day.key} 매출 ${window.MomoAdmin.formatMoney(day.sales)}"><circle class="sales-hit-area" cx="${x(index)}" cy="${ySales(day.sales)}" r="14"/><circle class="sales-point" cx="${x(index)}" cy="${ySales(day.sales)}" r="4"/>${index % labelStep === 0 || index === days.length - 1 ? `<text x="${x(index)}" y="${height - 12}" text-anchor="middle">${day.label}</text>` : ''}</g>`).join('')}
    </svg><div class="sales-tooltip" id="salesTooltip" hidden></div>`;
    const tooltip = $('salesTooltip');
    $('dashboardSalesChart').querySelectorAll('.sales-hit').forEach((hit) => {
      const show = () => {
        const day = days[Number(hit.dataset.salesIndex)];
        const point = hit.querySelector('.sales-point');
        tooltip.innerHTML = `<span>${day.key.replaceAll('-', '. ')}</span><strong>${window.MomoAdmin.formatMoney(day.sales)}</strong><small>주문 ${day.count}건</small>`;
        tooltip.style.left = `${point.cx.baseVal.value / width * 100}%`;
        tooltip.style.top = `${point.cy.baseVal.value / height * 100}%`;
        tooltip.hidden = false;
      };
      hit.addEventListener('mouseenter', show);
      hit.addEventListener('focusin', show);
      hit.addEventListener('mouseleave', () => { tooltip.hidden = true; });
      hit.addEventListener('focusout', () => { tooltip.hidden = true; });
    });
    const periodSales = days.reduce((sum, day) => sum + day.sales, 0);
    const periodOrders = days.reduce((sum, day) => sum + day.count, 0);
    $('dashboardSalesSummary').textContent = `최근 ${totalDays}일 총매출 ${window.MomoAdmin.formatMoney(periodSales)} · 주문 ${periodOrders}건`;
    $('dashboardSalesChart').setAttribute('aria-label', `최근 ${totalDays}일 매출 추이 차트`);
  }
  renderSalesChart(7);
  $('salesPeriodSelect').addEventListener('change', (event) => renderSalesChart(Number(event.target.value) || 7));

  const statusDefinitions = [
    { label: '주문 접수', className: 'received', count: receivedCount },
    { label: '제조 중', className: 'preparing', count: preparingCount },
    { label: '제조 완료', className: 'ready', count: orders.filter((order) => normalizeStatus(order.status) === 'READY').length },
    { label: '픽업 완료', className: 'complete', count: orders.filter((order) => ['COMPLETED', 'PICKED_UP'].includes(normalizeStatus(order.status))).length }
  ];
  const statusTotal = statusDefinitions.reduce((sum, status) => sum + status.count, 0);
  let currentAngle = 0;
  const statusColors = ['#9b806c', '#ddc4a9', '#a9bda9', '#6f8d79'];
  const gradients = statusDefinitions.map((status, index) => {
    const start = currentAngle;
    const end = currentAngle + (statusTotal ? status.count / statusTotal * 360 : 0);
    currentAngle = end;
    return `${statusColors[index]} ${start}deg ${end}deg`;
  });
  $('statusDonut').style.background = statusTotal ? `conic-gradient(${gradients.join(',')})` : '#eee7df';
  $('statusTotal').textContent = `${statusTotal}건`;
  $('statusLegend').innerHTML = statusDefinitions.map((status, index) => `<div><i style="--status-color:${statusColors[index]}"></i><span>${status.label}</span><strong>${status.count}건</strong><small>${statusTotal ? Math.round(status.count / statusTotal * 100) : 0}%</small></div>`).join('');

  const renderEmpty = (container, message) => window.MomoAdmin.empty(container, message);
  const menuImage = (order) => {
    const item = (order.items || [])[0] || {};
    const matched = menuCatalog.find((menu) => String(menu.id) === String(item.menuId ?? item.id) || menu.name === item.name)
      || menus.find((menu) => String(menu.id) === String(item.menuId ?? item.id) || menu.name === item.name);
    const source = item.image || matched?.image;
    if (!source) return '/assets/images/momo-header-logo.png?v=5';
    if (/^(?:https?:|data:)/i.test(String(source))) return String(source);
    return `/${String(source).replace(/^\.\.\//, '').replace(/^\.\//, '').replace(/^\//, '')}`;
  };
  const recentOrders = [...orders].sort((a, b) => (safeDate(b.createdAt)?.getTime() || 0) - (safeDate(a.createdAt)?.getTime() || 0)).slice(0, 5);
  if (!recentOrders.length) renderEmpty($('recentOrders'), '아직 접수된 주문이 없습니다.');
  else $('recentOrders').innerHTML = `<div class="dashboard-list">${recentOrders.map((order) => `<a href="/admin/orders/detail.html?id=${encodeURIComponent(order.id)}"><img class="list-thumb" src="${escapeHtml(menuImage(order))}" alt="" loading="lazy"><div><strong>${escapeHtml(order.orderNumber || order.id || '-')}</strong><small>${escapeHtml((order.items || []).map((item) => item.name).filter(Boolean).join(', ') || order.customerName || '주문 메뉴')}</small></div><span class="status-badge status-${normalizeStatus(order.status)}">${statusLabel(order.status)}</span><time>${window.MomoAdmin.relativeTime(order.createdAt)}</time></a>`).join('')}</div>`;

  const recentInquiries = [...inquiries].sort((a, b) => (safeDate(b.createdAt)?.getTime() || 0) - (safeDate(a.createdAt)?.getTime() || 0)).slice(0, 5);
  if (!recentInquiries.length) renderEmpty($('recentInquiries'), '등록된 고객 문의가 없습니다.');
  else $('recentInquiries').innerHTML = `<div class="dashboard-list simple">${recentInquiries.map((inquiry) => `<a href="/admin/qna/detail.html?id=${encodeURIComponent(inquiry.id)}"><div><strong>${escapeHtml(inquiry.title || '제목 없음')}</strong><small>${escapeHtml(inquiry.userName || inquiry.userEmail || '고객')} · ${categoryLabel(inquiry.category)}</small></div><span class="status-badge ${inquiry.status === 'ANSWERED' ? 'done' : ''}">${inquiry.status === 'ANSWERED' ? '답변 완료' : '답변 대기'}</span><time>${window.MomoAdmin.relativeTime(inquiry.createdAt)}</time></a>`).join('')}</div>`;

  const notices = Array.isArray(window.MOMO_NOTICES) ? window.MOMO_NOTICES.slice(0, 5) : [];
  if (!notices.length) renderEmpty($('recentNotices'), '등록된 공지사항이 없습니다.');
  else $('recentNotices').innerHTML = `<div class="dashboard-list notice-list">${notices.map((notice) => `<a href="/community/notice-detail.html?id=${encodeURIComponent(notice.id)}"><div><strong>${escapeHtml(notice.title || '모모커피 소식')}</strong><small>${escapeHtml(notice.category || '공지사항')}</small></div><time>${escapeHtml(notice.date || '-')}</time></a>`).join('')}</div>`;
})();
