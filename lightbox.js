(function () {
  var overlay = document.createElement('div');
  overlay.className = 'lightbox';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', 'Enlarged image');
  overlay.innerHTML = '<button class="lightbox__close" type="button" aria-label="Close">×</button><img alt="">';
  document.body.appendChild(overlay);
  var img = overlay.querySelector('img');
  var closeBtn = overlay.querySelector('.lightbox__close');
  var opener = null;

  function open(el) {
    opener = el;
    img.src = el.currentSrc || el.src;
    img.alt = el.alt || '';
    overlay.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    closeBtn.focus();
  }
  function close() {
    if (!overlay.classList.contains('is-open')) return;
    overlay.classList.remove('is-open');
    document.body.style.overflow = '';
    if (opener) opener.focus();
  }

  overlay.addEventListener('click', function (e) {
    if (e.target === overlay || e.target === img) close();
  });
  closeBtn.addEventListener('click', close);
  document.addEventListener('keydown', function (e) {
    if (!overlay.classList.contains('is-open')) return;
    if (e.key === 'Escape') close();
    if (e.key === 'Tab') { e.preventDefault(); closeBtn.focus(); }  // single focusable control
  });

  document.querySelectorAll('.frame img').forEach(function (el) {
    el.tabIndex = 0;
    el.setAttribute('role', 'button');
    el.setAttribute('aria-label', 'Enlarge image: ' + (el.alt || ''));
    el.addEventListener('click', function () { open(el); });
    el.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(el); }
    });
  });
})();
