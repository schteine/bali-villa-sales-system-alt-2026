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
  const noi=grossRevenue*(1-v.expenses);
  const grossROI=grossRevenue/v.price;
  const netROI=noi/v.price;
  const conservativeROI=netROI*(1-v.haircut);
  const totalCash=v.deposit+v.price*v.taxes+v.furnishing+v.reserve;
  const cashOnCash=noi/Math.max(totalCash,1);
  const payback=v.price/Math.max(noi,1);
  const breakEvenOcc=(v.price*0.08)/(Math.max(v.adr,1)*365*(1-v.expenses));
  const breakEvenADR=(v.price*0.08)/(Math.max(v.occupancy,0.01)*365*(1-v.expenses));
  const resale=v.price*Math.pow(1+v.growth,v.holdYears);
  return {label, adr, occ, grossRevenue, noi, grossROI, netROI, conservativeROI, totalCash, cashOnCash, payback, breakEvenOcc, breakEvenADR, resale};
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
}

function renderScenarios(v){
  const scenarios=[calcScenario(v,.85,.85,'Conservative'),calcScenario(v,1,1,'Base'),calcScenario(v,1.15,1.1,'Optimistic')];
  $('#scenarioTable').innerHTML=`<table><tr><th>Scenario</th><th>ADR</th><th>Occupancy</th><th>Revenue</th><th>NOI</th><th>Net ROI</th><th>Conservative ROI</th></tr>${scenarios.map(s=>`<tr><td><b>${s.label}</b></td><td>${fmtMoney(s.adr)}</td><td>${fmtPct(s.occ)}</td><td>${fmtMoney(s.grossRevenue)}</td><td>${fmtMoney(s.noi)}</td><td>${fmtPct(s.netROI)}</td><td>${fmtPct(s.conservativeROI)}</td></tr>`).join('')}</table>`;
  return scenarios[1];
}

function renderSensitivity(v){
  const adrMoves=[-.2,-.1,0,.1,.2];
  const occMoves=[-.2,-.1,0,.1,.2];
  const rows=occMoves.map(om=>`<tr><th>Occ ${(om*100).toFixed(0)}%</th>${adrMoves.map(am=>{
    const adr=v.adr*(1+am), occ=Math.max(0.05,Math.min(.98,v.occupancy*(1+om)));
    const roi=(adr*occ*365*(1-v.expenses))/v.price;
    return `<td>${fmtPct(roi)}</td>`;
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
