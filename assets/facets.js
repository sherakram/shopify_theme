(() => {
  "use strict";

  function initFacets() {
    document
      .querySelectorAll("[data-facets-drawer-trigger]")
      .forEach((trigger) => {
        const dialog = document.getElementById(
          trigger.getAttribute("aria-controls"),
        );

        if (dialog && !trigger.dataset.initialized) {
          trigger.dataset.initialized = "true";

          new FacetsDrawer(trigger, dialog);
        }
      });

    new FacetsHorizontal();

    document
      .querySelectorAll("[data-facets-container]")
      .forEach((container) => {
        new FacetsMobilePanel(container);
      });
  }

  class FacetsAjax {
    constructor() {
      this.abortController = null;
      this.cache = {};
      this.cacheKeys = [];
      this.maxCacheSize = 15;
      this.requestId = 0;
      this.pendingDrawerClose = false;
      this.form = document.getElementById("FacetsForm");

      if (!this.form) return;

      this.bindEvents();
      this.bindPopState();
    }

    bindEvents() {
      document.addEventListener("change", (event) => {
        const target = event.target;

        if (!target.closest("#FacetsForm")) return;

        if (
          target.matches('input[name="filter.v.price.gte"]') ||
          target.matches('input[name="filter.v.price.lte"]')
        ) {
          return;
        }

        this.form = document.getElementById("FacetsForm");

        this.loadProducts();
      });

      document.addEventListener("click", (event) => {
        const link = event.target.closest("[data-facets-pagination] a");

        if (!link) return;

        event.preventDefault();

        this.loadProducts(link.href);
      });

      document.addEventListener("change", (event) => {
        if (!event.target.matches("#FacetsSortBy")) return;

        event.preventDefault();

        const url = new URL(window.location.href);

        url.searchParams.set("sort_by", event.target.value);

        this.loadProducts(url.toString());
      });

      document.addEventListener("click", (event) => {
        const reset = event.target.closest("[data-facet-reset]");
        if (!reset) return;
        event.preventDefault();
        const panel = reset.closest("[data-facet-dropdown]");
        if (!panel) return;
        panel.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
          checkbox.checked = false;
        });
        panel.querySelectorAll('input[type="number"]').forEach((input) => {
          input.value = "";
        });
        this.form = document.getElementById("FacetsForm");
        requestAnimationFrame(() => {
          this.loadProducts();
        });
      });

      document.addEventListener("click", (event) => {
        const clear = event.target.closest("[data-clear-all]");

        if (!clear) return;

        event.preventDefault();

        this.loadProducts(clear.href);
      });

      document.addEventListener("click", (event) => {
        const activeFilter = event.target.closest("[data-active-filter]");

        if (!activeFilter) return;

        event.preventDefault();

        this.loadProducts(activeFilter.href);
      });

      document.addEventListener("click", (event) => {
        const applyBtn = event.target.closest("[data-facet-price-apply]");
        if (!applyBtn) return;
        event.preventDefault();
        this.form = document.getElementById("FacetsForm");
        this.loadProducts();
      });
      document.addEventListener("keydown", (event) => {
        if (event.key !== "Enter") return;
        if (!event.target.matches("[data-facet-price-input]")) return;
        event.preventDefault();
        this.form = document.getElementById("FacetsForm");
        this.loadProducts();
      });

      document.addEventListener("click", (event) => {
        const drawerApply = event.target.closest(".facets-drawer__apply");
        if (!drawerApply) return;
        event.preventDefault();
        this.form = document.getElementById("FacetsForm");
        this.pendingDrawerClose = true;
        this.loadProducts();
      });
    }

    bindPopState() {
      window.addEventListener("popstate", () => {
        this.loadProducts(window.location.href);
      });
    }

    setCache(key, value) {
      if (this.cache[key]) {
        this.cacheKeys = this.cacheKeys.filter((k) => k !== key);
      } else if (this.cacheKeys.length >= this.maxCacheSize) {
        const oldestKey = this.cacheKeys.shift();
        delete this.cache[oldestKey];
      }

      this.cache[key] = value;
      this.cacheKeys.push(key);
    }

    renderSection(wrapper, id) {
      const current = document.querySelector(`[id^="${id}-"]`);
      const updated = wrapper.querySelector(`[id^="${id}-"]`);

      if (!current || !updated) return;

      if (id === "FacetsFilters") {
        const openDrawer = current.querySelector(
          "dialog[data-facets-drawer][open]",
        );
        const newDrawerForm = updated.querySelector(
          "dialog[data-facets-drawer] form",
        );

        if (openDrawer && newDrawerForm) {
          const oldForm = openDrawer.querySelector("form");
          if (oldForm) {
            oldForm.replaceWith(newDrawerForm.cloneNode(true));
          }

          const updatedClone = updated.cloneNode(true);
          const updatedDrawer = updatedClone.querySelector(
            "dialog[data-facets-drawer]",
          );
          if (updatedDrawer) updatedDrawer.remove();

          [...current.childNodes].forEach((node) => {
            if (
              node.nodeType === 1 &&
              node.matches?.("dialog[data-facets-drawer]")
            )
              return;
            node.remove();
          });
          current.prepend(...updatedClone.childNodes);

          return;
        }
      }

      let openKeys = [];
      if (id === "FacetsFilters") {
        openKeys = [
          ...current.querySelectorAll("[data-facet-dropdown][open]"),
        ].map((el) => el.dataset.facetKey);
      }

      const newNode = updated.cloneNode(true);
      current.replaceWith(newNode);

      if (openKeys.length) {
        openKeys.forEach((key) => {
          const match = newNode.querySelector(`[data-facet-key="${key}"]`);
          if (match) match.open = true;
        });
      }

      newNode.style.opacity = "0";

      requestAnimationFrame(() => {
        newNode.style.opacity = "1";
      });
    }

    announceResults() {
      const countEl = document.querySelector('[id^="FacetsProductCount-"]');
      const announceEl = document.querySelector('[id^="FacetsAnnounce-"]');
      const emptyState = document.querySelector("[data-facets-empty]");

      if (!announceEl) return;

      let message = "";

      if (emptyState) {
        message =
          emptyState
            .querySelector(".collection-empty__text")
            ?.textContent.trim() || "No products found";
      } else if (countEl) {
        message = countEl.textContent.trim();
      }

      announceEl.textContent = "";

      requestAnimationFrame(() => {
        announceEl.textContent = message;
      });
    }

    moveFocusAfterUpdate() {
      const openDrawer = document.querySelector(
        "dialog[data-facets-drawer][open]",
      );
      if (openDrawer) return;

      const countEl = document.querySelector(
        '[id^="FacetsProductCount-"] [tabindex="-1"]',
      );
      if (countEl) {
        countEl.focus();
      }
    }

    async loadProducts(url = null) {
      const currentRequest = ++this.requestId;

      const section = document.querySelector("[data-section]").dataset.section;

      if (this.abortController) {
        this.abortController.abort();
      }
      this.abortController = new AbortController();

      const grid = document.querySelector('[id^="CollectionProductGrid-"]');
      if (grid) {
        grid.classList.add("loading");
      }

      if (!url) {
        this.form = document.getElementById("FacetsForm");
        const params = new URLSearchParams(new FormData(this.form));

        for (const [key, value] of [...params.entries()]) {
          if (value === "") {
            params.delete(key);
          }
        }

        url = `${window.location.pathname}?${params.toString()}`;
      }

      const fetchUrl = `${url}${url.includes("?") ? "&" : "?"}section_id=${section}`;

      try {
        let html;

        if (this.cache[fetchUrl]) {
          html = this.cache[fetchUrl];
        } else {
          const response = await fetch(fetchUrl, {
            signal: this.abortController.signal,
          });

          html = await response.text();

          if (currentRequest !== this.requestId) {
            return;
          }

          this.setCache(fetchUrl, html);
        }

        const wrapper = document.createElement("div");
        wrapper.innerHTML = html;

        [
          "FacetsProductGrid",
          "FacetsProductCount",
          "FacetsFilters",
          "FacetsSort",
          "FacetsPagination",
          "FacetsActiveFilters",
        ].forEach((section) => this.renderSection(wrapper, section));

        this.announceResults();
        this.moveFocusAfterUpdate();

        const productGrid = document.querySelector(
          '[id^="CollectionProductGrid-"]',
        );

        if (productGrid) {
          productGrid.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }

        if (window.location.href !== url) {
          history.pushState({}, "", url);
        }

        if (this.pendingDrawerClose) {
          const dialog = document.querySelector("dialog[open]");
          if (dialog) dialog.close();
          this.pendingDrawerClose = false;
        }

        if (!document.querySelector("dialog[open]")) {
          document.documentElement.style.overflow = "";
          document.body.style.overflow = "";
        }

        initFacets();
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error(error);
        }
      } finally {
        if (grid) {
          requestAnimationFrame(() => {
            grid.classList.remove("loading");
          });
        }
      }
    }
  }

  class FacetsHorizontal {
    constructor() {
      if (FacetsHorizontal.instance) return;
      FacetsHorizontal.instance = this;
      this.bind();
    }

    bind() {
      document.addEventListener(
        "toggle",
        (e) => {
          const dropdown = e.target.closest("[data-facet-toolbar-dropdown]");
          if (!dropdown || !dropdown.open) return;

          document
            .querySelectorAll("[data-facet-toolbar-dropdown]")
            .forEach((item) => {
              if (item !== dropdown) item.open = false;
            });
        },
        true,
      );

      document.addEventListener("click", (e) => {
        document
          .querySelectorAll("[data-facet-toolbar-dropdown]")
          .forEach((dropdown) => {
            if (!dropdown.contains(e.target)) dropdown.open = false;
          });
      });

      document.addEventListener("keydown", (e) => {
        if (e.key !== "Escape") return;

        const openDropdown = document.querySelector(
          "[data-facet-toolbar-dropdown][open]",
        );
        if (!openDropdown) return;

        const trigger = openDropdown.querySelector(".facets__dropdown-trigger");
        openDropdown.open = false;

        if (trigger) trigger.focus();
      });
    }
  }

  const facetsDesktopMQ = window.matchMedia("(min-width: 990px)");
  facetsDesktopMQ.addEventListener("change", (e) => {
    if (!e.matches) return;
    document
      .querySelectorAll("[data-facets-container].is-open")
      .forEach((c) => {
        c.classList.remove("is-open");
      });
    document.documentElement.style.overflow = "";
  });

  class FacetsDrawer {
    constructor(trigger, dialog) {
      this.trigger = trigger;
      this.dialog = dialog;
      this.bind();
    }

    bind() {
      this.trigger.addEventListener("click", () => {
        this.open();
      });

      this.dialog
        .querySelector("[data-facets-drawer-close]")
        ?.addEventListener("click", () => this.close());

      this.dialog.addEventListener("click", (event) => {
        const panel = this.dialog.querySelector(".facets-drawer__panel");
        if (panel && !panel.contains(event.target)) this.close();
      });

      this.dialog.addEventListener("cancel", (event) => {
        event.preventDefault();
        this.close();
      });
    }

    open() {
      const freshDialog = document.getElementById(
        this.trigger.getAttribute("aria-controls"),
      );

      this.returnFocusEl = document.activeElement;
      freshDialog.showModal();
      document.documentElement.style.overflow = "hidden";
    }

    close() {
      this.dialog = document.getElementById(
        this.trigger.getAttribute("aria-controls"),
      );

      if (this.dialog.open) {
        this.dialog.close();
      }

      document.documentElement.style.overflow = "";

      if (this.returnFocusEl instanceof HTMLElement) {
        this.returnFocusEl.focus();
      }
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    initFacets();

    new FacetsAjax();
  });
})();
