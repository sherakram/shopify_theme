(function () {

  if (customElements.get('product-form')) return;

  customElements.define('product-form', class ProductForm extends HTMLElement {

    connectedCallback() {
      this.form         = this.querySelector('form');
      this.submitBtn    = this.querySelector('[type="submit"]');
      this.submitText   = this.submitBtn ? this.submitBtn.querySelector('.atc-text') : null;
      this.errorWrapper = this.querySelector('.product-form__error-message-wrapper');
      this.errorMsg     = this.querySelector('.product-form__error-message');
      this.variantInput = this.querySelector('.product-variant-id');
      this.payVariant   = this.querySelector('.payment-variant-id');

      if (!this.form || !this.submitBtn) return;

      // Quantity buttons
      var qtyInput = this.querySelector('input[name="quantity"]');
      var minus    = this.querySelector('.quantity-btn.minus');
      var plus     = this.querySelector('.quantity-btn.plus');

      if (minus && qtyInput) {
        minus.addEventListener('click', function () {
          var v = parseInt(qtyInput.value, 10) || 1;
          if (v > 1) qtyInput.value = v - 1;
        });
      }
      if (plus && qtyInput) {
        plus.addEventListener('click', function () {
          var v = parseInt(qtyInput.value, 10) || 1;
          qtyInput.value = v + 1;
        });
      }

      // Variant change listener
      document.addEventListener('variant:change', this.onVariantChange.bind(this));

      this.form.addEventListener('submit', this.onSubmit.bind(this), true);
    }

    onVariantChange(e) {
      var variant = e.detail && e.detail.variant;
      if (!variant) return;

      if (this.variantInput) this.variantInput.value = variant.id;
      if (this.payVariant)   this.payVariant.value   = variant.id;

      this.showError();

      if (this.submitBtn && this.submitText) {
        if (variant.available) {
          this.submitBtn.disabled = false;
          this.submitText.textContent = 'Add to cart';
        } else {
          this.submitBtn.disabled = true;
          this.submitText.textContent = 'Sold out';
        }
      }
    }

    onSubmit(e) {
      
      e.preventDefault();
      e.stopImmediatePropagation();

      if (this.submitBtn.getAttribute('aria-disabled') === 'true') return;

      this.showError();
      this.submitBtn.setAttribute('aria-disabled', 'true');

      var formData = new FormData(this.form);
      var self     = this;

      fetch('/cart/add.js', {
        method: 'POST',
        headers: { 'X-Requested-With': 'XMLHttpRequest' },
        body: formData
      })
      .then(function (r) { return r.json(); })
      .then(function (response) {

        // ✅ Shopify error (422, stock limit, etc)
        if (response.status) {
          self.showError(response.description || response.message);
          self.submitBtn.removeAttribute('aria-disabled');
          return;
        }

        // ✅ Success
        self.updateCartCount();
        self.showError();

        if (self.submitText) self.submitText.textContent = '✓ Added';
        setTimeout(function () {
          if (self.submitText) self.submitText.textContent = 'Add to cart';
          self.submitBtn.removeAttribute('aria-disabled');
        }, 2000);
      })
      .catch(function (err) {
        console.error('Cart error:', err);
        self.submitBtn.removeAttribute('aria-disabled');
      });
    }

    updateCartCount() {
      fetch('/cart.js')
        .then(function (r) { return r.json(); })
        .then(function (cart) {
          var el = document.querySelector('.cart-count');
          if (!el) return;
          el.textContent = cart.item_count;
          if (cart.item_count > 0) {
            el.classList.remove('is-empty');
          } else {
            el.classList.add('is-empty');
          }
        });
    }

    showError(msg) {
      if (!this.errorWrapper || !this.errorMsg) return;
      if (msg) {
        this.errorMsg.textContent = msg;
        this.errorWrapper.removeAttribute('hidden');
      } else {
        this.errorWrapper.setAttribute('hidden', '');
        this.errorMsg.textContent = '';
      }
    }

  });

})();