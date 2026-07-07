const state = {
  search: '',
  category: 'all'
};

const searchInput = $('#searchInput');
const categoryFilter = $('#categoryFilter');
const menuTableBody = $('#menuTableBody');
const emptyState = $('#emptyState');
const totalCount = $('#totalCount');
const visibleCount = $('#visibleCount');
const averagePrice = $('#averagePrice');

function initializeCategories() {
  categoryFilter.innerHTML += CATEGORIES
    .map((category) => `<option value="${category.id}">${escapeHtml(category.name)}</option>`)
    .join('');
}

function getFilteredMenus() {
  const search = state.search.toLowerCase();
  return getMenus().filter((menu) => {
    const matchesCategory = state.category === 'all' || menu.category === state.category;
    const matchesSearch =
      menu.name.toLowerCase().includes(search) ||
      menu.description.toLowerCase().includes(search);
    return matchesCategory && matchesSearch;
  });
}

function renderMenus() {
  const menus = getMenus();
  const filteredMenus = getFilteredMenus();
  const average =
    filteredMenus.length === 0
      ? 0
      : filteredMenus.reduce((sum, menu) => sum + Number(menu.price), 0) / filteredMenus.length;

  totalCount.textContent = menus.length;
  visibleCount.textContent = filteredMenus.length;
  averagePrice.textContent = formatPrice(Math.round(average));
  emptyState.hidden = filteredMenus.length > 0;

  renderList(
    menuTableBody,
    filteredMenus,
    (menu) => `
      <tr>
        <td>
          <div class="menu-name">${escapeHtml(menu.name)}</div>
          <div class="menu-meta">ID ${escapeHtml(menu.id)}</div>
        </td>
        <td><span class="category-pill">${escapeHtml(getCategoryName(menu.category))}</span></td>
        <td>${formatPrice(menu.price)}</td>
        <td class="description-cell">${escapeHtml(menu.description)}</td>
        <td>
          <div class="row-actions">
            <a class="small-button" href="detail.html?id=${encodeURIComponent(menu.id)}">상세</a>
            <a class="small-button" href="edit.html?id=${encodeURIComponent(menu.id)}">수정</a>
            <button class="danger-button" type="button" data-delete-id="${escapeHtml(menu.id)}">삭제</button>
          </div>
        </td>
      </tr>
    `
  );
}

function handleDelete(event) {
  const button = event.target.closest('[data-delete-id]');
  if (!button) return;

  const menu = getMenuById(button.dataset.deleteId);
  if (!menu) return;

  const shouldDelete = window.confirm(`"${menu.name}" 메뉴를 삭제할까요?`);
  if (!shouldDelete) return;

  deleteMenu(menu.id);
  renderMenus();
}

searchInput.addEventListener('input', (event) => {
  state.search = event.target.value.trim();
  renderMenus();
});

categoryFilter.addEventListener('change', (event) => {
  state.category = event.target.value;
  renderMenus();
});

menuTableBody.addEventListener('click', handleDelete);

initializeCategories();
renderMenus();
