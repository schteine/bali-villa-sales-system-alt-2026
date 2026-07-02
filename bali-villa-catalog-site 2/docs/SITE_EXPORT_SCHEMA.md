# site_export schema

This is the client-facing CSV consumed by `index.html`.

Do not expose internal notes, commissions, sensitive DD comments or negotiation data here.

## Required fields

- ID
- Project
- Location
- Type
- Bedrooms
- PriceUSD
- OwnershipType
- OwnershipDetail
- OwnershipNote
- LeaseYears
- Extension
- Stage
- CompletionDate
- PaymentPlan
- DeveloperROI
- ModelROI
- ConservativeROI
- LegalScore
- WhyThisObject
- FitsClient
- RedFlags
- SalesNote
- PhotoPrefix
- Status
- UpdatedAt

## Percentage format

Store percentages as decimals:

- 12% → `0.12`
- 80% → `0.80`

The website will display them as percentages.

## Ownership display rules

Do not write only `Freehold` without explanation.

Use one of:

- Leasehold
- Leasehold + extension option
- Freehold / Hak Milik
- HGB
- Hak Pakai
- PT PMA structure
- Structure to clarify

Always include `OwnershipNote` explaining access for foreign investor and key limitation.
