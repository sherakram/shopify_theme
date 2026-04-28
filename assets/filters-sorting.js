(function () {
  "use strict";

  let sectionId;
  let container;
  let isPanelOpen = false;
  let lastFocusedElement = null;
  let isLoading = false;

  document.addEventListener("DOMContentLoaded", function () {
    const form = document.querySelector('[id^="FacetFiltersForm-"]');
    if (!form) return;

    sectionId = form.id.replace("FacetFiltersForm-", "");
    container = document.getElementById("CollectionSection-" + sectionId);

    // Event delegation — sab kuch document par, taki DOM replace ke baad bhi kaam kare
    document.addEventListener("click", onDocumentClick);
    document.addEventListener("change", onDocumentChange);
    document.addEventListener("submit", onDocumentSubmit);

    attachPaginationInterceptor();
  });

  // ─── Fresh DOM references (har baar naye elements query karo) ───────────────
  function getForm() {
    return document.getElementById("FacetFiltersForm-" + sectionId);
  }

  function getDrawer() {
    var form = getForm();
    return form ? form.querySelector(".fs-drawer") : null;
  }

  function getModal() {
    var form = getForm();
    if (!form) return null;
    // Drawer mode mein .fs-panels drawer ke andar hota hai — usse skip karo
    if (form.querySelector(".fs-drawer")) return null;
    return form.querySelector(".fs-panels");
  }

  function getToggleBtn() {
    var form = getForm();
    return form ? form.querySelector(".fs-toggle") : null;
  }

  // ─── Panel Open/Close ───────────────────────────────────────────────────────
  function openPanel() {
    isPanelOpen = true;
    lastFocusedElement = document.activeElement;

    var drawer = getDrawer();
    var modal = getModal();

    if (drawer) {
      drawer.setAttribute("open", "");
      var panel = drawer.querySelector(".fs-drawer__panel");
      if (panel) {
        panel.removeAttribute("hidden");
        setTimeout(function () { panel.focus(); }, 60);
      }
    } else if (modal) {
      modal.hidden = false;
      setTimeout(function () { modal.focus(); }, 60);
    }

    document.addEventListener("keydown", trapFocus);
  }

  function closePanel() {
    isPanelOpen = false;

    var drawer = getDrawer();
    var modal = getModal();

    if (drawer && drawer.hasAttribute("open")) {
      drawer.removeAttribute("open");
      var panel = drawer.querySelector(".fs-drawer__panel");
      if (panel) panel.setAttribute("hidden", "");
    }
    if (modal && !modal.hidden) {
      modal.hidden = true;
    }

    document.removeEventListener("keydown", trapFocus);
    if (lastFocusedElement && lastFocusedElement.focus) {
      lastFocusedElement.focus();
    }
  }

  function trapFocus(e) {
    var drawer = getDrawer();
    var modal = getModal();
    var panel = null;

    if (drawer && drawer.hasAttribute("open")) {
      panel = drawer.querySelector(".fs-drawer__panel");
    } else if (modal && !modal.hidden) {
      panel = modal;
    }

    if (!panel) return;

    if (e.key === "Escape") {
      e.preventDefault();
      closePanel();
      return;
    }

    if (e.key === "Tab") {
      var focusable = Array.from(panel.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )).filter(function (el) {
        return !el.disabled && el.offsetParent !== null;
      });

      if (!focusable.length) return;
      var first = focusable[0];
      var last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }

  // ─── Event Handlers ─────────────────────────────────────────────────────────
  function onDocumentClick(e) {
    // Filter toggle button
    if (e.target.closest(".fs-toggle")) {
      if (isPanelOpen) {
        closePanel();
      } else {
        openPanel();
      }
      return;
    }

    var filterPill = e.target.closest(".fs-filter-remove");
    if (filterPill) {
      e.preventDefault();
      submitByUrl(filterPill.href, false);
      return;
    }

    // Close button (X button ya data-drawer-close)
    if (
      e.target.matches("[data-drawer-close]") ||
      e.target.closest("[data-drawer-close]") ||
      e.target.matches(".fs-close") ||
      e.target.closest(".fs-close")
    ) {
      closePanel();
      return;
    }

    // Backdrop click se close
    var drawer = getDrawer();
    if (
      drawer &&
      drawer.hasAttribute("open") &&
      e.target.classList.contains("fs-drawer__backdrop")
    ) {
      closePanel();
      return;
    }

    // Footer "Clear" button (button element)
    var clearBtn = e.target.closest("button.fs-clear");
    if (clearBtn) {
      e.preventDefault();
      clearAllFilters();
      return;
    }

    // Single filter clear link (a.fs-clear)
    var clearLink = e.target.closest("a.fs-clear");
    if (clearLink) {
      e.preventDefault();
      submitByUrl(clearLink.href);
      return;
    }

    // "Clear all" link
    var clearAll = e.target.closest(".fs-clear-all");
    if (clearAll && clearAll.tagName === "A") {
      e.preventDefault();
      submitByUrl(clearAll.href);
      return;
    }
  }

  function onDocumentChange(e) {
    // SIRF sort select pe auto-submit — checkboxes pe NAHI (Apply button se hoga)
    if (e.target.matches('[name="sort_by"]')) {
      submitForm();
    }
  }

  function onDocumentSubmit(e) {
    var form = getForm();
    if (form && e.target === form) {
      e.preventDefault();
      submitForm();
    }
  }

  // ─── Form Submit ─────────────────────────────────────────────────────────────
  function submitForm(keepOpen) {
    var form = getForm();
    if (!form || isLoading) return;
    
    if (!keepOpen){
      closePanel();
    }

    var params = new URLSearchParams();

    var sortEl = form.querySelector('[name="sort_by"]');
    if (sortEl && sortEl.value) {
      params.set("sort_by", sortEl.value);
    }

    form.querySelectorAll('input[type="checkbox"]').forEach(function (cb) {
      if (cb.checked) params.append(cb.name, cb.value);
    });

    form.querySelectorAll('input[type="number"]').forEach(function (input) {
      if (input.value === "") return;

      var rangeMin = input.getAttribute("data-range-min");
      var rangeMax = input.getAttribute("data-range-max");

      if (rangeMax && input.value === rangeMax) return;
      if (rangeMin && input.value === rangeMin) return;

      params.set(input.name, input.value);
    });

    var pushUrl = window.location.pathname + "?" + params.toString();
    var fetchUrl = pushUrl + "&section_id=" + sectionId;
    fetchAndReplace(fetchUrl, pushUrl);
  }

  function submitByUrl(url, keepOpen) {
    if (isLoading) return;
    var parsed = new URL(url, window.location.origin);
    parsed.searchParams.set("section_id", sectionId);
    fetchAndReplace(parsed.toString(), url, keepOpen);
  }

  function clearAllFilters() {
    var form = getForm();
    if (!form) return;
    form.querySelectorAll('input[type="checkbox"]').forEach(function (cb) {
      cb.checked = false;
    });
    form.querySelectorAll('input[type="number"]').forEach(function (inp) {
      inp.value = "";
    });
    submitForm(true);
  }

  // ─── AJAX ────────────────────────────────────────────────────────────────────
  function fetchAndReplace(fetchUrl, pushUrl, keepOpen) {
    if (isLoading) return;
    isLoading = true;
    showLoading();

    fetch(fetchUrl)
      .then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.text();
      })
      .then(function (html) {
        var doc = new DOMParser().parseFromString(html, "text/html");
        var newContainer = doc.getElementById(container.id);

        if (newContainer && container) {
          container.replaceWith(newContainer);
          container = newContainer;
        }

        window.history.replaceState({}, "", pushUrl);

        // Panel wapas kholo agar pehle khula tha
        if (keepOpen || isPanelOpen) {
          setTimeout(function () { openPanel(); }, 30);
        }

        attachPaginationInterceptor();
      })
      .catch(function (err) {
        console.error("Filter AJAX error:", err);
      })
      .finally(function () {
        isLoading = false;
        hideLoading();
      });
  }

  // ─── Loading State ───────────────────────────────────────────────────────────
  function showLoading() {
    var grid = document.getElementById("CollectionProductGrid-" + sectionId);
    if (grid) {
      grid.style.opacity = "0.4";
      grid.style.pointerEvents = "none";
      grid.style.transition = "opacity 0.2s";
    }
  }

  function hideLoading() {
    var grid = document.getElementById("CollectionProductGrid-" + sectionId);
    if (grid) {
      grid.style.opacity = "";
      grid.style.pointerEvents = "";
    }
  }

  // ─── Pagination ──────────────────────────────────────────────────────────────
  function attachPaginationInterceptor() {
    if (!container) return;
    // Purana listener hatao pehle (duplicate se bachne ke liye)
    container.removeEventListener("click", onPaginationClick);
    container.addEventListener("click", onPaginationClick);
  }

  function onPaginationClick(e) {
    var a = e.target.closest(".pagination a");
    if (!a) return;
    e.preventDefault();
    var parsed = new URL(a.href, window.location.origin);
    var fetchUrl =
      parsed.pathname + "?" + parsed.searchParams.toString() + "&section_id=" + sectionId;
    fetchAndReplace(fetchUrl, a.href);
  }
})();