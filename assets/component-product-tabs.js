(function () {
  if (window.__productTabsBound) return;
  window.__productTabsBound = true;

  function activate(tab) {
    const root = tab.closest('.product-tabs');
    if (!root || tab.classList.contains('is-active')) return;

    const targetId = tab.getAttribute('data-tab-trigger');

    root.querySelectorAll('[data-tab-trigger]').forEach((t) => {
      const isTarget = t === tab;
      t.classList.toggle('is-active', isTarget);
      t.setAttribute('aria-selected', String(isTarget));
      t.setAttribute('tabindex', isTarget ? '0' : '-1');
    });

    root.querySelectorAll('[data-tab-panel]').forEach((panel) => {
      const isTarget = panel.getAttribute('data-tab-panel') === targetId;
      panel.classList.toggle('is-active', isTarget);
      if (isTarget) {
        panel.removeAttribute('hidden');
      } else {
        panel.setAttribute('hidden', '');
      }
    });
  }

  document.addEventListener('click', (event) => {
    const tab = event.target.closest('[data-tab-trigger]');
    if (tab) activate(tab);
  });

  document.addEventListener('keydown', (event) => {
    const tab = event.target.closest('[data-tab-trigger]');
    if (!tab) return;

    const keys = ['ArrowLeft', 'ArrowRight', 'Home', 'End'];
    if (!keys.includes(event.key)) return;

    const root = tab.closest('.product-tabs');
    const tabs = Array.from(root.querySelectorAll('[data-tab-trigger]'));
    const index = tabs.indexOf(tab);
    let newIndex = index;

    if (event.key === 'ArrowRight') {
      newIndex = (index + 1) % tabs.length;
    } else if (event.key === 'ArrowLeft') {
      newIndex = (index - 1 + tabs.length) % tabs.length;
    } else if (event.key === 'Home') {
      newIndex = 0;
    } else if (event.key === 'End') {
      newIndex = tabs.length - 1;
    }

    event.preventDefault();
    tabs[newIndex].focus();
    activate(tabs[newIndex]);
  });

  document.addEventListener('shopify:block:select', (event) => {
    const blockId = event.detail && event.detail.blockId;
    if (!blockId) return;
    const tab = document.querySelector('[data-tab-trigger="' + CSS.escape(blockId) + '"]');
    if (tab) activate(tab);
  });
})();