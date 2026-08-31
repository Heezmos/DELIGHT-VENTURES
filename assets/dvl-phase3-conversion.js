// DVL Phase 3 conversion layer
(() => {
  'use strict';

  const CONTACT_API_URL = 'https://ialobcshxbesmncngixx.supabase.co/functions/v1/contact-message';
  const byId = (id) => document.getElementById(id);
  const firstById = (...ids) => ids.map(byId).find(Boolean) || null;
  const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches === true;

  function ensureConversionFields() {
    const form = byId('contactForm');
    const service = byId('f-service');
    const serviceField = service?.closest('.fg');
    if (!form || !serviceField) return;

    let organization = firstById('f-organization', 'f-org');
    let phone = byId('f-phone');

    if (!organization || !phone) {
      let detailsRow = form.querySelector('.dvl-conversion-fields');
      if (!detailsRow) {
        detailsRow = document.createElement('div');
        detailsRow.className = 'form-row dvl-conversion-fields';
        serviceField.before(detailsRow);
      }

      if (!organization) {
        const orgWrap = document.createElement('div');
        orgWrap.className = 'fg';
        orgWrap.innerHTML = '<label for="f-organization">Organization / Business <span style="font-weight:400;opacity:.7">(optional)</span></label><input id="f-organization" type="text" maxlength="180" placeholder="Business or organization name" autocomplete="organization" />';
        detailsRow.appendChild(orgWrap);
        organization = byId('f-organization');
      }

      if (!phone) {
        const phoneWrap = document.createElement('div');
        phoneWrap.className = 'fg';
        phoneWrap.innerHTML = '<label for="f-phone">Phone / WhatsApp <span style="font-weight:400;opacity:.7">(optional)</span></label><input id="f-phone" type="tel" maxlength="80" placeholder="e.g. +232…" autocomplete="tel" />';
        detailsRow.appendChild(phoneWrap);
        phone = byId('f-phone');
      }
    }

    let preferred = firstById('f-contact-method', 'f-preferred-contact');
    if (!preferred) {
      const preference = document.createElement('div');
      preference.className = 'fg dvl-contact-preference';
      preference.innerHTML = '<label for="f-contact-method">Preferred Contact Method</label><select id="f-contact-method" aria-describedby="f-contact-help"><option value="email">Email</option><option value="phone">Phone</option><option value="whatsapp">WhatsApp</option></select><small id="f-contact-help" style="display:block;margin-top:8px;line-height:1.5;opacity:.72">Choose how you would prefer the DVL team to follow up.</small>';
      serviceField.after(preference);
      preferred = byId('f-contact-method');
    }

    const ok = byId('fs-ok');
    const err = byId('fs-err');
    if (ok) {
      ok.setAttribute('role', 'status');
      ok.setAttribute('aria-live', 'polite');
      ok.setAttribute('aria-atomic', 'true');
    }
    if (err) {
      err.setAttribute('role', 'alert');
      err.setAttribute('aria-live', 'assertive');
      err.setAttribute('aria-atomic', 'true');
    }
  }

  function fields() {
    return {
      name: byId('f-name'),
      email: byId('f-email'),
      organization: firstById('f-organization', 'f-org'),
      phone: byId('f-phone'),
      service: byId('f-service'),
      preferred: firstById('f-contact-method', 'f-preferred-contact'),
      message: byId('f-msg'),
      consent: byId('f-consent'),
      honeypot: byId('f-company-website')
    };
  }

  function emailLooksValid(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  function scrollStatus(element) {
    element?.scrollIntoView({ block: 'nearest', behavior: reducedMotion() ? 'auto' : 'smooth' });
  }

  function showError(message, field) {
    const err = byId('fs-err');
    const ok = byId('fs-ok');
    if (ok) ok.style.display = 'none';
    if (err) {
      err.textContent = message;
      err.style.display = 'block';
      scrollStatus(err);
    }
    if (field && typeof field.focus === 'function') field.focus({ preventScroll: true });
  }

  function syncPhoneRequirement() {
    const { preferred, phone } = fields();
    if (!phone) return;
    const requiresPhone = preferred?.value === 'phone' || preferred?.value === 'whatsapp';
    phone.required = Boolean(requiresPhone);
    phone.setAttribute('aria-required', requiresPhone ? 'true' : 'false');
  }

  function setSubmitting(submitting) {
    const button = byId('submitBtn');
    if (!button) return;
    if (!button.dataset.originalHtml) button.dataset.originalHtml = button.innerHTML;
    button.disabled = submitting;
    button.setAttribute('aria-busy', submitting ? 'true' : 'false');
    if (submitting) button.textContent = 'Sending…';
    else button.innerHTML = button.dataset.originalHtml;
  }

  function showSuccess(reference, service) {
    const success = byId('fs-ok');
    if (!success) return;
    success.replaceChildren();

    const heading = document.createElement('strong');
    heading.textContent = reference ? `Enquiry received — ${reference}` : 'Enquiry received';
    success.appendChild(heading);
    success.appendChild(document.createElement('br'));

    const detail = document.createElement('span');
    detail.textContent = `DVL has recorded your request for ${service}. We will contact you using your preferred contact method.${reference ? ' Please keep your reference for follow-up.' : ''}`;
    success.appendChild(detail);
    success.style.display = 'block';
    scrollStatus(success);
  }

  async function handleConversionForm(event) {
    event?.preventDefault?.();
    const form = event?.currentTarget instanceof HTMLFormElement ? event.currentTarget : byId('contactForm');
    if (!form) return;

    const f = fields();
    const name = f.name?.value.trim() || '';
    const email = f.email?.value.trim() || '';
    const organization = f.organization?.value.trim() || '';
    const phone = f.phone?.value.trim() || '';
    const service = f.service?.value || 'General Inquiry';
    const preferred = f.preferred?.value || 'email';
    const message = f.message?.value.trim() || '';
    const consent = f.consent?.checked === true;
    const honeypot = f.honeypot?.value || '';

    const err = byId('fs-err');
    const ok = byId('fs-ok');
    if (err) err.style.display = 'none';
    if (ok) ok.style.display = 'none';

    if (name.length < 2) return showError('Please enter your full name.', f.name);
    if (!emailLooksValid(email)) return showError('Please enter a valid email address.', f.email);
    if ((preferred === 'phone' || preferred === 'whatsapp') && !phone) {
      return showError(`Please enter a phone number so DVL can contact you by ${preferred === 'whatsapp' ? 'WhatsApp' : 'phone'}.`, f.phone);
    }
    if (message.length < 10) return showError('Please tell us a little more about what you need (at least 10 characters).', f.message);
    if (!consent) return showError('Please confirm that DVL may use your information to respond to this enquiry.', f.consent);

    setSubmitting(true);
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 15000);

    try {
      const response = await fetch(CONTACT_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          full_name: name,
          email,
          organization: organization || null,
          phone: phone || null,
          service_interest: service,
          preferred_contact_method: preferred,
          message,
          consent,
          company_website: honeypot
        })
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Unable to submit your enquiry.');

      showSuccess(data.reference_no || '', service);
      form.reset();
      const method = firstById('f-contact-method', 'f-preferred-contact');
      if (method) method.value = 'email';
      syncPhoneRequirement();
    } catch (error) {
      if (error?.name === 'AbortError') {
        showError('The request took too long. Please check your connection and try again.');
      } else {
        showError(error?.message || 'We could not submit your enquiry right now. Please try again.');
      }
    } finally {
      window.clearTimeout(timeout);
      setSubmitting(false);
    }
  }

  function install() {
    ensureConversionFields();
    const form = byId('contactForm');
    if (!form) return;

    const preferred = firstById('f-contact-method', 'f-preferred-contact');
    if (preferred && preferred.dataset.phoneSyncReady !== 'true') {
      preferred.dataset.phoneSyncReady = 'true';
      preferred.addEventListener('change', syncPhoneRequirement);
    }
    syncPhoneRequirement();

    if (form.dataset.conversionReady === 'true') return;
    form.dataset.conversionReady = 'true';
    form.removeAttribute('onsubmit');
    form.addEventListener('submit', handleConversionForm);
    window.handleForm = handleConversionForm;
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once: true });
  else install();
})();
