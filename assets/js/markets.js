const app=document.getElementById('marketApp');
function money(n){n=Number(n);return isFinite(n)?'$'+Math.round(n).toLocaleString('en-US'):'—'}
function pct(v){v=Number(v);return isFinite(v)?(v*100).toFixed(0)+'%':'—'}
function rangePct(a,b){return `${pct(a)}–${pct(b)}`}
function esc(s){return String(s||'').replace(/[&<>\"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));}
function scoreClass(v){v=Number(v);return v>=8?'scoreGood':v>=6?'scoreMid':'scoreLow'}
function maxOf(rows,key){return Math.max(...rows.map(r=>Number(r[key])||0),1)}
function avgYield(r){return ((Number(r.RentalYieldLow)||0)+(Number(r.RentalYieldHigh)||0))/2}
function scoreBar(label,value,max=10){const p=Math.max(0,Math.min(100,(Number(value)||0)/max*100));return `<div class="miniScore"><span>${label}</span><div><i style="width:${p}%"></i></div><b>${value}/10</b></div>`}
function criterionRow(label,values){return `<tr><th>${label}</th>${values.map(v=>`<td>${v}</td>`).join('')}</tr>`}
function miniBar(value,max,cls=''){const p=Math.max(2,Math.min(100,(Number(value)||0)/max*100));return `<div class="marketMiniBar"><i class="${cls}" style="width:${p}%"></i></div>`}
function card(r,rows){
  const maxEntry=maxOf(rows,'EntryTicketUSD');
  const maxPpm=maxOf(rows,'PricePerSqmUSD');
  const yieldAvg=avgYield(r);
  return `<article class="marketCard ${r.Market==='Bali'?'featured':''}">
    <div class="marketCardTop">
      <div><span class="marketFlag">${esc(r.Flag)}</span><h2>${esc(r.Market)}</h2><p>${esc(r.Country)}</p></div>
      <span class="marketTag">${esc(r.Positioning)}</span>
    </div>
    <div class="marketKpis">
      <div><span>Entry</span><b>${money(r.EntryTicketUSD)}</b>${miniBar(r.EntryTicketUSD,maxEntry,'dark')}</div>
      <div><span>Yield</span><b>${rangePct(r.RentalYieldLow,r.RentalYieldHigh)}</b>${miniBar(yieldAvg,0.10,'green')}</div>
      <div><span>Price / m²</span><b>${money(r.PricePerSqmUSD)}</b>${miniBar(r.PricePerSqmUSD,maxPpm,'orange')}</div>
    </div>
    <div class="marketScores">
      ${scoreBar('Новостройки',r.NewBuildReliabilityScore)}
      ${scoreBar('Ликвидность',r.LiquidityScore)}
      ${scoreBar('Юр. ясность',r.LegalClarityScore)}
    </div>
    <div class="marketText"><b>Кому подходит</b><p>${esc(r.SalesAngle)}</p></div>
    <div class="marketRisk"><b>Главный риск</b><p>${esc(r.MainRisk)}</p></div>
  </article>`
}
function drawYieldBars(rows){
  const max=0.10;
  return `<div class="marketChartCard">
    <h2>Доходность от аренды</h2>
    <p>Бали выигрывает по потенциальной доходности, но требует сильнее проверять юридику, управление и девелопера.</p>
    ${rows.map(r=>{
      const y=avgYield(r); const p=Math.max(4,Math.min(100,y/max*100));
      return `<div class="marketBarRow"><span>${esc(r.Market)}</span><div><i style="width:${p}%"></i></div><b>${rangePct(r.RentalYieldLow,r.RentalYieldHigh)}</b></div>`
    }).join('')}
  </div>`
}
function drawEntryBars(rows){
  const max=maxOf(rows,'EntryTicketUSD');
  return `<div class="marketChartCard">
    <h2>Минимальный бюджет входа</h2>
    <p>Батуми — самый низкий вход, Бали остаётся доступнее Дубая и близок к Пхукету при более высокой доходности.</p>
    ${rows.map(r=>{
      const p=Math.max(4,Math.min(100,(Number(r.EntryTicketUSD)||0)/max*100));
      return `<div class="marketBarRow"><span>${esc(r.Market)}</span><div><i class="entry" style="width:${p}%"></i></div><b>${money(r.EntryTicketUSD)}</b></div>`
    }).join('')}
  </div>`
}
function marketVerdicts(rows){
  const byName=Object.fromEntries(rows.map(r=>[r.Market,r]));
  return `<section class="marketVerdicts">
    <div class="verdict black"><span>Best yield story</span><b>Бали</b><p>8–10% rental yield, lifestyle demand, lower entry than Dubai. Требует сильного DD.</p></div>
    <div class="verdict"><span>Best legal clarity</span><b>Дубай</b><p>Полная собственность, высокая ликвидность, 0% rental tax. Минус — высокий $/м².</p></div>
    <div class="verdict"><span>Balanced resort market</span><b>Пхукет</b><p>Понятный курортный рынок, но доходность обычно ниже Бали и есть квоты freehold.</p></div>
    <div class="verdict"><span>Lowest entry</span><b>Батуми</b><p>Низкий бюджет входа и простое владение, но рынок менее глобальный и доходность ниже.</p></div>
  </section>`
}
function renderMatrix(rows){
  const h=rows.map(r=>`<td><b>${esc(r.Flag)} ${esc(r.Country)}</b></td>`).join('');
  return `<section id="marketMatrix" class="forecastCard marketMatrix"><h2>Детальное сравнение</h2><div class="tableBox"><table>
    <tr><th>Критерий / Локация</th>${h}</tr>
    ${criterionRow('Налог/сборы при продаже',rows.map(r=>esc(r.SaleTax)))}
    ${criterionRow('Налог с аренды',rows.map(r=>esc(r.RentalTax)))}
    ${criterionRow('Надёжность новостроек',rows.map(r=>`<span class="pill ${scoreClass(r.NewBuildReliabilityScore)}">${r.NewBuildReliabilityScore} из 10</span>`))}
    ${criterionRow('Доходность от аренды',rows.map(r=>`<b>${rangePct(r.RentalYieldLow,r.RentalYieldHigh)}</b>`))}
    ${criterionRow('Цена за м²',rows.map(r=>money(r.PricePerSqmUSD)))}
    ${criterionRow('Минимальный бюджет входа',rows.map(r=>money(r.EntryTicketUSD)))}
    ${criterionRow('Гибкость рассрочки / ипотеки',rows.map(r=>esc(r.InstallmentFlexibility)))}
    ${criterionRow('Владение для иностранцев',rows.map(r=>esc(r.ForeignOwnership)))}
    ${criterionRow('Бонусы для инвестора',rows.map(r=>esc(r.InvestorBonus)||'—'))}
  </table></div><p class="note">Это рабочий market snapshot из твоего материала. Перед отправкой клиенту стоит обновить спорные налоговые и визовые пункты под конкретный год, страну и тип сделки.</p></section>`
}
fetch('data/market_compare_snapshot.csv').then(r=>r.text()).then(t=>{
  const rows=csvToObjects(t);
  const sorted=[...rows].sort((a,b)=>['Bali','Dubai','Phuket','Batumi'].indexOf(a.Market)-['Bali','Dubai','Phuket','Batumi'].indexOf(b.Market));
  app.innerHTML=`
    ${marketVerdicts(sorted)}
    <section class="marketCards">${sorted.map(r=>card(r,sorted)).join('')}</section>
    <section class="marketCharts">${drawYieldBars(sorted)}${drawEntryBars(sorted)}</section>
    <section class="forecastCard marketDecision"><h2>Как использовать в продаже</h2><div class="decisionGrid">
      <div><b>Клиенту нужен высокий rental yield</b><span>Начинать с Бали, но сразу показывать риски и DD.</span></div>
      <div><b>Клиент боится юридики</b><span>Сравнить с Дубаем и объяснить trade-off: ниже ROI, выше ясность.</span></div>
      <div><b>Клиент смотрит lifestyle</b><span>Бали и Пхукет — главные конкуренты, решает локация, управление и входной билет.</span></div>
      <div><b>Клиент с малым бюджетом</b><span>Батуми можно показать как low-entry alternative, но не как прямой аналог Бали.</span></div>
    </div></section>
    ${renderMatrix(sorted)}
  `;
}).catch(e=>{app.innerHTML='<div class="panel">Ошибка загрузки market data: '+esc(e.message)+'</div>';});
