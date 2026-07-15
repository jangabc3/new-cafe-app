(() => {
  if (!window.MomoAdmin || !window.MomoAdminAnalytics) return;

  const analytics = window.MomoAdminAnalytics;
  const byId = (id) => document.getElementById(id);
  const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
  const asDate = (value) => { const date = new Date(value); return Number.isNaN(date.getTime()) ? null : date; };
  const orderStatus = (value) => String(value || 'RECEIVED').toUpperCase();
  const isToday = (value) => analytics.local(value) === analytics.local(new Date());

  function preparationMinutes(order) {
    const started = asDate(order.createdAt);
    const history = Array.isArray(order.statusHistory) ? order.statusHistory : [];
    const ready = history.find((entry) => ['READY', 'COMPLETED', 'PICKED_UP'].includes(orderStatus(entry.status)));
    const finished = asDate(ready?.changedAt || ready?.createdAt || order.completedAt || (['READY', 'COMPLETED', 'PICKED_UP'].includes(orderStatus(order.status)) ? order.updatedAt : null));
    if (!started || !finished || finished <= started) return null;
    const minutes = (finished - started) / 60000;
    return minutes > 0 && minutes < 1440 ? minutes : null;
  }

  function menuData() {
    if (typeof window.getMenus === 'function') return window.getMenus();
    const stored = analytics.get('momo_coffee_menus_v6', []);
    return Array.isArray(stored) ? stored : [];
  }

  function formatAverage(minutes) {
    if (!minutes) return '-';
    const whole = Math.floor(minutes);
    const seconds = Math.round((minutes - whole) * 60);
    return seconds ? `${whole}분 ${seconds}초` : `${whole}분`;
  }

  function isNewNotice(dateText) {
    const date = asDate(String(dateText || '').replace(/\./g, '-'));
    if (!date) return false;
    const days = Math.abs(Date.now() - date.getTime()) / 86400000;
    return days <= 7;
  }

  function render() {
    const orders = analytics.orders();
    const inquiries = analytics.get('momoInquiries', []) || [];
    const menus = menuData();
    const settings = window.MomoAdminSettings?.get?.() || { storeOpen: true, orderEnabled: true, businessHours: { open: '09:00', close: '22:00' }, lastOrderTime: '21:30' };
    const now = Date.now();
    const todayOrders = orders.filter((order) => isToday(order.createdAt));
    const preparing = orders.filter((order) => orderStatus(order.status) === 'PREPARING');
    const pickupWaiting = orders.filter((order) => orderStatus(order.status) === 'READY');
    const delayed = preparing.filter((order) => {
      const changed = asDate(order.updatedAt || order.createdAt);
      return changed && now - changed.getTime() >= 15 * 60000;
    });
    const pending = inquiries.filter((inquiry) => orderStatus(inquiry?.status) === 'PENDING');
    const soldOut = menus.filter((menu) => menu?.isSoldOut || menu?.soldOut);
    const completedTimes = todayOrders.map(preparationMinutes).filter(Number.isFinite);
    const average = completedTimes.length ? completedTimes.reduce((sum, value) => sum + value, 0) / completedTimes.length : 0;
    const urgentCount = soldOut.length + delayed.length + pending.length;
    const paused = settings.maintenanceMode || settings.orderEnabled === false || settings.storeOpen === false;
    const storeState = settings.maintenanceMode ? '점검 중' : settings.orderEnabled === false ? '주문 일시 중지' : settings.storeOpen === false ? '영업 종료' : '정상 운영 중';

    const topbarDate = document.querySelector('.admin-topbar > div:first-of-type span');
    if (topbarDate) {
      topbarDate.textContent = new Intl.DateTimeFormat('ko-KR', {
        year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'short',
        hour: '2-digit', minute: '2-digit'
      }).format(new Date());
    }

    byId('opsStoreState').classList.toggle('is-paused', paused);
    byId('opsStoreState').innerHTML = `<i></i>${storeState}`;

    const summary = [
      { icon: 'store', label: '오늘 주문', value: `${todayOrders.length}건`, description: `진행 중 ${preparing.length + pickupWaiting.length}건`, url: '/admin/orders/list.html' },
      { icon: 'coffee', label: '제조 중', value: `${preparing.length}건`, description: `지연 중 ${delayed.length}건`, url: '/admin/orders/list.html' },
      { icon: 'check', label: '픽업 대기', value: `${pickupWaiting.length}건`, description: '완료 대기', url: '/admin/orders/list.html' },
      { icon: 'bell', label: '긴급 알림', value: `${urgentCount}건`, description: urgentCount ? '확인 필요' : '정상', action: 'priority' },
      { icon: 'clock', label: '평균 제조 시간', value: formatAverage(average), description: completedTimes.length ? '오늘 완료 주문 기준' : '완료 주문 집계 전' }
    ];
    byId('opsSummary').innerHTML = summary.map((item) => item.url ? `<a class="quick-card" href="${item.url}"><i class="quick-icon icon-${item.icon}" aria-hidden="true"></i><div><span>${item.label}</span><strong>${item.value}</strong><small>${item.description}</small></div></a>` : item.action ? `<button class="quick-card" type="button" data-ops-action="${item.action}"><i class="quick-icon icon-${item.icon}" aria-hidden="true"></i><div><span>${item.label}</span><strong>${item.value}</strong><small>${item.description}</small></div></button>` : `<article class="quick-card is-static"><i class="quick-icon icon-${item.icon}" aria-hidden="true"></i><div><span>${item.label}</span><strong>${item.value}</strong><small>${item.description}</small></div></article>`).join('');
    byId('opsSummary').querySelector('[data-ops-action="priority"]')?.addEventListener('click', () => {
      const card = document.querySelector('.priority-card');
      card?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'center' });
      card?.classList.remove('is-attention');
      requestAnimationFrame(() => card?.classList.add('is-attention'));
      setTimeout(() => card?.classList.remove('is-attention'), 1200);
    });

    const hours = settings.businessHours || {};
    byId('storeStatus').innerHTML = [
      ['영업 상태', storeState, 'status'],
      ['오픈 시간', hours.open || '미설정', 'clock'],
      ['마감 시간', hours.close || '미설정', 'clock'],
      ['라스트 오더', settings.lastOrderTime || '미설정', 'clock']
    ].map(([label, value, icon]) => `<div><dt><i class="row-icon icon-${icon}" aria-hidden="true"></i>${label}</dt><dd>${escapeHtml(value)}</dd></div>`).join('');

    const priority = [
      { icon: 'menu', label: '품절 메뉴 관리', description: soldOut.length ? `현재 ${soldOut.length}개의 메뉴가 품절 상태입니다.` : '현재 품절 메뉴가 없습니다.', count: soldOut.length, url: '/admin/menus/list.html' },
      { icon: 'timer', label: '지연 주문 확인', description: delayed.length ? `제조 지연 주문 ${delayed.length}건입니다.` : '제조 지연 주문이 없습니다.', count: delayed.length, url: '/admin/orders/list.html' },
      { icon: 'chat', label: '답변 대기 문의', description: pending.length ? `답변이 필요한 문의가 ${pending.length}건 있습니다.` : '답변 대기 문의가 없습니다.', count: pending.length, url: '/admin/qna/list.html' }
    ];
    byId('priorityTotal').textContent = `${urgentCount}건`;
    byId('urgentCards').innerHTML = priority.map((item) => `<article class="priority-item${item.count ? ' is-warning' : ''}"><i class="row-icon icon-${item.icon}" aria-hidden="true"></i><div><strong>${item.label}</strong><small>${escapeHtml(item.description)}</small></div><a href="${item.url}">확인하기</a></article>`).join('');

    const notices = Array.isArray(window.MOMO_NOTICES) ? window.MOMO_NOTICES.slice(0, 5) : [];
    byId('opsNotices').innerHTML = notices.length ? notices.map((notice) => `<a class="notice-item" href="/community/notice.html?id=${encodeURIComponent(notice.id)}"><i aria-hidden="true"></i><strong>${escapeHtml(notice.title)}</strong>${isNewNotice(notice.date) ? '<b>NEW</b>' : ''}<time>${escapeHtml(notice.date)}</time></a>`).join('') : '<p class="ops-empty">등록된 공지사항이 없습니다.</p>';

    byId('opsUpdated').textContent = `마지막 업데이트 ${new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}`;
    window.MomoAdminNotifications?.sync?.();
  }

  window.addEventListener('storage', render);
  window.addEventListener('momo-admin-data-changed', render);
  window.addEventListener('momo-settings-updated', render);
  const timer = window.setInterval(render, 30000);
  window.addEventListener('pagehide', () => window.clearInterval(timer), { once: true });
  render();
})();
