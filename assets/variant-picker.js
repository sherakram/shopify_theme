document.addEventListener('DOMContentLoaded', () => {
  class VariantPicker extends HTMLElement {
    constructor() {
      super();
      this.form = this.querySelector('.variant-picker__form');
      this.productForm = this.closest('product-form');
      this.variants = JSON.parse(this.dataset.variants || '[]');
      this.productUrl = this.dataset.productUrl;
      this.attachEvents();
    }

    attachEvents() {
      if (!this.form) return;

      this.form.addEventListener('change', (e) => {
        // 1️⃣ Visually update pills
        const group = e.target.name;
        const pills = this.form.querySelectorAll(`input[name="${group}"]`);
        pills.forEach(pill => pill.closest('.variant-pill').classList.remove('is-selected'));
        e.target.closest('.variant-pill')?.classList.add('is-selected');

        // 2️⃣ Build selected options array
        const selectedOptions = Array.from(
          this.form.querySelectorAll('input[type="radio"]:checked, select')
        ).map(el => el.value);

        // 3️⃣ Find matching variant
        const matchingVariant = this.variants.find(variant =>
          variant.options.every((opt, i) => opt === selectedOptions[i])
        );

        if (!matchingVariant) return;

        // 4️⃣ Update hidden input in product form
        const hiddenInput = this.productForm?.querySelector('[name="id"]');
        if (hiddenInput) hiddenInput.value = matchingVariant.id;

        // 5️⃣ Update URL
        const url = new URL(window.location);
        url.searchParams.set('variant', matchingVariant.id);
        window.history.replaceState({}, '', url);

        // 6️⃣ Dispatch variant change event (Dawn listens for this!)
        this.dispatchEvent(new CustomEvent('variant:change', {
          detail: { variant: matchingVariant },
          bubbles: true
        }));
      });
    }
  }

  customElements.define('variant-picker', VariantPicker);
});

