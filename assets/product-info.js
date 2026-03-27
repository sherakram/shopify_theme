window.ProductMediaSwipers = window.ProductMediaSwipers || [];

function destroyProductMediaSwipers() {
  window.ProductMediaSwipers.forEach(swiper => {
    if (swiper && swiper.destroy) {
      swiper.destroy(true, true);
    }
  });
  window.ProductMediaSwipers = [];
}

// function initProductMedia(section) {
//   if (!section) return;

//   const isMobile = window.matchMedia('(max-width: 749px)').matches;
//   const mediaContainer = section.querySelector('.product-media');
//   if (!mediaContainer) return;

//   // FIX: Sirf active container (Desktop ya Mobile) ko target karein
//   const activeContainer = isMobile 
//     ? section.querySelector('.media-mobile') 
//     : section.querySelector('.media-desktop');

//   if (!activeContainer) return;

//   const wrapper = activeContainer.querySelector('.product-media-layout');
//   if (!wrapper) return;

//   const desktopLayout = mediaContainer.dataset.desktopLayout;
//   const mobileLayout = mediaContainer.dataset.mobileLayout;
//   const layoutType = isMobile ? mobileLayout : desktopLayout;

//   // Layout classes update
//   wrapper.classList.remove('product-media-layout--grid', 'product-media-layout--slideshow', 'product-media-layout--carousel');
//   wrapper.classList.add(`product-media-layout--${layoutType}`);
  
//   if (layoutType === 'grid') {
//     return; // Grid ke liye swiper nahi chahiye
//   }

//   const mainSwiperEl = wrapper.querySelector('.product-swiper');
//   if (!mainSwiperEl) return;

//   /* ---------- THUMBNAILS ---------- */
//   let thumbsSwiper = null;
//   const thumbsEl = wrapper.querySelector('.product-thumbs');

//   if (thumbsEl) {
//     const isVertical = !isMobile && (thumbsEl.classList.contains('thumbs-left') || thumbsEl.classList.contains('thumbs-right'));
    
//     // Pehle purana instance khatam karein agar exist karta hai
//     if (thumbsEl.swiper) thumbsEl.swiper.destroy(true, true);

//     thumbsSwiper = new Swiper(thumbsEl, {
//       direction: isVertical ? 'vertical' : 'horizontal',
//       spaceBetween: 8,
//       slidesPerView: 'auto',
//       freeMode: true,
//       watchSlidesProgress: true,
//       mousewheel: isVertical,
//     });
//     window.ProductMediaSwipers.push(thumbsSwiper);
//   }

//   /* ---------- MAIN SWIPER ---------- */
//   const isCarousel = layoutType === 'carousel';

//   const mainSwiper = new Swiper(mainSwiperEl, {
//     loop: false,
//     slidesPerView: isCarousel ? 1.2 : 1,
//     centeredSlides: false,
//     spaceBetween: 12,
//     grabCursor: true,
//     navigation: {
//       nextEl: wrapper.querySelector('.swiper-button-next'),
//       prevEl: wrapper.querySelector('.swiper-button-prev'),
//     },
//     thumbs: {
//       swiper: thumbsSwiper,
//     },
//     zoom: { maxRatio: 2 },
//     observer: true,
//     observeParents: true,
//     breakpoints: {
//       750: {
//         slidesPerView: isCarousel ? 1.3 : 1,
//         spaceBetween: 20,
//       },
//     },
//   });

//   window.ProductMediaSwipers.push(mainSwiper);
// }

function initProductMedia(section) {
  if (!section) return;

  const isMobile = window.matchMedia('(max-width: 749px)').matches;
  const mediaContainer = section.querySelector('.product-media');
  if (!mediaContainer) return;

  const activeContainer = isMobile
    ? section.querySelector('.media-mobile')
    : section.querySelector('.media-desktop');
  if (!activeContainer) return;

  const wrapper = activeContainer.querySelector('.product-media-layout');
  if (!wrapper) return;

  const desktopLayout = mediaContainer.dataset.desktopLayout;
  const mobileLayout  = mediaContainer.dataset.mobileLayout;
  const layoutType    = isMobile ? mobileLayout : desktopLayout;

  wrapper.classList.remove(
    'product-media-layout--grid',
    'product-media-layout--slideshow',
    'product-media-layout--carousel'
  );
  wrapper.classList.add(`product-media-layout--${layoutType}`);

  if (layoutType === 'grid') return;

  const mainSwiperEl = wrapper.querySelector('.product-swiper');
  if (!mainSwiperEl) return;

  /* ---------- THUMBNAILS ---------- */
  let thumbsSwiper = null;
  const thumbsEl = wrapper.querySelector('.product-thumbs');

  // Mobile pe left/right thumbs ko horizontal banana hai
  const isVertical =
    !isMobile &&
    thumbsEl &&
    (thumbsEl.classList.contains('thumbs-left') ||
      thumbsEl.classList.contains('thumbs-right'));

  if (thumbsEl) {
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
    thumbs: { swiper: thumbsSwiper },
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

  /* ---------- THUMB HEIGHT SYNC (Left / Right only) ---------- */
  // Jab left/right thumbs hote hain to unki height
  // main image ki actual height ke barabar honi chahiye
  if (isVertical && thumbsEl && thumbsSwiper) {
    
    function syncThumbHeight() {
      const mainH = mainSwiperEl.offsetHeight;
      if (!mainH) return;

      // Height seedha set karo
      thumbsEl.style.height = mainH + 'px';

      // Swiper ko batao ke height change hui hai
      thumbsSwiper.update();
    }

    // 1. Pehli image load hone par sync karo
    const firstImg = mainSwiperEl.querySelector('.swiper-slide img');
    if (firstImg && firstImg.complete) {
      // Image cached hai — seedha sync
      syncThumbHeight();
    } else if (firstImg) {
      firstImg.addEventListener('load', syncThumbHeight, { once: true });
    }

    // 2. Window resize par bhi sync karo
    window.addEventListener('resize', () => {
      clearTimeout(syncThumbHeight._timer);
      syncThumbHeight._timer = setTimeout(syncThumbHeight, 200);
    });

    // 3. Swiper images lazy load hone par bhi
    mainSwiper.on('lazyImageReady', syncThumbHeight);

    // 4. Safety fallback — 500ms baad bhi ek baar
    setTimeout(syncThumbHeight, 500);
  }
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