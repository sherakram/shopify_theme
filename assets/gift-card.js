(function () {
        document.addEventListener('DOMContentLoaded', function () {
          var qrEl = document.getElementById('gc-qr-code');
          if (qrEl && typeof QRCode !== 'undefined') {
            new QRCode(qrEl, {
              text: '{{ gift_card.qr_identifier }}',
              width: window.innerWidth < 480 ? 96 : 120,
              height: window.innerWidth < 480 ? 96 : 120,
              colorDark: '#0b0a09',
              colorLight: '#ffffff',
              correctLevel: QRCode.CorrectLevel.M
            });
          }
        });

        var copyBtn = document.getElementById('gc-copy-btn');
        if (copyBtn) {
          copyBtn.addEventListener('click', function () {
            var code = this.dataset.code;
            if (!code) return;
            if (navigator.clipboard && navigator.clipboard.writeText) {
              navigator.clipboard.writeText(code).then(showCopied.bind(this));
            } else {
              var ta = document.createElement('textarea');
              ta.value = code;
              ta.style.cssText = 'position:fixed;left:-9999px;top:-9999px;';
              document.body.appendChild(ta);
              ta.select();
              document.execCommand('copy');
              document.body.removeChild(ta);
              showCopied.call(this);
            }
          });
        }

        var printBtn = document.getElementById('gc-print-btn');
        
        if (printBtn) {
            printBtn.addEventListener('click', function () {
            window.print();
          });
        }

        function showCopied() {
          var original = this.textContent;
          var copiedText = document.body.dataset.copiedText || 'Copied!';
          this.textContent = copiedText;

          this.classList.add('copied');

          var liveRegion = document.getElementById('gc-live-region');
          if (liveRegion) {
            liveRegion.textContent = copiedText;
          }

          var self = this;
          setTimeout(function () {
            self.textContent = original;
            self.classList.remove('copied');
          }, 2200);
        }
      })();