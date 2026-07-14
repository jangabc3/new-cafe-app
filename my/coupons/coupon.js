const couponUser = JSON.parse(localStorage.getItem('momoCurrentUser') || 'null');
const couponData = getMomoCouponsForUser(couponUser);

const statusMeta = {
  all: { label: '전체 쿠폰' },
  available: { label: '사용 가능', badge: '사용 가능' },
  used: { label: '사용 완료', badge: '사용 완료' },
  expired: { label: '기간 만료', badge: '기간 만료' }
};

const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (character) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
}[character]));

const tabs = document.querySelector('#couponTabs');
const list = document.querySelector('#couponList');
const empty = document.querySelector('#couponEmpty');
const summary = document.querySelector('#resultSummary');
const toast = document.querySelector('#couponToast');
let activeFilter = 'all';

function countFor(status) {
  return status === 'all' ? couponData.length : couponData.filter((coupon) => coupon.status === status).length;
}

function renderTabs() {
  tabs.innerHTML = Object.entries(statusMeta).map(([status, meta]) => `
    <button type="button" class="coupon-tab${activeFilter === status ? ' is-active' : ''}" data-filter="${status}" aria-pressed="${activeFilter === status}">
      <span>${meta.label}</span><b>${countFor(status)}</b>
    </button>
  `).join('');
}

function detailItem(label, value) {
  return `<div class="coupon-detail"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`;
}

function couponCard(coupon) {
  const disabled = coupon.status !== 'available';
  const actionText = coupon.status === 'used' ? '사용 완료' : coupon.status === 'expired' ? '기간 만료' : '사용하기';
  return `
    <article class="coupon-card is-${coupon.status}">
      <div class="coupon-ticket-face tone-${coupon.tone}">
        <span>${coupon.status === 'available' ? 'MOMO COUPON' : statusMeta[coupon.status].badge}</span>
        <strong>${escapeHtml(coupon.type)}</strong>
        <small>${escapeHtml(coupon.label)}</small>
      </div>
      <div class="coupon-card-body">
        <div class="coupon-copy">
          <span class="coupon-status">${statusMeta[coupon.status].badge}</span>
          <h3>${escapeHtml(coupon.title)}</h3>
          <p>${escapeHtml(coupon.description)}</p>
        </div>
        <div class="coupon-details">
          ${detailItem('최소 주문금액', coupon.minimum)}
          ${detailItem('최대 할인', coupon.maximum)}
          ${detailItem(coupon.dateLabel, coupon.date)}
        </div>
      </div>
      <div class="coupon-action">
        <span class="coupon-status">${statusMeta[coupon.status].badge}</span>
        <button type="button" data-use-coupon="${coupon.id}" ${disabled ? 'disabled' : ''}>${actionText}</button>
      </div>
    </article>`;
}

function renderCoupons() {
  const filtered = activeFilter === 'all' ? couponData : couponData.filter((coupon) => coupon.status === activeFilter);
  list.innerHTML = filtered.map(couponCard).join('');
  list.hidden = filtered.length === 0;
  empty.hidden = filtered.length !== 0;
  summary.textContent = `${statusMeta[activeFilter].label} ${filtered.length}장`;
}

function showToast(message) {
  toast.textContent = message;
  toast.hidden = false;
  toast.classList.add('is-visible');
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => {
    toast.classList.remove('is-visible');
    window.setTimeout(() => { toast.hidden = true; }, 250);
  }, 2200);
}

tabs.addEventListener('click', (event) => {
  const button = event.target.closest('[data-filter]');
  if (!button) return;
  activeFilter = button.dataset.filter;
  renderTabs();
  renderCoupons();
});

list.addEventListener('click', (event) => {
  const button = event.target.closest('[data-use-coupon]');
  if (!button) return;
  const coupon = couponData.find((item) => item.id === Number(button.dataset.useCoupon));
  if (coupon) {
    selectMomoCoupon(coupon.id);
    showToast(`‘${coupon.title}’ 쿠폰을 선택했습니다. 장바구니로 이동합니다.`);
    window.setTimeout(() => { window.location.href = '/basket/list.html'; }, 800);
  }
});

renderTabs();
renderCoupons();
