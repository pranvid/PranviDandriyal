(function () {
  var PAUSE_ICON = '<svg class="icon-pause" viewBox="0 0 16 16"><rect x="3" y="2" width="4" height="12" rx="1"></rect><rect x="9" y="2" width="4" height="12" rx="1"></rect></svg>';
  var PLAY_ICON = '<svg class="icon-play" viewBox="0 0 16 16"><path d="M4 2.5v11l10-5.5z"></path></svg>';

  document.querySelectorAll('.frame video').forEach(function (video) {
    var frame = video.closest('.frame');
    if (!frame) return;

    var btn = document.createElement('button');
    btn.className = 'vid-toggle';
    btn.type = 'button';
    btn.setAttribute('aria-label', 'Pause video');
    btn.innerHTML = PAUSE_ICON;
    frame.appendChild(btn);

    function sync() {
      var playing = !video.paused && !video.ended;
      btn.innerHTML = playing ? PAUSE_ICON : PLAY_ICON;
      btn.setAttribute('aria-label', playing ? 'Pause video' : 'Play video');
    }

    function toggle(e) {
      e.stopPropagation();
      if (video.paused) { video.play(); } else { video.pause(); }
    }

    btn.addEventListener('click', toggle);
    video.addEventListener('click', toggle);
    video.addEventListener('play', sync);
    video.addEventListener('pause', sync);
    sync();
  });
})();
