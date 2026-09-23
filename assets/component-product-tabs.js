class ProductTabs extends HTMLElement {
  connectedCallback() {
    this.tabs = Array.from(this.querySelectorAll('[data-tab-trigger]'));
    this.panels = Array.from(this.querySelectorAll('[data-tab-panel]'));

    if (!this.tabs.length) return;

    this.tabs.forEach((tab, index) => {
      tab.addEventListener('click', () => this.activate(index));
      tab.addEventListener('keydown', (event) => this.onKeydown(event, index));
    });
  }

  activate(index) {
    const targetTab = this.tabs[index];
    if (!targetTab || targetTab.classList.contains('is-active')) return;

    const targetId = targetTab.getAttribute('data-tab-trigger');

    this.tabs.forEach((tab) => {
      const isTarget = tab === targetTab;
      tab.classList.toggle('is-active', isTarget);
      tab.setAttribute('aria-selected', String(isTarget));
      tab.setAttribute('tabindex', isTarget ? '0' : '-1');
    });

    this.panels.forEach((panel) => {
      const isTarget = panel.getAttribute('data-tab-panel') === targetId;
      panel.classList.toggle('is-active', isTarget);
      if (isTarget) {
        panel.removeAttribute('hidden');
      } else {
        panel.setAttribute('hidden', '');
      }
    });
  }

  onKeydown(event, index) {
    const keys = ['ArrowLeft', 'ArrowRight', 'Home', 'End'];
    if (!keys.includes(event.key)) return;

    event.preventDefault();
    let newIndex = index;

    if (event.key === 'ArrowRight') {
      newIndex = (index + 1) % this.tabs.length;
    } else if (event.key === 'ArrowLeft') {
      newIndex = (index - 1 + this.tabs.length) % this.tabs.length;
    } else if (event.key === 'Home') {
      newIndex = 0;
    } else if (event.key === 'End') {
      newIndex = this.tabs.length - 1;
    }

    this.tabs[newIndex].focus();
    this.activate(newIndex);
  }
}

document.querySelectorAll('.product-tabs').forEach((section) => {
  if (!section.hasAttribute('data-tabs-initialized')) {
    section.setAttribute('data-tabs-initialized', 'true');
    Object.setPrototypeOf(section, ProductTabs.prototype);
    section.connectedCallback();
  }
});
