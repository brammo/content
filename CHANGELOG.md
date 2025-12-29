# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
