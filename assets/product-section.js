(function(){
  function initSection(sectionEl){
    const mainEl = sectionEl.querySelector('.product-swiper');
    if(!mainEl) return;

    // optional thumbs
    const thumbsEl = sectionEl.querySelector('.product-thumbs');
    let thumbsSwiper = null;
    if (thumbsEl) {
      thumbsSwiper = new Swiper(thumbsEl, {
        spaceBetween: 8,
        slidesPerView: 4,
        watchSlidesProgress: true,
        slideToClickedSlide: true,
        breakpoints: { 480: { slidesPerView: 5 } }
      });
    }

    const mainSwiper = new Swiper(mainEl, {
      loop: false,
      spaceBetween: 12,
      navigation: {
        nextEl: sectionEl.querySelector('.swiper-button-next'),
        prevEl: sectionEl.querySelector('.swiper-button-prev')
      },
      thumbs: thumbsSwiper ? { swiper: thumbsSwiper } : undefined,
      zoom: { maxRatio: 3 },
      a11y: true
    });

    // Zoom button behaviour
    const zoomBtn = sectionEl.querySelector('.product-zoom-btn');
    if (zoomBtn && mainSwiper.zoom) {
      zoomBtn.addEventListener('click', function(){
        if (mainSwiper.zoom.scale && mainSwiper.zoom.scale > 1) {
          mainSwiper.zoom.out();
        } else {
          mainSwiper.zoom.in();
        }
      });
    }

    // Size modal behaviour
    const trigger = sectionEl.querySelector('[data-size-trigger]');
    const modal = sectionEl.querySelector('.product-size-modal');
    const close = modal && modal.querySelector('[data-size-close]');
    if (trigger && modal) trigger.addEventListener('click', ()=> modal.setAttribute('aria-hidden','false'));
    if (close) close.addEventListener('click', ()=> modal.setAttribute('aria-hidden','true'));
    if (modal) modal.addEventListener('click', function(e){ if (e.target === modal) modal.setAttribute('aria-hidden','true'); });
  }

  function initAll(){
    if (typeof Swiper === 'undefined') {
      console.warn('Swiper is not loaded yet');
      return;
    }
    document.querySelectorAll('section[id^="product-section-"]').forEach(initSection);
  }

  // Wait for DOM + Swiper
  function ready() {
    if (window.Swiper) {
      initAll();
    } else {
      var t = setInterval(function(){ if (window.Swiper){ clearInterval(t); initAll(); } }, 50);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ready);
  } else {
    ready();
  }
})();
