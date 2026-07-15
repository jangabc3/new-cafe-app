(() => {
  'use strict';
  if (!window.MomoAdmin || !window.MomoRewards) return;
  const admin = MomoAdmin.user;
  if (!admin || admin.role !== 'ADMIN') return;

  const $ = (selector, root=document) => root.querySelector(selector);
  const $$ = (selector, root=document) => [...root.querySelectorAll(selector)];
  const read = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } };
  const write = (key, value) => localStorage.setItem(key, JSON.stringify(value));
  const esc = (value='') => String(value).replace(/[&<>'"]/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));
  const usersValue = read('momoUsers', []);
  const users = (Array.isArray(usersValue) ? usersValue : usersValue.users || []).filter(user => user.role !== 'ADMIN');
  const userId = user => user?.id ?? user?.email;
  const findUser = id => users.find(user => String(userId(user)) === String(id) || String(user.email) === String(id));
  const localDay = value => { const date=new Date(value); return Number.isNaN(date.getTime()) ? '' : `${date.getFullYear()}-${date.getMonth()+1}-${date.getDate()}`; };
  const formatDate = value => { const date=new Date(value); return Number.isNaN(date.getTime()) ? '-' : new Intl.DateTimeFormat('ko-KR',{year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'}).format(date); };
  const today = localDay(new Date());
  const defaultTemplates = [
    {id:'FIXED_1000',name:'1,000원 할인',discountType:'FIXED',discountValue:1000},
    {id:'AMERICANO_FREE',name:'아메리카노 무료',discountType:'BENEFIT',discountValue:4500},
    {id:'DESSERT_FREE',name:'디저트 무료',discountType:'BENEFIT',discountValue:6500},
    {id:'PERCENT_10',name:'10% 할인',discountType:'PERCENT',discountValue:10,maximumDiscount:5000},
    {id:'SEASON',name:'시즌 쿠폰',discountType:'FIXED',discountValue:3000}
  ];
  if (!localStorage.getItem('momoCouponTemplates')) write('momoCouponTemplates', defaultTemplates);

  let pointMode='EARN', selectedPointMember=null, selectedCouponMember=null, page=1, filteredRows=[], activeDrawer=null, toastTimer;
  const pointForm=$('#rewardPointForm'), couponForm=$('#rewardCouponForm');

  const showToast = message => { const toast=$('#rewardToast'); toast.textContent=message; toast.classList.add('is-visible'); clearTimeout(toastTimer); toastTimer=setTimeout(()=>toast.classList.remove('is-visible'),2600); };
  const pointHistory = () => MomoRewards.getPointHistory().filter(Boolean);
  const coupons = () => MomoRewards.getCoupons().filter(Boolean);

  function renderStats() {
    const history=pointHistory(), allCoupons=coupons();
    const totalPoints=users.reduce((sum,user)=>sum+Math.max(0,Number(MomoRewards.getPoints(user))||0),0);
    const usedToday=history.filter(item=>item.type==='DEDUCT'&&localDay(item.createdAt)===today).reduce((sum,item)=>sum+(Number(item.amount)||0),0);
    const earnMembers=new Set(history.filter(item=>item.type==='EARN').map(item=>String(item.userId))).size;
    const issuedToday=allCoupons.filter(item=>localDay(item.issuedAt)===today).length;
    const cards=[
      ['P','보유 포인트',`${totalPoints.toLocaleString()}P`,'전체 회원 현재 잔액'],
      ['−','오늘 사용 포인트',`${usedToday.toLocaleString()}P`,'결제·관리자 차감'],
      ['♙','적립 회원 수',`${earnMembers.toLocaleString()}명`,'적립 이력이 있는 회원'],
      ['▱','발행 쿠폰 수',`${allCoupons.length.toLocaleString()}장`,`오늘 ${issuedToday.toLocaleString()}장`]
    ];
    $('#rewardStats').innerHTML=cards.map(([icon,label,value,desc])=>`<article class="reward-stat"><span class="reward-stat-icon" aria-hidden="true">${icon}</span><div><small>${label}</small><strong>${value}</strong><small>${desc}</small></div></article>`).join('');
  }

  function setupMemberSearch(inputId, resultsId, cardId, onSelect) {
    const input=$(inputId), results=$(resultsId), card=$(cardId);
    const close=()=>{results.hidden=true;results.innerHTML=''};
    const render=()=>{const term=input.value.trim().toLowerCase();if(!term){close();return}const matches=users.filter(user=>`${user.name||''} ${user.email||''} ${user.phone||user.tel||''}`.toLowerCase().includes(term)).slice(0,7);results.innerHTML=matches.length?matches.map(user=>`<button type="button" data-user-id="${esc(userId(user))}"><span><strong>${esc(user.name||'이름 없음')}</strong><small>${esc(user.email||user.phone||'-')}</small></span><small>${MomoRewards.getPoints(user).toLocaleString()}P</small></button>`).join(''):'<p>검색 결과가 없습니다.</p>';results.hidden=false};
    input.addEventListener('input',render); input.addEventListener('focus',render);
    results.addEventListener('click',event=>{const button=event.target.closest('[data-user-id]');if(!button)return;const user=findUser(button.dataset.userId);onSelect(user);input.value=`${user.name||''} · ${user.email||''}`;card.innerHTML=`<span><strong>${esc(user.name||'이름 없음')}</strong><small>${esc(user.email||user.phone||'-')}</small></span><span><small>현재 포인트</small><b>${MomoRewards.getPoints(user).toLocaleString()}P</b></span>`;card.hidden=false;close()});
    document.addEventListener('click',event=>{if(event.target!==input&&!results.contains(event.target))close()});
  }

  function templates(){const value=read('momoCouponTemplates',defaultTemplates);return Array.isArray(value)&&value.length?value:defaultTemplates;}
  function renderTemplateSelect(){const select=$('#couponTemplate'),current=select.value;select.innerHTML='<option value="">쿠폰을 선택해 주세요</option>'+templates().map(item=>`<option value="${esc(item.id)}">${esc(item.name)}</option>`).join('');if([...select.options].some(option=>option.value===current))select.value=current;}

  const legacyModeTabs=$('.mode-tabs');
  if(legacyModeTabs){
    const modeField=document.createElement('label');
    modeField.className='field point-mode-field';
    modeField.innerHTML='<span>처리 유형</span><select id="pointMode" aria-label="포인트 처리 유형"><option value="EARN">포인트 적립</option><option value="DEDUCT">포인트 차감</option></select>';
    legacyModeTabs.before(modeField);
    modeField.querySelector('select').addEventListener('change',event=>{pointMode=event.target.value;$('#pointSubmit').textContent=pointMode==='EARN'?'포인트 적립':'포인트 차감'});
  }
  $$('.quick-points [data-points]').forEach(button=>button.addEventListener('click',()=>{pointForm.amount.value=button.dataset.points;pointForm.amount.focus()}));
  setupMemberSearch('#pointMemberSearch','#pointMemberResults','#pointMemberCard',user=>selectedPointMember=user);
  setupMemberSearch('#couponMemberSearch','#couponMemberResults','#couponMemberCard',user=>selectedCouponMember=user);

  pointForm.addEventListener('submit',async event=>{event.preventDefault();if(!selectedPointMember){showToast('처리할 회원을 먼저 선택해 주세요.');return}if(!pointForm.reportValidity())return;const amount=Number(pointForm.amount.value),reason=pointForm.reason.value.trim(),verb=pointMode==='EARN'?'적립':'차감';if(pointMode==='DEDUCT'){const ok=window.MomoAdmin.confirm?await MomoAdmin.confirm(`${selectedPointMember.name} 회원의 포인트 ${amount.toLocaleString()}P를 차감할까요?`,'포인트 차감'):confirm('포인트를 차감할까요?');if(!ok)return}try{pointMode==='EARN'?MomoRewards.grantPoints(userId(selectedPointMember),amount,reason,admin):MomoRewards.deductPoints(userId(selectedPointMember),amount,reason,admin);showToast(`포인트가 ${verb}되었습니다.`);pointForm.amount.value='';pointForm.reason.value='';$('#pointMemberCard').innerHTML=`<span><strong>${esc(selectedPointMember.name)}</strong><small>${esc(selectedPointMember.email)}</small></span><span><small>현재 포인트</small><b>${MomoRewards.getPoints(MomoRewards.getUser(userId(selectedPointMember))).toLocaleString()}P</b></span>`;refresh()}catch(error){showToast(error.message)}});

  couponForm.addEventListener('submit',async event=>{event.preventDefault();if(!selectedCouponMember){showToast('쿠폰을 받을 회원을 먼저 선택해 주세요.');return}if(!couponForm.reportValidity())return;const template=templates().find(item=>item.id===couponForm.template.value),quantity=Number(couponForm.quantity.value),reason=couponForm.reason.value.trim();if(!template){showToast('발행할 쿠폰을 선택해 주세요.');return}const ok=window.MomoAdmin.confirm?await MomoAdmin.confirm(`${selectedCouponMember.name} 회원에게 ${template.name} ${quantity}장을 발행할까요?`,'쿠폰 발행'):confirm('쿠폰을 발행할까요?');if(!ok)return;try{const expiresAt=new Date(`${couponForm.expiresAt.value}T23:59:59`).toISOString();for(let count=0;count<quantity;count++)MomoRewards.issueCoupon(userId(selectedCouponMember),{...template,couponId:template.id,title:template.name,description:template.name,expiresAt},reason,admin);showToast('쿠폰이 발행되었습니다.');couponForm.reason.value='';couponForm.quantity.value='1';refresh()}catch(error){showToast(error.message)}});

  function entries(){
    const points=pointHistory().map(item=>({id:item.id,type:item.type==='EARN'?'POINT_EARN':'POINT_DEDUCT',date:item.createdAt,userId:item.userId,title:item.reason||'포인트 처리',value:`${item.type==='EARN'?'+':'-'} ${(Number(item.amount)||0).toLocaleString()}P`,reason:item.reason,admin:item.adminName||'관리자',status:'완료',before:item.balanceBefore,after:item.balanceAfter}));
    const couponRows=coupons().flatMap(item=>[
      {id:`${item.id}:issue`,type:'COUPON_ISSUE',date:item.issuedAt,userId:item.userId,title:item.title||item.name||'쿠폰 발행',value:item.title||item.name||'쿠폰',reason:item.issuedReason,admin:item.adminName||'관리자',status:item.revoked?'회수':item.used?'사용 완료':'사용 가능',coupon:item},
      ...(item.usedAt?[{id:`${item.id}:used`,type:'COUPON_USE',date:item.usedAt,userId:item.userId,title:'쿠폰 사용',value:item.title||item.name||'쿠폰',reason:item.usedOrderId?`주문 ${item.usedOrderId}`:'쿠폰 사용',admin:'고객',status:'완료',coupon:item}]:[]),
      ...(item.revokedAt?[{id:`${item.id}:revoke`,type:'COUPON_REVOKE',date:item.revokedAt,userId:item.userId,title:'쿠폰 회수',value:item.title||item.name||'쿠폰',reason:item.revokedReason,admin:item.adminName||'관리자',status:'완료',coupon:item}]:[])
    ]);
    return [...points,...couponRows];
  }
  const labels={POINT_EARN:'포인트 적립',POINT_DEDUCT:'포인트 차감',COUPON_ISSUE:'쿠폰 발행',COUPON_USE:'쿠폰 사용',COUPON_REVOKE:'쿠폰 회수'};
  const classes={POINT_EARN:'earn',POINT_DEDUCT:'deduct',COUPON_ISSUE:'coupon',COUPON_USE:'used',COUPON_REVOKE:'deduct'};
  function applyFilters(){const term=$('#rewardSearch').value.trim().toLowerCase(),type=$('#typeFilter').value,period=$('#periodFilter').value;let rows=entries().filter(item=>{const user=findUser(item.userId)||{};const haystack=`${user.name||''} ${user.email||''} ${item.title||''} ${item.reason||''} ${item.value||''}`.toLowerCase();if(type&&item.type!==type)return false;if(term&&!haystack.includes(term))return false;if(period==='today'&&localDay(item.date)!==today)return false;if(!['','all','today'].includes(period)){const after=new Date();after.setDate(after.getDate()-Number(period)+1);after.setHours(0,0,0,0);if(new Date(item.date)<after)return false}return true});rows.sort((a,b)=>($('#sortFilter').value==='asc'?1:-1)*(new Date(a.date)-new Date(b.date)));return rows;}
  function renderHistory(){filteredRows=applyFilters();const size=Number($('#pageSize').value),pages=Math.max(1,Math.ceil(filteredRows.length/size));page=Math.min(page,pages);const visible=filteredRows.slice((page-1)*size,page*size);$('#rewardRows').innerHTML=visible.map(item=>{const user=findUser(item.userId)||{};return`<tr><td><span class="type-badge ${classes[item.type]}">${labels[item.type]}</span></td><td><strong>${esc(user.name||'탈퇴 회원')}</strong><small>${esc(user.email||item.userId||'-')}</small></td><td><strong>${esc(item.title)}</strong><small>${esc(item.reason||'-')}</small></td><td><strong>${esc(item.value)}</strong></td><td><span class="status-badge">${esc(item.status)}</span></td><td>${esc(item.admin)}</td><td>${formatDate(item.date)}</td><td><button class="detail-button" type="button" data-entry-id="${esc(item.id)}" aria-label="처리 상세 보기">···</button></td></tr>`}).join('');$('#rewardEmpty').hidden=filteredRows.length>0;$('#rewardCount').textContent=`총 ${filteredRows.length.toLocaleString()}건`;$('#rewardPagination').innerHTML=Array.from({length:pages},(_,index)=>`<button type="button" data-page="${index+1}" ${page===index+1?'aria-current="page"':''}>${index+1}</button>`).join('')}
  function refresh(){renderStats();renderHistory()}
  ['#typeFilter','#periodFilter','#sortFilter','#rewardSearch','#pageSize'].forEach(selector=>$(selector).addEventListener('input',()=>{page=1;renderHistory()}));
  $('#rewardPagination').addEventListener('click',event=>{const button=event.target.closest('[data-page]');if(button){page=Number(button.dataset.page);renderHistory()}});
  $('#rewardRows').addEventListener('click',event=>{const button=event.target.closest('[data-entry-id]');if(!button)return;const item=entries().find(entry=>entry.id===button.dataset.entryId);if(!item)return;activeDrawer=button;const user=findUser(item.userId)||{};const details=[['유형',labels[item.type]],['회원',`${user.name||'탈퇴 회원'} · ${user.email||item.userId||'-'}`],['처리 내용',item.title],['포인트 / 쿠폰',item.value],['상태',item.status],['처리자',item.admin],['처리 사유',item.reason||'-'],...(item.before!=null?[['변경 전 포인트',`${Number(item.before).toLocaleString()}P`],['변경 후 포인트',`${Number(item.after).toLocaleString()}P`]]:[]),...(item.coupon?.expiresAt?[['유효기간',formatDate(item.coupon.expiresAt)]]:[]),['처리 시간',formatDate(item.date)]];$('#drawerContent').innerHTML=`<dl class="detail-list">${details.map(([key,value])=>`<div><dt>${esc(key)}</dt><dd>${esc(value)}</dd></div>`).join('')}</dl>`;$('#rewardDrawer').classList.add('is-open');$('#rewardDrawer').setAttribute('aria-hidden','false')});
  $$('[data-close-drawer]').forEach(button=>button.addEventListener('click',()=>{$('#rewardDrawer').classList.remove('is-open');$('#rewardDrawer').setAttribute('aria-hidden','true');activeDrawer?.focus()}));
  document.addEventListener('keydown',event=>{if(event.key==='Escape'){$('#rewardDrawer').classList.remove('is-open');$('#couponModal').hidden=true}});
  $('#exportRewards').addEventListener('click',()=>{const rows=[['유형','회원','이메일','처리 내용','포인트/쿠폰','상태','처리자','처리 시간'],...filteredRows.map(item=>{const user=findUser(item.userId)||{};return[labels[item.type],user.name||'탈퇴 회원',user.email||'',item.title,item.value,item.status,item.admin,formatDate(item.date)]})];const csv='\uFEFF'+rows.map(row=>row.map(value=>`"${String(value??'').replaceAll('"','""')}"`).join(',')).join('\r\n');const link=document.createElement('a');link.href=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));link.download=`momo-rewards-${today}.csv`;link.click();URL.revokeObjectURL(link.href);showToast('리워드 내역을 다운로드했습니다.')});

  function renderTemplateManager(){const list=$('#couponTemplateList');list.innerHTML=templates().map(item=>`<article class="template-item"><div><strong>${esc(item.name)}</strong><small>${item.discountType} · ${Number(item.discountValue).toLocaleString()}</small></div><div><button type="button" data-edit-template="${esc(item.id)}">수정</button> <button type="button" data-delete-template="${esc(item.id)}">삭제</button></div></article>`).join('')}
  $('#couponManageButton').addEventListener('click',()=>{$('#couponModal').hidden=false;renderTemplateManager();$('#couponTemplateForm').reset()});
  $('[data-close-coupon]').addEventListener('click',()=>$('#couponModal').hidden=true);
  $('#couponTemplateForm').addEventListener('submit',event=>{event.preventDefault();const form=event.currentTarget,data=new FormData(form),list=templates(),existing=data.get('id'),item={id:existing||`CUSTOM_${Date.now()}`,name:data.get('name').trim(),discountType:data.get('discountType'),discountValue:Number(data.get('discountValue'))};const index=list.findIndex(template=>template.id===existing);if(index>=0)list[index]={...list[index],...item};else list.push(item);write('momoCouponTemplates',list);form.reset();renderTemplateManager();renderTemplateSelect();showToast('쿠폰 종류가 저장되었습니다.')});
  $('#couponTemplateList').addEventListener('click',async event=>{const edit=event.target.closest('[data-edit-template]'),remove=event.target.closest('[data-delete-template]'),list=templates();if(edit){const item=list.find(template=>template.id===edit.dataset.editTemplate),form=$('#couponTemplateForm');form.elements.id.value=item.id;form.elements.name.value=item.name;form.elements.discountType.value=item.discountType;form.elements.discountValue.value=item.discountValue}if(remove){const ok=window.MomoAdmin.confirm?await MomoAdmin.confirm('이 쿠폰 종류를 삭제할까요? 이미 발행된 쿠폰은 유지됩니다.','쿠폰 종류 삭제'):confirm('삭제할까요?');if(!ok)return;write('momoCouponTemplates',list.filter(item=>item.id!==remove.dataset.deleteTemplate));renderTemplateManager();renderTemplateSelect();showToast('쿠폰 종류가 삭제되었습니다.')}});

  const tomorrow=new Date();tomorrow.setDate(tomorrow.getDate()+30);couponForm.expiresAt.value=tomorrow.toISOString().slice(0,10);renderTemplateSelect();refresh();
})();
