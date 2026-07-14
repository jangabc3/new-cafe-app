(() => {
  const user = JSON.parse(localStorage.getItem('momoCurrentUser') || 'null');
  const qna = window.MomoQna;
  const form = document.querySelector('#qnaForm');
  const privateInput = form.elements.namedItem('isPrivate');
  const titleInput = form.elements.namedItem('title');
  const contentInput = form.elements.namedItem('content');

  Object.entries(qna.categories).forEach(([value, label]) => form.category.add(new Option(label, value)));
  privateInput.checked = false;
  window.addEventListener('pageshow', (event) => { if (event.persisted) privateInput.checked = false; });

  const count = () => {
    titleCount.textContent = `${titleInput.value.length} / 100`;
    contentCount.textContent = `${contentInput.value.length} / 2000`;
  };
  form.addEventListener('input', count);

  let busy = false;
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (busy) return;
    formError.textContent = '';
    if (!form.reportValidity()) return;
    if (!confirm('문의를 등록할까요?')) return;
    busy = true;
    try {
      const item = qna.createInquiry({
        category: form.category.value,
        title: titleInput.value,
        content: contentInput.value,
        isPrivate: privateInput.checked === true
      }, user);
      sessionStorage.setItem('momoQnaToast', '문의가 등록되었습니다.');
      location.href = `/qna/detail.html#id=${encodeURIComponent(item.id)}`;
    } catch (error) {
      busy = false;
      formError.textContent = error.message;
    }
  });
  count();
})();
