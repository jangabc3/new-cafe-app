(() => {
  const CURRENT_USER_KEY = 'momoCurrentUser';
  const script = document.currentScript;
  const redirect = script?.dataset.redirect || 'my/index.html';

  let currentUser = null;
  try {
    currentUser = JSON.parse(localStorage.getItem(CURRENT_USER_KEY) || 'null');
    if (currentUser && (!Number(currentUser.sessionExpiresAt) || Date.now() >= Number(currentUser.sessionExpiresAt))) {
      currentUser = null;
      localStorage.removeItem(CURRENT_USER_KEY);
    }
  } catch {
    localStorage.removeItem(CURRENT_USER_KEY);
  }

  if (currentUser) return;

  const loginUrl = new URL('/login.html', window.location.origin);
  loginUrl.searchParams.set('redirect', redirect);
  loginUrl.searchParams.set('message', 'login-required');
  window.location.replace(loginUrl.href);
})();
