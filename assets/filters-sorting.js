// assets/filters-sorting.js
document.addEventListener("DOMContentLoaded", function () {
  const form = document.querySelector('[id^="FacetFiltersForm-"]');
  if (!form) return;

  const sectionId = form.id.replace("FacetFiltersForm-", "");
  let container = document.getElementById(`CollectionSection-${sectionId}`);
  const gridId = `CollectionProductGrid-${sectionId}`;
  let grid = document.getElementById(gridId);

  const toggleBtn = form.querySelector(".fs-toggle");
  const drawer = form.querySelector(".fs-drawer");
  const modal = form.querySelector(".fs-panels");
  let lastFocusedElement = null;

  function openPanel(panelEl) {
    lastFocusedElement = document.activeElement;
    if (panelEl === modal) {
      modal.hidden = false;
      modal.focus();
    } else if (panelEl === drawer) {
      drawer.setAttribute("open", "");
      drawer.querySelector(".fs-drawer__panel").removeAttribute("hidden");
      drawer.querySelector(".fs-drawer__panel").focus();
    }
    document.addEventListener("keydown", trapFocus);
  }

  function closePanel() {
    if (drawer && drawer.hasAttribute("open")) {
      drawer.removeAttribute("open");
    }
    if (modal && !modal.hidden) {
      modal.hidden = true;
    }
    document.removeEventListener("keydown", trapFocus);
    if (lastFocusedElement) lastFocusedElement.focus();
  }

  function trapFocus(e) {
    const panel = drawer?.hasAttribute("open")
      ? drawer.querySelector(".fs-drawer__panel")
      : !modal?.hidden
      ? modal
      : null;

    if (!panel) return;

    if (e.key === "Escape") {
      e.preventDefault();
      closePanel();
      return;
    }

    if (e.key === "Tab") {
      const focusable = panel.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }

  if (toggleBtn) {
    toggleBtn.addEventListener("click", () => {
      if (drawer) {
        openPanel(drawer);
      } else if (modal) {
        openPanel(modal);
      }
    });
  }

  // Close triggers
  document.addEventListener("click", (e) => {
    if (e.target.matches("[data-drawer-close], .fs-close")) {
      closePanel();
    }
    if (drawer?.hasAttribute("open") && e.target.classList.contains("fs-drawer__backdrop")) {
      closePanel();
    }
  });

  // Form submission with fetch
  form.addEventListener("change", submitForm);
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    submitForm();
  });

  // ✅ Fixed submitForm with price range support
  function submitForm() {
    const params = new URLSearchParams();

    const sortEl = form.querySelector('[name="sort_by"]');
    if (sortEl?.value) params.set("sort_by", sortEl.value);

    const pageSizeEl = form.querySelector('[name="page_size"]');
    if (pageSizeEl?.value) params.set("page_size", pageSizeEl.value);

    // Grab all checkboxes
    form.querySelectorAll('input[type="checkbox"]').forEach((cb) => {
      if (cb.checked) params.append(cb.name, cb.value);
    });

    // ✅ NEW: Grab price range inputs
    form.querySelectorAll('input[type="number"]').forEach((input) => {
      if (input.value) {
        params.set(input.name, input.value);
      }
    });

    const fetchUrl = `${window.location.pathname}?${params.toString()}&section_id=${sectionId}`;
    fetchAndReplace(fetchUrl, window.location.pathname + "?" + params.toString());
  }

  async function fetchAndReplace(fetchUrl, pushUrl) {
    try {
      const res = await fetch(fetchUrl);
      const html = await res.text();
      const doc = new DOMParser().parseFromString(html, "text/html");
      const newContainer = doc.getElementById(container.id);
      if (newContainer && container) {
        container.replaceWith(newContainer);
        container = newContainer;
        attachPaginationInterceptor();
      }
      window.history.replaceState({}, "", pushUrl);
    } catch (err) {
      console.error("Filter AJAX error", err);
    }
  }

  function attachPaginationInterceptor() {
    const listenTarget = container || document;
    listenTarget.addEventListener("click", onPaginationClick);
  }

  function onPaginationClick(e) {
    const a = e.target.closest(".pagination a");
    if (!a) return;
    e.preventDefault();
    const href = a.href;
    const parsed = new URL(href, window.location.origin);
    const fetchUrl = `${parsed.pathname}?${parsed.searchParams.toString()}&section_id=${sectionId}`;
    fetchAndReplace(fetchUrl, href);
  }

  attachPaginationInterceptor();
});
