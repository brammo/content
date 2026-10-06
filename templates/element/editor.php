<?php
/**
 * HTML editor element
 *
 * Upgrades every textarea.editor on the page to a contenteditable WYSIWYG editor.
 * File and image browsing stays off unless both $imagesUrl and $filesUrl are set.
 *
 * Settings precedence: view variables, then Configure Content.Editor, then defaults.
 *
 * @var \Cake\View\View $this
 * @var int|null $height
 * @var bool|null $cleanOnPaste
 * @var bool|null $statusBar
 * @var string|null $tableClass
 * @var string|null $imagesUrl
 * @var string|null $filesUrl
 * @var string|null $folder
 * @var string|null $linkFolder
 * @var string|null $fileBrowserModal
 * @var string|null $fileBrowserTitle
 */

use Cake\Core\Configure;

$settings = Configure::read('Content.Editor');
if (!is_array($settings)) {
    $settings = [];
}

$height = $height ?? $settings['height'] ?? 500;
$cleanOnPaste = $cleanOnPaste ?? $settings['cleanOnPaste'] ?? true;
$statusBar = $statusBar ?? $settings['statusBar'] ?? true;
$tableClass = $tableClass ?? $settings['tableClass'] ?? '';

$imagesUrl = $imagesUrl ?? '';
$filesUrl = $filesUrl ?? '';
$browse = $imagesUrl !== '' && $filesUrl !== '';
$folder = $folder ?? 'images';
$linkFolder = $linkFolder ?? 'files';
$fileBrowserModal = $fileBrowserModal ?? '#editor-file-browser-modal';
$fileBrowserTitle = $fileBrowserTitle ?? __d('brammo/content', 'Select Image');

$labels = [
    'blockFormat' => __d('brammo/content', 'Block format'),
    'paragraph' => __d('brammo/content', 'Paragraph'),
    'heading1' => __d('brammo/content', 'Heading 1'),
    'heading2' => __d('brammo/content', 'Heading 2'),
    'heading3' => __d('brammo/content', 'Heading 3'),
    'heading4' => __d('brammo/content', 'Heading 4'),
    'heading5' => __d('brammo/content', 'Heading 5'),
    'heading6' => __d('brammo/content', 'Heading 6'),
    'div' => __d('brammo/content', 'Div'),
    'blockquote' => __d('brammo/content', 'Blockquote'),
    'pre' => __d('brammo/content', 'Preformatted'),
    'bold' => __d('brammo/content', 'Bold'),
    'italic' => __d('brammo/content', 'Italic'),
    'underline' => __d('brammo/content', 'Underline'),
    'strikethrough' => __d('brammo/content', 'Strikethrough'),
    'subscript' => __d('brammo/content', 'Subscript'),
    'superscript' => __d('brammo/content', 'Superscript'),
    'code' => __d('brammo/content', 'Code'),
    'alignLeft' => __d('brammo/content', 'Align left'),
    'alignCenter' => __d('brammo/content', 'Align center'),
    'alignRight' => __d('brammo/content', 'Align right'),
    'alignJustify' => __d('brammo/content', 'Justify'),
    'unorderedList' => __d('brammo/content', 'Bulleted list'),
    'orderedList' => __d('brammo/content', 'Numbered list'),
    'link' => __d('brammo/content', 'Insert link'),
    'linkDialogTitle' => __d('brammo/content', 'Insert link'),
    'linkEditTitle' => __d('brammo/content', 'Edit link'),
    'linkUrl' => __d('brammo/content', 'Link URL'),
    'linkText' => __d('brammo/content', 'Link text'),
    'linkTitle' => __d('brammo/content', 'Title'),
    'linkTarget' => __d('brammo/content', 'Target'),
    'linkTargetDefault' => __d('brammo/content', 'Same window'),
    'linkTargetBlank' => __d('brammo/content', 'New window'),
    'linkTargetSelf' => __d('brammo/content', 'Same frame (_self)'),
    'linkTargetParent' => __d('brammo/content', 'Parent frame (_parent)'),
    'linkTargetTop' => __d('brammo/content', 'Top frame (_top)'),
    'linkSelect' => __d('brammo/content', 'Select'),
    'linkBrowseTitle' => __d('brammo/content', 'Select file'),
    'linkBack' => __d('brammo/content', 'Back'),
    'linkInsert' => __d('brammo/content', 'Insert'),
    'linkSave' => __d('brammo/content', 'Save'),
    'imageBrowse' => __d('brammo/content', 'Insert image'),
    'imageDialogTitle' => __d('brammo/content', 'Insert image'),
    'imageSrc' => __d('brammo/content', 'Image URL'),
    'imageAlt' => __d('brammo/content', 'Alt text'),
    'imageWidth' => __d('brammo/content', 'Width'),
    'imageHeight' => __d('brammo/content', 'Height'),
    'imageStyles' => __d('brammo/content', 'Styles'),
    'imageSelect' => __d('brammo/content', 'Select'),
    'imageBrowseTitle' => __d('brammo/content', 'Select Image'),
    'imageBack' => __d('brammo/content', 'Back'),
    'imageInsert' => __d('brammo/content', 'Insert'),
    'imageEditTitle' => __d('brammo/content', 'Edit image'),
    'imageSave' => __d('brammo/content', 'Save'),
    'cancel' => __d('brammo/content', 'Cancel'),
    'clearFormat' => __d('brammo/content', 'Clear formatting'),
    'clearFormatConfirm' => __d('brammo/content', 'Clear formatting from the entire document?'),
    'source' => __d('brammo/content', 'Edit HTML'),
    'formatSource' => __d('brammo/content', 'Format HTML'),
    'undo' => __d('brammo/content', 'Undo'),
    'redo' => __d('brammo/content', 'Redo'),
    'elementPath' => __d('brammo/content', 'Element path'),
    'table' => __d('brammo/content', 'Table'),
    'tableDialogTitle' => __d('brammo/content', 'Insert table'),
    'tableEditTitle' => __d('brammo/content', 'Edit table'),
    'tableInsert' => __d('brammo/content', 'Insert'),
    'tableSave' => __d('brammo/content', 'Save'),
    'tableProperties' => __d('brammo/content', 'Table properties'),
    'tableRows' => __d('brammo/content', 'Rows'),
    'tableColumns' => __d('brammo/content', 'Columns'),
    'tableHeaderRow' => __d('brammo/content', 'Header row'),
    'tableHeaderColumn' => __d('brammo/content', 'Header column'),
    'tableCaption' => __d('brammo/content', 'Caption'),
    'tableWidth' => __d('brammo/content', 'Width'),
    'tableAlign' => __d('brammo/content', 'Alignment'),
    'tableAlignDefault' => __d('brammo/content', 'Default'),
    'tableClass' => __d('brammo/content', 'CSS class'),
    'tableStyles' => __d('brammo/content', 'Styles'),
    'insertRowAbove' => __d('brammo/content', 'Insert row above'),
    'insertRowBelow' => __d('brammo/content', 'Insert row below'),
    'insertColumnLeft' => __d('brammo/content', 'Insert column left'),
    'insertColumnRight' => __d('brammo/content', 'Insert column right'),
    'deleteRow' => __d('brammo/content', 'Delete row'),
    'deleteColumn' => __d('brammo/content', 'Delete column'),
    'deleteTable' => __d('brammo/content', 'Delete table'),
    'mergeCells' => __d('brammo/content', 'Merge cells'),
    'splitCell' => __d('brammo/content', 'Split cell'),
    'cellProperties' => __d('brammo/content', 'Cell properties'),
    'cellWidth' => __d('brammo/content', 'Width'),
    'cellHeight' => __d('brammo/content', 'Height'),
    'cellAlign' => __d('brammo/content', 'Text align'),
    'cellValign' => __d('brammo/content', 'Vertical align'),
    'cellValignTop' => __d('brammo/content', 'Top'),
    'cellValignMiddle' => __d('brammo/content', 'Middle'),
    'cellValignBottom' => __d('brammo/content', 'Bottom'),
    'cellBackground' => __d('brammo/content', 'Background'),
    'cellType' => __d('brammo/content', 'Cell type'),
    'cellTypeData' => __d('brammo/content', 'Data cell'),
    'cellTypeHeader' => __d('brammo/content', 'Header cell'),
    'cellSave' => __d('brammo/content', 'Save'),
];

$jsonFlags = JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT;

$this->Html->css('Brammo/Content.editor', ['block' => true]);
$this->Html->script('Brammo/Content.editor', ['block' => true]);

$this->append('script');
?>
<script>
    document.addEventListener('DOMContentLoaded', function() {
        const height = <?= (int)$height ?>;
        const cleanOnPaste = <?= $cleanOnPaste ? 'true' : 'false' ?>;
        const statusBar = <?= $statusBar ? 'true' : 'false' ?>;
        const tableClass = <?= json_encode((string)$tableClass, $jsonFlags) ?>;
        const labels = <?= json_encode($labels, $jsonFlags) ?>;

        window.BrammoEditor = window.BrammoEditor || { instances: {} };

        <?php if ($browse) : ?>
        const browseUrl = <?= json_encode($imagesUrl, $jsonFlags) ?>;
        const filesBrowseUrl = <?= json_encode($filesUrl, $jsonFlags) ?>;
        const modalTitle = <?= json_encode($fileBrowserTitle, $jsonFlags) ?>;
        const fileBrowser = new FileBrowser(
            <?= json_encode($fileBrowserModal, $jsonFlags) ?>,
            modalTitle
        );
        <?php endif; ?>

        document.querySelectorAll('textarea.editor').forEach(function(textarea) {
            new HtmlEditor(textarea, {
                height: height,
                cleanOnPaste: cleanOnPaste,
                statusBar: statusBar,
                tableClass: tableClass,
                labels: labels,
                <?php if ($browse) : ?>
                browseUrl: browseUrl,
                filesBrowseUrl: filesBrowseUrl,
                fileBrowser: fileBrowser,
                folder: <?= json_encode($folder, $jsonFlags) ?>,
                linkFolder: <?= json_encode($linkFolder, $jsonFlags) ?>,
                <?php endif; ?>
            });
        });
    });
</script>
<?php $this->end() ?>
