from pathlib import Path
import re

path = Path('index.html')
text = path.read_text(encoding='utf-8')
original = text

old_form = '''        <div class="fg">
          <label>Service of Interest</label>
          <select id="f-service">
            <option value="">Choose a service…</option>
            <option>Business &amp; Compliance Services</option>
            <option>Digital Solutions &amp; Systems</option>
            <option>Creative Media Services</option>
            <option>General Inquiry</option>
          </select>
        </div>
        <div class="fg"><label>Message</label><textarea id="f-msg" placeholder="Tell us about your business needs…"></textarea></div>'''
new_form = '''        <div class="form-row">
          <div class="fg"><label>Organization / Business <span style="font-weight:400;opacity:.72">(optional)</span></label><input id="f-organization" type="text" maxlength="180" autocomplete="organization" placeholder="Business or organization name"/></div>
          <div class="fg"><label>Phone / WhatsApp <span style="font-weight:400;opacity:.72">(optional)</span></label><input id="f-phone" type="tel" maxlength="80" autocomplete="tel" inputmode="tel" placeholder="e.g. +232 …"/></div>
        </div>
        <div class="form-row">
          <div class="fg">
            <label>Service of Interest</label>
            <select id="f-service">
              <option value="">Choose a service…</option>
              <option>Business &amp; Compliance Services</option>
              <option>Digital Solutions &amp; Systems</option>
              <option>Creative Media Services</option>
              <option>General Inquiry</option>
            </select>
          </div>
          <div class="fg">
            <label>Preferred Contact Method</label>
            <select id="f-contact-method">
              <option value="email">Email</option>
              <option value="phone">Phone</option>
              <option value="whatsapp">WhatsApp</option>
            </select>
          </div>
        </div>
        <div class="fg"><label>Message</label><textarea id="f-msg" minlength="10" maxlength="5000" placeholder="Tell us about your business needs…" required></textarea></div>'''
if old_form not in text:
    raise SystemExit('Expected contact form block not found')
text = text.replace(old_form, new_form, 1)
text = text.replace('<div id="fs-ok">✓ Message sent! We\'ll be in touch with you shortly.</div>', '<div id="fs-ok" role="status" aria-live="polite">✓ Message sent! We\'ll be in touch with you shortly.</div>', 1)
text = text.replace('<div id="fs-err">Something went wrong. Please try again or call us directly.</div>', '<div id="fs-err" role="alert" aria-live="assertive">Something went wrong. Please try again or call us directly.</div>', 1)

start = text.index('// Contact form\nasync function handleForm(e) {')
end = text.index('\n\nconst DVL_SERVICES=', start)
new_handler = '''// Contact form
function showDVLFormError(message){
  const err=document.getElementById('fs-err');
  if(!err)return;
  err.textContent=message;err.style.display='block';
  window.setTimeout(()=>{err.style.display='none'},5000);
}
async function handleForm(e) {
  e.preventDefault();
  const form=e.currentTarget;
  const btn=document.getElementById('submitBtn');
  const ok=document.getElementById('fs-ok');
  const err=document.getElementById('fs-err');
  const name=document.getElementById('f-name').value.trim();
  const email=document.getElementById('f-email').value.trim();
  const organization=document.getElementById('f-organization')?.value.trim()||'';
  const phone=document.getElementById('f-phone')?.value.trim()||'';
  const service=document.getElementById('f-service').value||'General Inquiry';
  const preferredContactMethod=document.getElementById('f-contact-method')?.value||'email';
  const message=document.getElementById('f-msg').value.trim();
  const consent=document.getElementById('f-consent')?.checked===true;
  const honeypot=document.getElementById('f-company-website')?.value||'';
  const emailPattern=/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
  if(name.length<2){showDVLFormError('Please enter your full name.');return;}
  if(!emailPattern.test(email)){showDVLFormError('Please enter a valid email address.');return;}
  if(message.length<10){showDVLFormError('Please enter a message of at least 10 characters.');return;}
  if((preferredContactMethod==='phone'||preferredContactMethod==='whatsapp')&&!phone){showDVLFormError('Please enter your phone number when choosing Phone or WhatsApp as your preferred contact method.');return;}
  if(!consent){showDVLFormError('Please confirm that we may use your information to respond to this enquiry.');return;}
  btn.disabled=true;btn.textContent='Sending…';
  ok.style.display='none';err.style.display='none';
  const controller=new AbortController();
  const timeout=window.setTimeout(()=>controller.abort(),15000);
  try{
    const res=await fetch(API_URL,{method:'POST',headers:{'Content-Type':'application/json'},signal:controller.signal,body:JSON.stringify({
      full_name:name,
      email,
      organization:organization||null,
      phone:phone||null,
      service_interest:service,
      preferred_contact_method:preferredContactMethod,
      message,
      consent,
      company_website:honeypot
    })});
    const data=await res.json().catch(()=>({}));
    if(!res.ok) throw new Error(data.error||'Unable to send your message.');
    const ref=data.reference_no?` Your reference is ${data.reference_no}.`:'';
    ok.textContent='Thank you. Your enquiry has been received.'+ref+' Our team will review it and contact you through your preferred method.';
    ok.style.display='block';
    form.reset();
    const msg=document.getElementById('f-msg');if(msg)delete msg.dataset.dvlPrefill;
  }catch(error){
    const errorMessage=error?.name==='AbortError'?'The request took too long. Please check your connection and try again.':(error?.message||'We could not send your message right now. Please try again shortly.');
    showDVLFormError(errorMessage);
  }finally{
    window.clearTimeout(timeout);
    btn.disabled=false;btn.textContent='Send Message';
  }
}'''
text = text[:start] + new_handler + text[end:]

needle = "const serviceModal=document.getElementById('serviceModal');\n"
helpers = '''const serviceModal=document.getElementById('serviceModal');
function resetDVLModalDecorations(){
  const list=document.getElementById('serviceModalList');if(list)list.className='';
  ['businessComplianceNote','digitalServiceNote','creativeServiceNote'].forEach(id=>document.getElementById(id)?.remove());
}
function setDVLMessagePrefill(value){
  const msg=document.getElementById('f-msg');if(!msg)return;
  const previous=msg.dataset.dvlPrefill||'';
  const current=msg.value.trim();
  if(!current||current===previous.trim()){
    msg.value=value;msg.dataset.dvlPrefill=value;
  }
}
document.getElementById('f-msg')?.addEventListener('input',e=>{
  const msg=e.currentTarget;
  if(msg.dataset.dvlPrefill&&msg.value!==msg.dataset.dvlPrefill)delete msg.dataset.dvlPrefill;
});
'''
if needle not in text:
    raise SystemExit('serviceModal declaration not found')
text = text.replace(needle, helpers, 1)

old_prefill = "function prefillDVLRequest(key){const d=DVL_SERVICES[key],form=document.querySelector('#contact form, form.contact-form, #contactForm');if(!d||!form)return;const select=form.querySelector('select');if(select){const match=[...select.options].find(o=>o.textContent.toLowerCase().includes(d.title.split(' Services')[0].toLowerCase())||o.value.toLowerCase().includes(key));if(match)select.value=match.value}const msg=form.querySelector('textarea');if(msg&&!msg.value.trim())msg.value='I am interested in '+d.title+'. Please contact me to discuss my requirements.'}"
new_prefill = "function prefillDVLRequest(key){const d=DVL_SERVICES[key],form=document.querySelector('#contact form, form.contact-form, #contactForm');if(!d||!form)return;const select=document.getElementById('f-service');if(select){const match=[...select.options].find(o=>o.textContent.toLowerCase().includes(d.title.split(' Services')[0].toLowerCase())||o.value.toLowerCase().includes(key));if(match)select.value=match.value}setDVLMessagePrefill('I am interested in '+d.title+'. Please contact me to discuss my requirements.')}"
if old_prefill not in text:
    raise SystemExit('generic prefill function not found')
text = text.replace(old_prefill, new_prefill, 1)

listener_patterns = [
    r"document\.getElementById\('modalRequestBtn'\)\?\.addEventListener\('click',e=>\{prefillDVLRequest\(e\.currentTarget\.dataset\.requestDivision\);closeDVLService\(\)\}\);",
    r"const exactRequest=document\.getElementById\('modalRequestBtn'\);\nexactRequest\?\.addEventListener\('click',e=>\{.*?\}\);",
    r"document\.getElementById\('modalRequestBtn'\)\?\.addEventListener\('click',e=>\{const key=e\.currentTarget\.dataset\.requestDivision,x=DIGITAL_SERVICES\[key\];.*?\}\);",
    r"document\.getElementById\('modalRequestBtn'\)\?\.addEventListener\('click',e=>\{const key=e\.currentTarget\.dataset\.requestDivision,x=CREATIVE_SERVICES\[key\];.*?\}\);",
]
removed = 0
for pattern in listener_patterns:
    text, n = re.subn(pattern, '', text, count=1, flags=re.S)
    removed += n
if removed != 4:
    raise SystemExit(f'Expected to remove 4 competing modal CTA listeners, removed {removed}')

for signature in ['function renderBusinessServiceMenu(){', 'function renderDigitalServiceMenu(){', 'function renderCreativeServiceMenu(){']:
    replacement = signature + '\n resetDVLModalDecorations();'
    if signature not in text:
        raise SystemExit(f'{signature} not found')
    text = text.replace(signature, replacement, 1)

text = text.replace(" const old=document.getElementById('businessComplianceNote');if(old)old.remove();\n", '', 1)
text = text.replace(" const old=document.getElementById('digitalServiceNote');if(old)old.remove();\n", '', 1)
text = text.replace(" document.getElementById('businessComplianceNote')?.remove();document.getElementById('digitalServiceNote')?.remove();document.getElementById('creativeServiceNote')?.remove();\n", '', 1)

closing = '\n\n</script>\n</body>\n</html>'
if closing not in text:
    raise SystemExit('script closing marker not found')
central = '''

// Centralized conversion CTA — one listener, one source of truth.
function resolveDVLRequest(key){
  const exact=BUSINESS_SERVICES[key]||DIGITAL_SERVICES[key]||CREATIVE_SERVICES[key];
  if(exact){
    let detail='requirements and next steps';
    if(DIGITAL_SERVICES[key])detail='requirements, scope and next steps';
    if(CREATIVE_SERVICES[key])detail='assignment, deliverables and next steps';
    return {service:exact.title,message:'I am interested in '+exact.title+'. Please contact me to discuss the '+detail+'.'};
  }
  const division=DVL_SERVICES[key];
  if(division)return {service:division.title,message:'I am interested in '+division.title+'. Please contact me to discuss my requirements.'};
  return null;
}
document.getElementById('modalRequestBtn')?.addEventListener('click',e=>{
  const request=resolveDVLRequest(e.currentTarget.dataset.requestDivision);
  if(!request)return;
  const select=document.getElementById('f-service');
  if(select&&[...select.options].some(option=>option.value===request.service))select.value=request.service;
  setDVLMessagePrefill(request.message);
  closeDVLService();
});
'''
text = text.replace(closing, central + closing, 1)

if text == original:
    raise SystemExit('No changes made')
if text.count("modalRequestBtn')?.addEventListener('click'") != 1:
    raise SystemExit('Expected exactly one modalRequestBtn click listener')
for required in ['id="f-organization"','id="f-phone"','id="f-contact-method"','organization:organization||null','phone:phone||null','preferred_contact_method:preferredContactMethod','function resolveDVLRequest(key)','function resetDVLModalDecorations()']:
    if required not in text:
        raise SystemExit(f'Missing expected conversion feature: {required}')
if any(marker in text for marker in ['<<<<<<<','>>>>>>>']):
    raise SystemExit('Merge conflict marker found')

path.write_text(text, encoding='utf-8')
print('DVL frontend conversion module fixed successfully')
