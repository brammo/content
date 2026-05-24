<?php

declare(strict_types=1);

namespace Brammo\Content\Test\TestCase\View\Helper;

use Brammo\Content\View\Helper\SeoHelper;
use Cake\Http\ServerRequest;
use Cake\TestSuite\TestCase;
use Cake\View\View;
use InvalidArgumentException;

/**
 * SeoHelper Test Case
 */
class SeoHelperTest extends TestCase
{
    /**
     * Test subject
     *
     * @var \Brammo\Content\View\Helper\SeoHelper
     */
    protected SeoHelper $Seo;

    /**
     * setUp method
     *
     * @return void
     */
    public function setUp(): void
    {
        parent::setUp();
        $view = new View(null, null, null, [
            'request' => new ServerRequest([
                'environment' => [
                    'REQUEST_URI' => '/articles/example',
                    'HTTP_HOST' => 'localhost',
                ],
            ]),
        ]);
        $this->Seo = new SeoHelper($view, [
            'siteName' => 'Default Site',
            'twitterSite' => '@default',
            'locale' => 'en_GB',
        ]);
    }

    /**
     * tearDown method
     *
     * @return void
     */
    public function tearDown(): void
    {
        unset($this->Seo);
        parent::tearDown();
    }

    /**
     * Test absoluteUrl with relative path
     *
     * @return void
     */
    public function testAbsoluteUrlRelativePath(): void
    {
        $result = $this->Seo->absoluteUrl('/images/share.png');

        $this->assertSame('http://localhost/images/share.png', $result);
    }

    /**
     * Test absoluteUrl with absolute URL passthrough
     *
     * @return void
     */
    public function testAbsoluteUrlAbsolutePassthrough(): void
    {
        $url = 'https://example.com/page';
        $result = $this->Seo->absoluteUrl($url);

        $this->assertSame($url, $result);
    }

    /**
     * Test canonical defaults to current request URL
     *
     * @return void
     */
    public function testCanonicalDefaultUrl(): void
    {
        $result = $this->Seo->canonical();

        $this->assertStringContainsString('rel="canonical"', $result);
        $this->assertStringContainsString('href="http://localhost/"', $result);
    }

    /**
     * Test canonical with relative path
     *
     * @return void
     */
    public function testCanonicalRelativePath(): void
    {
        $result = $this->Seo->canonical('/about');

        $this->assertStringContainsString('href="http://localhost/about"', $result);
    }

    /**
     * Test canonical with absolute URL
     *
     * @return void
     */
    public function testCanonicalAbsoluteUrl(): void
    {
        $result = $this->Seo->canonical('https://example.com/page');

        $this->assertStringContainsString('href="https://example.com/page"', $result);
    }

    /**
     * Test robots with string directives
     *
     * @return void
     */
    public function testRobotsString(): void
    {
        $result = $this->Seo->robots('noindex,nofollow');

        $this->assertStringContainsString('name="robots"', $result);
        $this->assertStringContainsString('content="noindex,nofollow"', $result);
    }

    /**
     * Test robots with array directives
     *
     * @return void
     */
    public function testRobotsArray(): void
    {
        $result = $this->Seo->robots(['noindex', 'max-snippet:-1']);

        $this->assertStringContainsString('content="noindex,max-snippet:-1"', $result);
    }

    /**
     * Test robots with bool shorthand
     *
     * @return void
     */
    public function testRobotsBoolShorthand(): void
    {
        $result = $this->Seo->robots(index: false, follow: true);

        $this->assertStringContainsString('content="noindex,follow"', $result);
    }

    /**
     * Test robots default
     *
     * @return void
     */
    public function testRobotsDefault(): void
    {
        $result = $this->Seo->robots();

        $this->assertStringContainsString('content="index,follow"', $result);
    }

    /**
     * Test description meta tag
     *
     * @return void
     */
    public function testDescription(): void
    {
        $result = $this->Seo->description('Page summary');

        $this->assertStringContainsString('name="description"', $result);
        $this->assertStringContainsString('content="Page summary"', $result);
    }

    /**
     * Test description HTML escaping
     *
     * @return void
     */
    public function testDescriptionEscaping(): void
    {
        $result = $this->Seo->description('Description with <tags> & "quotes"');

        $this->assertStringContainsString('Description with &lt;tags&gt; &amp; &quot;quotes&quot;', $result);
    }

    /**
     * Test openGraph missing title throws exception
     *
     * @return void
     */
    public function testOpenGraphMissingTitleThrowsException(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Missing required $title variable for og element');

        $this->Seo->openGraph([]);
    }

    /**
     * Test openGraph required tags
     *
     * @return void
     */
    public function testOpenGraphRequiredTags(): void
    {
        $result = $this->Seo->openGraph(['title' => 'Example Page']);

        $this->assertStringContainsString('property="og:title"', $result);
        $this->assertStringContainsString('content="Example Page"', $result);
        $this->assertStringContainsString('property="og:type"', $result);
        $this->assertStringContainsString('content="website"', $result);
        $this->assertStringContainsString('property="og:url"', $result);
        $this->assertStringContainsString('content="http://localhost/"', $result);
    }

    /**
     * Test openGraph optional tags and config defaults
     *
     * @return void
     */
    public function testOpenGraphOptionalTagsAndConfigDefaults(): void
    {
        $result = $this->Seo->openGraph([
            'title' => 'Article Title',
            'description' => 'Article summary',
            'type' => 'article',
            'url' => 'https://example.com/articles/1',
            'image' => 'https://example.com/images/cover.jpg',
            'imageWidth' => 1200,
            'imageHeight' => 630,
            'imageAlt' => 'Cover image',
        ]);

        $this->assertStringContainsString('property="og:description"', $result);
        $this->assertStringContainsString('content="Article summary"', $result);
        $this->assertStringContainsString('content="article"', $result);
        $this->assertStringContainsString('property="og:site_name"', $result);
        $this->assertStringContainsString('content="Default Site"', $result);
        $this->assertStringContainsString('property="og:locale"', $result);
        $this->assertStringContainsString('content="en_GB"', $result);
        $this->assertStringContainsString('property="og:image"', $result);
        $this->assertStringContainsString('content="https://example.com/images/cover.jpg"', $result);
        $this->assertStringContainsString('property="og:image:width"', $result);
        $this->assertStringContainsString('content="1200"', $result);
        $this->assertStringContainsString('property="og:image:height"', $result);
        $this->assertStringContainsString('content="630"', $result);
        $this->assertStringContainsString('property="og:image:alt"', $result);
        $this->assertStringContainsString('content="Cover image"', $result);
        $this->assertStringContainsString('name="twitter:site"', $result);
        $this->assertStringContainsString('content="@default"', $result);
    }

    /**
     * Test openGraph relative paths converted to absolute URLs
     *
     * @return void
     */
    public function testOpenGraphRelativePaths(): void
    {
        $result = $this->Seo->openGraph([
            'title' => 'Example Page',
            'url' => '/about',
            'image' => '/images/share.png',
        ]);

        $this->assertStringContainsString('content="http://localhost/about"', $result);
        $this->assertStringContainsString('content="http://localhost/images/share.png"', $result);
    }

    /**
     * Test openGraph Twitter Card tags
     *
     * @return void
     */
    public function testOpenGraphTwitterCardTags(): void
    {
        $result = $this->Seo->openGraph([
            'title' => 'Example Page',
            'description' => 'Page description',
            'image' => 'https://example.com/share.jpg',
        ]);

        $this->assertStringContainsString('name="twitter:card"', $result);
        $this->assertStringContainsString('content="summary_large_image"', $result);
        $this->assertStringContainsString('name="twitter:title"', $result);
        $this->assertStringContainsString('name="twitter:description"', $result);
        $this->assertStringContainsString('name="twitter:image"', $result);
    }

    /**
     * Test openGraph summary twitter card without image
     *
     * @return void
     */
    public function testOpenGraphSummaryTwitterCardWithoutImage(): void
    {
        $result = $this->Seo->openGraph(['title' => 'Example Page']);

        $this->assertStringContainsString('name="twitter:card"', $result);
        $this->assertStringContainsString('content="summary"', $result);
        $this->assertStringNotContainsString('name="twitter:image"', $result);
    }

    /**
     * Test openGraph Twitter overrides
     *
     * @return void
     */
    public function testOpenGraphTwitterOverrides(): void
    {
        $result = $this->Seo->openGraph([
            'title' => 'Page Title',
            'description' => 'Page description',
            'image' => 'https://example.com/og.jpg',
            'twitterCard' => 'summary',
            'twitterTitle' => 'Twitter Title',
            'twitterDescription' => 'Twitter description',
            'twitterImage' => 'https://example.com/twitter.jpg',
            'twitterSite' => '@override',
        ]);

        $this->assertStringContainsString('content="summary"', $result);
        $this->assertStringContainsString('content="Twitter Title"', $result);
        $this->assertStringContainsString('content="Twitter description"', $result);
        $this->assertStringContainsString('content="https://example.com/twitter.jpg"', $result);
        $this->assertStringContainsString('content="@override"', $result);
    }

    /**
     * Test openGraph HTML escaping
     *
     * @return void
     */
    public function testOpenGraphHtmlEscaping(): void
    {
        $result = $this->Seo->openGraph([
            'title' => 'Title with "quotes" & ampersand',
            'description' => 'Description with <tags>',
        ]);

        $this->assertStringContainsString('Title with &quot;quotes&quot; &amp; ampersand', $result);
        $this->assertStringContainsString('Description with &lt;tags&gt;', $result);
    }

    /**
     * Test jsonLd single schema
     *
     * @return void
     */
    public function testJsonLdSingleSchema(): void
    {
        $schema = $this->Seo->schemaWebSite('My Site', '/');
        $result = $this->Seo->jsonLd($schema);

        $this->assertStringContainsString('<script type="application/ld+json">', $result);
        $this->assertStringContainsString('"@type":"WebSite"', $result);
        $this->assertStringContainsString('"name":"My Site"', $result);
        $this->assertStringContainsString('"url":"http://localhost/"', $result);
    }

    /**
     * Test jsonLd multiple schemas
     *
     * @return void
     */
    public function testJsonLdMultipleSchemas(): void
    {
        $schemas = [
            $this->Seo->schemaWebSite('My Site', '/'),
            $this->Seo->schemaWebPage('About', '/about'),
        ];
        $result = $this->Seo->jsonLd($schemas);

        $this->assertSame(2, substr_count($result, '<script type="application/ld+json">'));
        $this->assertStringContainsString('"@type":"WebSite"', $result);
        $this->assertStringContainsString('"@type":"WebPage"', $result);
    }

    /**
     * Test jsonLd JSON encoding preserves slashes and unicode
     *
     * @return void
     */
    public function testJsonLdEncoding(): void
    {
        $schema = [
            '@context' => 'https://schema.org',
            '@type' => 'WebPage',
            'name' => 'Café & Co',
            'url' => 'https://example.com/path/to/page',
        ];
        $result = $this->Seo->jsonLd($schema);

        $this->assertStringContainsString('https://schema.org', $result);
        $this->assertStringContainsString('https://example.com/path/to/page', $result);
        $this->assertStringNotContainsString('\\/', $result);
        $this->assertStringContainsString('Café & Co', $result);
    }

    /**
     * Test jsonLd missing @type throws exception
     *
     * @return void
     */
    public function testJsonLdMissingTypeThrowsException(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Each JSON-LD block must include an @type key');

        $this->Seo->jsonLd(['@context' => 'https://schema.org', 'name' => 'Test']);
    }

    /**
     * Test schemaWebSite with search action
     *
     * @return void
     */
    public function testSchemaWebSiteWithSearch(): void
    {
        $schema = $this->Seo->schemaWebSite('My Site', '/', ['searchUrl' => '/search?q={search_term_string}']);

        $this->assertSame('WebSite', $schema['@type']);
        $this->assertSame('SearchAction', $schema['potentialAction']['@type']);
        $this->assertSame('http://localhost/search?q={search_term_string}', $schema['potentialAction']['target']);
    }

    /**
     * Test schemaOrganization
     *
     * @return void
     */
    public function testSchemaOrganization(): void
    {
        $schema = $this->Seo->schemaOrganization('Acme Inc', '/about', [
            'logo' => '/logo.png',
            'sameAs' => ['https://twitter.com/acme', '/social'],
        ]);

        $this->assertSame('Organization', $schema['@type']);
        $this->assertSame('http://localhost/logo.png', $schema['logo']);
        $this->assertSame('https://twitter.com/acme', $schema['sameAs'][0]);
        $this->assertSame('http://localhost/social', $schema['sameAs'][1]);
    }

    /**
     * Test schemaWebPage
     *
     * @return void
     */
    public function testSchemaWebPage(): void
    {
        $schema = $this->Seo->schemaWebPage('About Us', '/about', [
            'description' => 'About page',
            'dateModified' => '2025-06-15',
        ]);

        $this->assertSame('WebPage', $schema['@type']);
        $this->assertSame('About page', $schema['description']);
        $this->assertSame('2025-06-15', $schema['dateModified']);
    }

    /**
     * Test schemaArticle
     *
     * @return void
     */
    public function testSchemaArticle(): void
    {
        $schema = $this->Seo->schemaArticle('Article headline', '/articles/1', [
            'type' => 'NewsArticle',
            'author' => 'Jane Doe',
            'datePublished' => '2025-01-01',
            'dateModified' => '2025-01-02',
            'image' => '/images/cover.jpg',
            'publisher' => ['@type' => 'Organization', 'name' => 'Publisher'],
        ]);

        $this->assertSame('NewsArticle', $schema['@type']);
        $this->assertSame('Jane Doe', $schema['author']['name']);
        $this->assertSame('2025-01-01', $schema['datePublished']);
        $this->assertSame('http://localhost/images/cover.jpg', $schema['image']);
        $this->assertSame('Publisher', $schema['publisher']['name']);
    }

    /**
     * Test schemaBreadcrumbList
     *
     * @return void
     */
    public function testSchemaBreadcrumbList(): void
    {
        $schema = $this->Seo->schemaBreadcrumbList([
            ['name' => 'Home', 'url' => '/'],
            ['name' => 'Articles', 'url' => '/articles'],
        ]);

        $this->assertSame('BreadcrumbList', $schema['@type']);
        $this->assertCount(2, $schema['itemListElement']);
        $this->assertSame(1, $schema['itemListElement'][0]['position']);
        $this->assertSame('Home', $schema['itemListElement'][0]['name']);
        $this->assertSame('http://localhost/', $schema['itemListElement'][0]['item']);
    }

    /**
     * Test head composes multiple outputs
     *
     * @return void
     */
    public function testHeadComposesMultipleOutputs(): void
    {
        $result = $this->Seo->head([
            'canonical' => '/articles/1',
            'robots' => ['index', 'follow'],
            'description' => 'Article summary',
            'openGraph' => [
                'title' => 'Article Title',
                'description' => 'Article summary',
            ],
            'jsonLd' => [
                $this->Seo->schemaArticle('Article Title', '/articles/1'),
            ],
        ]);

        $this->assertStringContainsString('rel="canonical"', $result);
        $this->assertStringContainsString('name="robots"', $result);
        $this->assertStringContainsString('name="description"', $result);
        $this->assertStringContainsString('property="og:title"', $result);
        $this->assertStringContainsString('<script type="application/ld+json">', $result);
        $this->assertStringContainsString('"@type":"Article"', $result);
    }
}
