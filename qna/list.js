(() => {
  const user = JSON.parse(localStorage.getItem('momoCurrentUser') || 'null');
  const qna = window.MomoQna;
  const perPage = 5;
  let status = 'ALL';
  let page = 1;

  const categoryFilter = document.querySelector('#categoryFilter');
  const searchInput = document.querySelector('#searchInput');
  const listArea = document.querySelector('#listArea');
  const pagination = document.querySelector('#pagination');
  const escape = (value) => String(value).replace(/[&<>"']/g, (character) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[character]));

  Object.entries(qna.categories).forEach(([value, label]) => categoryFilter.add(new Option(label, value)));

  const render = () => {
    const all = qna.getMyInquiries(user).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    document.querySelector('#totalCount').textContent = all.length;
    document.querySelector('#pendingCount').textContent = all.filter((item) => item.status === 'PENDING').length;
    document.querySelector('#answeredCount').textContent = all.filter((item) => item.status === 'ANSWERED').length;
    document.querySelector('#privateCount').textContent = all.filter((item) => item.isPrivate).length;

    const term = searchInput.value.trim().toLowerCase();
    const filtered = all.filter((item) => {
      const matchesStatus = status === 'ALL' || (status === 'PRIVATE' ? item.isPrivate : item.status === status);
      const matchesCategory = !categoryFilter.value || item.category === categoryFilter.value;
      const matchesSearch = !term || `${item.title} ${item.content}`.toLowerCase().includes(term);
      return matchesStatus && matchesCategory && matchesSearch;
    });
    const pages = Math.max(1, Math.ceil(filtered.length / perPage));
    page = Math.min(page, pages);
    const rows = filtered.slice((page - 1) * perPage, page * perPage);

    listArea.innerHTML = rows.length ? `
      <table class="qna-table">
        <thead><tr><th>문의번호</th><th>유형</th><th>제목</th><th>작성일</th><th>상태</th><th aria-label="상세 보기"></th></tr></thead>
        <tbody>${rows.map((item) => `
          <tr>
            <td data-label="문의번호">${escape(item.id)}</td>
            <td data-label="유형"><span class="category-badge category-${item.category}">${qna.getInquiryCategoryLabel(item.category)}</span></td>
            <td data-label="제목"><a href="/qna/detail.html#id=${encodeURIComponent(item.id)}">${escape(item.title)}</a>${item.isPrivate ? '<span class="private-mark" title="비공개 문의">⌑ 비공개</span>' : ''}</td>
            <td data-label="작성일">${new Date(item.createdAt).toLocaleDateString('ko-KR')}</td>
            <td data-label="상태"><span class="badge ${item.status === 'ANSWERED' ? 'answered' : ''}">${qna.getInquiryStatusLabel(item.status)}</span></td>
            <td data-label="상세"><a class="detail-arrow" href="/qna/detail.html#id=${encodeURIComponent(item.id)}" aria-label="${escape(item.title)} 상세 보기">›</a></td>
          </tr>`).join('')}</tbody>
      </table>` : '<div class="empty"><p>아직 등록한 문의가 없습니다.</p><a class="button button--primary" href="/qna/create.html">문의 작성하기</a></div>';

    pagination.innerHTML = `<button ${page === 1 ? 'disabled' : ''} data-page="${page - 1}" aria-label="이전 페이지">‹</button>${Array.from({ length: pages }, (_, index) => `<button data-page="${index + 1}" ${page === index + 1 ? 'aria-current="page"' : ''}>${index + 1}</button>`).join('')}<button ${page === pages ? 'disabled' : ''} data-page="${page + 1}" aria-label="다음 페이지">›</button>`;
  };

  document.querySelector('.filters').addEventListener('click', (event) => {
    const button = event.target.closest('[data-status]');
    if (!button) return;
    status = button.dataset.status;
    page = 1;
    document.querySelectorAll('[data-status]').forEach((item) => item.classList.toggle('active', item === button));
    render();
  });
  [categoryFilter, searchInput].forEach((control) => control.addEventListener('input', () => { page = 1; render(); }));
  pagination.addEventListener('click', (event) => { const button = event.target.closest('[data-page]'); if (button && !button.disabled) { page = Number(button.dataset.page); render(); } });

  const observer = new IntersectionObserver((entries) => entries.forEach((entry) => { if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); } }), { threshold: .08 });
  document.querySelectorAll('.reveal').forEach((element) => observer.observe(element));
  const message = sessionStorage.getItem('momoQnaToast');
  const toast = document.querySelector('#toast');
  if (message && toast) { sessionStorage.removeItem('momoQnaToast'); toast.textContent = message; toast.hidden = false; setTimeout(() => { toast.hidden = true; }, 3000); }
  render();
})();
