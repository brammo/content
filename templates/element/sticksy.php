<?php
/**
 * Sticky element
 * 
 * @var \App\View\AppView $this
 */

if (!isset($selector)) {
    throw new \InvalidArgumentException('Missing required $selector variable for sticksy element');
    return;
}

// Default options to empty array
$options = $options ?? [];

// Optional topSpacing parameter
if (isset($topSpacing)) {
    $options['topSpacing'] = $topSpacing;
}

$this->Html->script('https://cdn.jsdelivr.net/npm/sticksy@0.2.0/dist/sticksy.min.js', ['block' => true]);
?>
<?php $this->append('script') ?>
    <script>
        $(function(){
            $('<?= $selector ?>').sticksy(<?= json_encode($options, JSON_FORCE_OBJECT) ?>);
        });
    </script>
<?php $this->end() ?>
