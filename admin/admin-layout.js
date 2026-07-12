(() => {
  const read=(key,fallback=null)=>{try{return JSON.parse(localStorage.getItem(key))??fallback}catch{return fallback}};
  const user=read('momoCurrentUser');
  if(!user){location.replace('/login.html?redirect='+encodeURIComponent(location.pathname+location.search));return}
  if(user.role!=='ADMIN'){alert('관리자만 접근할 수 있습니다.');location.replace('/index.html');return}
  const app=document.querySelector('.admin-app');if(!app)return;
  const page=document.body.dataset.adminPage||'', pending=(read('momoInquiries',[])||[]).filter(q=>q?.status==='PENDING').length;
  const groups=[
    ['운영',[['dashboard','대시보드','/admin/index.html'],['operations','운영 센터','/admin/operations/index.html'],['orders','주문 관리','/admin/orders/list.html'],['menus','메뉴 관리','/admin/menus/list.html']]],
    ['고객',[['members','회원 관리','/admin/members/list.html'],['qna','문의 관리','/admin/qna/list.html'],['rewards','리워드 관리','/admin/rewards/list.html']]],
    ['분석',[['analytics','통계 분석','/admin/analytics/index.html'],['activity','활동 로그','/admin/activity/list.html']]],
    ['설정',[['settings','운영 설정','/admin/settings/index.html']]]
  ];
  const sidebar=document.createElement('aside');sidebar.className='admin-sidebar';sidebar.id='adminSidebar';
  sidebar.innerHTML=`<a class="admin-brand" href="/admin/index.html"><img src="/assets/images/momo-header-logo.png?v=5" alt=""><span><b>MOMO</b><small>ADMIN</small></span></a><nav aria-label="관리자 메뉴">${groups.map(([title,items])=>`<section class="admin-nav-group"><h2>${title}</h2>${items.map(([id,label,href])=>`<a href="${href}" class="${page===id?'active':''}" ${page===id?'aria-current="page"':''}><span>${label}</span>${id==='qna'&&pending?`<b>${pending}</b>`:''}</a>`).join('')}</section>`).join('')}</nav><div class="sidebar-bottom"><a href="/index.html">홈페이지 보기</a><button type="button" data-admin-logout>로그아웃</button></div>`;
  const notices=window.MomoAdminNotifications?.sync()||[],unread=notices.filter(n=>!n.read).length;
  const top=document.createElement('header');top.className='admin-topbar';
  top.innerHTML=`<button class="sidebar-toggle" type="button" aria-label="관리자 메뉴 열기" aria-controls="adminSidebar" aria-expanded="false">☰</button><div><strong>${page==='dashboard'?'대시보드':document.title.split('|')[0].trim()}</strong><span>${new Intl.DateTimeFormat('ko-KR',{year:'numeric',month:'long',day:'numeric',weekday:'short'}).format(new Date())}</span></div><div class="admin-identity"><button class="admin-notification-button" type="button" aria-label="관리자 알림, 읽지 않음 ${unread}개" aria-expanded="false">◇<b ${unread?'':'hidden'}>${unread}</b></button><span><b>${user.name||'관리자'}</b><small>ADMIN</small></span><a href="/index.html">홈</a><button type="button" data-admin-logout>로그아웃</button></div>`;
  const panel=document.createElement('section');panel.className='admin-notification-panel';panel.hidden=true;
  const renderNotices=()=>{const list=window.MomoAdminNotifications?.getAll()||[];panel.innerHTML=`<header><div><strong>알림 센터</strong><small>실제 저장 데이터 기준</small></div><button type="button" data-read-all>모두 읽음</button></header><div class="notification-filters"><button type="button" data-filter="all" class="active">전체</button><button type="button" data-filter="unread">읽지 않음</button></div><div class="notification-list">${list.length?list.slice(0,20).map(n=>`<a href="${n.targetUrl||'#'}" data-id="${n.id}" class="${n.read?'':'unread'}"><b>${n.title||'운영 알림'}</b><span>${n.message||''}</span><time>${n.createdAt?new Date(n.createdAt).toLocaleString('ko-KR'):'-'}</time></a>`).join(''):'<p class="empty">새 알림이 없습니다.</p>'}</div>`};
  renderNotices();app.prepend(sidebar);app.insertBefore(top,app.querySelector('.admin-content'));document.body.append(panel);
  document.querySelectorAll('[data-admin-logout]').forEach(button=>button.onclick=()=>{localStorage.removeItem('momoCurrentUser');location.replace('/index.html')});
  const toggle=top.querySelector('.sidebar-toggle'),bell=top.querySelector('.admin-notification-button');toggle.onclick=()=>{const open=document.body.classList.toggle('admin-nav-open');toggle.setAttribute('aria-expanded',String(open))};bell.onclick=()=>{panel.hidden=!panel.hidden;bell.setAttribute('aria-expanded',String(!panel.hidden));if(!panel.hidden)renderNotices()};
  panel.onclick=event=>{if(event.target.closest('[data-read-all]')){MomoAdminNotifications?.markAllRead();renderNotices();return}const filter=event.target.closest('[data-filter]');if(filter){panel.querySelectorAll('[data-filter]').forEach(b=>b.classList.toggle('active',b===filter));panel.querySelectorAll('.notification-list a').forEach(a=>a.hidden=filter.dataset.filter==='unread'&&!a.classList.contains('unread'));return}const link=event.target.closest('[data-id]');if(link)MomoAdminNotifications?.markRead(link.dataset.id)};
  document.addEventListener('keydown',event=>{if(event.key==='Escape'){document.body.classList.remove('admin-nav-open');panel.hidden=true;toggle.setAttribute('aria-expanded','false');bell.setAttribute('aria-expanded','false')}});
  window.MomoAdmin={user,read};
})();
