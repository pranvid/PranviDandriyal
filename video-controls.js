(function () {
  var PAUSE_ICON = '<svg class="icon-pause" viewBox="0 0 16 16"><rect x="3" y="2" width="4" height="12" rx="1"></rect><rect x="9" y="2" width="4" height="12" rx="1"></rect></svg>';
  var PLAY_ICON = '<svg class="icon-play" viewBox="0 0 16 16"><path d="M4 2.5v11l10-5.5z"></path></svg>';
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Load a video's source only when it nears the viewport, so the page
  // doesn't pull ~30MB of screen recordings up front.
  function load(video) {
    if (video.dataset.loaded) return;
    video.dataset.loaded = '1';
    video.querySelectorAll('source[data-src]').forEach(function (s) { s.src = s.dataset.src; });
    video.load();
  }

  var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      var video = e.target;
      if (e.isIntersecting) {
        load(video);
        if (!reduceMotion && !video.dataset.userPaused) video.play().catch(function () {});
      } else if (!video.paused) {
        video.pause();
      }
    });
  }, { rootMargin: '200px 0px', threshold: 0.01 }) : null;

  document.querySelectorAll('.frame video').forEach(function (video) {
    var frame = video.closest('.frame');
    if (!frame) return;

    var btn = document.createElement('button');
    btn.className = 'vid-toggle';
    btn.type = 'button';
    frame.appendChild(btn);

    function sync() {
      var playing = !video.paused && !video.ended;
      btn.innerHTML = playing ? PAUSE_ICON : PLAY_ICON;
      btn.setAttribute('aria-label', playing ? 'Pause video' : 'Play video');
    }

    function toggle(e) {
      e.stopPropagation();
      load(video);
      if (video.paused) {
        delete video.dataset.userPaused;
        video.play().catch(function () {});
      } else {
        video.dataset.userPaused = '1';
        video.pause();
      }
    }

    btn.addEventListener('click', toggle);
    video.addEventListener('click', toggle);
    video.addEventListener('play', sync);
    video.addEventListener('pause', sync);
    sync();

    if (io) io.observe(video);
    else { load(video); if (!reduceMotion) video.play().catch(function () {}); }
  });
})();
