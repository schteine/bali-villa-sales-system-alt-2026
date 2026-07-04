# ROI display logic v14

Goal: avoid a client-facing situation where our model usually looks more optimistic than the developer's ROI.

## Labels
- Developer: the developer / presentation case.
- Checked: our risk-adjusted estimate.
- Stress: downside case.

## Checked ROI
Raw model is calculated from ADR, occupancy, expenses and price when data exists:

`ADR × Occupancy × 365 × (1 - ExpensesRatio) / PriceUSD`

Client-facing Checked ROI is capped:

`CheckedROI = min(RawModelROI, DeveloperROI × ConfidenceFactor)`

Confidence factor:
- ready / operating: about 0.96
- near completion: about 0.92
- under construction: about 0.88
- off-plan / far delivery: about 0.84
- remote / emerging locations: additional haircut

## Stress ROI
Stress ROI is a further haircut from Checked ROI, adjusted by stage and location.

This makes the model more credible: the developer scenario remains visible, while our number is deliberately more cautious.
