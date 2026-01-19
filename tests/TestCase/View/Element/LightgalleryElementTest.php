<?php

declare(strict_types=1);

namespace Brammo\Content\Test\TestCase\View\Element;

use Cake\TestSuite\TestCase;
use Cake\View\View;
use InvalidArgumentException;

/**
 * Lightgallery Element Test Case
 */
class LightgalleryElementTest extends TestCase
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
     * Test that missing selector throws exception
     *
     * @return void
     */
    public function testMissingSelectorThrowsException(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Missing required $selector variable for lightgallery element');

        $this->View->element('Brammo/Content.lightgallery', ['itemSelector' => '.item']);
    }

    /**
     * Test that missing itemSelector throws exception
     *
     * @return void
     */
    public function testMissingItemSelectorThrowsException(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Missing required $itemSelector variable for lightgallery element');

        $this->View->element('Brammo/Content.lightgallery', ['selector' => '.gallery']);
    }

    /**
     * Test rendering with required selectors
     *
     * @return void
     */
    public function testRenderWithRequiredSelectors(): void
    {
        $this->View->element('Brammo/Content.lightgallery', [
            'selector' => '.gallery',
            'itemSelector' => '.gallery-item',
        ]);

        // Check CSS files are added
        $cssBlock = $this->View->fetch('css');
        $this->assertStringContainsString('lightgallery@2.7.2/css/lightgallery.min.css', $cssBlock);
        $this->assertStringContainsString('lightgallery@2.7.2/css/lg-zoom.min.css', $cssBlock);
        $this->assertStringContainsString('lightgallery@2.7.2/css/lg-thumbnail.min.css', $cssBlock);

        // Check JS files are added
        $scriptBlock = $this->View->fetch('script');
        $this->assertStringContainsString('lightgallery@2.7.2/lightgallery.min.js', $scriptBlock);
        $this->assertStringContainsString('lightgallery@2.7.2/plugins/zoom/lg-zoom.min.js', $scriptBlock);
        $this->assertStringContainsString(
            'lightgallery@2.7.2/plugins/thumbnail/lg-thumbnail.min.js',
            $scriptBlock
        );

        // Check initialization
        $this->assertStringContainsString('.gallery', $scriptBlock);
        $this->assertStringContainsString('.gallery-item', $scriptBlock);
        $this->assertStringContainsString('lightGallery(', $scriptBlock);
    }

    /**
     * Test rendering with ID selectors
     *
     * @return void
     */
    public function testRenderWithIdSelectors(): void
    {
        $this->View->element('Brammo/Content.lightgallery', [
            'selector' => '#photo-gallery',
            'itemSelector' => 'a',
        ]);

        $scriptBlock = $this->View->fetch('script');
        $this->assertStringContainsString('#photo-gallery', $scriptBlock);
        $this->assertStringContainsString("selector: 'a'", $scriptBlock);
    }

    /**
     * Test that required CDN resources are included
     *
     * @return void
     */
    public function testCdnResourcesIncluded(): void
    {
        $this->View->element('Brammo/Content.lightgallery', [
            'selector' => '.gallery',
            'itemSelector' => '.item',
        ]);

        $cssBlock = $this->View->fetch('css');
        $scriptBlock = $this->View->fetch('script');

        // Verify jsdelivr CDN
        $this->assertStringContainsString('cdn.jsdelivr.net', $cssBlock);
        $this->assertStringContainsString('cdn.jsdelivr.net', $scriptBlock);

        // Verify lightgallery resources
        $this->assertStringContainsString('lightgallery.min.css', $cssBlock);
        $this->assertStringContainsString('lg-zoom.min.css', $cssBlock);
        $this->assertStringContainsString('lg-thumbnail.min.css', $cssBlock);
        $this->assertStringContainsString('lightgallery.min.js', $scriptBlock);
    }

    /**
     * Test lightgallery configuration options
     *
     * @return void
     */
    public function testLightgalleryConfigurationOptions(): void
    {
        $this->View->element('Brammo/Content.lightgallery', [
            'selector' => '.gallery',
            'itemSelector' => '.item',
        ]);

        $scriptBlock = $this->View->fetch('script');

        // Verify download is disabled
        $this->assertStringContainsString('download: false', $scriptBlock);

        // Verify plugins are loaded
        $this->assertStringContainsString('plugins: [lgZoom, lgThumbnail]', $scriptBlock);

        // Verify animation speed
        $this->assertStringContainsString('speed: 500', $scriptBlock);
    }

    /**
     * Test document.querySelector is used for initialization
     *
     * @return void
     */
    public function testDocumentQuerySelector(): void
    {
        $this->View->element('Brammo/Content.lightgallery', [
            'selector' => '.photos',
            'itemSelector' => '.photo',
        ]);

        $scriptBlock = $this->View->fetch('script');
        $this->assertStringContainsString("document.querySelector('.photos')", $scriptBlock);
    }
}
