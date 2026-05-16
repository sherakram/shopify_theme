(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {

    var qrEl = document.getElementById('gc-qr-code');
    if (qrEl && typeof QRCode !== 'undefined') {
      new QRCode(qrEl, {
        text: qrEl.dataset.qrIdentifier || '',
        width:  window.innerWidth < 480 ? 96 : 120,
        height: window.innerWidth < 480 ? 96 : 120,
        colorDark:  '#0b0a09',
        colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.M
      });
    }

    var copyBtn = document.getElementById('gc-copy-btn');
    if (copyBtn) {
      copyBtn.addEventListener('click', function () {
        var code = this.dataset.code;
        if (!code) return;

        var self = this;

        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(code)
            .then(function () { showCopied(self); })
            .catch(function () { fallbackCopy(code, self); });
        } else {
          fallbackCopy(code, self);
        }
      });
    }

    var printBtn = document.getElementById('gc-print-btn');
    if (printBtn) {
      printBtn.addEventListener('click', function () {
        window.print();
      });
    }

  });

  function fallbackCopy(text, btn) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.cssText = 'position:fixed;left:-9999px;top:-9999px;opacity:0;';
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
      showCopied(btn);
    } catch (err) {
      console.warn('[Gift Card] Copy failed:', err);
    }
    document.body.removeChild(ta);
  }

  function showCopied(btn) {
    var original  = btn.textContent;
    var copiedText = document.body.dataset.copiedText || 'Copied!';

    btn.textContent = copiedText;
    btn.classList.add('copied');

    var liveRegion = document.getElementById('gc-live-region');
    if (liveRegion) liveRegion.textContent = copiedText;

    setTimeout(function () {
      btn.textContent = original;
      btn.classList.remove('copied');
      if (liveRegion) liveRegion.textContent = '';
    }, 2200);
  }

})();