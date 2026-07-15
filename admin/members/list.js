(() => {
  if (!window.MomoAdmin) return;
  MomoAdmin.requireAdmin();

  const USERS_KEY = 'momoUsers';
  const ORDER_KEY = 'momo_coffee_orders_v1';
  const BENEFIT_KEY = 'momo_member_benefits_v1';
  const COUPON_KEY = 'momo_coffee_coupons_v1';
  const gradeRank = { WELCOME: 0, SILVER: 1, GOLD: 2, VIP: 3 };
  let currentPage = 1;
  let lastEditTrigger = null;

  const elements = {
    stats: document.querySelector('#memberStats'), list: document.querySelector('#memberList'), empty: document.querySelector('#memberEmpty'),
    search: document.querySelector('#memberSearch'), grade: document.querySelector('#gradeFilter'), join: document.querySelector('#joinFilter'),
    status: document.querySelector('#statusFilter'), sort: document.querySelector('#memberSort'), reset: document.querySelector('#resetFilters'),
    result: document.querySelector('#memberResultCount'), total: document.querySelector('#memberTotalText'), pagination: document.querySelector('#memberPagination'),
    pageSize: document.querySelector('#pageSize'), editModal: document.querySelector('#memberEditModal'), editForm: document.querySelector('#memberEditForm')
  };

  const read = MomoAdmin.read;
  const readUserStore = () => {
    const raw = read(USERS_KEY, []);
    return { raw, users: Array.isArray(raw) ? raw : Array.isArray(raw?.users) ? raw.users : [] };
  };
  const saveUsers = (store, users) => localStorage.setItem(USERS_KEY, JSON.stringify(Array.isArray(store.raw) ? users : { ...store.raw, users }));
  const esc = (value) => escapeHtml(String(value ?? ''));
  const date = (value, withTime = false) => {
    if (!value) return '-';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return '-';
    return new Intl.DateTimeFormat('ko-KR', withTime ? { year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit' } : { year:'numeric', month:'2-digit', day:'2-digit' }).format(parsed);
  };
  const key = (user) => String(user.id || user.email || '').toLowerCase();
  const amount = (order) => Math.max(0, Number(order.totalAmount ?? order.total ?? 0) || 0);
  const belongs = (order, user) => String(order.userId ?? order.userEmail) === String(user.id ?? user.email)
    || String(order.userEmail || '').toLowerCase() === String(user.email || '').toLowerCase();
  const getGrade = (spent) => spent >= 700000 ? 'VIP' : spent >= 300000 ? 'GOLD' : spent >= 100000 ? 'SILVER' : 'WELCOME';
  const isInactive = (user) => user.status === 'inactive' || user.isActive === false;
  const getMembers = () => {
    const users = readUserStore().users;
    const orders = read(ORDER_KEY, []) || [];
    const benefits = read(BENEFIT_KEY, {}) || {};
    const coupons = read(COUPON_KEY, []) || [];
    return users.filter((user) => user?.email && user.role !== 'ADMIN').map((user) => {
      const ownOrders = orders.filter((order) => belongs(order, user)).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      const spent = ownOrders.filter((order) => String(order.status).toLowerCase() !== 'cancelled').reduce((sum, order) => sum + amount(order), 0);
      const memberKey = key(user);
      const benefit = benefits[memberKey] || {};
      const couponCount = coupons.filter((coupon) => {
        const ownerMatches = String(coupon.memberKey || '').toLowerCase() === memberKey || String(coupon.userId || '') === String(user.id || user.email);
        return ownerMatches && !coupon.used && !coupon.revoked && coupon.status !== 'used' && coupon.status !== 'expired';
      }).length;
      return { ...user, key: memberKey, orders: ownOrders, spent, grade: getGrade(spent), points: Math.max(0, Number(benefit.points ?? user.points ?? 0) || 0), couponCount, lastOrder: ownOrders[0]?.createdAt || null, inactive: isInactive(user) };
    });
  };

  const renderStats = (members) => {
    const counts = Object.fromEntries(Object.keys(gradeRank).map((grade) => [grade, members.filter((member) => member.grade === grade).length]));
    const cards = [
      { key:'total', label:'전체 회원', value:members.length, description:'등록된 고객 회원' },
      ...Object.entries(counts).map(([label, value]) => ({ key:label.toLowerCase(), label, value, description:`${label} 등급 회원` }))
    ];
    elements.stats.innerHTML = cards.map((card) => `<article><span class="stat-icon stat-icon-${card.key}" aria-hidden="true"></span><div><small>${card.label}</small><strong>${card.value}명</strong><p>${card.description}</p></div></article>`).join('');
  };

  const getFiltered = (members) => {
    const term = elements.search.value.trim().toLowerCase();
    const days = Number(elements.join.value) || 0;
    const cutoff = days ? Date.now() - days * 86400000 : 0;
    const rows = members.filter((member) => {
      const searchable = `${member.name || ''} ${member.email || ''} ${member.phone || ''}`.toLowerCase();
      const status = member.inactive ? 'inactive' : 'active';
      const joinedAt = new Date(member.createdAt).getTime();
      return (!term || searchable.includes(term))
        && (!elements.grade.value || member.grade === elements.grade.value)
        && (!cutoff || (Number.isFinite(joinedAt) && joinedAt >= cutoff))
        && (!elements.status.value || status === elements.status.value);
    });
    if (elements.sort.value === 'joined') rows.sort((a, b) => (new Date(b.createdAt).getTime() || 0) - (new Date(a.createdAt).getTime() || 0));
    if (elements.sort.value === 'spent') rows.sort((a, b) => b.spent - a.spent);
    if (elements.sort.value === 'orders') rows.sort((a, b) => b.orders.length - a.orders.length);
    if (elements.sort.value === 'grade') rows.sort((a, b) => gradeRank[b.grade] - gradeRank[a.grade]);
    return rows;
  };

  const renderPagination = (totalPages) => {
    if (totalPages <= 1) { elements.pagination.innerHTML = ''; return; }
    elements.pagination.innerHTML = `<button type="button" data-page="${currentPage - 1}" ${currentPage === 1 ? 'disabled' : ''} aria-label="이전 페이지">‹</button>${Array.from({ length:totalPages }, (_, index) => index + 1).map((page) => `<button type="button" data-page="${page}" ${page === currentPage ? 'aria-current="page"' : ''}>${page}</button>`).join('')}<button type="button" data-page="${currentPage + 1}" ${currentPage === totalPages ? 'disabled' : ''} aria-label="다음 페이지">›</button>`;
  };

  const render = () => {
    const members = getMembers();
    renderStats(members);
    const rows = getFiltered(members);
    const size = Number(elements.pageSize.value) || 10;
    const totalPages = Math.max(1, Math.ceil(rows.length / size));
    currentPage = Math.min(currentPage, totalPages);
    const visible = rows.slice((currentPage - 1) * size, currentPage * size);
    elements.result.textContent = `총 ${rows.length}명`;
    elements.total.textContent = `총 회원 ${members.length}명`;
    elements.empty.hidden = rows.length > 0;
    document.querySelector('.member-table-wrap').hidden = rows.length === 0;
    elements.list.innerHTML = visible.map((member) => `<tr>
      <td data-label="회원 정보"><a class="member-profile" href="/admin/members/detail.html#id=${encodeURIComponent(member.id ?? member.email)}"><span><strong>${esc(member.name || '-')}</strong><small>${esc(member.email)}</small></span></a></td>
      <td data-label="등급"><span class="grade-badge grade-${member.grade}">${member.grade}</span></td>
      <td data-label="주문">${member.orders.length}건</td><td data-label="누적 구매금액">${member.spent.toLocaleString('ko-KR')}원</td><td data-label="포인트">${member.points.toLocaleString('ko-KR')}P</td><td data-label="쿠폰">${member.couponCount}장</td>
      <td data-label="가입일">${date(member.createdAt)}</td><td data-label="최근 접속">${date(member.lastLoginAt || member.lastOrder, true)}</td>
      <td data-label="상태"><span class="state-badge ${member.inactive ? 'inactive' : ''}">${member.inactive ? '비활성' : '활성'}</span></td>
      <td data-label="관리"><div class="member-menu-shell"><button class="member-more" type="button" data-more aria-label="${esc(member.name || '회원')} 관리 메뉴" aria-expanded="false">···</button><div class="member-row-menu" hidden><button type="button" data-edit="${esc(member.id ?? member.email)}">정보 수정</button><a href="/admin/members/detail.html#id=${encodeURIComponent(member.id ?? member.email)}">상세보기</a><button type="button" data-status="${esc(member.id ?? member.email)}">${member.inactive ? '활성으로 변경' : '비활성으로 변경'}</button></div></div></td>
    </tr>`).join('');
    renderPagination(totalPages);
  };

  const findUser = (id) => readUserStore().users.find((user) => user.role !== 'ADMIN' && (String(user.id) === String(id) || String(user.email) === String(id)));
  const updateUser = (id, updater) => {
    MomoAdmin.requireAdmin();
    const store = readUserStore();
    const index = store.users.findIndex((user) => user.role !== 'ADMIN' && (String(user.id) === String(id) || String(user.email) === String(id)));
    if (index < 0) throw new Error('회원을 찾을 수 없습니다.');
    const before = { ...store.users[index] };
    store.users[index] = updater({ ...store.users[index] });
    saveUsers(store, store.users);
    return { before, after:store.users[index] };
  };

  const closeEditModal = () => {
    elements.editModal.hidden = true;
    document.body.classList.remove('admin-modal-open');
    lastEditTrigger?.focus();
  };
  const openEditModal = (id, trigger) => {
    const user = findUser(id);
    if (!user) return;
    lastEditTrigger = trigger;
    document.querySelectorAll('.member-row-menu').forEach((item) => { item.hidden = true; });
    document.querySelectorAll('[data-more]').forEach((button) => button.setAttribute('aria-expanded', 'false'));
    elements.editForm.memberId.value = user.id ?? user.email;
    elements.editForm.name.value = user.name || '';
    elements.editForm.email.value = user.email || '';
    elements.editForm.phone.value = user.phone || '';
    elements.editForm.birthDate.value = user.birthDate || user.birthday || '';
    elements.editModal.hidden = false;
    document.body.classList.add('admin-modal-open');
    elements.editForm.name.focus();
  };

  [elements.search, elements.grade, elements.join, elements.status, elements.sort, elements.pageSize].forEach((control) => control.addEventListener('input', () => { currentPage = 1; render(); }));
  elements.reset.addEventListener('click', () => { elements.search.value=''; elements.grade.value=''; elements.join.value=''; elements.status.value=''; elements.sort.value='joined'; currentPage=1; render(); });
  elements.pagination.addEventListener('click', (event) => { const button=event.target.closest('[data-page]'); if(!button||button.disabled)return; currentPage=Number(button.dataset.page)||1; render(); document.querySelector('.member-panel').scrollIntoView({behavior:'smooth',block:'start'}); });

  elements.list.addEventListener('click', async (event) => {
    const moreButton = event.target.closest('[data-more]');
    const editButton = event.target.closest('[data-edit]');
    const statusButton = event.target.closest('[data-status]');
    if (moreButton) {
      const menu = moreButton.nextElementSibling;
      const willOpen = menu.hidden;
      document.querySelectorAll('.member-row-menu').forEach((item) => { item.hidden = true; });
      document.querySelectorAll('[data-more]').forEach((button) => button.setAttribute('aria-expanded', 'false'));
      menu.hidden = !willOpen;
      moreButton.setAttribute('aria-expanded', String(willOpen));
      return;
    }
    if (editButton) openEditModal(editButton.dataset.edit, editButton);
    if (statusButton) {
      const user = findUser(statusButton.dataset.status); if (!user) return;
      const nextInactive = !isInactive(user);
      if (!await MomoAdmin.confirm(`${user.name || user.email} 회원을 ${nextInactive ? '비활성' : '활성'} 상태로 변경할까요?`, '회원 상태 변경')) return;
      const changed = updateUser(statusButton.dataset.status, (current) => ({ ...current, status:nextInactive?'inactive':'active', isActive:!nextInactive, updatedAt:new Date().toISOString() }));
      MomoAdminActivity?.log(MomoAdmin.user, 'UPDATE_MEMBER_STATUS', 'MEMBER', changed.after.id ?? changed.after.email, `회원 ${nextInactive?'비활성':'활성'} 전환`, { status:changed.before.status, isActive:changed.before.isActive }, { status:changed.after.status, isActive:changed.after.isActive });
      MomoAdmin.toast(`회원 상태가 ${nextInactive ? '비활성' : '활성'}으로 변경되었습니다.`); render();
    }
  });

  elements.editForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const id=elements.editForm.memberId.value, user=findUser(id); if(!user)return;
    const payload={name:elements.editForm.name.value.trim(),phone:elements.editForm.phone.value.trim(),birthDate:elements.editForm.birthDate.value};
    if(!payload.name){elements.editForm.name.focus();return}
    const changed=updateUser(id,(current)=>({...current,...payload,updatedAt:new Date().toISOString()}));
    MomoAdminActivity?.log(MomoAdmin.user,'UPDATE_MEMBER','MEMBER',changed.after.id??changed.after.email,'회원 정보 수정',{name:changed.before.name,phone:changed.before.phone,birthDate:changed.before.birthDate},{name:changed.after.name,phone:changed.after.phone,birthDate:changed.after.birthDate});
    closeEditModal(); MomoAdmin.toast('회원 정보가 수정되었습니다.'); render();
  });
  elements.editModal.addEventListener('click',(event)=>{if(event.target===elements.editModal||event.target.closest('[data-edit-close]'))closeEditModal()});
  document.addEventListener('click',(event)=>{if(!event.target.closest('.member-menu-shell')){document.querySelectorAll('.member-row-menu').forEach((item)=>{item.hidden=true});document.querySelectorAll('[data-more]').forEach((button)=>button.setAttribute('aria-expanded','false'))}});
  document.addEventListener('keydown',(event)=>{if(event.key==='Escape'&&!elements.editModal.hidden)closeEditModal();if(event.key==='Escape'){document.querySelectorAll('.member-row-menu').forEach((item)=>{item.hidden=true});document.querySelectorAll('[data-more]').forEach((button)=>button.setAttribute('aria-expanded','false'))}});

  render();
})();
