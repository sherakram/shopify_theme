(function () {
  document.querySelectorAll(".share-btn.copy").forEach(function (btn) {
    if (btn.dataset.bound) return;
    btn.dataset.bound = "true";
    btn.addEventListener("click", function () {
      navigator.clipboard.writeText(btn.dataset.shareUrl).then(function () {
        btn.innerHTML = '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 10l4 4 8-8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
        btn.classList.add("copied");
        setTimeout(function () {
          btn.innerHTML = originalHTML;
          btn.classList.remove("copied");
        }, 1800);
      });
    });
  });
})();
