# Elements

The Content plugin provides reusable view elements for common JavaScript functionality.

## Security

Elements accept CSS selectors (e.g. `selector`, `itemSelector`) that are output into inline JavaScript. Pass **static, trusted selectors only** (e.g. `.gallery`, `#sidebar`). Do not pass raw user input — that can lead to XSS.

## Select2

Enhanced select boxes with searchable dropdowns using Bootstrap 5 styling.

```php
<?= $this->element('Brammo/Content.select2') ?>

// With custom selector
<?= $this->element('Brammo/Content.select2', ['selector' => '#my-select']) ?>
```

[Full Select2 documentation](Select2Element.md)

## Masonry

Responsive grid layouts with automatic positioning using Masonry and imagesLoaded.

```php
<?= $this->element('Brammo/Content.masonry', ['selector' => '.grid']) ?>
```

[Full Masonry documentation](MasonryElement.md)

## Sticksy

Sticky/fixed position elements that stay visible while scrolling.

```php
<?= $this->element('Brammo/Content.sticksy', ['selector' => '.sidebar']) ?>

// With top spacing
<?= $this->element('Brammo/Content.sticksy', ['selector' => '.sidebar', 'topSpacing' => 20]) ?>
```

[Full Sticksy documentation](SticksyElement.md)

## Lightgallery

Beautiful image and video lightbox galleries with zoom and thumbnails.

```php
<?= $this->element('Brammo/Content.lightgallery', [
    'selector' => '.gallery',
    'itemSelector' => '.gallery-item',
]) ?>
```

[Full Lightgallery documentation](LightgalleryElement.md)
