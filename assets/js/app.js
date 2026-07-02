let DATA=[];
let mode='investment';
let selected=[];
let filters={location:'', type:'', budget:'', sort:'score'};

const $=sel=>document.querySelector(sel);
const app=$('#app');

function photoUrl(item, index=1){
  const prefix=item.PhotoPrefix || String(item.ID||'').split('-')[0];
  return `photos/${prefix}-${index}.jpg`;
}

function title(item){
  const type=(item.Type||'Object').toLowerCase()==='apartment'?'апартаменты':'вилла';
  const br=!isNaN(item.bedrooms)?`${item.bedrooms}BR `:'';
  return `${br}${type} в ${item.Project}`;
}

function unique(arr){return [...new Set(arr.filter(Boolean))].sort();}

function idsFromUrl(){
  const p=new URLSearchParams(location.search).get('ids');
  return p?p.split(',').map(x=>x.trim()).filter(Boolean):[];
}

function applyClientIds(list){
  const ids=idsFromUrl();
  if(!ids.length) return list;
  return list.filter(x=>ids.includes(x.ID));
}

function setFiltersFromDom(){
  filters.location=$('#locationFilter').value;
  filters.type=$('#typeFilter').value;
  filters.budget=$('#budgetFilter').value;
  filters.sort=$('#sortSelect').value;
}

function filteredData(){
  let list=applyClientIds(DATA).filter(x=>
    (!filters.location||x.Location===filters.location) &&
    (!filters.type||x.Type===filters.type) &&
    (!filters.budget||x.price<=Number(filters.budget))
  );
  list.sort((a,b)=>{
    if(filters.sort==='priceAsc') return (a.price||9e9)-(b.price||9e9);
    if(filters.sort==='roiDesc') return (b.conservativeROI||0)-(a.conservativeROI||0);
    if(filters.sort==='legalDesc') return (b.legalScore||0)-(a.legalScore||0);
    return computedInvestorScore(b)-computedInvestorScore(a);
  });
  return list;
}

function modeText(item){
  if(mode==='lifestyle'){
    return `${item.Location} · ${isNaN(item.land)?'участок уточняется':item.land+' м² земли'} · ${item.Bedrooms||'—'} спальни`;
  }
  if(mode==='mixed'){
    return `${percent(item.conservativeROI)} conservative ROI · ${item.Location} · ${item.Stage}`;
  }
  return `${percent(item.conservativeROI)} conservative ROI · ${money(item.adrBase)} ADR · ${percent(item.occupancyBase)} загрузка`;
}

function ownershipLine(item){
  const type=item.OwnershipType||'Ownership to clarify';
  const note=item.OwnershipNote||'';
  return `${type}${item.LeaseYears?` · ${item.LeaseYears} years`:''}${note?` — ${note}`:''}`;
}

function card(item){
  const sc=computedInvestorScore(item);
  const checked=selected.includes(item.ID)?'checked':'';
  return `<article class="card">
    <div class="media" onclick="openDetail('${item.ID}')">
      <img src="${photoUrl(item,1)}" loading="lazy" onerror="this.style.display='none'" alt="${escapeHtml(item.Project)}" />
      <span class="badge">${escapeHtml(item.Stage||'Stage')}</span>
      <span class="badge right">★ ${sc}</span>
    </div>
    <div class="cardBody">
      <div class="loc">◎ ${escapeHtml(item.Location)} · ${escapeHtml(item.Type)}</div>
      <div class="title" onclick="openDetail('${item.ID}')">${escapeHtml(title(item))}</div>
      <div class="price">${money(item.price)}</div>
      <div class="chips">
        <span class="chip">${escapeHtml(item.OwnershipType||'Ownership')}</span>
        <span class="chip">${escapeHtml(item.PaymentPlan||'Payment уточнить')}</span>
        <span class="chip">${escapeHtml(modeText(item))}</span>
      </div>
      <div class="roiRow">
        <div class="roiBox"><b>${percent(item.developerROI)}</b><span>Developer ROI</span></div>
        <div class="roiBox"><b>${percent(item.modelROI)}</b><span>Model ROI</span></div>
        <div class="roiBox"><b>${percent(item.conservativeROI)}</b><span>Conservative</span></div>
      </div>
      <div class="why"><b>Почему:</b> ${escapeHtml(item.WhyThisObject||'Добавить короткую причину')}</div>
      <div class="redFlags"><b>Red flags:</b> ${escapeHtml(item.RedFlags||'Добавить риски')}</div>
      <div class="legalNote"><b>Ownership:</b> ${escapeHtml(ownershipLine(item))}</div>
      <div class="checkLine"><input type="checkbox" ${checked} onchange="toggleSelect('${item.ID}')" /> добавить в shortlist</div>
      <div class="actions">
        <button class="smallBtn" onclick="openDetail('${item.ID}')">Карточка</button>
        <button class="smallBtn" onclick="openMemo('${item.ID}')">Investment memo</button>
      </div>
    </div>
  </article>`;
}

function renderCatalog(){
  setFiltersFromDom();
  const list=filteredData();
  $('#resultCount').textContent=`Объектов: ${list.length} из ${applyClientIds(DATA).length}`;
  app.innerHTML=list.length?`<div class="grid">${list.map(card).join('')}</div>`:'<div class="panel">Ничего не найдено. Ослабь фильтры.</div>';
  renderCompareBar();
}

function fillFilters(){
  const loc=$('#locationFilter'), type=$('#typeFilter');
  unique(DATA.map(x=>x.Location)).forEach(v=>loc.insertAdjacentHTML('beforeend',`<option>${escapeHtml(v)}</option>`));
  unique(DATA.map(x=>x.Type)).forEach(v=>type.insertAdjacentHTML('beforeend',`<option>${escapeHtml(v)}</option>`));
}

function renderCompareBar(){
  const bar=$('#compareBar');
  if(selected.length>=2 && !location.hash.startsWith('#compare')){
    $('#compareCount').textContent=`Выбрано: ${selected.length}`;
    bar.classList.remove('hidden');
  }else bar.classList.add('hidden');
}

function toggleSelect(id){
  const max=(window.APP_CONFIG&&window.APP_CONFIG.MAX_SHORTLIST)||5;
  if(selected.includes(id)) selected=selected.filter(x=>x!==id);
  else{
    if(selected.length>=max){alert(`Максимум ${max} объектов`);return renderCatalog();}
    selected.push(id);
  }
  renderCatalog();
}

function createShortlistLink(){
  if(!selected.length){alert('Сначала выбери 2–5 объектов');return;}
  const url=new URL(location.href);
  url.hash='';
  url.searchParams.set('ids', selected.join(','));
  const panel=$('#shortlistPanel');
  panel.classList.remove('hidden');
  panel.innerHTML=`<b>Клиентская ссылка готова</b><div class="note" style="color:#ccc">Отправь клиенту — он увидит только выбранные объекты.</div><input readonly value="${escapeHtml(url.toString())}" onclick="this.select()" />`;
  navigator.clipboard?.writeText(url.toString()).catch(()=>{});
}

function clearCompare(){selected=[]; renderCatalog();}
function goCompare(){location.hash='compare/'+selected.join(',');}
function openDetail(id){location.hash='o/'+encodeURIComponent(id);}
function openMemo(id){location.hash='memo/'+encodeURIComponent(id);}
function backCatalog(){location.hash='';}

function getItem(id){return DATA.find(x=>x.ID===id);}

function detailFacts(item){
  return [
    [money(item.price),'Цена'],
    [isNaN(item.pricePerSqm)?'—':money(item.pricePerSqm),'Цена за м²'],
    [item.Bedrooms||'—','Спальни'],
    [isNaN(item.build)?'—':item.build+' м²','Площадь'],
    [isNaN(item.land)?'—':item.land+' м²','Земля'],
    [item.Stage||'—','Стадия'],
    [item.CompletionDate||'—','Сдача'],
    [item.PaymentPlan||'—','Payment plan']
  ];
}

function renderDetail(id){
  const item=getItem(id); if(!item){backCatalog(); return;}
  app.innerHTML=`<section class="detail">
    <div class="actions no-print" style="margin-bottom:12px">
      <button class="smallBtn" onclick="backCatalog()">← к каталогу</button>
      <button class="smallBtn" onclick="openMemo('${item.ID}')">Investment memo</button>
      <button class="smallBtn" onclick="window.print()">PDF / Печать</button>
    </div>
    <div class="detailHero">
      <div class="galleryHero"><img src="${photoUrl(item,1)}" onerror="this.style.display='none'" /></div>
      <div class="detailHead panel">
        <div class="loc">${escapeHtml(item.Location)} · ${escapeHtml(item.Type)}</div>
        <h1>${escapeHtml(title(item))}</h1>
        <div class="detailPrice">${money(item.price)}</div>
        <div class="chips" style="margin:10px 0">
          <span class="chip">★ Investor score ${computedInvestorScore(item)}</span>
          <span class="chip">Legal ${item.LegalScore||'—'}</span>
          <span class="chip">${escapeHtml(item.OwnershipType||'Ownership')}</span>
        </div>
        <div class="roiRow">
          <div class="roiBox"><b>${percent(item.developerROI)}</b><span>Developer ROI</span></div>
          <div class="roiBox"><b>${percent(item.modelROI)}</b><span>Model ROI</span></div>
          <div class="roiBox"><b>${percent(item.conservativeROI)}</b><span>Conservative ROI</span></div>
        </div>
      </div>
    </div>
    <h3 class="sectionTitle">Ключевые параметры</h3>
    <div class="factGrid">${detailFacts(item).map(f=>`<div class="fact"><b>${escapeHtml(f[0])}</b><span>${escapeHtml(f[1])}</span></div>`).join('')}</div>
    <h3 class="sectionTitle">Вывод</h3>
    <div class="twoCols">
      <div class="textBox good"><b>Почему этот объект</b><p>${escapeHtml(item.WhyThisObject)}</p></div>
      <div class="textBox"><b>Кому подходит</b><p>${escapeHtml(item.FitsClient)}</p></div>
    </div>
    <h3 class="sectionTitle">Юридическая структура</h3>
    <div class="textBox"><b>${escapeHtml(item.OwnershipDetail||item.OwnershipType)}</b><p>${escapeHtml(item.OwnershipNote||'Добавить пояснение по структуре владения.')}</p></div>
    <h3 class="sectionTitle">Красные флаги</h3>
    <div class="textBox warn">${escapeHtml(item.RedFlags||'Добавить red flags')}</div>
    <h3 class="sectionTitle">Sales note</h3>
    <div class="textBox">${escapeHtml(item.SalesNote||'Добавить короткий sales вывод')}</div>
  </section>`;
  renderCompareBar();
}

function renderCompare(ids){
  const items=ids.map(getItem).filter(Boolean);
  if(items.length<2){backCatalog();return;}
  const rows=[
    ['Цена', x=>money(x.price), 'min', x=>x.price],
    ['Цена за м²', x=>isNaN(x.pricePerSqm)?'—':money(x.pricePerSqm), 'min', x=>x.pricePerSqm],
    ['Developer ROI', x=>percent(x.developerROI), 'max', x=>x.developerROI],
    ['Model ROI', x=>percent(x.modelROI), 'max', x=>x.modelROI],
    ['Conservative ROI', x=>percent(x.conservativeROI), 'max', x=>x.conservativeROI],
    ['Investor score', x=>computedInvestorScore(x), 'max', x=>computedInvestorScore(x)],
    ['Legal score', x=>x.LegalScore||'—', 'max', x=>num(x.LegalScore)],
    ['Lease / ownership', x=>ownershipLine(x), '', x=>NaN],
    ['Сдача', x=>x.CompletionDate||x.Stage, '', x=>NaN],
    ['Почему объект', x=>x.WhyThisObject, '', x=>NaN],
    ['Red flags', x=>x.RedFlags, '', x=>NaN]
  ];
  const bestIndex=(row)=>{
    const vals=items.map(row[4]);
    let bi=-1,bv=null;
    vals.forEach((v,i)=>{ if(isNaN(v)) return; if(bv===null||(row[2]==='max'?v>bv:v<bv)){bv=v;bi=i;} });
    return bi;
  };
  app.innerHTML=`<section class="panel">
    <div class="actions no-print" style="margin-bottom:12px"><button class="smallBtn" onclick="backCatalog()">← к каталогу</button><button class="smallBtn" onclick="window.print()">PDF / Печать</button></div>
    <h2>Сравнение объектов</h2>
    <div class="tableBox"><table>
      <tr><th></th>${items.map(x=>`<th>${escapeHtml(x.Project)}<br><span class="note">${escapeHtml(x.Location)}</span></th>`).join('')}</tr>
      ${rows.map(row=>{const bi=bestIndex(row);return `<tr><th>${row[0]}</th>${items.map((x,i)=>`<td class="${i===bi?'best':''}">${escapeHtml(row[1](x))}</td>`).join('')}</tr>`}).join('')}
    </table></div>
  </section>`;
  renderCompareBar();
}

function renderMemo(id){
  const item=getItem(id); if(!item){backCatalog();return;}
  app.innerHTML=`<section class="memo panel">
    <div class="actions no-print" style="margin-bottom:12px"><button class="smallBtn" onclick="renderDetail('${item.ID}')">← карточка</button><button class="smallBtn" onclick="window.print()">Скачать PDF / Печать</button></div>
    <div class="memoHeader">
      <div><h1>${escapeHtml(item.Project)} · ${escapeHtml(item.Bedrooms||'')}BR</h1><div class="note">${escapeHtml(item.Location)} · ${escapeHtml(item.Type)} · ID ${escapeHtml(item.ID)}</div></div>
      <div class="memoPrice">${money(item.price)}</div>
    </div>
    <h3 class="sectionTitle">Investment snapshot</h3>
    <div class="factGrid">${detailFacts(item).map(f=>`<div class="fact"><b>${escapeHtml(f[0])}</b><span>${escapeHtml(f[1])}</span></div>`).join('')}</div>
    <h3 class="sectionTitle">ROI scenarios</h3>
    <div class="factGrid">
      <div class="fact"><b>${percent(item.developerROI)}</b><span>Developer ROI</span></div>
      <div class="fact"><b>${percent(item.modelROI)}</b><span>Model ROI</span></div>
      <div class="fact"><b>${percent(item.conservativeROI)}</b><span>Conservative ROI</span></div>
      <div class="fact"><b>${escapeHtml(item.ROISource||'—')}</b><span>ROI source</span></div>
    </div>
    <h3 class="sectionTitle">Why this object</h3><div class="textBox good">${escapeHtml(item.WhyThisObject)}</div>
    <h3 class="sectionTitle">Client fit</h3><div class="textBox">${escapeHtml(item.FitsClient)}</div>
    <h3 class="sectionTitle">Legal / ownership</h3><div class="textBox"><b>${escapeHtml(item.OwnershipDetail||item.OwnershipType)}</b><p>${escapeHtml(item.OwnershipNote)}</p></div>
    <h3 class="sectionTitle">Red flags</h3><div class="textBox warn">${escapeHtml(item.RedFlags)}</div>
    <h3 class="sectionTitle">Next step</h3><div class="textBox">Confirm availability, request legal package, check reservation terms and prepare DD checklist before deposit.</div>
    <div class="memoFooter">Not a public offer or investment advice. Figures are based on available information and need to be verified before transaction. Updated: ${escapeHtml(item.UpdatedAt||'—')}</div>
  </section>`;
}

function route(){
  const h=decodeURIComponent(location.hash.replace(/^#/,''));
  if(h.startsWith('o/')) return renderDetail(h.slice(2));
  if(h.startsWith('compare/')) return renderCompare(h.slice(8).split(','));
  if(h.startsWith('memo/')) return renderMemo(h.slice(5));
  renderCatalog();
}

async function init(){
  DATA=await loadListings();
  fillFilters();
  const ids=idsFromUrl();
  if(ids.length){selected=ids.filter(id=>DATA.some(x=>x.ID===id));}
  $('#contactBtn').href=(window.APP_CONFIG&&window.APP_CONFIG.CONTACT_URL)||'#';
  document.querySelectorAll('.modeSwitch button').forEach(btn=>btn.addEventListener('click',()=>{
    document.querySelectorAll('.modeSwitch button').forEach(b=>b.classList.remove('on'));
    btn.classList.add('on'); mode=btn.dataset.mode; renderCatalog();
  }));
  ['#locationFilter','#typeFilter','#budgetFilter','#sortSelect'].forEach(s=>$(s).addEventListener('change',renderCatalog));
  $('#resetBtn').addEventListener('click',()=>{['#locationFilter','#typeFilter','#budgetFilter'].forEach(s=>$(s).value=''); $('#sortSelect').value='score'; renderCatalog();});
  $('#createShortlistBtn').addEventListener('click',createShortlistLink);
  $('#compareBtn').addEventListener('click',goCompare);
  $('#clearCompareBtn').addEventListener('click',clearCompare);
  window.addEventListener('hashchange',route);
  route();
}

init().catch(e=>{app.innerHTML=`<div class="panel">Ошибка загрузки данных: ${escapeHtml(e.message)}</div>`;});
