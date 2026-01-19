# Lightgallery Element

Create beautiful image and video lightbox galleries using [lightGallery](https://www.lightgalleryjs.com/).

## Usage

Include the element in your template with required selectors:

```php
<?= $this->element('Brammo/Content.lightgallery', [
    'selector' => '.gallery',
    'itemSelector' => '.gallery-item',
]) ?>
```

**Note:** Both `$selector` and `$itemSelector` are required. An `InvalidArgumentException` will be thrown if either is missing.

## Example

```php
// In your template
<div class="gallery">
    <a href="/images/photo1-large.jpg" class="gallery-item">
        <img src="/images/photo1-thumb.jpg" alt="Photo 1">
    </a>
    <a href="/images/photo2-large.jpg" class="gallery-item">
        <img src="/images/photo2-thumb.jpg" alt="Photo 2">
    </a>
    <a href="/images/photo3-large.jpg" class="gallery-item">
        <img src="/images/photo3-thumb.jpg" alt="Photo 3">
    </a>
</div>

<?= $this->element('Brammo/Content.lightgallery', [
    'selector' => '.gallery',
    'itemSelector' => '.gallery-item',
]) ?>
```

### With ID Selector

```php
<div id="photo-gallery">
    <a href="/images/large.jpg" class="item">
        <img src="/images/thumb.jpg" alt="Photo">
    </a>
</div>

<?= $this->element('Brammo/Content.lightgallery', [
    'selector' => '#photo-gallery',
    'itemSelector' => '.item',
]) ?>
```

### Simple Anchor Links

```php
<div class="gallery">
    <a href="/images/photo1.jpg"><img src="/images/thumb1.jpg"></a>
    <a href="/images/photo2.jpg"><img src="/images/thumb2.jpg"></a>
</div>

<?= $this->element('Brammo/Content.lightgallery', [
    'selector' => '.gallery',
    'itemSelector' => 'a',
]) ?>
```

## Variables

| Variable | Type | Required | Description |
|----------|------|----------|-------------|
| `$selector` | `string` | Yes | CSS selector for the gallery container |
| `$itemSelector` | `string` | Yes | CSS selector for clickable gallery items |

## Default Configuration

The element applies the following configuration:

| Option | Value | Description |
|--------|-------|-------------|
| `download` | `false` | Download button is disabled |
| `plugins` | `[lgZoom, lgThumbnail]` | Zoom and thumbnail plugins enabled |
| `speed` | `500` | Animation speed in milliseconds |

## Included Plugins

The element includes two lightGallery plugins:

- **lgZoom** - Allows zooming in/out on images
- **lgThumbnail** - Shows thumbnail navigation at the bottom

## Included Resources

The element automatically includes from CDN (jsdelivr):

**CSS:**
- `lightgallery@2.7.2/css/lightgallery.min.css`
- `lightgallery@2.7.2/css/lg-zoom.min.css`
- `lightgallery@2.7.2/css/lg-thumbnail.min.css`

**JavaScript:**
- `lightgallery@2.7.2/lightgallery.min.js`
- `lightgallery@2.7.2/plugins/zoom/lg-zoom.min.js`
- `lightgallery@2.7.2/plugins/thumbnail/lg-thumbnail.min.js`

## View Blocks

The element adds resources to the following view blocks:

| Block | Content |
|-------|---------|
| `css` | lightGallery CSS and plugin styles |
| `script` | lightGallery JS, plugins, and initialization code |

Make sure your layout outputs these blocks:

```php
// In your layout
<?= $this->fetch('css') ?>
<?= $this->fetch('script') ?>
```

## HTML Structure

For lightGallery to work correctly, your gallery items should:

1. Be anchor (`<a>`) elements or contain anchor elements
2. Have `href` pointing to the full-size image
3. Contain thumbnail images inside

```html
<div class="gallery">
    <a href="/path/to/large-image.jpg" class="gallery-item">
        <img src="/path/to/thumbnail.jpg" alt="Description">
    </a>
</div>
```
