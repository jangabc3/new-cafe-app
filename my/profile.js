(() => {
  const USERS_KEY = 'momoUsers';
  const CURRENT_USER_KEY = 'momoCurrentUser';
  const loginUrl = '../login.html?redirect=my/profile.html&message=login-required';

  const text = {
    nameRequired: '\uC774\uB984\uC744 \uC785\uB825\uD574\uC8FC\uC138\uC694.',
    phoneRequired: '\uC5F0\uB77D\uCC98\uB97C \uC785\uB825\uD574\uC8FC\uC138\uC694.',
    passwordRequired: '\uC0C8 \uBE44\uBC00\uBC88\uD638\uB97C \uC785\uB825\uD574\uC8FC\uC138\uC694.',
    passwordMismatch: '\uC0C8 \uBE44\uBC00\uBC88\uD638\uAC00 \uC77C\uCE58\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.',
    loadError: '\uD68C\uC6D0 \uC815\uBCF4\uB97C \uBD88\uB7EC\uC62C \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.',
    notFound: '\uAC00\uC785\uB41C \uD68C\uC6D0 \uC815\uBCF4\uB97C \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.',
    saved: '\uD68C\uC6D0 \uC815\uBCF4\uAC00 \uC815\uC0C1\uC801\uC73C\uB85C \uC218\uC815\uB418\uC5C8\uC2B5\uB2C8\uB2E4.',
    greeting: (name) => `\uC548\uB155\uD558\uC138\uC694, ${name}\uB2D8`
  };

  const readJson = (key, fallback) => {
    try {
      return JSON.parse(localStorage.getItem(key)) ?? fallback;
    } catch {
      return fallback;
    }
  };

  const currentUser = readJson(CURRENT_USER_KEY, null);
  if (!currentUser) {
    window.location.replace(loginUrl);
    return;
  }

  const form = document.querySelector('#profileForm');
  const notice = document.querySelector('#profileNotice');
  const emailInput = form.elements.email;
  const nameInput = form.elements.name;
  const phoneInput = form.elements.phone;

  emailInput.value = currentUser.email || '';
  nameInput.value = currentUser.name || '';
  phoneInput.value = currentUser.phone || '';

  const clearFeedback = () => {
    notice.hidden = true;
    notice.textContent = '';
    notice.classList.remove('is-error');
    form.querySelectorAll('.profile-error').forEach((element) => {
      element.textContent = '';
    });
    form.querySelectorAll('[aria-invalid="true"]').forEach((element) => {
      element.removeAttribute('aria-invalid');
    });
  };

  const setError = (name, message) => {
    const field = form.elements.namedItem(name);
    const error = form.querySelector(`[data-error-for="${name}"]`);
    field?.setAttribute('aria-invalid', 'true');
    if (error) error.textContent = message;
  };

  const showNotice = (message, isError = false) => {
    notice.textContent = message;
    notice.hidden = false;
    notice.classList.toggle('is-error', isError);
    notice.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    clearFeedback();

    const data = new FormData(form);
    const name = String(data.get('name') || '').trim();
    const phone = String(data.get('phone') || '').trim();
    const password = String(data.get('password') || '');
    const passwordConfirm = String(data.get('passwordConfirm') || '');
    let isValid = true;

    if (!name) {
      setError('name', text.nameRequired);
      isValid = false;
    }
    if (!phone) {
      setError('phone', text.phoneRequired);
      isValid = false;
    }
    if (password || passwordConfirm) {
      if (!password) {
        setError('password', text.passwordRequired);
        isValid = false;
      }
      if (password !== passwordConfirm) {
        setError('passwordConfirm', text.passwordMismatch);
        isValid = false;
      }
    }
    if (!isValid) return;

    const users = readJson(USERS_KEY, []);
    if (!Array.isArray(users)) {
      showNotice(text.loadError, true);
      return;
    }

    const userIndex = users.findIndex((user) =>
      String(user.email || '').toLowerCase() === String(currentUser.email || '').toLowerCase()
    );
    if (userIndex < 0) {
      showNotice(text.notFound, true);
      return;
    }

    const updatedUser = {
      ...users[userIndex],
      name,
      phone
    };
    if (password) updatedUser.password = password;

    users[userIndex] = updatedUser;
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updatedUser));

    form.elements.password.value = '';
    form.elements.passwordConfirm.value = '';
    document.querySelectorAll('.auth-greeting').forEach((element) => {
      element.textContent = text.greeting(updatedUser.name);
    });
    showNotice(text.saved);
  });
})();