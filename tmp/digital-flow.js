// Digital Solutions & Systems exact-service flow
const DIGITAL_SERVICES={
 'corporate-websites':{title:'Corporate Website Development',intro:'Professional responsive websites designed to build credibility, generate enquiries and support day-to-day business communication.',includes:['Corporate and SME websites','Startup and NGO websites','Hotel and service-business websites','Landing pages and portfolios','Responsive mobile design','Contact and enquiry forms','WhatsApp integration','Basic SEO and analytics setup']},
 'ecommerce-platforms':{title:'E-Commerce Platforms',intro:'Online storefronts that help businesses present products, accept orders and manage the core digital sales journey.',includes:['Online storefront setup','Product catalogue management','Shopping cart and checkout','Customer accounts','Order management','Payment integration','Inventory connection','WhatsApp ordering support','Responsive storefront and reporting']},
 'erp-systems':{title:'ERP Systems',intro:'Integrated business systems that bring core operations into one practical management environment.',includes:['Finance and operational modules','Procurement workflows','Inventory management','HR administration','Sales and customer operations','Management reporting','Role-based administration','Scalable module design for SMEs']},
 'crm-systems':{title:'CRM Systems',intro:'Customer relationship systems that help businesses organize leads, enquiries, follow-ups and sales activity.',includes:['Customer database','Lead management','Sales pipeline','Interaction history','Follow-up reminders','Enquiry and support tracking','Sales reporting','Management dashboards']},
 'hrm-systems':{title:'HRM Systems',intro:'Digital HR systems that help organizations manage employee records, movements, leave and performance information.',includes:['Employee records','Attendance management','Leave management','Employee movements','Training records','Performance tracking','Promotion history','Payroll-related information','HR reports and role-based access']},
 'payment-integration':{title:'Payment Gateway Integration',intro:'Secure integration of licensed payment providers into websites and digital business systems.',includes:['Online payment integration','Checkout implementation','Transaction records','Payment confirmation','Digital receipts','Payment-status tracking','Order and ecommerce integration']},
 'inventory-systems':{title:'Inventory Management Systems',intro:'Stock-management tools that help businesses monitor products, suppliers, stock movements and low-stock risks.',includes:['Product and SKU management','Stock levels and movements','Supplier records','Sales-linked stock updates','Low-stock alerts','Inventory reports','Branch or location support','Management dashboards']},
 'whatsapp-integration':{title:'WhatsApp Business Integration',intro:'Practical WhatsApp connections that make it easier for customers to enquire, order and communicate with a business.',includes:['Website-to-WhatsApp links','Product and service enquiries','WhatsApp ordering flows','Lead capture','Support links','Automated responses where appropriate','Customer notifications','Workflow integrations']}
};
const baseDigitalOpenDVLService=openDVLService;
function renderDigitalServiceMenu(){
 const d=DVL_SERVICES.digital;if(!serviceModal)return;
 document.getElementById('serviceModalKicker').textContent='Digitize';
 document.getElementById('serviceModalTitle').textContent=d.title;
 document.getElementById('serviceModalIntro').textContent='Choose the exact digital solution your business needs. Review the scope before sending your request.';
 const list=document.getElementById('serviceModalList');list.className='digital-service-list';
 list.innerHTML=Object.entries(DIGITAL_SERVICES).map(([key,x])=>'<li><button type="button" class="digital-subservice-btn" data-digital-service="'+key+'"><strong>'+x.title+'</strong><span>View →</span></button></li>').join('');
 list.querySelectorAll('[data-digital-service]').forEach(btn=>btn.addEventListener('click',()=>openDigitalService(btn.dataset.digitalService)));
 const request=document.getElementById('modalRequestBtn');request.dataset.requestDivision='digital';request.textContent='Request Digital Solutions Support →';
 const old=document.getElementById('digitalServiceNote');if(old)old.remove();
 const note=document.createElement('p');note.id='digitalServiceNote';note.className='digital-service-note';note.textContent='DVL scopes each digital solution around the client’s actual operational needs. Third-party platform, hosting, domain, payment-provider or software fees are quoted separately where applicable.';document.querySelector('.service-modal-footer').before(note);
 serviceModal.classList.add('open');serviceModal.setAttribute('aria-hidden','false');document.body.style.overflow='hidden';
}
function openDigitalService(key){
 const x=DIGITAL_SERVICES[key];if(!x||!serviceModal)return;
 document.getElementById('serviceModalKicker').innerHTML='<button type="button" class="service-back" id="digitalServiceBack">← Back to Digital Solutions</button><div class="exact-service-label">Digital Solutions & Systems</div>';
 document.getElementById('digitalServiceBack').addEventListener('click',renderDigitalServiceMenu);
 document.getElementById('serviceModalTitle').textContent=x.title;
 document.getElementById('serviceModalIntro').textContent=x.intro;
 const list=document.getElementById('serviceModalList');list.className='';list.innerHTML=x.includes.map(i=>'<li>'+i+'</li>').join('');
 const request=document.getElementById('modalRequestBtn');request.dataset.requestDivision=key;request.textContent='Request '+x.title+' →';
 let note=document.getElementById('digitalServiceNote');if(!note){note=document.createElement('p');note.id='digitalServiceNote';note.className='digital-service-note';document.querySelector('.service-modal-footer').before(note)}note.textContent='Final scope, timeline and professional service fee are confirmed after DVL reviews your requirements. Any third-party fees are identified separately where applicable.';
}
openDVLService=function(key){if(key==='digital')return renderDigitalServiceMenu();return baseDigitalOpenDVLService(key)};
function ensureDigitalServiceOptions(){const select=document.getElementById('f-service');if(!select)return;Object.values(DIGITAL_SERVICES).forEach(x=>{if([...select.options].some(o=>o.value===x.title))return;const o=document.createElement('option');o.value=x.title;o.textContent='Digital Solutions — '+x.title;const creative=[...select.options].find(o=>o.textContent.includes('Creative Media'));select.insertBefore(o,creative||null)})}
ensureDigitalServiceOptions();
document.getElementById('modalRequestBtn')?.addEventListener('click',e=>{const key=e.currentTarget.dataset.requestDivision,x=DIGITAL_SERVICES[key];if(!x)return;const select=document.getElementById('f-service');if(select)select.value=x.title;const msg=document.getElementById('f-msg');if(msg)msg.value='I am interested in '+x.title+'. Please contact me to discuss my requirements, scope and next steps.';closeDVLService()});
