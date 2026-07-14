(() => {
  const user = JSON.parse(localStorage.getItem('momoCurrentUser') || 'null');
  const qna = window.MomoQna;
  const routeId = new URLSearchParams(location.search).get('id') || new URLSearchParams(location.hash.slice(1)).get('id');
  const item = qna.getInquiryById(routeId);
  const escape = (value) => String(value).replace(/[&<>"']/g, (character) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[character]));
  const date = (value) => value ? new Date(value).toLocaleString('ko-KR') : '-';

  if (!qna.canViewInquiry(item, user)) {
    detailArea.innerHTML = '<section class="panel error">문의에 접근할 수 없습니다. 목록으로 이동합니다.</section>';
    setTimeout(() => location.replace('/qna/list.html'), 1200);
    return;
  }

  const answer = item.answer ? `
    <section class="answer-card">
      <span class="badge answered">답변 완료</span><h2>관리자 답변</h2>
      <div class="meta"><span>${escape(item.answer.adminName)}</span><time>${date(item.answer.createdAt)}</time>${item.answer.updatedAt ? `<span>수정 ${date(item.answer.updatedAt)}</span>` : ''}</div>
      <div class="content">${escape(item.answer.content)}</div>
    </section>` : '<section class="answer-card"><h2>답변을 준비하고 있습니다.</h2><p>확인 후 빠르게 안내해드릴게요.</p></section>';

  detailArea.innerHTML = `
    <header class="qna-head"><p class="eyebrow">MOMO Q&amp;A</p><h1>${escape(item.title)}</h1></header>
    <section class="detail-card">
      <span class="badge ${item.status === 'ANSWERED' ? 'answered' : ''}">${qna.getInquiryStatusLabel(item.status)}</span>
      <div class="meta"><span>${escape(item.id)}</span><span>${qna.getInquiryCategoryLabel(item.category)}</span><span>${escape(item.userName)}</span><time>${date(item.createdAt)}</time>${item.isPrivate ? '<span>비공개 문의</span>' : ''}${item.updatedAt ? `<span>수정 ${date(item.updatedAt)}</span>` : ''}</div>
      <div class="content">${escape(item.content)}</div>
      ${qna.canEditInquiry(item, user) ? `<div class="actions"><a class="btn" href="/qna/edit.html#id=${encodeURIComponent(item.id)}">문의 수정</a><button class="btn secondary" id="deleteButton">문의 삭제</button></div>` : ''}
    </section>${answer}<div class="actions"><a class="btn secondary" href="/qna/list.html">목록</a></div>`;

  document.querySelector('#deleteButton')?.addEventListener('click', () => {
    if (!confirm('작성한 문의를 삭제할까요?\n삭제한 문의는 복구할 수 없습니다.')) return;
    qna.deleteInquiry(item.id, user);
    sessionStorage.setItem('momoQnaToast', '문의가 삭제되었습니다.');
    location.replace('/qna/list.html');
  });
})();

(() => {
  const message = sessionStorage.getItem('momoQnaToast');
  const toast = document.querySelector('#toast');
  if (message && toast) {
    sessionStorage.removeItem('momoQnaToast');
    toast.textContent = message;
    toast.hidden = false;
    setTimeout(() => { toast.hidden = true; }, 3000);
  }
})();
