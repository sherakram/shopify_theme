// (function(){
  
//   function getVisibleLayout(sectionEl) {
//     return Array.from(
//       sectionEl.querySelectorAll('.product-media-layout')
//     ).find(el => getComputedStyle(el).display !== 'none');
//   }

//   function initSection(sectionEl){
    
//     const visibleLayout = getVisibleLayout(sectionEl);
//     if (!visibleLayout) return;

//     const mainEl = visibleLayout.querySelector('.product-swiper');
//     if (!mainEl || mainEl.swiper) return;

//     const isCarousel = mainEl.classList.contains('product-swiper--carousel');

//     // optional thumbs
//     const thumbsEl = visibleLayout.querySelector('.product-thumbs');
//     let thumbsSwiper = null;

//     if (thumbsEl) {
//       // detect direction based on wrapper class
//       const isVertical = thumbsEl.classList.contains('thumbs-left') || thumbsEl.classList.contains('thumbs-right');

//       thumbsSwiper = new Swiper(thumbsEl, {
//         direction: isVertical ? 'vertical' : 'horizontal',
//         spaceBetween: 8,
//         slidesPerView: 'auto',
//         watchSlidesProgress: true,
//       });
//     }

//     const mainSwiper = new Swiper(mainEl, {
//       loop: false,
//       spaceBetween: 10,
//       slidesPerView: isCarousel ? 1.2 : 1,
//       centeredSlides: false,
//       navigation: {
//         nextEl: visibleLayout.querySelector('.swiper-button-next'),
//         prevEl: visibleLayout.querySelector('.swiper-button-prev')
//       },
//       thumbs: thumbsSwiper ? { swiper: thumbsSwiper } : undefined,
//       zoom: { maxRatio: 3 },
//       a11y: true,
//       observer: true,
//       observeParents: true,
//       breakpoints: {
//             750: {
//                 slidesPerView: isCarousel ? 1.4 : 1, // Shows more of the next slide on desktop
//                 spaceBetween: 20
//             }
//         }

//     });

//     // Zoom button behaviour
//     const zoomBtn = visibleLayout.querySelector('.product-zoom-btn');
//     if (zoomBtn && mainSwiper.zoom) {
//       zoomBtn.addEventListener('click', function(){
//         if (mainSwiper.zoom.scale && mainSwiper.zoom.scale > 1) {
//           mainSwiper.zoom.out();
//         } else {
//           mainSwiper.zoom.in();
//         }
//       });
//     }

//     // Size modal behaviour
//     const trigger = sectionEl.querySelector('[data-size-trigger]');
//     const modal = sectionEl.querySelector('.product-size-modal');
//     const close = modal && modal.querySelector('[data-size-close]');
//     if (trigger && modal) trigger.addEventListener('click', ()=> modal.setAttribute('aria-hidden','false'));
//     if (close) close.addEventListener('click', ()=> modal.setAttribute('aria-hidden','true'));
//     if (modal) modal.addEventListener('click', function(e){ if (e.target === modal) modal.setAttribute('aria-hidden','true'); });


//     // 📌 Read More with truncation toggle
//     const toggleBtn = sectionEl.querySelector('[data-desc-toggle]');
//     const descContent = sectionEl.querySelector('[data-desc-content]');
//     if (toggleBtn && descContent) {
//       const fullText = descContent.innerHTML.trim();
//       if (!fullText) {
//         // no description at all → hide toggle
//         toggleBtn.style.display = "none";
//         return;
//       }

//       const words = fullText.split(/\s+/);
//       const limit = 40; // number of words to show when collapsed

//       if (words.length <= limit) {
//         // description already short → show full text & hide toggle
//         descContent.innerHTML = fullText;
//         toggleBtn.style.display = "none";
//         return;
//       }

//       const truncatedText = words.slice(0, limit).join(" ") + "...";
//       let expanded = false;
//       descContent.innerHTML = truncatedText;

//       toggleBtn.addEventListener("click", () => {
//         descContent.classList.add("collapsing");

//         setTimeout(() => {
//           if (expanded) {
//             descContent.innerHTML = truncatedText;
//             toggleBtn.textContent = "Read more";
//             expanded = false;
//           } else {
//             descContent.innerHTML = fullText;
//             toggleBtn.textContent = "Read less";
//             expanded = true;
//           }
//           descContent.classList.remove("collapsing");
//         }, 200); // match transition timing
//       });
//     }
    
//   }

//   function initAll(){
//     if (typeof Swiper === 'undefined') {
//       console.warn('Swiper is not loaded yet');
//       return;
//     }
//     document.querySelectorAll('section[id^="product-section-"]').forEach(initSection);
//   }

//   // Wait for DOM + Swiper
//   function ready() {
//     if (window.Swiper) {
//       initAll();
//     } else {
//       var t = setInterval(function(){ if (window.Swiper){ clearInterval(t); initAll(); } }, 50);
//     }
//   }

//   if (document.readyState === 'loading') {
//     document.addEventListener('DOMContentLoaded', ready);
//   } else {
//     ready();
//   }
// })();



window.ProductMediaSwipers = window.ProductMediaSwipers || [];

/* ---------- DESTROY ALL SWIPERS ---------- */
function destroyProductMediaSwipers() {
  window.ProductMediaSwipers.forEach(swiper => {
    if (swiper && swiper.destroy) {
      swiper.destroy(true, true);
    }
  });
  window.ProductMediaSwipers = [];
}

/* ---------- INIT PRODUCT MEDIA ---------- */
function initProductMedia(section) {
  destroyProductMediaSwipers();

  if (!section) return;

  const isMobile = window.matchMedia('(max-width: 749px)').matches;

  const wrapper = isMobile
    ? section.querySelector('.media-mobile')
    : section.querySelector('.media-desktop');

  if (!wrapper) return;

  const mainSwiperEl = wrapper.querySelector('.product-swiper');
  if (!mainSwiperEl) return;

  /* ---------- THUMBNAILS ---------- */
  let thumbsSwiper = null;
  const thumbsEl = wrapper.querySelector('.product-thumbs');

  if (thumbsEl) {
    const isVertical =
      thumbsEl.classList.contains('thumbs-left') ||
      thumbsEl.classList.contains('thumbs-right');

    thumbsSwiper = new Swiper(thumbsEl, {
      direction: isVertical ? 'vertical' : 'horizontal',
      spaceBetween: 8,
      slidesPerView: 'auto',
      watchSlidesProgress: true,
    });

    window.ProductMediaSwipers.push(thumbsSwiper);
  }

  /* ---------- MAIN SWIPER ---------- */
  const isCarousel = mainSwiperEl.classList.contains('product-swiper--carousel');

  const mainSwiper = new Swiper(mainSwiperEl, {
    loop: false,
    slidesPerView: isCarousel ? 1.2 : 1,
    spaceBetween: 10,
    navigation: {
      nextEl: wrapper.querySelector('.swiper-button-next'),
      prevEl: wrapper.querySelector('.swiper-button-prev'),
    },
    thumbs: thumbsSwiper ? { swiper: thumbsSwiper } : undefined,
    zoom: { maxRatio: 3 },
    a11y: true,
    observer: true,
    observeParents: true,
    breakpoints: {
      750: {
        slidesPerView: isCarousel ? 1.4 : 1,
        spaceBetween: 20,
      },
    },
  });

  window.ProductMediaSwipers.push(mainSwiper);
}

/* ---------- INIT ALL PRODUCT SECTIONS ---------- */
function initAllProductMedia() {
  if (typeof Swiper === 'undefined') return;

  document.querySelectorAll('.shopify-section').forEach(section => {
    if (section.querySelector('.product-media-layout')) {
      initProductMedia(section);
    }
  });
}

/* ---------- DOM READY ---------- */
document.addEventListener('DOMContentLoaded', initAllProductMedia);

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

  function getActiveSwiper(sectionEl) {
    let swiperEl = sectionEl.querySelector('.media-desktop .product-swiper');

    if (
      swiperEl &&
      getComputedStyle(swiperEl.closest('.media-desktop')).display === 'none'
    ) {
      swiperEl = sectionEl.querySelector('.media-mobile .product-swiper');
    }

    if (!swiperEl || !swiperEl.swiper) return null;
    return swiperEl.swiper;
  }

  function onVariantChange(sectionEl, variantId) {
    const swiper = getActiveSwiper(sectionEl);
    if (!swiper) return;

    let targetIndex = null;

    swiper.slides.forEach((slide, index) => {
      if (!slide.hasAttribute('data-variant-ids')) return;

      const ids = slide.getAttribute('data-variant-ids').split(',');
      if (ids.includes(String(variantId))) {
        targetIndex = index;
      }
    });

    if (targetIndex !== null) {
      swiper.slideTo(targetIndex);
    }
  }

  document.addEventListener('variant:change', function (evt) {
    const sectionEl = evt.target.closest('.shopify-section');
    if (!sectionEl || !evt.detail || !evt.detail.variant) return;

    onVariantChange(sectionEl, evt.detail.variant.id);
  });


})();


