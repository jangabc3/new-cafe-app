const state = {
  search: '',
  category: 'all'
};

const searchInput = $('#searchInput');
const categoryTabs = $('#categoryTabs');
const menuGrid = $('#menuGrid');
const emptyState = $('#emptyState');
const visibleCount = $('#visibleCount');
const cartCount = $('#cartCount');
const toast = $('#toast');
const heroMenuName = $('#heroMenuName');
const heroMenuPrice = $('#heroMenuPrice');

let toastTimer;

function updateCartCount() {
  cartCount.textContent = getCart().reduce((sum, item) => sum + item.quantity, 0);
}

function showToast(message) {
  window.clearTimeout(toastTimer);
  toast.textContent = message;
  toast.hidden = false;
  toastTimer = window.setTimeout(() => {
    toast.hidden = true;
  }, 2200);
}

function renderCategoryTabs() {
  const tabs = [{ id: 'all', name: 'All' }, ...CATEGORIES];
  categoryTabs.innerHTML = tabs
    .map(
      (category) => `
        <button
          class="category-tab ${category.id === state.category ? 'is-active' : ''}"
          type="button"
          data-category="${category.id}"
          role="tab"
          aria-selected="${category.id === state.category}"
        >
          ${escapeHtml(category.name)}
        </button>
      `
    )
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

function renderHero(menus) {
  const featured = menus.find((menu) => menu.name.toLowerCase().includes('latte')) || menus[0];
  if (!featured) return;

  heroMenuName.textContent = featured.name;
  heroMenuPrice.textContent = formatPrice(featured.price);
}

function renderMenus() {
  const filteredMenus = getFilteredMenus();
  visibleCount.textContent = filteredMenus.length;
  emptyState.hidden = filteredMenus.length > 0;

  renderList(
    menuGrid,
    filteredMenus,
    (menu) => `
      <article class="menu-card">
        <a class="menu-thumb" href="detail.html?id=${encodeURIComponent(menu.id)}" aria-label="${escapeHtml(menu.name)} 상세 보기">
          ${
            menu.image
              ? `<img src="${escapeHtml(menu.image)}" alt="${escapeHtml(menu.name)}">`
              : `<span class="menu-initial">${escapeHtml(menu.name.slice(0, 1))}</span>`
          }
        </a>
        <div class="menu-card-body">
          <span class="category-pill">${escapeHtml(getCategoryName(menu.category))}</span>
          <div class="card-title-row">
            <h2>${escapeHtml(menu.name)}</h2>
            <strong>${formatPrice(menu.price)}</strong>
          </div>
          <p class="menu-description">${escapeHtml(menu.description)}</p>
          <div class="card-actions">
            <a class="secondary-button" href="detail.html?id=${encodeURIComponent(menu.id)}">상세</a>
            <button class="primary-button" type="button" data-cart-id="${escapeHtml(menu.id)}">담기</button>
          </div>
        </div>
      </article>
    `
  );
}

searchInput.addEventListener('input', (event) => {
  state.search = event.target.value.trim();
  renderMenus();
});

categoryTabs.addEventListener('click', (event) => {
  const button = event.target.closest('[data-category]');
  if (!button) return;

  state.category = button.dataset.category;
  renderCategoryTabs();
  renderMenus();
});

menuGrid.addEventListener('click', (event) => {
  const button = event.target.closest('[data-cart-id]');
  if (!button) return;

  const menu = getMenuById(button.dataset.cartId);
  if (!menu) return;

  addToCart(menu.id);
  updateCartCount();
  showToast(`${menu.name} 1개를 장바구니에 담았습니다.`);
});

renderHero(getMenus());
renderCategoryTabs();
renderMenus();
updateCartCount();
