(function () {
  var hub = document.querySelector('.prd-hub');
  if (hub) {
    new IntersectionObserver(function (entries, obs) {
      if (entries[0].isIntersecting) {
        hub.classList.add('is-active');
        obs.disconnect();
      }
    }, { threshold: 0.12 }).observe(hub);
    hub.querySelectorAll('.prd-tag').forEach(function (tag) {
      tag.addEventListener('click', function () {
        var href = tag.getAttribute('href');
        if (!href || href.charAt(0) !== '#') return;
        var card = document.querySelector(href);
        if (!card) return;
        card.classList.remove('pulse');
        void card.offsetWidth;
        card.classList.add('pulse');
      });
    });
  }

  // Quote form — Formspree submission via fetch (inline success/error, no redirect)
  var form = document.getElementById('quote-form');
  if (!form) return;
  var status = document.getElementById('qf-status');
  var btn = form.querySelector('button[type="submit"]');

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    var endpoint = form.getAttribute('action');
    if (endpoint.indexOf('YOUR_FORM_ID') !== -1) {
      showStatus('err', 'Form not yet configured. Please contact ionut@cyclic.ro directly.');
      return;
    }

    var data = new FormData(form);
    btn.disabled = true;
    var originalLabel = btn.innerHTML;
    btn.innerHTML = 'Sending…';
    showStatus(null, '');

    fetch(endpoint, {
      method: 'POST',
      body: data,
      headers: { 'Accept': 'application/json' }
    }).then(function (res) {
      if (res.ok) {
        form.reset();
        showStatus('ok', 'Thanks — we got your request. Expect a reply from a production manager within 24 hours.');
      } else {
        return res.json().then(function (body) {
          var msg = (body && body.errors && body.errors[0] && body.errors[0].message) || 'Something went wrong. Please email ionut@cyclic.ro directly.';
          showStatus('err', msg);
        });
      }
    }).catch(function () {
      showStatus('err', 'Network error. Please email ionut@cyclic.ro or WhatsApp +40 721 381 922.');
    }).finally(function () {
      btn.disabled = false;
      btn.innerHTML = originalLabel;
    });
  });

  function showStatus(kind, message) {
    if (!status) return;
    status.className = 'qf-status' + (kind ? ' is-' + kind : '');
    status.textContent = message;
    if (kind === 'ok') {
      status.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }
})();
