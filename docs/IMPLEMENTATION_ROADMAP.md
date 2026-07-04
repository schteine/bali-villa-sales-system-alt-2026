# Implementation roadmap

## Phase 1 — Data architecture

Goal: separate internal database from client-facing website data.

Tasks:
- Keep full internal master in Google Sheets.
- Create `site_export` tab for public/client data only.
- Create `finance_model_input` tab for model assumptions.
- Create `scoring_weights` tab for score weights.
- Normalize percentages: store 12% as `0.12`, display as `12%`.

## Phase 2 — Scoring

Weights:
- Legal / DD — 25%
- Realistic ROI — 18%
- Location + liquidity — 18%
- Leasehold term + extension — 17%
- Project stage / construction risk — 12%
- Payment plan / cashflow — 5%
- Uniqueness / concept / view — 5%

## Phase 3 — Website cards

Add to each card:
- Developer ROI / Model ROI / Conservative ROI.
- Why this object.
- Fits client.
- Red flags.
- Legal ownership explanation.

## Phase 4 — Client shortlist

User flow:
- Select 2–5 objects.
- Generate `?ids=` link.
- Send to client.
- Client sees only selected objects.

## Phase 5 — Investment Memo

PDF structure:
- Object snapshot.
- Key parameters.
- ROI scenarios.
- Why this object.
- Client fit.
- Legal ownership structure.
- Red flags.
- Next step.

## Phase 6 — Finance model

Add:
- optimistic/base/conservative scenarios;
- break-even ADR;
- break-even occupancy;
- cash-on-cash;
- sensitivity table.

## Phase 7 — Alternative markets

Compare Bali with:
- Thailand;
- Vietnam;
- UAE.

Use only updated assumptions before client-facing usage.
