<?php
/**
 * Masonry layout element
 *
 * @var \Cake\View\View $this
 * @var string $selector CSS selector for the masonry container
 */

if (!isset($selector)) {
    throw new \InvalidArgumentException('Missing required $selector variable for masonry element');
}

$jsonFlags = JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT;

$this->Html->script(
    [
        'https://cdn.jsdelivr.net/npm/masonry-layout@4.2.2/dist/masonry.pkgd.min.js',
        'https://cdn.jsdelivr.net/npm/imagesloaded@5.0.0/imagesloaded.pkgd.min.js'
    ],
    ['block' => true]
);
?>
<?php $this->append('script') ?>
    <script>
        document.addEventListener('DOMContentLoaded', function() {
            const container = document.querySelector(<?= json_encode((string)$selector, $jsonFlags) ?>);
            if (!container) {
                return;
            }
            imagesLoaded(container, function(){
                new Masonry(container, {
                    percentPosition: true
                });
            });
        });
    </script>
<?php $this->end() ?>
