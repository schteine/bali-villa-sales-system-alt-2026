function parseCSV(text){
  const rows=[]; let row=[], cur='', q=false;
  for(let i=0;i<text.length;i++){
    const c=text[i];
    if(q){
      if(c==='"'){
        if(text[i+1]==='"'){cur+='"';i++;} else q=false;
      } else cur+=c;
    }else{
      if(c==='"') q=true;
      else if(c===','){row.push(cur);cur='';}
      else if(c==='\n'){row.push(cur);rows.push(row);row=[];cur='';}
      else if(c!=='\r') cur+=c;
    }
  }
  if(cur!==''||row.length){row.push(cur);rows.push(row);}
  return rows.filter(r=>r.some(x=>String(x||'').trim()!==''));
}

function csvToObjects(text){
  const rows=parseCSV(String(text||'').replace(/^\uFEFF/,''));
  if(!rows.length) return [];
  const headers=rows[0].map(h=>h.trim());
  return rows.slice(1).map(r=>{
    const o={};
    headers.forEach((h,i)=>o[h]=(r[i]||'').trim());
    return o;
  });
}

function num(v){
  if(v===null||v===undefined||v==='') return NaN;
  const s=String(v).replace(/[$%\s]/g,'').replace(/,/g,'.');
  return s?Number(s):NaN;
}

function pct(v){
  const n=num(v);
  if(isNaN(n)) return NaN;
  return n>1?n/100:n;
}

function money(v){
  const n=num(v);
  const locale=(window.I18N&&window.I18N.lang&&window.I18N.lang()==='en')?'en-US':'ru-RU';
  return isNaN(n)?'—':'$'+Math.round(n).toLocaleString(locale);
}

function percent(v){
  const n=pct(v);
  if(isNaN(n)) return '—';
  const s=(n*100).toFixed(n*100<10?1:0);
  return ((window.I18N&&window.I18N.lang&&window.I18N.lang()==='en')?s:s.replace('.',','))+'%';
}

function escapeHtml(s){
  return String(s||'').replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));
}

function stageConfidenceFactor(o){
  const stage=String(o.Stage||'').toLowerCase();
  const loc=String(o.Location||'').toLowerCase();
  const source=String(o.ROISource||'').toLowerCase();
  let f=0.90;
  if(stage.includes('готов')||stage.includes('ready')) f=0.96;
  else if(stage.includes('скоро')||stage.includes('q1')||stage.includes('q2')) f=0.92;
  else if(stage.includes('стро')||stage.includes('construction')) f=0.88;
  else if(stage.includes('off')||stage.includes('офф')) f=0.84;
  if(/karangasem|virgin|bedugul|kedungu|tabanan|east/i.test(loc)) f-=0.05;
  if(/actual|fact|факт|гарант|guarantee|гарантия/i.test(source)) f+=0.01;
  return Math.max(0.78, Math.min(0.97, f));
}

function stressFactor(o){
  const stage=String(o.Stage||'').toLowerCase();
  const loc=String(o.Location||'').toLowerCase();
  let f=0.78;
  if(stage.includes('готов')||stage.includes('ready')) f=0.82;
  else if(stage.includes('скоро')) f=0.78;
  else if(stage.includes('стро')) f=0.74;
  else if(stage.includes('off')||stage.includes('офф')) f=0.68;
  if(/karangasem|virgin|bedugul|kedungu|tabanan|east/i.test(loc)) f-=0.04;
  return Math.max(0.62, Math.min(0.84, f));
}

function normalizeListing(o){
  const price=num(o.PriceUSD);
  const build=num(o.BuildSqm);
  const adrBase=num(o.ADRBase);
  const occupancyBase=pct(o.OccupancyBase);
  const expensesRatio=pct(o.ExpensesRatio);
  const developerROI=pct(o.DeveloperROI);
  const csvModelROI=pct(o.ModelROI);
  const csvStressROI=pct(o.ConservativeROI);

  const rawModelROI=(!isNaN(price)&&price>0&&!isNaN(adrBase)&&!isNaN(occupancyBase)&&!isNaN(expensesRatio))
    ? (adrBase*occupancyBase*365*(1-expensesRatio)/price)
    : csvModelROI;

  const confidence=stageConfidenceFactor(o);
  let checkedROI=rawModelROI;
  if(isNaN(checkedROI) && !isNaN(developerROI)) checkedROI=developerROI*confidence;
  if(!isNaN(developerROI) && !isNaN(checkedROI)) checkedROI=Math.min(checkedROI, developerROI*confidence);
  if(isNaN(checkedROI)) checkedROI=csvModelROI;

  let stressROI=(!isNaN(checkedROI)) ? checkedROI*stressFactor(o) : csvStressROI;
  if(!isNaN(csvStressROI) && !isNaN(stressROI)) stressROI=Math.min(stressROI, csvStressROI);

  return {
    ...o,
    price,
    build,
    land:num(o.LandSqm),
    bedrooms:num(o.Bedrooms),
    pricePerSqm:num(o.PricePerSqm)||(!isNaN(price)&&!isNaN(build)&&build?price/build:NaN),
    developerROI,
    rawModelROI,
    modelROI:checkedROI,
    conservativeROI:stressROI,
    adrBase,
    occupancyBase,
    expensesRatio,
    legalScore:num(o.LegalScore),
    locationLiquidityScore:num(o.LocationLiquidityScore),
    leaseExtensionScore:num(o.LeaseExtensionScore),
    stageRiskScore:num(o.StageRiskScore),
    paymentCashflowScore:num(o.PaymentCashflowScore),
    uniquenessScore:num(o.UniquenessScore)
  };
}

async function loadCSV(url){
  const res=await fetch(url+(url.includes('?')?'&':'?')+'cb='+Date.now());
  if(!res.ok) throw new Error('CSV load failed: '+res.status);
  return await res.text();
}

async function loadListings(){
  const cfg=window.APP_CONFIG||{};
  let text='';
  try{
    if(cfg.CSV_URL) text=await loadCSV(cfg.CSV_URL);
  }catch(e){ console.warn('Live CSV unavailable, using fallback', e); }
  if(!text){ text=await loadCSV(cfg.FALLBACK_CSV_URL||'data/site_export_sample.csv'); }
  return csvToObjects(text).map(normalizeListing).filter(x=>x.ID);
}

window.money=money; window.percent=percent; window.num=num;
