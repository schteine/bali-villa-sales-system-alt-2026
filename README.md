# Bali Villa Sales System Alt 2026 — v5

Экспериментальная версия клиентского сайта для продажи недвижимости на Бали.

## Что добавлено в v5

- Переключатель языка RU / EN на всех основных страницах.
- Русские подписи и описания для каталога, финмодели и страницы рынков.
- Английская версия для международных клиентов.
- Проекты в каталоге теперь группируются: Aravita / Surfside / Privé и другие проекты показываются одной карточкой проекта, а варианты 1BR / 2BR / 3BR выбираются внутри карточки.
- Внутри карточки объекта также есть переключение между юнитами одного проекта.
- Финмодель переводит основные блоки и финансовые определения в зависимости от языка.
- Страница рынков адаптирована для RU / EN с отдельной sales-логикой.

## Как обновить GitHub

1. Распаковать архив.
2. Скопировать содержимое папки в локальный репозиторий `bali-villa-sales-system-alt-2026`.
3. Commit message: `Add bilingual UI and project grouping`.
4. Push origin.

## Фото

Фото остаются в папке:

`photos/`

Формат:

`OA-1.jpg`, `OA-2.jpg`, `UE-1.jpg`, `UE-2.jpg`.

Первое фото с `-1.jpg` используется как главное фото проекта.


## v7 fix

Language switch moved inside the main navigation as RU / EN buttons. This avoids browser/GitHub Pages layout issues where the separate language block was not visible. Assets use `?v=7` cache busting.

## Photos v8

Catalog cards use project cover images from `photos/projects/<PhotoPrefix>.jpg`.
Unit detail pages use unit images from `photos/units/<ID>-1.jpg`, `-2.jpg`, etc.
See `docs/PHOTO_STRUCTURE_V8.md`.


## v9 compact cards + safer photos

- Карточки проекта в каталоге стали компактнее: меньше chips, unit buttons, ROI boxes и текстовые блоки.
- Фото теперь ищутся по расширенному fallback: `photos/projects/PREFIX.jpg`, `photos/PREFIX.jpg`, `photos/PREFIX-1.jpg`, `photos/units/ID-1.jpg`, `photos/ID-1.jpg`.
- В архив v9 намеренно не включается папка `photos/`, чтобы при копировании не затереть уже загруженные изображения.



## v10

- Настоящий compact mode для карточек каталога.
- Chips, ROI boxes и unit picker уменьшены.
- В каталоге скрыты подробные блоки red flags / ownership; они остаются внутри карточки проекта.
- Каталог теперь работает как teaser, а детальная карточка — как investment memo.


## v11 — Gallery fix
- Detail gallery thumbnails are clickable.
- Added previous/next gallery arrows.
- Expanded detail thumbnails to 6 images where available.


## v12
- Fixed detail gallery interactions with delegated JS, clickable thumbnails, arrow navigation, keyboard navigation, and fullscreen lightbox.
- Bumped asset cache version to v12.

## v13 — ROI separation and tourism assumptions

- Recalculated `ModelROI` separately from `DeveloperROI` using: `ADR × Occupancy × 365 × (1 - ExpensesRatio) / PriceUSD`.
- Recalculated `ConservativeROI` as stress scenario: ADR -10%, occupancy -10 percentage points, expenses +5 percentage points, plus project-stage risk.
- Added `data/tourism_market_assumptions.csv` based on BPS Bali CSV exports.
- Added `docs/TOURISM_MARKET_ASSUMPTIONS_V13.md` with model rules.
- Added BPS market assumptions panel to finance model.
- Updated cache version to `v=13`.


## v14 — ROI conservative display
- Developer ROI remains the developer case.
- Checked ROI is risk-adjusted and capped below the developer case in most situations.
- Stress ROI is an additional downside haircut.
- Raw ADR/OCC math is kept internally as `rawModelROI`, but the client-facing value is `Checked`.
