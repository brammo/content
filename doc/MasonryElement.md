# Masonry Element

Create responsive grid layouts with automatic positioning using [Masonry](https://masonry.desandro.com/) and [imagesLoaded](https://imagesloaded.desandro.com/).

## Usage

Include the element in your template with a required selector:

```php
<?= $this->element('Brammo/Content.masonry', ['selector' => '.grid']) ?>
```

**Note:** The `$selector` variable is required. An `InvalidArgumentException` will be thrown if not provided.

## Example

```php
// In your template
<div class="grid">
    <div class="grid-item">
        <img src="/images/photo1.jpg" alt="Photo 1">
    </div>
    <div class="grid-item">
        <img src="/images/photo2.jpg" alt="Photo 2">
    </div>
    <div class="grid-item">
        <img src="/images/photo3.jpg" alt="Photo 3">
    </div>
</div>

<?= $this->element('Brammo/Content.masonry', ['selector' => '.grid']) ?>
```

### With ID Selector

```php
<div id="photo-gallery">
    <!-- gallery items -->
</div>

<?= $this->element('Brammo/Content.masonry', ['selector' => '#photo-gallery']) ?>
```

## Basic CSS

Add some basic CSS for the grid items:

```css
.grid-item {
    width: 33.333%;
    padding: 5px;
    box-sizing: border-box;
}

/* Responsive */
@media (max-width: 768px) {
    .grid-item {
        width: 50%;
    }
}

@media (max-width: 480px) {
    .grid-item {
        width: 100%;
    }
}
```

## Configuration

The element applies the following default configuration:

| Option | Value | Description |
|--------|-------|-------------|
| `percentPosition` | `true` | Uses percentage-based widths for responsive layouts |

## Variables

| Variable | Type | Required | Description |
|----------|------|----------|-------------|
| `$selector` | `string` | Yes | CSS selector for the masonry container |

## Included Resources

The element automatically includes from CDN:

**JavaScript:**
- `masonry-layout@4.2.2/dist/masonry.pkgd.min.js` (jsdelivr)
- `imagesloaded@5/imagesloaded.pkgd.min.js` (unpkg)

## How It Works

The element uses `imagesLoaded` to wait for all images to load before initializing Masonry. This ensures correct positioning of grid items:

```javascript
imagesLoaded('.grid', function(){
    new Masonry(document.querySelector('.grid'), {
        percentPosition: true
    });
});
```

## View Blocks

The element adds resources to the following view block:

| Block | Content |
|-------|---------|
| `script` | Masonry JS, imagesLoaded JS, and initialization code |

Make sure your layout outputs this block:

```php
// In your layout
<?= $this->fetch('script') ?>
```
