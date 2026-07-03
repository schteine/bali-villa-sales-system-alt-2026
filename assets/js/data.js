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

function normalizeListing(o){
  const price=num(o.PriceUSD);
  const build=num(o.BuildSqm);
  return {
    ...o,
    price,
    build,
    land:num(o.LandSqm),
    bedrooms:num(o.Bedrooms),
    pricePerSqm:num(o.PricePerSqm)||(!isNaN(price)&&!isNaN(build)&&build?price/build:NaN),
    developerROI:pct(o.DeveloperROI),
    modelROI:pct(o.ModelROI),
    conservativeROI:pct(o.ConservativeROI),
    adrBase:num(o.ADRBase),
    occupancyBase:pct(o.OccupancyBase),
    expensesRatio:pct(o.ExpensesRatio),
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
