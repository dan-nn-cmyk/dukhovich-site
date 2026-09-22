// Each feature is isolated in its own try/catch so a failure in one
  // (e.g. canvas drawing on an odd browser) can never block the others —
  // in particular it must never prevent content from being shown.

  // mobile nav
  try{
    var navToggle = document.getElementById('navToggle');
    var mainNav = document.getElementById('mainNav');
    navToggle.addEventListener('click', function(){
      mainNav.classList.toggle('open');
    });
    mainNav.querySelectorAll('a').forEach(function(a){
      a.addEventListener('click', function(){ mainNav.classList.remove('open'); });
    });
  }catch(err){ console.error('nav init failed', err); }

  // product galleries
  try{
    var lightbox = document.getElementById('productLightbox');
    var lightboxImage = lightbox.querySelector('.lightbox-image');
    var lightboxTitle = lightbox.querySelector('.lightbox-title');
    var lightboxCount = lightbox.querySelector('.lightbox-count');
    var lightboxState = null;

    function formatCount(index, total){
      return String(index + 1).padStart(2, '0') + ' / ' + String(total).padStart(2, '0');
    }

    function renderLightbox(){
      if(!lightboxState) return;
      var item = lightboxState.thumbs[lightboxState.index];
      lightboxImage.src = item.dataset.src;
      lightboxImage.alt = item.dataset.alt;
      lightboxTitle.textContent = lightboxState.title;
      lightboxCount.textContent = formatCount(lightboxState.index, lightboxState.thumbs.length);
    }

    function moveLightbox(direction){
      if(!lightboxState) return;
      var total = lightboxState.thumbs.length;
      lightboxState.index = (lightboxState.index + direction + total) % total;
      lightboxState.activate(lightboxState.index, false);
      renderLightbox();
    }

    document.querySelectorAll('[data-product-gallery]').forEach(function(gallery){
      var mainImage = gallery.querySelector('.product-main');
      var mainButton = gallery.querySelector('.product-main-button');
      var counter = gallery.querySelector('.gallery-count');
      var thumbs = Array.from(gallery.querySelectorAll('.product-thumb'));
      var title = gallery.closest('.product-card').querySelector('.product-title').textContent;

      function activate(index, animate){
        var button = thumbs[index];
        if(!button) return;
        if(animate) mainImage.classList.add('is-switching');

        thumbs.forEach(function(item){
          item.classList.remove('active');
          item.setAttribute('aria-pressed', 'false');
        });
        button.classList.add('active');
        button.setAttribute('aria-pressed', 'true');
        mainImage.src = button.dataset.src;
        mainImage.alt = button.dataset.alt;
        if(counter) counter.textContent = formatCount(index, thumbs.length);

        window.setTimeout(function(){ mainImage.classList.remove('is-switching'); }, animate ? 140 : 0);
        if(lightboxState && lightboxState.gallery === gallery) lightboxState.index = index;
      }

      thumbs.forEach(function(button, index){
        button.addEventListener('click', function(){
          if(!button.classList.contains('active')) activate(index, true);
        });
      });

      mainButton.addEventListener('click', function(){
        var activeIndex = thumbs.findIndex(function(item){ return item.classList.contains('active'); });
        lightboxState = {
          gallery: gallery,
          thumbs: thumbs,
          index: Math.max(activeIndex, 0),
          title: title,
          activate: activate
        };
        renderLightbox();
        lightbox.showModal();
      });
    });

    lightbox.querySelector('.lightbox-prev').addEventListener('click', function(){ moveLightbox(-1); });
    lightbox.querySelector('.lightbox-next').addEventListener('click', function(){ moveLightbox(1); });
    lightbox.querySelector('.lightbox-close').addEventListener('click', function(){ lightbox.close(); });
    lightbox.addEventListener('click', function(event){
      if(event.target === lightbox) lightbox.close();
    });
    document.addEventListener('keydown', function(event){
      if(!lightbox.open) return;
      if(event.key === 'ArrowLeft') moveLightbox(-1);
      if(event.key === 'ArrowRight') moveLightbox(1);
    });
  }catch(err){ console.error('product gallery init failed', err); }

  // Reveal-on-scroll, implemented with direct inline styles (not classes),
  // so there is no stylesheet-cascade specificity involved at all: inline
  // style always wins, full stop. CSS already defaults everything to
  // visible, so if anything below throws, content simply stays visible.
  try{
    var revealEls = document.querySelectorAll('.reveal');
    var hiddenSet = false;
    revealEls.forEach(function(el){
      el.style.opacity = '0';
      el.style.transform = 'translateY(22px)';
      hiddenSet = true;
    });

    function showEl(el){
      el.style.opacity = '1';
      el.style.transform = 'translateY(0)';
    }
    function showAllNow(){
      revealEls.forEach(showEl);
    }

    if(hiddenSet){
      if('IntersectionObserver' in window){
        var io = new IntersectionObserver(function(entries){
          entries.forEach(function(e){
            if(e.isIntersecting){ showEl(e.target); io.unobserve(e.target); }
          });
        }, {threshold:0.12});
        revealEls.forEach(function(el){ io.observe(el); });
      } else {
        showAllNow();
      }
      // Safety net: whatever happens with the observer, make absolutely
      // sure every section is visible shortly after load regardless.
      setTimeout(showAllNow, 2000);
    }
  }catch(err){
    console.error('reveal init failed', err);
    document.querySelectorAll('.reveal').forEach(function(el){
      el.style.opacity = '1';
      el.style.transform = 'none';
    });
  }

  // order links: open the chat directly, prefilled where the messenger supports it
  try{
    var contactForm = document.getElementById('contactForm');

    function formMessage(){
      var fields = {
        name: document.getElementById('f-name').value.trim(),
        contact: document.getElementById('f-contact').value.trim(),
        model: document.getElementById('f-model').value,
        message: document.getElementById('f-msg').value.trim()
      };
      return [
        'Здравствуйте! Хочу связаться по поводу рюкзака.',
        'Имя: ' + fields.name,
        'Как ответить: ' + fields.contact,
        'Модель: ' + fields.model,
        'Сообщение: ' + fields.message
      ].join('\n');
    }

    document.querySelectorAll('.order-links').forEach(function(group){
      var inForm = contactForm.contains(group);
      group.querySelectorAll('.order-link').forEach(function(link){
        var base = link.getAttribute('href');
        link.addEventListener('click', function(event){
          if(inForm && !contactForm.reportValidity()){ event.preventDefault(); return; }
          var message = inForm ? formMessage() : group.dataset.message;
          if(link.dataset.messenger === 'vk'){
            // VK has no prefill link: put the text on the clipboard to paste into the chat
            if(navigator.clipboard) navigator.clipboard.writeText(message).catch(function(){});
          }else{
            link.href = base + '?text=' + encodeURIComponent(message);
          }
        });
      });
    });
  }catch(err){ console.error('order links init failed', err); }

  // topographic contour canvas (purely decorative — must never affect the rest of the page)
  try{
    function drawTopo(canvas){
      var ctx = canvas.getContext('2d');
      if(!ctx) return;
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      var w = canvas.clientWidth, h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr,0,0,dpr,0,0);
      ctx.clearRect(0,0,w,h);

      var centers = [
        {x:w*0.72,y:h*0.5,base:36,rings:17,seed:1.7,step:Math.min(w,h)*0.052},
        {x:w*0.22,y:h*0.88,base:16,rings:9,seed:4.2,step:Math.min(w,h)*0.05}
      ];

      centers.forEach(function(c){
        for(var i=1;i<=c.rings;i++){
          var r = c.base + i * c.step;
          var amp = r * 0.09;
          ctx.beginPath();
          for(var a=0;a<=Math.PI*2+0.001;a+=0.045){
            var n = Math.sin(a*2+c.seed+i*0.3)*0.5 + Math.sin(a*3.7+c.seed*1.3+i*0.6)*0.3 + Math.sin(a*5.1+c.seed*2.1)*0.2;
            var rr = r + n*amp;
            var x = c.x + Math.cos(a)*rr;
            var y = c.y + Math.sin(a)*rr*0.7;
            if(a===0){ ctx.moveTo(x,y); } else { ctx.lineTo(x,y); }
          }
          ctx.closePath();
          var op = 0.5 - (i/c.rings)*0.42;
          ctx.strokeStyle = 'rgba(228,217,188,' + Math.max(op,0.035).toFixed(3) + ')';
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      });
    }

    function refreshTopo(){
      document.querySelectorAll('.topo-canvas').forEach(function(c){
        try{ drawTopo(c); }catch(e){ console.error('drawTopo failed', e); }
      });
    }
    refreshTopo();
    var resizeTimer;
    window.addEventListener('resize', function(){
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(refreshTopo, 150);
    });
  }catch(err){ console.error('topo canvas init failed', err); }
