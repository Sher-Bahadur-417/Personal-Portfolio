    (function () {
      'use strict';
      const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const $ = (s, c) => (c || document).querySelector(s);
      const $$ = (s, c) => Array.from((c || document).querySelectorAll(s));

      /* ---------- Year ---------- */
      $('#year').textContent = new Date().getFullYear();

      /* ---------- Nav: scrolled state + progress + mobile ---------- */
      const nav = $('#nav'), progress = $('#navProgress'), burger = $('#burger');
      function onScrollNav() {
        nav.classList.toggle('scrolled', window.scrollY > 20);
        const h = document.documentElement;
        const pct = h.scrollTop / (h.scrollHeight - h.clientHeight) * 100;
        progress.style.width = pct + '%';
      }
      window.addEventListener('scroll', onScrollNav, { passive: true });
      onScrollNav();

      burger.addEventListener('click', () => {
        const open = document.body.classList.toggle('nav-open');
        burger.setAttribute('aria-expanded', open);
      });
      $$('.mobile-menu a').forEach(a => a.addEventListener('click', () => {
        document.body.classList.remove('nav-open');
        burger.setAttribute('aria-expanded', 'false');
      }));

      /* ---------- Active nav link ---------- */
      const sections = ['home', 'about', 'roadmap', 'skills', 'projects', 'education', 'learning', 'contact']
        .map(id => document.getElementById(id)).filter(Boolean);
      const navAnchors = $$('.nav-links a');
      const secObs = new IntersectionObserver(entries => {
        entries.forEach(e => {
          if (!e.isIntersecting) return;
          navAnchors.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + e.target.id));
        });
      }, { rootMargin: '-40% 0px -55% 0px' });
      sections.forEach(s => secObs.observe(s));

      /* ---------- Reveal on scroll ---------- */
      const revealObs = new IntersectionObserver(entries => {
        entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); revealObs.unobserve(e.target); } });
      }, { threshold: 0.14 });
      $$('[data-reveal]').forEach(el => revealObs.observe(el));
      $$('.mask').forEach(el => revealObs.observe(el));

      /* ---------- Counters ---------- */
      function runCounter(el) {
        const target = +el.dataset.count, pad = +el.dataset.pad || 0;
        const fmt = v => pad ? String(v).padStart(pad, '0') : String(v);
        if (REDUCED) { el.textContent = fmt(target); return; }
        const t0 = performance.now(), dur = 1400;
        (function tick(now) {
          const p = Math.min((now - t0) / dur, 1);
          const eased = 1 - Math.pow(1 - p, 3);
          el.textContent = fmt(Math.round(target * eased));
          if (p < 1) requestAnimationFrame(tick);
        })(t0);
      }
      const cntObs = new IntersectionObserver(entries => {
        entries.forEach(e => { if (e.isIntersecting) { runCounter(e.target); cntObs.unobserve(e.target); } });
      }, { threshold: 0.6 });
      $$('[data-count]').forEach(el => cntObs.observe(el));

      /* ---------- Scramble-decode hero name ---------- */
      const GLYPHS = '!<>-_\\/[]{}—=+*^?#01';
      function scramble(el) {
        const text = el.textContent;
        if (REDUCED) return;
        const dur = 1100, t0 = performance.now();
        (function frame(now) {
          const p = Math.min((now - t0) / dur, 1);
          const settled = Math.floor(text.length * p);
          let out = text.slice(0, settled);
          for (let i = settled; i < text.length; i++) {
            out += text[i] === ' ' ? ' ' : GLYPHS[Math.random() * GLYPHS.length | 0];
          }
          el.textContent = out;
          if (p < 1) requestAnimationFrame(frame); else el.textContent = text;
        })(t0);
      }
      scramble($('#scrambleName'));

      /* ---------- Terminal typer ---------- */
      const LINES = [
        { p: '$', t: 'whoami', cls: 'cmd' },
        { t: 'sher-bahadur · full-stack ai/ml engineer in the making', cls: 'out' },
        { p: '$', t: 'cat roadmap.txt', cls: 'cmd' },
        { t: 'frontend → backend → database → data → ml → ai → deployment', cls: 'path' },
        { p: '$', t: 'python train.py --career', cls: 'cmd' },
        { t: '▸ epoch 01 · fundamentals ......... ok', cls: 'ok' },
        { t: '▸ epoch 02 · building projects .... running', cls: 'run' },
        { t: '▸ status: model still training', cls: 'ok' }
      ];
      const term = $('#termBody');
      function renderStatic() {
        term.innerHTML = LINES.map(l =>
          l.p ? `<div class="${l.cls}"><span class="p">${l.p}</span>${l.t}</div>`
            : `<div class="${l.cls}">${l.t}</div>`).join('') + '<span class="caret"></span>';
      }
      if (REDUCED) { renderStatic(); }
      else {
        let li = 0;
        function typeLine() {
          if (li >= LINES.length) { term.insertAdjacentHTML('beforeend', '<span class="caret"></span>'); return; }
          const l = LINES[li], div = document.createElement('div');
          div.className = l.cls;
          if (l.p) div.innerHTML = '<span class="p">' + l.p + '</span>';
          term.appendChild(div);
          let ci = 0;
          const speed = l.cls === 'cmd' ? 42 : 13;
          (function typeChar() {
            if (ci < l.t.length) {
              div.innerHTML = (l.p ? '<span class="p">' + l.p + '</span>' : '') + l.t.slice(0, ++ci);
              setTimeout(typeChar, speed);
            } else { li++; setTimeout(typeLine, l.cls === 'cmd' ? 260 : 140); }
          })();
        }
        typeLine();
      }

      /* ---------- Neural network canvas ---------- */
      const canvas = $('#net');
      if (canvas && !REDUCED) {
        const ctx = canvas.getContext('2d');
        let W, H, nodes = [], running = true, raf;
        function resize() {
          const dpr = Math.min(window.devicePixelRatio || 1, 2);
          W = canvas.clientWidth; H = canvas.clientHeight;
          canvas.width = W * dpr; canvas.height = H * dpr;
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
          const n = Math.min(70, Math.floor(W * H / 16000));
          nodes = Array.from({ length: n }, () => ({
            x: Math.random() * W, y: Math.random() * H,
            vx: (Math.random() - .5) * .35, vy: (Math.random() - .5) * .35,
            r: Math.random() * 1.6 + .8
          }));
        }
        function draw() {
          if (!running) return;
          ctx.clearRect(0, 0, W, H);
          for (let i = 0; i < nodes.length; i++) {
            const a = nodes[i];
            a.x += a.vx; a.y += a.vy;
            if (a.x < 0 || a.x > W) a.vx *= -1;
            if (a.y < 0 || a.y > H) a.vy *= -1;
            for (let j = i + 1; j < nodes.length; j++) {
              const b = nodes[j], dx = a.x - b.x, dy = a.y - b.y, d = Math.hypot(dx, dy);
              if (d < 130) {
                ctx.strokeStyle = 'rgba(46,230,195,' + ((1 - d / 130) * .22) + ')';
                ctx.lineWidth = 1;
                ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
              }
            }
            ctx.fillStyle = 'rgba(46,230,195,.65)';
            ctx.beginPath(); ctx.arc(a.x, a.y, a.r, 0, 7); ctx.fill();
          }
          raf = requestAnimationFrame(draw);
        }
        resize(); draw();
        window.addEventListener('resize', resize);
        new IntersectionObserver(e => {
          const vis = e[0].isIntersecting;
          if (vis && !running) { running = true; draw(); }
          if (!vis && running) { running = false; cancelAnimationFrame(raf); }
        }).observe(canvas);
      }

      /* ---------- Ticker duplication ---------- */
      const track = $('#tickerTrack');
      track.innerHTML += track.innerHTML;

      /* ---------- Roadmap rail progress + node activation ---------- */
      const railWrap = $('#roadmapRail'), railFill = $('#railFill');
      const stages = $$('.stage');
      function railUpdate() {
        if (!railWrap) return;
        const r = railWrap.getBoundingClientRect();
        const mid = window.innerHeight * 0.55;
        const pct = Math.max(0, Math.min(1, (mid - r.top) / r.height));
        railFill.style.height = (pct * 100) + '%';
      }
      window.addEventListener('scroll', railUpdate, { passive: true });
      railUpdate();
      const stageObs = new IntersectionObserver(entries => {
        entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('live'); stageObs.unobserve(e.target); } });
      }, { threshold: 0.4 });
      stages.forEach(s => stageObs.observe(s));

      /* ---------- Goal chain activation ---------- */
      const chain = $('#chain');
      if (chain) new IntersectionObserver((e, o) => {
        if (e[0].isIntersecting) { chain.classList.add('in'); o.disconnect(); }
      }, { threshold: 0.2 }).observe(chain);

      /* ---------- Back to top ---------- */
      $('#toTop').addEventListener('click', () =>
        window.scrollTo({ top: 0, behavior: REDUCED ? 'auto' : 'smooth' }));

      /* ---------- Contact form validation ---------- */
      const form = $('#contactForm'), status = $('#formStatus'), sendBtn = $('#sendBtn');
      const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
      function setField(input, ok) { input.closest('.field').classList.toggle('error', !ok); return ok; }
      form.addEventListener('submit', e => {
        e.preventDefault();
        const name = $('#fName'), email = $('#fEmail'), subject = $('#fSubject'), message = $('#fMessage');
        const valid = [
          setField(name, name.value.trim().length >= 2),
          setField(email, emailRe.test(email.value.trim())),
          setField(subject, subject.value.trim().length >= 2),
          setField(message, message.value.trim().length >= 10)
        ].every(Boolean);
        if (!valid) { status.textContent = '// please fix the highlighted fields'; status.style.color = '#ff7a6b'; return; }
        /* Wire this to your real endpoint (Formspree, EmailJS, or a backend API) */
        sendBtn.disabled = true;
        status.style.color = 'var(--teal)';
        status.textContent = '// transmitting…';
        setTimeout(() => {
          status.textContent = '// message sent — thank you! I will reply soon.';
          sendBtn.disabled = false;
          form.reset();
        }, 900);
      });
      $$('#contactForm input, #contactForm textarea').forEach(i =>
        i.addEventListener('input', () => i.closest('.field').classList.remove('error')));
    })();
 