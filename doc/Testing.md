# Testing

## Run Tests

Run the test suite with PHPUnit:

```bash
composer test
```

## Test fixtures

ImageHelper integration tests use a PNG under `tests/test_app/webroot/images/test.png`. Regenerate it with GD (requires the `gd` extension):

```bash
composer generate-test-image
```

Or directly:

```bash
php tests/bin/generate-test-image.php
```

## Code Quality

Run code style checks:

```bash
composer cs-check
```

Fix code style issues:

```bash
composer cs-fix
```

## Static Analysis

Run PHPStan and Psalm:

```bash
composer analyse
```

Or run them individually:

```bash
composer stan
composer psalm
```
