# HTML Editor Element

Contenteditable WYSIWYG editor for `textarea` fields. Link and image dialogs accept a URL. File and image browsing is not included; a host plugin can pass browse URLs when it provides a `FileBrowser`.

Requires Bootstrap 5 (modals and toolbar) and [Bootstrap Icons](https://icons.getbootstrap.com/).

## Usage

Load the editor once per page, then give each rich-text field the `editor` class:

```php
echo $this->element('Brammo/Content.editor');
echo $this->Form->control('body', ['type' => 'textarea', 'class' => 'editor']);
```

Paragraph (`<p>`) is the default block. The toolbar covers headings, inline formatting, alignment, lists, links, images, tables, clear formatting, and HTML source mode.

## Configuration

Optional `Content.Editor` settings. The host application writes them; this plugin does not load a config file.

```php
Configure::write('Content.Editor', [
    'height' => 500,
    'cleanOnPaste' => true,
    'statusBar' => true,
    'tableClass' => '',
]);
```

| Key | Default | Description |
|-----|---------|-------------|
| `height` | `500` | Content area height in pixels |
| `cleanOnPaste` | `true` | Strip pasted styles, classes, ids, and spans. Plain text is wrapped in paragraphs, one `<p>` per line. Table elements keep `class` and a whitelist of layout styles |
| `statusBar` | `true` | Status bar with the clickable element path at the cursor |
| `tableClass` | `''` | CSS class prefilled when inserting a table |

View variables passed to the element override `Content.Editor`.

## File browsing

Browsing stays off unless both `imagesUrl` and `filesUrl` are set. The page must load a `FileBrowser` constructor before this element's inline script (for example `brammo/admin` loads `file-browser.js` and passes the File Manager URLs).

```php
echo $this->element('Brammo/Content.editor', [
    'imagesUrl' => '/files/browse-images',
    'filesUrl' => '/files/browse-files',
    'folder' => 'images',
    'linkFolder' => 'files',
]);
```

Without those URLs, the link and image dialogs still accept a typed URL, and the Select buttons stay hidden.
