<?php

declare(strict_types=1);

namespace Brammo\Content\Test\TestCase\View\Element;

use Cake\TestSuite\TestCase;
use Cake\View\View;
use InvalidArgumentException;

/**
 * Sticksy Element Test Case
 */
class SticksyElementTest extends TestCase
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
        $this->expectExceptionMessage('Missing required $selector variable for sticksy element');

        $this->View->element('Brammo/Content.sticksy');
    }

    /**
     * Test rendering with class selector
     *
     * @return void
     */
    public function testRenderWithClassSelector(): void
    {
        $this->View->element('Brammo/Content.sticksy', ['selector' => '.sidebar']);

        $scriptBlock = $this->View->fetch('script');

        // Check JS file is added
        $this->assertStringContainsString('sticksy@0.2.0/dist/sticksy.min.js', $scriptBlock);

        // Check initialization with selector
        $this->assertStringContainsString('.sidebar', $scriptBlock);
        $this->assertStringContainsString('.sticksy(', $scriptBlock);
    }

    /**
     * Test rendering with ID selector
     *
     * @return void
     */
    public function testRenderWithIdSelector(): void
    {
        $this->View->element('Brammo/Content.sticksy', ['selector' => '#sticky-nav']);

        $scriptBlock = $this->View->fetch('script');
        $this->assertStringContainsString('#sticky-nav', $scriptBlock);
    }

    /**
     * Test that required CDN resource is included
     *
     * @return void
     */
    public function testCdnResourceIncluded(): void
    {
        $this->View->element('Brammo/Content.sticksy', ['selector' => '.sticky']);

        $scriptBlock = $this->View->fetch('script');

        // Verify Sticksy JS from jsdelivr CDN
        $this->assertStringContainsString('cdn.jsdelivr.net', $scriptBlock);
        $this->assertStringContainsString('sticksy.min.js', $scriptBlock);
    }

    /**
     * Test jQuery document ready wrapper is used
     *
     * @return void
     */
    public function testJQueryDocumentReadyWrapper(): void
    {
        $this->View->element('Brammo/Content.sticksy', ['selector' => '.sticky-element']);

        $scriptBlock = $this->View->fetch('script');
        $this->assertStringContainsString('$(function(){', $scriptBlock);
    }

    /**
     * Test rendering with topSpacing option
     *
     * @return void
     */
    public function testRenderWithTopSpacing(): void
    {
        $this->View->element('Brammo/Content.sticksy', [
            'selector' => '.sidebar',
            'topSpacing' => 20,
        ]);

        $scriptBlock = $this->View->fetch('script');
        $this->assertStringContainsString('"topSpacing":20', $scriptBlock);
    }

    /**
     * Test rendering with custom options
     *
     * @return void
     */
    public function testRenderWithCustomOptions(): void
    {
        $this->View->element('Brammo/Content.sticksy', [
            'selector' => '.sidebar',
            'options' => [
                'topSpacing' => 50,
                'listen' => true,
            ],
        ]);

        $scriptBlock = $this->View->fetch('script');
        $this->assertStringContainsString('"topSpacing":50', $scriptBlock);
        $this->assertStringContainsString('"listen":true', $scriptBlock);
    }

    /**
     * Test that empty options renders as empty object
     *
     * @return void
     */
    public function testEmptyOptionsRendersAsObject(): void
    {
        $this->View->element('Brammo/Content.sticksy', ['selector' => '.sticky']);

        $scriptBlock = $this->View->fetch('script');
        $this->assertStringContainsString('.sticksy({})', $scriptBlock);
    }
}
