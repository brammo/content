# DateHelper

Format dates and date ranges in a human-readable, localized format using CakePHP's internationalization features.

## Usage

Load the helper in your `AppView.php`:

```php
public function initialize(): void
{
    parent::initialize();
    
    $this->loadHelper('Brammo/Content.Date');
}
```

### Methods

#### nice()

Returns a nicely formatted date in `d MMMM yyyy` format (e.g., "15 June 2025").

```php
// With DateTime object
echo $this->Date->nice(new DateTime('2025-06-15'));
// Returns: 15 June 2025

// With Date object
echo $this->Date->nice(new Date('2025-12-25'));
// Returns: 25 December 2025

// With string
echo $this->Date->nice('2025-01-01');
// Returns: 1 January 2025
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `$date` | `Date\|DateTime\|string` | The date to format |

**Returns:** `string` - Formatted date string

#### range()

Returns a formatted date range with smart formatting based on whether dates share the same month or year.

```php
// Same date - returns single date
echo $this->Date->range('2025-06-15', '2025-06-15');
// Returns: 15 June 2025

// Same month - compact format
echo $this->Date->range('2025-06-10', '2025-06-15');
// Returns: 10 – 15 June 2025

// Different months, same year
echo $this->Date->range('2025-06-28', '2025-07-05');
// Returns: 28 June – 5 July 2025

// Different years - full format for both dates
echo $this->Date->range('2025-12-28', '2026-01-05');
// Returns: 28 December 2025 – 5 January 2026
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `$startDate` | `DateTime\|string` | The start date of the range |
| `$endDate` | `DateTime\|string` | The end date of the range |

**Returns:** `string` - Formatted date range string

### Format Reference

The helper uses ICU date formatting patterns:

| Pattern | Description | Example |
|---------|-------------|---------|
| `d` | Day of month | 1, 15, 31 |
| `MMMM` | Full month name | January, June |
| `yyyy` | 4-digit year | 2025 |

### Localization

Date formatting respects CakePHP's locale settings. Configure the locale in your application to display dates in different languages:

```php
// In your bootstrap or controller
use Cake\I18n\I18n;

I18n::setLocale('nl_NL');  // Dutch
I18n::setLocale('de_DE');  // German
I18n::setLocale('fr_FR');  // French
```
