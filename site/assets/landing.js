(() => {
  'use strict';
  const dialog = document.getElementById('checkout-dialog');
  const buttons = document.querySelectorAll('[data-checkout]');
  const checkout = document.documentElement.getAttribute('data-checkout-url')?.trim() || '';
  buttons.forEach(button => button.addEventListener('click', () => {
    let target;
    try { target = new URL(checkout); } catch { target = null; }
    if (target?.protocol === 'https:' && !target.username && !target.password) {
      window.location.assign(target.href);
    } else if (dialog?.showModal) {
      dialog.showModal();
    } else {
      window.alert('Онлайн-оплата Balisha ещё подключается. Покупка пока недоступна.');
    }
  }));
  document.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', () => dialog?.close()));
  dialog?.addEventListener('click', event => {
    if (event.target === dialog) dialog.close();
  });
})();
