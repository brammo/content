# FlagHelper

The FlagHelper displays country flags using the [lipis/flag-icons](https://github.com/lipis/flag-icons) library via CDN.

## Loading the Helper

```php
$this->loadHelper('Brammo/Content.Flag');
```

## Usage

### Display a Flag Icon

```php
echo $this->Flag->icon('us');
// Returns: <i class="flag-icon flag-icon-us"></i>

echo $this->Flag->icon('DE');
// Returns: <i class="flag-icon flag-icon-de"></i>
```

The country code is case-insensitive and will be converted to lowercase automatically.

### Invalid Codes

If an invalid ISO2 country code is provided (not exactly 2 letters), an empty string is returned:

```php
echo $this->Flag->icon('usa');  // Returns: ''
echo $this->Flag->icon('1');    // Returns: ''
```

## Configuration

The helper automatically loads the flag-icons CSS from jsDelivr CDN. You can customize this in your `AppView.php`:

```php
$this->loadHelper('Brammo/Content.Flag', [
    'cssPath' => 'https://cdn.jsdelivr.net/npm/flag-icon-css@4.1.7/css/flag-icons.min.css',
    'cssIntegrity' => 'sha256-8qup5VqQKcE2cLILwBU2zpXUkT+eW5tI1ZLzJjh/TdY=',
    'cssCrossorigin' => 'anonymous',
]);
```

| Option | Default | Description |
|--------|---------|-------------|
| `cssPath` | jsDelivr CDN URL | URL to the flag-icons CSS file |
| `cssIntegrity` | SRI hash | Subresource integrity hash for security |
| `cssCrossorigin` | `anonymous` | CORS setting for the CSS resource |

## CSS Block

The helper automatically appends the CSS `<link>` tag to the `css` view block during initialization. Make sure your layout includes this block:

```php
// In your layout
<?= $this->fetch('css') ?>
```

## Styling

Flag icons are rendered as inline elements. You can style them with CSS:

```css
/* Make flags larger */
.flag-icon {
    font-size: 2em;
}

/* Add border radius */
.flag-icon {
    border-radius: 3px;
}
```

## Country Codes

The helper uses ISO 3166-1 alpha-2 country codes. Common examples:

| Code | Country |
|------|---------|
| `us` | United States |
| `gb` | United Kingdom |
| `de` | Germany |
| `fr` | France |
| `nl` | Netherlands |
| `be` | Belgium |
| `es` | Spain |
| `it` | Italy |
| `jp` | Japan |
| `cn` | China |

For a complete list of supported flags, see the [flag-icons repository](https://github.com/lipis/flag-icons).
