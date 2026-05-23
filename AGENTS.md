# Agent instructions — Brammo Content

CakePHP 5 plugin (`Brammo/Content`) for view helpers and reusable template elements. No routes, middleware, or app bootstrap logic — keep changes inside plugin boundaries.

## Layout

| Path | Purpose |
|------|---------|
| `src/ContentPlugin.php` | Plugin class; all Cake hooks disabled |
| `src/View/Helper/` | Date, Image, Video, Flag helpers |
| `templates/element/` | masonry, select2, sticksy, lightgallery |
| `tests/TestCase/` | PHPUnit tests mirroring `src/` |
| `tests/test_app/` | Minimal Cake app for `WWW_ROOT` and bootstrap |
| `doc/` | User-facing helper/element documentation |

## Conventions

- `declare(strict_types=1);` in every PHP file
- Namespace `Brammo\Content\` (source), `Brammo\Content\Test\` (tests)
- Helpers: `$_defaultConfig`, PHPDoc on public methods, typed parameters and returns
- Tests: extend `Cake\TestSuite\TestCase`; mirror paths (`src/View/Helper/X.php` → `tests/TestCase/View/Helper/XTest.php`)
- Load helpers in host app as `Brammo/Content.{Name}` (e.g. `Brammo/Content.Image`)
- Render elements as `Brammo/Content.{name}` (e.g. `Brammo/Content.masonry`)

## Commands (run before opening a PR)

```bash
composer install
composer test
composer cs-check
composer analyse
```

`composer check` runs tests and code style. Use `composer cs-fix` only when fixing style locally.

## ImageHelper

- **Cache paths** (under `tempFolder`, default `/thumb`):
  - resize: `{tempFolder}/{W}x{H}/{original/path}.{ext}`
  - crop: `{tempFolder}/{W}x{H}c/...`
  - fit: `{tempFolder}/{W}x{H}f/...`
- **Auto driver** (when `driver` is `auto`): **vips → imagick → gd**
- Missing source file or processing error: return original web path (no exception to callers)
- Requires `WWW_ROOT` (defined in host app or `tests/test_app/webroot/`)
- Test fixture: `tests/test_app/webroot/images/test.png` — regenerate with `composer generate-test-image`

## Adding a helper

1. `src/View/Helper/{Name}Helper.php`
2. `tests/TestCase/View/Helper/{Name}HelperTest.php`
3. `doc/{Name}Helper.md` and link from `doc/Helpers.md`
4. Update `README.md` Quick Start if user-facing

## Adding an element

1. `templates/element/{name}.php`
2. `tests/TestCase/View/Element/{Name}ElementTest.php`
3. `doc/{Name}Element.md` and link from `doc/Elements.md`
4. Require variables with `InvalidArgumentException` when missing
5. **Selectors** passed into inline JS must be static/trusted (not raw user input)

## Do not

- Enable routes, middleware, or services on `ContentPlugin` without an explicit product decision
- Change public cache path formats without a major version bump
- Skip tests for new public helper/element behavior
- Duplicate long guidance in multiple files — update this file and keep `.github/copilot-instructions.md` as a short subset

## Dependencies

- `intervention/image`, `intervention/image-driver-vips` — ImageHelper
- `dereuromark/media-embed` — VideoHelper
- Flag icons loaded from CDN in FlagHelper (not a Composer package)
