(() => {
  const scriptUrl = document.currentScript?.src || new URL('js/footer.js', document.baseURI).href;
  const projectRoot = new URL('../', scriptUrl);
  const url = (path) => new URL(path, projectRoot).href;

  if (!document.querySelector('link[href$="css/footer.css"], link[href*="/css/footer.css"]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = url('css/footer.css');
    document.head.appendChild(link);
  }

  const footer = document.createElement('footer');
  footer.className = 'landing-footer';
  footer.innerHTML = `
    <div class="footer-inner">
      <div class="footer-main">
        <section class="footer-brand" aria-label="MOMO COFFEE 브랜드 정보">
          <a class="footer-logo" href="${url('index.html')}" aria-label="MOMO COFFEE 홈">
            <span class="footer-logo-mark" aria-hidden="true"><img src="${url('assets/images/momo-header-logo.png?v=5')}" alt=""></span>
            <strong>MOMO COFFEE</strong>
          </a>
          <p class="footer-slogan">한 잔의 커피,<br>하루의 <em>행복.</em></p>
          <p class="footer-description">따뜻한 커피와 달콤한 디저트로<br>당신의 하루에 작은 행복을 전합니다.</p>
          <div class="footer-social" aria-label="MOMO COFFEE 소셜 채널">
            <a href="#" aria-label="Instagram">
              <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"></rect><circle cx="12" cy="12" r="4"></circle><circle cx="17.5" cy="6.5" r="1"></circle></svg>
            </a>
            <a href="#" aria-label="YouTube">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 8.2a3 3 0 0 0-2.1-2.1C17 5.6 12 5.6 12 5.6s-5 0-6.9.5A3 3 0 0 0 3 8.2 31 31 0 0 0 2.6 12 31 31 0 0 0 3 15.8a3 3 0 0 0 2.1 2.1c1.9.5 6.9.5 6.9.5s5 0 6.9-.5a3 3 0 0 0 2.1-2.1 31 31 0 0 0 .4-3.8 31 31 0 0 0-.4-3.8Z"></path><path d="m10 9 5 3-5 3Z"></path></svg>
            </a>
            <a href="#" aria-label="KakaoTalk"><span aria-hidden="true">TALK</span></a>
          </div>
        </section>

        <nav class="footer-navigation" aria-label="푸터 내비게이션">
          <section class="footer-column">
            <h2>MENU</h2>
            <a href="${url('menus/list.html?category=drink')}">음료</a>
            <a href="${url('menus/list.html?category=season')}">시즌 메뉴</a>
            <a href="${url('menus/list.html?category=dessert')}">디저트</a>
          </section>
          <section class="footer-column">
            <h2>STORE</h2>
            <a href="${url('stores/finder.html')}">매장 찾기</a>
            <a href="${url('stores/finder.html')}">신규 매장</a>
          </section>
          <section class="footer-column">
            <h2>COMMUNITY</h2>
            <a href="${url('community/notice.html')}">공지사항</a>
            <a href="${url('community/event.html')}">이벤트</a>
            <a href="${url('community/faq.html')}">FAQ</a>
          </section>
          <section class="footer-column">
            <h2>BRAND</h2>
            <a href="${url('story/brand.html')}">브랜드 소개</a>
            <a href="${url('story/bi.html')}">Brand Identity (BI)</a>
          </section>
          <section class="footer-column footer-customer">
            <h2>CUSTOMER CENTER</h2>
            <a href="tel:1234-5678"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 3 5 5c-1 1 0 5 4 9s8 5 9 4l2-3-4-2-2 2c-2-1-4-3-5-5l2-2Z"></path></svg>1234-5678</a>
            <p><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"></circle><path d="M12 7v6l4 2"></path></svg>09:00 - 18:00</p>
            <a href="mailto:momo@coffee.com"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"></rect><path d="m4 7 8 6 8-6"></path></svg>momo@coffee.com</a>
          </section>
        </nav>
      </div>

      <div class="footer-bottom">
        <small>© 2026 MOMO COFFEE. ALL RIGHTS RESERVED.</small>
        <nav aria-label="약관 및 정책">
          <a href="#">이용약관</a>
          <a href="#">개인정보처리방침</a>
        </nav>
      </div>
    </div>
  `;

  document.querySelectorAll('.landing-footer').forEach((element) => element.remove());
  const mains = [...document.querySelectorAll('main')];
  const main = mains[mains.length - 1];
  if (main) {
    main.insertAdjacentElement('afterend', footer);
  } else {
    document.body.appendChild(footer);
  }
})();

