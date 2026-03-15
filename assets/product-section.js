window.ProductMediaSwipers = window.ProductMediaSwipers || [];

function destroyProductMediaSwipers() {
  window.ProductMediaSwipers.forEach(swiper => {
    if (swiper && swiper.destroy) {
      swiper.destroy(true, true);
    }
  });
  window.ProductMediaSwipers = [];
}

function initProductMedia(section) {
  if (!section) return;

  const isMobile = window.matchMedia('(max-width: 749px)').matches;
  const mediaContainer = section.querySelector('.product-media');
  if (!mediaContainer) return;

  // FIX: Sirf active container (Desktop ya Mobile) ko target karein
  const activeContainer = isMobile 
    ? section.querySelector('.media-mobile') 
    : section.querySelector('.media-desktop');

  if (!activeContainer) return;

  const wrapper = activeContainer.querySelector('.product-media-layout');
  if (!wrapper) return;

  const desktopLayout = mediaContainer.dataset.desktopLayout;
  const mobileLayout = mediaContainer.dataset.mobileLayout;
  const layoutType = isMobile ? mobileLayout : desktopLayout;

  // Layout classes update
  wrapper.classList.remove('product-media-layout--grid', 'product-media-layout--slideshow', 'product-media-layout--carousel');
  wrapper.classList.add(`product-media-layout--${layoutType}`);
  
  if (layoutType === 'grid') {
    return; // Grid ke liye swiper nahi chahiye
  }

  const mainSwiperEl = wrapper.querySelector('.product-swiper');
  if (!mainSwiperEl) return;

  /* ---------- THUMBNAILS ---------- */
  let thumbsSwiper = null;
  const thumbsEl = wrapper.querySelector('.product-thumbs');

  if (thumbsEl) {
    const isVertical = !isMobile && (thumbsEl.classList.contains('thumbs-left') || thumbsEl.classList.contains('thumbs-right'));
    
    // Pehle purana instance khatam karein agar exist karta hai
    if (thumbsEl.swiper) thumbsEl.swiper.destroy(true, true);

    thumbsSwiper = new Swiper(thumbsEl, {
      direction: isVertical ? 'vertical' : 'horizontal',
      spaceBetween: 8,
      slidesPerView: 'auto',
      freeMode: true,
      watchSlidesProgress: true,
      mousewheel: isVertical,
    });
    window.ProductMediaSwipers.push(thumbsSwiper);
  }

  /* ---------- MAIN SWIPER ---------- */
  const isCarousel = layoutType === 'carousel';

  const mainSwiper = new Swiper(mainSwiperEl, {
    loop: false,
    slidesPerView: isCarousel ? 1.2 : 1,
    centeredSlides: false,
    spaceBetween: 12,
    grabCursor: true,
    navigation: {
      nextEl: wrapper.querySelector('.swiper-button-next'),
      prevEl: wrapper.querySelector('.swiper-button-prev'),
    },
    thumbs: {
      swiper: thumbsSwiper,
    },
    zoom: { maxRatio: 2 },
    observer: true,
    observeParents: true,
    breakpoints: {
      750: {
        slidesPerView: isCarousel ? 1.3 : 1,
        spaceBetween: 20,
      },
    },
  });

  window.ProductMediaSwipers.push(mainSwiper);
}


/* ---------- INIT ALL PRODUCT SECTIONS ---------- */
function initAllProductMedia() {
  if (typeof Swiper === 'undefined') return;

  destroyProductMediaSwipers();

  document.querySelectorAll('.shopify-section').forEach(section => {
    if (section.querySelector('.product-media-layout')) {
      initProductMedia(section);
    }
  });
}

/* ---------- DOM READY ---------- */
document.addEventListener('DOMContentLoaded', initAllProductMedia);

/* ---------- SIZE GUIDE MODAL (Dynamic & Accessible) ---------- */
document.addEventListener('DOMContentLoaded', function(){

  // Handle all size guide triggers
  document.querySelectorAll('[data-size-trigger]').forEach(trigger => {

    const sectionEl = trigger.closest('.shopify-section');
    if(!sectionEl) return;

    const modal = sectionEl.querySelector('.product-size-modal');
    if(!modal) return;

    const closeBtn = modal.querySelector('[data-size-close]');

    // Store the trigger element inside modal
    modal._trigger = trigger;

    // OPEN MODAL
    trigger.addEventListener('click', () => {
      modal.setAttribute('aria-hidden', 'false');
      trigger.setAttribute('aria-expanded', 'true');

      // Focus first focusable element inside modal
      const focusableEls = modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      if(focusableEls.length) focusableEls[0].focus();

      // Add focus trap
      modal.addEventListener('keydown', trapFocus);
    });

    // CLOSE MODAL FUNCTION
    const closeModal = () => {
      modal.setAttribute('aria-hidden', 'true');
      if(modal._trigger) modal._trigger.setAttribute('aria-expanded', 'false');
      if(modal._trigger) modal._trigger.focus();
      modal.removeEventListener('keydown', trapFocus);
    };

    // Close button
    if(closeBtn) closeBtn.addEventListener('click', closeModal);

    // Click outside modal
    modal.addEventListener('click', (e) => {
      if(e.target === modal) closeModal();
    });

    // ESC key close (global listener)
    document.addEventListener('keydown', (e) => {
      if(e.key === "Escape" && modal.getAttribute('aria-hidden') === "false") closeModal();
    });

    // ---------- Focus Trap Function ----------
    function trapFocus(e){
      if(e.key !== "Tab") return;
      const focusableEls = modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      if(!focusableEls.length) return;

      const firstEl = focusableEls[0];
      const lastEl = focusableEls[focusableEls.length -1];

      if(e.shiftKey){ // Shift + Tab
        if(document.activeElement === firstEl){
          e.preventDefault();
          lastEl.focus();
        }
      } else { // Tab
        if(document.activeElement === lastEl){
          e.preventDefault();
          firstEl.focus();
        }
      }
    }

  });

});

/* ---------- PRODUCT DESCRIPTION TOGGLE (Section Scoped) ---------- */
document.addEventListener('DOMContentLoaded', function(){
  document.querySelectorAll('.shopify-section').forEach(sectionEl => {
    const toggleBtn = sectionEl.querySelector('[data-desc-toggle]');
    const descContent = sectionEl.querySelector('[data-desc-content]');
    if(!toggleBtn || !descContent) return;

    const fullText = descContent.innerHTML.trim();
    if(!fullText){
      toggleBtn.style.display = "none";
      return;
    }

    const words = fullText.split(/\s+/);
    const limit = 40;
    if(words.length <= limit){
      toggleBtn.style.display = "none";
      return;
    }

    const truncatedText = words.slice(0, limit).join(" ") + "...";
    let expanded = false;
    descContent.innerHTML = truncatedText;
    toggleBtn.setAttribute("aria-expanded","false");

    toggleBtn.addEventListener("click", function(){
      if(expanded){
        descContent.innerHTML = truncatedText;
        toggleBtn.textContent = "Read more";
        toggleBtn.setAttribute("aria-expanded","false");
        expanded = false;
      } else {
        descContent.innerHTML = fullText;
        toggleBtn.textContent = "Read less";
        toggleBtn.setAttribute("aria-expanded","true");
        expanded = true;
      }
    });
  });
});

/* ---------- SHOPIFY CUSTOMIZER SUPPORT ---------- */
document.addEventListener('shopify:section:load', e => {
  if (e.target.querySelector('.product-media-layout')) {
    initProductMedia(e.target);
  }
});

document.addEventListener('shopify:section:select', e => {
  if (e.target.querySelector('.product-media-layout')) {
    initProductMedia(e.target);
  }
});

document.addEventListener('shopify:section:reorder', initAllProductMedia);

/* ---------- RESPONSIVE RE-INIT ---------- */
let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(initAllProductMedia, 300);
});


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