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


// if (!customElements.get('variant-picker')) {
//   customElements.define('variant-picker', class VariantPicker extends HTMLElement {
//     constructor() {
//       super();
//       this.addEventListener('change', this.onVariantChange.bind(this));
//     }

//     onVariantChange() {
//       this.updateOptions();
//       this.updateMasterId();
//       this.updateURL();
//       this.updateVariantInput();
//       this.renderProductInfo();
//     }

//     updateOptions() {
//       this.options = Array.from(this.querySelectorAll('select, input[type="radio"]:checked'), (el) => el.value);
//     }

//     getVariantData() {
//       this.variantData = this.variantData || JSON.parse(this.querySelector('[data-product-variants]').textContent);
//       return this.variantData;
//     }

//     updateMasterId() {
//       this.currentVariant = this.getVariantData().find((variant) => {
//         return !variant.options.map((option, index) => this.options[index] === option).includes(false);
//       });
//     }

//     updateURL() {
//       if (!this.currentVariant || this.dataset.updateUrl === 'false') return;
//       window.history.replaceState({ }, '', `${this.dataset.productUrl}?variant=${this.currentVariant.id}`);
//     }

//     updateVariantInput() {
//       const productForms = document.querySelectorAll(`form[action="/cart/add"]`);
//       productForms.forEach((form) => {
//         const input = form.querySelector('input[name="id"]');
//         input.value = this.currentVariant ? this.currentVariant.id : '';
//         input.dispatchEvent(new Event('change', { bubbles: true }));
//       });
//     }

//     renderProductInfo() {
//       this.dispatchEvent(new CustomEvent('variant:change', {
//         bubbles: true,
//         detail: { variant: this.currentVariant }
//       }));
//     }
//   });
// }


/* ---------- VARIANT CHANGES ---------- */
(function () {

  function onVariantChange(sectionEl, variant) {
    if (!variant || !variant.featured_media) return;
    
    const mediaId = String(variant.featured_media.id);

    /* ---------- GRID ---------- */
    const gridItem = sectionEl.querySelector(
      `.grid-media-item[data-media-id="${mediaId}"]`
    );

    if (gridItem) {
      gridItem.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest'
      });
    }

    const swiperEl = sectionEl.querySelector('.product-swiper');

    if (!swiperEl || !swiperEl.swiper) return;

    const swiper = swiperEl.swiper;

    const targetIndex = swiper.slides.findIndex(slide =>
      slide.dataset.mediaId === mediaId
    );

    if (targetIndex !== null) {

      // 1️⃣ Smooth animation (Theme Store friendly)
      swiper.slideTo(targetIndex, 400);

      // 2️⃣ Thumbnails ko bhi same slide par le jao
      if (swiper.thumbs && swiper.thumbs.swiper) {
        swiper.thumbs.swiper.slideTo(targetIndex);

        // 3️⃣ Active thumbnail class sync
        swiper.thumbs.swiper.slides.forEach(slide => {
          slide.classList.remove('is-active');
        });

        const activeThumb = swiper.thumbs.swiper.slides[targetIndex];
        if (activeThumb) {
          activeThumb.classList.add('is-active');
        }
      }

      // 4️⃣ Swiper update (hidden slides issue fix)
      swiper.update();
    }

  }

  document.addEventListener('variant:change', function (evt) {
    const sectionEl = evt.target.closest('.shopify-section');
    if (!sectionEl || !evt.detail || !evt.detail.variant) return;

    onVariantChange(sectionEl, evt.detail.variant);
    filterMediaByVariant(sectionEl, evt.detail.variant);

    /* -------- UPDATE BUY FORM VARIANT ID -------- */
    const buyForm = sectionEl.querySelector('form[action="/cart/add"]');
    if (buyForm) {
      const variantInput = buyForm.querySelector('input[name="id"]');
      if (variantInput) {
        variantInput.value = evt.detail.variant.id;
      }
    }

    /* -------- UPDATE SELECTED OPTION LABEL -------- */
    const picker = sectionEl.querySelector('variant-picker');
    if (!picker) return;

    const selectedOptions = evt.detail.variant.options;

    picker.querySelectorAll('[data-selected-value]').forEach((span, index) => {
      if (selectedOptions[index]) {
        span.textContent = selectedOptions[index];
      }
    });

  });

})();


function filterMediaByVariant(sectionEl, variant) {
  if (!variant) return;

  const variantId = String(variant.id);

  sectionEl.querySelectorAll('[data-media-id]').forEach(el => {
    const variantIds = el.dataset.variantIds;

    if (!variantIds) {
      el.style.display = '';
      return;
    }

    const ids = variantIds.split(',');
    el.style.display = ids.includes(variantId) ? '' : 'none';
  });
}


/* ---------- VARIANT PICKER INIT (Script Tag Approach) ---------- */
(function () {

  /* -- Variants script tag se read karo -- */
  function getVariants(pickerEl) {
    const scriptEl = pickerEl.querySelector('script[data-product-variants]');
    if (!scriptEl) return [];
    try {
      return JSON.parse(scriptEl.textContent);
    } catch (e) {
      console.error('[VariantPicker] JSON parse failed:', e);
      return [];
    }
  }

  /* -- Selected options form se collect karo -- */
  function getSelectedOptions(form) {
    const options = [];
    // Order maintain karne ke liye option positions use karo
    const optionNames = [];
    form.querySelectorAll('[name^="options["]').forEach(input => {
      const name = input.name;
      if (!optionNames.includes(name)) optionNames.push(name);
    });

    optionNames.forEach(name => {
      const select = form.querySelector(`select[name="${name}"]`);
      if (select) {
        options.push(select.value);
        return;
      }
      const checked = form.querySelector(`input[type="radio"][name="${name}"]:checked`);
      if (checked) options.push(checked.value);
    });

    return options;
  }

  /* -- Options match karke variant dhundo -- */
  function findVariant(variants, selectedOptions) {
    return variants.find(v =>
      v.options.every((opt, i) => opt === selectedOptions[i])
    ) || null;
  }

  /* -- Pill states update karo (is-selected, aria-checked) -- */
  function updatePillStates(pickerEl, selectedOptions) {
    pickerEl.querySelectorAll('.variant-option').forEach((optionEl, index) => {
      const selectedValue = selectedOptions[index];
      optionEl.querySelectorAll('.variant-pill').forEach(pill => {
        const input = pill.querySelector('input[type="radio"]');
        if (!input) return;
        const isSelected = input.value === selectedValue;
        pill.classList.toggle('is-selected', isSelected);
        pill.setAttribute('aria-checked', isSelected ? 'true' : 'false');
        pill.setAttribute('tabindex', isSelected ? '0' : '-1');
      });
    });
  }

  /* -- variant:change event dispatch karo -- */
  function dispatchVariantChange(pickerEl, variant) {
    pickerEl.dispatchEvent(new CustomEvent('variant:change', {
      bubbles: true,
      detail: { variant }
    }));
  }

  /* -- URL update karo (clean history) -- */
  function updateURL(pickerEl, variant) {
    const productUrl = pickerEl.dataset.productUrl;
    if (!productUrl) return;
    const url = new URL(window.location.href);
    if (variant) {
      url.searchParams.set('variant', variant.id);
    } else {
      url.searchParams.delete('variant');
    }
    window.history.replaceState({ variantId: variant?.id }, '', url.toString());
  }

  /* -- Single picker initialize karo -- */
  function initPicker(pickerEl) {
    const variants = getVariants(pickerEl);
    if (!variants.length) return;

    const form = pickerEl.querySelector('.variant-picker__form');
    if (!form) return;

    // Pehli baar current state se variant find karo
    const initialOptions = getSelectedOptions(form);
    const initialVariant = findVariant(variants, initialOptions);
    if (initialVariant) {
      updatePillStates(pickerEl, initialOptions);
      dispatchVariantChange(pickerEl, initialVariant);
      updateURL(pickerEl, initialVariant);
    }

    // User selection par
    form.addEventListener('change', function (e) {
      const selectedOptions = getSelectedOptions(form);
      const matchedVariant = findVariant(variants, selectedOptions);

      updatePillStates(pickerEl, selectedOptions);
      dispatchVariantChange(pickerEl, matchedVariant);
      updateURL(pickerEl, matchedVariant);
    });
  }

  /* -- Saray pickers initialize karo -- */
  function initAllPickers(root) {
    (root || document).querySelectorAll('variant-picker').forEach(initPicker);
  }

  /* -- DOM Ready -- */
  document.addEventListener('DOMContentLoaded', () => initAllPickers());

  /* -- Shopify Customizer support -- */
  document.addEventListener('shopify:section:load', e => initAllPickers(e.target));
  document.addEventListener('shopify:section:select', e => initAllPickers(e.target));

})();