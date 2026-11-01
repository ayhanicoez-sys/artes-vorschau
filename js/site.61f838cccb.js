(function(){
  var root = document.documentElement;
  if (!root.lang) root.lang = 'de-CH';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* every new page opens at the top; back/forward and links with an anchor keep their position */
  (function(){
    var nav = (window.performance && performance.getEntriesByType && performance.getEntriesByType('navigation')[0]) || {};
    if (nav.type === 'back_forward' || window.location.hash) return;
    var moved = false;
    ['wheel', 'touchstart', 'keydown', 'mousedown'].forEach(function(ev){
      window.addEventListener(ev, function(){ moved = true; }, { passive: true, once: true });
    });
    function toTop(){ if (!moved && !window.location.hash && window.scrollY !== 0) window.scrollTo({ top: 0, left: 0, behavior: 'instant' }); }
    toTop();
    window.addEventListener('load', toTop);
    [80, 300, 900].forEach(function(ms){ setTimeout(toTop, ms); });
  })();

  /* header: solid background after scrolling */
  var hdr = document.getElementById('hdr');
  function onScroll(){ hdr.classList.toggle('is-solid', window.scrollY > 40); }
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();

  /* mobile menu */
  var burger = document.getElementById('burger'), nav = document.getElementById('nav');
  function setMenu(open){
    document.body.classList.toggle('nav-open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Menü schliessen' : 'Menü öffnen');
    burger.querySelector('.ms').textContent = open ? 'close' : 'menu';
  }
  burger.addEventListener('click', function(){ setMenu(!document.body.classList.contains('nav-open')); });
  nav.addEventListener('click', function(e){ if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', function(e){ if (e.key === 'Escape') setMenu(false); });

  /* reveal on scroll: only elements below the first screen get the start offset */
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(en){ if (en.isIntersecting) { en.target.classList.remove('pre'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -8% 0px' });
    document.querySelectorAll('.rv').forEach(function(el){
      if (el.getBoundingClientRect().top > window.innerHeight) { el.classList.add('pre'); io.observe(el); }
    });
    /* after a jump (anchor link, fast scroll) nothing above the screen edge may stay shifted */
    var sweeping = false;
    window.addEventListener('scroll', function(){
      if (sweeping) return; sweeping = true;
      requestAnimationFrame(function(){
        sweeping = false;
        document.querySelectorAll('.rv.pre').forEach(function(el){
          if (el.getBoundingClientRect().top < window.innerHeight) { el.classList.remove('pre'); io.unobserve(el); }
        });
      });
    }, { passive: true });
  }

  /* background videos: a light portrait cut on phones, only the poster for reduced motion or data saver, paused off-screen */
  var small = window.matchMedia('(max-width: 700px)').matches;
  var saveData = navigator.connection && navigator.connection.saveData;
  ['heroVideo', 'bandVideo'].forEach(function(id){
    var v = document.getElementById(id); if (!v) return;
    if (reduce || saveData) { v.removeAttribute('autoplay'); return; }
    v.src = (small && v.dataset.srcSmall) || v.dataset.src;
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function(en){
        en.forEach(function(e){
          if (e.isIntersecting) { if (v.preload === 'none') v.preload = 'auto'; var p = v.play(); if (p && p.catch) p.catch(function(){}); }
          else v.pause();
        });
      }).observe(v);
    }
  });

  /* FAQ: one open answer per list, and the clicked question stays in place */
  var faqs = [].slice.call(document.querySelectorAll('.acc details, .faq2 details'));
  faqs.forEach(function(d){ d.addEventListener('toggle', function(){ if (d.open) faqs.forEach(function(o){ if (o !== d && o.parentNode === d.parentNode) o.open = false; }); }); });
  document.querySelectorAll('.acc summary, .faq2 summary').forEach(function(s){
    s.addEventListener('click', function(){
      var t0 = s.getBoundingClientRect().top;
      requestAnimationFrame(function(){ requestAnimationFrame(function(){
        var d = s.getBoundingClientRect().top - t0;
        if (Math.abs(d) > 1) window.scrollBy({ top: d, behavior: 'instant' });
      }); });
    });
  });

  /* buttons that preselect the course in the trial form on the same page */
  var trialKurs = document.querySelector('form[data-trial] select[name="kurs"]');
  document.querySelectorAll('[data-angebot]').forEach(function(a){
    a.addEventListener('click', function(){ if (trialKurs) trialKurs.value = a.dataset.angebot; });
  });

  /* contact page: kontakt.html#angebot-<kurs> jumps to the form and preselects the course (kids and combos: the visitor chooses) */
  var COURSE = { 'wing-tzun': 'Wing Tzun / Selbstverteidigung', 'boxen': 'Boxen / Fitnessboxen', 'bjj': 'BJJ / Brazilian Jiu Jitsu (ab 14 J.)', 'kids': '', 'kombi': '', 'intensivtraining': 'Intensivtraining', 'personaltraining': 'Personaltraining', 'gruppenangebote': '' };
  var m = /^#angebot-(.+)$/.exec(window.location.hash), tf = document.getElementById('trialForm');
  if (m && COURSE.hasOwnProperty(m[1]) && tf) {
    if (COURSE[m[1]]) tf.querySelector('select[name="kurs"]').value = COURSE[m[1]];
    /* the form must not be mid-animation, otherwise it ends up under the header */
    for (var a = tf; a; a = a.parentElement) if (a.classList && a.classList.contains('pre')) { a.style.transition = 'none'; a.classList.remove('pre'); void a.offsetHeight; a.style.transition = ''; }
    requestAnimationFrame(function(){ tf.scrollIntoView({ block: 'start', behavior: 'instant' }); });
  }

  /* trial forms: validate, then send the request via WhatsApp or e-mail (no data is stored on this website) */
  var PHONE = '41799506585', MAIL = 'info@artes-sportakademie.ch';
  function esc(s){ return String(s).replace(/[&<>"]/g, function(c){ return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  document.querySelectorAll('form[data-lead]').forEach(function(form){
    var msg = form.querySelector('.form__msg'), done = form.querySelector('.lead-done'), sie = form.hasAttribute('data-sie');
    form.addEventListener('submit', function(e){
      e.preventDefault();
      if (form.website && form.website.value) return;
      var bad = [].slice.call(form.querySelectorAll('[required]')).filter(function(f){
        if (f.type === 'checkbox') return !f.checked;
        var v = f.value.trim();
        if (!v) return true;
        if (f.type === 'email') return !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
        if (f.type === 'tel') return v.replace(/\D/g, '').length < 7;
        return false;
      });
      form.querySelectorAll('[aria-invalid]').forEach(function(f){ f.removeAttribute('aria-invalid'); });
      if (bad.length) {
        bad.forEach(function(f){ f.setAttribute('aria-invalid', 'true'); });
        msg.className = 'form__msg is-err';
        msg.textContent = sie ? 'Bitte füllen Sie die markierten Felder aus und bestätigen Sie den Datenschutz.' : 'Bitte fülle die markierten Felder aus und bestätige den Datenschutz.';
        bad[0].focus();
        return;
      }
      var kursSel = form.querySelector('select[name="kurs"]'), question = kursSel && kursSel.value === 'Allgemeine Frage';
      var lines = [form.dataset.intro || (question ? 'Hallo ARTES Sportakademie, ich habe eine Frage.' : 'Hallo ARTES Sportakademie, ich möchte ein gratis Probetraining machen.'), ''];
      form.querySelectorAll('[data-label]').forEach(function(f){
        if ((f.type === 'radio' || f.type === 'checkbox') && !f.checked) return;
        var v = (f.value || '').trim();
        if (v && !(f.closest('[hidden]'))) lines.push(f.dataset.label + ': ' + v);
      });
      var text = lines.join('\n');
      var wa = 'https://api.whatsapp.com/send?phone=' + PHONE + '&text=' + encodeURIComponent(text);
      var mail = 'mailto:' + MAIL + '?subject=' + encodeURIComponent(form.dataset.subject || (question ? 'Allgemeine Frage' : 'Anfrage Probetraining')) + '&body=' + encodeURIComponent(text);
      msg.className = 'form__msg'; msg.textContent = '';
      done.innerHTML = '<strong>Fast geschafft!</strong><p>' + (sie ? 'Senden Sie uns Ihre Anfrage jetzt mit einem Klick. Ihre Angaben sind schon eingefügt.' : 'Sende uns deine Anfrage jetzt mit einem Klick. Deine Angaben sind schon eingefügt.') + '</p>'
        + '<div class="btns"><a class="btn btn--wa" target="_blank" rel="noopener" href="' + esc(wa) + '"><svg class="svgi" aria-hidden="true"><use href="#i-wa"/></svg>Per WhatsApp senden</a>'
        + '<a class="btn btn--line" href="' + esc(mail) + '">Per E-Mail senden</a></div>'
        + '<p>' + (sie ? 'Oder rufen Sie uns an' : 'Oder ruf uns an') + ': +41 79 950 65 85</p>';
      done.hidden = false;
      var first = done.querySelector('a'); if (first) first.focus();
    });
  });

  /* the floating WhatsApp button steps aside while a form is on screen, so it never covers a field */
  var leadForms = document.querySelectorAll('form[data-lead]');
  if ('IntersectionObserver' in window && leadForms.length && document.querySelector('.wa-float')) {
    var seen = new Set();
    var fio = new IntersectionObserver(function(entries){
      entries.forEach(function(en){ if (en.isIntersecting) seen.add(en.target); else seen.delete(en.target); });
      document.body.classList.toggle('form-in-view', seen.size > 0);
    }, { rootMargin: '0px 0px -60px 0px' });
    leadForms.forEach(function(f){ fio.observe(f); });
  }

  /* active link while scrolling (home page anchors only) */
  var links = [].slice.call(document.querySelectorAll('.nav__list > li > .nav__link[href^="#"]'));
  if ('IntersectionObserver' in window && links.length && !document.querySelector('.banner')) {
    var spy = new IntersectionObserver(function(entries){
      entries.forEach(function(en){
        if (!en.isIntersecting) return;
        links.forEach(function(l){ l.classList.toggle('is-active', l.getAttribute('href') === '#' + en.target.id); });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    links.forEach(function(l){ var s = document.querySelector(l.getAttribute('href')); if (s) spy.observe(s); });
  }
})();

