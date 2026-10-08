/* Site behaviour: theme toggle, scroll progress, scribble marks, headline reveal,
   cursor, work index preview. Everything is progressive: with JS off the page is
   fully readable and every reveal starts visible. The animation loop only runs
   while something is moving, so an idle page costs no CPU. */
(function () {
  var root = document.documentElement;
  root.classList.add('js');
  var rm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* ---- theme ---- */
  function themeNow() { return root.getAttribute('data-theme') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'); }
  var tog = document.getElementById('tog');
  if (tog) {
    var sync = function () { tog.setAttribute('aria-pressed', themeNow() === 'dark'); };
    tog.addEventListener('click', function () {
      var n = themeNow() === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', n);
      try { localStorage.setItem('theme', n); } catch (e) {}
      sync();
    });
    sync();
  }

  var head = document.querySelector('.site-head');

  /* tighten a loop that is directly followed by punctuation */
  document.querySelectorAll('.hl').forEach(function (h) {
    var n = h.nextSibling;
    if (n && n.nodeType === 3 && /^[.,;:!?)’”]/.test(n.textContent)) h.classList.add('hl-tight');
  });

  /* ---- scribble marks ---- */
  var NS = 'http://www.w3.org/2000/svg';
  function sv(cls, vb, d) {
    var e = document.createElementNS(NS, 'svg');
    e.setAttribute('class', 'sc ' + cls); e.setAttribute('viewBox', vb);
    e.setAttribute('preserveAspectRatio', 'none'); e.setAttribute('aria-hidden', 'true'); e.setAttribute('focusable', 'false');
    var p = document.createElementNS(NS, 'path'); p.setAttribute('d', d); p.setAttribute('pathLength', '1'); e.appendChild(p);
    return e;
  }
  var LOOPS = ['M14 24C8 11 38 3 66 5C93 7 99 20 90 31C79 41 38 41 18 33C4 27 8 12 34 7C56 3 82 4 95 12',
               'M10 20C12 8 44 3 70 6C95 9 99 22 88 32C74 41 30 40 14 30C3 23 12 10 40 6C62 3 84 6 92 14'];
  var WAVES = ['M1 6C8 1 12 10 20 5S34 1 42 6S58 10 68 4S88 2 99 6',
               'M1 5C10 9 14 1 24 5S40 9 50 4S72 1 82 6S94 8 99 4'];
  document.querySelectorAll('.hl').forEach(function (m, i) { m.appendChild(sv('o', '0 0 100 44', LOOPS[i % 2])); });
  document.querySelectorAll('.mm').forEach(function (m, i) { m.appendChild(sv('u', '0 0 100 10', WAVES[i % 2])); });
  document.querySelectorAll('.tt').forEach(function (t, i) { t.appendChild(sv('u2', '0 0 100 10', WAVES[(i + 1) % 2])); });

  function fit() {
    document.querySelectorAll('.sc').forEach(function (v) {
      var b = v.getBoundingClientRect(), vb = v.viewBox.baseVal;
      if (!b.width || !b.height) return;
      var k = (b.width / vb.width + b.height / vb.height) / 2;
      var fs = parseFloat(getComputedStyle(v.parentElement).fontSize) || 16, px;
      if (v.classList.contains('o')) px = Math.max(2.5, Math.min(5, fs * 0.035));
      else if (v.classList.contains('u2')) px = 1.5;
      else px = Math.max(2, Math.min(3.5, fs * 0.04));
      v.style.strokeWidth = (px / k).toFixed(3);
    });
  }
  fit(); addEventListener('resize', function () { fit(); kick(); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);

  /* ---- headline word reveal (opacity + rise, never clipped) ---- */
  var h1 = document.querySelector('main h1');
  if (h1 && !rm) {
    var idx = 0;
    var mkw = function () { var w = document.createElement('span'); w.className = 'hw'; var inn = document.createElement('span'); inn.style.setProperty('--i', idx++); w.appendChild(inn); return { w: w, inn: inn }; };
    var lastInn = null;
    [].slice.call(h1.childNodes).forEach(function (n) {
      if (n.nodeType === 3) {
        var txt = n.textContent, f = document.createDocumentFragment();
        var pm = lastInn && txt.match(/^[.,;:!?)’”]+/);   /* keep trailing punctuation attached to the word before it */
        if (pm) { lastInn.appendChild(document.createTextNode(pm[0])); txt = txt.slice(pm[0].length); }
        txt.split(/(\s+)/).forEach(function (t) {
          if (!t) return;
          if (/^\s+$/.test(t)) { f.appendChild(document.createTextNode(' ')); lastInn = null; }
          else { var o = mkw(); o.inn.textContent = t; f.appendChild(o.w); lastInn = o.inn; }
        });
        n.parentNode.replaceChild(f, n);
      } else if (n.nodeType === 1 && !n.classList.contains('per')) {
        var o = mkw(); n.parentNode.replaceChild(o.w, n); o.inn.appendChild(n); lastInn = o.inn;
      }
    });
    h1.classList.add('h1-anim');
    requestAnimationFrame(function () { requestAnimationFrame(function () { h1.classList.add('go'); }); });
    setTimeout(function () { h1.classList.remove('h1-anim', 'go'); fit(); }, 1400);
  }

  /* ---- marks draw as soon as they are on screen ---- */
  var live = [];                        /* scribbles that finished drawing and may react */
  function goLive(mark) {
    var svg = mark.querySelector('.sc');
    if (!svg || rm) return;
    svg.classList.add('live');
    live.push({ mark: mark, svg: svg, x: 0, y: 0, r: 0, s: 1, vis: true });
    kick();
  }
  function draw(t, delay) {
    setTimeout(function () { t.classList.add('mk-on'); setTimeout(function () { goLive(t); }, 950); }, delay);
  }
  var marks = document.querySelectorAll('.hl, .mm');
  if (rm || !('IntersectionObserver' in window)) marks.forEach(function (m) { m.classList.add('mk-on'); });
  else {
    var mio = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        var t = e.target; mio.unobserve(t);
        draw(t, h1 && h1.contains(t) ? 350 : 0);   /* the hero loop starts while the words are still rising */
      });
    }, { rootMargin: '0px 0px 8% 0px', threshold: 0.2 });
    marks.forEach(function (m) { mio.observe(m); });
  }
  /* only animate scribbles that are on screen */
  var vio = 'IntersectionObserver' in window ? new IntersectionObserver(function (es) {
    es.forEach(function (e) { live.forEach(function (l) { if (l.mark === e.target) l.vis = e.isIntersecting; }); });
    kick();
  }) : null;
  if (vio) marks.forEach(function (m) { vio.observe(m); });

  /* ---- word-by-word reading emphasis on the about lead ---- */
  var lead = document.querySelector('.about__lead'), rw = [];
  if (lead && !rm) {
    [].slice.call(lead.childNodes).forEach(function (n) {
      if (n.nodeType === 3) {
        var f = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach(function (t) {
          if (!t) return;
          if (/^\s+$/.test(t)) f.appendChild(document.createTextNode(' '));
          else { var s = document.createElement('span'); s.className = 'rw'; s.textContent = t; f.appendChild(s); rw.push(s); }
        });
        n.parentNode.replaceChild(f, n);
      } else if (n.nodeType === 1) { n.classList.add('rw'); rw.push(n); }
    });
    lead.classList.add('rd');
  }

  /* ---- work index: active row + sticky preview ---- */
  var rows = [].slice.call(document.querySelectorAll('.row')),
      imgs = document.querySelectorAll('.prev img'),
      pc = document.getElementById('pc'), pm = document.getElementById('pm');
  function act(i) {
    rows.forEach(function (x, j) { x.classList.toggle('on', i === j); });
    imgs.forEach(function (x, j) { x.classList.toggle('on', i === j); });
    if (pc) pc.textContent = rows[i].querySelector('.tt').textContent;
    if (pm) pm.textContent = '0' + (i + 1) + ' / 0' + rows.length;
  }
  rows.forEach(function (row, i) {
    row.addEventListener('mouseenter', function () { act(i); });
    row.addEventListener('focusin', function () { act(i); });
  });

  /* ---- progress bar, cursor, portrait tilt, scribble life ---- */
  var pg = document.createElement('div'); pg.className = 'pg'; pg.setAttribute('aria-hidden', 'true'); document.body.appendChild(pg);
  var cur = null;
  if (fine && !rm) {
    cur = document.createElement('div'); cur.className = 'cur'; cur.setAttribute('aria-hidden', 'true'); cur.innerHTML = '<span>View</span>';
    document.body.appendChild(cur); root.classList.add('cur-on');
  }
  var portrait = document.querySelector('.portrait'), pimg = portrait && portrait.querySelector('img');
  var mx = -100, my = -100, cx = -100, cy = -100, rot = 0, px = 0, py = 0, lastY = scrollY, vel = 0;
  var running = false, idleUntil = 0;

  function tgt(t) {
    if (!cur) return;
    t = t && t.closest ? t.closest('.row, a, button') : null;
    cur.classList.toggle('lg', !!(t && t.closest('.row')));
    cur.classList.toggle('sm', !!(t && !t.closest('.row')));
  }
  function kick() { idleUntil = performance.now() + 1200; if (!running) { running = true; requestAnimationFrame(frame); } }
  addEventListener('pointermove', function (e) { mx = e.clientX; my = e.clientY; if (cur) { cur.classList.add('show'); tgt(e.target); } kick(); }, { passive: true });
  addEventListener('scroll', function () { if (cur && mx > 0) tgt(document.elementFromPoint(mx, my)); kick(); }, { passive: true });
  document.addEventListener('mouseleave', function () { if (cur) cur.classList.remove('show'); });

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  function frame(now) {
    var moving = now < idleUntil;
    var max = root.scrollHeight - innerHeight;
    pg.style.setProperty('--p', max > 0 ? (scrollY / max).toFixed(4) : 0);
    if (head) head.classList.toggle('stuck', scrollY > 8);
    vel += ((scrollY - lastY) - vel) * 0.25; lastY = scrollY;          /* smoothed scroll velocity */

    if (rw.length) {
      var b = lead.getBoundingClientRect(), prog = (innerHeight * 0.82 - b.top) / (b.height + innerHeight * 0.22), k = clamp(prog, 0, 1) * rw.length;
      rw.forEach(function (w, j) { w.classList.toggle('on', j < k); });
    }
    if (cur) {
      cx += (mx - cx) * 0.2; cy += (my - cy) * 0.2; cur.style.transform = 'translate(' + cx.toFixed(1) + 'px,' + cy.toFixed(1) + 'px)';
      if (Math.abs(mx - cx) + Math.abs(my - cy) > 0.4) moving = true;
      if (portrait) {
        var pb = portrait.getBoundingClientRect(), dx = mx - (pb.left + pb.width / 2), dy = my - (pb.top + pb.height / 2);
        var tr = clamp(dx / 60, -10, 10), tx = clamp(dx / 90, -5, 5), ty = clamp(dy / 90, -5, 5);
        rot += (tr - rot) * 0.12; px += (tx - px) * 0.12; py += (ty - py) * 0.12;
        portrait.style.setProperty('--r', rot.toFixed(2) + 'deg');
        pimg.style.setProperty('--px', px.toFixed(2) + 'px'); pimg.style.setProperty('--py', py.toFixed(2) + 'px');
        if (Math.abs(tr - rot) > 0.02) moving = true;
      }
    }

    /* subtle life in the scribbles: they lean toward the cursor, tilt with scroll speed,
       and settle back when the page is still */
    var reads = [];
    for (var i = 0; i < live.length; i++) {
      var l = live[i]; if (!l.vis) continue;
      reads.push({ l: l, b: l.mark.getBoundingClientRect() });
    }
    reads.forEach(function (o) {
      var l = o.l, b = o.b, isLoop = l.svg.classList.contains('o');
      var tx = 0, ty = 0, near = 0;
      if (fine) {
        var ddx = mx - (b.left + b.width / 2), ddy = my - (b.top + b.height / 2), d = Math.sqrt(ddx * ddx + ddy * ddy);
        near = clamp(1 - d / 420, 0, 1);
        tx = clamp(ddx / 120, -1, 1) * near * (isLoop ? 4 : 3);
        ty = clamp(ddy / 120, -1, 1) * near * (isLoop ? 3 : 1.5);
      }
      var tr2 = clamp(vel * 0.06, -1.6, 1.6) * (isLoop ? 1 : 0.5);
      var ts = 1 + near * (isLoop ? 0.02 : 0.01);
      l.x += (tx - l.x) * 0.14; l.y += (ty - l.y) * 0.14; l.r += (tr2 - l.r) * 0.14; l.s += (ts - l.s) * 0.14;
      l.svg.style.transform = 'translate(' + l.x.toFixed(2) + 'px,' + l.y.toFixed(2) + 'px) rotate(' + l.r.toFixed(2) + 'deg) scale(' + l.s.toFixed(4) + ')';
      if (Math.abs(tx - l.x) + Math.abs(ty - l.y) + Math.abs(tr2 - l.r) + Math.abs(ts - l.s) * 50 > 0.02) moving = true;
    });

    if (moving) requestAnimationFrame(frame); else running = false;
  }
  kick();

  /* ---- generic reveal for index sections ---- */
  var rv = document.querySelectorAll('[data-reveal]');
  rv.forEach(function (el) { el.classList.add('reveal'); });
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }); }, { threshold: 0.12 });
    rv.forEach(function (el) { io.observe(el); });
  } else rv.forEach(function (el) { el.classList.add('in'); });
})();
