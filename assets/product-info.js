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
    // zoom: { maxRatio: 2 },
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

/* ---------- ZOOM LIGHTBOX ---------- */
document.addEventListener('DOMContentLoaded', function () {
  const overlay    = document.getElementById('product-zoom-overlay');
  const mediaBox   = document.getElementById('product-zoom-media');
  const closeBtn   = document.getElementById('product-zoom-close');
  const prevBtn    = document.getElementById('product-zoom-prev');
  const nextBtn    = document.getElementById('product-zoom-next');

  if (!overlay || !mediaBox) return;

  let allMedia   = []; // array of { type, ...data }
  let currentIdx = 0;

  // ── Extract media data from a slide or grid item ─────────────────────────
  function getMediaFromItem(item) {
    if (!item) return null;

    // 1. Native video
    const video = item.querySelector('video');
    if (video) {
      const sources = Array.from(video.querySelectorAll('source')).map(s => ({
        src: s.src,
        type: s.type || 'video/mp4'
      }));
      // Fallback: video.src set directly
      if (!sources.length && video.src) {
        sources.push({ src: video.src, type: 'video/mp4' });
      }
      return { type: 'video', sources, poster: video.poster || null };
    }

    // 2. External video (YouTube / Vimeo iframe)
    const iframe = item.querySelector('iframe');
    if (iframe && iframe.src) {
      // Ensure autoplay is appended for a smooth lightbox experience
      let src = iframe.src;
      if (src.includes('youtube.com') || src.includes('youtu.be')) {
        src = src.includes('?') ? src + '&autoplay=1' : src + '?autoplay=1';
      } else if (src.includes('vimeo.com')) {
        src = src.includes('?') ? src + '&autoplay=1' : src + '?autoplay=1';
      }
      return { type: 'external_video', src };
    }

    // 3. 3D model
    const model = item.querySelector('model-viewer');
    if (model) {
      return {
        type: 'model',
        src: model.getAttribute('src'),
        poster: model.getAttribute('poster') || null,
        alt:    model.getAttribute('alt')    || '3D model'
      };
    }

    // 4. Image (must come last — videos also have a poster img)
    const img = item.querySelector('img');
    if (img && img.src) {
      return {
        type: 'image',
        src: img.src.replace(/width=\d+/, 'width=1800')
      };
    }

    return null;
  }

  // ── Build the correct HTML/element for the lightbox ───────────────────────
  function buildMediaEl(data) {
    switch (data.type) {

      case 'image': {
        const img = document.createElement('img');
        img.src   = data.src;
        img.alt   = 'Zoomed product image';
        return img;
      }

      case 'video': {
        const vid       = document.createElement('video');
        vid.controls    = true;
        vid.autoplay    = true;
        vid.loop        = false;
        vid.playsInline = true;
        if (data.poster) vid.poster = data.poster;
        data.sources.forEach(s => {
          const src  = document.createElement('source');
          src.src    = s.src;
          src.type   = s.type;
          vid.appendChild(src);
        });
        return vid;
      }

      case 'external_video': {
        const wrap            = document.createElement('div');
        wrap.className        = 'zoom-iframe-wrap';
        const iframe          = document.createElement('iframe');
        iframe.src            = data.src;
        iframe.frameBorder    = '0';
        iframe.allowFullscreen = true;
        iframe.allow          = 'autoplay; encrypted-media; picture-in-picture';
        wrap.appendChild(iframe);
        return wrap;
      }

      case 'model': {
        // model-viewer is a custom element — create it as a regular element
        const mv = document.createElement('model-viewer');
        mv.setAttribute('src', data.src);
        if (data.poster) mv.setAttribute('poster', data.poster);
        mv.setAttribute('alt', data.alt);
        mv.setAttribute('camera-controls', '');
        mv.setAttribute('auto-rotate', '');
        mv.setAttribute('ar', '');
        return mv;
      }

      default:
        return null;
    }
  }

  // ── Show a specific index ──────────────────────────────────────────────────
  function showZoom(idx) {
    if (!allMedia.length) return;
    currentIdx = (idx + allMedia.length) % allMedia.length;

    // Clear previous media (pauses video / stops model)
    mediaBox.innerHTML = '';

    const el = buildMediaEl(allMedia[currentIdx]);
    if (!el) return;
    mediaBox.appendChild(el);

    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Hide nav arrows when only one item
    const multi = allMedia.length > 1;
    if (prevBtn) prevBtn.style.display = multi ? 'flex' : 'none';
    if (nextBtn) nextBtn.style.display = multi ? 'flex' : 'none';
  }

  // ── Unified click handler for ALL layouts ─────────────────────────────────
  document.addEventListener('click', function (e) {
    const btn = e.target.closest('.product-zoom-btn');
    if (!btn) return;

    const wrapper = btn.closest('.product-media-layout');
    if (!wrapper) return;

    // Works for both swiper slides and grid items
    const clickedItem =
      btn.closest('.swiper-slide') ||
      btn.closest('.grid-media-item');

    if (!clickedItem) return;

    // Collect all media items from this layout (no swiper loop duplicates)
    const allItems = Array.from(
      wrapper.querySelectorAll(
        '.product-swiper > .swiper-wrapper > .swiper-slide:not(.swiper-slide-duplicate),' +
        '.main-product__media--grid .grid-media-item'
      )
    );

    allMedia   = [];
    currentIdx = 0;

    allItems.forEach((item) => {
      const data = getMediaFromItem(item);
      if (!data) return;
      if (item === clickedItem) currentIdx = allMedia.length;
      allMedia.push(data);
    });

    if (!allMedia.length) return;
    showZoom(currentIdx);
  });

  // ── Close ─────────────────────────────────────────────────────────────────
  function closeOverlay() {
    // Pause video / stop model before clearing
    const vid = mediaBox.querySelector('video');
    if (vid) { vid.pause(); vid.src = ''; }

    const iframe = mediaBox.querySelector('iframe');
    if (iframe) iframe.src = '';   // stops YouTube/Vimeo playback

    mediaBox.innerHTML = '';
    allMedia = [];

    overlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  closeBtn.addEventListener('click', closeOverlay);

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeOverlay();
  });

  document.addEventListener('keydown', (e) => {
    if (!overlay.classList.contains('active')) return;
    if (e.key === 'Escape')     closeOverlay();
    if (e.key === 'ArrowLeft')  showZoom(currentIdx - 1);
    if (e.key === 'ArrowRight') showZoom(currentIdx + 1);
  });

  if (prevBtn) prevBtn.addEventListener('click', (e) => { e.stopPropagation(); showZoom(currentIdx - 1); });
  if (nextBtn) nextBtn.addEventListener('click', (e) => { e.stopPropagation(); showZoom(currentIdx + 1); });
});

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