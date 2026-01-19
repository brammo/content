# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **Select2 Element** - Enhanced select boxes with searchable dropdowns
  - Bootstrap 5 theme styling
  - Configurable CSS selector
  - Automatic CDN resource loading
- **Masonry Element** - Responsive grid layouts with automatic positioning
  - imagesLoaded integration for proper image handling
  - Percentage-based positioning for responsive layouts
  - Automatic CDN resource loading
- **Sticksy Element** - Sticky/fixed position elements while scrolling
  - Configurable top spacing
  - Custom options support
  - Automatic CDN resource loading
- **Lightgallery Element** - Image and video lightbox galleries
  - Zoom and thumbnail plugins included
  - Configurable container and item selectors
  - Automatic CDN resource loading

## [1.0.0] - 2025-12-29

### Added

- **DateHelper** - Format dates and date ranges in human-readable, localized format
  - `nice()` - Format a single date
  - `range()` - Format date ranges with smart formatting
- **ImageHelper** - Process and cache images with Intervention Image
  - `resize()` - Scale images while maintaining aspect ratio
  - `crop()` - Crop images to exact dimensions from center
  - `fit()` - Fit images within dimensions with background fill
  - `getDriverInfo()` - Get available image processing drivers
  - Support for GD, ImageMagick, and libvips drivers
- **VideoHelper** - Embed videos from popular platforms
  - `embed()` - Generate iframe embed code
  - `image()` - Get video thumbnail URL
  - Support for YouTube, Vimeo, and many other platforms
- Full documentation in `/doc` directory
- PHPUnit test suite
- PHPStan and Psalm static analysis
- CakePHP code sniffer integration
