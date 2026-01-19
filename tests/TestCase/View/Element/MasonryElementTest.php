<?php

declare(strict_types=1);

namespace Brammo\Content\Test\TestCase\View\Element;

use Cake\TestSuite\TestCase;
use Cake\View\View;
use InvalidArgumentException;

/**
 * Masonry Element Test Case
 */
class MasonryElementTest extends TestCase
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
        $this->expectExceptionMessage('Missing required $selector variable for masonry element');

        $this->View->element('Brammo/Content.masonry');
    }

    /**
     * Test rendering with class selector
     *
     * @return void
     */
    public function testRenderWithClassSelector(): void
    {
        $this->View->element('Brammo/Content.masonry', ['selector' => '.gallery']);

        $scriptBlock = $this->View->fetch('script');

        // Check JS files are added
        $this->assertStringContainsString('masonry-layout@4.2.2/dist/masonry.pkgd.min.js', $scriptBlock);
        $this->assertStringContainsString('imagesloaded@5/imagesloaded.pkgd.min.js', $scriptBlock);

        // Check initialization with selector
        $this->assertStringContainsString('.gallery', $scriptBlock);
        $this->assertStringContainsString('new Masonry', $scriptBlock);
        $this->assertStringContainsString('imagesLoaded', $scriptBlock);
    }

    /**
     * Test rendering with ID selector
     *
     * @return void
     */
    public function testRenderWithIdSelector(): void
    {
        $this->View->element('Brammo/Content.masonry', ['selector' => '#photo-grid']);

        $scriptBlock = $this->View->fetch('script');
        $this->assertStringContainsString('#photo-grid', $scriptBlock);
    }

    /**
     * Test that required CDN resources are included
     *
     * @return void
     */
    public function testCdnResourcesIncluded(): void
    {
        $this->View->element('Brammo/Content.masonry', ['selector' => '.grid']);

        $scriptBlock = $this->View->fetch('script');

        // Verify Masonry JS from jsdelivr CDN
        $this->assertStringContainsString('cdn.jsdelivr.net', $scriptBlock);
        $this->assertStringContainsString('masonry.pkgd.min.js', $scriptBlock);

        // Verify imagesLoaded from unpkg CDN
        $this->assertStringContainsString('unpkg.com', $scriptBlock);
        $this->assertStringContainsString('imagesloaded.pkgd.min.js', $scriptBlock);
    }

    /**
     * Test that imagesLoaded wrapper is used
     *
     * @return void
     */
    public function testImagesLoadedWrapper(): void
    {
        $this->View->element('Brammo/Content.masonry', ['selector' => '.masonry-container']);

        $scriptBlock = $this->View->fetch('script');
        $this->assertStringContainsString("imagesLoaded('.masonry-container', function(){", $scriptBlock);
    }

    /**
     * Test Masonry configuration options
     *
     * @return void
     */
    public function testMasonryConfigurationOptions(): void
    {
        $this->View->element('Brammo/Content.masonry', ['selector' => '.grid']);

        $scriptBlock = $this->View->fetch('script');

        // Verify percentPosition is enabled
        $this->assertStringContainsString('percentPosition: true', $scriptBlock);
    }

    /**
     * Test document.querySelector is used for Masonry initialization
     *
     * @return void
     */
    public function testDocumentQuerySelector(): void
    {
        $this->View->element('Brammo/Content.masonry', ['selector' => '.items']);

        $scriptBlock = $this->View->fetch('script');
        $this->assertStringContainsString("document.querySelector('.items')", $scriptBlock);
    }
}
