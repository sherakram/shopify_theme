// Cart count
document.addEventListener('DOMContentLoaded', () => {
  const cartCountEl = document.querySelector('.cart-count');

  if (!cartCountEl) return;

  // Listen for any form with action '/cart/add'
  document.body.addEventListener('submit', function (e) {
    const form = e.target;

    // Check if it's a product form
    if (form.action.includes('/cart/add')) {
      e.preventDefault();

      const formData = new FormData(form);

      fetch('/cart/add.js', {
        method: 'POST',
        body: formData
      })
      .then(res => res.json())
      .then(() => fetch('/cart.js'))
      .then(res => res.json())
      .then(cart => {
        // Update cart count
        cartCountEl.textContent = cart.item_count;
      })
      .catch(err => console.error('Cart update error:', err));
    }
  });
});
