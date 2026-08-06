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
  }

  class FacetsAjax {
    constructor() {
      this.abortController = null;
      this.cache = {};
      this.requestId = 0;
      this.form = document.getElementById("CollectionFacetsForm");

      if (!this.form) return;

      this.bindEvents();
      this.bindPopState();
    }

    bindEvents() {
      document.addEventListener("change", (event) => {
        const target = event.target;

        if (!target.closest("#CollectionFacetsForm")) return;

        if (
          target.matches('input[name="filter.v.price.gte"]') ||
          target.matches('input[name="filter.v.price.lte"]')
        ) {
          return;
        }

        this.form = document.getElementById("CollectionFacetsForm");

        this.loadProducts();
      });

      document.addEventListener("click", (event) => {
        const link = event.target.closest(".collection-pagination a");

        if (!link) return;

        event.preventDefault();

        this.loadProducts(link.href);
      });

      document.addEventListener("change", (event) => {
        if (!event.target.matches("#CollectionSortBy")) return;

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
        this.form = document.getElementById("CollectionFacetsForm");
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
    }

    bindPopState() {
      window.addEventListener("popstate", () => {
        this.loadProducts(window.location.href);
      });
    }

    renderSection(wrapper, id) {
      const current = document.querySelector(`[id^="${id}-"]`);
      const updated = wrapper.querySelector(`[id^="${id}-"]`);

      if (!current || !updated) return;

      current.replaceWith(updated.cloneNode(true));

      current.style.opacity = "0";

      requestAnimationFrame(() => {
        current.style.opacity = "1";
      });
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
        this.form = document.getElementById("CollectionFacetsForm");
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

          this.cache[fetchUrl] = html;
        }

        const wrapper = document.createElement("div");
        wrapper.innerHTML = html;

        [
          "CollectionProductGrid",
          "CollectionProductCount",
          "CollectionFilters",
          "CollectionSort",
          "CollectionPagination",
          "CollectionActiveFilters",
        ].forEach((section) => this.renderSection(wrapper, section));

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

        document.documentElement.style.overflow = "";

        document.body.style.overflow = "";

        const dialog = document.querySelector("dialog[open]");

        if (dialog) {
          dialog.close();
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
      this.dropdowns = document.querySelectorAll("[data-facet-dropdown]");

      this.bind();
    }

    bind() {
      this.dropdowns.forEach((dropdown) => {
        dropdown.addEventListener("toggle", () => {
          if (!dropdown.open) return;

          this.dropdowns.forEach((item) => {
            if (item !== dropdown) {
              item.open = false;
            }
          });
        });
      });

      document.addEventListener("click", (e) => {
        this.dropdowns.forEach((dropdown) => {
          if (!dropdown.contains(e.target)) {
            dropdown.open = false;
          }
        });
      });
    }
  }

  class FacetsDrawer {
    constructor(trigger, dialog) {
      this.trigger = trigger;
      this.dialog = dialog;
      this.bind();
    }

    bind() {
      this.trigger.addEventListener("click", () => {
        // console.log("Trigger clicked");
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

    // open() {
    //   console.log("Drawer Open Clicked");
    //   console.log(this.dialog);
    //   this.returnFocusEl = document.activeElement;
    //   this.dialog.showModal();
    //   document.documentElement.style.overflow = "hidden";
    // }

    open() {
      // console.log("Old Dialog:", this.dialog);

      const freshDialog = document.getElementById(
        this.trigger.getAttribute("aria-controls"),
      );

      // console.log("Fresh Dialog:", freshDialog);
      // console.log("Same Object?", this.dialog === freshDialog);
      this.returnFocusEl = document.activeElement;
      freshDialog.showModal();
      document.documentElement.style.overflow = "hidden";
    }

    // close() {
    //   this.dialog.close();
    //   document.documentElement.style.overflow = "";
    //   if (this.returnFocusEl instanceof HTMLElement) this.returnFocusEl.focus();
    // }

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
