# HTML Editor Element

Contenteditable WYSIWYG editor for `textarea` fields. Link and image dialogs accept a URL. File and image browsing is not included; a host plugin can pass browse URLs when it provides a `FileBrowser`.

Requires Bootstrap 5 (modals and toolbar). Icons are inline SVGs from [Tabler Icons](https://tabler.io/icons) (MIT), so no icon font is needed.

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

View variables passed to the element override `Content.Editor`. Controller view variables with the same names (`height`, `folder`, …) also apply, because CakePHP elements see all view variables.

## Content sanitising

Links and images only keep `http:`, `https:`, `mailto:`, `tel:`, and relative URLs; other schemes such as `javascript:` are removed. This applies to pasted HTML, the link and image dialogs, and HTML loaded from the textarea or source mode, where inline event handlers (`onclick`, `onerror`, …), `srcdoc`, and `<script>`, `<object>`, `<embed>`, `<base>`, `<meta>`, and `<link>` are removed as well. Iframes (for example video embeds) are kept when their `src` is safe. This protects the editing page; still sanitise stored HTML on the server before rendering it to visitors.

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
