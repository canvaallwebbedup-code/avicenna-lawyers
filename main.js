/* ==========================================================================
   Avicenna Lawyers — shared front-end behaviour
   Vanilla JS, no dependencies. Handles:
     1. FAQ accordion (accessible, keyboard-friendly)
     2. Lead form: validation + success/error states (no real backend yet)
     3. Conversion tracking hooks (data-conversion attributes)
   ========================================================================== */
(function () {
  'use strict';

  /* ---------------------------------------------------------------------------
     CONFIG — wire these up before launch.
   --------------------------------------------------------------------------- */
  var CONFIG = {
    // Where lead form submissions POST — the firm's Google Apps Script web app.
    // main.js POSTs here with mode:'no-cors' (Apps Script sends no CORS headers);
    // the HTML form action carries the same URL as a no-JS native fallback.
    FORM_ENDPOINT: 'https://script.google.com/macros/s/AKfycbyVFiA5mJ1QDE_6fNYj-7Kh9RE9vsbh9xHDrc8HQ2Yl6l_O7NMRlylgyOsww6y41-XFHw/exec',

    // Shown to users if a submission fails. Keep in sync with the phone number in the HTML.
    FALLBACK_PHONE: '(02) 9091 3595',

    // --- Google Ads conversion tracking --------------------------------------
    // Two conversion actions — form vs call — so they can be valued and bid on
    // separately in Google Ads. Create both actions in your Ads account, then
    // drop the conversion labels in below. Until a real label is present (the
    // placeholder still contains XXXX / LABEL), no Ads conversion fires.
    ADS_CONVERSIONS: {
      form: 'AW-XXXXXXXXXX/FORM_LABEL',
      call: 'AW-XXXXXXXXXX/CALL_LABEL'
    }
  };

  /* ---------------------------------------------------------------------------
     1. Conversion tracking hook
     Every element with [data-conversion="event_name"] fires this on click /
     successful submit. Wire it to GA4 / Google Ads / GTM once IDs exist.
   --------------------------------------------------------------------------- */
  function track(eventName, detail) {
    detail = detail || {};
    // GA4 / gtag — granular per-action events (call_header, hero_call, faq_open…)
    // for analytics. The actual Ads conversion is handled by trackConversion().
    if (typeof window.gtag === 'function') {
      window.gtag('event', eventName, detail);
    }
    // GTM dataLayer, if present:
    if (Array.isArray(window.dataLayer)) {
      window.dataLayer.push(Object.assign({ event: eventName }, detail));
    }
    // Always leave a trace during development:
    if (window.console && console.debug) {
      console.debug('[track]', eventName, detail);
    }
  }

  /* ---------------------------------------------------------------------------
     Conversion: fire a lead to GA4 (generate_lead) + Google Ads.
     method is 'form' or 'call' — two separate Ads actions so they can be
     valued / bid on independently. Guarded so placeholder labels never fire.
   --------------------------------------------------------------------------- */
  function trackConversion(method) {
    if (typeof window.gtag !== 'function') return;
    window.gtag('event', 'generate_lead', { method: method, page: document.title });
    var sendTo = CONFIG.ADS_CONVERSIONS[method];
    if (sendTo && sendTo.indexOf('XXXX') === -1 && sendTo.indexOf('LABEL') === -1) {
      window.gtag('event', 'conversion', { send_to: sendTo });
    }
  }

  document.addEventListener('click', function (e) {
    var el = e.target.closest('[data-conversion]');
    if (el) {
      track(el.getAttribute('data-conversion'), {
        label: (el.textContent || '').trim().slice(0, 40),
        page: document.body.className
      });
    }
  });

  /* ---------------------------------------------------------------------------
     2. FAQ accordion
     Each [data-faq] contains .faq__item > button.faq__q + .faq__a
   --------------------------------------------------------------------------- */
  function initFaq(root) {
    var questions = root.querySelectorAll('.faq__q');
    Array.prototype.forEach.call(questions, function (btn) {
      var panel = btn.nextElementSibling;
      if (!panel) return;

      // Start collapsed (JS drives max-height so it animates).
      panel.style.maxHeight = '0px';
      btn.setAttribute('aria-expanded', 'false');

      btn.addEventListener('click', function () {
        var open = btn.getAttribute('aria-expanded') === 'true';
        if (open) {
          panel.style.maxHeight = '0px';
          btn.setAttribute('aria-expanded', 'false');
        } else {
          panel.style.maxHeight = panel.scrollHeight + 'px';
          btn.setAttribute('aria-expanded', 'true');
          track('faq_open', { q: (btn.textContent || '').trim().slice(0, 60) });
        }
      });
    });

    // Keep an open panel correctly sized if the viewport changes.
    window.addEventListener('resize', function () {
      Array.prototype.forEach.call(questions, function (btn) {
        if (btn.getAttribute('aria-expanded') === 'true') {
          var panel = btn.nextElementSibling;
          panel.style.maxHeight = 'none';
          var h = panel.scrollHeight;
          panel.style.maxHeight = h + 'px';
        }
      });
    });
  }

  /* ---------------------------------------------------------------------------
     3. Lead form: validate + submit with success/error states
   --------------------------------------------------------------------------- */
  function setFieldError(input, isError) {
    var field = input.closest('.field');
    if (field) field.classList.toggle('field--invalid', isError);
  }

  function validate(form) {
    var ok = true;
    var firstInvalid = null;
    var required = form.querySelectorAll('[required]');
    Array.prototype.forEach.call(required, function (input) {
      var valid = input.value.trim() !== '';
      if (input.type === 'tel') {
        // Light-touch: need at least a few digits, don't over-police formats.
        valid = valid && (input.value.replace(/\D/g, '').length >= 6);
      }
      setFieldError(input, !valid);
      if (!valid && !firstInvalid) firstInvalid = input;
      ok = ok && valid;
    });
    if (firstInvalid) firstInvalid.focus();
    return ok;
  }

  function showStatus(form, type, message) {
    var box = form.querySelector('.form-status');
    if (!box) return;
    box.className = 'form-status form-status--' + (type === 'ok' ? 'ok' : 'err');
    box.textContent = message;
  }

  function initForm(form) {
    // Clear a field's error as the user fixes it.
    form.addEventListener('input', function (e) {
      if (e.target.matches('[required]')) setFieldError(e.target, false);
    });

    form.addEventListener('submit', async function (e) {
      e.preventDefault();

      // Honeypot: the hidden _gotcha field. If a bot filled it, drop silently
      // (real users never see or fill it).
      var honey = form.querySelector('[name="_gotcha"]');
      if (honey && honey.value) { return; }

      if (!validate(form)) {
        showStatus(form, 'err', 'Please check the highlighted fields and try again.');
        return;
      }

      var btn = form.querySelector('button[type="submit"]');
      var originalLabel = btn ? btn.textContent : '';
      if (btn) { btn.disabled = true; btn.textContent = 'Sending…'; }

      track('form_submit_attempt', { form: form.getAttribute('data-form') || '' });

      // POST to the Google Apps Script web app. Apps Script does NOT return CORS
      // headers, so we POST with mode:'no-cors' — the response is opaque and cannot
      // be read, so a RESOLVED request is treated as success (the Sheet row + email
      // the script writes are the source of truth).
      var params = new URLSearchParams(new FormData(form));
      params.set('page', document.title);

      var ok = false;
      try {
        await fetch(CONFIG.FORM_ENDPOINT, { method: 'POST', mode: 'no-cors', body: params });
        ok = true;
      } catch (err) {
        ok = false;
      }

      if (btn) { btn.disabled = false; btn.textContent = originalLabel; }

      if (ok) {
        showStatus(form, 'ok', "Thanks — we've got your details and we'll call you back shortly.");
        track('form_submit_success', { form: form.getAttribute('data-form') || '' });
        trackConversion('form');
        form.reset();
      } else {
        showStatus(form, 'err', "Sorry, that didn't send. Please call us on " + CONFIG.FALLBACK_PHONE + " and we'll help straight away.");
        track('form_submit_error', { form: form.getAttribute('data-form') || '' });
      }
    });
  }

  /* ---------------------------------------------------------------------------
     Init on DOM ready
   --------------------------------------------------------------------------- */
  function init() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-faq]'), initFaq);
    Array.prototype.forEach.call(document.querySelectorAll('form.lead-form'), initForm);

    // Every tel: link counts as a call conversion (GA4 generate_lead + Ads).
    Array.prototype.forEach.call(document.querySelectorAll('a[href^="tel:"]'), function (link) {
      link.addEventListener('click', function () { trackConversion('call'); });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
