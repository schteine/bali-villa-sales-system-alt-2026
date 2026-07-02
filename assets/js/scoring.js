function computedInvestorScore(item){
  const w=(window.APP_CONFIG&&window.APP_CONFIG.SCORING_WEIGHTS)||{};
  const parts=[
    [item.legalScore, w.legal||0.25],
    [item.modelROI?Math.min(100, item.modelROI/0.14*100):num(item.ModelROIScore), w.roi||0.18],
    [item.locationLiquidityScore, w.locationLiquidity||0.18],
    [item.leaseExtensionScore, w.leaseExtension||0.17],
    [item.stageRiskScore, w.stageRisk||0.12],
    [item.paymentCashflowScore, w.paymentCashflow||0.05],
    [item.uniquenessScore, w.uniqueness||0.05]
  ];
  let total=0, weight=0;
  parts.forEach(([score, wt])=>{ if(!isNaN(score)){ total += score*wt; weight += wt; } });
  return weight?Math.round(total/weight):0;
}

function scoreClass(v){
  if(v>=80) return 'good';
  if(v>=70) return 'mid';
  return 'low';
}
