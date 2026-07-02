# Bali Villa Catalog Site

Новый статический репозиторий для клиентской витрины недвижимости на Бали.

## Что внутри

- `index.html` — каталог, карточки объектов, сравнение, клиентская подборка и Investment Memo через print/PDF.
- `calculator.html` — отдельная финансовая модель по объекту с 3 сценариями.
- `markets.html` — сравнение Бали с альтернативными рынками.
- `assets/js/config.js` — настройки ссылок на Google Sheets CSV и контакт.
- `data/site_export_sample.csv` — пример клиентской выгрузки из Google Sheets.
- `data/country_compare_sample.csv` — пример таблицы сравнения рынков.
- `photos/` — папка для фото объектов по логике `ID_PREFIX-1.jpg`, `ID_PREFIX-2.jpg`.

## Как подключить Google Sheets

1. В Google Sheets создай вкладку `site_export` с колонками как в `data/site_export_sample.csv`.
2. Опубликуй вкладку в CSV: `File → Share → Publish to web → CSV`.
3. Вставь ссылку в `assets/js/config.js` в поле `CSV_URL`.
4. Оставь `FALLBACK_CSV_URL: 'data/site_export_sample.csv'`, чтобы сайт работал даже без live-таблицы.

## Как сделать клиентскую подборку

1. Открой каталог.
2. Отметь 2–5 объектов.
3. Нажми `Создать ссылку для клиента`.
4. Отправь клиенту ссылку вида:

```text
https://yourdomain.com/?ids=OA-01,UE-01,SF-01
```

Клиент увидит только выбранные варианты.

## Как сделать PDF Investment Memo

1. Открой карточку объекта.
2. Нажми `Investment memo`.
3. Нажми `Скачать PDF / Печать`.
4. В браузере выбери `Save as PDF`.

## Деплой на GitHub Pages

1. Создай новый репозиторий, например `bali-villa-catalog-site`.
2. Загрузи все файлы из этой папки.
3. В GitHub: `Settings → Pages → Deploy from branch → main / root`.
4. Через 1–2 минуты сайт будет доступен по ссылке GitHub Pages.

## Важно

Сайт не должен получать всю внутреннюю базу. Он работает только с клиентской выгрузкой `site_export`.


## Update 2

Добавлено:

- полный экспорт всех объектов из текущей таблицы: `data/site_export_full.csv`;
- статусы объектов: `Available`, `Reserved`, `Sold`, `Archive`, `Draft`;
- фильтр статуса на сайте;
- карта фото: `data/photo_prefix_map.csv`;
- инструкция загрузки фото: `docs/PHOTO_UPLOAD_GUIDE.md`;
- визуальная финмодель: KPI, bars, cashflow chart, payback chart, expense breakdown, sensitivity heatmap.

По умолчанию сайт показывает только `Available` и `Reserved`. Проданные, архивные и черновые объекты скрыты, но доступны через фильтр `Архив / Sold / Draft` или `Все статусы`.

## v4 Market comparison

`markets.html` now uses `data/market_compare_snapshot.csv` and renders a visual comparison of Bali, Dubai, Phuket and Batumi based on the provided market snapshot.

The page includes:
- quick verdict cards;
- market cards by country;
- yield and entry budget charts;
- sales usage notes;
- detailed comparison matrix.

Before sending to clients, refresh tax/visa/legal assumptions for the exact year and property type.
