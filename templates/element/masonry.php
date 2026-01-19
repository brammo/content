<?php
/**
 * Masonry layout element
 * 
 * @var \Cake\View\View $this
 * @var string $selector CSS selector for the masonry container
 */

if (!isset($selector)) {
    throw new \InvalidArgumentException('Missing required $selector variable for masonry element');
    return;
}

$this->Html->script(
    [
        'https://cdn.jsdelivr.net/npm/masonry-layout@4.2.2/dist/masonry.pkgd.min.js',
        'https://unpkg.com/imagesloaded@5/imagesloaded.pkgd.min.js'
    ],
    ['block' => true]
);
?>
<?php $this->append('script') ?>
    <script>
        imagesLoaded('<?= $selector ?>', function(){
            new Masonry(document.querySelector('<?= $selector ?>'), {
                percentPosition: true
            });
        });
    </script>
<?php $this->end() ?>
