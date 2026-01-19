<?php
/**
 * Lightgallery element
 * 
 * @var \Cake\View\View $this
 * @var string $selector CSS selector for the gallery container
 * @var string $itemSelector CSS selector for the gallery items
 */

if (!isset($selector)) {
    throw new \InvalidArgumentException('Missing required $selector variable for lightgallery element');
    return;
}

if (!isset($itemSelector)) {
    throw new \InvalidArgumentException('Missing required $itemSelector variable for lightgallery element');
    return;
}

$this->Html->css(
    [
        'https://cdn.jsdelivr.net/npm/lightgallery@2.7.2/css/lightgallery.min.css',
        'https://cdn.jsdelivr.net/npm/lightgallery@2.7.2/css/lg-zoom.min.css',
        'https://cdn.jsdelivr.net/npm/lightgallery@2.7.2/css/lg-thumbnail.min.css'
    ], 
    ['block' => true]
);
$this->Html->script(
    [
        'https://cdn.jsdelivr.net/npm/lightgallery@2.7.2/lightgallery.min.js',
        'https://cdn.jsdelivr.net/npm/lightgallery@2.7.2/plugins/zoom/lg-zoom.min.js',
        'https://cdn.jsdelivr.net/npm/lightgallery@2.7.2/plugins/thumbnail/lg-thumbnail.min.js'
    ], 
    ['block' => true]
);
?>
<?php $this->append('script') ?>
    <script>
        lightGallery(document.querySelector('<?= $selector ?>'), {
            selector: '<?= $itemSelector ?>',
            download: false,
            plugins: [lgZoom, lgThumbnail],
            speed: 500
        });
    </script>
<?php $this->end() ?>
