// document.addEventListener('DOMContentLoaded', () => {
//   class VariantPicker extends HTMLElement {
//     constructor() {
//       super();
//       this.form = this.querySelector('.variant-picker__form');
//       this.productForm = this.closest('product-form');
//       this.variants = JSON.parse(this.dataset.variants || '[]');
//       this.productUrl = this.dataset.productUrl;
//       this.attachEvents();
//     }

//     attachEvents() {
//       if (!this.form) return;

//       this.form.addEventListener('change', (e) => {
//         // 1️⃣ Visually update pills
//         const group = e.target.name;
//         const pills = this.form.querySelectorAll(`input[name="${group}"]`);
//         pills.forEach(pill => pill.closest('.variant-pill').classList.remove('is-selected'));
//         e.target.closest('.variant-pill')?.classList.add('is-selected');

//         // 2️⃣ Build selected options array
//         const selectedOptions = Array.from(
//           this.form.querySelectorAll('input[type="radio"]:checked, select')
//         ).map(el => el.value);

//         // 3️⃣ Find matching variant
//         const matchingVariant = this.variants.find(variant =>
//           variant.options.every((opt, i) => opt === selectedOptions[i])
//         );

//         if (!matchingVariant) return;

//         // 4️⃣ Update hidden input in product form
//         const hiddenInput = this.productForm?.querySelector('[name="id"]');
//         if (hiddenInput) hiddenInput.value = matchingVariant.id;

//         // 5️⃣ Update URL
//         const url = new URL(window.location);
//         url.searchParams.set('variant', matchingVariant.id);
//         window.history.replaceState({}, '', url);

//         // 6️⃣ Dispatch variant change event (Dawn listens for this!)
//         this.dispatchEvent(new CustomEvent('variant:change', {
//           detail: { variant: matchingVariant },
//           bubbles: true
//         }));
//       });
//     }
//   }

//   customElements.define('variant-picker', VariantPicker);
// });


if (!customElements.get('variant-picker')) {
  customElements.define('variant-picker', class VariantPicker extends HTMLElement {
    constructor() {
      super();
      this.addEventListener('change', this.onVariantChange.bind(this));
    }

    onVariantChange() {
      this.updateOptions();
      this.updateMasterId();
      this.updateURL();
      this.updateVariantInput();
      this.renderProductInfo();
    }

    updateOptions() {
      this.options = Array.from(this.querySelectorAll('select, input[type="radio"]:checked'), (el) => el.value);
    }

    getVariantData() {
      this.variantData = this.variantData || JSON.parse(this.querySelector('[data-product-variants]').textContent);
      return this.variantData;
    }

    updateMasterId() {
      this.currentVariant = this.getVariantData().find((variant) => {
        return !variant.options.map((option, index) => this.options[index] === option).includes(false);
      });
    }

    updateURL() {
      if (!this.currentVariant || this.dataset.updateUrl === 'false') return;
      window.history.replaceState({ }, '', `${this.dataset.productUrl}?variant=${this.currentVariant.id}`);
    }

    updateVariantInput() {
      const productForms = document.querySelectorAll(`form[action="/cart/add"]`);
      productForms.forEach((form) => {
        const input = form.querySelector('input[name="id"]');
        input.value = this.currentVariant ? this.currentVariant.id : '';
        input.dispatchEvent(new Event('change', { bubbles: true }));
      });
    }

    renderProductInfo() {
      this.dispatchEvent(new CustomEvent('variant:change', {
        bubbles: true,
        detail: { variant: this.currentVariant }
      }));
    }
  });
}