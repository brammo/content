<?php
/**
 * Select2 element
 * Uses Select2 jQuery plugin for enhanced select boxes.
 * 
 * @var \Cake\View\View $this
 * @var string|null $selector CSS selector for the select elements
 */

// Default selector if not provided
$selector = $selector ?? '.select2';

$this->Html->css(
    [
        'https://cdn.jsdelivr.net/npm/select2@4.0.13/dist/css/select2.min.css',
        'https://cdn.jsdelivr.net/npm/select2-bootstrap-5-theme@1.3.0/dist/select2-bootstrap-5-theme.min.css'
    ], 
    ['block' => true]
);
$this->Html->script('https://cdn.jsdelivr.net/npm/select2@4.0.13/dist/js/select2.full.min.js', ['block' => true]);
?>
<?php $this->append('script') ?>
    <script>
		$(function(){
			$('<?= $selector ?>').select2({
				width: '100%',
				theme: 'bootstrap-5'
			});
		});
    </script>
<?php $this->end() ?>
