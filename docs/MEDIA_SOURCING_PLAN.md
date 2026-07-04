# Media sourcing plan

Цель: не загружать фото вручную по одному, а собирать их из презентаций, Google Drive и Notion застройщиков.

## Приоритет

1. Project cover для каталога: `photos/projects/<PhotoPrefix>.jpg`.
2. Unit photos для карточек: `photos/units/<ID>-1.jpg`, `photos/units/<ID>-2.jpg`.
3. Если нет unit photos, сайт автоматически использует project cover.

## Что присылать

Лучше всего прислать одну таблицу/сообщение:

```text
Project: Privé Pererenan
PhotoPrefix: UE
Units: UE-01, UE-02, UE-03, UE-04
Source: Google Drive / Notion / PDF / Presentation link
Notes: какие фото лучше использовать, если знаешь
```

## Откуда можно вытаскивать

- Google Drive folders: фото, рендеры, презентации, PDF.
- Notion pages: если есть доступ и изображения не закрыты.
- PDF / PPTX презентации: можно извлечь рендеры и выбрать обложку.

## Naming

Project covers:

```text
photos/projects/UE.jpg
photos/projects/OA.jpg
photos/projects/SF.jpg
```

Unit photos:

```text
photos/units/UE-01-1.jpg
photos/units/UE-01-2.jpg
photos/units/UE-02-1.jpg
```

## Важно

Не копируй новый архив поверх папки `photos`, если там уже есть фото. Архивы обновлений лучше копировать без удаления существующей папки `photos`.
