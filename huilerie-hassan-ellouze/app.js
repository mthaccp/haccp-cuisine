(() => {
  'use strict';
  const C = window.HHE_CONFIG;
  if (!C || !Array.isArray(C.products)) return;
  const $ = id => document.getElementById(id);
  const productsById = Object.fromEntries(C.products.map(p => [p.id, p]));
  const storageKey = 'hhe-basket-v1';
  let basket = {};
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || '{}');
    for (const [id, val] of Object.entries(saved)) if (productsById[id] && Number.isInteger(val) && val > 0 && val <= 999) basket[id] = val;
  } catch (_) { /* Browser storage may be disabled. */ }
  let toastTimeout;
  let currentText = '';
  const currency = val => new Intl.NumberFormat('fr-TN',{minimumFractionDigits:3,maximumFractionDigits:3}).format(val) + ' DT';
  const totalQty = () => Object.values(basket).reduce((sum, qty) => sum + qty, 0);
  const persist = () => { try { localStorage.setItem(storageKey, JSON.stringify(basket)); } catch (_) {} };
  const toast = msg => {
    const e=$('toast'); e.textContent=msg; e.classList.add('show');clearTimeout(toastTimeout);toastTimeout=setTimeout(()=>e.classList.remove('show'),2800);
  };
  function bottleDrawing(product) {
    const sizeClass = product.size === '250 ml' ? 'small' : (product.size === '500 ml' ? 'medium':'');
    return `<div class="plastic-bottle ${sizeClass}" aria-hidden="true"><div class="plastic-cap"></div><div class="plastic-neck"></div><div class="plastic-body"></div><div class="plastic-label"><img src="assets/logo-transparent.webp" alt=""/><span>BIO</span></div></div><span class="visual-note">VISUEL PROVISOIRE</span>`;
  }
  function renderProducts(filter='all') {
    $('products').innerHTML = C.products.filter(p => filter==='all' || p.material===filter).map((p,i) => `<article class="product-card"><div class="product-media ${p.image?'product-media-real':''}">${p.image?`<img src="${p.image}" alt="${p.title}, bouteille en ${p.material} de ${p.size}" loading="lazy" />`:bottleDrawing(p)}<span class="product-tag">${p.material==='verre'?'COLLECTION SIGNATURE':'COLLECTION BIO'}</span></div><div class="product-info"><span class="product-sub">Huilerie Hassan Ellouze · BIO</span><h3>${p.title}</h3><div class="size">${p.material==='verre'?'Verre':'Plastique'} · ${p.size}</div><p>${p.description}</p><div class="product-bottom"><span class="price-pending">${C.pricesEnabled && typeof p.price==='number'?currency(p.price):'Prix à venir'}</span><button class="add-btn" type="button" data-add="${p.id}" aria-label="Ajouter ${p.title} ${p.size} à ma demande">Ajouter <span>+</span></button></div></div></article>`).join('');
    $('products').querySelectorAll('[data-add]').forEach(button=>button.addEventListener('click',()=>add(button.dataset.add)));
  }
  function updateCount(){const qty=totalQty();$('cart-count').textContent=qty;$('drawer-count').textContent=qty?`(${qty})`:'';}
  function add(id){basket[id]=(basket[id]||0)+1;persist();updateCount();renderCart();toast('Produit ajouté à votre demande');}
  function modify(id,delta){const qty=(basket[id]||0)+delta;if(qty<=0) delete basket[id];else basket[id]=Math.min(qty,999);persist();updateCount();renderCart();}
  function renderCart(){
    const lines=$('cart-lines');lines.innerHTML='';
    for(const [id,qty] of Object.entries(basket)){
      const p=productsById[id];if(!p) continue;
      const line=document.createElement('div');line.className='cart-item';
      const thumb=document.createElement('div');thumb.className='cart-thumb';
      if(p.image){const img=document.createElement('img');img.src=p.image;img.alt='';thumb.append(img);}else{const small=document.createElement('span');small.className='small-drawing';small.textContent='Format '+p.size;thumb.append(small);}
      const info=document.createElement('div');info.className='cart-info';
      const title=document.createElement('h3');title.textContent=p.title;
      const label=document.createElement('p');label.textContent=`${p.material==='verre'?'Verre':'Plastique'} · ${p.size}`;
      const ctl=document.createElement('div');ctl.className='qty-controls';
      const down=document.createElement('button');down.type='button';down.textContent='−';down.setAttribute('aria-label',`Réduire ${p.title}`);down.addEventListener('click',()=>modify(id,-1));
      const n=document.createElement('span');n.textContent=qty;
      const up=document.createElement('button');up.type='button';up.textContent='+';up.setAttribute('aria-label',`Augmenter ${p.title}`);up.addEventListener('click',()=>modify(id,1));
      ctl.append(down,n,up);info.append(title,label,ctl);
      const remove=document.createElement('button');remove.type='button';remove.className='remove-item';remove.textContent='×';remove.setAttribute('aria-label',`Retirer ${p.title}`);remove.addEventListener('click',()=>{delete basket[id];persist();updateCount();renderCart()});
      line.append(thumb,info,remove);lines.append(line);
    }
    const hasItems=totalQty()>0;$('cart-empty').hidden=hasItems;$('cart-footer').hidden=!hasItems;
  }
  const showCart=()=>{$('overlay').hidden=false;$('cart-drawer').classList.add('open');$('cart-drawer').setAttribute('aria-hidden','false');document.body.style.overflow='hidden';$('cart-close').focus()};
  const closeCart=()=>{$('overlay').hidden=true;$('cart-drawer').classList.remove('open');$('cart-drawer').setAttribute('aria-hidden','true');document.body.style.overflow=''};
  const showModal=()=>{$('modal-backdrop').hidden=false;document.body.style.overflow='hidden';$('modal-close').focus()};
  const closeModal=()=>{$('modal-backdrop').hidden=true;document.body.style.overflow='';};
  function setPreview(message){
    currentText=message;$('buyer-fields').hidden=true;$('message-preview').hidden=false;$('request-output').textContent=message;
    const raw=(C.whatsappNumber||'').replace(/\D/g,'');
    const wa=$('wa-request');
    if(raw.length>=10){wa.hidden=false;wa.href=`https://wa.me/${raw}?text=${encodeURIComponent(message)}`;}else{wa.hidden=true;wa.removeAttribute('href');}
  }
  function resetModal({business=false}={}){
    $('modal-tag').textContent=business?'ESPACE PROFESSIONNEL':'VOTRE DEMANDE';
    $('modal-title').textContent=business?'Votre demande de devis':'Préparer votre commande';
    $('modal-desc').textContent=business?'Voici les détails que vous pourrez copier et transmettre à l’huilerie.':'Indiquez vos coordonnées pour générer votre demande de disponibilité et de prix.';
    $('buyer-fields').hidden=business;$('message-preview').hidden=!business;
  }
  function buildCartMessage(form){
    const d=new FormData(form);
    const lines=Object.entries(basket).map(([id,qty])=>{const p=productsById[id];return `- ${p.title} (${p.material}, ${p.size}) : ${qty} bouteille${qty>1?'s':''}`});
    return `Bonjour, je souhaite recevoir un prix et les conditions de livraison pour les produits Huilerie Hassan Ellouze.\n\nPRODUITS\n${lines.join('\n')}\n\nNom : ${d.get('nom').trim()}\nTéléphone : ${d.get('telephone').trim()}\nGouvernorat : ${(d.get('region')||'').trim()||'Non renseigné'}\nPrécisions : ${(d.get('details')||'').trim()||'Aucune'}\n\nMerci de me communiquer votre offre.`;
  }
  function buildQuoteMessage(form){
    const d=new FormData(form);
    const keys=[['Société / nom','societe'],['Téléphone','telephone'],['Activité','activite'],['Produit','produit'],['Quantité souhaitée','quantite'],['Gouvernorat','region'],['Précisions','message']];
    return 'Bonjour, je souhaite obtenir un devis professionnel auprès de Huilerie Hassan Ellouze.\n\n'+keys.map(([label,key])=>`${label} : ${(d.get(key)||'').trim()||'Non renseigné'}`).join('\n')+'\n\nMerci de me transmettre vos conditions commerciales.';
  }
  const isValid = form => {if(!form.checkValidity()){form.reportValidity();return false;}return true};
  $('year').textContent=new Date().getFullYear();
  renderProducts();updateCount();renderCart();
  document.querySelectorAll('[data-filter]').forEach(b=>b.addEventListener('click',()=>{document.querySelectorAll('[data-filter]').forEach(x=>x.classList.toggle('active',x===b));renderProducts(b.dataset.filter)}));
  $('cart-open').addEventListener('click',showCart);
  $('cart-close').addEventListener('click',closeCart);
  $('overlay').addEventListener('click',closeCart);
  $('empty-shopping').addEventListener('click',()=>{closeCart();$('collection').scrollIntoView({behavior:'smooth'})});
  $('cart-request').addEventListener('click',()=>{if(totalQty()===0)return;closeCart();resetModal();$('buyer-form').reset();showModal();});
  $('quote-form').addEventListener('submit',e=>{e.preventDefault();if(!isValid(e.currentTarget))return;resetModal({business:true});setPreview(buildQuoteMessage(e.currentTarget));showModal();});
  $('buyer-form').addEventListener('submit',e=>{e.preventDefault();if(!isValid(e.currentTarget))return;setPreview(buildCartMessage(e.currentTarget));});
  $('modal-close').addEventListener('click',closeModal);
  $('modal-backdrop').addEventListener('click',e=>{if(e.target===$('modal-backdrop'))closeModal()});
  $('copy-request').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(currentText);toast('Demande copiée !')}catch(_){const node=$('request-output');const selection=window.getSelection();const range=document.createRange();range.selectNodeContents(node);selection.removeAllRanges();selection.addRange(range);toast('Sélectionnez le texte puis copiez-le (Ctrl+C)');}});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeCart();closeModal()}});
  $('menu-toggle').addEventListener('click',()=>{const nav=$('mobile-nav');const next=nav.hidden;nav.hidden=!next;$('menu-toggle').setAttribute('aria-expanded',String(next))});
  $('mobile-nav').querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{$('mobile-nav').hidden=true;$('menu-toggle').setAttribute('aria-expanded','false')}));
})();