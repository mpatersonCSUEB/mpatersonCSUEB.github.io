/* toast.js — simple toast notifications.
   Usage: Toast.show('Review posted'); Toast.show('Oops', 'error'); */
(function () {
  function getRoot() {
    let root = document.getElementById('toast-root');
    if (!root) {
      root = document.createElement('div');
      root.id = 'toast-root';
      document.body.appendChild(root);
    }
    return root;
  }

  function show(message, type) {
    const root = getRoot();
    const el = document.createElement('div');
    el.className = 'toast' + (type === 'error' ? ' toast--error' : '');
    el.textContent = message;
    root.appendChild(el);

    const remove = () => {
      if (!el.parentNode) return;
      el.classList.add('toast--leaving');
      setTimeout(() => { if (el.parentNode) el.parentNode.removeChild(el); }, 220);
    };
    setTimeout(remove, 3000);
    el.addEventListener('click', remove);
  }

  window.Toast = { show };
})();
