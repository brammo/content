# Elements

The Content plugin provides reusable view elements for common JavaScript functionality.

## Security

Elements accept CSS selectors (e.g. `selector`, `itemSelector`) that are output into inline JavaScript as JSON strings, so quotes such as `[data-role='grid']` are safe. Still pass **static, trusted selectors only** (e.g. `.gallery`, `#sidebar`): jQuery's `$()` turns a string that looks like HTML into elements, so raw user input can lead to XSS.

## View variables

Like any CakePHP element, these elements also see the view variables set by the controller. An optional element variable you do not pass (for example `$description` or `$image` in `og`, `$height` in `editor`) falls back to a view variable of the same name when one exists. Pass `null` explicitly, or call `SeoHelper::openGraph()` directly, when the page sets view variables with those names for other purposes.

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

## Open Graph

Open Graph and Twitter Card meta tags for social sharing previews.

```php
<?= $this->element('Brammo/Content.og', [
    'title' => 'My Page Title',
    'description' => 'A short summary of the page.',
    'image' => '/images/share.jpg',
]) ?>
```

[Full Open Graph documentation](OgElement.md)

## HTML Editor

Contenteditable rich text for `textarea.editor` fields. Link and image dialogs take a URL. File browsing is optional and off by default.

```php
echo $this->element('Brammo/Content.editor');
echo $this->Form->control('body', ['type' => 'textarea', 'class' => 'editor']);
```

[Full HTML editor documentation](EditorElement.md)
