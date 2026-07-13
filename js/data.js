const CATEGORIES = [
  { id: 'coffee', name: '커피', icon: '☕' },
  { id: 'signature', name: '시그니처', icon: '♡' },
  { id: 'noncoffee', name: '논커피', icon: '🥛' },
  { id: 'tea', name: '티', icon: '🍵' },
  { id: 'dessert', name: '디저트', icon: '🍰' },
  { id: 'bakery', name: '베이커리', icon: '🥐' },
  { id: 'season', name: '시즌메뉴', icon: '✦' },
  { id: 'goods', name: '상품', icon: '🛍️' }
];

const MENU_ITEMS = [
  { id: 1, name: '바닐라 라떼', category: 'signature', price: 4500, description: '부드러운 라떼에 바닐라 빈 향을 더한 모모커피의 대표 메뉴입니다.', image: 'assets/images/menu-vanilla-latte.png', emoji: '☕' },
  { id: 2, name: '크림 슈페너', category: 'signature', price: 5200, description: '쌉싸름한 커피 위에 고소한 수제 크림을 얹은 시그니처 커피입니다.', image: 'assets/images/menu-cream-supener.png', emoji: '☁' },
  { id: 3, name: '아메리카노', category: 'coffee', price: 3500, description: '매일 볶는 원두의 깔끔한 향과 고소함을 담았습니다.', image: 'assets/images/menu-americano.png', emoji: '☕' },
  { id: 4, name: '카페 라떼', category: 'coffee', price: 4200, description: '진한 에스프레소와 따뜻한 우유가 균형 있게 어우러집니다.', image: 'assets/images/menu-cafe-latte.png', emoji: '☕' },
  { id: 5, name: '말차 라떼', category: 'noncoffee', price: 4800, description: '진한 말차와 우유의 크리미한 풍미가 편안함을 줍니다.', image: 'assets/images/menu-matcha-latte.png', emoji: '🍵' },
  { id: 6, name: '딸기 크림 라떼', category: 'season', price: 5600, description: '상큼한 딸기와 부드러운 크림을 올린 시즌 한정 음료입니다.', image: 'assets/images/menu-strawberry-cream-latte.png', emoji: '🍓' },
  { id: 7, name: '유자 캐모마일 티', category: 'tea', price: 4300, description: '향긋한 캐모마일과 유자의 달콤함이 기분 좋게 번집니다.', image: 'assets/images/menu-yuja-chamomile-tea.png', emoji: '🍵' },
  { id: 8, name: '피치 아이스티', category: 'season', price: 3900, description: '은은한 홍차와 복숭아의 산뜻함이 시원하게 어울리는 여름 시즌 음료입니다.', image: 'assets/images/menu-peach-iced-tea.png', emoji: '🍑' },
  { id: 9, name: '딸기 생크림 케이크', category: 'dessert', price: 6200, description: '폭신한 시트 사이에 생크림과 딸기를 포근히 넣었습니다.', image: 'assets/images/menu-strawberry-cake.png', emoji: '🍰' },
  { id: 10, name: '초코 케이크', category: 'dessert', price: 5800, description: '진한 초콜릿 무스와 촉촉한 시트가 어우러진 디저트입니다.', image: 'assets/images/menu-choco-cake.png', emoji: '🍫' },
  { id: 11, name: '버터 크루아상', category: 'bakery', price: 3400, description: '겹겹의 바삭한 결이 살아 있는 고소한 크루아상입니다.', image: 'assets/images/menu-butter-croissant.png', emoji: '🥐' },
  { id: 12, name: '모모 허니 브레드', category: 'bakery', price: 6900, description: '따뜻한 브레드에 꿀과 크림을 올린 함께 먹기 좋은 메뉴입니다.', image: 'assets/images/menu-honey-bread.png', emoji: '🍞' },
  { id: 13, name: '모모 키링', category: 'goods', price: 9900, description: '가방에 달아두고 매일 함께하는 포근한 모모 키링입니다.', image: 'assets/images/goods-momo-keyring.png', emoji: '🐻' },
  { id: 14, name: '모모 머그컵', category: 'goods', price: 14900, description: '매일의 커피 한 잔이 더 따뜻해지는 모모 머그입니다.', image: 'assets/images/goods-momo-mug.png', emoji: '☕' },
  { id: 15, name: '모모 노트', category: 'goods', price: 13900, description: '넉넉한 사이즈로 데일리 기록에 활용하기 좋은 모모 노트입니다.', image: 'assets/images/goods-momo-note.png', emoji: '📓' },
  { id: 16, name: '모모 에코백', category: 'goods', price: 13900, description: '지구를 생각한 튼튼한 친환경 모모 에코백입니다.', image: 'assets/images/goods-momo-eco-bag.png', emoji: '👜' },
  { id: 17, name: '오리지널 컵빙수', category: 'season', price: 6500, description: '우유 얼음 위에 팥, 콩고물, 떡, 바닐라 아이스크림과 체리를 올린 여름 신메뉴입니다.', image: 'assets/images/menu-original-cup-bingsu.png', emoji: '🍧' },
  { id: 18, name: '망고 컵빙수', category: 'season', price: 6800, description: '부드러운 우유 얼음에 생망고 큐브, 떡, 바닐라 아이스크림과 민트를 더한 컵빙수입니다.', image: 'assets/images/menu-mango-cup-bingsu.png', emoji: '🥭' }
];

const ORDER_STATUS = {
  PENDING: { value: 'pending', label: '주문 접수' },
  CONFIRMED: { value: 'confirmed', label: '확인 완료' },
  PREPARING: { value: 'preparing', label: '준비 중' },
  READY: { value: 'ready', label: '픽업 가능' },
  COMPLETED: { value: 'completed', label: '완료' },
  CANCELLED: { value: 'cancelled', label: '취소' }
};
