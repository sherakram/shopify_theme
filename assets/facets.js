(() => {
  'use strict';

  class FacetsHorizontal {
    constructor(form) {
      this.form = form;
      this.details = Array.from(form.querySelectorAll('[data-facet-dropdown]'));
      this.bind();
    }

    bind() {
      this.details.forEach((panel) => {
        panel.addEventListener('toggle', () => {
          if (panel.open) {
            this.details.forEach((other) => {
              if (other !== panel) other.open = false;
            });
          }
        });

        panel.querySelector('[data-facet-reset]')?.addEventListener('click', (event) => {
          event.preventDefault();
          panel.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
            checkbox.checked = false;
          });
          panel.querySelectorAll('input[type="number"]').forEach((input) => {
            input.value = '';
          });
          this.form.submit();
        });
      });

      document.addEventListener('click', (event) => {
        this.details.forEach((panel) => {
          if (panel.open && !panel.contains(event.target)) panel.open = false;
        });
      });

      document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
          this.details.forEach((panel) => { panel.open = false; });
        }
      });
    }
  }

  class FacetsDrawer {
    constructor(trigger, dialog) {
      this.trigger = trigger;
      this.dialog = dialog;
      this.bind();
    }

    bind() {
      this.trigger.addEventListener('click', () => this.open());

      this.dialog.querySelector('[data-facets-drawer-close]')?.addEventListener('click', () => this.close());

      this.dialog.addEventListener('click', (event) => {
        const panel = this.dialog.querySelector('.facets-drawer__panel');
        if (panel && !panel.contains(event.target)) this.close();
      });

      this.dialog.addEventListener('cancel', (event) => {
        event.preventDefault();
        this.close();
      });
    }

    open() {
      this.returnFocusEl = document.activeElement;
      this.dialog.showModal();
      document.documentElement.style.overflow = 'hidden';
    }

    close() {
      this.dialog.close();
      document.documentElement.style.overflow = '';
      if (this.returnFocusEl instanceof HTMLElement) this.returnFocusEl.focus();
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.facets--horizontal').forEach((form) => new FacetsHorizontal(form));

    document.querySelectorAll('[data-facets-drawer-trigger]').forEach((trigger) => {
      const dialogId = trigger.getAttribute('aria-controls');
      const dialog = dialogId ? document.getElementById(dialogId) : null;
      if (dialog) new FacetsDrawer(trigger, dialog);
    });
  });
})();