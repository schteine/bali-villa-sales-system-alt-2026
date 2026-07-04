# ROI Display Logic V15

## Purpose

V15 changes ROI presentation so the client sees the checked internal estimate first.

## Display order

1. Checked ROI / Наша оценка ROI — primary number.
2. Developer ROI / Застройщик — secondary reference.
3. Stress ROI / Стресс — downside scenario.

## Logic

Checked ROI is capped against the developer case and adjusted by stage, location, ROI source and market risk.

This avoids a trust problem where the internal model looks more optimistic than the developer's own numbers.
