const CartAPI = {
  // Cart read
  getCart: async () => {
    const response = await fetch("/cart.js");
    return response.json();
  },

  // Single item update 0
  changeItem: async (key, quantity) => {
    const response = await fetch("/cart/change.js", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: key, quantity }),
    });
    return response.json();
  },

  // Multiple items update
  updateCart: async (updates) => {
    const response = await fetch("/cart/update.js", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ updates }),
    });
    return response.json();
  },

  // Note update
  updateNote: async (note) => {
    const response = await fetch("/cart/update.js", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note }),
    });
    return response.json();
  },

  clearCart: async () => {
    const response = await fetch("/cart/clear.js", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    return response.json();
  },
};

const CartUI = {
  hideItem: (key) => {
    const row = document.querySelector(`[data-item-key="${key}"]`);
    if (!row) return;
    row.style.opacity = "0";
    row.style.transition = "opacity 0.25s";
    setTimeout(() => row.remove(), 260);
  },

  // Subtotal / Total update
  updateTotals: (cart) => {
    const format = (cents) => `Rs.${(cents / 100).toFixed(2)}`;

    const subtotalEl = document.querySelector("[data-cart-subtotal]");
    const totalEl = document.querySelector("[data-cart-total]");
    const checkoutEl = document.querySelector("[data-checkout-total]");
    const countEl = document.querySelector("[data-cart-count]");
    const pageCount = document.querySelector(".cart-page__count");
    const headerCount = document.querySelector(".cart-count");

    if (subtotalEl) subtotalEl.textContent = format(cart.total_price);
    if (totalEl) totalEl.textContent = format(cart.total_price);
    if (checkoutEl) checkoutEl.textContent = format(cart.total_price);
    if (countEl) countEl.textContent = `(${cart.item_count})`;
    if (pageCount) pageCount.textContent = cart.item_count;
    if (headerCount) headerCount.textContent = cart.item_count;
  },

  // Line total
  updateLineTotal: (key, linePriceCents) => {
    const row = document.querySelector(`[data-item-key="${key}"]`);
    if (!row) return;
    const el = row.querySelector("[data-line-total]");
    if (el) el.textContent = `Rs.${(linePriceCents / 100).toFixed(2)}`;
  },

  updateShippingBar: (cart) => {
    const bar = document.querySelector("[data-free-shipping-bar]");
    if (!bar) return;

    const threshold = window.ShopifyCart?.settings?.freeShippingThreshold || 0;
    if (!threshold) return;

    const fill = bar.querySelector(".free-shipping-bar__fill");
    const msg = bar.querySelector(".free-shipping-bar__message");

    const progress = Math.min(
      100,
      Math.round((cart.total_price / threshold) * 100),
    );
    const remaining = threshold - cart.total_price;

    if (fill) {
      fill.style.width = `${progress}%`;
      fill.dataset.progress = progress;
    }

    if (msg) {
      if (remaining <= 0) {
        msg.classList.add("free-shipping-bar__message--achieved");
        msg.textContent =
          "🎉 " + (window.ShopifyCart.settings.freeShippingAchievedText || "");
      } else {
        msg.classList.remove("free-shipping-bar__message--achieved");

        const formatted =
          "Rs." +
          (remaining / 100).toLocaleString("en-PK", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          });

        const template =
          window.ShopifyCart.settings.freeShippingProgressText || "";
        msg.textContent = template.replace("[amount]", formatted);
      }
    }
  },

  // Loading state
  setItemLoading: (key, isLoading) => {
    const row = document.querySelector(`[data-item-key="${key}"]`);
    if (!row) return;
    const overlay = row.querySelector("[data-item-loading]");
    if (overlay) overlay.style.display = isLoading ? "flex" : "none";
  },

  // Toast messaga
  showToast: (message) => {
    const toast = document.querySelector("[data-cart-toast]");
    const msgEl = document.querySelector("[data-toast-message]");
    if (!toast || !msgEl) return;

    msgEl.textContent = message;
    toast.classList.add("is-visible");

    setTimeout(() => toast.classList.remove("is-visible"), 2500);
  },

  checkEmpty: (cart) => {
    if (cart.item_count === 0) {
      window.location.reload();
    }
  },
};

const CartEvents = {
  init: () => {
    const list = document.querySelector("[data-cart-items]");
    if (!list) return;

    CartEvents.bindItemActions(list);
    CartEvents.bindNoteToggle();
    CartEvents.bindNoteInput();
    CartEvents.bindClearCart();

    console.log("[Cart] Initialized ✓");
  },

  // Remove + Qty buttons
  bindItemActions: (list) => {
    list.addEventListener("click", async (e) => {
      const removeLink = e.target.closest("[data-remove-item]");
      if (removeLink) {
        e.preventDefault();
        const key = removeLink.dataset.itemKey;
        await CartEvents.handleRemove(key);
        return;
      }

      // Qty plus button
      const plusBtn = e.target.closest("[data-qty-plus]");
      if (plusBtn) {
        const stepper = plusBtn.closest("[data-qty-stepper]");
        const key = stepper.dataset.itemKey;
        const inputs = document.querySelectorAll(`[data-quantity-input][data-item-key="${key}"]`);
        const newQty = Math.min(parseInt(inputs[0].value) + 1, 99);
        inputs.forEach(inp => inp.value = newQty);
        await CartEvents.handleQtyChange(key, newQty);
        return;
      }

      // Qty minus button
      const minusBtn = e.target.closest("[data-qty-minus]");
      if (minusBtn) {
        const stepper = minusBtn.closest("[data-qty-stepper]");
        const key = stepper.dataset.itemKey;
        const inputs = document.querySelectorAll(`[data-quantity-input][data-item-key="${key}"]`);
        const newQty = Math.max(parseInt(inputs[0].value) - 1, 0);
        inputs.forEach(inp => inp.value = newQty);
        await CartEvents.handleQtyChange(key, newQty);
        return;
      }
    });

    list.addEventListener("change", async (e) => {
      const input = e.target.closest("[data-quantity-input]");
      if (!input) return;
      let qty = parseInt(input.value);
      if (isNaN(qty) || qty < 0) qty = 0;
      if (qty > 99) qty = 99;

      const key = input.dataset.itemKey;
      document
        .querySelectorAll(`[data-quantity-input][data-item-key="${key}"]`)
        .forEach(inp => inp.value = qty);

      await CartEvents.handleQtyChange(key, qty);
    });
  },

  // Remove handler
  handleRemove: async (key) => {
    CartUI.setItemLoading(key, true);
    try {
      const cart = await CartAPI.changeItem(key, 0);
      CartUI.hideItem(key);
      CartUI.updateTotals(cart);
      CartUI.updateShippingBar(cart);
      CartUI.showToast("Item removed");
      CartUI.checkEmpty(cart);
    } catch (err) {
      console.error("[Cart] Remove failed:", err);
      CartUI.showToast("Something went wrong");
      CartUI.setItemLoading(key, false);
    }
  },

  // Qty change
  handleQtyChange: async (key, quantity) => {
    if (quantity === 0) {
      await CartEvents.handleRemove(key);
      return;
    }
    CartUI.setItemLoading(key, true);
    try {
      const cart = await CartAPI.changeItem(key, quantity);

      const updatedItem = cart.items.find((item) => item.key === key);
      if (updatedItem) {
        CartUI.updateLineTotal(key, updatedItem.final_line_price);
      }
      CartUI.updateTotals(cart);
      CartUI.updateShippingBar(cart);
      CartUI.showToast("Cart updated");
    } catch (err) {
      console.error("[Cart] Update failed:", err);
      CartUI.showToast("Something went wrong");
    } finally {
      CartUI.setItemLoading(key, false);
    }
  },

  // Note toggle
  bindNoteToggle: () => {
    const toggle = document.querySelector("[data-note-toggle]");
    const body = document.querySelector("[data-note-body]");
    if (!toggle || !body) return;

    toggle.addEventListener("click", () => {
      const isOpen = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!isOpen));
      body.classList.toggle("is-open", !isOpen);
    });
  },

  // Note save
  bindNoteInput: () => {
    const noteInput = document.querySelector("[data-cart-note]");
    if (!noteInput) return;

    let timer;
    noteInput.addEventListener("input", () => {
      clearTimeout(timer);
      timer = setTimeout(async () => {
        try {
          await CartAPI.updateNote(noteInput.value);
          CartUI.showToast("Note saved");
        } catch (err) {
          console.error("[Cart] Note save failed:", err);
        }
      }, 800);
    });
  },

  // Clear cart
  bindClearCart: () => {
    const clearForm = document.querySelector("#clear-form");
    if (!clearForm) return;

    clearForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      try {
        await CartAPI.clearCart();
        window.location.reload();
      } catch (err) {
        console.error("[Cart] Clear failed:", err);
        CartUI.showToast("Something went wrong");
      }
    });
  },
};

document.addEventListener("DOMContentLoaded", () => {
  CartEvents.init();
});
