(() => {
  if (!window.MomoAdmin || !window.MomoAdminAnalytics) return;
  const $=id=>document.getElementById(id), date=v=>{const d=new Date(v);return Number.isNaN(d.getTime())?null:d}, state=v=>String(v||'RECEIVED').toUpperCase();
  function render(){
    const a=MomoAdminAnalytics,orders=a.orders(),q=a.get('momoInquiries',[])||[],raw=a.get('momoUsers',[]),users=Array.isArray(raw)?raw:(raw?.users||[]),points=a.get('momoPointHistory',[])||[];
    const menus=typeof getMenus==='function'?getMenus():(a.get('momo_coffee_menus_v6',[])||[]),settings=MomoAdminSettings?.get()||{storeOpen:true},now=Date.now();
    $('opsClock').textContent=`${new Date().toLocaleString('ko-KR')} · ${settings.maintenanceMode?'점검 중':settings.orderEnabled===false?'주문 일시 중지':settings.storeOpen?'영업 중':'영업 종료'}`;
    const summary=[['주문 접수',orders.filter(o=>state(o.status)==='RECEIVED').length,'/admin/orders/list.html'],['제조 중',orders.filter(o=>state(o.status)==='PREPARING').length,'/admin/orders/list.html'],['픽업 대기',orders.filter(o=>state(o.status)==='READY').length,'/admin/orders/list.html'],['답변 대기 문의',q.filter(x=>x?.status==='PENDING').length,'/admin/qna/list.html'],['품절 메뉴',menus.filter(m=>m?.isSoldOut||m?.soldOut).length,'/admin/menus/list.html']];
    $('opsSummary').innerHTML=summary.map(([l,v,u])=>`<a href="${u}"><strong>${v}</strong><span>${l}</span><small>관련 업무 보기 →</small></a>`).join('');
    const urgent=[['15분 이상 제조 중',orders.filter(o=>state(o.status)==='PREPARING'&&date(o.updatedAt||o.createdAt)&&now-date(o.updatedAt||o.createdAt).getTime()>=900000).length,'/admin/orders/list.html'],['24시간 이상 답변 대기',q.filter(x=>x?.status==='PENDING'&&date(x.createdAt)&&now-date(x.createdAt).getTime()>=86400000).length,'/admin/qna/list.html'],['현재 품절 메뉴',menus.filter(m=>m?.isSoldOut||m?.soldOut).length,'/admin/menus/list.html']];
    $('urgentCards').innerHTML=urgent.map(([l,v,u])=>`<a class="urgent" href="${u}"><span>확인 필요</span><strong>${v}건</strong><p>${l}</p></a>`).join('');
    const events=[...orders.map(o=>({at:o.updatedAt||o.createdAt,type:'주문',text:`${o.orderNumber||o.id||'주문'} · ${state(o.status)}`})),...q.map(x=>({at:x.answer?.updatedAt||x.answer?.createdAt||x.createdAt,type:'문의',text:x.title||'1:1 문의'})),...users.filter(u=>u?.role!=='ADMIN').map(u=>({at:u.createdAt||u.joinedAt,type:'회원',text:`${u.name||u.email||'회원'} 가입`})),...points.map(h=>({at:h.createdAt,type:'리워드',text:`${Math.abs(Number(h.amount)||0).toLocaleString('ko-KR')}P ${h.type==='EARN'?'적립':'사용·차감'}`}))].filter(e=>date(e.at)).sort((x,y)=>date(y.at)-date(x.at)).slice(0,15);
    $('opsTimeline').innerHTML=events.length?events.map(e=>`<article class="timeline-row"><b>${e.type}</b><span>${e.text}</span><time>${date(e.at).toLocaleString('ko-KR')}</time></article>`).join(''):'<p class="ops-empty">아직 표시할 운영 활동이 없습니다.</p>';
    $('opsUpdated').textContent=`마지막 업데이트 ${new Date().toLocaleTimeString('ko-KR')}`;MomoAdminNotifications?.sync();
  }
  $('opsRefresh')?.addEventListener('click',render);window.addEventListener('storage',render);window.addEventListener('momo-admin-data-changed',render);setInterval(render,30000);render();
})();
