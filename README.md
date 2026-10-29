# Content plugin for CakePHP

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

A [CakePHP](https://cakephp.org/) plugin with view helpers for image processing, date formatting, video embedding, country flags, and SEO tags (canonical, robots, Open Graph/Twitter, JSON-LD), plus reusable elements for Select2, Masonry, Sticksy, lightGallery, Open Graph, and a WYSIWYG HTML editor.

## Requirements

- PHP 8.2+
- CakePHP 5.3+

## Documentation

- [Installation](/doc/Installation.md)
- [Helpers](/doc/Helpers.md)
  - [DateHelper](/doc/DateHelper.md)
  - [ImageHelper](/doc/ImageHelper.md)
  - [VideoHelper](/doc/VideoHelper.md)
  - [FlagHelper](/doc/FlagHelper.md)
  - [SeoHelper](/doc/SeoHelper.md)
- [Elements](/doc/Elements.md)
  - [Select2](/doc/Select2Element.md)
  - [Masonry](/doc/MasonryElement.md)
  - [Sticksy](/doc/SticksyElement.md)
  - [Lightgallery](/doc/LightgalleryElement.md)
  - [Open Graph](/doc/OgElement.md)
  - [HTML Editor](/doc/EditorElement.md)
- [Testing](/doc/Testing.md)
- [Changelog](/CHANGELOG.md)

## Quick Start

```bash
composer require brammo/content
```

```php
// In Application.php
$this->addPlugin('Brammo/Content');

// In AppView.php
$this->loadHelper('Brammo/Content.Date');
$this->loadHelper('Brammo/Content.Image');
$this->loadHelper('Brammo/Content.Video');
$this->loadHelper('Brammo/Content.Flag');
$this->loadHelper('Brammo/Content.Seo');
```

## License

This plugin is licensed under the [MIT License](LICENSE).

## Author

Roman Sidorkin - [roman.sidorkin@gmail.com](mailto:roman.sidorkin@gmail.com)
