<?php

declare(strict_types=1);

namespace Brammo\Content\Test\TestCase\View\Helper;

use Brammo\Content\View\Helper\VideoHelper;
use Cake\TestSuite\TestCase;
use Cake\View\View;

/**
 * App\View\Helper\VideoHelper Test Case
 */
class VideoHelperTest extends TestCase
{
    /**
     * Test subject
     *
     * @var \App\View\Helper\VideoHelper
     */
    protected VideoHelper $VideoHelper;

    /**
     * setUp method
     *
     * @return void
     */
    public function setUp(): void
    {
        parent::setUp();
        $view = new View();
        $this->VideoHelper = new VideoHelper($view);
    }

    /**
     * tearDown method
     *
     * @return void
     */
    public function tearDown(): void
    {
        unset($this->VideoHelper);
        parent::tearDown();
    }

    /**
     * Test embed method with valid YouTube URL
     *
     * @return void
     */
    public function testEmbedWithYouTubeUrl(): void
    {
        $url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
        $result = $this->VideoHelper->embed($url);

        $this->assertStringContainsString('iframe', $result);
        $this->assertStringContainsString('youtube', $result);
        $this->assertStringContainsString('allowfullscreen', $result);
    }

    /**
     * Test embed method with Vimeo URL
     *
     * @return void
     */
    public function testEmbedWithVimeoUrl(): void
    {
        $url = 'https://vimeo.com/123456789';
        $result = $this->VideoHelper->embed($url);

        $this->assertStringContainsString('iframe', $result);
        $this->assertStringContainsString('vimeo', $result);
    }

    /**
     * Test embed method with invalid URL
     *
     * @return void
     */
    public function testEmbedWithInvalidUrl(): void
    {
        $url = 'https://example.com/not-a-video';
        $result = $this->VideoHelper->embed($url);

        $this->assertEmpty($result);
    }

    /**
     * Test embed method with autoplay option
     *
     * @return void
     */
    public function testEmbedWithAutoplay(): void
    {
        $url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
        $result = $this->VideoHelper->embed($url, ['autoplay' => true]);

        $this->assertStringContainsString('iframe', $result);
        $this->assertStringContainsString('autoplay', $result);
    }

    /**
     * Test embed method with custom params
     *
     * @return void
     */
    public function testEmbedWithCustomParams(): void
    {
        $url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
        $result = $this->VideoHelper->embed($url, [
            'params' => ['rel' => 0, 'controls' => 1],
        ]);

        $this->assertStringContainsString('iframe', $result);
    }

    /**
     * Test embed method with custom attributes
     *
     * @return void
     */
    public function testEmbedWithCustomAttributes(): void
    {
        $url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
        $result = $this->VideoHelper->embed($url, [
            'attributes' => ['class' => 'video-frame', 'width' => '800'],
        ]);

        $this->assertStringContainsString('iframe', $result);
        $this->assertStringContainsString('class="video-frame"', $result);
        $this->assertStringContainsString('width="800"', $result);
    }

    /**
     * Test image method with valid YouTube URL
     *
     * @return void
     */
    public function testImageWithYouTubeUrl(): void
    {
        $url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
        $result = $this->VideoHelper->image($url);

        $this->assertNotNull($result);
        $this->assertStringContainsString('dQw4w9WgXcQ', $result);
    }

    /**
     * Test image method with invalid URL
     *
     * @return void
     */
    public function testImageWithInvalidUrl(): void
    {
        $url = 'https://example.com/not-a-video';
        $result = $this->VideoHelper->image($url);

        $this->assertNull($result);
    }

    /**
     * Test image method returns YouTube fallback thumbnail
     *
     * @return void
     */
    public function testImageYouTubeFallback(): void
    {
        $url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
        $result = $this->VideoHelper->image($url);

        // Should return a YouTube thumbnail URL
        $this->assertNotNull($result);
        $this->assertMatchesRegularExpression('/ytimg\.com|youtube/', $result);
    }
}
