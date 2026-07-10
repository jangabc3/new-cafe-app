const currentUser = JSON.parse(localStorage.getItem('momoCurrentUser') || 'null');

if (!currentUser) {
  window.location.replace('login.html?redirect=liked-menu.html&message=login-required');
}

const LIKED_KEY = 'momoLikedMenuIds';

const grid = document.querySelector('#likedGrid');
const sortSelect = document.querySelector('#sortSelect');
const toast = document.querySelector('#toast');
let toastTimer;
let likedItems = loadLikedItems();

function safe(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }[char]));
}

function won(value) {
  return `${Number(value || 0).toLocaleString('ko-KR')}원`;
}

function imagePath(image) {
  if (!image) return 'assets/images/momo-face-cute.png';
  if (image.startsWith('http') || image.startsWith('assets/')) return image;
  if (image.startsWith('../')) return image.slice(3);
  return image;
}

function getStoredLikedIds() {
  try {
    const stored = JSON.parse(localStorage.getItem(LIKED_KEY));
    if (!Array.isArray(stored)) return [];
    return stored.map((record) => {
      if (record && typeof record === 'object') {
        return {
          id: String(record.id),
          likedAt: record.likedAt || new Date().toISOString()
        };
      }
      return {
        id: String(record),
        likedAt: new Date().toISOString()
      };
    }).filter((record) => record.id);
  } catch {
    return [];
  }
}

function fromMenu(menu, record = {}) {
  return {
    ...menu,
    id: menu.id,
    name: menu.name,
    price: Number(menu.price),
    category: menu.category,
    categoryLabel: typeof getCategoryName === 'function' ? getCategoryName(menu.category) : menu.category,
    image: menu.image,
    likedAt: record.likedAt || new Date().toISOString()
  };
}

function loadLikedItems() {
  const records = getStoredLikedIds();
  return records.map((record) => {
    const menu = typeof getMenuById === 'function' ? getMenuById(record.id) : null;
    return menu ? fromMenu(menu, record) : null;
  }).filter((item) => item && item.name);
}

function saveLikedIds() {
  localStorage.setItem(LIKED_KEY, JSON.stringify(likedItems.map((item) => ({
    id: String(item.id),
    likedAt: item.likedAt || new Date().toISOString()
  }))));
  localStorage.setItem('momoFavoriteCount', String(likedItems.length));
}

function sortedItems() {
  const items = likedItems.slice();
  if (sortSelect.value === 'price-low') return items.sort((a, b) => a.price - b.price);
  if (sortSelect.value === 'price-high') return items.sort((a, b) => b.price - a.price);
  return items.sort((a, b) => String(b.likedAt).localeCompare(String(a.likedAt)));
}

function showToast(message) {
  window.clearTimeout(toastTimer);
  toast.textContent = message;
  toast.hidden = false;
  toastTimer = window.setTimeout(() => {
    toast.hidden = true;
  }, 2200);
}

function updateCounts() {
  const count = likedItems.length;
  document.querySelector('#likedCount').textContent = count;
  document.querySelector('#gridCount').textContent = count;
  document.querySelector('#recentLiked').textContent = likedItems[0]?.name || '찜한 메뉴 없음';
  const cartQuantity = typeof getCart === 'function'
    ? getCart().reduce((sum, item) => sum + Number(item.quantity || 0), 0)
    : 0;
  const cartCount = document.querySelector('#cartCount');
  if (cartCount) cartCount.textContent = cartQuantity;
}

function renderLikedItems() {
  updateCounts();
  const items = sortedItems();

  if (!items.length) {
    grid.innerHTML = '<p class="empty-liked">아직 찜한 메뉴가 없어요. 메뉴 페이지에서 하트를 눌러 좋아하는 메뉴를 담아보세요.</p>';
    return;
  }

  grid.innerHTML = items.map((item) => `
    <article class="product-card" data-id="${safe(item.id)}">
      <a class="product-thumb" href="menus/detail.html?id=${encodeURIComponent(item.id)}" aria-label="${safe(item.name)} 상세 보기">
        <img src="${safe(imagePath(item.image))}" alt="${safe(item.name)}" loading="lazy">
      </a>
      <button class="heart-button" type="button" data-action="unlike" aria-label="${safe(item.name)} 찜 해제">♥</button>
      <div class="product-info">
        <span class="category-label">${safe(item.categoryLabel)}</span>
        <h3>${safe(item.name)}</h3>
        <p>${won(item.price)}</p>
        <button class="cart-button" type="button" data-action="cart">장바구니 담기</button>
      </div>
    </article>
  `).join('');
}

function removeLiked(id) {
  likedItems = likedItems.filter((item) => String(item.id) !== String(id));
  saveLikedIds();
  renderLikedItems();
  showToast('찜한 메뉴에서 삭제했어요.');
}

function addLikedToCart(id) {
  const item = likedItems.find((menu) => String(menu.id) === String(id));
  if (!item) return;

  if (typeof addToCart === 'function' && typeof getMenuById === 'function' && getMenuById(item.id)) {
    addToCart(item.id, 1);
  } else {
    const cart = typeof getCart === 'function' ? getCart() : [];
    const existing = cart.find((cartItem) => String(cartItem.menuId) === String(item.id));
    if (existing) {
      existing.quantity += 1;
    } else {
      cart.push({ menuId: item.id, name: item.name, price: item.price, category: item.category || 'dessert', quantity: 1, options: {} });
    }
    if (typeof saveCart === 'function') saveCart(cart);
  }

  updateCounts();
  showToast('장바구니에 담았습니다.');
}

grid.addEventListener('click', (event) => {
  const card = event.target.closest('.product-card');
  const button = event.target.closest('[data-action]');
  if (!card || !button) return;

  if (button.dataset.action === 'unlike') removeLiked(card.dataset.id);
  if (button.dataset.action === 'cart') addLikedToCart(card.dataset.id);
});

sortSelect.addEventListener('change', renderLikedItems);

document.querySelector('#logoutButton')?.addEventListener('click', () => {
  localStorage.removeItem('momoCurrentUser');
  window.location.href = 'index.html';
});

document.querySelectorAll('.liked-pagination a').forEach((link) => {
  link.addEventListener('click', (event) => event.preventDefault());
});

renderLikedItems();
