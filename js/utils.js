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
  const adminLabel = typeof ADMIN_ORDER_STATUS_LABELS !== 'undefined' ? ADMIN_ORDER_STATUS_LABELS[String(value || '').toUpperCase()] : null;
  if (adminLabel) return adminLabel;
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
    const storedMenus = JSON.parse(stored).map(normalizeMenuAvailability);
    const storedIds = new Set(storedMenus.map((menu) => String(menu.id)));
    const missingDefaultMenus = MENU_ITEMS.filter((menu) => !storedIds.has(String(menu.id)));

    if (missingDefaultMenus.length > 0) {
      const mergedMenus = [...storedMenus, ...missingDefaultMenus];
      saveMenus(mergedMenus);
      return mergedMenus;
    }

    return storedMenus;
  }

  saveMenus(MENU_ITEMS);
  return MENU_ITEMS.map(normalizeMenuAvailability);
}

function saveMenus(menus) { localStorage.setItem(MENU_STORAGE_KEY, JSON.stringify(menus.map(normalizeMenuAvailability))); }
function normalizeMenuAvailability(menu) { return { ...menu, isSoldOut: Boolean(menu?.isSoldOut ?? menu?.soldOut ?? false) }; }
function isMenuSoldOut(menuId) { return Boolean(getMenuById(menuId)?.isSoldOut); }
function setMenuSoldOut(menuId, soldOut, adminUser) { if (adminUser?.role !== 'ADMIN') throw new Error('관리자 권한이 필요합니다.'); const menus=getMenus(),menu=menus.find(item=>String(item.id)===String(menuId)); if(!menu)throw new Error('메뉴를 찾을 수 없습니다.'); const before={isSoldOut:menu.isSoldOut}; menu.isSoldOut=Boolean(soldOut); saveMenus(menus); window.MomoAdminActivity?.log(adminUser,menu.isSoldOut?'SOLD_OUT':'RESUME_MENU','MENU',menu.id,menu.isSoldOut?'메뉴 품절 처리':'메뉴 판매 재개',before,{isSoldOut:menu.isSoldOut}); return menu; }
function getMenuAvailabilityLabel(menu) { return normalizeMenuAvailability(menu).isSoldOut ? '품절' : '판매 중'; }
function canAddMenuToCart(menuId) { return Boolean(getMenuById(menuId) && !isMenuSoldOut(menuId)); }
function getCartSoldOutItems(cart) { return (Array.isArray(cart) ? cart : []).filter(item => isMenuSoldOut(item.menuId)); }

function getMenuById(id) {
  if (id === null || id === undefined || id === '') return null;
  const normalizedId = decodeURIComponent(String(id)).trim();
  return getMenus().find((menu) => String(menu.id).trim() === normalizedId)
    || MENU_ITEMS.find((menu) => String(menu.id) === normalizedId)
    || null;
}

function normalizeMenu(menu) {
  return {
    name: menu.name.trim(),
    category: menu.category,
    price: Number(menu.price),
    description: menu.description.trim(),
    image: menu.image.trim(),
    isSoldOut: Boolean(menu.isSoldOut)
  };
}

function createMenu(menu) {
  const menus = getMenus();
  const newMenu = {
    id: generateId(),
    ...normalizeMenu(menu),
    isSoldOut: false
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
    ...normalizeMenu({ ...updates, isSoldOut: menus[index].isSoldOut })
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
  window.dispatchEvent(new CustomEvent('momo-cart-updated', { detail: { cart } }));
}

function addToCart(menuId, quantity = 1, options = {}) {
  if (!canAddMenuToCart(menuId)) throw new Error('현재 품절된 메뉴입니다.');
  const cart = getCart();
  const item = getMenuById(menuId);
  if (!item) return;

  const optionKey = JSON.stringify(options);
  const existing = cart.find((cartItem) =>
    String(cartItem.menuId) === String(menuId)
    && JSON.stringify(cartItem.options || {}) === optionKey
  );
  if (existing) {
    existing.quantity += quantity;
  } else {
    cart.push({
      menuId: item.id,
      name: item.name,
      price: item.price,
      category: item.category,
      options,
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
  if (quantity > item.quantity && !canAddMenuToCart(menuId)) throw new Error('현재 품절된 메뉴입니다.');

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
  const orders = data ? JSON.parse(data) : [];
  return Array.isArray(orders) ? orders.map(normalizeOrderStatus) : [];
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

const ADMIN_ORDER_STATUSES = ['RECEIVED', 'PREPARING', 'READY', 'PICKED_UP'];
const ADMIN_ORDER_STATUS_LABELS = { RECEIVED:'주문 접수', PREPARING:'제조 중', READY:'제조 완료', PICKED_UP:'픽업 완료' };
const LEGACY_ORDER_STATUS_MAP = { pending:'RECEIVED', confirmed:'PREPARING', preparing:'PREPARING', ready:'READY', completed:'PICKED_UP', received:'RECEIVED', picked_up:'PICKED_UP' };
function normalizeOrderStatus(order) { if(!order||typeof order!=='object')return order;const raw=String(order.status||'').trim(),upper=raw.toUpperCase();const status=ADMIN_ORDER_STATUSES.includes(upper)?upper:(LEGACY_ORDER_STATUS_MAP[raw.toLowerCase()]||'RECEIVED');return {...order,status,updatedAt:order.updatedAt||null,statusHistory:Array.isArray(order.statusHistory)?order.statusHistory:[],adminMemo:String(order.adminMemo||'')}; }
function getOrderStatusLabel(status){return ADMIN_ORDER_STATUS_LABELS[normalizeOrderStatus({status}).status]}
function getNextOrderStatus(status){const index=ADMIN_ORDER_STATUSES.indexOf(normalizeOrderStatus({status}).status);return index>=0&&index<3?ADMIN_ORDER_STATUSES[index+1]:null}
function getNextOrderActionLabel(status){return {RECEIVED:'제조 시작',PREPARING:'제조 완료',READY:'픽업 완료',PICKED_UP:'처리 완료'}[normalizeOrderStatus({status}).status]}
function getOrderStatusProgress(status){return Math.max(0,ADMIN_ORDER_STATUSES.indexOf(normalizeOrderStatus({status}).status))}
function advanceOrderStatus(orderId,adminUser){if(adminUser?.role!=='ADMIN')throw new Error('관리자 권한이 필요합니다.');const orders=getOrders(),index=orders.findIndex(order=>String(order.id)===String(orderId));if(index<0)throw new Error('주문을 찾을 수 없습니다.');const next=getNextOrderStatus(orders[index].status);if(!next)throw new Error('이미 처리가 완료된 주문입니다.');const now=new Date().toISOString();orders[index]={...orders[index],status:next,updatedAt:now,statusHistory:[...orders[index].statusHistory,{status:next,changedAt:now,changedBy:adminUser.id??adminUser.email}]};saveOrders(orders);window.MomoAdminActivity?.log(adminUser,'ADVANCE_STATUS','ORDER',orderId,'주문 상태 변경',null,{status:next});return orders[index]}
function saveOrderAdminMemo(orderId,adminUser,memo){if(adminUser?.role!=='ADMIN')throw new Error('관리자 권한이 필요합니다.');const orders=getOrders(),order=orders.find(item=>String(item.id)===String(orderId));if(!order)throw new Error('주문을 찾을 수 없습니다.');order.adminMemo=String(memo||'').trim();order.updatedAt=new Date().toISOString();saveOrders(orders);window.MomoAdminActivity?.log(adminUser,'SAVE_MEMO','ORDER',orderId,'관리자 주문 메모 수정',null,{adminMemo:order.adminMemo});return order}

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
