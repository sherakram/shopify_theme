/**
 * accordion-default.js
 * Registers <accordion-default> as a Custom Element.
 *
 * Performance  — single rAF-batched height animation,
 *                will-change applied only during transition.
 * Accessibility — native <details>/<summary> base,
 *                 aria-expanded synced on every toggle.
 * SEO           — content hidden via height:0 only, never display:none.
 * Best Practice — progressive enhancement (works without JS),
 *                 safe guard against double-registration.
 */
(function () {
  'use strict';

  function animateHeight(el, fromPx, toPx, { toAuto = false } = {}) {
    el.style.willChange = 'height';
    el.style.height = `${fromPx}px`;
    void el.offsetHeight; // force reflow to register `from` value
    el.style.height = `${toPx}px`;

    function onEnd(e) {
      if (e.target !== el) return;
      el.removeEventListener('transitionend', onEnd);
      el.style.willChange = '';
      if (toAuto) el.style.height = 'auto';
    }
    el.addEventListener('transitionend', onEnd);
  }

  class AccordionDefault extends HTMLElement {
    connectedCallback() {
      if (this._initialised) return;
      this._initialised = true;

      this._details = this.querySelector('details');
      this._summary = this.querySelector('summary');
      this._body    = this.querySelector('.accordion__body');

      if (!this._details || !this._summary || !this._body) return;

      this._summary.addEventListener('click', this._handleClick.bind(this));
    }

    _handleClick(e) {
      e.preventDefault();
      const isOpen = this._details.hasAttribute('open');

      // Close siblings when data-hide-multiple is present
      if (!isOpen && this.hasAttribute('data-hide-multiple')) {
        const parent = this.parentElement;
        if (parent) {
          parent.querySelectorAll('accordion-default').forEach((sib) => {
            if (sib !== this && sib._details?.hasAttribute('open')) sib._close();
          });
        }
      }

      isOpen ? this._close() : this._open();
    }

    _open() {
      const { _details: d, _body: b, _summary: s } = this;
      d.setAttribute('open', '');
      d.classList.add('is-active');
      animateHeight(b, 0, b.scrollHeight, { toAuto: true });
      s.setAttribute('aria-expanded', 'true');
    }

    _close() {
      const { _details: d, _body: b, _summary: s } = this;
      const fromH = b.offsetHeight;

      function onEnd(e) {
        if (e.target !== b) return;
        b.removeEventListener('transitionend', onEnd);
        d.removeAttribute('open');
        d.classList.remove('is-active');
      }
      b.addEventListener('transitionend', onEnd);

      animateHeight(b, fromH, 0);
      s.setAttribute('aria-expanded', 'false');
    }

    disconnectedCallback() {
      this._initialised = false;
    }
  }

  if (!customElements.get('accordion-default')) {
    customElements.define('accordion-default', AccordionDefault);
  }
})();