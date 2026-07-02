const app=document.getElementById('marketApp');
function fmtMoney(n){n=Number(n);return isFinite(n)?'$'+Math.round(n).toLocaleString('ru-RU'):'—'}
function fmtPct(v){v=Number(v);return isFinite(v)?(v*100).toFixed(1).replace('.',',')+'%':'—'}
function esc(s){return String(s||'').replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));}
fetch('data/country_compare_sample.csv').then(r=>r.text()).then(t=>{
  const rows=csvToObjects(t);
  app.innerHTML=`<h2>Сравнение рынков</h2><div class="tableBox"><table>
    <tr><th>Market</th><th>Entry ticket</th><th>Typical net ROI</th><th>Legal</th><th>Liquidity</th><th>Management</th><th>Growth</th><th>Risk</th><th>Best for</th><th>Notes</th></tr>
    ${rows.map(r=>`<tr><td><b>${esc(r.Market)}</b></td><td>${fmtMoney(r.EntryTicketUSD)}</td><td>${fmtPct(r.TypicalNetROI)}</td><td>${esc(r.LegalComplexity)}</td><td>${esc(r.Liquidity)}</td><td>${esc(r.ManagementComplexity)}</td><td>${esc(r.GrowthPotential)}</td><td>${esc(r.RiskLevel)}</td><td>${esc(r.BestFor)}</td><td>${esc(r.Notes)}</td></tr>`).join('')}
  </table></div><p class="note">Все значения в этом файле — шаблонные assumptions. Перед отправкой клиенту обновить по актуальным источникам и сегменту рынка.</p>`;
}).catch(e=>{app.innerHTML='Ошибка загрузки market data: '+esc(e.message);});
