# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## Unreleased

### Added

- **SeoHelper** - SEO meta tags, canonical links, Open Graph/Twitter tags, and JSON-LD structured data
  - `canonical()`, `robots()`, `description()`, `openGraph()`, `jsonLd()`, and `head()` methods
  - JSON-LD presets: `schemaWebSite()`, `schemaOrganization()`, `schemaWebPage()`, `schemaArticle()`, `schemaBreadcrumbList()`
  - Site-wide defaults via config (`siteName`, `twitterSite`, `locale`, `organization`)
- **Open Graph Element** - Open Graph and Twitter Card meta tags for social sharing previews
  - Required `$title` with optional description, image, URL, and site metadata
  - Delegates to `SeoHelper::openGraph()`; auto-loads Seo helper if needed
  - Relative image and URL paths converted to absolute URLs
  - Twitter Card tags with sensible defaults (`summary_large_image` when an image is set)

## [1.1.1] - 2026-05-23

- GitHub Actions CI workflow (PHPUnit, code style, PHPStan, and Psalm on PHP 8.2 and 8.3)
- Minimal `tests/test_app/` TestApp for integration tests that need `WWW_ROOT`
- `composer generate-test-image` script to regenerate the ImageHelper test fixture
- `AGENTS.md` contributor guide for plugin layout, conventions, and quality checks

### Changed

- Minimum PHP version is now 8.2 (was 8.1)
- **ImageHelper** auto driver selection priority is **vips → imagick → gd** (aligned with documentation)
- `composer check` now runs static analysis (`composer analyse`) in addition to tests and code style

### Documentation

- README Quick Start includes FlagHelper
- Security notes for template elements (inline JS selectors must be static/trusted)
- Expanded testing documentation and ImageHelper loading examples

## [1.1.0] - 2026-01-24

### Added

- **FlagHelper** - Display country flags using lipis/flag-icons CDN
  - `icon()` - Generate flag icon HTML from ISO 3166-1 alpha-2 country code
  - Automatic CSS loading with SRI integrity
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
