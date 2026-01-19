# Copilot Instructions for Brammo Content Plugin

## Project Overview

CakePHP 5.x plugin providing view helpers for content manipulation: image processing, date formatting, video embedding, and country flags. Uses PHP 8.1+ with strict typing.

## Architecture

### Plugin Structure
- `src/ContentPlugin.php` - Minimal plugin bootstrap (all CakePHP hooks disabled)
- `src/View/Helper/` - View helpers are the core functionality:
  - `ImageHelper` - Image processing with Intervention Image (resize/crop/fit with auto-caching)
  - `DateHelper` - Date formatting using CakePHP's i18n (Chronos)
  - `VideoHelper` - Video embedding via dereuromark/media-embed
  - `FlagHelper` - Country flag icons via lipis/flag-icons CDN
- `templates/element/` - Reusable elements for JS libraries (lightgallery, masonry, select2)

### Key Patterns

**Helper Configuration** - All helpers use CakePHP's `$_defaultConfig` array pattern:
```php
protected array $_defaultConfig = [
    'tempFolder' => '/thumb',
    'driver' => 'auto',
];
```

**Image Caching** - ImageHelper caches processed images to webroot with path format:
- Resize: `/thumb/{width}x{height}/original/path.jpg`
- Crop: `/thumb/{width}x{height}c/original/path.jpg`
- Fit: `/thumb/{width}x{height}f/original/path.jpg`

**Driver Auto-Detection** - ImageHelper auto-detects best available driver: imagick → vips → gd

## Code Conventions

- Always use `declare(strict_types=1);`
- Namespace: `Brammo\Content\` for src, `Brammo\Content\Test\` for tests
- PHPDoc with `@var`, `@param`, `@return` for all public methods
- Type hints for all method parameters and return types
- Test files mirror source structure: `src/View/Helper/DateHelper.php` → `tests/TestCase/View/Helper/DateHelperTest.php`

## Development Commands

```bash
composer test        # Run PHPUnit tests
composer cs-check    # Check code style (CakePHP codesniffer)
composer cs-fix      # Auto-fix code style
composer analyse     # Run PHPStan + Psalm
composer stan        # PHPStan only (level 8)
composer psalm       # Psalm only
```

## Testing Approach

Tests extend `Cake\TestSuite\TestCase`. Helper tests create a bare `View` instance:
```php
protected function setUp(): void
{
    parent::setUp();
    $view = new View();
    $this->Image = new ImageHelper($view);
}
```

Use reflection to test protected methods when needed (see [ImageHelperTest.php](tests/TestCase/View/Helper/ImageHelperTest.php#L130-L140)).

## Dependencies

- **intervention/image** + **intervention/image-driver-vips** - Image processing
- **dereuromark/media-embed** - Video URL parsing and embedding
- **cakephp/cakephp** ^5.0 - Framework

## Adding New Helpers

1. Create helper in `src/View/Helper/{Name}Helper.php`
2. Add corresponding test in `tests/TestCase/View/Helper/{Name}HelperTest.php`
3. Document in `doc/{Name}Helper.md` and update `doc/Helpers.md`
4. Update `README.md` Quick Start section if user-facing
