from pathlib import Path

p=Path('index.html')
s=p.read_text(encoding='utf-8')

def once(old,new,label):
    global s
    if s.count(old)!=1:
        raise SystemExit(f'{label}: expected 1 match, found {s.count(old)}')
    s=s.replace(old,new,1)

old='''        <div class="fg">
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
new='''        <div class="form-row">
          <div class="fg"><label>Organization / Business <span style="font-weight:400;opacity:.72">(optional)</span></label><input id="f-organization" type="text" maxlength="180" autocomplete="organization" placeholder="Business or organization name"/></div>
          <div class="fg"><label>Phone / WhatsApp <span style="font-weight:400;opacity:.72">(optional)</span></label><input id="f-phone" type="tel" maxlength="80" autocomplete="tel" inputmode="tel" placeholder="e.g. +232 …"/></div>
        </div>
        <div class="form-row">
          <div class="fg"><label>Service of Interest</label><select id="f-service">
            <option value="">Choose a service…</option>
            <option>Business &amp; Compliance Services</option>
            <option>Digital Solutions &amp; Systems</option>
            <option>Creative Media Services</option>
            <option>General Inquiry</option>
          </select></div>
          <div class="fg"><label>Preferred Contact Method</label><select id="f-contact-method"><option value="email">Email</option><option value="phone">Phone</option><option value="whatsapp">WhatsApp</option></select></div>
        </div>
        <div class="fg"><label>Message</label><textarea id="f-msg" minlength="10" maxlength="5000" placeholder="Tell us about your business needs…" required></textarea></div>'''
once(old,new,'contact form')
s=s.replace('<div id="fs-ok">','<div id="fs-ok" role="status" aria-live="polite">',1)
s=s.replace('<div id="fs-err">','<div id="fs-err" role="alert" aria-live="assertive">',1)

start=s.index('// Contact form\nasync function handleForm(e) {')
end=s.index('\n\nconst DVL_SERVICES=',start)
handler='''// Contact form
function showDVLFormError(message){const err=document.getElementById('fs-err');if(!err)return;err.textContent=message;err.style.display='block';window.setTimeout(()=>{err.style.display='none'},5000)}
async function handleForm(e){
 e.preventDefault();
 const form=e.currentTarget,btn=document.getElementById('submitBtn'),ok=document.getElementById('fs-ok'),err=document.getElementById('fs-err');
 const name=document.getElementById('f-name').value.trim(),email=document.getElementById('f-email').value.trim();
 const organization=document.getElementById('f-organization')?.value.trim()||'',phone=document.getElementById('f-phone')?.value.trim()||'';
 const service=document.getElementById('f-service').value||'General Inquiry',preferredContactMethod=document.getElementById('f-contact-method')?.value||'email';
 const message=document.getElementById('f-msg').value.trim(),consent=document.getElementById('f-consent')?.checked===true,honeypot=document.getElementById('f-company-website')?.value||'';
 if(name.length<2){showDVLFormError('Please enter your full name.');return}
 if(!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email)){showDVLFormError('Please enter a valid email address.');return}
 if(message.length<10){showDVLFormError('Please enter a message of at least 10 characters.');return}
 if((preferredContactMethod==='phone'||preferredContactMethod==='whatsapp')&&!phone){showDVLFormError('Please enter your phone number when choosing Phone or WhatsApp as your preferred contact method.');return}
 if(!consent){showDVLFormError('Please confirm that we may use your information to respond to this enquiry.');return}
 btn.disabled=true;btn.textContent='Sending…';ok.style.display='none';err.style.display='none';
 const controller=new AbortController(),timeout=window.setTimeout(()=>controller.abort(),15000);
 try{
  const res=await fetch(API_URL,{method:'POST',headers:{'Content-Type':'application/json'},signal:controller.signal,body:JSON.stringify({full_name:name,email,organization:organization||null,phone:phone||null,service_interest:service,preferred_contact_method:preferredContactMethod,message,consent,company_website:honeypot})});
  const data=await res.json().catch(()=>({}));if(!res.ok)throw new Error(data.error||'Unable to send your message.');
  const ref=data.reference_no?` Your reference is ${data.reference_no}.`:'';ok.textContent='Thank you. Your enquiry has been received.'+ref+' Our team will review it and contact you through your preferred method.';ok.style.display='block';form.reset();
  const msg=document.getElementById('f-msg');if(msg)delete msg.dataset.dvlPrefill;
 }catch(error){showDVLFormError(error?.name==='AbortError'?'The request took too long. Please check your connection and try again.':(error?.message||'We could not send your message right now. Please try again shortly.'))}
 finally{window.clearTimeout(timeout);btn.disabled=false;btn.textContent='Send Message'}
}'''
s=s[:start]+handler+s[end:]

once("const serviceModal=document.getElementById('serviceModal');\n","""const serviceModal=document.getElementById('serviceModal');
function resetDVLModalDecorations(){const list=document.getElementById('serviceModalList');if(list)list.className='';['businessComplianceNote','digitalServiceNote','creativeServiceNote'].forEach(id=>document.getElementById(id)?.remove())}
function setDVLMessagePrefill(value){const msg=document.getElementById('f-msg');if(!msg)return;const previous=msg.dataset.dvlPrefill||'',current=msg.value.trim();if(!current||current===previous.trim()){msg.value=value;msg.dataset.dvlPrefill=value}}
document.getElementById('f-msg')?.addEventListener('input',e=>{const msg=e.currentTarget;if(msg.dataset.dvlPrefill&&msg.value!==msg.dataset.dvlPrefill)delete msg.dataset.dvlPrefill});
""",'service helpers')

old_prefill="function prefillDVLRequest(key){const d=DVL_SERVICES[key],form=document.querySelector('#contact form, form.contact-form, #contactForm');if(!d||!form)return;const select=form.querySelector('select');if(select){const match=[...select.options].find(o=>o.textContent.toLowerCase().includes(d.title.split(' Services')[0].toLowerCase())||o.value.toLowerCase().includes(key));if(match)select.value=match.value}const msg=form.querySelector('textarea');if(msg&&!msg.value.trim())msg.value='I am interested in '+d.title+'. Please contact me to discuss my requirements.'}"
new_prefill="function prefillDVLRequest(key){const d=DVL_SERVICES[key],form=document.querySelector('#contact form, form.contact-form, #contactForm');if(!d||!form)return;const select=document.getElementById('f-service');if(select){const match=[...select.options].find(o=>o.textContent.toLowerCase().includes(d.title.split(' Services')[0].toLowerCase())||o.value.toLowerCase().includes(key));if(match)select.value=match.value}setDVLMessagePrefill('I am interested in '+d.title+'. Please contact me to discuss my requirements.')}"
once(old_prefill,new_prefill,'generic prefill')

listeners=[
"document.getElementById('modalRequestBtn')?.addEventListener('click',e=>{prefillDVLRequest(e.currentTarget.dataset.requestDivision);closeDVLService()});",
"const exactRequest=document.getElementById('modalRequestBtn');exactRequest?.addEventListener('click',e=>{const key=e.currentTarget.dataset.requestDivision,x=BUSINESS_SERVICES[key];if(!x)return;const select=document.getElementById('f-service');if(select)select.value=x.title;const msg=document.getElementById('f-msg');if(msg)msg.value='I am interested in '+x.title+'. Please contact me to discuss the requirements and next steps.';closeDVLService()});",
"document.getElementById('modalRequestBtn')?.addEventListener('click',e=>{const key=e.currentTarget.dataset.requestDivision,x=DIGITAL_SERVICES[key];if(!x)return;const select=document.getElementById('f-service');if(select)select.value=x.title;const msg=document.getElementById('f-msg');if(msg)msg.value='I am interested in '+x.title+'. Please contact me to discuss my requirements, scope and next steps.';closeDVLService()});",
"document.getElementById('modalRequestBtn')?.addEventListener('click',e=>{const key=e.currentTarget.dataset.requestDivision,x=CREATIVE_SERVICES[key];if(!x)return;const select=document.getElementById('f-service');if(select)select.value=x.title;const msg=document.getElementById('f-msg');if(msg)msg.value='I am interested in '+x.title+'. Please contact me to discuss the assignment, deliverables and next steps.';closeDVLService()});"
]
for i,line in enumerate(listeners,1): once(line,'',f'listener {i}')

for fn in ['renderBusinessServiceMenu','renderDigitalServiceMenu','renderCreativeServiceMenu']:
    once(f'function {fn}(){{',f'function {fn}(){{\n resetDVLModalDecorations();',fn)
s=s.replace(" const old=document.getElementById('businessComplianceNote');if(old)old.remove();\n",'',1)
s=s.replace(" const old=document.getElementById('digitalServiceNote');if(old)old.remove();\n",'',1)
s=s.replace(" document.getElementById('businessComplianceNote')?.remove();document.getElementById('digitalServiceNote')?.remove();document.getElementById('creativeServiceNote')?.remove();\n",'',1)

central='''

// Centralized conversion CTA — one listener, one source of truth.
function resolveDVLRequest(key){
 const exact=BUSINESS_SERVICES[key]||DIGITAL_SERVICES[key]||CREATIVE_SERVICES[key];
 if(exact){let detail='requirements and next steps';if(DIGITAL_SERVICES[key])detail='requirements, scope and next steps';if(CREATIVE_SERVICES[key])detail='assignment, deliverables and next steps';return {service:exact.title,message:'I am interested in '+exact.title+'. Please contact me to discuss the '+detail+'.'}}
 const division=DVL_SERVICES[key];return division?{service:division.title,message:'I am interested in '+division.title+'. Please contact me to discuss my requirements.'}:null
}
document.getElementById('modalRequestBtn')?.addEventListener('click',e=>{const request=resolveDVLRequest(e.currentTarget.dataset.requestDivision);if(!request)return;const select=document.getElementById('f-service');if(select&&[...select.options].some(o=>o.value===request.service))select.value=request.service;setDVLMessagePrefill(request.message);closeDVLService()});'''
once('\n\n</script>\n</body>\n</html>',central+'\n\n</script>\n</body>\n</html>','script close')

checks=['id="f-organization"','id="f-phone"','id="f-contact-method"','organization:organization||null','phone:phone||null','preferred_contact_method:preferredContactMethod','function resolveDVLRequest(key)','function resetDVLModalDecorations()']
for x in checks:
    if x not in s: raise SystemExit('missing '+x)
if s.count("modalRequestBtn')?.addEventListener('click'")!=1: raise SystemExit('modal CTA listener count invalid')
if '<<<<<<<' in s or '>>>>>>>' in s: raise SystemExit('merge marker found')
p.write_text(s,encoding='utf-8')
print('frontend conversion v2 applied')
