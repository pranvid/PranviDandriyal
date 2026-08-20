(function () {
  var overlay = document.createElement('div');
  overlay.className = 'lightbox';
  overlay.innerHTML = '<button class="lightbox__close" aria-label="Close">×</button><img alt="">';
  document.body.appendChild(overlay);
  var img = overlay.querySelector('img');
  var closeBtn = overlay.querySelector('.lightbox__close');

  function open(src, alt) {
    img.src = src;
    img.alt = alt || '';
    overlay.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }
  function close() {
    overlay.classList.remove('is-open');
    document.body.style.overflow = '';
  }

  overlay.addEventListener('click', function (e) {
    if (e.target === overlay || e.target === img) close();
  });
  closeBtn.addEventListener('click', close);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') close();
  });

  document.querySelectorAll('.frame img').forEach(function (el) {
    el.addEventListener('click', function () {
      open(el.currentSrc || el.src, el.alt);
    });
  });
})();
