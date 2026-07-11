(() => {
  if (window.MomoAuthInitialized) return;
  window.MomoAuthInitialized = true;

  const USERS_KEY = 'momoUsers';
  const LAST_REGISTERED_USER_KEY = 'momoLastRegisteredUser';
  const CURRENT_USER_KEY = 'momoCurrentUser';
  const scriptUrl = document.currentScript?.src || new URL('js/auth.js', document.baseURI).href;
  const projectRoot = new URL('../', scriptUrl);
  const projectPath = projectRoot.pathname;

  const readJson = (key, fallback) => {
    try {
      const value = JSON.parse(localStorage.getItem(key));
      return value ?? fallback;
    } catch {
      return fallback;
    }
  };

  const getUsers = () => {
    const stored = readJson(USERS_KEY, []);
    const users = Array.isArray(stored) ? stored : Array.isArray(stored?.users) ? stored.users : [];
    const lastRegistered = readJson(LAST_REGISTERED_USER_KEY, null);

    if (lastRegistered?.email && !users.some((user) =>
      normalizeEmail(user.email) === normalizeEmail(lastRegistered.email)
    )) {
      users.push(lastRegistered);
    }

    return users.filter((user) => user && typeof user === 'object' && user.email);
  };

  const saveUsers = (users) => {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    return readJson(USERS_KEY, []).length === users.length;
  };

  const getCurrentUser = () => readJson(CURRENT_USER_KEY, null);

  const projectUrl = (relativePath) => new URL(relativePath, projectRoot).href;

  const showNotice = (message, type = 'error') => {
    const notice = document.querySelector('#authNotice');
    if (!notice) return;
    notice.textContent = message;
    notice.hidden = false;
    notice.classList.toggle('is-success', type === 'success');
  };

  const clearErrors = (form) => {
    form.querySelectorAll('.field-error').forEach((element) => {
      element.textContent = '';
    });
    form.querySelectorAll('[aria-invalid="true"]').forEach((element) => {
      element.removeAttribute('aria-invalid');
    });
  };

  const setError = (form, name, message) => {
    const field = form.elements.namedItem(name);
    const error = form.querySelector(`[data-error-for="${name}"]`);
    if (field instanceof HTMLElement) field.setAttribute('aria-invalid', 'true');
    if (error) error.textContent = message;
  };

  function normalizeEmail(email) {
    return String(email || '').normalize('NFKC').trim().toLowerCase();
  }

  const normalizePassword = (password) => String(password || '').normalize('NFC');

  const setupSignup = () => {
    const form = document.querySelector('#signupForm');
    if (!form) return;

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      clearErrors(form);

      const data = new FormData(form);
      const email = normalizeEmail(String(data.get('email') || ''));
      const password = normalizePassword(data.get('password'));
      const passwordConfirm = normalizePassword(data.get('passwordConfirm'));
      const name = String(data.get('name') || '').trim();
      const phone = String(data.get('phone') || '').trim();
      let isValid = true;

      if (!email) {
        setError(form, 'email', '이메일을 입력해주세요.');
        isValid = false;
      }
      if (!password) {
        setError(form, 'password', '비밀번호를 입력해주세요.');
        isValid = false;
      }
      if (!passwordConfirm) {
        setError(form, 'passwordConfirm', '비밀번호 확인을 입력해주세요.');
        isValid = false;
      } else if (password !== passwordConfirm) {
        setError(form, 'passwordConfirm', '비밀번호가 일치하지 않습니다.');
        isValid = false;
      }
      if (!name) {
        setError(form, 'name', '이름을 입력해주세요.');
        isValid = false;
      }
      if (!phone) {
        setError(form, 'phone', '휴대폰 번호를 입력해주세요.');
        isValid = false;
      }
      if (!isValid) return;

      const users = getUsers();
      if (users.some((user) => normalizeEmail(String(user.email || '')) === email)) {
        setError(form, 'email', '이미 가입된 이메일입니다.');
        return;
      }

      const newUser = {
        id: Date.now(),
        email,
        password,
        name,
        phone,
        createdAt: new Date().toISOString()
      };
      users.push(newUser);

      try {
        localStorage.setItem(LAST_REGISTERED_USER_KEY, JSON.stringify(newUser));
        if (!saveUsers(users)) throw new Error('User storage verification failed');
      } catch {
        showNotice('회원 정보를 저장하지 못했습니다. 브라우저 저장 공간을 확인한 뒤 다시 시도해주세요.');
        return;
      }

      window.location.href = projectUrl('login.html?registered=1');
    });
  };

  const safeRedirect = (value) => {
    if (!value) return projectUrl('index.html');
    try {
      const target = new URL(value, projectRoot);
      if (target.origin !== window.location.origin || !target.pathname.startsWith(projectPath)) {
        return projectUrl('index.html');
      }
      return target.href;
    } catch {
      return projectUrl('index.html');
    }
  };

  const setupLogin = () => {
    const form = document.querySelector('#loginForm');
    if (!form) return;

    const params = new URLSearchParams(window.location.search);
    if (params.get('registered') === '1') {
      showNotice('회원가입이 완료되었습니다. 로그인해주세요.', 'success');
    } else if (params.get('message') === 'login-required') {
      showNotice('로그인이 필요합니다.');
    }

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      clearErrors(form);

      const data = new FormData(form);
      const email = normalizeEmail(String(data.get('email') || ''));
      const password = normalizePassword(data.get('password'));
      let isValid = true;

      if (!email) {
        setError(form, 'email', '이메일을 입력해주세요.');
        isValid = false;
      }
      if (!password) {
        setError(form, 'password', '비밀번호를 입력해주세요.');
        isValid = false;
      }
      if (!isValid) return;

      const user = getUsers().find((candidate) =>
        normalizeEmail(candidate.email) === email && normalizePassword(candidate.password) === password
      );

      if (!user) {
        showNotice('이메일 또는 비밀번호가 올바르지 않습니다.');
        return;
      }

      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
      window.location.href = safeRedirect(params.get('redirect'));
    });
  };

  const updateHeader = () => {
    const currentUser = getCurrentUser();
    const loginLink = document.querySelector('.login-link, .unified-login');
    if (!loginLink) return;

    const actions = loginLink.parentElement;
    actions?.querySelectorAll('.auth-logout').forEach((button) => button.remove());
    actions?.querySelectorAll('.auth-greeting').forEach((element) => element.remove());

    if (!currentUser) {
      loginLink.hidden = false;
      loginLink.textContent = 'LOGIN';
      loginLink.setAttribute('href', projectUrl('login.html'));
      return;
    }

    loginLink.hidden = true;
    const greeting = document.createElement('a');
    greeting.className = 'auth-greeting';
    greeting.href = projectUrl('my/index.html');
    greeting.textContent = `${currentUser.name}님`;

    const logout = document.createElement('button');
    logout.className = 'auth-logout';
    logout.type = 'button';
    logout.textContent = 'LOGOUT';
    logout.addEventListener('click', () => {
      localStorage.removeItem(CURRENT_USER_KEY);
      window.location.href = projectUrl('index.html');
    });

    actions?.insertBefore(greeting, loginLink);
    actions?.insertBefore(logout, loginLink);
  };

  const protectMyPage = () => {
    const currentPath = window.location.pathname;
    const isMyPage = currentPath.endsWith('/my/index.html');
    const isProfilePage = currentPath.endsWith('/my/profile.html');
    if ((isMyPage || isProfilePage) && !getCurrentUser()) {
      const redirect = isProfilePage ? 'my/profile.html' : 'my/index.html';
      window.location.replace(projectUrl(`login.html?redirect=${redirect}&message=login-required`));
      return;
    }

    document.addEventListener('click', (event) => {
      const link = event.target.closest('a[href]');
      if (!link || getCurrentUser()) return;

      let target;
      try {
        target = new URL(link.href, window.location.href);
      } catch {
        return;
      }

      if (target.pathname.endsWith('/my/index.html') || target.pathname.endsWith('/my/profile.html')) {
        event.preventDefault();
        const redirect = target.pathname.endsWith('/my/profile.html') ? 'my/profile.html' : 'my/index.html';
        window.location.href = projectUrl(`login.html?redirect=${redirect}&message=login-required`);
      }
    }, true);
  };

  setupSignup();
  setupLogin();
  protectMyPage();
  updateHeader();

  window.MomoAuth = {
    getUsers,
    getCurrentUser,
    logout() {
      localStorage.removeItem(CURRENT_USER_KEY);
      window.location.href = projectUrl('index.html');
    }
  };
})();
