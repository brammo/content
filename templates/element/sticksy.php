<?php
/**
 * Sticky element (requires jQuery loaded before the script block)
 *
 * @var \Cake\View\View $this
 * @var string $selector CSS selector for the sticky elements
 * @var array<string, mixed>|null $options Sticksy options
 * @var int|null $topSpacing Optional top spacing in pixels
 */

if (!isset($selector)) {
    throw new \InvalidArgumentException('Missing required $selector variable for sticksy element');
}

// Default options to empty array
$options = $options ?? [];
$jsonFlags = JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT;

// Optional topSpacing parameter
if (isset($topSpacing)) {
    $options['topSpacing'] = $topSpacing;
}

$this->Html->script('https://cdn.jsdelivr.net/npm/sticksy@0.2.0/dist/sticksy.min.js', ['block' => true]);
?>
<?php $this->append('script') ?>
    <script>
        $(function(){
            $(<?= json_encode((string)$selector, $jsonFlags) ?>).sticksy(<?= json_encode($options, JSON_FORCE_OBJECT | $jsonFlags) ?>);
        });
    </script>
<?php $this->end() ?>
