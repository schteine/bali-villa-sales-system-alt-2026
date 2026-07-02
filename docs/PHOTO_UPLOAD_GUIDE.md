# Photo upload guide

Куда класть фото в репозитории:

```
photos/
```

Формат названий:

```
photos/<PhotoPrefix>-1.jpg  # обложка
photos/<PhotoPrefix>-2.jpg  # галерея
photos/<PhotoPrefix>-3.jpg
```

PhotoPrefix указан в `data/photo_prefix_map.csv` и в колонке `PhotoPrefix` файла `data/site_export_full.csv`.

Пример:

```
ID = OA-01
PhotoPrefix = OA
photos/OA-1.jpg
photos/OA-2.jpg
```

Если у проекта несколько юнитов, можно использовать один общий PhotoPrefix для всех юнитов проекта.
