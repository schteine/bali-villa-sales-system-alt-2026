# Photo structure v8

## Project covers for catalog

Put one main image per project here:

```text
photos/projects/<PhotoPrefix>.jpg
```

Examples:

```text
photos/projects/K.jpg
photos/projects/OA.jpg
photos/projects/UE.jpg
photos/projects/SF.jpg
photos/projects/AR.jpg
```

These images are used on the catalog project cards.

## Unit photos for project detail page

Put unit-specific photos here:

```text
photos/units/<ID>-1.jpg
photos/units/<ID>-2.jpg
photos/units/<ID>-3.jpg
photos/units/<ID>-4.jpg
```

Examples:

```text
photos/units/UE-01-1.jpg
photos/units/UE-01-2.jpg
photos/units/UE-02-1.jpg
photos/units/UE-03-1.jpg
photos/units/K-03-1.jpg
```

When switching 1BR / 2BR / 3BR / 4BR inside a project, the page uses the selected unit ID.

## Fallbacks supported by the site

The site checks multiple possible names, in this order:

For catalog cards:

```text
photos/projects/<PhotoPrefix>.jpg
photos/projects/<project-slug>.jpg
photos/<PhotoPrefix>-cover.jpg
photos/<PhotoPrefix>-1.jpg
photos/<ID>-1.jpg
```

For unit detail/gallery:

```text
photos/units/<ID>-1.jpg
photos/<ID>-1.jpg
photos/units/<PhotoPrefix>-<Bedrooms>BR-1.jpg
photos/<PhotoPrefix>-<Bedrooms>BR-1.jpg
photos/projects/<PhotoPrefix>-1.jpg
photos/<PhotoPrefix>-1.jpg
```

Recommended: use the first two structures only:

```text
photos/projects/<PhotoPrefix>.jpg
photos/units/<ID>-1.jpg
```
