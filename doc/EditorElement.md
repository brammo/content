# HTML Editor Element

Contenteditable WYSIWYG editor for `textarea` fields. Link and image dialogs accept a URL. File and image browsing is not included; a host plugin can pass browse URLs when it provides a `FileBrowser`.

Requires Bootstrap 5 (modals and toolbar). Icons are inline SVGs from [Tabler Icons](https://tabler.io/icons) (MIT), so no icon font is needed.

## Usage

Load the editor on the page, then give each rich-text field the `editor` class. Rendering the element more than once is safe: a textarea that already has an editor is not wrapped again.

```php
echo $this->element('Brammo/Content.editor');
echo $this->Form->control('body', ['type' => 'textarea', 'class' => 'editor']);
```

Paragraph (`<p>`) is the default block. The toolbar covers headings, inline formatting, alignment, lists, indent, links, images, tables, clear formatting, and HTML source mode.

Increase indent and Decrease indent work on the selected blocks. In a list, Increase indent moves the item into a sub-list of the item above it (the first item of a list cannot be indented), and Decrease indent moves it up one level; later items of the same sub-list become its children. Decreasing a top-level item turns it into a paragraph. Other blocks get `margin-left` in 40px steps. Tab and Shift+Tab do the same, except in tables, where they move between cells. Shift+Tab with nothing to outdent keeps its default and moves focus out of the editor.

To leave the editor with the keyboard, press Esc and then Tab (or Shift+Tab). Screen readers announce this hint on the editing area. The field's `<label>` names the editing area, and clicking it puts the caret there.

The Code button wraps the selection in `<code>`, or removes the `<code>` around the caret. It does nothing for a selection that spans several blocks or table cells.

The last toolbar button maximizes the editor to fill the browser window; click it again or press Esc to restore the inline size.

The image dialog sets URL, alt text, link URL and target, size, alignment (`float: left` or `float: right`), CSS class, and extra styles. Filling the link URL wraps the image in `<a>`; clearing it removes that link. Double-clicking an image, including a linked one, opens the image dialog. Table properties and cell properties each have a CSS class field.

Insert row and Delete row keep merged cells intact: a cell that spans the affected row grows or shrinks by one row. Merge cells widens the selection to whole cells when it only partly covers a merged one.

A table inserted while the caret is in a paragraph, heading, or preformatted block goes after that block (an empty block is replaced), because those blocks cannot contain a table. A row added next to the header row is a data row, and a column added next to the header column is a data column; a column added inside a header row gets a header cell there. Saving Table properties changes cell types only for the Header row or Header column checkbox you changed.

Bold and Italic write `<strong>` and `<em>`, from the toolbar and from Ctrl+B / Ctrl+I. `<b>` and `<i>` without attributes already in the content are converted on the next edit; ones with attributes, such as icon-font `<i class="...">`, are left alone.

Clear formatting works on the selection: it removes inline formatting (bold, italic, spans, fonts) and the styles, classes, and other attributes of the blocks the selection touches, without moving content. With nothing selected it asks first, then strips styles, classes, and spans from the whole document and keeps bold, italic, and underline. It never removes content such as iframes or comments.

To remove a link, put the caret in it and open the link dialog: its Remove link button unwraps the link and keeps its content, and saving the dialog with an empty URL does the same. There is no separate Remove link toolbar button. With an image selected, the Link button links the image and hides the Text field. Linking selected text keeps its formatting as long as the Text field is left unchanged; typing a different text replaces the selection with that text.

Format HTML (in source mode) indents block tags. A block holding only inline content stays on one line when it fits 120 characters; otherwise its content goes on its own indented line. Whitespace between tags collapses to one space, and `<pre>`, `<textarea>`, `<script>` and `<style>` content is kept as is, so formatting twice gives the same result.

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

A single field can override these settings with data attributes. `false` or `0` turns a switch off.

```php
echo $this->Form->control('summary', [
    'type' => 'textarea',
    'class' => 'editor',
    'data-editor-height' => 200,
    'data-editor-status-bar' => 'false',
    'data-editor-clean-on-paste' => 'false',
    'data-editor-table-class' => 'table',
]);
```

## Empty content and required fields

When the editing area holds nothing but empty paragraphs and line breaks, the textarea gets an empty string, so a "not empty" rule on the server works. A `required` attribute on the textarea is moved to `aria-required` on the editing area while the editor is active: the textarea is hidden, so the browser could not show its message and would block the form without one. Validate required content on the server.

## Content sanitising

Links and images only keep `http:`, `https:`, `mailto:`, `tel:`, and relative URLs; other schemes such as `javascript:` are removed. This applies to pasted HTML, the link and image dialogs, and HTML loaded from the textarea or source mode, where inline event handlers (`onclick`, `onerror`, …), `srcdoc`, and `<script>`, `<object>`, `<embed>`, `<base>`, `<meta>`, and `<link>` are removed as well. Iframes (for example video embeds) are kept when their `src` is safe.

Content can hold form fields and `<style>` elements, and the editing area sits inside your form, so the editor keeps them from acting on the page while they stay in the content:

- `formaction` and `form` attributes are removed on load.
- Fields in the content are left out of the surrounding form's data, so they cannot add to or override its own fields.
- Buttons and forms in the content do not submit or reset anything while editing.
- `<style>` elements in the content are switched off while editing and saved unchanged.

This protects the editing page only. If the form is submitted while source mode is active, the textarea's raw HTML is sent unchanged. Always sanitise stored HTML on the server (for example with HTML Purifier) before rendering it to visitors.

## JavaScript API

Each editor is registered in `window.BrammoEditor.instances` by textarea id. `new HtmlEditor(textarea, options)` returns the existing instance when that textarea already has an editor. `destroy()` copies the content back to the textarea, removes the toolbar and editing area, and restores the textarea to its original place.

```javascript
const editor = window.BrammoEditor.instances['body'];
editor.destroy();
```

## File browsing

Browsing stays off unless both `imagesUrl` and `filesUrl` are set. The page must load a `FileBrowser` constructor before this element's inline script (for example `brammo/admin` loads `file-browser.js` and passes the File Manager URLs). If it is missing, the editors still start with browsing off and a warning is logged to the console.

```php
echo $this->element('Brammo/Content.editor', [
    'imagesUrl' => '/files/browse-images',
    'filesUrl' => '/files/browse-files',
    'folder' => 'images',
    'linkFolder' => 'files',
]);
```

Without those URLs, the link and image dialogs still accept a typed URL, and the Select buttons stay hidden.
