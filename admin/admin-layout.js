(() => {
  const read=(key,fallback=null)=>{try{return JSON.parse(localStorage.getItem(key))??fallback}catch{return fallback}};
  const user=read('momoCurrentUser');
  if(!user){location.replace('/auth/login.html?redirect='+encodeURIComponent(location.pathname+location.search));return}
  if(user.role!=='ADMIN'){alert('관리자만 접근할 수 있습니다.');location.replace('/index.html');return}
  const app=document.querySelector('.admin-app');if(!app)return;
  if(!document.querySelector('link[href="/admin/notification-center.css"]')){const notificationStyle=document.createElement('link');notificationStyle.rel='stylesheet';notificationStyle.href='/admin/notification-center.css';document.head.append(notificationStyle)}
  // `serve` can redirect clean URLs while dropping a query string. Detail
  // identifiers therefore travel in the fragment and are restored in-place.
  const routeHash=new URLSearchParams(location.hash.replace(/^#/,''));
  if(/\/admin\/(?:qna|orders|members|menus)\/detail(?:\.html)?\/?$/.test(location.pathname)&&!new URLSearchParams(location.search).get('id')&&routeHash.get('id')){
    const detailId=routeHash.get('id');
    const section=routeHash.get('section');
    history.replaceState(null,'',`${location.pathname}?id=${encodeURIComponent(detailId)}${section==='answer'?'#answer':''}`);
  }
  const path=location.pathname.replace(/\/index\.html$/,'').replace(/\/$/,'');
  const page=document.body.dataset.adminPage||({
    '/admin':'dashboard','/admin/operations':'operations','/admin/orders/list':'orders','/admin/menus/list':'menus','/admin/members/list':'members','/admin/qna/list':'qna','/admin/rewards/list':'rewards','/admin/analytics':'analytics','/admin/activity/list':'activity','/admin/settings':'settings'
  }[path]||'');
  const pending=(read('momoInquiries',[])||[]).filter(item=>item?.status==='PENDING').length;
  const groups=[['',[['dashboard','Dashboard','/admin/index.html']]],['OPERATIONS',[['operations','운영 센터','/admin/operations/index.html'],['orders','주문 관리','/admin/orders/list.html'],['menus','메뉴 관리','/admin/menus/list.html']]],['CUSTOMERS',[['members','회원 관리','/admin/members/list.html'],['qna','문의 관리','/admin/qna/list.html'],['rewards','리워드 관리','/admin/rewards/list.html']]],['ANALYTICS',[['analytics','통계 분석','/admin/analytics/index.html'],['activity','활동 로그','/admin/activity/list.html']]],['SETTINGS',[['settings','운영 설정','/admin/settings/index.html']]]];
  const sidebar=document.createElement('aside');sidebar.className='admin-sidebar';sidebar.id='adminSidebar';
  sidebar.innerHTML=`<a class="admin-brand" href="/admin/index.html"><img src="/assets/images/momo-header-logo.png?v=5" alt=""><span><b>MOMO</b><small>ADMIN</small></span></a><nav aria-label="관리자 메뉴">${groups.map(([title,items])=>`<section class="admin-nav-group"><h2>${title}</h2>${items.map(([id,label,href])=>`<a href="${href}" class="${page===id?'active':''}" ${page===id?'aria-current="page"':''}><span>${label}</span>${id==='qna'&&pending?`<b>${pending}</b>`:''}</a>`).join('')}</section>`).join('')}</nav><div class="sidebar-bottom"><a href="/index.html">홈페이지 보기</a><button type="button" data-admin-logout>로그아웃</button></div>`;
  const notices=window.MomoAdminNotifications?.sync()||[],unread=notices.filter(item=>!item.read).length;
  const top=document.createElement('header');top.className='admin-topbar';top.innerHTML=`<button class="sidebar-toggle" type="button" aria-label="관리자 메뉴 열기" aria-controls="adminSidebar" aria-expanded="false">☰</button><div><strong>${page==='dashboard'?'대시보드':document.title.split('|')[0].trim()}</strong><span>${new Intl.DateTimeFormat('ko-KR',{year:'numeric',month:'long',day:'numeric',weekday:'short'}).format(new Date())}</span></div><div class="admin-identity"><button class="admin-notification-button" type="button" aria-label="관리자 알림, 읽지 않음 ${unread}개" aria-expanded="false">◇<b ${unread?'':'hidden'}>${unread}</b></button><span><b>${user.name||'관리자'}</b><small>ADMIN</small></span><a href="/index.html">홈</a><button type="button" data-admin-logout>로그아웃</button></div>`;
  if(!document.querySelector('link[data-admin-header]')){const headerStyle=document.createElement('link');headerStyle.rel='stylesheet';headerStyle.href='/admin/admin-header.css?v=20260715-6';headerStyle.dataset.adminHeader='true';document.head.append(headerStyle)}
  top.innerHTML=`<button class="sidebar-toggle" type="button" aria-label="관리자 메뉴 열기" aria-controls="adminSidebar" aria-expanded="false">☰</button><div class="admin-top-spacer"></div><div class="admin-identity"><time class="admin-current-time" aria-label="현재 날짜와 시간"></time><button class="admin-notification-button" type="button" aria-label="관리자 알림, 읽지 않음 ${unread}개" aria-expanded="false"><span aria-hidden="true">♧</span><b ${unread?'':'hidden'}>${unread}</b></button><span class="admin-user-copy"><b>${user.name||'MOMO 관리자'}</b><small>ADMIN</small></span><button class="admin-header-logout" type="button" data-admin-logout>로그아웃</button></div>`;
  const updateHeaderClock=()=>{const clock=top.querySelector('.admin-current-time');if(clock)clock.textContent=new Intl.DateTimeFormat('ko-KR',{year:'numeric',month:'2-digit',day:'2-digit',weekday:'short',hour:'2-digit',minute:'2-digit'}).format(new Date())};updateHeaderClock();setInterval(updateHeaderClock,60000);
  const panel=document.createElement('section');panel.className='admin-notification-panel';panel.hidden=true;
  const toastRegion=document.createElement('div');toastRegion.className='admin-toast-region';toastRegion.setAttribute('aria-live','polite');toastRegion.setAttribute('aria-atomic','true');
  const modal=document.createElement('div');modal.className='admin-modal-backdrop';modal.hidden=true;modal.innerHTML='<section class="admin-modal" role="dialog" aria-modal="true" aria-labelledby="adminConfirmTitle"><h2 id="adminConfirmTitle">확인</h2><p data-confirm-message></p><div><button type="button" class="admin-button secondary" data-confirm-cancel>취소</button><button type="button" class="admin-button primary" data-confirm-ok>확인</button></div></section>';
  const renderNotices=()=>{const list=window.MomoAdminNotifications?.getAll()||[],unreadCount=list.filter(item=>!item.read).length;panel.innerHTML=`<header><div class="notification-heading"><small>ADMIN NOTIFICATIONS</small><strong>알림 센터</strong><span>${unreadCount?`확인하지 않은 알림 ${unreadCount}개`:'모든 알림을 확인했습니다.'}</span></div><div class="notification-actions"><button type="button" data-read-all>모두 읽음</button><button type="button" data-close-notifications aria-label="알림 센터 닫기">×</button></div></header><div class="notification-filters"><button type="button" data-filter="all" class="active">전체 <b>${list.length}</b></button><button type="button" data-filter="unread">읽지 않음 <b>${unreadCount}</b></button></div><div class="notification-list">${list.length?list.slice(0,20).map(n=>`<a href="${n.targetUrl||'#'}" data-id="${n.id}" class="notification-item type-${String(n.type||'SYSTEM').toLowerCase()} ${n.read?'':'unread'}"><i aria-hidden="true"></i><div><b>${n.title||'운영 알림'}</b><span>${n.message||''}</span><time>${formatDateTime(n.createdAt)}</time></div><em aria-hidden="true">›</em></a>`).join(''):'<div class="admin-empty compact"><strong>새 알림이 없습니다.</strong><span>처리할 알림이 생기면 여기에 표시됩니다.</span></div>'}</div>`};
  const formatNumber=value=>Math.max(0,Number(value)||0).toLocaleString('ko-KR'),formatMoney=value=>`${formatNumber(value)}원`,formatPoint=value=>`${formatNumber(value)}P`;
  function validDate(value){const date=new Date(value);return Number.isNaN(date.getTime())?null:date}
  function formatDate(value){const d=validDate(value);return d?`${d.getFullYear()}. ${String(d.getMonth()+1).padStart(2,'0')}. ${String(d.getDate()).padStart(2,'0')}.`:'-'}
  function formatDateTime(value){const d=validDate(value);return d?`${formatDate(d)} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`:'-'}
  function relativeTime(value){const d=validDate(value);if(!d)return'-';const minutes=Math.max(0,Math.floor((Date.now()-d.getTime())/60000));if(minutes<1)return'방금 전';if(minutes<60)return`${minutes}분 전`;const hours=Math.floor(minutes/60);if(hours<24)return`${hours}시간 전`;return`${Math.floor(hours/24)}일 전`}
  function toast(message,type='success'){const item=document.createElement('div');item.className=`admin-toast ${type}`;item.textContent=message;toastRegion.append(item);setTimeout(()=>item.remove(),2800)}
  let modalResolve=null,lastFocus=null;function closeModal(result){if(modal.hidden)return;modal.hidden=true;document.body.classList.remove('admin-modal-open');modalResolve?.(result);modalResolve=null;lastFocus?.focus?.()}
  function confirmDialog(message,title='변경 사항 확인'){lastFocus=document.activeElement;modal.querySelector('h2').textContent=title;modal.querySelector('[data-confirm-message]').textContent=message;modal.hidden=false;document.body.classList.add('admin-modal-open');modal.querySelector('[data-confirm-ok]').focus();return new Promise(resolve=>{modalResolve=resolve})}
  function empty(container,title,description='',actionHtml=''){container.innerHTML=`<div class="admin-empty"><strong>${title}</strong>${description?`<span>${description}</span>`:''}${actionHtml}</div>`}
  function loading(container,label='불러오는 중'){container.innerHTML=`<div class="admin-loading" role="status"><i></i><span>${label}</span></div>`}
  renderNotices();app.prepend(sidebar);app.insertBefore(top,app.querySelector('.admin-content'));document.body.append(panel,toastRegion,modal);
  document.querySelectorAll('input,select,textarea').forEach(control=>{if(control.type==='hidden'||control.getAttribute('aria-label')||control.getAttribute('aria-labelledby')||control.labels?.length)return;control.setAttribute('aria-label',control.placeholder||control.name||'입력 항목')});
  document.querySelectorAll('button').forEach(button=>{if(!button.getAttribute('aria-label')&&!button.textContent.trim())button.setAttribute('aria-label',button.title||'버튼')});
  document.querySelectorAll('[data-admin-logout]').forEach(button=>button.onclick=()=>{localStorage.removeItem('momoCurrentUser');location.replace('/auth/login.html')});
  const detailLinkSelector='a[href*="/admin/qna/detail"],a[href*="/admin/orders/detail"],a[href*="/admin/members/detail"],a[href*="/admin/menus/detail"]';
  const normalizeDetailLinks=root=>root.querySelectorAll?.(detailLinkSelector).forEach(link=>{
    const target=new URL(link.href,location.origin);
    const detailId=target.searchParams.get('id');
    if(!detailId)return;
    const section=target.hash==='#answer'?'&section=answer':'';
    link.href=`${target.pathname}#id=${encodeURIComponent(detailId)}${section}`;
  });
  normalizeDetailLinks(document);
  new MutationObserver(records=>records.forEach(record=>record.addedNodes.forEach(node=>{
    if(node.nodeType===1){normalizeDetailLinks(node);if(node.matches?.(detailLinkSelector))normalizeDetailLinks(node.parentElement)}
  }))).observe(document.body,{childList:true,subtree:true});
  document.addEventListener('click',event=>{
    const link=event.target.closest(detailLinkSelector);
    if(!link)return;
    const target=new URL(link.href,location.origin);
    const detailId=target.searchParams.get('id');
    if(!detailId)return;
    event.preventDefault();
    const section=target.hash==='#answer'?'&section=answer':'';
    location.href=`${target.pathname}#id=${encodeURIComponent(detailId)}${section}`;
  },true);
  const toggle=top.querySelector('.sidebar-toggle'),bell=top.querySelector('.admin-notification-button');toggle.onclick=()=>{const open=document.body.classList.toggle('admin-nav-open');toggle.setAttribute('aria-expanded',String(open))};bell.onclick=()=>{panel.hidden=!panel.hidden;bell.setAttribute('aria-expanded',String(!panel.hidden));if(!panel.hidden)renderNotices()};
  const updateNoticeBadge=()=>{const count=(MomoAdminNotifications?.getAll()||[]).filter(item=>!item.read).length,badge=bell.querySelector('b');badge.textContent=count;badge.hidden=count===0;bell.setAttribute('aria-label',`관리자 알림, 읽지 않음 ${count}개`)};
  panel.onclick=event=>{if(event.target.closest('[data-close-notifications]')){panel.hidden=true;bell.setAttribute('aria-expanded','false');bell.focus();return}if(event.target.closest('[data-read-all]')){MomoAdminNotifications?.markAllRead();renderNotices();updateNoticeBadge();return}const filter=event.target.closest('[data-filter]');if(filter){panel.querySelectorAll('[data-filter]').forEach(button=>button.classList.toggle('active',button===filter));panel.querySelectorAll('.notification-list a').forEach(link=>link.hidden=filter.dataset.filter==='unread'&&!link.classList.contains('unread'));return}const link=event.target.closest('[data-id]');if(link){MomoAdminNotifications?.markRead(link.dataset.id);link.classList.remove('unread');updateNoticeBadge()}};
  modal.querySelector('[data-confirm-cancel]').onclick=()=>closeModal(false);modal.querySelector('[data-confirm-ok]').onclick=()=>closeModal(true);modal.onclick=event=>{if(event.target===modal)closeModal(false)};
  document.addEventListener('keydown',event=>{if(event.key==='Escape'){if(!modal.hidden)closeModal(false);else{document.body.classList.remove('admin-nav-open');panel.hidden=true;toggle.setAttribute('aria-expanded','false');bell.setAttribute('aria-expanded','false')}}});
  window.addEventListener('load',()=>{if(location.hash==='#answer')document.querySelector('#answer')?.scrollIntoView({block:'start'})});
  window.MomoAdmin={user,read,requireAdmin:()=>{if(user.role!=='ADMIN')throw Error('관리자 권한이 필요합니다.')},formatMoney,formatPoint,formatDate,formatDateTime,relativeTime,toast,confirm:confirmDialog,empty,loading};
})();
