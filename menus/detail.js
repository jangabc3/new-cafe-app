const detailPanel = $('#detailPanel');
const cartCount = $('#cartCount');
const toast = $('#toast');
const queryMenuId = getQueryParam('id');
const savedMenuId = sessionStorage.getItem('momo_selected_menu_id');
const menuId = queryMenuId || savedMenuId;
const menu = getMenuById(menuId) || getMenuById(savedMenuId);

const optionState = {
  temperature: 'ICE',
  size: 'Regular',
  shot: 0,
  syrup: 0,
  bean: '산미 있는 원두',
  quantity: 1
};

if (menu) sessionStorage.setItem('momo_selected_menu_id', String(menu.id));

let toastTimer;

function getMenuImagePath(menu) {
  if (!menu.image) return '';
  if (menu.image.startsWith('http') || menu.image.startsWith('../')) return menu.image;
  return `../${menu.image}`;
}

function updateCartCount() {
  cartCount.textContent = getCart().reduce((sum, item) => sum + item.quantity, 0);
}

function getOptionPrice() {
  const sizePrice = optionState.size === 'Large' ? 1000 : 0;
  const beanPrice = optionState.bean === '디카페인' ? 500 : 0;
  return sizePrice + optionState.shot * 500 + optionState.syrup * 300 + beanPrice;
}

function showToast(message, mood = 'happy') {
  window.clearTimeout(toastTimer);
  toast.innerHTML = `
    <span class="mini-momo ${mood}" aria-hidden="true"><span></span></span>
    <span>${escapeHtml(message)}</span>
    <i aria-hidden="true">♡</i>
  `;
  toast.hidden = false;
  toast.classList.add('is-floating');
  toastTimer = window.setTimeout(() => {
    toast.hidden = true;
    toast.classList.remove('is-floating');
  }, 2200);
}

function renderMissingMenu() {
  detailPanel.classList.add('missing-panel');
  detailPanel.innerHTML = `
    <div class="detail-content">
      <span class="category-pill">Menu</span>
      <h1>메뉴를 찾을 수 없습니다.</h1>
      <p class="detail-description">메뉴 목록으로 돌아가 다시 선택해 주세요.</p>
      <div class="detail-actions"><a class="primary-button" href="/menus/list.html">목록으로 이동</a></div>
    </div>
  `;
}

function renderTotals() {
  if (menu.category === 'goods') {
    $('#quantityValue').textContent = optionState.quantity;
    $('#totalPrice').textContent = formatPrice(menu.price * optionState.quantity);
    return;
  }

  $('#quantityValue').textContent = optionState.quantity;
  $('#totalPrice').textContent = formatPrice((menu.price + getOptionPrice()) * optionState.quantity);
  $$('.segmented [data-option]').forEach((button) => {
    const { option, value } = button.dataset;
    button.classList.toggle('is-active', String(optionState[option]) === value);
  });
}

function getSelectedOptions() {
  if (['coffee', 'signature'].includes(menu.category)) {
    return {
      temperature: optionState.temperature,
      size: optionState.size,
      bean: optionState.bean,
      shot: optionState.shot,
      syrup: optionState.syrup
    };
  }
  if (['noncoffee', 'tea', 'season'].includes(menu.category)) {
    return { temperature: optionState.temperature, size: optionState.size };
  }
  return {};
}

function renderMenuDetail() {
  document.title = `${menu.name} | 모모커피`;
  const isGoods = menu.category === 'goods';
  const soldOut = menu.isSoldOut;
  const isCoffee = ['coffee', 'signature'].includes(menu.category);
  const isDrink = ['coffee', 'signature', 'noncoffee', 'tea', 'season'].includes(menu.category);
  detailPanel.innerHTML = `
    <div class="detail-media">
      ${
        menu.image
          ? `<img src="${escapeHtml(getMenuImagePath(menu))}" alt="${escapeHtml(menu.name)}">`
          : `<span>${escapeHtml(menu.emoji || menu.name.slice(0, 1))}</span>`
      }
    </div>
    <article class="detail-content">
      <span class="category-pill">${escapeHtml(getCategoryName(menu.category))}</span>${soldOut ? '<span class="soldout-detail-badge">품절</span>' : ''}
      <h1>${escapeHtml(menu.name)}</h1>
      <p class="detail-price">${formatPrice(menu.price)}</p>
      <p class="detail-description">${escapeHtml(menu.description)}</p>
      <div class="momo-order-reaction" id="momoReaction">
        <span class="mini-momo" aria-hidden="true"><span></span></span>
        <p>${isGoods ? '모모 굿즈를 장바구니에 담아보세요.' : '모모가 옵션을 기다리고 있어요. 취향에 맞게 골라주세요.'}</p>
      </div>
      ${soldOut ? '<p class="soldout-notice">현재 품절된 메뉴입니다.</p>' : ''}<div class="option-panel ${soldOut ? 'is-disabled' : ''}">
        ${
          !isDrink
            ? ''
            : `
              <div class="option-group">
                <span class="option-label">HOT / ICE</span>
                <div class="segmented"><button type="button" data-option="temperature" data-value="HOT">HOT</button><button type="button" data-option="temperature" data-value="ICE">ICE</button></div>
              </div>
              <div class="option-group">
                <span class="option-label">사이즈</span>
                <div class="segmented"><button type="button" data-option="size" data-value="Regular">Regular</button><button type="button" data-option="size" data-value="Large">Large +1,000원</button></div>
              </div>
            `
        }
        ${
          isCoffee
            ? `
              <div class="option-group">
                <span class="option-label">원두 선택</span>
                <div class="segmented bean-options">
                  <button type="button" data-option="bean" data-value="산미 있는 원두">산미 있는 원두</button>
                  <button type="button" data-option="bean" data-value="고소한 원두">고소한 원두</button>
                  <button type="button" data-option="bean" data-value="디카페인">디카페인 +500</button>
                </div>
              </div>
              <div class="option-group">
                <span class="option-label">커피 추가 옵션</span>
                <div class="segmented"><button type="button" data-adjust="shot" data-delta="1">샷 추가 +500</button><button type="button" data-adjust="syrup" data-delta="1">시럽 추가 +300</button></div>
              </div>
            `
            : ''
        }
        <div class="option-group">
          <span class="option-label">수량</span>
          <div class="quantity-control"><button class="icon-button" type="button" data-quantity="-1" ${soldOut ? 'disabled' : ''}>-</button><strong id="quantityValue" class="quantity-value">1</strong><button class="icon-button" type="button" data-quantity="1" ${soldOut ? 'disabled' : ''}>+</button></div>
        </div>
        <div class="total-row"><span>총 결제 금액</span><strong id="totalPrice">${formatPrice(menu.price)}</strong></div>
        <div class="detail-actions"><button class="secondary-button" type="button" id="addToCartButton" ${soldOut ? 'disabled' : ''}>${soldOut ? '품절' : '장바구니 담기'}</button><button class="primary-button" type="button" id="orderNowButton" ${soldOut ? 'disabled' : ''}>${soldOut ? '품절' : '바로 주문하기'}</button></div>
      </div>
    </article>
  `;
  renderTotals();
}

detailPanel.addEventListener('click', (event) => {
  if (menu?.isSoldOut && event.target.closest('button')) { showToast('현재 품절된 메뉴입니다.'); return; }
  const optionButton = event.target.closest('[data-option]');
  if (optionButton) {
    optionState[optionButton.dataset.option] = optionButton.dataset.value;
    renderTotals();
    return;
  }

  const adjustButton = event.target.closest('[data-adjust]');
  if (adjustButton) {
    const key = adjustButton.dataset.adjust;
    optionState[key] = Math.min(3, optionState[key] + Number(adjustButton.dataset.delta));
    $('#momoReaction p').textContent = `모모가 ${key === 'shot' ? '샷' : '시럽'} 추가를 기억했어요.`;
    showToast(`${key === 'shot' ? '샷' : '시럽'}을 추가했어요.`);
    renderTotals();
    return;
  }

  const quantityButton = event.target.closest('[data-quantity]');
  if (quantityButton) {
    optionState.quantity = Math.max(1, optionState.quantity + Number(quantityButton.dataset.quantity));
    renderTotals();
    return;
  }

  if (event.target.closest('#addToCartButton')) {
    addToCart(menu.id, optionState.quantity, getSelectedOptions());
    updateCartCount();
    $('#momoReaction p').textContent = `모모가 ${menu.name}을 장바구니에 포근히 담았어요.`;
    showToast(`모모가 ${menu.name}을 장바구니에 담았어요.`);
  }

  if (event.target.closest('#orderNowButton')) {
    const options=getSelectedOptions();
    const item={menuId:menu.id,name:menu.name,price:menu.price+getOptionPrice(),basePrice:menu.price,category:menu.category,image:menu.image,options:{...options,optionPrice:getOptionPrice()},quantity:optionState.quantity};
    localStorage.setItem('momoBuyNowItem',JSON.stringify(item));
    window.location.href = '/checkout/index.html?buyNow=1';
  }
});

if (menu) renderMenuDetail();
else renderMissingMenu();
updateCartCount();
