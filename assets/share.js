document.addEventListener('click', function(e){
      var btn = e.target.closest('.share-btn.copy');
      if(!btn) return;
      var url = btn.getAttribute('data-share');
      navigator.clipboard.writeText(url).then(function(){
        var original = btn.textContent;
        btn.textContent = 'Copied';
        setTimeout(function(){ btn.textContent = original; }, 1200);
      });
    });