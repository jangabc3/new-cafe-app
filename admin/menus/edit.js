const menuForm = $('#menuForm');
const categorySelect = $('#categorySelect');
const formError = $('#formError');
const missingPanel = $('#missingPanel');
const pageTitle = $('#pageTitle');
const detailLink = $('#detailLink');
const menuId = getQueryParam('id');
const menu = getMenuById(menuId);

function initializeCategories() {
  categorySelect.innerHTML = CATEGORIES
    .map((category) => `<option value="${category.id}">${escapeHtml(category.name)}</option>`)
    .join('');
}

function fillForm() {
  menuForm.elements.name.value = menu.name;
  menuForm.elements.category.value = menu.category;
  menuForm.elements.price.value = menu.price;
  menuForm.elements.description.value = menu.description;
  menuForm.elements.image.value = menu.image || '';
  pageTitle.textContent = `${menu.name} 수정`;
  detailLink.href = `/admin/menus/detail.html?id=${encodeURIComponent(menu.id)}`;
  menuForm.hidden = false;
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

function validateMenuData(menuData) {
  if (!menuData.name.trim()) return '메뉴명을 입력해 주세요.';
  if (!menuData.category) return '카테고리를 선택해 주세요.';
  if (Number(menuData.price) < 0 || Number.isNaN(Number(menuData.price))) return '가격을 올바르게 입력해 주세요.';
  if (!menuData.description.trim()) return '설명을 입력해 주세요.';
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

  updateMenu(menu.id, menuData);
  window.location.href = `/admin/menus/detail.html?id=${encodeURIComponent(menu.id)}`;
});

initializeCategories();

if (menu) {
  fillForm();
} else {
  missingPanel.hidden = false;
}
