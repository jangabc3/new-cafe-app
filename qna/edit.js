(() => {
  const user = JSON.parse(localStorage.getItem('momoCurrentUser') || 'null');
  const qna = window.MomoQna;
  const id = new URLSearchParams(location.search).get('id') || new URLSearchParams(location.hash.slice(1)).get('id');
  const item = qna.getInquiryById(id);
  const form = document.querySelector('#qnaForm');
  if (!qna.canEditInquiry(item, user)) { location.replace('/qna/list.html'); return; }

  Object.entries(qna.categories).forEach(([value, label]) => form.category.add(new Option(label, value)));
  form.category.value = item.category;
  form.title.value = item.title;
  form.content.value = item.content;
  form.isPrivate.checked = item.isPrivate === true;
  cancelLink.href = `/qna/detail.html#id=${encodeURIComponent(id)}`;

  const count = () => {
    titleCount.textContent = `${form.title.value.length} / 100`;
    contentCount.textContent = `${form.content.value.length} / 2000`;
  };
  form.addEventListener('input', count);
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    try {
      qna.updateInquiry(id, user, { category:form.category.value, title:form.title.value, content:form.content.value, isPrivate:form.isPrivate.checked === true });
      location.href = `/qna/detail.html#id=${encodeURIComponent(id)}`;
    } catch (error) { formError.textContent = error.message; }
  });
  count();
})();
