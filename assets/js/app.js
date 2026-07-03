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
      <div class="roiRow compactRoi">
        <div class="roiBox"><b>${percent(item.developerROI)}</b><span>Dev</span></div>
        <div class="roiBox"><b>${percent(item.modelROI)}</b><span>Model</span></div>
        <div class="roiBox"><b>${percent(item.conservativeROI)}</b><span>Cons.</span></div>
      </div>
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
  <div class="detailHero"><div class="galleryBlock"><div class="galleryHero">${imgTag(unitImageCandidates(item,1), title(item))}</div><div class="thumbRow">${[1,2,3,4].map(i=>`<div class="thumb">${imgTag(unitImageCandidates(item,i), `${title(item)} photo ${i}`)}</div>`).join('')}</div></div><div class="detailHead panel"><div class="loc">${escapeHtml(item.Location)} · ${escapeHtml(item.Type)}</div><h1>${escapeHtml(title(item))}</h1><div class="detailPrice">${money(item.price)}</div><div class="chips" style="margin:10px 0"><span class="chip">★ ${tr('investorScore')} ${computedInvestorScore(item)}</span><span class="chip">${tr('legal')} ${item.LegalScore||'—'}</span><span class="chip">${escapeHtml(ownLbl(item.OwnershipType||'Ownership'))}</span></div><div class="roiRow"><div class="roiBox"><b>${percent(item.developerROI)}</b><span>${tr('developerRoi')}</span></div><div class="roiBox"><b>${percent(item.modelROI)}</b><span>${tr('modelRoi')}</span></div><div class="roiBox"><b>${percent(item.conservativeROI)}</b><span>${tr('conservativeRoi')}</span></div></div></div></div>
  <h3 class="sectionTitle">${tr('keyParams')}</h3><div class="factGrid">${detailFacts(item).map(f=>`<div class="fact"><b>${escapeHtml(f[0])}</b><span>${escapeHtml(f[1])}</span></div>`).join('')}</div>
  <h3 class="sectionTitle">${tr('conclusion')}</h3><div class="twoCols"><div class="textBox good"><b>${tr('why')}</b><p>${escapeHtml(fld(item,'WhyThisObject'))}</p></div><div class="textBox"><b>${tr('fits')}</b><p>${escapeHtml(fld(item,'FitsClient'))}</p></div></div>
  <h3 class="sectionTitle">${tr('ownershipStructure')}</h3><div class="textBox"><b>${escapeHtml(item.OwnershipDetail||ownLbl(item.OwnershipType))}</b><p>${escapeHtml(I18N.ownershipNote(item))}</p></div>
  <h3 class="sectionTitle">${tr('redFlags')}</h3><div class="textBox warn">${escapeHtml(fld(item,'RedFlags'))}</div>
  <h3 class="sectionTitle">${tr('salesNote')}</h3><div class="textBox">${escapeHtml(fld(item,'SalesNote'))}</div>
</section>`; renderCompareBar();}
function renderCompare(ids){const items=ids.map(getItem).filter(Boolean); if(items.length<2){backCatalog();return;} const rows=[ [tr('price'),x=>money(x.price),'min',x=>x.price], [tr('pricePerSqm'),x=>isNaN(x.pricePerSqm)?'—':money(x.pricePerSqm),'min',x=>x.pricePerSqm], [tr('developerRoi'),x=>percent(x.developerROI),'max',x=>x.developerROI], [tr('modelRoi'),x=>percent(x.modelROI),'max',x=>x.modelROI], [tr('conservativeRoi'),x=>percent(x.conservativeROI),'max',x=>x.conservativeROI], [tr('investorScore'),x=>computedInvestorScore(x),'max',x=>computedInvestorScore(x)], [tr('legal'),x=>x.LegalScore||'—','max',x=>num(x.LegalScore)], [tr('ownership'),x=>ownershipLine(x),'',x=>NaN], [tr('completion'),x=>x.CompletionDate||stageLbl(x.Stage),'',x=>NaN], [tr('why'),x=>fld(x,'WhyThisObject'),'',x=>NaN], [tr('redFlags'),x=>fld(x,'RedFlags'),'',x=>NaN] ]; const bestIndex=(row)=>{const vals=items.map(row[4]);let bi=-1,bv=null;vals.forEach((v,i)=>{if(isNaN(v))return;if(bv===null||(row[2]==='max'?v>bv:v<bv)){bv=v;bi=i;}});return bi;}; app.innerHTML=`<section class="panel"><div class="actions no-print" style="margin-bottom:12px"><button class="smallBtn" onclick="backCatalog()">${tr('backCatalog')}</button><button class="smallBtn" onclick="window.print()">${tr('printPdf')}</button></div><h2>${tr('compare')}</h2><div class="tableBox"><table><tr><th></th>${items.map(x=>`<th>${escapeHtml(x.Project)}<br><span class="note">${escapeHtml(x.Location)} · ${escapeHtml(x.Bedrooms)}BR</span></th>`).join('')}</tr>${rows.map(row=>{const bi=bestIndex(row);return `<tr><th>${row[0]}</th>${items.map((x,i)=>`<td class="${i===bi?'best':''}">${escapeHtml(row[1](x))}</td>`).join('')}</tr>`}).join('')}</table></div></section>`; renderCompareBar();}
function renderMemo(id){const item=getItem(id); if(!item){backCatalog();return;} app.innerHTML=`<section class="memo panel"><div class="actions no-print" style="margin-bottom:12px"><button class="smallBtn" onclick="renderDetail('${item.ID}')">← ${tr('card')}</button><button class="smallBtn" onclick="window.print()">${tr('downloadPdf')}</button></div><div class="memoHeader"><div><h1>${escapeHtml(item.Project)} · ${escapeHtml(item.Bedrooms||'')}BR</h1><div class="note">${escapeHtml(item.Location)} · ${escapeHtml(item.Type)} · ID ${escapeHtml(item.ID)}</div></div><div class="memoPrice">${money(item.price)}</div></div><h3 class="sectionTitle">${tr('investmentSnapshot')}</h3><div class="factGrid">${detailFacts(item).map(f=>`<div class="fact"><b>${escapeHtml(f[0])}</b><span>${escapeHtml(f[1])}</span></div>`).join('')}</div><h3 class="sectionTitle">${tr('roiScenarios')}</h3><div class="factGrid"><div class="fact"><b>${percent(item.developerROI)}</b><span>${tr('developerRoi')}</span></div><div class="fact"><b>${percent(item.modelROI)}</b><span>${tr('modelRoi')}</span></div><div class="fact"><b>${percent(item.conservativeROI)}</b><span>${tr('conservativeRoi')}</span></div><div class="fact"><b>${escapeHtml(item.ROISource||'—')}</b><span>${tr('roiSource')}</span></div></div><h3 class="sectionTitle">${tr('why')}</h3><div class="textBox good">${escapeHtml(fld(item,'WhyThisObject'))}</div><h3 class="sectionTitle">${tr('fits')}</h3><div class="textBox">${escapeHtml(fld(item,'FitsClient'))}</div><h3 class="sectionTitle">${tr('ownershipStructure')}</h3><div class="textBox"><b>${escapeHtml(item.OwnershipDetail||ownLbl(item.OwnershipType))}</b><p>${escapeHtml(I18N.ownershipNote(item))}</p></div><h3 class="sectionTitle">${tr('redFlags')}</h3><div class="textBox warn">${escapeHtml(fld(item,'RedFlags'))}</div><h3 class="sectionTitle">${tr('nextStep')}</h3><div class="textBox">${I18N.lang()==='en'?'Confirm availability, request the legal package, check reservation terms and prepare the DD checklist before deposit.':'Подтвердить наличие, запросить юридический пакет, проверить условия брони и подготовить DD checklist до депозита.'}</div><div class="memoFooter">${I18N.lang()==='en'?'Not a public offer or investment advice. Figures must be verified before transaction.':'Не является публичной офертой или инвестиционной рекомендацией. Цифры нужно проверить до сделки.'} ${escapeHtml(item.UpdatedAt||'—')}</div></section>`;}
function route(){const h=decodeURIComponent(location.hash.replace(/^#/,'')); if(h.startsWith('o/'))return renderDetail(h.slice(2)); if(h.startsWith('compare/'))return renderCompare(h.slice(8).split(',')); if(h.startsWith('memo/'))return renderMemo(h.slice(5)); renderCatalog();}
async function init(){DATA=await loadListings(); fillFilters(); const ids=idsFromUrl(); if(ids.length){selected=ids.filter(id=>DATA.some(x=>x.ID===id));} $('#contactBtn').href=(window.APP_CONFIG&&window.APP_CONFIG.CONTACT_URL)||'#'; document.querySelectorAll('.modeSwitch button').forEach(btn=>btn.addEventListener('click',()=>{document.querySelectorAll('.modeSwitch button').forEach(b=>b.classList.remove('on')); btn.classList.add('on'); mode=btn.dataset.mode; renderCatalog();})); ['#locationFilter','#typeFilter','#budgetFilter','#statusFilter','#sortSelect'].forEach(s=>$(s).addEventListener('change',renderCatalog)); $('#resetBtn').addEventListener('click',()=>{['#locationFilter','#typeFilter','#budgetFilter'].forEach(s=>$(s).value=''); $('#statusFilter').value='active'; $('#sortSelect').value='score'; renderCatalog();}); $('#createShortlistBtn').addEventListener('click',createShortlistLink); $('#compareBtn').addEventListener('click',goCompare); $('#clearCompareBtn').addEventListener('click',clearCompare); window.addEventListener('hashchange',route); window.onLanguageChange=()=>{I18N.translateStatic(); fillFilters(); route();}; route();}
init().catch(e=>{app.innerHTML=`<div class="panel">Ошибка загрузки данных: ${escapeHtml(e.message)}</div>`;});
