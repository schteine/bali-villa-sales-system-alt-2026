# Tourism market assumptions — v13

Sources used:
- BPS Bali: Number of Foreign Visitor to Indonesia and Bali, 1969–2025.
- BPS Bali: Number of Monthly Foreign Visitor to Bali by Gate, 2025 and 2026.
- Bali Government Tourism Office / BPS table: Number of Domestic Visitor to Bali by Month, 2004–2025.
- BPS Bali: Average Length of Stay of Domestic / Foreign Guest at Classified Hotels, 2026.
- Telegram @Bali_expert is treated as secondary market commentary and should not override official BPS inputs.

## Key findings

1. Foreign tourism is still structurally strong:
   - Bali foreign visitors 2025: 6,948,754.
   - Growth vs 2024: +9.72%.
   - Indonesia foreign visitors 2025: 15,386,646.
   - Bali captured about 45.16% of Indonesia foreign arrivals in 2025.

2. 2026 foreign arrivals are not accelerating in Jan-May:
   - Jan-May 2025: 2,644,879.
   - Jan-May 2026: 2,598,143.
   - Change: -1.77%.
   - Model rule: do not automatically add a market-growth uplift to every object.

3. Domestic tourism softened in 2025:
   - Domestic visitors 2024: 10,120,786.
   - Domestic visitors 2025: 9,612,511.
   - Change: -5.02%.
   - Model rule: local demand supports weekends/holidays, but should not justify high annual occupancy in weak or remote locations by itself.

4. Length of stay supports short-stay rental, but domestic and foreign behavior differs:
   - Foreign classified-hotel LOS Jan-May 2026: ~3.13 nights.
   - Domestic classified-hotel LOS Jan-May 2026: ~2.42 nights.
   - Model rule: domestic demand has shorter stays; foreign demand is more important for premium villa ADR.

## Finance model rules

DeveloperROI:
- The number claimed by the developer / presentation.
- Do not calculate this field.

ModelROI:
- Our internal operating model:
  ModelROI = ADR × Occupancy × 365 × (1 - ExpensesRatio) / PriceUSD

ConservativeROI:
- Stress scenario:
  ADR -10%
  Occupancy -10 percentage points
  Expenses +5 percentage points
  Stage risk factor:
    ready = 0.95
    soon = 0.90
    under construction = 0.88
    off-plan = 0.82

Occupancy defaults used only where source occupancy is missing:
- Pererenan / Canggu / Uluwatu / Bingin: 76%
- Jimbaran / Pandawa / Nusa Dua / Melasti: 72%
- Ubud: 70%
- Umalas / Tumbak Bayuh: 74%
- Tabanan / Kedungu: 65%
- Karangasem / Bedugul: 58%

## Practical conclusion

The market is positive long term, but 2026 should be modeled carefully:
- Do not apply the same ROI to all projects.
- Do not use foreign-arrival growth as automatic rental growth.
- Separate developer claims from our model and conservative scenario.
- Use location, ADR evidence, and project stage as the main risk filters.
