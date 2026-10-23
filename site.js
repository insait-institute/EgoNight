/* EgoNight project page: night sky, day/night wipes, QA examples, small niceties. */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var RM = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var IO = 'IntersectionObserver' in window;

  /* ---------- hero: a slow star field ---------- */
  (function sky() {
    var cv = $('#sky'); if (!cv) return;
    var ctx = cv.getContext('2d'), stars = [], raf = 0, visible = true, seed = 7;
    var rnd = function () { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    for (var i = 0; i < 260; i++) stars.push({ x: rnd(), y: rnd(), r: .4 + rnd() * 1.3, ph: rnd() * 6.28, sp: .4 + rnd() * 1.5 });
    function size() { var d = Math.min(window.devicePixelRatio || 1, 2); cv.width = cv.clientWidth * d; cv.height = cv.clientHeight * d; ctx.setTransform(d, 0, 0, d, 0, 0); }
    function frame(now) {
      var W = cv.clientWidth, H = cv.clientHeight, t = now / 1000; ctx.clearRect(0, 0, W, H);
      for (var i = 0; i < stars.length; i++) {
        var s = stars[i]; ctx.globalAlpha = (.2 + .6 * (.5 + .5 * Math.sin(t * s.sp + s.ph))) * (1 - s.y * .7);
        ctx.fillStyle = '#dfe6ff'; ctx.beginPath(); ctx.arc(s.x * W, s.y * H, s.r, 0, 6.283); ctx.fill();
      }
      ctx.globalAlpha = 1;
      if (!RM && visible) raf = requestAnimationFrame(frame);
    }
    size(); window.addEventListener('resize', function () { size(); if (RM) frame(0); });
    if (IO) new IntersectionObserver(function (e) { visible = e[0].isIntersecting; cancelAnimationFrame(raf); if (visible) raf = requestAnimationFrame(frame); }).observe(cv);
    raf = requestAnimationFrame(frame);
  })();

  /* ---------- nav: highlight the section in view ---------- */
  (function nav() {
    var links = $$('.nav a[href^="#"]').filter(function (a) { return !a.classList.contains('brand'); });
    if (!IO) return;
    var map = {}; links.forEach(function (a) { map[a.getAttribute('href').slice(1)] = a; });
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { links.forEach(function (a) { a.classList.remove('on'); }); var a = map[e.target.id]; if (a) { a.classList.add('on'); } } });
    }, { rootMargin: '-45% 0px -50% 0px' });
    Object.keys(map).forEach(function (id) { var el = document.getElementById(id); if (el) io.observe(el); });
  })();

  /* ---------- reveal and count-up ---------- */
  (function reveal() {
    var els = $$('.reveal');
    if (!IO || RM) { els.forEach(function (e) { e.classList.add('in'); }); return; }
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return; e.target.classList.add('in'); io.unobserve(e.target);
        $$('[data-count]', e.target).forEach(function (n) {
          var to = +n.dataset.count, t0 = performance.now();
          (function f(now) { var t = Math.min(1, (now - t0) / 1100), k = t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
            n.textContent = Math.round(to * k).toLocaleString('en-US'); if (t < 1) requestAnimationFrame(f); })(t0);
        });
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: .08 });
    els.forEach(function (e) { io.observe(e); });
  })();

  /* ---------- day / night wipe ----------
     Each clip is one video with the day frames stacked above the night frames
     (tools/build_media.sh), drawn onto a canvas so the two halves stay frame-locked. */
  function Wipe(wrap) {
    var crop = wrap.dataset.crop.split(',').map(Number);
    wrap.innerHTML = '<canvas></canvas><video class="src" muted loop playsinline preload="none"></video><span class="tag d">DAY</span><span class="tag n">NIGHT</span><div class="bar"></div>' +
      '<div class="knob" role="slider" tabindex="0" aria-label="Day–night divider" aria-valuemin="0" aria-valuemax="100" aria-valuenow="50"></div>';
    var cv = $('canvas', wrap), ctx = cv.getContext('2d'), v = $('video', wrap), knob = $('.knob', wrap), poster = new Image();
    v.muted = true;
    var split = .5, auto = true, raf = 0, on = false, drag = false, t0 = performance.now(), ph = Math.random() * 6;
    function draw(now) {
      if (auto && !RM) split = .5 + .34 * Math.sin((now - t0) / 1000 * .7 + ph);
      var src = v.readyState >= 2 && v.videoWidth ? v : (poster.complete && poster.naturalWidth ? poster : null);
      if (src) {
        var sw = src.videoWidth || src.naturalWidth, sh = (src.videoHeight || src.naturalHeight) / 2;
        var x0 = crop[0] * sw, cw = (crop[1] - crop[0]) * sw, W = Math.round(cw), H = Math.round(sh);
        if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; }
        ctx.drawImage(src, x0, sh, cw, sh, 0, 0, W, H);
        if (split > 0) ctx.drawImage(src, x0, 0, cw * split, sh, 0, 0, W * split, H);
      }
      wrap.style.setProperty('--x', (split * 100).toFixed(2) + '%'); knob.setAttribute('aria-valuenow', Math.round(split * 100));
      if (on) raf = requestAnimationFrame(draw);
    }
    function at(e) { var r = wrap.getBoundingClientRect(); split = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)); auto = false; if (!on) draw(performance.now()); }
    wrap.addEventListener('pointerdown', function (e) { drag = true; try { wrap.setPointerCapture(e.pointerId); } catch (_) {} at(e); });
    wrap.addEventListener('pointermove', function (e) { if (drag || e.pointerType === 'mouse') at(e); });
    wrap.addEventListener('pointerup', function () { drag = false; });
    wrap.addEventListener('pointercancel', function () { drag = false; });
    knob.addEventListener('keydown', function (e) {
      var d = { ArrowLeft: -.05, ArrowDown: -.05, ArrowRight: .05, ArrowUp: .05 }[e.key];
      if (d) split = Math.max(0, Math.min(1, split + d)); else if (e.key === 'Home') split = 0; else if (e.key === 'End') split = 1; else return;
      auto = false; e.preventDefault(); if (!on) draw(performance.now());
    });
    return {
      load: function (name) { poster.src = 'fig/video/' + name + '_dn.jpg'; v.src = 'fig/video/' + name + '_dn.mp4'; auto = true; t0 = performance.now(); if (on) { var p = v.play(); if (p && p.catch) p.catch(function () {}); } else draw(t0); },
      start: function () { if (on) return; on = true; var p = v.play(); if (p && p.catch) p.catch(function () {}); raf = requestAnimationFrame(draw); },
      stop: function () { on = false; cancelAnimationFrame(raf); v.pause(); }
    };
  }

  function clipDots(card, names, pick) {
    var dots = $('.dots', card);
    names.forEach(function (n, i) {
      var b = document.createElement('button'); b.type = 'button'; b.setAttribute('aria-label', 'Clip ' + (i + 1)); b.setAttribute('aria-pressed', i ? 'false' : 'true');
      b.addEventListener('click', function () { $$('button', dots).forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); }); pick(n); });
      dots.appendChild(b);
    });
    var s = document.createElement('span'); s.textContent = names.length + ' clips'; dots.appendChild(s);
  }

  $$('.subset').forEach(function (card) {
    var player, el = $('.wipe', card);
    if (el) {
      var names = el.dataset.clips.split(','); player = Wipe(el); player.load(names[0]);
      clipDots(card, names, function (n) { player.load(n); });
    } else {
      var box = $('.night-only', card), v = $('video', box), on = false;
      var load = function (n) { v.poster = 'fig/video/' + n + '_night.jpg'; v.src = 'fig/video/' + n + '_night.mp4'; if (on) { var p = v.play(); if (p && p.catch) p.catch(function () {}); } };
      var names2 = box.dataset.clips.split(','); load(names2[0]); clipDots(card, names2, load);
      player = { start: function () { on = true; if (!RM) { var p = v.play(); if (p && p.catch) p.catch(function () {}); } }, stop: function () { on = false; v.pause(); } };
    }
    if (IO) new IntersectionObserver(function (e) { e[0].isIntersecting ? player.start() : player.stop(); }, { threshold: .25 }).observe(card);
    else player.start();
  });

  /* ---------- QA types ---------- */
  (function qa() {
    var TYPES = [
      ['Object Recognition', 'object_recognition', 'paired'], ['Text Recognition', 'text_recognition', 'paired'],
      ['Spatial Reasoning', 'spatial_reasoning', 'paired'], ['Scene Sequence', 'scene_sequence', 'paired'],
      ['Navigation', 'navigation', 'paired'], ['Counting of Static', 'counting_of_static', 'paired'],
      ['Action Recognition', 'action_recognition', 'paired'], ['Non-Common-Sense Reasoning', 'non_common', 'paired'],
      ['Lighting Recognition', 'light_recognition', 'unpaired'], ['Lighting Dynamic', 'light_dynamic', 'unpaired'],
      ['Dynamic Detection', 'dynamic_detection', 'unpaired'], ['Counting of Dynamic', 'counting_of_dynamic', 'unpaired']];
    var img = $('#qa-img'), cur = $('#qa-current'), btns = [];
    if (!img) return;
    TYPES.forEach(function (t) { var pre = new Image(); pre.src = 'fig/qa_example_' + t[1] + '.png'; });
    function pick(i) {
      img.src = 'fig/qa_example_' + TYPES[i][1] + '.png'; img.alt = TYPES[i][0] + ' QA example'; cur.textContent = TYPES[i][0];
      btns.forEach(function (b, k) { b.setAttribute('aria-pressed', k === i ? 'true' : 'false'); });
    }
    TYPES.forEach(function (t, i) {
      var b = document.createElement('button'); b.type = 'button'; b.textContent = t[0];
      b.addEventListener('click', function () { pick(i); });
      b.addEventListener('mouseenter', function () { pick(i); });
      b.addEventListener('focus', function () { pick(i); });
      $('.qa-group[data-group="' + t[2] + '"]').appendChild(b); btns.push(b);
    });
    pick(0);
  })();

  /* ---------- leaderboard: a bar under each overall score ---------- */
  (function board() {
    var cells = $$('.results-table tbody td:last-child'); if (!cells.length) return;
    var vals = cells.map(function (td) { return parseFloat(td.textContent); }), max = Math.max.apply(null, vals);
    cells.forEach(function (td, i) { var b = document.createElement('span'); b.className = 'avgbar'; b.innerHTML = '<i></i>'; td.appendChild(b); b.firstChild.dataset.w = (vals[i] / max * 100).toFixed(1) + '%'; });
    var grow = function () { $$('.avgbar i').forEach(function (i) { i.style.setProperty('--w', i.dataset.w); }); };
    if (IO && !RM) new IntersectionObserver(function (e, o) { if (e[0].isIntersecting) { grow(); o.disconnect(); } }, { threshold: .2 }).observe($('.results-table')); else grow();
  })();

  /* ---------- BibTeX copy ---------- */
  (function bib() {
    var b = $('#bib-copy'), code = $('#bib'); if (!b) return;
    b.addEventListener('click', function () {
      var done = function () { b.textContent = 'Copied'; setTimeout(function () { b.textContent = 'Copy'; }, 1600); };
      var fallback = function () { var r = document.createRange(); r.selectNodeContents(code); var s = getSelection(); s.removeAllRanges(); s.addRange(r); b.textContent = 'Selected'; };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(code.textContent).then(done, fallback); else fallback();
    });
  })();
})();
