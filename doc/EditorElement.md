# HTML Editor Element

Contenteditable WYSIWYG editor for `textarea` fields. Link and image dialogs accept a URL. File and image browsing is not included; a host plugin can pass browse URLs when it provides a `FileBrowser`.

Requires Bootstrap 5 (modals and toolbar). Icons are inline SVGs from [Tabler Icons](https://tabler.io/icons) (MIT), so no icon font is needed.

## Usage

Load the editor on the page, then give each rich-text field the `editor` class. Rendering the element more than once is safe: a textarea that already has an editor is not wrapped again.

```php
echo $this->element('Brammo/Content.editor');
echo $this->Form->control('body', ['type' => 'textarea', 'class' => 'editor']);
```

Paragraph (`<p>`) is the default block. The toolbar covers headings, inline formatting, alignment, lists, links, images, tables, clear formatting, and HTML source mode.

The last toolbar button maximizes the editor to fill the browser window; click it again or press Esc to restore the inline size.

The image dialog sets URL, alt text, size, alignment (`float: left` or `float: right`), CSS class, and extra styles. Table properties and cell properties each have a CSS class field.

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

Links and images only keep `http:`, `https:`, `mailto:`, `tel:`, and relative URLs; other schemes such as `javascript:` are removed. This applies to pasted HTML, the link and image dialogs, and HTML loaded from the textarea or source mode, where inline event handlers (`onclick`, `onerror`, …), `srcdoc`, and `<script>`, `<object>`, `<embed>`, `<base>`, `<meta>`, and `<link>` are removed as well. Iframes (for example video embeds) are kept when their `src` is safe. This protects the editing page only. If the form is submitted while source mode is active, the textarea's raw HTML is sent unchanged. Always sanitise stored HTML on the server (for example with HTML Purifier) before rendering it to visitors.

## JavaScript API

Each editor is registered in `window.BrammoEditor.instances` by textarea id. `new HtmlEditor(textarea, options)` returns the existing instance when that textarea already has an editor. `destroy()` copies the content back to the textarea, removes the toolbar and editing area, and restores the textarea to its original place.

```javascript
const editor = window.BrammoEditor.instances['body'];
editor.destroy();
```

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
