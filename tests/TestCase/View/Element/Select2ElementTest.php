<?php

declare(strict_types=1);

namespace Brammo\Content\Test\TestCase\View\Element;

use Cake\TestSuite\TestCase;
use Cake\View\View;

/**
 * Select2 Element Test Case
 */
class Select2ElementTest extends TestCase
{
    /**
     * Test subject
     *
     * @var \Cake\View\View
     */
    protected View $View;

    /**
     * setUp method
     *
     * @return void
     */
    public function setUp(): void
    {
        parent::setUp();
        $this->View = new View();
    }

    /**
     * tearDown method
     *
     * @return void
     */
    public function tearDown(): void
    {
        unset($this->View);
        parent::tearDown();
    }

    /**
     * Test rendering with default selector
     *
     * @return void
     */
    public function testRenderWithDefaultSelector(): void
    {
        $result = $this->View->element('Brammo/Content.select2');

        // Check CSS files are added
        $cssBlock = $this->View->fetch('css');
        $this->assertStringContainsString('select2@4.0.13/dist/css/select2.min.css', $cssBlock);
        $this->assertStringContainsString(
            'select2-bootstrap-5-theme@1.3.0/dist/select2-bootstrap-5-theme.min.css',
            $cssBlock
        );

        // Check script block contains JS file and initialization with default selector
        $scriptBlock = $this->View->fetch('script');
        $this->assertStringContainsString('select2@4.0.13/dist/js/select2.full.min.js', $scriptBlock);
        $this->assertStringContainsString(".select2", $scriptBlock);
        $this->assertStringContainsString("select2({", $scriptBlock);
        $this->assertStringContainsString("theme: 'bootstrap-5'", $scriptBlock);
        $this->assertStringContainsString("width: '100%'", $scriptBlock);
    }

    /**
     * Test rendering with custom selector
     *
     * @return void
     */
    public function testRenderWithCustomSelector(): void
    {
        $result = $this->View->element('Brammo/Content.select2', ['selector' => '.my-custom-select']);

        // Check script block contains initialization with custom selector
        $scriptBlock = $this->View->fetch('script');
        $this->assertStringContainsString(".my-custom-select", $scriptBlock);
        $this->assertStringContainsString("select2({", $scriptBlock);
    }

    /**
     * Test rendering with ID selector
     *
     * @return void
     */
    public function testRenderWithIdSelector(): void
    {
        $result = $this->View->element('Brammo/Content.select2', ['selector' => '#product-category']);

        $scriptBlock = $this->View->fetch('script');
        $this->assertStringContainsString("#product-category", $scriptBlock);
    }

    /**
     * Test that required CDN resources are included
     *
     * @return void
     */
    public function testCdnResourcesIncluded(): void
    {
        $this->View->element('Brammo/Content.select2');

        $cssBlock = $this->View->fetch('css');
        $scriptBlock = $this->View->fetch('script');

        // Verify Select2 CSS from jsdelivr CDN
        $this->assertStringContainsString('cdn.jsdelivr.net', $cssBlock);
        $this->assertStringContainsString('select2.min.css', $cssBlock);

        // Verify Bootstrap 5 theme CSS
        $this->assertStringContainsString('select2-bootstrap-5-theme.min.css', $cssBlock);

        // Verify Select2 JS
        $this->assertStringContainsString('select2.full.min.js', $scriptBlock);
    }

    /**
     * Test that jQuery document ready wrapper is used
     *
     * @return void
     */
    public function testJQueryDocumentReadyWrapper(): void
    {
        $this->View->element('Brammo/Content.select2');

        $scriptBlock = $this->View->fetch('script');
        $this->assertStringContainsString('$(function(){', $scriptBlock);
    }

    /**
     * Test Select2 configuration options
     *
     * @return void
     */
    public function testSelect2ConfigurationOptions(): void
    {
        $this->View->element('Brammo/Content.select2');

        $scriptBlock = $this->View->fetch('script');

        // Verify width is set to 100%
        $this->assertStringContainsString("width: '100%'", $scriptBlock);

        // Verify Bootstrap 5 theme is applied
        $this->assertStringContainsString("theme: 'bootstrap-5'", $scriptBlock);
    }
}
