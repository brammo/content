# Content plugin for CakePHP

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

A [CakePHP](https://cakephp.org/) plugin for content manipulation including image processing, date formatting, and video embedding.

## Requirements

- PHP 8.1+
- CakePHP 5.0+

## Documentation

- [Installation](/doc/Installation.md)
- [Helpers](/doc/Helpers.md)
  - [DateHelper](/doc/DateHelper.md)
  - [ImageHelper](/doc/ImageHelper.md)
  - [VideoHelper](/doc/VideoHelper.md)
- [Elements](/doc/Elements.md)
  - [Select2](/doc/Select2Element.md)
  - [Masonry](/doc/MasonryElement.md)
  - [Sticksy](/doc/SticksyElement.md)
  - [Lightgallery](/doc/LightgalleryElement.md)
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
```

## License

This plugin is licensed under the [MIT License](LICENSE).

## Author

Roman Sidorkin - [roman.sidorkin@gmail.com](mailto:roman.sidorkin@gmail.com)
