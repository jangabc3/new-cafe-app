const detailPanel = $('#detailPanel');
const pageTitle = $('#pageTitle');
const menuId = getQueryParam('id');
const menu = getMenuById(menuId);

function renderMissingMenu() {
  detailPanel.innerHTML = `
    <div class="detail-content">
      <h2>메뉴를 찾을 수 없습니다.</h2>
      <p class="detail-value">목록으로 돌아가 다시 선택해 주세요.</p>
      <div class="detail-actions">
        <a class="primary-button" href="list.html">목록으로 이동</a>
      </div>
    </div>
  `;
}

function renderMenuDetail() {
  pageTitle.textContent = menu.name;
  const imageMarkup = menu.image
    ? `<img src="${escapeHtml(menu.image)}" alt="${escapeHtml(menu.name)}">`
    : `<span class="menu-preview-fallback">${escapeHtml(menu.name.slice(0, 1))}</span>`;

  detailPanel.innerHTML = `
    <div class="menu-preview">${imageMarkup}</div>
    <div class="detail-content">
      <div class="detail-title-row">
        <div>
          <span class="category-pill">${escapeHtml(getCategoryName(menu.category))}</span>
          <h2>${escapeHtml(menu.name)}</h2>
        </div>
        <strong>${formatPrice(menu.price)}</strong>
      </div>

      <dl class="detail-list">
        <div>
          <dt class="detail-label">메뉴 ID</dt>
          <dd class="detail-value">${escapeHtml(menu.id)}</dd>
        </div>
        <div>
          <dt class="detail-label">카테고리</dt>
          <dd class="detail-value">${escapeHtml(getCategoryName(menu.category))}</dd>
        </div>
        <div>
          <dt class="detail-label">설명</dt>
          <dd class="detail-value">${escapeHtml(menu.description)}</dd>
        </div>
        <div>
          <dt class="detail-label">이미지 URL</dt>
          <dd class="detail-value">${menu.image ? escapeHtml(menu.image) : '등록된 이미지 없음'}</dd>
        </div>
      </dl>

      <div class="detail-actions">
        <a class="primary-button" href="edit.html?id=${encodeURIComponent(menu.id)}">수정</a>
        <a class="secondary-button" href="list.html">목록</a>
      </div>
    </div>
  `;
}

if (menu) {
  renderMenuDetail();
} else {
  renderMissingMenu();
}
