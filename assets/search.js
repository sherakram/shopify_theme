// document.addEventListener("DOMContentLoaded", () => {
//   const modal = document.getElementById("search-modal");
//   const searchInput = document.getElementById("search-input");
//   const suggestions = document.getElementById("search-suggestions");
//   let lastFocusedElement = null;

//   function trapFocus(e) {
//     const focusable = modal.querySelectorAll("button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])");
//     const first = focusable[0];
//     const last = focusable[focusable.length - 1];

//     if (e.key === "Tab") {
//       if (e.shiftKey && document.activeElement === first) {
//         e.preventDefault();
//         last.focus();
//       } else if (!e.shiftKey && document.activeElement === last) {
//         e.preventDefault();
//         first.focus();
//       }
//     }
//   }

//   document.querySelectorAll("[data-open-search]").forEach(btn =>
//     btn.addEventListener("click", () => {
//       lastFocusedElement = document.activeElement;
//       modal.classList.add("active");
//       modal.setAttribute("aria-hidden", "false");
//       searchInput.focus();

//       document.addEventListener("keydown", trapFocus);
//     })
//   );

//   function closeModal() {
//     modal.classList.remove("active");
//     modal.setAttribute("aria-hidden", "true");
//     document.removeEventListener("keydown", trapFocus);
//     if (lastFocusedElement) lastFocusedElement.focus();
//   }

//   modal.querySelectorAll("[data-close]").forEach(btn =>
//     btn.addEventListener("click", closeModal)
//   );

//   modal.addEventListener("click", (e) => {
//     if (e.target.classList.contains("search-modal__overlay")) closeModal();
//   });

//   document.addEventListener("keydown", (e) => {
//     if (e.key === "Escape" && modal.classList.contains("active")) {
//       closeModal();
//     }
//   });

// let timeout;
// searchInput.addEventListener("input", (e) => {
//   clearTimeout(timeout);
//   const query = e.target.value.trim();
//   if (query.length < 2) {
//     suggestions.innerHTML = "";
//     return;
//   }

//   timeout = setTimeout(() => {
//     fetch(`/search/suggest.json?q=${encodeURIComponent(query)}&resources[type]=product,collection,article,page`)
//       .then(res => res.json())
//       .then(data => {
//         let html = "";
//         ["products", "collections", "articles"].forEach(type => {
//           if (data.resources.results[type].length) {
//             html += `<h4 class="suggestion-heading">${type}</h4><ul class="suggestion-list">`;
//             data.resources.results[type].forEach(item => {
//               html += `
//                 <li class="suggestion-item">
//                   <a href="${item.url}" class="suggestion-link">
//                     ${item.image ? `<img src="${item.image}" alt="${item.title}" class="suggestion-img">` : ""}
//                     <span class="suggestion-title">${item.title}</span>
//                   </a>
//                 </li>`;
//             });
//             html += "</ul>";
//           }
//         });
//         suggestions.innerHTML = html || "<p class='no-results'>No suggestions found.</p>";
//       });
//   }, 300);
// });
// });


(() => {
  'use strict';

  const SELECTORS = {
    trigger: '[data-search-trigger]',
    modal: '[data-search-modal]',
    form: '[data-search-form]',
    input: '[data-search-input]',
    clear: '[data-search-clear]',
    close: '[data-search-close]',
    results: '[data-search-results]',
    empty: '[data-search-empty]',
    status: '[data-search-status]',
    recentWrap: '[data-search-recent]',
    recentList: '[data-search-recent-list]',
  };

  const MIN_QUERY_LENGTH = 2;
  const DEBOUNCE_MS = 220;
  const RECENT_KEY = 'shopify:recent_searches';
  const RECENT_LIMIT = 5;
  const RESULT_TYPES = 'product,collection,page,article';
  const RESULT_LIMIT_EACH = 4;

  class PredictiveSearch {
    constructor(root) {
      this.modal = root.querySelector(SELECTORS.modal);
      if (!this.modal) return;

      this.trigger = root.querySelector(SELECTORS.trigger);
      this.form = this.modal.querySelector(SELECTORS.form);
      this.input = this.modal.querySelector(SELECTORS.input);
      this.clearBtn = this.modal.querySelector(SELECTORS.clear);
      this.closeBtn = this.modal.querySelector(SELECTORS.close);
      this.resultsEl = this.modal.querySelector(SELECTORS.results);
      this.emptyEl = this.modal.querySelector(SELECTORS.empty);
      this.statusEl = this.modal.querySelector(SELECTORS.status);
      this.recentWrap = this.modal.querySelector(SELECTORS.recentWrap);
      this.recentListEl = this.modal.querySelector(SELECTORS.recentList);

      this.abortController = null;
      this.debounceTimer = null;
      this.lastQuery = '';
      this.activeIndex = -1;
      this.cache = new Map();

      this.bindEvents();
      this.renderRecent();
    }

    bindEvents() {
      this.trigger?.addEventListener('click', () => this.open());

      document.addEventListener('keydown', (event) => {
        const isShortcut = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k';
        if (isShortcut) {
          event.preventDefault();
          this.modal.open ? this.close() : this.open();
        }
      });

      this.closeBtn?.addEventListener('click', () => this.close());

      // Click on the ::backdrop area (outside the panel) closes the dialog.
      this.modal.addEventListener('click', (event) => {
        const panel = this.modal.querySelector('.search-modal__panel');
        if (panel && !panel.contains(event.target)) this.close();
      });

      // <dialog> fires 'cancel' on native Esc; keep our own close logic in sync.
      this.modal.addEventListener('cancel', (event) => {
        event.preventDefault();
        this.close();
      });

      this.input?.addEventListener('input', (event) => this.onInput(event.target.value));

      this.clearBtn?.addEventListener('click', () => {
        this.input.value = '';
        this.input.focus();
        this.onInput('');
      });

      this.form?.addEventListener('submit', (event) => {
        const term = this.input.value.trim();
        if (!term) {
          event.preventDefault();
          return;
        }
        this.saveRecent(term);
      });

      this.resultsEl?.addEventListener('keydown', (event) => this.onResultsKeydown(event));
    }

    open() {
      if (this.modal.open) return;
      this.returnFocusEl = document.activeElement;
      this.modal.showModal();
      // Guard iOS/Android viewport shift and allow the open transition to start first.
      requestAnimationFrame(() => this.input?.focus({ preventScroll: true }));
      document.documentElement.style.overflow = 'hidden';
    }

    close() {
      if (!this.modal.open) return;
      this.modal.close();
      document.documentElement.style.overflow = '';
      this.abortController?.abort();
      if (this.returnFocusEl instanceof HTMLElement) this.returnFocusEl.focus();
    }

    onInput(rawValue) {
      const value = rawValue.trim();
      this.clearBtn.hidden = value.length === 0;
      window.clearTimeout(this.debounceTimer);

      if (value.length < MIN_QUERY_LENGTH) {
        this.showEmptyState();
        this.input.setAttribute('aria-expanded', 'false');
        return;
      }

      this.debounceTimer = window.setTimeout(() => this.fetchResults(value), DEBOUNCE_MS);
    }

    showEmptyState() {
      this.resultsEl.innerHTML = '';
      this.resultsEl.appendChild(this.emptyEl);
      this.emptyEl.hidden = false;
      this.renderRecent();
    }

    showSkeleton() {
      this.resultsEl.innerHTML = `
        <div class="search-modal__skeleton" aria-hidden="true">
          ${Array.from({ length: 4 }).map(() => `
            <div class="search-modal__skeleton-row">
              <div class="search-modal__skeleton-thumb"></div>
              <div class="search-modal__skeleton-line"></div>
            </div>`).join('')}
        </div>`;
    }

    async fetchResults(query) {
      this.lastQuery = query;

      if (this.cache.has(query)) {
        this.renderResults(query, this.cache.get(query));
        return;
      }

      this.showSkeleton();
      this.abortController?.abort();
      this.abortController = new AbortController();

      const url = `${window.Shopify?.routes?.root || '/'}search/suggest.json`
        + `?q=${encodeURIComponent(query)}`
        + `&resources[type]=${RESULT_TYPES}`
        + `&resources[limit]=${RESULT_LIMIT_EACH}`
        + `&resources[limit_scope]=each`
        + `&resources[options][unavailable_products]=last`
        + `&resources[options][fields]=title,product_type,variants.title,vendor`
        + `&section_id=predictive-search`;

      try {
        const response = await fetch(url, { signal: this.abortController.signal });
        if (!response.ok) throw new Error(`Search request failed: ${response.status}`);
        const data = await response.json();

        // Stale response guard: only render if this is still the current query.
        if (query !== this.lastQuery) return;

        this.cache.set(query, data.resources.results);
        this.renderResults(query, data.resources.results);
      } catch (error) {
        if (error.name === 'AbortError') return;
        this.renderError();
      }
    }

    renderResults(query, results) {
      const { products = [], collections = [], pages = [], articles = [], queries = [] } = results;
      const totalCount = products.length + collections.length + pages.length + articles.length;

      this.statusEl.textContent = totalCount
        ? `${totalCount} result${totalCount === 1 ? '' : 's'} found`
        : 'No results found';

      if (totalCount === 0 && queries.length === 0) {
        this.renderNoResults(query);
        this.input.setAttribute('aria-expanded', 'false');
        return;
      }

      const sections = [];

      if (queries.length) {
        sections.push(this.renderGroup('Suggestions', queries.map((suggestion) => this.queryRow(suggestion, query))));
      }
      if (products.length) {
        sections.push(this.renderGroup('Products', products.map((product) => this.productRow(product, query))));
      }
      if (collections.length) {
        sections.push(this.renderGroup('Collections', collections.map((collection) => this.linkRow(collection, query))));
      }
      if (pages.length) {
        sections.push(this.renderGroup('Pages', pages.map((page) => this.linkRow(page, query))));
      }
      if (articles.length) {
        sections.push(this.renderGroup('Articles', articles.map((article) => this.linkRow(article, query))));
      }

      const viewAllUrl = `${window.Shopify?.routes?.root || '/'}search?q=${encodeURIComponent(query)}&type=product`;
      sections.push(`
        <a class="search-modal__view-all" href="${viewAllUrl}">
          View all results for “${this.escape(query)}”
        </a>`);

      this.resultsEl.innerHTML = sections.join('');
      this.activeIndex = -1;
      this.input.setAttribute('aria-expanded', 'true');
    }

    renderGroup(label, rows) {
      return `
        <div class="search-modal__group" role="group" aria-label="${label}">
          <p class="search-modal__group-label">${label}</p>
          ${rows.join('')}
        </div>`;
    }

    queryRow(suggestion, query) {
      const url = `${window.Shopify?.routes?.root || '/'}search?q=${encodeURIComponent(suggestion.text)}&type=product`;
      return `
        <a class="search-modal__item" href="${url}" data-search-result>
          <span class="search-modal__item-media search-modal__item-media--query">
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="1.75"/><line x1="21" y1="21" x2="16.2" y2="16.2" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/></svg>
          </span>
          <span class="search-modal__item-body">
            <p class="search-modal__item-title">${this.highlight(suggestion.text, query)}</p>
          </span>
        </a>`;
    }

    productRow(product, query) {
      const image = product.image ? `<img src="${product.image}" alt="" loading="lazy" width="48" height="48">` : '';
      const price = this.formatMoney(product.price);
      const compareAt = product.compare_at_price_max > product.price
        ? `<s>${this.formatMoney(product.compare_at_price_max)}</s>` : '';
      return `
        <a class="search-modal__item" href="${product.url}" data-search-result>
          <span class="search-modal__item-media">${image}</span>
          <span class="search-modal__item-body">
            <p class="search-modal__item-title">${this.highlight(product.title, query)}</p>
            ${product.vendor ? `<p class="search-modal__item-meta">${this.escape(product.vendor)}</p>` : ''}
          </span>
          <span class="search-modal__item-price">${compareAt}${price}</span>
        </a>`;
    }

    linkRow(item, query) {
      const image = item.image ? `<img src="${item.image}" alt="" loading="lazy" width="48" height="48">` : '';
      return `
        <a class="search-modal__item" href="${item.url}" data-search-result>
          <span class="search-modal__item-media">${image}</span>
          <span class="search-modal__item-body">
            <p class="search-modal__item-title">${this.highlight(item.title, query)}</p>
          </span>
        </a>`;
    }

    renderNoResults(query) {
      this.resultsEl.innerHTML = `
        <div class="search-modal__no-results">
          <p class="search-modal__no-results-title">No results for “${this.escape(query)}”</p>
          <p class="search-modal__no-results-hint">Try a different spelling, a more general term, or check for typos.</p>
        </div>`;
    }

    renderError() {
      this.resultsEl.innerHTML = `
        <div class="search-modal__no-results">
          <p class="search-modal__no-results-title">Something went wrong</p>
          <p class="search-modal__no-results-hint">Please try your search again.</p>
        </div>`;
    }

    onResultsKeydown(event) {
      const items = Array.from(this.resultsEl.querySelectorAll('[data-search-result]'));
      if (!items.length) return;

      if (event.key === 'ArrowDown') {
        event.preventDefault();
        this.activeIndex = (this.activeIndex + 1) % items.length;
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        this.activeIndex = (this.activeIndex - 1 + items.length) % items.length;
      } else if (event.key === 'Home') {
        event.preventDefault();
        this.activeIndex = 0;
      } else if (event.key === 'End') {
        event.preventDefault();
        this.activeIndex = items.length - 1;
      } else {
        return;
      }

      items.forEach((item, index) => item.classList.toggle('is-active', index === this.activeIndex));
      items[this.activeIndex].focus();
    }

    // ---- Recent searches --------------------------------------------------

    getRecent() {
      try {
        return JSON.parse(window.localStorage.getItem(RECENT_KEY) || '[]');
      } catch {
        return [];
      }
    }

    saveRecent(term) {
      const recent = this.getRecent().filter((entry) => entry.toLowerCase() !== term.toLowerCase());
      recent.unshift(term);
      try {
        window.localStorage.setItem(RECENT_KEY, JSON.stringify(recent.slice(0, RECENT_LIMIT)));
      } catch {
        /* localStorage unavailable (private mode, quota) — fail silently */
      }
    }

    renderRecent() {
      const recent = this.getRecent();
      if (!recent.length || !this.recentWrap) {
        if (this.recentWrap) this.recentWrap.hidden = true;
        return;
      }
      this.recentWrap.hidden = false;
      this.recentListEl.innerHTML = recent.map((term) => `
        <li><button type="button" data-recent-term="${this.escape(term)}">${this.escape(term)}</button></li>
      `).join('');

      this.recentListEl.querySelectorAll('[data-recent-term]').forEach((button) => {
        button.addEventListener('click', () => {
          this.input.value = button.dataset.recentTerm;
          this.input.focus();
          this.onInput(button.dataset.recentTerm);
        });
      });
    }

    // ---- Utilities ----------------------------------------------------------

    escape(str = '') {
      const div = document.createElement('div');
      div.textContent = str;
      return div.innerHTML;
    }

    highlight(text = '', query = '') {
      const safeText = this.escape(text);
      const safeQuery = this.escape(query).trim();
      if (!safeQuery) return safeText;
      const pattern = new RegExp(`(${safeQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'ig');
      return safeText.replace(pattern, '<mark>$1</mark>');
    }

    formatMoney(cents) {
      if (typeof cents !== 'number') return '';
      const amount = (cents / 100).toFixed(2);
      const currency = window.Shopify?.currency?.active || '';
      return `${amount}${currency ? ' ' + currency : ''}`;
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-search-trigger]').forEach((trigger) => {
      // Trigger and dialog are siblings rendered by the same snippet include,
      // so scope from the closest shared ancestor (falls back to document).
      const scope = trigger.closest('body') || document;
      new PredictiveSearch(scope);
    });
  });
})();
