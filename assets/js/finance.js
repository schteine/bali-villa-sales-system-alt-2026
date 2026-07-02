const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));
const fmtMoney = n => isFinite(n) ? '$' + Math.round(n).toLocaleString('en-US') : '—';
const fmtPct = n => isFinite(n) ? (n * 100).toFixed(n * 100 < 10 ? 1 : 0).replace('.', ',') + '%' : '—';
const fmtNum = n => isFinite(n) ? Number(n).toLocaleString('en-US', {maximumFractionDigits: 1}) : '—';

let LISTINGS = [];

function parseCSV(text){
  const rows=[]; let row=[], cur='', q=false;
  for(let i=0;i<text.length;i++){
    const c=text[i];
    if(q){
      if(c==='"'){ if(text[i+1]==='"'){cur+='"';i++;} else q=false; }
      else cur+=c;
    }else{
      if(c==='"') q=true;
      else if(c===','){ row.push(cur); cur=''; }
      else if(c==='\n'){ row.push(cur); rows.push(row); row=[]; cur=''; }
      else if(c!=='\r') cur+=c;
    }
  }
  if(cur!==''||row.length){ row.push(cur); rows.push(row); }
  return rows;
}
function toNum(v){
  if(v == null) return 0;
  const s = String(v).replace(/[^0-9,\.\-]/g,'').replace(',', '.');
  return Number(s)||0;
}
function rowsToObjects(csv){
  const rows = parseCSV(csv.replace(/^\uFEFF/,''));
  const h = rows.shift().map(x=>x.trim());
  return rows.filter(r=>r.length && r[0]).map(r=>Object.fromEntries(h.map((k,i)=>[k, r[i] || ''])));
}
async function loadListings(){
  try{
    const res = await fetch('data/site_export_full.csv?cb=' + Date.now());
    LISTINGS = rowsToObjects(await res.text());
    const select = $('#objectSelect');
    LISTINGS.filter(x=>!['Archive','Draft'].includes(x.Status)).forEach(x=>{
      const opt = document.createElement('option');
      opt.value = x.ID;
      opt.textContent = `${x.ID} · ${x.Project} · ${x.Location} · ${fmtMoney(toNum(x.PriceUSD))}`;
      select.appendChild(opt);
    });
  }catch(e){
    console.warn('Could not load listings', e);
  }
}

function applyListing(id){
  if(id === 'manual') return;
  const d = LISTINGS.find(x=>x.ID === id);
  if(!d) return;
  const f = $('#financeForm');
  f.price.value = toNum(d.PriceUSD) || f.price.value;
  f.adr.value = toNum(d.ADRBase) || f.adr.value;
  f.occupancy.value = Math.round((toNum(d.OccupancyBase) <= 1 ? toNum(d.OccupancyBase)*100 : toNum(d.OccupancyBase)) || Number(f.occupancy.value));
  f.growth.value = Number(f.growth.value) || 3;
  update();
}

function readForm(){
  const fd = new FormData($('#financeForm'));
  const v = {};
  for(const [k,val] of fd.entries()) v[k] = Number(val) || 0;
  ['taxes','occupancy','growth','discount','haircut','downPayment','duringConstruction'].forEach(k=>v[k]/=100);
  v.holdYears = Math.max(1, Math.round(v.holdYears || 5));
  return v;
}

function calcRevenue(v, adrMult=1, occMult=1){
  const adr = v.adr * adrMult;
  const occ = Math.max(.05, Math.min(.98, v.occupancy * occMult));
  const income = adr * occ * 365;
  const ota = income * 0.144;
  const direct = income * 0.020;
  const afterCommissions = income - ota - direct;
  const general = income * 0.126;
  const management = afterCommissions * 0.20;
  const beforeTax = afterCommissions - general - management;
  const tax = Math.max(0, beforeTax * 0.10);
  const net = beforeTax - tax;
  return {adr, occ, income, ota, direct, afterCommissions, general, management, beforeTax, tax, net};
}
function calcModel(v){
  const fullPrice = v.price * (1 - v.discount);
  const totalInitialCosts = v.price * v.taxes + v.furnishing + v.reserve;
  const totalInvestment = fullPrice + totalInitialCosts;
  const installmentPrice = v.price;
  const specialPrice = v.price;
  const base = calcRevenue(v, 1, 1);
  const conservative = calcRevenue(v, .85, .85);
  const optimistic = calcRevenue(v, 1.15, 1.10);
  const totalIncome = base.net * v.holdYears;
  const resale = v.price * Math.pow(1 + v.growth, v.holdYears);
  const capGain = Math.max(0, resale - v.price);
  const simpleROI = totalIncome / Math.max(fullPrice,1);
  const totalReturn = (totalIncome + capGain) / Math.max(totalInvestment,1);
  const payback = fullPrice / Math.max(base.net, 1);
  const irr = Math.pow((fullPrice + totalIncome + capGain) / Math.max(totalInvestment,1), 1 / v.holdYears) - 1;
  return {v, fullPrice, installmentPrice, specialPrice, totalInitialCosts, totalInvestment, base, conservative, optimistic, totalIncome, resale, capGain, simpleROI, totalReturn, payback, irr};
}

function renderPaymentCards(m){
  const v=m.v;
  const cards = [
    {title:'Full prepayment', price:m.fullPrice, old:m.v.price, tag:`-${Math.round(v.discount*100)}%`, parts:[['100%','On handover','#f6c21a']]},
    {title:'Installment plan', price:m.installmentPrice, tag:'', parts:[ [`${Math.round(v.downPayment*100)}%`,'Down payment','#f6c21a'], [`${Math.round((1-v.downPayment)*100)}%`,'During construction','#f59e0b'] ]},
    {title:'Special offer', price:m.specialPrice, tag:'seller offer', parts:[['50%','Down payment','#f6c21a'],['15%','During construction','#f59e0b'],['15%','On handover','#d97706'],['20%','From rent','#92400e']]}
  ];
  $('#paymentCards').innerHTML = cards.map((c,i)=>{
    const total = c.parts.reduce((s,p)=>s+parseFloat(p[0]),0) || 100;
    return `<article class="payOption ${i===0?'active':''}">
      <div class="payTop"><h3>${c.title}</h3>${c.tag?`<span>${c.tag}</span>`:''}</div>
      <div class="payPrice">${fmtMoney(c.price)} ${c.old && c.old!==c.price?`<em>${fmtMoney(c.old)}</em>`:''}</div>
      <div class="payStripe">${c.parts.map(p=>`<i style="width:${parseFloat(p[0])/total*100}%;background:${p[2]}"></i>`).join('')}</div>
      <div class="payLegend">${c.parts.map(p=>`<div><i style="background:${p[2]}"></i><b>${p[0]}</b><span>${p[1]}</span></div>`).join('')}</div>
    </article>`;
  }).join('');
}

function renderSummary(m){
  const b = m.base;
  const rows = [
    ['ITEM','PER MONTH','PER YEAR',`${m.v.holdYears} YEARS`, 'head'],
    ['Income', b.income/12, b.income, b.income*m.v.holdYears],
    ['REVENUE EXPENSES','','','', 'section'],
    ['OTA Commission', -b.ota/12, -b.ota, -b.ota*m.v.holdYears, 'neg'],
    ['Direct Booking Commission', -b.direct/12, -b.direct, -b.direct*m.v.holdYears, 'neg'],
    ['Profit after commissions', b.afterCommissions/12, b.afterCommissions, b.afterCommissions*m.v.holdYears, 'bold'],
    ['PROFIT EXPENSES','','','', 'section'],
    ['General costs', -b.general/12, -b.general, -b.general*m.v.holdYears, 'neg'],
    ['Management Profit Commission', -b.management/12, -b.management, -b.management*m.v.holdYears, 'neg'],
    ['Profit before tax', b.beforeTax/12, b.beforeTax, b.beforeTax*m.v.holdYears, 'bold'],
    ['TAXES','','','', 'section'],
    ['Investor income tax', -b.tax/12, -b.tax, -b.tax*m.v.holdYears, 'neg'],
    ['Net profit', b.net/12, b.net, b.net*m.v.holdYears, 'total']
  ];
  $('#investmentSummary').innerHTML = `<table class="forecastTable">${rows.map(r=>{
    if(r[4]==='head') return `<tr><th>${r[0]}</th><th>${r[1]}</th><th>${r[2]}</th><th>${r[3]}</th></tr>`;
    if(r[4]==='section') return `<tr class="section"><td colspan="4">${r[0]}</td></tr>`;
    const cls = r[4] || '';
    return `<tr class="${cls}"><td>${r[0]}</td><td>${fmtMoney(r[1])}</td><td>${fmtMoney(r[2])}</td><td>${fmtMoney(r[3])}</td></tr>`;
  }).join('')}</table>`;
}

function renderStructure(m){
  const b = m.base;
  const items = [
    ['Investor Profit', b.net, '#65a30d'],
    ['OTA Commission', b.ota, '#f87171'],
    ['Direct Booking Commission', b.direct, '#ef4444'],
    ['General costs', b.general, '#dc2626'],
    ['Management Profit Commission', b.management, '#991b1b']
  ];
  const total = items.reduce((s,x)=>s+x[1],0) || 1;
  let start=0;
  const gradient = items.map(x=>{ const a=start; start += x[1]/total*360; return `${x[2]} ${a}deg ${start}deg`; }).join(',');
  $('#financialStructure').innerHTML = `<div class="donutWrap">
    <div class="donut" style="background:conic-gradient(${gradient})"><div><span>PER YEAR</span><b>${fmtMoney(b.income)}</b></div></div>
    <div class="donutLegend">${items.map(x=>`<div><i style="background:${x[2]}"></i><span>${x[0]}</span><b>${fmtMoney(x[1])}</b></div>`).join('')}</div>
  </div>`;
}

function renderCapitalization(m){
  const years = [];
  const now = new Date().getFullYear();
  for(let i=0;i<=m.v.holdYears;i++) years.push(now+i);
  const max = Math.max(...years.map((_,i)=>m.v.price*Math.pow(1+m.v.growth,i) + m.base.net*i),1);
  $('#capitalizationChart').innerHTML = `<div class="capChart">
    ${years.map((y,i)=>{
      const paid = m.fullPrice;
      const cap = Math.max(0, m.v.price*Math.pow(1+m.v.growth,i)-m.v.price);
      const rent = m.base.net*i;
      return `<div class="capCol">
        <div class="capBar" style="height:${Math.max(16,(paid+cap+rent)/max*220)}px">
          <i class="paid" style="height:${paid/(paid+cap+rent)*100}%"></i>
          <i class="cap" style="height:${cap/(paid+cap+rent)*100}%"></i>
          <i class="rent" style="height:${rent/(paid+cap+rent)*100}%"></i>
        </div><span>${y}</span>
      </div>`;
    }).join('')}
  </div><div class="legend"><span><i class="dot paid"></i>Paid</span><span><i class="dot cap"></i>Capitalization</span><span><i class="dot rent"></i>Rental income</span></div>`;
}

function renderReturns(m){
  $('#returnsBlock').innerHTML = `<div class="returnsTop">
    <div><span>ROI</span><b>${fmtPct(m.simpleROI)}</b></div>
    <div><span>Total income</span><b>${fmtMoney(m.totalIncome)}</b></div>
  </div>
  <div class="returnStats">
    <div><span>Payback</span><b>${fmtNum(m.payback)} years</b></div>
    <div><span>IRR</span><b>${fmtPct(m.irr)}</b></div>
    <div><span>Capital gain</span><b>${fmtMoney(m.capGain)}</b></div>
  </div>
  <div class="basedOn"><b>Based on</b><br>ADR ${fmtMoney(m.v.adr)} · Occupancy ${fmtPct(m.v.occupancy)} · Rental growth ${fmtPct(m.v.growth)} / yr · ${new Date().getFullYear()} → ${new Date().getFullYear()+m.v.holdYears}</div>`;
}

function renderPaymentPlan(m){
  const p = m.fullPrice;
  $('#paymentPlanTotal').textContent = fmtMoney(p);
  $('#paymentPlan').innerHTML = `<div class="planBar"><span style="width:100%">100%</span></div>
    <div class="planDetails"><div><i></i><span>Full payment · 1 × ${fmtMoney(p)}</span><b>${fmtMoney(p)}</b></div></div>`;
}

function renderScenarioBars(m){
  const scenarios = [m.conservative, m.base, m.optimistic];
  const labels = ['Conservative','Base','Optimistic'];
  const max = Math.max(...scenarios.map(s=>s.net), 1);
  $('#scenarioBars').innerHTML = scenarios.map((s,i)=>`<div class="scenarioBarRow"><b>${labels[i]}</b><div><span style="width:${Math.max(4, s.net/max*100)}%"></span></div><em>${fmtMoney(s.net)} / yr</em></div>`).join('');
}

function svgLine(points, width=640, height=260){
  const pad=34;
  const maxY=Math.max(...points.map(p=>p.y),1);
  const minY=Math.min(0,...points.map(p=>p.y));
  const xStep=(width-pad*2)/Math.max(points.length-1,1);
  const yScale=(height-pad*2)/(maxY-minY||1);
  const coords=points.map((p,i)=>[pad+i*xStep, height-pad-(p.y-minY)*yScale]);
  const path=coords.map((c,i)=>(i?'L':'M')+c[0].toFixed(1)+' '+c[1].toFixed(1)).join(' ');
  const axisY=height-pad-(0-minY)*yScale;
  return `<svg class="svgChart refined" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none">
    <line x1="${pad}" y1="${axisY}" x2="${width-pad}" y2="${axisY}" stroke="#ddd" />
    <path d="${path}" fill="none" stroke="#65a30d" stroke-width="5" />
    ${coords.map((c,i)=>`<circle cx="${c[0]}" cy="${c[1]}" r="4" fill="#111"/><text x="${c[0]}" y="${height-9}" font-size="11" text-anchor="middle">Y${i+1}</text>`).join('')}
    <text x="${pad}" y="18" font-size="12" fill="#777">${fmtMoney(maxY)}</text>
    <text x="${pad}" y="${height-38}" font-size="12" fill="#777">${fmtMoney(minY)}</text>
  </svg>`;
}
function renderCashflow(m){
  const points=[]; let cum=-m.fullPrice;
  for(let y=1;y<=Math.max(5,m.v.holdYears);y++){
    cum += m.base.net*Math.pow(1+m.v.growth,y-1);
    points.push({x:y,y:cum});
  }
  $('#cashflowChart').innerHTML = svgLine(points) + `<p class="note">Точка выше нуля = инвестор вернул тело инвестиции из rental cashflow.</p>`;
}
function renderSensitivity(m){
  const adrMoves=[-.2,-.1,0,.1,.2];
  const occMoves=[-.2,-.1,0,.1,.2];
  const rows=occMoves.map(om=>`<tr><th>Occ ${(om*100).toFixed(0)}%</th>${adrMoves.map(am=>{
    const x={...m.v, adr:m.v.adr*(1+am), occupancy:Math.max(.05,Math.min(.98,m.v.occupancy*(1+om)))};
    const roi=calcRevenue(x).net/m.fullPrice;
    const cls=roi>=.10?'heat-good':roi>=.075?'heat-mid':'heat-low';
    return `<td class="${cls}">${fmtPct(roi)}</td>`;
  }).join('')}</tr>`).join('');
  $('#sensitivityTable').innerHTML = `<table><tr><th>Occupancy / ADR</th>${adrMoves.map(am=>`<th>ADR ${(am*100).toFixed(0)}%</th>`).join('')}</tr>${rows}</table>`;
}

function update(){
  const m = calcModel(readForm());
  renderPaymentCards(m);
  renderSummary(m);
  renderStructure(m);
  renderCapitalization(m);
  renderReturns(m);
  renderPaymentPlan(m);
  renderScenarioBars(m);
  renderCashflow(m);
  renderSensitivity(m);
}
function resetModel(){
  $('#financeForm').reset();
  $('#objectSelect').value = 'manual';
  update();
}

document.addEventListener('input', e=>{ if(e.target.closest('#financeForm')) update(); });
$('#objectSelect').addEventListener('change', e=>applyListing(e.target.value));
loadListings().then(update);
update();
