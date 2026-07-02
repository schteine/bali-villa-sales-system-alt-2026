const $=s=>document.querySelector(s);
const fmtMoney=n=>isFinite(n)?'$'+Math.round(n).toLocaleString('ru-RU'):'—';
const fmtPct=n=>isFinite(n)?(n*100).toFixed(n*100<10?1:0).replace('.',',')+'%':'—';

function readForm(){
  const fd=new FormData($('#financeForm'));
  const v={};
  for(const [k,val] of fd.entries()) v[k]=Number(val)||0;
  v.taxes/=100; v.occupancy/=100; v.expenses/=100; v.haircut/=100; v.growth/=100;
  return v;
}

function calcScenario(v, adrMult, occMult, label){
  const adr=v.adr*adrMult;
  const occ=Math.min(0.98, v.occupancy*occMult);
  const grossRevenue=adr*occ*365;
  const expenses=grossRevenue*v.expenses;
  const noi=grossRevenue-expenses;
  const grossROI=grossRevenue/v.price;
  const netROI=noi/v.price;
  const conservativeROI=netROI*(1-v.haircut);
  const totalCash=v.deposit+v.price*v.taxes+v.furnishing+v.reserve;
  const cashOnCash=noi/Math.max(totalCash,1);
  const payback=v.price/Math.max(noi,1);
  const breakEvenOcc=(v.price*0.08)/(Math.max(v.adr,1)*365*(1-v.expenses));
  const breakEvenADR=(v.price*0.08)/(Math.max(v.occupancy,0.01)*365*(1-v.expenses));
  const resale=v.price*Math.pow(1+v.growth,v.holdYears);
  return {label, adr, occ, grossRevenue, expenses, noi, grossROI, netROI, conservativeROI, totalCash, cashOnCash, payback, breakEvenOcc, breakEvenADR, resale};
}

function renderKPIs(base){
  $('#kpis').innerHTML=[
    [fmtPct(base.grossROI),'Gross ROI'],
    [fmtPct(base.netROI),'Net ROI'],
    [fmtPct(base.conservativeROI),'Conservative ROI'],
    [fmtPct(base.cashOnCash),'Cash-on-cash'],
    [base.payback.toFixed(1).replace('.',','),'Payback, years'],
    [fmtPct(base.breakEvenOcc),'Break-even occupancy for 8% ROI'],
    [fmtMoney(base.breakEvenADR),'Break-even ADR for 8% ROI'],
    [fmtMoney(base.totalCash),'Total cash needed'],
    [fmtMoney(base.resale),'Projected resale value']
  ].map(x=>`<div class="kpi"><b>${x[0]}</b><span>${x[1]}</span></div>`).join('');
  $('#mainInsight').innerHTML=`<b>Base scenario: ${fmtMoney(base.noi)} net income/year</b><span>При текущих вводных объект даёт ${fmtPct(base.netROI)} net ROI и окупается примерно за ${base.payback.toFixed(1).replace('.',',')} лет. Conservative ROI после haircut: ${fmtPct(base.conservativeROI)}.</span>`;
}

function renderScenarios(v){
  const scenarios=[calcScenario(v,.85,.85,'Conservative'),calcScenario(v,1,1,'Base'),calcScenario(v,1.15,1.1,'Optimistic')];
  $('#scenarioTable').innerHTML=`<table><tr><th>Scenario</th><th>ADR</th><th>Occupancy</th><th>Revenue</th><th>Expenses</th><th>NOI</th><th>Net ROI</th><th>Conservative ROI</th></tr>${scenarios.map(s=>`<tr><td><b>${s.label}</b></td><td>${fmtMoney(s.adr)}</td><td>${fmtPct(s.occ)}</td><td>${fmtMoney(s.grossRevenue)}</td><td>${fmtMoney(s.expenses)}</td><td>${fmtMoney(s.noi)}</td><td>${fmtPct(s.netROI)}</td><td>${fmtPct(s.conservativeROI)}</td></tr>`).join('')}</table>`;
  renderScenarioBars(scenarios);
  renderExpenseBreakdown(scenarios[1]);
  renderCashflow(v, scenarios[1]);
  renderPayback(v, scenarios[1]);
  return scenarios[1];
}

function renderScenarioBars(scenarios){
  const max=Math.max(...scenarios.map(s=>s.noi),1);
  $('#scenarioBars').innerHTML=scenarios.map((s,i)=>`<div class="barRow"><b>${s.label}</b><div class="barTrack"><div class="barFill ${i===0?'warn':i===1?'soft':'good'}" style="width:${Math.max(4,s.noi/max*100)}%"></div></div><span>${fmtMoney(s.noi)}</span></div>`).join('')+`<div class="legend"><span><i class="dot warn"></i> Conservative</span><span><i class="dot soft"></i> Base</span><span><i class="dot good"></i> Optimistic</span></div>`;
}

function renderExpenseBreakdown(base){
  const gross=base.grossRevenue||1;
  const pieces=[
    ['Net profit', base.noi, 'var(--good)'],
    ['Operating expenses', base.expenses, 'var(--warn)']
  ];
  $('#expenseBreakdown').innerHTML=`<div class="expenseStack">${pieces.map(p=>`<span style="width:${p[1]/gross*100}%;background:${p[2]}"></span>`).join('')}</div>`+
    pieces.map(p=>`<div class="barRow"><b>${p[0]}</b><div class="barTrack"><div class="barFill" style="width:${p[1]/gross*100}%;background:${p[2]}"></div></div><span>${fmtMoney(p[1])}</span></div>`).join('')+
    `<p class="note">Gross revenue: ${fmtMoney(base.grossRevenue)} / year</p>`;
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
  return `<svg class="svgChart" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none">
    <line x1="${pad}" y1="${axisY}" x2="${width-pad}" y2="${axisY}" stroke="#ddd" />
    <line x1="${pad}" y1="${pad}" x2="${pad}" y2="${height-pad}" stroke="#ddd" />
    <path d="${path}" fill="none" stroke="#111" stroke-width="4" />
    ${coords.map((c,i)=>`<circle cx="${c[0]}" cy="${c[1]}" r="4" fill="#111"/><text x="${c[0]}" y="${height-9}" font-size="11" text-anchor="middle">Y${i+1}</text>`).join('')}
    <text x="${pad}" y="18" font-size="12" fill="#777">${fmtMoney(maxY)}</text>
    <text x="${pad}" y="${height-38}" font-size="12" fill="#777">${fmtMoney(minY)}</text>
  </svg>`;
}

function renderCashflow(v, base){
  const points=[]; let cum=0;
  for(let y=1;y<=Math.min(10, Math.max(3, v.holdYears));y++){
    cum += base.noi*Math.pow(1+v.growth,y-1);
    points.push({x:y,y:cum});
  }
  $('#cashflowChart').innerHTML=svgLine(points)+`<p class="note">Накопленный NOI за ${points.length} лет: ${fmtMoney(points.at(-1).y)}</p>`;
}

function renderPayback(v, base){
  const points=[]; let cum=-v.price;
  const years=Math.min(15, Math.max(5, Math.ceil(base.payback)+2));
  for(let y=1;y<=years;y++){
    cum += base.noi*Math.pow(1+v.growth,y-1);
    points.push({x:y,y:cum});
  }
  const cross=points.findIndex(p=>p.y>=0)+1;
  $('#paybackChart').innerHTML=svgLine(points)+`<p class="note">${cross>0?`Окупаемость примерно на ${cross}-м году.`:`За ${years} лет окупаемость не достигается.`}</p>`;
}

function renderSensitivity(v){
  const adrMoves=[-.2,-.1,0,.1,.2];
  const occMoves=[-.2,-.1,0,.1,.2];
  const rows=occMoves.map(om=>`<tr><th>Occ ${(om*100).toFixed(0)}%</th>${adrMoves.map(am=>{
    const adr=v.adr*(1+am), occ=Math.max(0.05,Math.min(.98,v.occupancy*(1+om)));
    const roi=(adr*occ*365*(1-v.expenses))/v.price;
    const cls=roi>=.1?'heat-good':roi>=.075?'heat-mid':'heat-low';
    return `<td class="${cls}">${fmtPct(roi)}</td>`;
  }).join('')}</tr>`).join('');
  $('#sensitivityTable').innerHTML=`<table><tr><th>Occupancy / ADR</th>${adrMoves.map(am=>`<th>ADR ${(am*100).toFixed(0)}%</th>`).join('')}</tr>${rows}</table>`;
}

function update(){
  const v=readForm();
  const base=renderScenarios(v);
  renderKPIs(base);
  renderSensitivity(v);
}

document.querySelectorAll('#financeForm input').forEach(i=>i.addEventListener('input',update));
update();
