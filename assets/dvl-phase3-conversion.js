// DVL Phase 3 conversion layer
(() => {
  const form = document.getElementById('contactForm');
  if (!form) return;

  const serviceField = document.getElementById('f-service')?.closest('.fg');
  if (serviceField && !document.getElementById('f-organization')) {
    const detailsRow = document.createElement('div');
    detailsRow.className = 'form-row';
    detailsRow.innerHTML = `
      <div class="fg"><label for="f-organization">Organization / Business <span style="font-weight:400;opacity:.7">(optional)</span></label><input id="f-organization" type="text" maxlength="180" placeholder="Business or organization name" autocomplete="organization"/></div>
      <div class="fg"><label for="f-phone">Phone / WhatsApp <span style="font-weight:400;opacity:.7">(optional)</span></label><input id="f-phone" type="tel" maxlength="80" placeholder="e.g. +232…" autocomplete="tel"/></div>`;
    serviceField.before(detailsRow);

    const preference = document.createElement('div');
    preference.className = 'fg';
    preference.innerHTML = `
      <label for="f-preferred-contact">Preferred Contact Method</label>
      <select id="f-preferred-contact">
        <option value="email">Email</option>
        <option value="phone">Phone</option>
        <option value="whatsapp">WhatsApp</option>
      </select>
      <small id="f-contact-help" style="display:block;margin-top:8px;line-height:1.5;opacity:.72">Choose how you would prefer the DVL team to follow up.</small>`;
    serviceField.after(preference);
  }

  const ok = document.getElementById('fs-ok');
  const err = document.getElementById('fs-err');
  if (ok) {
    ok.setAttribute('aria-live', 'polite');
    ok.setAttribute('role', 'status');
  }
  if (err) {
    err.setAttribute('aria-live', 'assertive');
    err.setAttribute('role', 'alert');
  }

  const preferred = document.getElementById('f-preferred-contact');
  const phone = document.getElementById('f-phone');
  const syncPhoneRequirement = () => {
    const requiresPhone = preferred?.value === 'phone' || preferred?.value === 'whatsapp';
    if (phone) {
      phone.required = Boolean(requiresPhone);
      phone.setAttribute('aria-required', requiresPhone ? 'true' : 'false');
    }
  };
  preferred?.addEventListener('change', syncPhoneRequirement);
  syncPhoneRequirement();

  window.handleForm = async function handlePhase3Form(e) {
    e.preventDefault();
    const btn = document.getElementById('submitBtn');
    const success = document.getElementById('fs-ok');
    const failure = document.getElementById('fs-err');
    const name = document.getElementById('f-name')?.value.trim() || '';
    const email = document.getElementById('f-email')?.value.trim() || '';
    const organization = document.getElementById('f-organization')?.value.trim() || '';
    const phoneValue = document.getElementById('f-phone')?.value.trim() || '';
    const service = document.getElementById('f-service')?.value || 'General Inquiry';
    const contactMethod = document.getElementById('f-preferred-contact')?.value || 'email';
    const message = document.getElementById('f-msg')?.value.trim() || '';
    const consent = document.getElementById('f-consent')?.checked === true;
    const honeypot = document.getElementById('f-company-website')?.value || '';

    const showError = (text) => {
      if (!failure) return;
      failure.textContent = text;
      failure.style.display = 'block';
    };

    if (failure) failure.style.display = 'none';
    if (success) success.style.display = 'none';

    if (!name || !email || !message) return showError('Please fill in your name, email, and message.');
    if ((contactMethod === 'phone' || contactMethod === 'whatsapp') && !phoneValue) {
      return showError('Please add your phone or WhatsApp number for your selected contact method.');
    }
    if (!consent) return showError('Please confirm that we may use your information to respond to this enquiry.');

    if (btn) {
      btn.disabled = true;
      btn.textContent = 'Sending…';
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        signal: controller.signal,
        body: JSON.stringify({
          full_name: name,
          email,
          organization: organization || null,
          phone: phoneValue || null,
          service_interest: service,
          preferred_contact_method: contactMethod,
          message,
          consent,
          company_website: honeypot
        })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Unable to send your enquiry.');

      if (success) {
        success.textContent = '';
        const lead = document.createElement('strong');
        lead.textContent = 'Enquiry received.';
        success.append(lead);
        if (data.reference_no) {
          success.append(document.createElement('br'));
          success.append(document.createTextNode('Your reference is '));
          const ref = document.createElement('strong');
          ref.textContent = data.reference_no;
          success.append(ref, document.createTextNode('. Please keep it for follow-up.'));
        }
        success.append(document.createElement('br'));
        success.append(document.createTextNode('The DVL team will review your request and contact you using your preferred method.'));
        success.style.display = 'block';
      }
      form.reset();
      syncPhoneRequirement();
    } catch (error) {
      const text = error?.name === 'AbortError'
        ? 'The request is taking longer than expected. Please try again shortly.'
        : (error?.message || 'We could not send your enquiry right now. Please try again shortly.');
      showError(text);
    } finally {
      clearTimeout(timeout);
      if (btn) {
        btn.disabled = false;
        btn.textContent = 'Send Message';
      }
    }
  };
})();
