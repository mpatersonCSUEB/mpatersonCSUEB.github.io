/* nav.js — shared sticky nav bar.
   Usage: Nav.render('home' | 'discover' | 'reviews' | 'login')
   Also provides Nav.getUser() after render resolves, and Nav.logout(). */
(function () {
  let cachedUser = null;
  let userPromise = null;

  function ensureUser() {
    if (userPromise) return userPromise;
    userPromise = API.getCurrentUser().then(
      (u) => { cachedUser = u; return u; },
      () => { cachedUser = null; return null; }
    );
    return userPromise;
  }

  function render(activeKey) {
    const mount = document.getElementById('nav-root');
    if (!mount) return;
    mount.innerHTML = '';

    const nav = document.createElement('nav');
    nav.className = 'nav';

    const inner = document.createElement('div');
    inner.className = 'nav__inner';

    // Logo
    const logo = document.createElement('a');
    logo.href = 'index.html';
    logo.className = 'nav__logo';
    logo.innerHTML = 'cine<span class="nav__logo-accent">critic</span>';
    inner.appendChild(logo);

    // Links + avatar container
    const right = document.createElement('div');
    right.className = 'nav__links';

    const linkHome = makeLink('Home', 'index.html', activeKey === 'home');
    const linkDiscover = makeLink('Discover', 'index.html#discover', activeKey === 'discover');
    right.appendChild(linkHome);
    right.appendChild(linkDiscover);

    // Authed-only link / logged-out CTA placeholder — populated after user loads.
    const authSlot = document.createElement('span');
    authSlot.className = 'nav__auth-slot';
    authSlot.style.display = 'inline-flex';
    authSlot.style.alignItems = 'center';
    authSlot.style.gap = '16px';
    right.appendChild(authSlot);

    inner.appendChild(right);
    nav.appendChild(inner);
    mount.appendChild(nav);

    ensureUser().then((user) => {
      authSlot.innerHTML = '';
      if (user) {
        const myReviews = makeLink('My Reviews', 'profile.html', activeKey === 'reviews');
        authSlot.appendChild(myReviews);

        const logoutBtn = document.createElement('button');
        logoutBtn.type = 'button';
        logoutBtn.className = 'nav__link';
        logoutBtn.textContent = 'Log out';
        logoutBtn.addEventListener('click', doLogout);
        authSlot.appendChild(logoutBtn);

        const avatarLink = document.createElement('a');
        avatarLink.href = 'profile.html';
        avatarLink.className = 'nav__avatar-btn';
        avatarLink.title = user.username;
        avatarLink.setAttribute('aria-label', 'View profile');
        avatarLink.appendChild(UI.renderAvatar(user.username));
        authSlot.appendChild(avatarLink);
      } else {
        const loginLink = makeLink('Log in', 'login.html', activeKey === 'login');
        authSlot.appendChild(loginLink);
      }
    });
  }

  function makeLink(label, href, active) {
    const a = document.createElement('a');
    a.href = href;
    a.textContent = label;
    a.className = 'nav__link' + (active ? ' nav__link--active' : '');
    return a;
  }

  async function doLogout() {
    try {
      await API.logout();
      cachedUser = null;
      userPromise = null;
      Toast.show('Logged out');
      setTimeout(() => { window.location.href = 'index.html'; }, 300);
    } catch (err) {
      Toast.show(err.message || 'Could not log out', 'error');
    }
  }

  window.Nav = {
    render,
    ensureUser,
    getUser: () => cachedUser,
    logout: doLogout
  };
})();
