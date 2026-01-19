# Elements

The Content plugin provides reusable view elements for common JavaScript functionality.

## Select2

Enhanced select boxes with searchable dropdowns using Bootstrap 5 styling.

```php
<?= $this->element('Brammo/Content.select2') ?>

// With custom selector
<?= $this->element('Brammo/Content.select2', ['selector' => '#my-select']) ?>
```

[Full Select2 documentation](Select2Element.md)
