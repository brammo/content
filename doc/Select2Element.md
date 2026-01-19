# Select2 Element

Enhance select boxes with searchable dropdowns using the [Select2](https://select2.org/) jQuery plugin with Bootstrap 5 styling.

## Usage

Include the element in your template:

```php
<?= $this->element('Brammo/Content.select2') ?>
```

This will initialize Select2 on all elements matching the `.select2` class.

### Custom Selector

Target specific elements using a custom selector:

```php
// By class
<?= $this->element('Brammo/Content.select2', ['selector' => '.my-select']) ?>

// By ID
<?= $this->element('Brammo/Content.select2', ['selector' => '#category-select']) ?>

// Multiple classes
<?= $this->element('Brammo/Content.select2', ['selector' => '.product-select, .user-select']) ?>
```

## Example

```php
// In your template
<select class="select2" name="category">
    <option value="">Select a category...</option>
    <option value="1">Electronics</option>
    <option value="2">Clothing</option>
    <option value="3">Books</option>
</select>

<?= $this->element('Brammo/Content.select2') ?>
```

### Multiple Selection

```php
<select class="select2" name="tags[]" multiple>
    <option value="php">PHP</option>
    <option value="js">JavaScript</option>
    <option value="python">Python</option>
</select>

<?= $this->element('Brammo/Content.select2') ?>
```

## Configuration

The element applies the following default configuration:

| Option | Value | Description |
|--------|-------|-------------|
| `width` | `'100%'` | Select box takes full width of container |
| `theme` | `'bootstrap-5'` | Uses Bootstrap 5 styling |

## Variables

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `$selector` | `string` | `'.select2'` | CSS selector for elements to enhance |

## Included Resources

The element automatically includes from CDN:

**CSS:**
- `select2@4.0.13/dist/css/select2.min.css`
- `select2-bootstrap-5-theme@1.3.0/dist/select2-bootstrap-5-theme.min.css`

**JavaScript:**
- `select2@4.0.13/dist/js/select2.full.min.js`

## Requirements

- jQuery must be loaded before this element
- Bootstrap 5 for proper theme styling

## View Blocks

The element adds resources to the following view blocks:

| Block | Content |
|-------|---------|
| `css` | Select2 CSS and Bootstrap 5 theme |
| `script` | Select2 JS library and initialization code |

Make sure your layout outputs these blocks:

```php
// In your layout
<?= $this->fetch('css') ?>
<?= $this->fetch('script') ?>
```
