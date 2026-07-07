const menuForm = $('#menuForm');
const categorySelect = $('#categorySelect');
const formError = $('#formError');

function initializeForm() {
  categorySelect.innerHTML = CATEGORIES
    .map((category) => `<option value="${category.id}">${escapeHtml(category.name)}</option>`)
    .join('');
}

function getFormData(form) {
  const data = new FormData(form);
  return {
    name: data.get('name'),
    category: data.get('category'),
    price: data.get('price'),
    description: data.get('description'),
    image: data.get('image') || ''
  };
}

function validateMenuData(menu) {
  if (!menu.name.trim()) return '메뉴명을 입력해 주세요.';
  if (!menu.category) return '카테고리를 선택해 주세요.';
  if (Number(menu.price) < 0 || Number.isNaN(Number(menu.price))) return '가격을 올바르게 입력해 주세요.';
  if (!menu.description.trim()) return '설명을 입력해 주세요.';
  return '';
}

function showError(message) {
  formError.textContent = message;
  formError.hidden = !message;
}

menuForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const menuData = getFormData(menuForm);
  const error = validateMenuData(menuData);

  if (error) {
    showError(error);
    return;
  }

  const menu = createMenu(menuData);
  window.location.href = `detail.html?id=${encodeURIComponent(menu.id)}`;
});

initializeForm();
