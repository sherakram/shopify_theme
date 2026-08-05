(() => {
  "use strict";

  class FacetsAjax {
    constructor() {
      this.abortController = null;
      this.cache = {};
      this.form = document.getElementById("CollectionFacetsForm");

      if (!this.form) return;

      this.bindEvents();
      this.bindPopState();
    }

    bindEvents() {
      document.addEventListener("change", (event) => {
        const target = event.target;

        if (!target.closest("#CollectionFacetsForm")) return;

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
    }

    bindPopState() {
      window.addEventListener("popstate", () => {
        this.loadProducts(window.location.href);
      });
    }

    async loadProducts(url = null) {
      const section = document
        .querySelector("[data-section]")
        .dataset.section;

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
          this.cache[fetchUrl] = html;
        }

        const wrapper = document.createElement("div");
        wrapper.innerHTML = html;

        const sections = [
          "CollectionProductGrid",
          "CollectionProductCount",
          "CollectionFilters",
          "CollectionSort",
          "CollectionPagination",
        ];

        sections.forEach((section) => {
          const current = document.querySelector(`[id^="${section}-"]`);
          const updated = wrapper.querySelector(`[id^="${section}-"]`);

          if (current && updated) {
            current.innerHTML = updated.innerHTML;
          }
        });

        if (window.location.href !== url) {
          console.log("History URL:", url);
          console.log("Fetch URL:", fetchUrl);
          history.pushState({}, "", url);
        }
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error(error);
        }
      } finally {
        if (grid) {
          grid.classList.remove("loading");
        }
      }
    }
  }

  class FacetsDrawer {
    constructor(trigger, dialog) {
      this.trigger = trigger;
      this.dialog = dialog;
      this.bind();
    }

    bind() {
      this.trigger.addEventListener("click", () => this.open());

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
      this.returnFocusEl = document.activeElement;
      this.dialog.showModal();
      document.documentElement.style.overflow = "hidden";
    }

    close() {
      this.dialog.close();
      document.documentElement.style.overflow = "";
      if (this.returnFocusEl instanceof HTMLElement) this.returnFocusEl.focus();
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    document
      .querySelectorAll("[data-facets-drawer-trigger]")
      .forEach((trigger) => {
        const dialogId = trigger.getAttribute("aria-controls");
        const dialog = dialogId ? document.getElementById(dialogId) : null;

        if (dialog) {
          new FacetsDrawer(trigger, dialog);
        }
      });

    new FacetsAjax();
  });
})();
