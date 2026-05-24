<?php

declare(strict_types=1);

namespace Brammo\Content\Test\TestCase\View\Element;

use Cake\Http\ServerRequest;
use Cake\TestSuite\TestCase;
use Cake\View\View;
use InvalidArgumentException;

/**
 * Open Graph Element Test Case
 */
class OgElementTest extends TestCase
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
        $this->View = new View(null, null, null, [
            'request' => new ServerRequest([
                'environment' => [
                    'REQUEST_URI' => '/articles/example',
                    'HTTP_HOST' => 'localhost',
                ],
            ]),
        ]);
        $this->View->loadHelper('Brammo/Content.Seo');
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
     * Test that missing title throws exception
     *
     * @return void
     */
    public function testMissingTitleThrowsException(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Missing required $title variable for og element');

        $this->View->element('Brammo/Content.og');
    }

    /**
     * Test that empty title throws exception
     *
     * @return void
     */
    public function testEmptyTitleThrowsException(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Missing required $title variable for og element');

        $this->View->element('Brammo/Content.og', ['title' => '']);
    }

    /**
     * Test rendering required Open Graph tags
     *
     * @return void
     */
    public function testRenderRequiredOpenGraphTags(): void
    {
        $result = $this->View->element('Brammo/Content.og', ['title' => 'Example Page']);

        $this->assertStringContainsString('property="og:title"', $result);
        $this->assertStringContainsString('content="Example Page"', $result);
        $this->assertStringContainsString('property="og:type"', $result);
        $this->assertStringContainsString('content="website"', $result);
        $this->assertStringContainsString('property="og:url"', $result);
        $this->assertStringContainsString('content="http://localhost/"', $result);
    }

    /**
     * Test rendering optional Open Graph tags
     *
     * @return void
     */
    public function testRenderOptionalOpenGraphTags(): void
    {
        $result = $this->View->element('Brammo/Content.og', [
            'title' => 'Article Title',
            'description' => 'Article summary',
            'type' => 'article',
            'siteName' => 'My Site',
            'locale' => 'en_US',
            'url' => 'https://example.com/articles/1',
            'image' => 'https://example.com/images/cover.jpg',
            'imageWidth' => 1200,
            'imageHeight' => 630,
            'imageAlt' => 'Cover image',
        ]);

        $this->assertStringContainsString('property="og:description"', $result);
        $this->assertStringContainsString('content="Article summary"', $result);
        $this->assertStringContainsString('property="og:type"', $result);
        $this->assertStringContainsString('content="article"', $result);
        $this->assertStringContainsString('property="og:site_name"', $result);
        $this->assertStringContainsString('content="My Site"', $result);
        $this->assertStringContainsString('property="og:locale"', $result);
        $this->assertStringContainsString('content="en_US"', $result);
        $this->assertStringContainsString('property="og:image"', $result);
        $this->assertStringContainsString('content="https://example.com/images/cover.jpg"', $result);
        $this->assertStringContainsString('property="og:image:width"', $result);
        $this->assertStringContainsString('content="1200"', $result);
        $this->assertStringContainsString('property="og:image:height"', $result);
        $this->assertStringContainsString('content="630"', $result);
        $this->assertStringContainsString('property="og:image:alt"', $result);
        $this->assertStringContainsString('content="Cover image"', $result);
    }

    /**
     * Test relative image and url paths are converted to absolute URLs
     *
     * @return void
     */
    public function testRelativePathsAreConvertedToAbsoluteUrls(): void
    {
        $result = $this->View->element('Brammo/Content.og', [
            'title' => 'Example Page',
            'url' => '/about',
            'image' => '/images/share.png',
        ]);

        $this->assertStringContainsString('content="http://localhost/about"', $result);
        $this->assertStringContainsString('content="http://localhost/images/share.png"', $result);
    }

    /**
     * Test Twitter Card tags
     *
     * @return void
     */
    public function testRenderTwitterCardTags(): void
    {
        $result = $this->View->element('Brammo/Content.og', [
            'title' => 'Example Page',
            'description' => 'Page description',
            'image' => 'https://example.com/share.jpg',
            'twitterSite' => '@example',
        ]);

        $this->assertStringContainsString('name="twitter:card"', $result);
        $this->assertStringContainsString('content="summary_large_image"', $result);
        $this->assertStringContainsString('name="twitter:title"', $result);
        $this->assertStringContainsString('name="twitter:description"', $result);
        $this->assertStringContainsString('name="twitter:image"', $result);
        $this->assertStringContainsString('name="twitter:site"', $result);
        $this->assertStringContainsString('content="@example"', $result);
    }

    /**
     * Test summary twitter card when no image is provided
     *
     * @return void
     */
    public function testSummaryTwitterCardWithoutImage(): void
    {
        $result = $this->View->element('Brammo/Content.og', ['title' => 'Example Page']);

        $this->assertStringContainsString('name="twitter:card"', $result);
        $this->assertStringContainsString('content="summary"', $result);
        $this->assertStringNotContainsString('name="twitter:image"', $result);
    }

    /**
     * Test Twitter overrides
     *
     * @return void
     */
    public function testTwitterOverrides(): void
    {
        $result = $this->View->element('Brammo/Content.og', [
            'title' => 'Page Title',
            'description' => 'Page description',
            'image' => 'https://example.com/og.jpg',
            'twitterCard' => 'summary',
            'twitterTitle' => 'Twitter Title',
            'twitterDescription' => 'Twitter description',
            'twitterImage' => 'https://example.com/twitter.jpg',
        ]);

        $this->assertStringContainsString('name="twitter:card"', $result);
        $this->assertStringContainsString('content="summary"', $result);
        $this->assertStringContainsString('content="Twitter Title"', $result);
        $this->assertStringContainsString('content="Twitter description"', $result);
        $this->assertStringContainsString('content="https://example.com/twitter.jpg"', $result);
    }

    /**
     * Test HTML escaping of attribute values
     *
     * @return void
     */
    public function testHtmlEscaping(): void
    {
        $result = $this->View->element('Brammo/Content.og', [
            'title' => 'Title with "quotes" & ampersand',
            'description' => 'Description with <tags>',
        ]);

        $this->assertStringContainsString('Title with &quot;quotes&quot; &amp; ampersand', $result);
        $this->assertStringContainsString('Description with &lt;tags&gt;', $result);
    }
}
