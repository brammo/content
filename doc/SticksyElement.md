# Sticksy Element

Create sticky/fixed position elements that stay visible while scrolling using [Sticksy.js](https://github.com/kovart/sticksy).

## Usage

Include the element in your template with a required selector:

```php
<?= $this->element('Brammo/Content.sticksy', ['selector' => '.sidebar']) ?>
```

**Note:** The `$selector` variable is required. An `InvalidArgumentException` will be thrown if not provided.

## Example

```php
// In your template
<div class="container">
    <div class="row">
        <div class="col-8">
            <main>
                <!-- Main content -->
            </main>
        </div>
        <div class="col-4">
            <aside class="sidebar">
                <!-- This sidebar will stick while scrolling -->
            </aside>
        </div>
    </div>
</div>

<?= $this->element('Brammo/Content.sticksy', ['selector' => '.sidebar']) ?>
```

### With Top Spacing

Add spacing from the top of the viewport:

```php
<?= $this->element('Brammo/Content.sticksy', [
    'selector' => '.sidebar',
    'topSpacing' => 20,
]) ?>
```

### With Custom Options

Pass additional Sticksy options:

```php
<?= $this->element('Brammo/Content.sticksy', [
    'selector' => '#sticky-nav',
    'options' => [
        'topSpacing' => 50,
        'listen' => true,
    ],
]) ?>
```

## Variables

| Variable | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `$selector` | `string` | Yes | - | CSS selector for sticky elements |
| `$topSpacing` | `int` | No | `0` | Space from top of viewport (shorthand) |
| `$options` | `array` | No | `[]` | Additional Sticksy configuration options |

## Sticksy Options

Common options you can pass via the `$options` array:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `topSpacing` | `int` | `0` | Space in pixels from top of viewport |
| `listen` | `bool` | `false` | Re-calculate on window resize |

## Included Resources

The element automatically includes from CDN:

**JavaScript:**
- `sticksy@0.2.0/dist/sticksy.min.js` (jsdelivr)

## Requirements

- jQuery must be loaded before this element

## View Blocks

The element adds resources to the following view block:

| Block | Content |
|-------|---------|
| `script` | Sticksy JS library and initialization code |

Make sure your layout outputs this block:

```php
// In your layout
<?= $this->fetch('script') ?>
```

## Notes

- The sticky element should have a parent container that defines the scrollable area
- Works best with sidebar layouts where the sidebar is shorter than the main content
- Consider using `topSpacing` when you have a fixed header/navbar
