# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## Unreleased

### Added

- **HTML editor** - Image dialog has alignment (`float: left` / `float: right`) and CSS class fields
- **HTML editor** - Cell properties dialog has a CSS class field
- **HTML editor** - Maximize button edits in the full browser window; Esc restores the inline size

## [1.6.0] - 2026-10-29

### Fixed

- **ImageHelper** - Resolve source paths without a leading slash (`images/photo.jpg`) instead of returning them unprocessed
- **ImageHelper** - Files in the webroot root no longer get a `//` or `/./` segment in the cache path
- **ImageHelper** - Return the original path for unsupported formats (e.g. `svg`, `tiff`) instead of saving JPEG data under the wrong extension
- **ImageHelper** - Write thumbnails to a temporary file and rename them, so concurrent requests never serve a partial image
- **SeoHelper** - `schemaBreadcrumbList()` numbers positions by item order; string or non-zero-based keys no longer throw `TypeError` or produce wrong positions
- **SeoHelper** - `schemaBreadcrumbList()`, `schemaFAQPage()`, and `schemaProduct()` `aggregateRating` throw `InvalidArgumentException` for missing required keys instead of PHP warnings
- **HTML editor** - Rendering the element twice no longer wraps a textarea in a second editor
- **HTML editor** - `new HtmlEditor(textarea)` without options no longer throws
- **lightgallery**, **masonry** elements - Wait for `DOMContentLoaded` and skip a missing container instead of throwing a JavaScript error
- **sticksy** element - Docblock no longer references the host `App\View\AppView` class

### Changed

- **ImageHelper** - Unknown `driver` names (matched case-insensitively) no longer fall back to GD silently; processing returns the original path. `getDriverInfo()['driver']` reports the configured driver instead of always the detected one
- **ImageHelper** - Log processing errors at `debug` level when `debug` is enabled
- **SeoHelper** - `canonical()` and the `openGraph()` `og:url` default to the current URL **without the query string**. Pass the URL explicitly to keep query parameters
- **SeoHelper** - New `currentUrl()` method; `jsonLd()` accepts `@graph` documents without a top-level `@type`; the `openGraph()` missing-title message now reads ``Missing required `title` option for openGraph()``
- **HTML editor** - `destroy()` copies content back, removes the editor UI, and restores the textarea
- Code style checks now cover `templates/`; CI runs PHP 8.4 and an imagick-only job; `composer.json` no longer hard-codes `version`
- Added `CLAUDE.md`

## [1.5.0] - 2026-10-24

### Changed

- **HTML editor** - Toolbar and dialog icons are inline [Tabler Icons](https://tabler.io/icons) SVGs; Bootstrap Icons is no longer required
- **ImageHelper** - Return the original path when the cache directory cannot be created or is not writable, instead of throwing `RuntimeException`
- **ImageHelper** - Regenerate a cached image when the source file is newer
- **FlagHelper** - Omit the default `integrity` hash when a custom `cssPath` is set without `cssIntegrity`; omit `integrity` and `crossorigin` when empty
- **DateHelper** - `range()` swaps reversed start and end dates
- **masonry** element - Load imagesLoaded 5.0.0 from jsDelivr instead of an unpinned unpkg URL

### Fixed

- **SeoHelper** - Escape `<` and `>` in `jsonLd()` output so values cannot close the `<script>` tag
- **HTML editor** - Drop `javascript:` and other unsafe URL schemes from pasted HTML and the link and image dialogs; strip event handlers, `srcdoc`, scripts, and unsafe URLs from HTML loaded from the textarea or source mode
- **ImageHelper** - Reject paths with `..` segments so reads and cache writes stay inside the webroot
- **DateHelper** - `range()` renders two times on the same day as a single date
- **FlagHelper** - Escape the CSS `<link>` attributes
- **lightgallery**, **masonry**, **select2**, **sticksy** elements - JSON-encode selectors in inline scripts so quoted selectors work

## [1.4.0] - 2026-10-06

### Added

- **HTML editor** — `Brammo/Content.editor` upgrades `textarea.editor` fields to a contenteditable editor (Bootstrap 5 and Bootstrap Icons). Optional `Content.Editor` settings: `height`, `cleanOnPaste`, `statusBar`, `tableClass`. Link and image dialogs accept a URL. File and image browsing stays off unless `imagesUrl` and `filesUrl` are passed for a host `FileBrowser`

## [1.3.0] - 2026-10-04

### Changed

- **DateHelper** - `nice()` and `range()` accept `null` and empty strings; `nice()` returns an empty string, and `range()` returns an empty string when the start date is missing or uses the start date when the end date is missing
- **ImageHelper** - Instantiate `VipsDriver` directly instead of via a dynamic class name so Psalm can infer the `DriverInterface` return type
- **ImageHelper** and **SeoHelper** - Tighten the `$helpers` PHPDoc array shape so static analysis can infer helper types

### Fixed

- **SeoHelper** - Treat a `null` return from `HtmlHelper::meta()` as an empty string when building meta tag output

## [1.2.0] - 2026-05-24

### Added

- **SeoHelper** - SEO meta tags, canonical links, Open Graph/Twitter tags, and JSON-LD structured data
  - `canonical()`, `robots()`, `description()`, `openGraph()`, `jsonLd()`, and `head()` methods
  - JSON-LD presets: `schemaWebSite()`, `schemaOrganization()`, `schemaWebPage()`, `schemaArticle()`, `schemaBreadcrumbList()`, `schemaProduct()`, `schemaFAQPage()`, `schemaLocalBusiness()`
  - `hreflang()`, `pagination()`, `articleMeta()`, and `themeColor()` methods
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
