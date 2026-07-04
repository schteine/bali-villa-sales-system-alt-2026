let DATA=[];
let mode='investment';
let selected=[];
let filters={location:'', type:'', budget:'', status:'active', sort:'score'};
let cardUnit={};

const $=sel=>document.querySelector(sel);
const app=$('#app');
const tr=k=>window.I18N?I18N.t(k):k;
const fld=(item,k)=>window.I18N?I18N.field(item,k):(item[k]||'');
const statusLbl=s=>window.I18N?I18N.statusLabel(s):s;
const stageLbl=s=>window.I18N?I18N.stageLabel(s):s;
const ownLbl=s=>window.I18N?I18N.ownershipLabel(s):s;

function slug(s){return String(s||'').toLowerCase().replace(/[^a-z0-9а-яё]+/gi,'-').replace(/^-+|-+$/g,'');}
function photoPrefix(item){return item.PhotoPrefix || String(item.ID||'').split('-')[0];}
function projectImageCandidates(item){
  const prefix=photoPrefix(item), project=slug(item.Project), id=item.ID;
  return [
    `photos/projects/${prefix}.jpg`,
    `photos/projects/${project}.jpg`,
    `photos/${prefix}.jpg`,
    `photos/${prefix}-cover.jpg`,
    `photos/${prefix}-1.jpg`,
    `photos/${id}-1.jpg`
  ];
}
function unitImageCandidates(item,index=1){
  const prefix=photoPrefix(item), project=slug(item.Project), id=item.ID, br=String(item.Bedrooms||'').replace(/\.0$/,'');
  return [
    `photos/units/${id}-${index}.jpg`,
    `photos/${id}-${index}.jpg`,
    `photos/${id}.jpg`,
    `photos/units/${prefix}-${br}BR-${index}.jpg`,
    `photos/${prefix}-${br}BR-${index}.jpg`,
    `photos/projects/${prefix}-${index}.jpg`,
    `photos/projects/${project}-${index}.jpg`,
    `photos/${prefix}-${index}.jpg`
  ];
}
function imgTag(candidates, alt, cls=''){
  const uniq=[...new Set(candidates.filter(Boolean))];
  const first=uniq.shift()||'';
  return `<img class="${cls}" src="${first}" data-fallbacks="${escapeHtml(uniq.join('|'))}" loading="lazy" onerror="nextImage(this)" alt="${escapeHtml(alt||'Property photo')}" />`;
}
function nextImage(img){
  const list=(img.dataset.fallbacks||'').split('|').filter(Boolean);
  if(list.length){ img.dataset.fallbacks=list.slice(1).join('|'); img.src=list[0]; return; }
  img.style.display='none';
  const box=img.closest('.media,.galleryHero,.thumb');
  if(box) box.classList.add('imgMissing');
}

function galleryVisibleThumbs(block){
  return [...block.querySelectorAll('.thumb')].filter(t=>{
    const img=t.querySelector('img');
    return img && img.style.display!=='none' && img.src;
  });
}
function setGalleryImage(el){
  const block=el?.closest?.('.galleryBlock');
  if(!block) return;
  const img=el.querySelector('img');
  const hero=block.querySelector('.galleryHero img');
  if(!img || !hero || img.style.display==='none') return;
  hero.src=img.currentSrc || img.src;
  hero.dataset.fallbacks='';
  hero.alt=img.alt || 'Property photo';
  block.querySelectorAll('.thumb').forEach(t=>t.classList.remove('active'));
  el.classList.add('active');
}
function moveGallery(step){
  const block=document.querySelector('.galleryBlock');
  if(!block) return;
  const thumbs=galleryVisibleThumbs(block);
  if(!thumbs.length) return;
  let i=thumbs.findIndex(t=>t.classList.contains('active'));
  if(i<0) i=0;
  setGalleryImage(thumbs[(i+step+thumbs.length)%thumbs.length]);
}
function galleryIndex(block){
  const thumbs=galleryVisibleThumbs(block);
  const active=thumbs.findIndex(t=>t.classList.contains('active'));
  return {thumbs, index: active>=0?active:0};
}
function openGalleryLightbox(){
  const block=document.querySelector('.galleryBlock');
  if(!block) return;
  const {thumbs,index}=galleryIndex(block);
  if(!thumbs.length) return;
  const urls=thumbs.map(t=>{const img=t.querySelector('img'); return img.currentSrc || img.src;});
  window.__lightbox={urls,index};
  renderLightbox();
}
function renderLightbox(){
  const state=window.__lightbox;
  if(!state || !state.urls?.length) return;
  const url=state.urls[state.index];
  let lb=document.getElementById('galleryLightbox');
  if(!lb){
    lb=document.createElement('div');
    lb.id='galleryLightbox';
    document.body.appendChild(lb);
  }
  lb.innerHTML=`<div class="lightboxBackdrop" onclick="closeGalleryLightbox()"></div>
    <button class="lightboxClose" onclick="closeGalleryLightbox()" aria-label="Close">×</button>
    <button class="lightboxNav lightboxPrev" onclick="event.stopPropagation();moveLightbox(-1)" aria-label="Previous">‹</button>
    <img class="lightboxImg" src="${escapeHtml(url)}" alt="Property photo">
    <button class="lightboxNav lightboxNext" onclick="event.stopPropagation();moveLightbox(1)" aria-label="Next">›</button>
    <div class="lightboxCounter">${state.index+1} / ${state.urls.length}</div>`;
  lb.classList.add('open');
  document.body.classList.add('noScroll');
}
function moveLightbox(step){
  const state=window.__lightbox;
  if(!state || !state.urls?.length) return;
  state.index=(state.index+step+state.urls.length)%state.urls.length;
  renderLightbox();
}
function closeGalleryLightbox(){
  const lb=document.getElementById('galleryLightbox');
  if(lb) lb.classList.remove('open');
  document.body.classList.remove('noScroll');
}
function initGalleryInteractions(){
  const block=document.querySelector('.galleryBlock');
  if(!block) return;
  block.querySelectorAll('.thumb').forEach((thumb,i)=>{
    thumb.setAttribute('role','button');
    thumb.setAttribute('tabindex','0');
    thumb.onclick=(e)=>{e.preventDefault(); e.stopPropagation(); setGalleryImage(thumb);};
    thumb.onkeydown=(e)=>{if(e.key==='Enter'||e.key===' '){e.preventDefault(); setGalleryImage(thumb);}};
  });
  const hero=block.querySelector('.galleryHero');
  if(hero){
    hero.style.cursor='zoom-in';
    hero.onclick=(e)=>{
      if(e.target.closest('button')) return;
      openGalleryLightbox();
    };
  }
}
window.setGalleryImage=setGalleryImage;
window.moveGallery=moveGallery;
window.openGalleryLightbox=openGalleryLightbox;
window.closeGalleryLightbox=closeGalleryLightbox;
window.moveLightbox=moveLightbox;
window.addEventListener('keydown',e=>{
  const lb=document.getElementById('galleryLightbox');
  if(lb?.classList.contains('open')){
    if(e.key==='Escape') closeGalleryLightbox();
    if(e.key==='ArrowLeft') moveLightbox(-1);
    if(e.key==='ArrowRight') moveLightbox(1);
  }else if(document.querySelector('.galleryBlock')){
    if(e.key==='ArrowLeft') moveGallery(-1);
    if(e.key==='ArrowRight') moveGallery(1);
  }
});

function unique(arr){return [...new Set(arr.filter(Boolean))].sort();}
function idsFromUrl(){const p=new URLSearchParams(location.search).get('ids');return p?p.split(',').map(x=>x.trim()).filter(Boolean):[];}
function applyClientIds(list){const ids=idsFromUrl(); return ids.length?list.filter(x=>ids.includes(x.ID)):list;}
function groupKey(item){return `${item.Project}||${item.Location}`;}
function groupListings(list){
  const map=new Map();
  list.forEach(item=>{const k=groupKey(item); if(!map.has(k)) map.set(k,{key:k,project:item.Project,location:item.Location,items:[]}); map.get(k).items.push(item);});
  return [...map.values()].map(g=>{g.items.sort((a,b)=>(a.bedrooms||99)-(b.bedrooms||99)||(a.price||9e9)-(b.price||9e9)); return g;});
}
function selectedUnit(g){const id=cardUnit[g.key]; return g.items.find(x=>x.ID===id)||g.items[0];}
function projectStats(g){
  const prices=g.items.map(x=>x.price).filter(x=>!isNaN(x));
  const rois=g.items.map(x=>x.conservativeROI).filter(x=>!isNaN(x));
  const brs=unique(g.items.map(x=>isNaN(x.bedrooms)?'':String(x.bedrooms).replace('.0','')));
  return {minPrice:Math.min(...prices), maxPrice:Math.max(...prices), maxRoi:Math.max(...rois), brs};
}
function title(item, grouped=false){
  const rawType=(item.Type||'Object').toLowerCase();
  const type=(rawType==='apartment'||rawType.includes('апарт'))?(I18N?.lang()==='en'?'apartments':'апартаменты'):(I18N?.lang()==='en'?'villa':'вилла');
  if(grouped) return `${item.Project}`;
  const br=!isNaN(item.bedrooms)?`${item.bedrooms}BR `:'';
  return I18N?.lang()==='en'?`${br}${type} in ${item.Project}`:`${br}${type} в ${item.Project}`;
}
function setFiltersFromDom(){filters.location=$('#locationFilter').value;filters.type=$('#typeFilter').value;filters.budget=$('#budgetFilter').value;filters.status=$('#statusFilter').value;filters.sort=$('#sortSelect').value;}
function statusAllowed(item){const st=item.Status||'Available'; if(filters.status==='all') return true; if(filters.status==='archive') return ['Archive','Sold','Draft'].includes(st); if(filters.status==='active') return ['Available','Reserved'].includes(st); return st===filters.status;}
function filteredItems(){return applyClientIds(DATA).filter(x=> statusAllowed(x)&&(!filters.location||x.Location===filters.location)&&(!filters.type||x.Type===filters.type)&&(!filters.budget||x.price<=Number(filters.budget)));}
function filteredGroups(){
  let groups=groupListings(filteredItems());
  groups.sort((ga,gb)=>{
    const a=selectedUnit(ga), b=selectedUnit(gb); const sa=projectStats(ga), sb=projectStats(gb);
    if(filters.sort==='priceAsc') return (sa.minPrice||9e9)-(sb.minPrice||9e9);
    if(filters.sort==='roiDesc') return (sb.maxRoi||0)-(sa.maxRoi||0);
    if(filters.sort==='legalDesc') return (b.legalScore||0)-(a.legalScore||0);
    return computedInvestorScore(b)-computedInvestorScore(a);
  });
  return groups;
}
function modeText(item){
  if(mode==='lifestyle') return `${item.Location} · ${isNaN(item.land)?(I18N?.lang()==='en'?'land to clarify':'участок уточняется'):item.land+' m²'} · ${item.Bedrooms||'—'}BR`;
  if(mode==='mixed') return `${percent(item.conservativeROI)} ${tr('conservativeRoi')} · ${item.Location} · ${stageLbl(item.Stage)}`;
  return `${percent(item.conservativeROI)} ${tr('conservativeRoi')} · ${money(item.adrBase)} ADR · ${percent(item.occupancyBase)} ${tr('occupancy').replace(', %','').replace(', %','')}`;
}
function ownershipLine(item){return `${ownLbl(item.OwnershipType)}${item.LeaseYears?` · ${item.LeaseYears} years`:''}${item.Extension?` · ${item.Extension}`:''}`;}

function roiCopy(){
  const en=I18N?.lang&&I18N.lang()==='en';
  return {
    primary: en?'Checked ROI':'Наша оценка ROI',
    developer: en?'Developer':'Застройщик',
    stress: en?'Stress':'Стресс',
    checkedNote: en?'Risk-adjusted estimate based on ADR, occupancy, expenses, stage and location.':'Осторожная оценка после поправки на ADR, загрузку, расходы, стадию и локацию.',
    devNote: en?'Scenario stated in developer materials.':'Сценарий из материалов застройщика.',
    stressNote: en?'Downside case with lower ADR/occupancy and higher expenses.':'Сценарий с пониженным ADR/загрузкой и повышенными расходами.',
    raw: en?'Raw formula':'Сырая формула'
  };
}
function roiDisplayCard(item){
  const c=roiCopy();
  return `<div class="checkedRoiCard">
    <div class="checkedRoiMain"><span>${c.primary}</span><b>${percent(item.modelROI)}</b></div>
    <div class="checkedRoiSub"><span>${c.developer}: ${percent(item.developerROI)}</span><span>${c.stress}: ${percent(item.conservativeROI)}</span></div>
  </div>`;
}
function roiDisplayDetail(item){
  const c=roiCopy();
  return `<div class="roiExplainGrid">
    <div class="roiExplain checked"><span>${c.primary}</span><b>${percent(item.modelROI)}</b><em>${c.checkedNote}</em></div>
    <div class="roiExplain"><span>${c.developer}</span><b>${percent(item.developerROI)}</b><em>${c.devNote}</em></div>
    <div class="roiExplain stress"><span>${c.stress}</span><b>${percent(item.conservativeROI)}</b><em>${c.stressNote}</em></div>
  </div>`;
}
function unitButtons(g,current){
  if(g.items.length<=1) return '';
  return `<div class="unitPicker"><div class="unitTitle">${tr('unitOptions')}</div><div class="unitButtons">${g.items.map(u=>`<button class="unitBtn ${u.ID===current.ID?'on':''}" onclick="chooseCardUnit('${escapeHtml(g.key)}','${escapeHtml(u.ID)}')">${escapeHtml(u.Bedrooms||'—')}BR · ${money(u.price)}</button>`).join('')}</div></div>`;
}
function chooseCardUnit(key,id){cardUnit[key]=id; renderCatalog();}
function projectCard(g){
  const item=selectedUnit(g), stats=projectStats(g), sc=computedInvestorScore(item), checked=selected.includes(item.ID)?'checked':'';
  const brLine=stats.brs.length>1?`${stats.brs.join(' / ')}BR`:`${stats.brs[0]||item.Bedrooms||'—'}BR`;
  return `<article class="card projectCard">
    <div class="media" onclick="openDetail('${item.ID}')">
      ${imgTag(projectImageCandidates(item), item.Project)}
      <span class="badge">${escapeHtml(stageLbl(item.Stage||'Stage'))}</span>
      <span class="statusBadge ${escapeHtml(item.Status||'Available')}">${escapeHtml(statusLbl(item.Status||'Available'))}</span>
      <span class="badge right">★ ${sc}</span>
    </div>
    <div class="cardBody">
      <div class="loc">◎ ${escapeHtml(item.Location)} · ${escapeHtml(item.Type)} · ${escapeHtml(brLine)}</div>
      <div class="title" onclick="openDetail('${item.ID}')">${escapeHtml(title(item,true))}</div>
      <div class="price">${tr('fromPrice')} ${money(stats.minPrice)}</div>
      ${unitButtons(g,item)}
      <div class="chips compactChips">
        <span class="chip">${escapeHtml(ownLbl(item.OwnershipType||'Ownership'))}</span>
        <span class="chip">${escapeHtml(item.PaymentPlan||tr('paymentPlan'))}</span>
      </div>
      <div class="catalogMetaPill">${escapeHtml(modeText(item))}</div>
      ${roiDisplayCard(item)}
      <div class="catalogTeaser"><b>${tr('whyShort')}:</b> ${escapeHtml(fld(item,'WhyThisObject'))}</div>
      <div class="catalogFooter">
        <label class="checkLine compactCheck"><input type="checkbox" ${checked} onchange="toggleSelect('${item.ID}')" /> ${tr('addShortlist')}</label>
        <div class="actions compactActions"><button class="smallBtn" onclick="openDetail('${item.ID}')">${tr('card')}</button><button class="smallBtn" onclick="openMemo('${item.ID}')">${tr('memo')}</button></div>
      </div>
    </div>
  </article>`;
}
function renderCatalog(){
  setFiltersFromDom(); const groups=filteredGroups();
  $('#resultCount').textContent=`${tr('objects')}: ${groups.length} ${tr('from')} ${groupListings(applyClientIds(DATA)).length}`;
  app.innerHTML=groups.length?`<div class="grid">${groups.map(projectCard).join('')}</div>`:`<div class="panel">${tr('nothingFound')}</div>`;
  renderCompareBar();
}
function fillFilters(){
  const loc=$('#locationFilter'), type=$('#typeFilter'); loc.innerHTML=`<option value="">${tr('all')}</option>`; type.innerHTML=`<option value="">${tr('all')}</option>`;
  unique(DATA.map(x=>x.Location)).forEach(v=>loc.insertAdjacentHTML('beforeend',`<option>${escapeHtml(v)}</option>`));
  unique(DATA.map(x=>x.Type)).forEach(v=>type.insertAdjacentHTML('beforeend',`<option>${escapeHtml(v)}</option>`));
}
function renderCompareBar(){const bar=$('#compareBar'); if(selected.length>=2 && !location.hash.startsWith('#compare')){$('#compareCount').textContent=`${I18N?.lang()==='en'?'Selected':'Выбрано'}: ${selected.length}`;bar.classList.remove('hidden');}else bar.classList.add('hidden');}
function toggleSelect(id){const max=(window.APP_CONFIG&&window.APP_CONFIG.MAX_SHORTLIST)||5; if(selected.includes(id)) selected=selected.filter(x=>x!==id); else{if(selected.length>=max){alert(`Максимум ${max} объектов`);return renderCatalog();} selected.push(id);} renderCatalog();}
function createShortlistLink(){if(!selected.length){alert(I18N?.lang()==='en'?'Choose 2–5 objects first':'Сначала выбери 2–5 объектов');return;} const url=new URL(location.href); url.hash=''; url.searchParams.set('ids', selected.join(',')); const panel=$('#shortlistPanel'); panel.classList.remove('hidden'); panel.innerHTML=`<b>${tr('clientLinkReady')}</b><div class="note" style="color:#ccc">${tr('clientLinkNote')}</div><input readonly value="${escapeHtml(url.toString())}" onclick="this.select()" />`; navigator.clipboard?.writeText(url.toString()).catch(()=>{});}
function clearCompare(){selected=[]; renderCatalog();} function goCompare(){location.hash='compare/'+selected.join(',');} function openDetail(id){location.hash='o/'+encodeURIComponent(id);} function openMemo(id){location.hash='memo/'+encodeURIComponent(id);} function backCatalog(){location.hash='';}
function getItem(id){return DATA.find(x=>x.ID===id);} function getProjectItems(item){return DATA.filter(x=>x.Project===item.Project&&x.Location===item.Location).sort((a,b)=>(a.bedrooms||99)-(b.bedrooms||99));}
function detailFacts(item){return [[money(item.price),tr('price')],[isNaN(item.pricePerSqm)?'—':money(item.pricePerSqm),tr('pricePerSqm')],[item.Bedrooms||'—',tr('bedrooms')],[isNaN(item.build)?'—':item.build+' m²',tr('area')],[isNaN(item.land)?'—':item.land+' m²',tr('land')],[stageLbl(item.Stage)||'—',tr('stage')],[item.CompletionDate||'—',tr('completion')],[item.PaymentPlan||'—',tr('paymentPlan')]];}
function detailUnitSwitch(item){const units=getProjectItems(item); if(units.length<=1)return ''; return `<div class="detailUnitSwitch no-print"><b>${tr('unitOptions')}</b>${units.map(u=>`<button class="unitBtn ${u.ID===item.ID?'on':''}" onclick="openDetail('${u.ID}')">${u.Bedrooms}BR · ${money(u.price)}</button>`).join('')}</div>`;}
function renderDetail(id){const item=getItem(id); if(!item){backCatalog(); return;} app.innerHTML=`<section class="detail">
  <div class="actions no-print" style="margin-bottom:12px"><button class="smallBtn" onclick="backCatalog()">${tr('backCatalog')}</button><button class="smallBtn" onclick="openMemo('${item.ID}')">${tr('memo')}</button><button class="smallBtn" onclick="window.print()">${tr('printPdf')}</button>${item.PresentationURL?`<a class="smallBtn" href="${escapeHtml(item.PresentationURL)}" target="_blank">${tr('presentation')}</a>`:''}</div>
  ${detailUnitSwitch(item)}
  <div class="detailHero"><div class="galleryBlock"><div class="galleryHero"><button class="galleryNav galleryPrev no-print" onclick="moveGallery(-1)" aria-label="Previous photo">‹</button>${imgTag(unitImageCandidates(item,1), title(item))}<button class="galleryNav galleryNext no-print" onclick="moveGallery(1)" aria-label="Next photo">›</button></div><div class="thumbRow">${[1,2,3,4,5,6].map(i=>`<div class="thumb ${i===1?'active':''}" onclick="setGalleryImage(this)">${imgTag(unitImageCandidates(item,i), `${title(item)} photo ${i}`)}</div>`).join('')}</div></div><div class="detailHead panel"><div class="loc">${escapeHtml(item.Location)} · ${escapeHtml(item.Type)}</div><h1>${escapeHtml(title(item))}</h1><div class="detailPrice">${money(item.price)}</div><div class="chips" style="margin:10px 0"><span class="chip">★ ${tr('investorScore')} ${computedInvestorScore(item)}</span><span class="chip">${tr('legal')} ${item.LegalScore||'—'}</span><span class="chip">${escapeHtml(ownLbl(item.OwnershipType||'Ownership'))}</span></div>${roiDisplayDetail(item)}</div></div>
  <h3 class="sectionTitle">${tr('keyParams')}</h3><div class="factGrid">${detailFacts(item).map(f=>`<div class="fact"><b>${escapeHtml(f[0])}</b><span>${escapeHtml(f[1])}</span></div>`).join('')}</div>
  <h3 class="sectionTitle">${tr('conclusion')}</h3><div class="twoCols"><div class="textBox good"><b>${tr('why')}</b><p>${escapeHtml(fld(item,'WhyThisObject'))}</p></div><div class="textBox"><b>${tr('fits')}</b><p>${escapeHtml(fld(item,'FitsClient'))}</p></div></div>
  <h3 class="sectionTitle">${tr('ownershipStructure')}</h3><div class="textBox"><b>${escapeHtml(item.OwnershipDetail||ownLbl(item.OwnershipType))}</b><p>${escapeHtml(I18N.ownershipNote(item))}</p></div>
  <h3 class="sectionTitle">${tr('redFlags')}</h3><div class="textBox warn">${escapeHtml(fld(item,'RedFlags'))}</div>
  <h3 class="sectionTitle">${tr('salesNote')}</h3><div class="textBox">${escapeHtml(fld(item,'SalesNote'))}</div>
</section>`; initGalleryInteractions(); renderCompareBar();}
function renderCompare(ids){const items=ids.map(getItem).filter(Boolean); if(items.length<2){backCatalog();return;} const rows=[ [tr('price'),x=>money(x.price),'min',x=>x.price], [tr('pricePerSqm'),x=>isNaN(x.pricePerSqm)?'—':money(x.pricePerSqm),'min',x=>x.pricePerSqm], [tr('developerRoi'),x=>percent(x.developerROI),'max',x=>x.developerROI], [tr('modelRoi'),x=>percent(x.modelROI),'max',x=>x.modelROI], [tr('conservativeRoi'),x=>percent(x.conservativeROI),'max',x=>x.conservativeROI], [tr('investorScore'),x=>computedInvestorScore(x),'max',x=>computedInvestorScore(x)], [tr('legal'),x=>x.LegalScore||'—','max',x=>num(x.LegalScore)], [tr('ownership'),x=>ownershipLine(x),'',x=>NaN], [tr('completion'),x=>x.CompletionDate||stageLbl(x.Stage),'',x=>NaN], [tr('why'),x=>fld(x,'WhyThisObject'),'',x=>NaN], [tr('redFlags'),x=>fld(x,'RedFlags'),'',x=>NaN] ]; const bestIndex=(row)=>{const vals=items.map(row[4]);let bi=-1,bv=null;vals.forEach((v,i)=>{if(isNaN(v))return;if(bv===null||(row[2]==='max'?v>bv:v<bv)){bv=v;bi=i;}});return bi;}; app.innerHTML=`<section class="panel"><div class="actions no-print" style="margin-bottom:12px"><button class="smallBtn" onclick="backCatalog()">${tr('backCatalog')}</button><button class="smallBtn" onclick="window.print()">${tr('printPdf')}</button></div><h2>${tr('compare')}</h2><div class="tableBox"><table><tr><th></th>${items.map(x=>`<th>${escapeHtml(x.Project)}<br><span class="note">${escapeHtml(x.Location)} · ${escapeHtml(x.Bedrooms)}BR</span></th>`).join('')}</tr>${rows.map(row=>{const bi=bestIndex(row);return `<tr><th>${row[0]}</th>${items.map((x,i)=>`<td class="${i===bi?'best':''}">${escapeHtml(row[1](x))}</td>`).join('')}</tr>`}).join('')}</table></div></section>`; initGalleryInteractions(); renderCompareBar();}
function renderMemo(id){const item=getItem(id); if(!item){backCatalog();return;} app.innerHTML=`<section class="memo panel"><div class="actions no-print" style="margin-bottom:12px"><button class="smallBtn" onclick="renderDetail('${item.ID}')">← ${tr('card')}</button><button class="smallBtn" onclick="window.print()">${tr('downloadPdf')}</button></div><div class="memoHeader"><div><h1>${escapeHtml(item.Project)} · ${escapeHtml(item.Bedrooms||'')}BR</h1><div class="note">${escapeHtml(item.Location)} · ${escapeHtml(item.Type)} · ID ${escapeHtml(item.ID)}</div></div><div class="memoPrice">${money(item.price)}</div></div><h3 class="sectionTitle">${tr('investmentSnapshot')}</h3><div class="factGrid">${detailFacts(item).map(f=>`<div class="fact"><b>${escapeHtml(f[0])}</b><span>${escapeHtml(f[1])}</span></div>`).join('')}</div><h3 class="sectionTitle">${tr('roiScenarios')}</h3><div class="factGrid"><div class="fact"><b>${percent(item.modelROI)}</b><span>${I18N.lang()==='en'?'Checked ROI':'Наша оценка ROI'}</span></div><div class="fact"><b>${percent(item.developerROI)}</b><span>${tr('developerRoi')}</span></div><div class="fact"><b>${percent(item.conservativeROI)}</b><span>${tr('conservativeRoi')}</span></div><div class="fact"><b>${escapeHtml(item.ROISource||'—')}</b><span>${tr('roiSource')}</span></div></div><h3 class="sectionTitle">${tr('why')}</h3><div class="textBox good">${escapeHtml(fld(item,'WhyThisObject'))}</div><h3 class="sectionTitle">${tr('fits')}</h3><div class="textBox">${escapeHtml(fld(item,'FitsClient'))}</div><h3 class="sectionTitle">${tr('ownershipStructure')}</h3><div class="textBox"><b>${escapeHtml(item.OwnershipDetail||ownLbl(item.OwnershipType))}</b><p>${escapeHtml(I18N.ownershipNote(item))}</p></div><h3 class="sectionTitle">${tr('redFlags')}</h3><div class="textBox warn">${escapeHtml(fld(item,'RedFlags'))}</div><h3 class="sectionTitle">${tr('nextStep')}</h3><div class="textBox">${I18N.lang()==='en'?'Confirm availability, request the legal package, check reservation terms and prepare the DD checklist before deposit.':'Подтвердить наличие, запросить юридический пакет, проверить условия брони и подготовить DD checklist до депозита.'}</div><div class="memoFooter">${I18N.lang()==='en'?'Not a public offer or investment advice. Figures must be verified before transaction.':'Не является публичной офертой или инвестиционной рекомендацией. Цифры нужно проверить до сделки.'} ${escapeHtml(item.UpdatedAt||'—')}</div></section>`;}


/* v17 premium deal-room redesign */
function v17Copy(){
  const en=I18N?.lang&&I18N.lang()==='en';
  return {
    curated: en?'Curated private selection':'Кураторская подборка',
    title: en?'Private Bali investment deals':'Private Bali investment deals',
    subtitle: en?'Six curated villas for the first review. Three more are intentionally blurred until the shortlist is refined.':'6 отобранных объектов для первого просмотра. Ещё 3 — в мягком блюре, чтобы не перегружать клиента.',
    checked: en?'Checked ROI':'Наша оценка ROI',
    developer: en?'Developer':'Застройщик',
    stress: en?'Stress':'Стресс',
    view: en?'View deal':'Смотреть объект',
    memo: en?'Investment memo':'Investment memo',
    request: en?'Get selection':'Получить подборку',
    from: en?'from':'от',
    hidden: en?'Additional deal':'Дополнительный объект',
    hiddenNote: en?'Available in the next shortlist step':'Откроем после уточнения подборки',
    thesis: en?'Investment thesis':'Инвестиционная логика',
    dealRoom: en?'Deal room':'Deal room',
    legalRisk: en?'Legal & risks':'Юридика и риски',
    facts: en?'Deal facts':'Параметры сделки',
    units: en?'Unit options':'Варианты юнитов',
    selection: en?'add to client shortlist':'добавить в подборку'
  };
}
function unitCountLine(g){
  const brs=projectStats(g).brs.filter(Boolean);
  const u=g.items.length;
  return `${brs.join(' / ')||'—'}BR · ${u} ${I18N?.lang&&I18N.lang()==='en'?(u===1?'unit':'units'):(u===1?'юнит':'юнитов')}`;
}
function checkedStats(g){
  const xs=g.items.map(x=>x.modelROI).filter(x=>!isNaN(x));
  return xs.length?Math.max(...xs):NaN;
}
function premiumRoiBlock(item){
  const c=v17Copy();
  return `<div class="premiumRoi">
    <div><span>${c.checked}</span><b>${percent(item.modelROI)}</b></div>
    <p>${c.developer}: ${percent(item.developerROI)} · ${c.stress}: ${percent(item.conservativeROI)}</p>
  </div>`;
}
function premiumUnitChips(g,current){
  if(g.items.length<=1) return '';
  return `<div class="premiumUnits" aria-label="${escapeHtml(v17Copy().units)}">${g.items.map(u=>`<button class="premiumUnit ${u.ID===current.ID?'on':''}" onclick="chooseCardUnit('${escapeHtml(g.key)}','${escapeHtml(u.ID)}')">${escapeHtml(u.Bedrooms||'—')}BR <span>${money(u.price)}</span></button>`).join('')}</div>`;
}
function projectCard(g, opts={}){
  const item=selectedUnit(g), stats=projectStats(g), sc=computedInvestorScore(item), checked=selected.includes(item.ID)?'checked':'';
  const c=v17Copy();
  const locked=opts.locked;
  return `<article class="premiumDealCard ${locked?'isLocked':''}" style="--delay:${opts.index||0}">
    <div class="premiumMedia" onclick="${locked?'':`openDetail('${item.ID}')`}">
      ${imgTag(projectImageCandidates(item), item.Project)}
      <div class="mediaShade"></div>
      <span class="premiumStage">${escapeHtml(stageLbl(item.Stage||'Stage'))}</span>
      <span class="premiumScore">★ ${sc}</span>
      ${locked?`<div class="lockedOverlay"><b>${c.hidden}</b><span>${c.hiddenNote}</span></div>`:''}
    </div>
    <div class="premiumBody">
      <div class="premiumKicker">${escapeHtml(item.Location)} · ${escapeHtml(item.Type)} · ${escapeHtml(unitCountLine(g))}</div>
      <div class="premiumTitle" onclick="${locked?'':`openDetail('${item.ID}')`}">${escapeHtml(item.Project)}</div>
      <div class="premiumPrice">${c.from} ${money(stats.minPrice)}</div>
      ${premiumUnitChips(g,item)}
      <div class="premiumMeta"><span>${escapeHtml(ownLbl(item.OwnershipType||'Ownership'))}</span><span>${escapeHtml(item.PaymentPlan||tr('paymentPlan'))}</span></div>
      ${premiumRoiBlock(item)}
      <p class="premiumThesis">${escapeHtml(fld(item,'WhyThisObject'))}</p>
      <div class="premiumActions">
        <label class="premiumCheck"><input type="checkbox" ${checked} onchange="toggleSelect('${item.ID}')" ${locked?'disabled':''}> ${c.selection}</label>
        <button class="premiumBtn" onclick="openDetail('${item.ID}')" ${locked?'disabled':''}>${c.view}</button>
        <button class="premiumBtn ghostBtn" onclick="openMemo('${item.ID}')" ${locked?'disabled':''}>${c.memo}</button>
      </div>
    </div>
  </article>`;
}
function renderCatalog(){
  setFiltersFromDom();
  const groups=filteredGroups();
  const allCount=groupListings(applyClientIds(DATA)).length;
  $('#resultCount').textContent=`${tr('objects')}: ${groups.length} ${tr('from')} ${allCount}`;
  if(!groups.length){ app.innerHTML=`<div class="panel premiumEmpty">${tr('nothingFound')}</div>`; renderCompareBar(); return; }
  const visible=groups.slice(0,6);
  const blurred=groups.slice(6,9);
  app.innerHTML=`<section class="premiumIntro">
      <div><span>${v17Copy().curated}</span><h2>${v17Copy().title}</h2><p>${v17Copy().subtitle}</p></div>
      <button class="premiumCta" onclick="createShortlistLink()">${v17Copy().request}</button>
    </section>
    <div class="premiumGrid">${visible.map((g,i)=>projectCard(g,{index:i})).join('')}</div>
    ${blurred.length?`<div class="premiumGrid premiumBlurGrid">${blurred.map((g,i)=>projectCard(g,{index:i+6,locked:true})).join('')}</div>`:''}`;
  renderCompareBar();
}
function renderDetail(id){
  const item=getItem(id); if(!item){backCatalog(); return;}
  const c=v17Copy();
  app.innerHTML=`<section class="dealRoom">
    <div class="dealNav no-print"><button class="premiumBtn" onclick="backCatalog()">${tr('backCatalog')}</button><button class="premiumBtn ghostBtn" onclick="openMemo('${item.ID}')">${tr('memo')}</button><button class="premiumBtn ghostBtn" onclick="window.print()">${tr('printPdf')}</button>${item.PresentationURL?`<a class="premiumBtn ghostBtn" href="${escapeHtml(item.PresentationURL)}" target="_blank">${tr('presentation')}</a>`:''}</div>
    ${detailUnitSwitch(item)}
    <div class="dealHero">
      <div class="galleryBlock premiumGallery"><div class="galleryHero"><button class="galleryNav galleryPrev no-print" onclick="moveGallery(-1)" aria-label="Previous photo">‹</button>${imgTag(unitImageCandidates(item,1), title(item))}<button class="galleryNav galleryNext no-print" onclick="moveGallery(1)" aria-label="Next photo">›</button></div><div class="thumbRow">${[1,2,3,4,5,6].map(i=>`<div class="thumb ${i===1?'active':''}" onclick="setGalleryImage(this)">${imgTag(unitImageCandidates(item,i), `${title(item)} photo ${i}`)}</div>`).join('')}</div></div>
      <aside class="dealSummary">
        <span class="dealEyebrow">${c.dealRoom}</span>
        <h1>${escapeHtml(title(item))}</h1>
        <div class="dealLocation">${escapeHtml(item.Location)} · ${escapeHtml(item.Type)} · ${escapeHtml(ownLbl(item.OwnershipType||'Ownership'))}</div>
        <div class="dealPrice">${money(item.price)}</div>
        ${roiDisplayDetail(item)}
        <button class="premiumCta wide" onclick="createShortlistLink()">${c.request}</button>
      </aside>
    </div>
    <h3 class="sectionTitle">${c.facts}</h3><div class="factGrid premiumFacts">${detailFacts(item).map(f=>`<div class="fact"><b>${escapeHtml(f[0])}</b><span>${escapeHtml(f[1])}</span></div>`).join('')}</div>
    <div class="dealSections"><div><h3 class="sectionTitle">${c.thesis}</h3><div class="textBox good"><p>${escapeHtml(fld(item,'WhyThisObject'))}</p></div></div><div><h3 class="sectionTitle">${tr('fits')}</h3><div class="textBox"><p>${escapeHtml(fld(item,'FitsClient'))}</p></div></div></div>
    <h3 class="sectionTitle">${c.legalRisk}</h3><div class="dealSections"><div class="textBox"><b>${escapeHtml(item.OwnershipDetail||ownLbl(item.OwnershipType))}</b><p>${escapeHtml(I18N.ownershipNote(item))}</p></div><div class="textBox warn"><b>${tr('redFlags')}</b><p>${escapeHtml(fld(item,'RedFlags'))}</p></div></div>
    <h3 class="sectionTitle">${tr('salesNote')}</h3><div class="textBox">${escapeHtml(fld(item,'SalesNote'))}</div>
  </section>`;
  initGalleryInteractions(); renderCompareBar();
}

function route(){const h=decodeURIComponent(location.hash.replace(/^#/,'')); if(h.startsWith('o/'))return renderDetail(h.slice(2)); if(h.startsWith('compare/'))return renderCompare(h.slice(8).split(',')); if(h.startsWith('memo/'))return renderMemo(h.slice(5)); renderCatalog();}
async function init(){DATA=await loadListings(); fillFilters(); const ids=idsFromUrl(); if(ids.length){selected=ids.filter(id=>DATA.some(x=>x.ID===id));} $('#contactBtn').href=(window.APP_CONFIG&&window.APP_CONFIG.CONTACT_URL)||'#'; document.querySelectorAll('.modeSwitch button').forEach(btn=>btn.addEventListener('click',()=>{document.querySelectorAll('.modeSwitch button').forEach(b=>b.classList.remove('on')); btn.classList.add('on'); mode=btn.dataset.mode; renderCatalog();})); ['#locationFilter','#typeFilter','#budgetFilter','#statusFilter','#sortSelect'].forEach(s=>$(s).addEventListener('change',renderCatalog)); $('#resetBtn').addEventListener('click',()=>{['#locationFilter','#typeFilter','#budgetFilter'].forEach(s=>$(s).value=''); $('#statusFilter').value='active'; $('#sortSelect').value='score'; renderCatalog();}); $('#createShortlistBtn').addEventListener('click',createShortlistLink); $('#compareBtn').addEventListener('click',goCompare); $('#clearCompareBtn').addEventListener('click',clearCompare); window.addEventListener('hashchange',route); window.onLanguageChange=()=>{I18N.translateStatic(); fillFilters(); route();}; route();}
init().catch(e=>{app.innerHTML=`<div class="panel">Ошибка загрузки данных: ${escapeHtml(e.message)}</div>`;});
