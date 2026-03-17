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

      swiper.slideTo(targetIndex, 400);

      if (swiper.thumbs && swiper.thumbs.swiper) {
        swiper.thumbs.swiper.slideTo(targetIndex);

        swiper.thumbs.swiper.slides.forEach(slide => {
          slide.classList.remove('is-active');
        });

        const activeThumb = swiper.thumbs.swiper.slides[targetIndex];
        if (activeThumb) {
          activeThumb.classList.add('is-active');
        }
      }

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

  function getSelectedOptions(form) {
    const options = [];
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

  function findVariant(variants, selectedOptions) {
    return variants.find(v =>
      v.options.every((opt, i) => opt === selectedOptions[i])
    ) || null;
  }

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

  // ✅ Availability states update karo
  function updateAvailabilityStates(pickerEl, variants, selectedOptions) {
    pickerEl.querySelectorAll('.variant-option').forEach(function (optionEl, optionIndex) {
      optionEl.querySelectorAll('.variant-pill').forEach(function (pill) {
        const input = pill.querySelector('input[type="radio"]');
        if (!input) return;

        const value = input.value;

        // Check: is any variant available with this value + other selected options?
        const isAvailable = variants.some(function (v) {
          return v.options.every(function (opt, i) {
            if (i === optionIndex) return opt === value;
            return !selectedOptions[i] || opt === selectedOptions[i];
          }) && v.available;
        });

        pill.classList.toggle('is-unavailable', !isAvailable);

        // Unavailable pill click block karo
        if (!isAvailable) {
          pill.setAttribute('aria-disabled', 'true');
        } else {
          pill.removeAttribute('aria-disabled');
        }
      });
    });
  }

  function dispatchVariantChange(pickerEl, variant) {
    pickerEl.dispatchEvent(new CustomEvent('variant:change', {
      bubbles: true,
      detail: { variant }
    }));
  }

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

  function initPicker(pickerEl) {
    const variants = getVariants(pickerEl);
    if (!variants.length) return;

    const form = pickerEl.querySelector('.variant-picker__form');
    if (!form) return;

    const initialOptions = getSelectedOptions(form);
    const initialVariant = findVariant(variants, initialOptions);
    if (initialVariant) {
      updatePillStates(pickerEl, initialOptions);
      updateAvailabilityStates(pickerEl, variants, initialOptions);
      dispatchVariantChange(pickerEl, initialVariant);
      updateURL(pickerEl, initialVariant);
    }

    form.addEventListener('change', function (e) {
      const selectedOptions = getSelectedOptions(form);
      const matchedVariant = findVariant(variants, selectedOptions);

      updatePillStates(pickerEl, selectedOptions);
      updateAvailabilityStates(pickerEl, variants, selectedOptions);
      dispatchVariantChange(pickerEl, matchedVariant);
      updateURL(pickerEl, matchedVariant);
    });
  }

  function initAllPickers(root) {
    (root || document).querySelectorAll('variant-picker').forEach(initPicker);
  }

  document.addEventListener('DOMContentLoaded', () => initAllPickers());

  document.addEventListener('shopify:section:load', e => initAllPickers(e.target));
  document.addEventListener('shopify:section:select', e => initAllPickers(e.target));

})();