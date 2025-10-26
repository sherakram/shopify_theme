(function(){
  function initSection(sectionEl){
    const mainEl = sectionEl.querySelector('.product-swiper');
    if(!mainEl) return;

    // optional thumbs
    const thumbsEl = sectionEl.querySelector('.product-thumbs');
    let thumbsSwiper = null;

    if (thumbsEl) {
      // detect direction based on wrapper class
      const isVertical = thumbsEl.classList.contains('thumbs-left') || thumbsEl.classList.contains('thumbs-right');

      thumbsSwiper = new Swiper(thumbsEl, {
        direction: isVertical ? 'vertical' : 'horizontal',
        spaceBetween: 8,
        slidesPerView: isVertical ? 'auto' : 4,
        watchSlidesProgress: true,
        slideToClickedSlide: true,
        breakpoints: { 
         480: { slidesPerView: isVertical ? 'auto' : 5 } 
        }
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


    // 📌 Read More with truncation toggle
    const toggleBtn = sectionEl.querySelector('[data-desc-toggle]');
    const descContent = sectionEl.querySelector('[data-desc-content]');
    if (toggleBtn && descContent) {
      const fullText = descContent.innerHTML.trim();
      if (!fullText) {
        // no description at all → hide toggle
        toggleBtn.style.display = "none";
        return;
      }

      const words = fullText.split(/\s+/);
      const limit = 40; // number of words to show when collapsed

      if (words.length <= limit) {
        // description already short → show full text & hide toggle
        descContent.innerHTML = fullText;
        toggleBtn.style.display = "none";
        return;
      }

      const truncatedText = words.slice(0, limit).join(" ") + "...";
      let expanded = false;
      descContent.innerHTML = truncatedText;

      toggleBtn.addEventListener("click", () => {
        descContent.classList.add("collapsing");

        setTimeout(() => {
          if (expanded) {
            descContent.innerHTML = truncatedText;
            toggleBtn.textContent = "Read more";
            expanded = false;
          } else {
            descContent.innerHTML = fullText;
            toggleBtn.textContent = "Read less";
            expanded = true;
          }
          descContent.classList.remove("collapsing");
        }, 200); // match transition timing
      });
    }
    
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

