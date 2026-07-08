function formatPrice(price) {
  return Number(price).toLocaleString('ko-KR') + '원';
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}

function getCategoryName(id) {
  const category = CATEGORIES.find((item) => item.id === id);
  return category ? category.name : id;
}

function getStatusLabel(value) {
  const status = Object.values(ORDER_STATUS).find((item) => item.value === value);
  return status ? status.label : value;
}

function formatDate(date) {
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const h = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${day} ${h}:${min}`;
}

const MENU_STORAGE_KEY = 'momo_coffee_menus_v6';

function getMenus() {
  const stored = localStorage.getItem(MENU_STORAGE_KEY);
  if (stored) {
    return JSON.parse(stored);
  }

  saveMenus(MENU_ITEMS);
  return [...MENU_ITEMS];
}

function saveMenus(menus) {
  localStorage.setItem(MENU_STORAGE_KEY, JSON.stringify(menus));
}

function getMenuById(id) {
  return getMenus().find((menu) => String(menu.id) === String(id));
}

function normalizeMenu(menu) {
  return {
    name: menu.name.trim(),
    category: menu.category,
    price: Number(menu.price),
    description: menu.description.trim(),
    image: menu.image.trim()
  };
}

function createMenu(menu) {
  const menus = getMenus();
  const newMenu = {
    id: generateId(),
    ...normalizeMenu(menu)
  };

  menus.push(newMenu);
  saveMenus(menus);
  return newMenu;
}

function updateMenu(id, updates) {
  const menus = getMenus();
  const index = menus.findIndex((menu) => String(menu.id) === String(id));

  if (index === -1) {
    return null;
  }

  menus[index] = {
    ...menus[index],
    ...normalizeMenu(updates)
  };
  saveMenus(menus);
  return menus[index];
}

function deleteMenu(id) {
  const menus = getMenus().filter((menu) => String(menu.id) !== String(id));
  saveMenus(menus);
}

const CART_KEY = 'momo_coffee_cart_v1';

function getCart() {
  const data = localStorage.getItem(CART_KEY);
  return data ? JSON.parse(data) : [];
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

function addToCart(menuId, quantity = 1) {
  const cart = getCart();
  const item = getMenuById(menuId);
  if (!item) return;

  const existing = cart.find((cartItem) => String(cartItem.menuId) === String(menuId));
  if (existing) {
    existing.quantity += quantity;
  } else {
    cart.push({
      menuId: item.id,
      name: item.name,
      price: item.price,
      category: item.category,
      quantity
    });
  }

  saveCart(cart);
}

function removeFromCart(menuId) {
  saveCart(getCart().filter((item) => String(item.menuId) !== String(menuId)));
}

function updateCartQuantity(menuId, quantity) {
  const cart = getCart();
  const item = cart.find((cartItem) => String(cartItem.menuId) === String(menuId));
  if (!item) return;

  if (quantity <= 0) {
    removeFromCart(menuId);
    return;
  }

  item.quantity = quantity;
  saveCart(cart);
}

function getCartTotal() {
  return getCart().reduce((sum, item) => sum + item.price * item.quantity, 0);
}

function clearCart() {
  saveCart([]);
}

const ORDERS_KEY = 'momo_coffee_orders_v1';

function getOrders() {
  const data = localStorage.getItem(ORDERS_KEY);
  return data ? JSON.parse(data) : [];
}

function saveOrders(orders) {
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
}

function createOrder(items, total) {
  const orders = getOrders();
  const order = {
    id: generateId(),
    items,
    total,
    status: ORDER_STATUS.PENDING.value,
    createdAt: new Date().toISOString(),
    completedAt: null
  };

  orders.push(order);
  saveOrders(orders);
  return order;
}

function getOrderById(id) {
  return getOrders().find((order) => String(order.id) === String(id));
}

function updateOrderStatus(id, status) {
  const orders = getOrders();
  const order = orders.find((item) => String(item.id) === String(id));
  if (!order) return;

  order.status = status;
  if (status === ORDER_STATUS.COMPLETED.value) {
    order.completedAt = new Date().toISOString();
  }
  saveOrders(orders);
}

function $(selector, parent = document) {
  return parent.querySelector(selector);
}

function $$(selector, parent = document) {
  return [...parent.querySelectorAll(selector)];
}

function renderList(container, items, renderFn) {
  container.innerHTML = items.map(renderFn).join('');
}

function getQueryParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
