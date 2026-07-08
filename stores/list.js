const STORE_ITEMS = [
  {
    id: 'kkachisan',
    name: '모모커피 까치산역점',
    shortName: '까치산역점',
    address: '서울 강서구 화곡로 ○○',
    hours: '08:00 ~ 22:00',
    phone: '02-123-4567',
    rating: 4.8,
    lat: 37.5318,
    lng: 126.8467,
    x: 24,
    y: 58,
    photo: '../assets/images/menu-peach-iced-tea.png',
    features: ['지하철 5분', '모바일 주문', '디저트 픽업']
  },
  {
    id: 'gangnam',
    name: '모모커피 강남역점',
    shortName: '강남역점',
    address: '서울 강남구 강남대로 ○○',
    hours: '08:00 ~ 23:00',
    phone: '02-345-6789',
    rating: 4.9,
    lat: 37.4979,
    lng: 127.0276,
    x: 56,
    y: 64,
    photo: '../assets/images/menu-vanilla-latte.png',
    features: ['늦은 영업', '단체석', '픽업존']
  },
  {
    id: 'hongdae',
    name: '모모커피 홍대입구점',
    shortName: '홍대입구점',
    address: '서울 마포구 양화로 ○○',
    hours: '08:00 ~ 22:00',
    phone: '02-456-7890',
    rating: 4.7,
    lat: 37.5572,
    lng: 126.9245,
    x: 35,
    y: 42,
    photo: '../assets/images/menu-strawberry-cream-latte.png',
    features: ['테라스', '시즌 메뉴', '포토존']
  },
  {
    id: 'seongsu',
    name: '모모커피 성수점',
    shortName: '성수점',
    address: '서울 성동구 성수이로 ○○',
    hours: '09:00 ~ 22:00',
    phone: '02-555-1111',
    rating: 4.8,
    lat: 37.5446,
    lng: 127.0557,
    x: 67,
    y: 45,
    photo: '../assets/images/menu-cafe-latte.png',
    features: ['로스터리 무드', '노트북석', '주차 가능']
  },
  {
    id: 'jamsil',
    name: '모모커피 잠실점',
    shortName: '잠실점',
    address: '서울 송파구 올림픽로 ○○',
    hours: '08:00 ~ 22:00',
    phone: '02-888-9999',
    rating: 4.9,
    lat: 37.5133,
    lng: 127.1001,
    x: 78,
    y: 68,
    photo: '../assets/images/menu-matcha-latte.png',
    features: ['호수 산책', '키즈 친화', '케이크 예약']
  }
];

const state = {
  search: '',
  selectedId: STORE_ITEMS[0].id,
  recommendedId: ''
};

const cartCount = $('#cartCount');
const searchForm = $('#storeSearchForm');
const searchInput = $('#storeSearchInput');
const quickKeywords = $('#quickKeywords');
const nearbyButton = $('#nearbyButton');
const mapFocusButton = $('#mapFocusButton');
const map = $('#storeMap');
const mapPins = $('#mapPins');
const mapInfoCard = $('#mapInfoCard');
const mapCenterLabel = $('#mapCenterLabel');
const storeList = $('#storeList');
const storeCount = $('#storeCount');
const emptyState = $('#emptyState');
const recommendBox = $('#recommendBox');
const detailModal = $('#detailModal');
const detailContent = $('#detailContent');
const detailCloseButton = $('#detailCloseButton');

function updateCartCount() {
  cartCount.textContent = getCart().reduce((sum, item) => sum + item.quantity, 0);
}

function isStoreOpen(store, date = new Date()) {
  const [start, end] = store.hours.split(' ~ ');
  const [startHour, startMinute] = start.split(':').map(Number);
  const [endHour, endMinute] = end.split(':').map(Number);
  const nowMinutes = date.getHours() * 60 + date.getMinutes();
  return nowMinutes >= startHour * 60 + startMinute && nowMinutes <= endHour * 60 + endMinute;
}

function getFilteredStores() {
  const search = state.search.toLowerCase();
  if (!search) return STORE_ITEMS;

  return STORE_ITEMS.filter((store) => {
    const text = `${store.name} ${store.shortName} ${store.address}`.toLowerCase();
    return text.includes(search);
  });
}

function getSelectedStore(stores = STORE_ITEMS) {
  return stores.find((store) => store.id === state.selectedId) || stores[0] || STORE_ITEMS[0];
}

function getRouteUrl(store) {
  return `https://map.kakao.com/link/search/${encodeURIComponent(store.name)}`;
}

function distanceKm(a, b) {
  const earthRadius = 6371;
  const toRad = (value) => (value * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return earthRadius * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function selectStore(storeId) {
  state.selectedId = storeId;
  renderLocator();
}

function renderMap(stores) {
  const selectedStore = getSelectedStore(stores);
  mapCenterLabel.textContent = selectedStore ? selectedStore.shortName : '검색 결과 없음';

  mapPins.innerHTML = stores
    .map(
      (store) => `
        <button
          class="map-pin ${store.id === state.selectedId ? 'is-active' : ''}"
          type="button"
          data-store-id="${escapeHtml(store.id)}"
          style="--x: ${store.x}%; --y: ${store.y}%"
          aria-label="${escapeHtml(store.name)} 선택"
        >
          <img src="../assets/images/momo-cutout-tight.png" alt="">
        </button>
      `
    )
    .join('');

  if (!selectedStore) {
    mapInfoCard.hidden = true;
    return;
  }

  mapInfoCard.hidden = false;
  mapInfoCard.style.setProperty('--card-x', `${Math.min(selectedStore.x + 4, 64)}%`);
  mapInfoCard.style.setProperty('--card-y', `${Math.max(selectedStore.y - 28, 6)}%`);
  mapInfoCard.innerHTML = `
    <h3>${escapeHtml(selectedStore.name)}</h3>
    <p>${escapeHtml(selectedStore.address)}</p>
    <p>${escapeHtml(selectedStore.hours)} · ⭐ ${selectedStore.rating}</p>
  `;
}

function renderStoreList(stores) {
  storeCount.textContent = stores.length;
  emptyState.hidden = stores.length > 0;

  renderList(
    storeList,
    stores,
    (store) => {
      const open = isStoreOpen(store);
      return `
        <article class="store-card ${store.id === state.selectedId ? 'is-active' : ''} ${open ? '' : 'is-closed'}" data-store-id="${escapeHtml(store.id)}">
          <div class="store-photo">
            <img src="${escapeHtml(store.photo)}" alt="${escapeHtml(store.name)} 매장 사진">
          </div>
          <div class="store-body">
            <div class="status-line">
              <span class="open-badge">${open ? '영업 중' : '영업 종료'}</span>
              <span class="rating">⭐ ${store.rating}</span>
            </div>
            <h3>${escapeHtml(store.name)}</h3>
            <address>${escapeHtml(store.address)}</address>
            <div class="store-meta">
              <span>${escapeHtml(store.hours)}</span>
              <span>☎ ${escapeHtml(store.phone)}</span>
            </div>
            <p class="store-phone">${store.features.map(escapeHtml).join(' · ')}</p>
            <div class="store-actions">
              <a class="route-button" href="${getRouteUrl(store)}" target="_blank" rel="noreferrer">길찾기</a>
              <button class="detail-button" type="button" data-detail-id="${escapeHtml(store.id)}">상세보기</button>
            </div>
          </div>
        </article>
      `;
    }
  );
}

function renderRecommendation() {
  if (!state.recommendedId) {
    recommendBox.hidden = true;
    return;
  }

  const store = STORE_ITEMS.find((item) => item.id === state.recommendedId);
  if (!store) return;

  recommendBox.hidden = false;
  recommendBox.innerHTML = `현재 위치 기준 추천 매장: <strong>${escapeHtml(store.name)}</strong>`;
}

function renderLocator() {
  const stores = getFilteredStores();
  if (stores.length && !stores.some((store) => store.id === state.selectedId)) {
    state.selectedId = stores[0].id;
  }

  renderMap(stores);
  renderStoreList(stores);
  renderRecommendation();
}

function runSearch(keyword) {
  state.search = keyword.trim();
  searchInput.value = state.search;
  state.recommendedId = '';
  renderLocator();
}

function recommendNearestStore(position) {
  const user = {
    lat: position.coords.latitude,
    lng: position.coords.longitude
  };
  const nearest = STORE_ITEMS.map((store) => ({
    ...store,
    distance: distanceKm(user, store)
  })).sort((a, b) => a.distance - b.distance)[0];

  state.search = '';
  searchInput.value = '';
  state.selectedId = nearest.id;
  state.recommendedId = nearest.id;
  renderLocator();
}

function recommendFallbackStore() {
  state.search = '';
  searchInput.value = '';
  state.selectedId = 'gangnam';
  state.recommendedId = 'gangnam';
  renderLocator();
}

function openDetail(storeId) {
  const store = STORE_ITEMS.find((item) => item.id === storeId);
  if (!store) return;

  const open = isStoreOpen(store);
  detailContent.innerHTML = `
    <div class="detail-hero">
      <img src="${escapeHtml(store.photo)}" alt="${escapeHtml(store.name)} 매장 사진">
      <div>
        <span class="open-badge">${open ? '영업 중' : '영업 종료'}</span>
        <h2 id="detailTitle">${escapeHtml(store.name)}</h2>
        <address>${escapeHtml(store.address)}</address>
        <p>${store.features.map(escapeHtml).join(' · ')}</p>
        <dl class="detail-facts">
          <div><dt>영업시간</dt><dd>${escapeHtml(store.hours)}</dd></div>
          <div><dt>전화번호</dt><dd>${escapeHtml(store.phone)}</dd></div>
          <div><dt>별점</dt><dd>⭐ ${store.rating}</dd></div>
        </dl>
        <div class="store-actions">
          <a class="route-button" href="${getRouteUrl(store)}" target="_blank" rel="noreferrer">길찾기</a>
          <button class="detail-button" type="button" data-modal-select="${escapeHtml(store.id)}">지도에서 보기</button>
        </div>
      </div>
    </div>
  `;
  detailModal.hidden = false;
}

function closeDetail() {
  detailModal.hidden = true;
}

searchForm.addEventListener('submit', (event) => {
  event.preventDefault();
  runSearch(searchInput.value);
});

searchInput.addEventListener('input', (event) => {
  runSearch(event.target.value);
});

quickKeywords.addEventListener('click', (event) => {
  const button = event.target.closest('[data-keyword]');
  if (!button) return;
  runSearch(button.dataset.keyword);
});

mapPins.addEventListener('click', (event) => {
  const pin = event.target.closest('[data-store-id]');
  if (!pin) return;
  selectStore(pin.dataset.storeId);
});

storeList.addEventListener('click', (event) => {
  const detailButton = event.target.closest('[data-detail-id]');
  if (detailButton) {
    openDetail(detailButton.dataset.detailId);
    return;
  }

  const card = event.target.closest('[data-store-id]');
  if (!card || event.target.closest('a')) return;
  selectStore(card.dataset.storeId);
  map.scrollIntoView({ behavior: 'smooth', block: 'center' });
});

nearbyButton.addEventListener('click', () => {
  if (!navigator.geolocation) {
    recommendFallbackStore();
    return;
  }

  navigator.geolocation.getCurrentPosition(recommendNearestStore, recommendFallbackStore, {
    enableHighAccuracy: true,
    timeout: 6000
  });
});

mapFocusButton.addEventListener('click', () => {
  state.search = '';
  searchInput.value = '';
  renderLocator();
  map.focus();
  map.scrollIntoView({ behavior: 'smooth', block: 'center' });
});

detailCloseButton.addEventListener('click', closeDetail);

detailModal.addEventListener('click', (event) => {
  if (event.target === detailModal) closeDetail();

  const selectButton = event.target.closest('[data-modal-select]');
  if (!selectButton) return;
  selectStore(selectButton.dataset.modalSelect);
  closeDetail();
  map.scrollIntoView({ behavior: 'smooth', block: 'center' });
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') closeDetail();
});

updateCartCount();
renderLocator();
