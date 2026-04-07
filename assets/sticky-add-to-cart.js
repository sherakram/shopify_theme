/**
 * product-sticky-cart.js
 *
 * Responsibilities:
 *  1. Watch the main buy buttons via IntersectionObserver — show the bar
 *     when they scroll out of view, hide when they return.
 *  2. Sync variant data (price + option labels + button state) whenever
 *     the shopper picks a different variant.
 *  3. Clean up properly in Shopify design mode so the editor stays stable.
 *
 * This file is loaded with `defer` so it never blocks page rendering.
 * It is only loaded when the merchant has the feature enabled, so there
 * is zero cost when it is turned off.
 */

(function () {
  'use strict';

  /* ============================================================
     StickyCart class — one instance per product section
     ============================================================ */
  class StickyCart {
    constructor(sectionId) {
      this.sectionId = sectionId;

      /* DOM references */
      this.bar        = document.getElementById(`product-sticky-cart-${sectionId}`);
      this.trigger    = document.querySelector(`#product-form-${sectionId} .product-form__buttons`);
      this.priceEl    = this.bar?.querySelector('[data-sticky-price]');
      this.optionEls  = this.bar?.querySelectorAll('[data-sticky-option]');
      this.addBtn     = this.bar?.querySelector('[data-sticky-add-btn]');
      this.btnText    = this.addBtn?.querySelector('.product__sticky-cart-btn-text');

      /* Bail early if required elements are missing */
      if (!this.bar || !this.trigger) return;

      this._observer = null;
      this._init();
    }

    /* ----------------------------------------------------------
       Initialise observer + variant listener
       ---------------------------------------------------------- */
    _init() {
      this._initObserver();
      this._initVariantSync();
    }

    /* ----------------------------------------------------------
       IntersectionObserver
       Show bar when buy buttons leave the viewport.
       Hide bar when buy buttons re-enter the viewport.
       ---------------------------------------------------------- */
    _initObserver() {
      this._observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              this._hide();
            } else {
              /*
               * On mobile, only show after the user has scrolled at least
               * half a viewport height. This avoids the bar popping up
               * immediately on products with long images.
               */
              const isMobile = window.matchMedia('(max-width: 749px)').matches;
              if (isMobile && window.scrollY < window.innerHeight * 0.5) return;

              this._show();
            }
          });
        },
        {
          /*
           * threshold: 0.2 means the observer fires when 20% of the
           * buy-buttons element enters/leaves the viewport.
           * This prevents the bar flickering on and off at the exact edge.
           */
          threshold: 0.2,
        }
      );

      this._observer.observe(this.trigger);
    }

    /* ----------------------------------------------------------
       Show / hide helpers
       CSS handles the animation via transform transition.
       inert attribute prevents keyboard focus into a hidden bar.
       ---------------------------------------------------------- */
    _show() {
      this.bar.classList.remove('is-hidden');
      this.bar.removeAttribute('inert');
      this.bar.setAttribute('aria-hidden', 'false');
    }

    _hide() {
      this.bar.classList.add('is-hidden');
      this.bar.setAttribute('inert', '');
      this.bar.setAttribute('aria-hidden', 'true');
    }

    /* ----------------------------------------------------------
       Variant sync
       Listens for the `variant:change` custom event dispatched by
       variant-picker.js whenever the shopper selects a new variant.
       Falls back gracefully if the event is never fired.
       ---------------------------------------------------------- */
    _initVariantSync() {
      const form = document.getElementById(`product-form-${this.sectionId}`);
      if (!form) return;

      form.addEventListener('variant:change', (event) => {
        const variant = event.detail?.variant;
        if (!variant) return;

        this._syncPrice(variant);
        this._syncOptions(variant);
        this._syncButton(variant);
      });
    }

    /* Update price — handles sale price + regular price */
    _syncPrice(variant) {
      if (!this.priceEl) return;

      const format = (cents) => {
        if (window.Shopify?.formatMoney) {
          return Shopify.formatMoney(
            cents,
            window.theme?.moneyFormat || '{{amount}}'
          );
        }
        /* Fallback: basic two-decimal formatting */
        return (cents / 100).toFixed(2);
      };

      let html = '';

      if (variant.compare_at_price && variant.compare_at_price > variant.price) {
        html += `<s class="price--compare">${format(variant.compare_at_price)}</s> `;
      }

      html += `<span class="price--current">${format(variant.price)}</span>`;

      this.priceEl.innerHTML = html;
    }

    /* Update each option label (Color, Size, etc.) */
    _syncOptions(variant) {
      if (!this.optionEls?.length || !variant.options) return;

      this.optionEls.forEach((el, index) => {
        el.textContent = variant.options[index] ?? '';
      });
    }

    /* Update button disabled state and label text */
    _syncButton(variant) {
      if (!this.addBtn) return;

      const available = variant.available;
      this.addBtn.disabled = !available;

      if (this.btnText) {
        this.btnText.textContent = available
          ? (window.theme?.strings?.addToCart || 'Add to cart')
          : (window.theme?.strings?.soldOut   || 'Sold out');
      }

      /* Keep aria-label in sync so screen readers announce the right state */
      const productTitle = this.bar
        .closest('[data-section-id]')
        ?.dataset.productTitle ?? '';

      if (productTitle) {
        this.addBtn.setAttribute(
          'aria-label',
          `${this.addBtn.querySelector('.product__sticky-cart-btn-text')?.textContent} — ${productTitle}`
        );
      }
    }

    /* ----------------------------------------------------------
       Destroy — called when section is removed in design mode
       ---------------------------------------------------------- */
    destroy() {
      if (this._observer) {
        this._observer.disconnect();
        this._observer = null;
      }
    }
  }

  /* ============================================================
     Registry — tracks instances so we can destroy them cleanly
     ============================================================ */
  const instances = new Map();

  function mount() {
    document.querySelectorAll('[id^="product-sticky-cart-"]').forEach((el) => {
      const sectionId = el.id.replace('product-sticky-cart-', '');

      /* Do not create a duplicate instance for an already-mounted section */
      if (instances.has(sectionId)) return;

      const instance = new StickyCart(sectionId);
      instances.set(sectionId, instance);
    });
  }

  function unmount(sectionId) {
    const instance = instances.get(sectionId);
    if (instance) {
      instance.destroy();
      instances.delete(sectionId);
    }
  }

  /* ============================================================
     Boot
     ============================================================ */
  document.addEventListener('DOMContentLoaded', mount);

  /* Shopify theme editor — re-mount on section load, clean up on unload */
  if (window.Shopify?.designMode) {
    document.addEventListener('shopify:section:load', (event) => {
      mount();
    });

    document.addEventListener('shopify:section:unload', (event) => {
      const sectionId = event.detail?.sectionId;
      if (sectionId) unmount(sectionId);
    });
  }

})();
