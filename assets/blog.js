document.addEventListener('DOMContentLoaded', () => {
  const section = document.querySelector('[data-blog-section]');
  if (!section) return;

  const sectionId = section.dataset.sectionId;
  const blogUrl = section.dataset.blogUrl;
  const grid = section.querySelector('[data-blog-grid]');
  const filterGroup = section.querySelector('[data-blog-filter]');
  const statusEl = section.querySelector('[data-blog-status]');
  let loadMoreWrapper = section.querySelector('[data-load-more-wrapper]');

  function withSectionParam(url) {
    return url.includes('?')
      ? `${url}&section_id=${sectionId}`
      : `${url}?section_id=${sectionId}`;
  }

  function announce(message) {
    if (statusEl) statusEl.textContent = message;
  }

  function swapLoadMore(newWrapper) {
    if (newWrapper) {
      if (loadMoreWrapper) {
        loadMoreWrapper.replaceWith(newWrapper);
      } else {
        grid.insertAdjacentElement('afterend', newWrapper);
      }
      loadMoreWrapper = newWrapper;
    } else if (loadMoreWrapper) {
      loadMoreWrapper.remove();
      loadMoreWrapper = null;
    }
  }

  // Tag filter

  if (filterGroup) {
    filterGroup.addEventListener('click', (event) => {
      const pill = event.target.closest('[data-tag]');
      if (!pill || pill.classList.contains('is-active')) return;
      filterByTag(pill.dataset.tag);
    });
  }

  async function filterByTag(tag) {
    grid.classList.add('blog-grid--loading');

    const targetUrl = tag ? `${blogUrl}/tagged/${encodeURIComponent(tag)}` : blogUrl;

    try {
      const response = await fetch(withSectionParam(targetUrl));
      if (!response.ok) throw new Error('Filter request failed');

      const doc = new DOMParser().parseFromString(await response.text(), 'text/html');
      const newGrid = doc.querySelector('[data-blog-grid]');
      const newFilterGroup = doc.querySelector('[data-blog-filter]');
      const newHero = doc.querySelector('.blog-hero');
      const currentHero = section.querySelector('.blog-hero');

      if (newGrid) grid.innerHTML = newGrid.innerHTML;
      if (newFilterGroup) filterGroup.innerHTML = newFilterGroup.innerHTML;
      swapLoadMore(doc.querySelector('[data-load-more-wrapper]'));

      // Hero only shows on the unfiltered view — keep it in sync too.
      if (currentHero && !newHero) currentHero.remove();
      if (!currentHero && newHero) grid.insertAdjacentElement('beforebegin', newHero);

      history.pushState({}, '', targetUrl);
      announce(`Showing articles${tag ? ` tagged ${tag}` : ''}`);

      grid.setAttribute('tabindex', '-1');
      grid.focus({ preventScroll: true });
    } catch (error) {
      console.error('Blog filter error:', error);
    } finally {
      grid.classList.remove('blog-grid--loading');
    }
  }

  // Load more

  section.addEventListener('click', (event) => {
    const button = event.target.closest('[data-load-more-button]');
    if (!button) return;
    loadMore(button);
  });

  async function loadMore(button) {
    const nextUrl = button.dataset.nextUrl;
    if (!nextUrl) return;

    button.disabled = true;
    button.classList.add('is-loading');

    try {
      const response = await fetch(withSectionParam(nextUrl));
      if (!response.ok) throw new Error('Load more request failed');

      const doc = new DOMParser().parseFromString(await response.text(), 'text/html');
      const newCards = doc.querySelectorAll('[data-blog-grid] .blog-card');
      newCards.forEach((card) => grid.appendChild(card));

      swapLoadMore(doc.querySelector('[data-load-more-wrapper]'));
      announce(`Loaded ${newCards.length} more articles`);
    } catch (error) {
      console.error('Blog load more error:', error);
      button.disabled = false;
      button.classList.remove('is-loading');
    }
  }
});