(() => {
  if (window.MomoAdminNotifications) return;
  const KEY='momoAdminNotifications';
  const watchedKeys=['momo_coffee_orders_v1','momoInquiries','momoUsers','momoMenuAvailability','momoRewardTransactions'];
  const parse=(key,fallback=[])=>{try{return JSON.parse(localStorage.getItem(key))??fallback}catch{return fallback}};
  const getAll=()=>{const value=parse(KEY,[]);return Array.isArray(value)?value:[]};
  const save=value=>localStorage.setItem(KEY,JSON.stringify(value));
  function sync(){
    const existing=getAll(), seen=new Set(existing.map(item=>item.eventKey)), created=[];
    const push=(eventKey,type,title,message,targetUrl,entityId,createdAt)=>{if(seen.has(eventKey)||!createdAt||Number.isNaN(new Date(createdAt).getTime()))return;seen.add(eventKey);created.push({id:`NOTICE-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`,eventKey,type,title,message,targetUrl,entityId:entityId??null,createdAt,read:false,readAt:null})};
    parse('momo_coffee_orders_v1',[]).forEach(order=>{if(!order)return;push(`order:${order.id}`,'ORDER','새 주문',`${order.orderNumber||order.id} 주문이 접수되었습니다.`,`/admin/orders/detail.html?id=${encodeURIComponent(order.id)}`,order.id,order.createdAt);if(String(order.status).toUpperCase()==='READY')push(`order-ready:${order.id}`,'ORDER','제조 완료',`${order.orderNumber||order.id} 메뉴 준비가 완료되었습니다.`,`/admin/orders/detail.html?id=${encodeURIComponent(order.id)}`,order.id,order.updatedAt||order.createdAt)});
    parse('momoInquiries',[]).forEach(q=>{if(!q)return;push(`qna:${q.id}`,'QNA','새 1:1 문의',q.title||'새 문의가 등록되었습니다.',`/admin/qna/detail.html?id=${encodeURIComponent(q.id)}`,q.id,q.createdAt);if(q.status==='PENDING'&&Date.now()-new Date(q.createdAt).getTime()>=86400000)push(`qna-overdue:${q.id}`,'QNA','답변 지연 문의','24시간 이상 답변을 기다리는 문의가 있습니다.',`/admin/qna/detail.html?id=${encodeURIComponent(q.id)}`,q.id,q.createdAt)});
    const rawUsers=parse('momoUsers',[]), users=Array.isArray(rawUsers)?rawUsers:(rawUsers.users||[]);users.filter(u=>u&&u.role!=='ADMIN').forEach(u=>push(`member:${u.id||u.email}`,'MEMBER','신규 회원 가입',`${u.name||u.email||'고객'} 회원이 가입했습니다.`,`/admin/members/detail.html?id=${encodeURIComponent(u.id||u.email)}`,u.id||u.email,u.createdAt||u.joinedAt));
    const merged=[...created,...existing].sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));save(merged);return merged;
  }
  function markRead(id){const list=getAll(),item=list.find(x=>x.id===id);if(item&&!item.read){item.read=true;item.readAt=new Date().toISOString();save(list)}return item}
  function markAllRead(){const now=new Date().toISOString(),list=getAll().map(item=>({...item,read:true,readAt:item.readAt||now}));save(list);return list}
  window.MomoAdminNotifications={KEY,watchedKeys,getAll,sync,markRead,markAllRead};
})();
