(() => {
  const KEY = 'momoInquiries';
  const categories = { MENU:'메뉴', ORDER:'주문', PAYMENT:'결제', COUPON:'쿠폰', MEMBERSHIP:'멤버십', STORE:'매장', ETC:'기타' };
  const read = () => { try { const value=JSON.parse(localStorage.getItem(KEY)||'[]'); return Array.isArray(value)?value:[]; } catch { return []; } };
  const save = (items) => { if(!Array.isArray(items)) throw new Error('문의 데이터가 올바르지 않습니다.'); localStorage.setItem(KEY,JSON.stringify(items)); return items; };
  const id = () => `QNA-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,7)}`.toUpperCase();
  const admin = (u) => u?.role === 'ADMIN';
  const sameUser = (a,b) => String(a) === String(b);
  const validate = (p) => { if(!categories[p.category]) throw new Error('문의 유형을 선택해주세요.'); const title=String(p.title||'').trim(),content=String(p.content||'').trim(); if(!title||title.length>100) throw new Error('제목은 1자 이상 100자 이하로 입력해주세요.'); if(content.length<10||content.length>2000) throw new Error('내용은 10자 이상 2,000자 이하로 입력해주세요.'); return {...p,title,content,isPrivate:Boolean(p.isPrivate)}; };
  const api = {
    categories, getInquiries:read, saveInquiries:save, generateInquiryId:id, isAdmin:admin,
    getInquiryById(qid){return read().find(x=>String(x.id)===String(qid))||null},
    getMyInquiries(uid){return read().filter(x=>sameUser(x.userId,uid))},
    createInquiry(payload,user){if(!user)throw new Error('로그인이 필요합니다.'); const p=validate(payload),now=new Date().toISOString(); const item={id:id(),userId:user.id??user.email,userEmail:user.email||'',userName:user.name||'',category:p.category,title:p.title,content:p.content,isPrivate:p.isPrivate,status:'PENDING',createdAt:now,updatedAt:null,answer:null}; const all=read();all.push(item);save(all);return item},
    updateInquiry(qid,uid,payload){const all=read(),item=all.find(x=>String(x.id)===String(qid));if(!item||!sameUser(item.userId,uid)||item.status!=='PENDING')throw new Error('수정 권한이 없습니다.');Object.assign(item,validate(payload),{updatedAt:new Date().toISOString()});save(all);return item},
    deleteInquiry(qid,uid){const all=read(),i=all.findIndex(x=>String(x.id)===String(qid));if(i<0||!sameUser(all[i].userId,uid)||all[i].status!=='PENDING')throw new Error('삭제 권한이 없습니다.');all.splice(i,1);save(all);return true},
    createAnswer(qid,u,content){if(!admin(u))throw new Error('관리자 권한이 필요합니다.');const all=read(),item=all.find(x=>String(x.id)===String(qid)),text=String(content||'').trim();if(!item||item.answer)throw new Error('답변을 등록할 수 없습니다.');if(text.length<10||text.length>2000)throw new Error('답변은 10자 이상 2,000자 이하로 입력해주세요.');item.answer={id:id(),content:text,adminId:u.id??u.email,adminName:u.name||'관리자',createdAt:new Date().toISOString(),updatedAt:null};item.status='ANSWERED';save(all);return item},
    updateAnswer(qid,u,content){if(!admin(u))throw new Error('관리자 권한이 필요합니다.');const all=read(),item=all.find(x=>String(x.id)===String(qid)),text=String(content||'').trim();if(!item?.answer)throw new Error('답변이 없습니다.');if(text.length<10||text.length>2000)throw new Error('답변은 10자 이상 2,000자 이하로 입력해주세요.');item.answer.content=text;item.answer.updatedAt=new Date().toISOString();item.answer.adminId=u.id??u.email;item.answer.adminName=u.name||'관리자';save(all);return item},
    deleteAnswer(qid,u){if(!admin(u))throw new Error('관리자 권한이 필요합니다.');const all=read(),item=all.find(x=>String(x.id)===String(qid));if(!item?.answer)throw new Error('답변이 없습니다.');item.answer=null;item.status='PENDING';save(all);return item},
    getInquiryStatusLabel:s=>s==='ANSWERED'?'답변 완료':'답변 대기', getInquiryCategoryLabel:c=>categories[c]||c,
    canEditInquiry:(q,u)=>Boolean(q&&u&&sameUser(q.userId,u.id??u.email)&&q.status==='PENDING'), canViewInquiry:(q,u)=>Boolean(q&&u&&(admin(u)||sameUser(q.userId,u.id??u.email)))
  }; window.MomoQna=api;
})();
