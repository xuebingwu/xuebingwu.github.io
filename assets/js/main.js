/* Wu Lab @ Columbia — interactions */
(function () {
  'use strict';

  /* ---------- Theme toggle ---------- */
  var root = document.documentElement;
  var stored = null;
  try { stored = localStorage.getItem('wulab-theme'); } catch (e) {}
  if (stored) {
    root.setAttribute('data-theme', stored);
  } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    root.setAttribute('data-theme', 'dark');
  }
  document.getElementById('themeToggle').addEventListener('click', function () {
    var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    try { localStorage.setItem('wulab-theme', next); } catch (e) {}
  });

  /* ---------- Header shadow on scroll ---------- */
  var header = document.getElementById('siteHeader');
  function onScroll() {
    header.classList.toggle('scrolled', window.scrollY > 8);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Mobile menu ---------- */
  var hamburger = document.getElementById('hamburger');
  var nav = document.getElementById('siteNav');
  hamburger.addEventListener('click', function () {
    var open = nav.classList.toggle('open');
    hamburger.classList.toggle('open', open);
    hamburger.setAttribute('aria-expanded', String(open));
  });
  nav.addEventListener('click', function (e) {
    if (e.target.classList.contains('nav-link')) {
      nav.classList.remove('open');
      hamburger.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false');
    }
  });

  /* ---------- Active section highlighting ---------- */
  var links = Array.prototype.slice.call(document.querySelectorAll('.nav-link'));
  var sections = links
    .map(function (l) { return document.querySelector(l.getAttribute('href')); })
    .filter(Boolean);
  if ('IntersectionObserver' in window && sections.length) {
    var currentId = '';
    var sectionObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) currentId = '#' + en.target.id;
      });
      links.forEach(function (l) {
        l.classList.toggle('active', l.getAttribute('href') === currentId);
      });
    }, { rootMargin: '-40% 0px -55% 0px' });
    sections.forEach(function (s) { sectionObs.observe(s); });
  }

  /* ---------- Scroll reveal ---------- */
  var revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var revealObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add('in');
          revealObs.unobserve(en.target);
        }
      });
    }, { threshold: 0.08 });
    revealEls.forEach(function (el) { revealObs.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------- Stat counters ---------- */
  function animateCount(el) {
    var target = parseInt(el.getAttribute('data-count'), 10);
    var dur = 1400;
    var start = null;
    function step(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased);
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  var stats = document.getElementById('stats');
  if (stats && 'IntersectionObserver' in window) {
    var statObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          stats.querySelectorAll('.stat-num').forEach(animateCount);
          statObs.disconnect();
        }
      });
    }, { threshold: 0.4 });
    statObs.observe(stats);
  } else if (stats) {
    stats.querySelectorAll('.stat-num').forEach(function (el) {
      el.textContent = el.getAttribute('data-count');
    });
  }

  /* ---------- Publication search + year filter ---------- */
  var pubSearch = document.getElementById('pubSearch');
  var pubFilters = document.getElementById('pubFilters');
  var pubYears = Array.prototype.slice.call(document.querySelectorAll('.pub-year'));
  var pubEmpty = document.getElementById('pubEmpty');
  var activeYear = 'all';

  function applyPubFilter() {
    var q = pubSearch ? pubSearch.value.trim().toLowerCase() : '';
    var total = 0;
    pubYears.forEach(function (y) {
      var yearMatch = activeYear === 'all' || y.getAttribute('data-year') === activeYear;
      var visible = 0;
      var items = y.querySelectorAll('.pub-item');
      items.forEach(function (it) {
        var show = yearMatch && (!q || it.textContent.toLowerCase().indexOf(q) !== -1);
        it.style.display = show ? '' : 'none';
        if (show) visible++;
      });
      y.style.display = (yearMatch && (visible > 0 || !q)) ? '' : 'none';
      if (q && visible === 0) y.style.display = 'none';
      total += visible;
    });
    if (pubEmpty) pubEmpty.hidden = total > 0 || (!q && activeYear === 'all');
  }
  if (pubSearch) pubSearch.addEventListener('input', applyPubFilter);
  if (pubFilters) {
    pubFilters.addEventListener('click', function (e) {
      var chip = e.target.closest('.chip');
      if (!chip) return;
      pubFilters.querySelectorAll('.chip').forEach(function (c) { c.classList.remove('chip-active'); });
      chip.classList.add('chip-active');
      activeYear = chip.getAttribute('data-year');
      applyPubFilter();
    });
  }

  /* ---------- News: show recent, expand older ---------- */
  var timeline = document.getElementById('newsTimeline');
  var moreBtn = document.getElementById('newsMoreBtn');
  var RECENT = 12;
  if (timeline && moreBtn) {
    var items = Array.prototype.slice.call(timeline.children);
    items.forEach(function (li, i) {
      if (i >= RECENT) li.classList.add('hidden-item');
    });
    moreBtn.addEventListener('click', function () {
      var collapsed = items.some(function (li) { return li.classList.contains('hidden-item'); });
      if (collapsed) {
        items.forEach(function (li, i) {
          if (i >= RECENT) {
            li.classList.remove('hidden-item');
            li.classList.add('visible-item');
          }
        });
        moreBtn.textContent = 'Show recent news only';
      } else {
        items.forEach(function (li, i) {
          if (i >= RECENT) {
            li.classList.add('hidden-item');
            li.classList.remove('visible-item');
          }
        });
        moreBtn.textContent = 'Show all news';
        timeline.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  }

  /* ---------- Lightbox ---------- */
  var lightbox = document.getElementById('lightbox');
  var lightboxImg = document.getElementById('lightboxImg');
  var lightboxClose = document.getElementById('lightboxClose');
  document.querySelectorAll('[data-lightbox]').forEach(function (img) {
    img.addEventListener('click', function () {
      lightboxImg.src = img.src;
      lightboxImg.alt = img.alt;
      lightbox.classList.add('open');
      lightbox.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    });
  });
  function closeLightbox() {
    lightbox.classList.remove('open');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }
  lightboxClose.addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', function (e) {
    if (e.target === lightbox) closeLightbox();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && lightbox.classList.contains('open')) closeLightbox();
  });

  /* ---------- Footer year ---------- */
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());
})();
