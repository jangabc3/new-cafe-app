const MOMO_COUPON_STORAGE_KEY = 'momo_coffee_coupons_v1';
const MOMO_SELECTED_COUPON_KEY = 'momo_coffee_selected_coupon_v1';

const MOMO_DEFAULT_COUPONS = [
  { id: 1, type: '20%', label: 'OFF', title: '전 메뉴 20% 할인', description: '모든 음료와 디저트에 사용 가능', minimumAmount: 10000, maximumDiscount: 5000, minimum: '10,000원', maximum: '5,000원', dateLabel: '유효기간', date: '2026.12.31', status: 'available', tone: 'coral', discountType: 'percent', discountValue: 20, target: 'all' },
  { id: 2, type: 'FREE', label: 'AMERICANO', title: '아메리카노(R) 무료 쿠폰', description: '아메리카노 Regular 한 잔 무료 제공', minimumAmount: 0, maximumDiscount: 3500, minimum: '제한 없음', maximum: 'R 사이즈 1잔', dateLabel: '유효기간', date: '2026.11.30', status: 'available', tone: 'peach', discountType: 'free-item', targetMenuId: 3, target: 'americano' },
  { id: 3, type: '10%', label: 'DESSERT', title: '디저트 10% 할인', description: '베이커리와 디저트 전 메뉴에 사용 가능', minimumAmount: 5000, maximumDiscount: 3000, minimum: '5,000원', maximum: '3,000원', dateLabel: '유효기간', date: '2026.10.15', status: 'available', tone: 'berry', discountType: 'percent', discountValue: 10, target: 'dessert' },
  { id: 4, type: '3,000원', label: 'DISCOUNT', title: '3,000원 할인 쿠폰', description: '모모커피 전 메뉴 주문 시 사용 가능', minimumAmount: 15000, maximumDiscount: 3000, minimum: '15,000원', maximum: '3,000원', dateLabel: '유효기간', date: '2026.09.30', status: 'available', tone: 'rose', discountType: 'fixed', discountValue: 3000, target: 'all' },
  { id: 5, type: 'BIRTHDAY', label: 'SPECIAL', title: '생일 축하 쿠폰', description: '생일을 맞은 모모 회원님을 위한 특별 혜택', minimumAmount: 10000, maximumDiscount: 7000, minimum: '10,000원', maximum: '7,000원', dateLabel: '유효기간', date: '2026.08.15', status: 'available', tone: 'pink', discountType: 'fixed', discountValue: 7000, target: 'all' },
  { id: 6, type: 'WELCOME', label: 'MEMBER', title: '신규 회원 웰컴 쿠폰', description: '모모커피 첫 주문에 사용할 수 있어요', minimumAmount: 8000, maximumDiscount: 4000, minimum: '8,000원', maximum: '4,000원', dateLabel: '사용일', date: '2026.07.02', status: 'used', tone: 'muted', discountType: 'fixed', discountValue: 4000, target: 'all' },
  { id: 7, type: 'FREE', label: 'STAMP REWARD', title: '스탬프 리워드 무료 쿠폰', description: '스탬프 10개 적립으로 받은 음료 쿠폰', minimumAmount: 0, maximumDiscount: 6000, minimum: '제한 없음', maximum: 'Tall 1잔', dateLabel: '사용일', date: '2026.06.28', status: 'used', tone: 'muted', discountType: 'free-drink', target: 'drink' },
  { id: 8, type: '15%', label: 'SEASON', title: '시즌 메뉴 15% 할인', description: '봄 시즌 한정 음료에 사용 가능한 쿠폰', minimumAmount: 6000, maximumDiscount: 4000, minimum: '6,000원', maximum: '4,000원', dateLabel: '만료일', date: '2026.05.31', status: 'expired', tone: 'muted', discountType: 'percent', discountValue: 15, target: 'season' }
];

function getMomoCoupons() {
  try {
    const saved = JSON.parse(localStorage.getItem(MOMO_COUPON_STORAGE_KEY) || 'null');
    return Array.isArray(saved)
      ? saved.filter((coupon) => coupon?.userId != null || String(coupon?.memberKey || '').trim())
      : [];
  } catch {
    return [];
  }
}

function getMomoCouponsForUser(user) {
  const userId = user?.id ?? user?.email;
  const memberKey = String(userId || '').toLowerCase();
  if (!memberKey) return [];
  return getMomoCoupons().filter((coupon) => {
    if (coupon.revoked) return false;
    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) return false;
    const assignedUserId = coupon.userId == null ? '' : String(coupon.userId);
    const assignedMemberKey = String(coupon.memberKey || '').toLowerCase();
    return assignedUserId === String(userId) || assignedMemberKey === memberKey;
  });
}

function saveMomoCoupons(coupons) {
  localStorage.setItem(MOMO_COUPON_STORAGE_KEY, JSON.stringify(coupons));
}

function ensureLikedMenuCoupon() {
  const coupons = getMomoCoupons();
  const likedCoupons = coupons.filter((coupon) => coupon.target === 'liked');
  if (likedCoupons.length === 0) {
    coupons.unshift({
      id: 910, type: '10%', label: 'LIKED MENU', title: '찜한 메뉴 10% 할인 쿠폰',
      description: '찜한 메뉴를 주문할 때 사용할 수 있어요.', minimumAmount: 0,
      maximumDiscount: 5000, minimum: '제한 없음', maximum: '5,000원',
      dateLabel: '유효기간', date: '2026.12.31', status: 'available', tone: 'pink',
      discountType: 'percent', discountValue: 10, target: 'liked'
    });
    saveMomoCoupons(coupons);
    return coupons[0];
  }
  if (likedCoupons.length > 1) {
    const keep = likedCoupons[0];
    saveMomoCoupons(coupons.filter((coupon) => coupon.target !== 'liked' || coupon === keep));
    return keep;
  }
  return likedCoupons[0];
}

// Legacy liked-menu coupons were global and leaked into every member wallet.
// Grade and administrator-issued coupons must always be assigned to one member.

function getSelectedMomoCouponId() {
  return localStorage.getItem(MOMO_SELECTED_COUPON_KEY) || null;
}

function selectMomoCoupon(id) {
  if (id == null) localStorage.removeItem(MOMO_SELECTED_COUPON_KEY);
  else localStorage.setItem(MOMO_SELECTED_COUPON_KEY, String(id));
}

function useMomoCoupon(id) {
  const coupons = getMomoCoupons();
  const coupon = coupons.find((item) => Number(item.id) === Number(id));
  if (!coupon || coupon.status !== 'available') return false;
  coupon.status = 'used';
  coupon.dateLabel = '사용일';
  const usedAt = new Date();
  coupon.date = [usedAt.getFullYear(), String(usedAt.getMonth() + 1).padStart(2, '0'), String(usedAt.getDate()).padStart(2, '0')].join('.');
  saveMomoCoupons(coupons);
  selectMomoCoupon(null);
  return true;
}

function getCouponTargetAmount(coupon, cart) {
  if (coupon.target === 'dessert') return cart.filter((item) => ['dessert', 'bakery'].includes(item.category)).reduce((sum, item) => sum + item.price * item.quantity, 0);
  if (coupon.target === 'season') return cart.filter((item) => item.category === 'season').reduce((sum, item) => sum + item.price * item.quantity, 0);
  if (coupon.target === 'drink') return cart.filter((item) => !['dessert', 'bakery', 'goods'].includes(item.category)).reduce((sum, item) => sum + item.price * item.quantity, 0);
  if (coupon.target === 'liked') {
    let liked = [];
    try { liked = JSON.parse(localStorage.getItem('momoLikedMenuIds') || '[]'); } catch { liked = []; }
    const ids = new Set((Array.isArray(liked) ? liked : []).map((record) => String(record && typeof record === 'object' ? record.id : record)));
    return cart.filter((item) => ids.has(String(item.menuId))).reduce((sum, item) => sum + item.price * item.quantity, 0);
  }
  return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

function calculateMomoCoupon(coupon, cart) {
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  if (!coupon || coupon.status !== 'available') return { eligible: false, discount: 0, reason: '사용할 수 없는 쿠폰입니다.' };
  if (subtotal < coupon.minimumAmount) return { eligible: false, discount: 0, reason: `최소 주문금액 ${coupon.minimum} 이상부터 사용할 수 있어요.` };

  let discount = 0;
  if (coupon.discountType === 'free-item') {
    const item = cart.find((entry) => Number(entry.menuId) === Number(coupon.targetMenuId));
    if (!item) return { eligible: false, discount: 0, reason: '장바구니에 아메리카노(R)를 담아주세요.' };
    discount = item.price;
  } else if (coupon.discountType === 'free-drink') {
    const drinks = cart.filter((item) => !['dessert', 'bakery', 'goods'].includes(item.category));
    if (!drinks.length) return { eligible: false, discount: 0, reason: '장바구니에 음료를 담아주세요.' };
    discount = Math.min(...drinks.map((item) => item.price));
  } else {
    const targetAmount = getCouponTargetAmount(coupon, cart);
    if (!targetAmount) return { eligible: false, discount: 0, reason: '쿠폰 적용 대상 메뉴가 장바구니에 없습니다.' };
    discount = coupon.discountType === 'percent' ? Math.floor(targetAmount * coupon.discountValue / 100) : coupon.discountValue;
  }

  discount = Math.min(discount, coupon.maximumDiscount || discount, subtotal);
  return { eligible: discount > 0, discount, reason: discount > 0 ? `${discount.toLocaleString('ko-KR')}원 할인됩니다.` : '할인 금액이 없습니다.' };
}
