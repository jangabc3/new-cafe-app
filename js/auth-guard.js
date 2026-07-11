(() => {
  const CURRENT_USER_KEY = 'momoCurrentUser';
  const script = document.currentScript;
  const redirect = script?.dataset.redirect || 'my/index.html';

  let currentUser = null;
  try {
    currentUser = JSON.parse(localStorage.getItem(CURRENT_USER_KEY) || 'null');
  } catch {
    localStorage.removeItem(CURRENT_USER_KEY);
  }

  if (currentUser) return;

  const scriptUrl = script?.src || new URL('js/auth-guard.js', document.baseURI).href;
  const projectRoot = new URL('../', scriptUrl);
  const loginUrl = new URL('login.html', projectRoot);
  loginUrl.searchParams.set('redirect', redirect);
  loginUrl.searchParams.set('message', 'login-required');
  window.location.replace(loginUrl.href);
})();
