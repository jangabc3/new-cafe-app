(() => {
  if (!window.MomoAdmin) return;

  MomoAdmin.requireAdmin();
  const admin = MomoAdmin.user;
  const pageSize = 8;
  let currentPage = 1;
  let toastTimer = null;

  const elements = {
    total: document.querySelector('#totalCount'),
    selling: document.querySelector('#sellingCount'),
    paused: document.querySelector('#pausedCount'),
    soldOut: document.querySelector('#soldOutCount'),
    availability: document.querySelector('#availabilityFilter'),
    category: document.querySelector('#categoryFilter'),
    price: document.querySelector('#priceFilter'),
    sort: document.querySelector('#sortFilter'),
    search: document.querySelector('#searchInput'),
    grid: document.querySelector('#menuGrid'),
    result: document.querySelector('#resultCount'),
    pagination: document.querySelector('#pagination'),
    toast: document.querySelector('#menuToast')
  };

  Object.values(CATEGORIES).forEach((category) => {
    elements.category.add(new Option(category.name, category.id));
  });

  const isPaused = (menu) => menu.isSaleStopped === true || menu.isActive === false || menu.available === false;
  const imagePath = (menu) => {
    const source = String(menu.image || 'assets/images/momo-face-cute.png');
    if (/^(https?:|data:|\/)/.test(source)) return source;
    return `/${source.replace(/^(\.\.\/|\.\/)+/, '')}`;
  };
  const menuState = (menu) => {
    if (isPaused(menu)) return '판매 중지';
    if (menu.isSoldOut) return '품절';
    return '판매 중';
  };
  const showToast = (message) => {
    clearTimeout(toastTimer);
    elements.toast.textContent = message;
    elements.toast.hidden = false;
    toastTimer = setTimeout(() => { elements.toast.hidden = true; }, 2400);
  };

  const getFilteredMenus = (all) => {
    const term = elements.search.value.trim().toLowerCase();
    let rows = all.filter((menu) => {
      const paused = isPaused(menu);
      const availabilityMatches = elements.availability.value === 'all'
        || (elements.availability.value === 'selling' && !paused && !menu.isSoldOut)
        || (elements.availability.value === 'paused' && paused)
        || (elements.availability.value === 'soldout' && menu.isSoldOut);
      const categoryMatches = elements.category.value === 'all' || menu.category === elements.category.value;
      const price = Math.max(0, Number(menu.price) || 0);
      const priceMatches = elements.price.value === 'all'
        || (elements.price.value === 'under5000' && price < 5000)
        || (elements.price.value === '5000to6999' && price >= 5000 && price < 7000)
        || (elements.price.value === 'over7000' && price >= 7000);
      const text = `${menu.name || ''} ${menu.englishName || ''} ${menu.description || ''}`.toLowerCase();
      return availabilityMatches && categoryMatches && priceMatches && (!term || text.includes(term));
    });

    if (elements.sort.value === 'priceAsc') rows.sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
    if (elements.sort.value === 'priceDesc') rows.sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0));
    if (elements.sort.value === 'name') rows.sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''), 'ko'));
    return rows;
  };

  const renderPagination = (totalPages) => {
    if (totalPages <= 1) {
      elements.pagination.innerHTML = '';
      return;
    }
    const pages = Array.from({ length: totalPages }, (_, index) => index + 1);
    elements.pagination.innerHTML = `
      <button type="button" data-page="${currentPage - 1}" ${currentPage === 1 ? 'disabled' : ''} aria-label="이전 페이지">‹</button>
      ${pages.map((page) => `<button type="button" data-page="${page}" ${page === currentPage ? 'aria-current="page"' : ''}>${page}</button>`).join('')}
      <button type="button" data-page="${currentPage + 1}" ${currentPage === totalPages ? 'disabled' : ''} aria-label="다음 페이지">›</button>`;
  };

  const render = () => {
    const all = getMenus();
    elements.total.textContent = all.length;
    elements.selling.textContent = all.filter((menu) => !isPaused(menu) && !menu.isSoldOut).length;
    elements.paused.textContent = all.filter(isPaused).length;
    elements.soldOut.textContent = all.filter((menu) => menu.isSoldOut).length;

    const rows = getFilteredMenus(all);
    const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
    currentPage = Math.min(currentPage, totalPages);
    const visible = rows.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    elements.result.textContent = `${rows.length}개의 메뉴`;
    elements.grid.hidden = rows.length === 0;
    elements.grid.innerHTML = visible.map((menu) => {
      const paused = isPaused(menu);
      const cardClass = paused ? 'is-paused' : menu.isSoldOut ? 'is-soldout' : '';
      const availabilityLabel = menu.isSoldOut ? '판매 재개' : '품절 처리';
      return `<article class="admin-menu-card ${cardClass}">
        <a class="menu-image" href="/admin/menus/detail.html?id=${encodeURIComponent(menu.id)}" aria-label="${escapeHtml(menu.name)} 상세 보기">
          <img src="${escapeHtml(imagePath(menu))}" alt="${escapeHtml(menu.name)}" loading="lazy">
          <span class="menu-state">${menuState(menu)}</span>
        </a>
        <div class="menu-copy">
          <small>${escapeHtml(getCategoryName(menu.category))}</small>
          <h2>${escapeHtml(menu.name)}</h2>
          <p>${escapeHtml(menu.description || menu.englishName || '메뉴 설명이 없습니다.')}</p>
          <strong>${formatPrice(Number(menu.price) || 0)}</strong>
        </div>
        <div class="menu-actions">
          <a href="/admin/menus/edit.html?id=${encodeURIComponent(menu.id)}">수정</a>
          <button class="availability-action" type="button" data-soldout="${escapeHtml(menu.id)}">${availabilityLabel}</button>
          <button class="delete-action" type="button" data-delete="${escapeHtml(menu.id)}">삭제</button>
        </div>
      </article>`;
    }).join('');
    renderPagination(totalPages);
  };

  [elements.availability, elements.category, elements.price, elements.sort, elements.search].forEach((control) => {
    control.addEventListener('input', () => { currentPage = 1; render(); });
  });

  elements.pagination.addEventListener('click', (event) => {
    const button = event.target.closest('[data-page]');
    if (!button || button.disabled) return;
    currentPage = Number(button.dataset.page) || 1;
    render();
    document.querySelector('.catalog-section').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  elements.grid.addEventListener('click', (event) => {
    const soldOutButton = event.target.closest('[data-soldout]');
    const deleteButton = event.target.closest('[data-delete]');
    if (soldOutButton) {
      const menu = getMenuById(soldOutButton.dataset.soldout);
      if (!menu) return;
      const next = !menu.isSoldOut;
      if (!confirm(`“${menu.name}” 메뉴를 ${next ? '품절 처리' : '판매 재개'}할까요?`)) return;
      try {
        setMenuSoldOut(menu.id, next, admin);
        showToast(`“${menu.name}” 메뉴가 ${next ? '품절 처리' : '판매 재개'}되었습니다.`);
        render();
      } catch (error) {
        alert(error.message);
      }
    }
    if (deleteButton) {
      MomoAdmin.requireAdmin();
      const menu = getMenuById(deleteButton.dataset.delete);
      if (!menu || !confirm(`“${menu.name}” 메뉴를 삭제할까요?\n삭제한 메뉴는 복구할 수 없습니다.`)) return;
      deleteMenu(menu.id);
      window.MomoAdminActivity?.log(admin, 'DELETE_MENU', 'MENU', menu.id, '메뉴 삭제', { name: menu.name, category: menu.category, price: menu.price }, null);
      showToast(`“${menu.name}” 메뉴가 삭제되었습니다.`);
      render();
    }
  });

  render();
})();
