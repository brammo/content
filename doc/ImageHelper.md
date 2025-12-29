# ImageHelper

Process and cache images with automatic resizing, cropping, and fitting operations. Supports GD, ImageMagick, and libvips image processing libraries via [Intervention Image](https://image.intervention.io/).

## Usage

Load the helper in your `AppView.php`:

```php
public function initialize(): void
{
    parent::initialize();
    
    // Load individual helpers
    $this->loadHelper('Brammo/Image.Image');
}
```

Load with custom configuration

```php
$this->loadHelper('Brammo/Image.Image', [
    'tempFolder' => '/cache/images',  // Cache folder (relative to webroot)
    'driver' => 'auto',               // 'auto', 'imagick', 'vips', or 'gd'
    'backgroundColor' => '#ffffff',   // Background color for fit method
]);
```

### Configuration Options

| Option | Default | Description |
|--------|---------|-------------|
| `tempFolder` | `/thumb` | Directory to store cached images (relative to webroot) |
| `driver` | `auto` | Image processing driver. Auto-detection priority: imagick > vips > gd |
| `backgroundColor` | `#ffffff` | Background fill color for the `fit` method (hex code) |

### Methods

#### resize()

Scale image to fit within specified dimensions while maintaining aspect ratio.

```php
// Resize to fit within 200x200 (maintains aspect ratio)
echo $this->Image->resize('/images/photo.jpg', 200, 200);
// Returns: /thumb/200x200/images/photo.jpg

// Square shorthand (height = width)
echo $this->Image->resize('/images/photo.jpg', 200);

// Convert to WebP format
echo $this->Image->resize('/images/photo.jpg', 200, 200, 'webp');
// Returns: /thumb/200x200/images/photo.webp
```

#### crop()

Crop image to exact dimensions from center. Image is scaled to cover the target dimensions, then center-cropped.

```php
// Crop to exactly 100x100
echo $this->Image->crop('/images/photo.jpg', 100, 100);
// Returns: /thumb/100x100c/images/photo.jpg

// Square shorthand
echo $this->Image->crop('/images/photo.jpg', 100);
```

#### fit()

Fit image within dimensions and fill remaining space with background color.

```php
// Fit within 300x200, pad with white background
echo $this->Image->fit('/images/photo.jpg', 300, 200);
// Returns: /thumb/300x200f/images/photo.jpg

// Custom background color (configured in helper options)
$this->loadHelper('Brammo/Image.Image', [
    'backgroundColor' => '#000000',  // Black background
]);
```

#### getDriverInfo()

Get information about available image processing drivers.

```php
$info = $this->Image->getDriverInfo();
// Returns:
// [
//     'driver' => 'imagick',  // Currently selected driver
//     'available' => [
//         'imagick' => true,
//         'vips' => false,
//         'gd' => true,
//     ],
// ]
```

### Cache Path Structure

Processed images are cached with the following path structure:

```
{tempFolder}/{width}x{height}{suffix}/{original/path/structure}/{filename}.{format}
```

| Method | Suffix | Example |
|--------|--------|---------|
| resize | (none) | `/thumb/200x200/images/products/photo.jpg` |
| crop | `c` | `/thumb/200x200c/images/products/photo.jpg` |
| fit | `f` | `/thumb/200x200f/images/products/photo.jpg` |

The original directory structure is preserved to avoid filename collisions from different folders.

### Supported Formats

| Format | Extension |
|--------|-----------|
| JPEG | `jpg`, `jpeg` |
| PNG | `png` |
| GIF | `gif` |
| WebP | `webp` |
| AVIF | `avif` |
| BMP | `bmp` |

### Error Handling

- If the source image doesn't exist, the original path is returned
- If processing fails, the original path is returned
- If the cache directory is not writable, a `RuntimeException` is thrown

### Example Usage in Templates

```php
// Product thumbnails
<img src="<?= $this->Image->crop('/images/products/' . $product->image, 150, 150) ?>" 
     alt="<?= h($product->name) ?>">

// Responsive image with WebP
<picture>
    <source srcset="<?= $this->Image->resize('/images/hero.jpg', 1200, 600, 'webp') ?>" type="image/webp">
    <img src="<?= $this->Image->resize('/images/hero.jpg', 1200, 600) ?>" alt="Hero image">
</picture>

// Avatar with square crop
<img src="<?= $this->Image->crop($user->avatar ?? '/images/default-avatar.png', 50) ?>" 
     class="rounded-circle" alt="<?= h($user->name) ?>">
```
