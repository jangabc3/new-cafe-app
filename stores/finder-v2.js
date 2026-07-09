const MOMO_STORES = [
  { name: '잠실점', city: '서울', district: '송파구', address: '서울 송파구 올림픽로 265', hours: '09:00 - 22:00', phone: '02-1234-5678', image: '../assets/images/store-jamsil.png', features: ['wifi', 'plug', 'parking'], label: 'BEST' },
  { name: '석촌호수점', city: '서울', district: '송파구', address: '서울 송파구 석촌호수로 148', hours: '09:00 - 22:00', phone: '02-2345-6789', image: '../assets/images/store-seokchon.png', features: ['wifi', 'plug'] },
  { name: '마곡점', city: '서울', district: '강서구', address: '서울 강서구 마곡중앙로 161', hours: '08:00 - 22:00', phone: '02-3456-7890', image: '../assets/images/store-magok.png', features: ['wifi', 'plug', 'parking'] },
  { name: '성수점', city: '서울', district: '성동구', address: '서울 성동구 연무장5길 7', hours: '09:00 - 22:00', phone: '02-4567-8901', image: '../assets/images/store-seongsu.png', features: ['wifi', 'plug'] },
  { name: '연남점', city: '서울', district: '마포구', address: '서울 마포구 동교로 236', hours: '09:00 - 23:00', phone: '02-5678-9012', image: '../assets/images/store-yeonnam.png', features: ['wifi', 'plug'] }
];

const city = document.querySelector('#cityFilter');
const district = document.querySelector('#districtFilter');
const keyword = document.querySelector('#storeKeyword');
const track = document.querySelector('#recommendedTrack');
const list = document.querySelector('#newStoreList');
const count = document.querySelector('#storeResultCount');
const empty = document.querySelector('#emptyStores');

const icon = (item) => ({ wifi: '<span title="Wi-Fi">⌁</span>', plug: '<span title="콘센트">ϟ</span>', parking: '<span title="주차">P</span>' }[item]);

track.innerHTML = MOMO_STORES.map((store) => `<article class="new-recommend-card"><div class="new-recommend-image">${store.label ? `<span>${store.label}</span>` : ''}<img src="${store.image}" alt="${store.name} 매장 정면"></div><h3>${store.name}</h3><address>${store.address}</address><p>${store.hours}</p></article>`).join('');

function renderStores() {
  const term = keyword.value.trim().toLowerCase();
  const filtered = MOMO_STORES.filter((store) => (!city.value || store.city === city.value) && (!district.value || store.district === district.value) && (!term || `${store.name} ${store.address}`.toLowerCase().includes(term)));
  count.textContent = `${filtered.length}개 매장`;
  empty.hidden = filtered.length > 0;
  list.innerHTML = filtered.map((store) => `<article class="new-store-row"><div class="new-store-summary"><img src="${store.image}" alt="${store.name}"><div><h3>${store.name}</h3><address>${store.address}</address></div></div><div class="new-feature-icons">${store.features.map(icon).join('')}</div><time>${store.hours}</time><a class="new-phone-link" href="tel:${store.phone.replaceAll('-', '')}">${store.phone}</a><a class="new-detail-link" href="https://map.kakao.com/link/search/${encodeURIComponent(`모모커피 ${store.name}`)}" target="_blank" rel="noreferrer">상세보기 <span>›</span></a></article>`).join('');
}

[city, district].forEach((element) => element.addEventListener('change', renderStores));
keyword.addEventListener('input', renderStores);
document.querySelector('#storePrev').addEventListener('click', () => track.parentElement.scrollBy({ left: -310, behavior: 'smooth' }));
document.querySelector('#storeNext').addEventListener('click', () => track.parentElement.scrollBy({ left: 310, behavior: 'smooth' }));
renderStores();
