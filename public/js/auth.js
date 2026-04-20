/* auth.js — login / register tabbed form. */
(function () {
  document.addEventListener('DOMContentLoaded', init);

  async function init() {
    Nav.render('login');

    // If already logged in, bounce to home.
    const existing = await Nav.ensureUser();
    if (existing) {
      window.location.replace('index.html');
      return;
    }

    const tabs = document.querySelectorAll('.auth-tab');
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const loginError = document.getElementById('login-error');
    const signupError = document.getElementById('signup-error');

    function activate(which) {
      tabs.forEach((t) => {
        const active = t.dataset.tab === which;
        t.classList.toggle('auth-tab--active', active);
        t.setAttribute('aria-selected', active ? 'true' : 'false');
      });
      loginForm.hidden = which !== 'login';
      signupForm.hidden = which !== 'signup';
      if (window.location.hash !== ('#' + which)) {
        history.replaceState(null, '', '#' + which);
      }
      loginError.textContent = '';
      signupError.textContent = '';
    }

    tabs.forEach((t) => t.addEventListener('click', () => activate(t.dataset.tab)));

    if (window.location.hash === '#signup') activate('signup');

    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      loginError.textContent = '';
      const email = document.getElementById('login-email').value.trim();
      const password = document.getElementById('login-password').value;
      if (!email || !password) {
        loginError.textContent = 'Email and password are required.';
        return;
      }
      const submit = loginForm.querySelector('button[type="submit"]');
      submit.disabled = true;
      submit.textContent = 'Logging in...';
      try {
        await API.login({ email, password });
        Toast.show('Welcome back');
        window.location.href = 'index.html';
      } catch (err) {
        loginError.textContent = err.message || 'Could not log in.';
        submit.disabled = false;
        submit.textContent = 'Log in';
      }
    });

    signupForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      signupError.textContent = '';
      const username = document.getElementById('signup-username').value.trim();
      const email = document.getElementById('signup-email').value.trim();
      const password = document.getElementById('signup-password').value;
      const confirm = document.getElementById('signup-confirm').value;

      if (!username || username.length < 2) {
        signupError.textContent = 'Username must be at least 2 characters.';
        return;
      }
      if (!email) {
        signupError.textContent = 'Email is required.';
        return;
      }
      if (password.length < 6) {
        signupError.textContent = 'Password must be at least 6 characters.';
        return;
      }
      if (password !== confirm) {
        signupError.textContent = 'Passwords do not match.';
        return;
      }

      const submit = signupForm.querySelector('button[type="submit"]');
      submit.disabled = true;
      submit.textContent = 'Creating...';
      try {
        await API.register({ username, email, password });
        Toast.show('Welcome to CineCritic');
        window.location.href = 'index.html';
      } catch (err) {
        signupError.textContent = err.message || 'Could not create account.';
        submit.disabled = false;
        submit.textContent = 'Create account';
      }
    });
  }
})();
