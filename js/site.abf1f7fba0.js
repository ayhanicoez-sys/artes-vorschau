(function(){
  var root = document.documentElement;
  if (!root.lang) root.lang = 'de-CH';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  /* the map library lies next to this script on our own server (js/site….js -> vendor/…); in the page sources the script is inline */
  var me = document.currentScript;
  var VENDOR = (me && me.src ? me.src.replace(/js\/[^\/]*$/, '') : '') + 'vendor/leaflet-1.9.4/';

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

  /* background videos: a light portrait cut on phones, only the poster for reduced motion or data saver, paused off-screen.
     They start once the page has loaded, so text, pictures and fonts get the connection first (the still picture shows until then). */
  var small = window.matchMedia('(max-width: 700px)').matches;
  var saveData = navigator.connection && navigator.connection.saveData;
  var afterLoad = function(fn){ if (document.readyState === 'complete') fn(); else window.addEventListener('load', fn); };
  ['heroVideo', 'bandVideo'].forEach(function(id){
    var v = document.getElementById(id); if (!v) return;
    if (reduce || saveData) { v.removeAttribute('autoplay'); return; }
    afterLoad(function(){ startVideo(v); });
  });
  function startVideo(v){
    v.src = (small && v.dataset.srcSmall) || v.dataset.src;
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function(en){
        en.forEach(function(e){
          if (e.isIntersecting) { if (v.preload === 'none') v.preload = 'auto'; var p = v.play(); if (p && p.catch) p.catch(function(){}); }
          else v.pause();
        });
      }).observe(v);
    }
  }

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

  /* ad click IDs from the landing address travel along internal links, so a later request can still be
     attributed to the ad without cookies (nothing is stored, no new identifier is created) */
  var CLICK_IDS = (window.location.search.match(/[?&](gclid|gbraid|wbraid|gad_source)=[^&#]*/g) || []).map(function(x){ return x.slice(1); });
  if (CLICK_IDS.length) document.addEventListener('click', function(e){
    var a = e.target.closest('a[href]'); if (!a || a.target === '_blank' || /^(mailto|tel|#)/.test(a.getAttribute('href'))) return;
    var u = new URL(a.getAttribute('href'), window.location.href); if (u.origin !== window.location.origin) return;
    CLICK_IDS.forEach(function(p){ var i = p.indexOf('='); if (!u.searchParams.has(p.slice(0, i))) u.searchParams.set(p.slice(0, i), decodeURIComponent(p.slice(i + 1))); });
    a.setAttribute('href', u.pathname + u.search + u.hash);
  }, true);

  /* request forms: validate, then save the request in the "Artes Formular" of the ARTES Wix site (owner gets the
     usual Wix notification, the ARTES admin app imports it from there). If saving fails, the visitor can still
     send the same request via WhatsApp or e-mail with one click. The client id is public; the visitor token it
     yields can only submit forms, it cannot read any stored request. Nothing is stored in the browser. */
  var PHONE = '41799506585', MAIL = 'info@artes-sportakademie.ch';
  var WIX = { api: 'https://www.wixapis.com', client: '751651cb-1664-4379-8e78-3e949924ef51', form: '5c314d31-6bbe-4d8c-8247-fba497f6225a' };
  var WIX_FIELD = { first: 'vorname_bd61', last: 'nachname_7b00', mail: 'e_mail_adresse_28c4', tel: 'telefonnummer_b672', offer: 'unsere_angebote', msg: 'lange_antwort_097c', src: 'herkunft' };
  var WIX_OFFER = {
    'Wing Tzun / Selbstverteidigung': 'Wing Tzun', 'Boxen / Fitnessboxen': 'Boxen', 'BJJ / Brazilian Jiu Jitsu (ab 14 J.)': 'BJJ',
    'Kombi: Boxen + Wing Tzun': 'Boxen + Wing Tzun', 'Kombi: Boxen + BJJ': 'Boxen + BJJ', 'Kombi: Wing Tzun + BJJ': 'Wing Tzun + BJJ',
    'Kombi: Boxen + Wing Tzun + BJJ': 'Wing Tzun + Boxen + BJJ', 'Kindertraining Minis (5–7 J.)': 'Kids (5 - 7) Jahre',
    'Kindertraining Junioren (8–14 J.)': 'Kids (8 - 14) Jahre', 'Intensivtraining': 'Intensivtraining', 'Personaltraining': 'Personaltraining',
    'Allgemeine Frage': 'Allgemeine Frage'
  };
  function esc(s){ return String(s).replace(/[&<>"]/g, function(c){ return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function e164(v){
    var d = String(v || '').replace(/[^\d+]/g, '');
    if (d.indexOf('00') === 0) d = '+' + d.slice(2);
    else if (d.charAt(0) === '0') d = '+41' + d.slice(1);
    else if (d && d.charAt(0) !== '+') d = '+' + d;
    return d;
  }
  function wixCall(path, body, token){
    var ctl = 'AbortController' in window ? new AbortController() : null, timer = ctl && setTimeout(function(){ ctl.abort(); }, 15000);
    var headers = { 'Content-Type': 'application/json' }; if (token) headers.Authorization = token;
    return fetch(WIX.api + path, { method: 'POST', headers: headers, body: JSON.stringify(body), credentials: 'omit', signal: ctl ? ctl.signal : undefined })
      .then(function(r){ return r.text().then(function(t){ if (timer) clearTimeout(timer); var j = {}; try { j = JSON.parse(t); } catch (x) {} return { ok: r.ok, json: j, text: t }; }); });
  }
  function sendToWix(values){
    return wixCall('/oauth2/token', { clientId: WIX.client, grantType: 'anonymous' }).then(function(t){
      if (!t.ok || !t.json.access_token) throw { text: t.text };
      return wixCall('/form-submission-service/v4/submissions', { submission: { formId: WIX.form, submissions: values } }, t.json.access_token);
    }).then(function(s){
      var st = s.json.submission && s.json.submission.status;
      if (!s.ok || ['CONFIRMED', 'PENDING', 'PAYMENT_WAITING'].indexOf(st) < 0) throw { text: s.text };
    });
  }
  function origin(){
    var h = window.location.hostname, page = window.location.pathname.split('/').pop().replace(/\.html$/, '').replace(/^index$/, '') || 'startseite';
    var where = /^(www\.)?artes-sportakademie\.ch$/.test(h) ? 'Homepage' : (/github\.io$/.test(h) ? 'Vorschau' : 'Test');
    var ad = CLICK_IDS.some(function(x){ return /^(gclid|gbraid|wbraid)=/.test(x); });
    return where + ' · ' + page + (ad ? ' · Google-Anzeige' : '');
  }
  document.querySelectorAll('form[data-lead]').forEach(function(form){
    var msg = form.querySelector('.form__msg'), done = form.querySelector('.lead-done'), sie = form.hasAttribute('data-sie');
    var btn = form.querySelector('button[type="submit"]'), btnHtml = btn ? btn.innerHTML : '', busy = false;
    form.addEventListener('submit', function(e){
      e.preventDefault();
      if (busy || (form.website && form.website.value)) return;
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
      var typ = sie ? 'offerte' : (question ? 'frage' : 'probetraining');
      var keep = CLICK_IDS.map(function(x){ return '&' + x; }).join('');
      msg.className = 'form__msg'; msg.textContent = ''; done.hidden = true;

      /* values for the Wix form: mapped fields by their data-wix role, everything else as lines in the message */
      var values = {}, notes = form.dataset.subject && sie ? [form.dataset.subject] : [];
      form.querySelectorAll('[data-label]').forEach(function(f){
        var v = (f.value || '').trim(), role = f.getAttribute('data-wix');
        if (!v || f.closest('[hidden]')) return;
        if (role === 'tel') values[WIX_FIELD.tel] = e164(v);
        else if (role === 'offer') { values[WIX_FIELD.offer] = WIX_OFFER[v] || 'Allgemeine Frage'; if (!WIX_OFFER[v]) notes.push(f.dataset.label + ': ' + v); }
        else if (role) values[WIX_FIELD[role]] = role === 'mail' ? v.toLowerCase() : v;
        else notes.push(f.dataset.label + ': ' + v);
      });
      if (sie) values[WIX_FIELD.offer] = 'Gruppenangebote';
      if (notes.length) values[WIX_FIELD.msg] = notes.join('\n');
      values[WIX_FIELD.src] = origin();

      /* the same request as a ready-made WhatsApp message or e-mail, offered only if saving fails */
      function direct(problem){
        var lines = [form.dataset.intro || (question ? 'Hallo ARTES Sportakademie, ich habe eine Frage.' : 'Hallo ARTES Sportakademie, ich möchte ein gratis Probetraining machen.'), ''];
        form.querySelectorAll('[data-label]').forEach(function(f){
          var v = (f.value || '').trim();
          if (v && !(f.closest('[hidden]'))) lines.push(f.dataset.label + ': ' + v);
        });
        var text = lines.join('\n');
        var wa = 'https://api.whatsapp.com/send?phone=' + PHONE + '&text=' + encodeURIComponent(text);
        var mail = 'mailto:' + MAIL + '?subject=' + encodeURIComponent(form.dataset.subject || (question ? 'Allgemeine Frage' : 'Anfrage Probetraining')) + '&body=' + encodeURIComponent(text);
        done.innerHTML = '<strong>' + (problem ? (sie ? 'Bitte prüfen Sie Ihre Angaben' : 'Bitte prüfe deine Angaben') : 'Das Senden hat nicht geklappt') + '</strong>'
          + '<p>' + (problem || (sie ? 'Senden Sie uns Ihre Anfrage einfach mit einem Klick per WhatsApp oder E-Mail. Ihre Angaben sind schon eingefügt.' : 'Sende uns deine Anfrage einfach mit einem Klick per WhatsApp oder E-Mail. Deine Angaben sind schon eingefügt.')) + '</p>'
          + '<div class="btns"><a class="btn btn--wa" target="_blank" rel="noopener" href="' + esc(wa) + '"><svg class="svgi" aria-hidden="true"><use href="#i-wa"/></svg>Per WhatsApp senden</a>'
          + '<a class="btn btn--line" href="' + esc(mail) + '">Per E-Mail senden</a></div>'
          + '<p>' + (sie ? 'Oder rufen Sie uns an' : 'Oder ruf uns an') + ': +41 79 950 65 85</p>';
        done.hidden = false;
        /* after WhatsApp or the mail program has opened, show the thank-you page (its address counts as conversion in Google Ads) */
        done.querySelectorAll('a.btn').forEach(function(a){
          a.addEventListener('click', function(){ setTimeout(function(){ window.location.href = 'danke.html?typ=' + typ + '&weg=direkt' + keep; }, a.target === '_blank' ? 400 : 900); });
        });
      }

      busy = true;
      if (btn) { btn.disabled = true; btn.setAttribute('aria-busy', 'true'); btn.textContent = sie ? 'Anfrage wird gesendet …' : 'Wird gesendet …'; }
      sendToWix(values).then(function(){
        /* saved: tell the measurement script (live site only), then show the thank-you page */
        try { document.dispatchEvent(new CustomEvent('artes:lead', { detail: { form: form, method: 'formular' } })); } catch (x) {}
        setTimeout(function(){ window.location.href = 'danke.html?typ=' + typ + keep; }, 250);
      }).catch(function(err){
        busy = false;
        if (btn) { btn.disabled = false; btn.removeAttribute('aria-busy'); btn.innerHTML = btnHtml; }
        var t = (err && err.text) || '', problem = '';
        var tel = form.querySelector('[data-wix="tel"]'), mailF = form.querySelector('[data-wix="mail"]');
        if (tel && t.indexOf(WIX_FIELD.tel) > -1) { tel.setAttribute('aria-invalid', 'true'); problem = sie ? 'Die Telefonnummer wurde nicht erkannt. Bitte prüfen Sie sie (z. B. 079 123 45 67) oder senden Sie uns die Anfrage direkt:' : 'Die Telefonnummer wurde nicht erkannt. Bitte prüfe sie (z. B. 079 123 45 67) oder sende uns die Anfrage direkt:'; }
        else if (mailF && t.indexOf(WIX_FIELD.mail) > -1) { mailF.setAttribute('aria-invalid', 'true'); problem = sie ? 'Die E-Mail-Adresse wurde nicht erkannt. Bitte prüfen Sie sie oder senden Sie uns die Anfrage direkt:' : 'Die E-Mail-Adresse wurde nicht erkannt. Bitte prüfe sie oder sende uns die Anfrage direkt:'; }
        direct(problem);
        var first = done.querySelector('a'); if (first) first.focus();
      });
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

  /* thank-you page: formal wording after a group or company request, other wording when sent via WhatsApp/e-mail */
  var thanks = document.querySelectorAll('.thanks__in');
  if (thanks.length) {
    var key = (/[?&]typ=offerte/.test(window.location.search) ? 'sie' : 'du') + (/[?&]weg=direkt/.test(window.location.search) ? '-direkt' : '');
    thanks.forEach(function(v){ v.hidden = v.getAttribute('data-variant') !== key; });
  }

  /* about page: the list of all 16 locations starts folded on phones */
  if (window.matchMedia && window.matchMedia('(max-width: 760px)').matches) document.querySelectorAll('details.locs').forEach(function(d){ d.open = false; });

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

  /* location map: it starts as the drawn map from our own server; map tiles from OpenStreetMap load only once someone moves or zooms it.
     Phones: one finger keeps scrolling the page, a tap unlocks the map (then one finger moves it), two fingers always move and zoom it.
     Computer: drag with the mouse; zoom with the buttons, a double click or Ctrl/⌘ + wheel (the plain wheel too, after a click into the map). */
  var maps = [].slice.call(document.querySelectorAll('figure[data-map]'));
  if (maps.length && 'IntersectionObserver' in window && window.Promise) {
    var leaflet = null;
    var loadLeaflet = function(){
      if (!leaflet) leaflet = new Promise(function(ok, fail){
        var css = document.createElement('link'), js = document.createElement('script'), n = 0;
        var one = function(){ if (++n === 2) { if (window.L) ok(window.L); else fail(); } };
        css.rel = 'stylesheet'; css.href = VENDOR + 'leaflet.css'; css.onload = one; css.onerror = fail;
        js.src = VENDOR + 'leaflet.js'; js.onload = one; js.onerror = fail;
        document.head.appendChild(css); document.head.appendChild(js);
      });
      return leaflet;
    };
    var mio = new IntersectionObserver(function(entries){
      entries.forEach(function(en){
        if (!en.isIntersecting) return;
        mio.unobserve(en.target);
        loadLeaflet().then(function(L){ liveMap(en.target, L); }).catch(function(){});   // on any failure the drawn map simply stays
      });
    }, { rootMargin: '400px 0px' });
    maps.forEach(function(f){ mio.observe(f); });
  }

  function liveMap(fig, L){
    var img = fig.querySelector(':scope > img'), ui = fig.querySelector('.mapui');
    var done = ui.querySelector('.mapui__done'), homeBtn = ui.querySelector('.mapui__home'), hint = ui.querySelector('.mapui__hint');
    var zin = ui.querySelector('[data-zoom="1"]'), zout = ui.querySelector('[data-zoom="-1"]');
    var px = fig.getAttribute('data-px').split(',').map(Number);   // drawn map: left, top, width, height in zoom-16 pixels
    var hintT = 0;
    var showHint = function(text){
      hint.textContent = text; hint.classList.add('is-on'); clearTimeout(hintT);
      hintT = setTimeout(function(){ hint.classList.remove('is-on'); }, 1500);
    };
    var home = L.latLng(+fig.getAttribute('data-lat'), +fig.getAttribute('data-lng'));
    var touchFirst = window.matchMedia('(hover: none) and (pointer: coarse)').matches;
    var el = document.createElement('div');
    el.className = 'mapbox__map';
    el.setAttribute('role', 'region');
    el.setAttribute('aria-label', 'Karte rund um die Feldstrasse 36 in Rebstein. Mit den Pfeiltasten verschieben, mit Plus und Minus zoomen.');
    fig.insertBefore(el, ui);
    var map = L.map(el, { zoomControl: false, attributionControl: false, boxZoom: false, zoomSnap: 0, minZoom: 9, maxZoom: 19,
      bounceAtZoomLimits: false, zoomAnimation: !reduce, fadeAnimation: !reduce, markerZoomAnimation: !reduce, inertia: !reduce });
    var bounds = L.latLngBounds(map.unproject([px[0], px[1] + px[3]], 16), map.unproject([px[0] + px[2], px[1]], 16));
    /* start view = exactly where the drawn map lies in the box (set in CSS), so nothing jumps when the movable map takes over */
    var homeView = function(){
      var f = fig.getBoundingClientRect(), r = img.getBoundingClientRect(), s = r.width / px[2];
      return { center: map.unproject([px[0] + (f.left + f.width / 2 - r.left) / s, px[1] + (f.top + f.height / 2 - r.top) / s], 16),
               zoom: 16 + Math.log(s) / Math.LN2 };
    };
    var start = homeView();
    map.setView(start.center, start.zoom, { animate: false });
    map.options.zoomSnap = 1;   // from now on zooming lands on whole levels, so the map tiles stay sharp
    map.createPane('artesBase').style.zIndex = 150;   // below the tiles: the drawn map shows wherever no tile has arrived (yet)
    var base = L.imageOverlay(img.currentSrc || img.src, bounds, { pane: 'artesBase' });
    base.once('load', function(){ fig.classList.add('is-live'); ui.hidden = false; });
    base.addTo(map);
    L.marker(home, { interactive: false, keyboard: false, icon: L.divIcon({ className: 'mapbox__mk', html: fig.querySelector('.mapbox__pin').innerHTML,
      iconSize: [180, 180], iconAnchor: [90, 90] }) }).addTo(map);

    var tiles = null;
    var wake = function(){
      if (!tiles) tiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);
    };
    map.on('dragstart zoomstart', wake);
    el.addEventListener('keydown', function(e){ if (/^(Arrow|\+|-|=|_)/.test(e.key)) wake(); });

    zin.addEventListener('click', function(){ map.setZoom(Math.round(map.getZoom()) + 1); });
    zout.addEventListener('click', function(){ map.setZoom(Math.round(map.getZoom()) - 1); });
    var moved = function(){
      var v = homeView();
      return map.latLngToContainerPoint(v.center).distanceTo(map.getSize().divideBy(2)) > 40 || Math.abs(map.getZoom() - v.zoom) > 0.25;
    };
    map.on('moveend zoomend', function(){
      zin.disabled = map.getZoom() >= map.getMaxZoom(); zout.disabled = map.getZoom() <= map.getMinZoom();
      var away = moved();
      if (!away && document.activeElement === homeBtn) el.focus({ preventScroll: true });
      homeBtn.hidden = !away;
    });
    homeBtn.addEventListener('click', function(){ var v = homeView(); map.options.zoomSnap = 0; map.setView(v.center, v.zoom); map.options.zoomSnap = 1; });

    if (touchFirst) {
      var unlocked = false;
      var unlock = function(on){
        if (unlocked === on) return;
        unlocked = on; fig.classList.toggle('is-unlocked', on); done.hidden = !on; hint.classList.remove('is-on');
        if (!on && document.activeElement === done) el.focus({ preventScroll: true });
      };
      fig.classList.add('is-touch');
      /* locked: a single finger is left to the page (it scrolls), only two fingers reach the map */
      fig.addEventListener('touchstart', function(e){ if (!unlocked && e.touches.length < 2 && el.contains(e.target)) e.stopPropagation(); }, { capture: true, passive: true });
      /* someone tries to move the locked map with one finger: the page scrolls on, and a short hint says how it works */
      fig.addEventListener('touchmove', function(e){
        if (!unlocked && e.touches.length === 1 && el.contains(e.target)) showHint('Tippe auf die Karte, um sie zu bewegen');
      }, { capture: true, passive: true });
      el.addEventListener('click', function(){ unlock(true); });
      done.addEventListener('click', function(){ unlock(false); });
      document.addEventListener('touchstart', function(e){ if (unlocked && !fig.contains(e.target)) unlock(false); }, { passive: true });
      fig.addEventListener('keydown', function(e){ if (e.key === 'Escape') unlock(false); });
      new IntersectionObserver(function(en){ if (!en[0].isIntersecting) unlock(false); }).observe(fig);
    } else {
      /* the plain mouse wheel keeps scrolling the page, unless someone clicked into the map first */
      var engaged = false;
      var wheelText = /Mac|iP(hone|ad|od)/.test(navigator.platform || '') ? 'Zum Zoomen ⌘ + Scrollen verwenden' : 'Zum Zoomen Strg + Mausrad verwenden';
      fig.addEventListener('wheel', function(e){
        if (!el.contains(e.target) || e.ctrlKey || e.metaKey || engaged) return;   // Leaflet zooms
        e.stopPropagation();
        showHint(wheelText);
      }, { capture: true, passive: true });
      el.addEventListener('mousedown', function(){ engaged = true; hint.classList.remove('is-on'); });
      fig.addEventListener('mouseleave', function(){ engaged = false; });
    }
  }
})();

