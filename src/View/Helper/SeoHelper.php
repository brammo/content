<?php

declare(strict_types=1);

namespace Brammo\Content\View\Helper;

use Cake\View\Helper;
use InvalidArgumentException;

/**
 * SEO Helper
 *
 * Generates canonical links, robots meta tags, Open Graph/Twitter tags,
 * and JSON-LD structured data.
 *
 * @extends \Cake\View\Helper<\Cake\View\View>
 * @property \Cake\View\Helper\HtmlHelper $Html
 * @property \Cake\View\Helper\UrlHelper $Url
 */
class SeoHelper extends Helper
{
    /**
     * List of helpers used by this helper
     *
     * @var array<array-key, mixed>
     */
    protected array $helpers = ['Html', 'Url'];

    /**
     * Default configuration.
     *
     * - `siteName`: Default og:site_name
     * - `twitterSite`: Default twitter:site handle
     * - `locale`: Default og:locale
     * - `organization`: Optional organization defaults for schema presets
     *
     * @var array<string, mixed>
     */
    protected array $_defaultConfig = [
        'siteName' => null,
        'twitterSite' => null,
        'locale' => null,
        'organization' => null,
    ];

    /**
     * Convert a relative or absolute path to an absolute URL.
     *
     * @param string $path URL or app-relative path
     * @return string Absolute URL
     */
    public function absoluteUrl(string $path): string
    {
        if (str_starts_with($path, 'http://') || str_starts_with($path, 'https://')) {
            return $path;
        }

        return $this->Url->build($path, ['fullBase' => true]);
    }

    /**
     * Generate a canonical link tag.
     *
     * @param string|null $url Canonical URL (defaults to current request URL)
     * @return string HTML link tag
     */
    public function canonical(?string $url = null): string
    {
        if ($url === null || $url === '') {
            $url = $this->Url->build(null, ['fullBase' => true]);
        } else {
            $url = $this->absoluteUrl($url);
        }

        return (string)$this->Html->meta('canonical', $url);
    }

    /**
     * Generate a robots meta tag.
     *
     * @param string|array<string> $directives Robots directives (e.g. 'noindex,nofollow' or ['noindex', 'nofollow'])
     * @param bool|null $index When set, adds index/noindex directive
     * @param bool|null $follow When set, adds follow/nofollow directive
     * @return string HTML meta tag
     */
    public function robots(string|array $directives = [], ?bool $index = null, ?bool $follow = null): string
    {
        if ($index !== null || $follow !== null) {
            $parts = [];
            $parts[] = ($index ?? true) ? 'index' : 'noindex';
            $parts[] = ($follow ?? true) ? 'follow' : 'nofollow';

            if (is_array($directives) && $directives !== []) {
                $parts = array_merge($parts, $directives);
            } elseif (is_string($directives) && $directives !== '') {
                $parts = array_merge($parts, array_map('trim', explode(',', $directives)));
            }

            $directives = $parts;
        }

        if (is_string($directives)) {
            $content = $directives;
        } elseif ($directives === []) {
            $content = 'index,follow';
        } else {
            $content = implode(',', $directives);
        }

        return (string)$this->Html->meta('robots', $content);
    }

    /**
     * Generate a meta description tag.
     *
     * @param string $text Page description
     * @return string HTML meta tag
     */
    public function description(string $text): string
    {
        return (string)$this->Html->meta('description', $text);
    }

    /**
     * Generate Open Graph and Twitter Card meta tags.
     *
     * @param array<string, mixed> $options Tag options (title is required)
     * @return string HTML meta tags
     */
    public function openGraph(array $options): string
    {
        if (!isset($options['title']) || $options['title'] === '') {
            throw new InvalidArgumentException('Missing required $title variable for og element');
        }

        $title = $options['title'];
        $type = $options['type'] ?? 'website';
        $description = $options['description'] ?? null;
        $siteName = $options['siteName'] ?? $this->getConfig('siteName');
        $locale = $options['locale'] ?? $this->getConfig('locale');
        $twitterSite = $options['twitterSite'] ?? $this->getConfig('twitterSite');

        if (!isset($options['url']) || $options['url'] === '') {
            $url = $this->Url->build(null, ['fullBase' => true]);
        } else {
            $url = $this->absoluteUrl($options['url']);
        }

        $imageUrl = null;
        if (isset($options['image']) && $options['image'] !== '') {
            $imageUrl = $this->absoluteUrl($options['image']);
        }

        $twitterCard = $options['twitterCard'] ?? ($imageUrl !== null ? 'summary_large_image' : 'summary');
        $twitterTitle = $options['twitterTitle'] ?? $title;
        $twitterDescription = $options['twitterDescription'] ?? $description;
        $twitterImageUrl = null;
        if (isset($options['twitterImage']) && $options['twitterImage'] !== '') {
            $twitterImageUrl = $this->absoluteUrl($options['twitterImage']);
        } elseif ($imageUrl !== null) {
            $twitterImageUrl = $imageUrl;
        }

        $tags = [
            ['property' => 'og:title', 'content' => $title],
            ['property' => 'og:type', 'content' => $type],
            ['property' => 'og:url', 'content' => $url],
        ];

        if ($description !== null && $description !== '') {
            $tags[] = ['property' => 'og:description', 'content' => $description];
        }

        if ($siteName !== null && $siteName !== '') {
            $tags[] = ['property' => 'og:site_name', 'content' => $siteName];
        }

        if ($locale !== null && $locale !== '') {
            $tags[] = ['property' => 'og:locale', 'content' => $locale];
        }

        if ($imageUrl !== null) {
            $tags[] = ['property' => 'og:image', 'content' => $imageUrl];

            if (isset($options['imageWidth'])) {
                $tags[] = ['property' => 'og:image:width', 'content' => (string)$options['imageWidth']];
            }

            if (isset($options['imageHeight'])) {
                $tags[] = ['property' => 'og:image:height', 'content' => (string)$options['imageHeight']];
            }

            if (isset($options['imageAlt']) && $options['imageAlt'] !== '') {
                $tags[] = ['property' => 'og:image:alt', 'content' => $options['imageAlt']];
            }
        }

        $tags[] = ['name' => 'twitter:card', 'content' => $twitterCard];
        $tags[] = ['name' => 'twitter:title', 'content' => $twitterTitle];

        if ($twitterDescription !== null && $twitterDescription !== '') {
            $tags[] = ['name' => 'twitter:description', 'content' => $twitterDescription];
        }

        if ($twitterImageUrl !== null) {
            $tags[] = ['name' => 'twitter:image', 'content' => $twitterImageUrl];
        }

        if ($twitterSite !== null && $twitterSite !== '') {
            $tags[] = ['name' => 'twitter:site', 'content' => $twitterSite];
        }

        $output = '';
        foreach ($tags as $tag) {
            $output .= $this->Html->meta($tag);
        }

        return $output;
    }

    /**
     * Generate JSON-LD script tag(s).
     *
     * @param array<string, mixed>|array<int, array<string, mixed>> $data Schema data or list of schemas
     * @return string HTML script tag(s)
     */
    public function jsonLd(array $data): string
    {
        $schemas = $this->normalizeJsonLdSchemas($data);
        $output = '';

        foreach ($schemas as $schema) {
            $json = json_encode(
                $schema,
                JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR,
            );
            $output .= '<script type="application/ld+json">' . $json . '</script>';
        }

        return $output;
    }

    /**
     * Generate combined SEO head output.
     *
     * @param array<string, mixed> $options Keys: canonical, robots, description, openGraph, jsonLd
     * @return string Combined HTML output
     */
    public function head(array $options): string
    {
        $output = '';

        if (array_key_exists('canonical', $options)) {
            $output .= $this->canonical($options['canonical']);
        }

        if (isset($options['robots'])) {
            $robots = $options['robots'];
            if (is_array($robots)) {
                $output .= $this->robots($robots);
            } else {
                $output .= $this->robots((string)$robots);
            }
        }

        if (isset($options['description']) && $options['description'] !== '') {
            $output .= $this->description((string)$options['description']);
        }

        if (isset($options['openGraph']) && is_array($options['openGraph'])) {
            $output .= $this->openGraph($options['openGraph']);
        }

        if (isset($options['jsonLd']) && is_array($options['jsonLd'])) {
            $output .= $this->jsonLd($options['jsonLd']);
        }

        return $output;
    }

    /**
     * Build a WebSite JSON-LD schema.
     *
     * @param string $name Site name
     * @param string $url Site URL
     * @param array<string, mixed> $options Optional searchUrl for SearchAction
     * @return array<string, mixed>
     */
    public function schemaWebSite(string $name, string $url, array $options = []): array
    {
        $schema = [
            '@context' => 'https://schema.org',
            '@type' => 'WebSite',
            'name' => $name,
            'url' => $this->absoluteUrl($url),
        ];

        if (isset($options['searchUrl']) && $options['searchUrl'] !== '') {
            $schema['potentialAction'] = [
                '@type' => 'SearchAction',
                'target' => $this->absoluteUrl((string)$options['searchUrl']),
                'query-input' => 'required name=search_term_string',
            ];
        }

        return $schema;
    }

    /**
     * Build an Organization JSON-LD schema.
     *
     * @param string $name Organization name
     * @param string $url Organization URL
     * @param array<string, mixed> $options Optional logo and sameAs social URLs
     * @return array<string, mixed>
     */
    public function schemaOrganization(string $name, string $url, array $options = []): array
    {
        $schema = [
            '@context' => 'https://schema.org',
            '@type' => 'Organization',
            'name' => $name,
            'url' => $this->absoluteUrl($url),
        ];

        if (isset($options['logo']) && $options['logo'] !== '') {
            $schema['logo'] = $this->absoluteUrl((string)$options['logo']);
        }

        if (!empty($options['sameAs']) && is_array($options['sameAs'])) {
            $schema['sameAs'] = array_map(
                fn(string $link): string => $this->absoluteUrl($link),
                $options['sameAs'],
            );
        }

        return $schema;
    }

    /**
     * Build a WebPage JSON-LD schema.
     *
     * @param string $name Page name
     * @param string $url Page URL
     * @param array<string, mixed> $options Optional description and dateModified
     * @return array<string, mixed>
     */
    public function schemaWebPage(string $name, string $url, array $options = []): array
    {
        $schema = [
            '@context' => 'https://schema.org',
            '@type' => 'WebPage',
            'name' => $name,
            'url' => $this->absoluteUrl($url),
        ];

        if (isset($options['description']) && $options['description'] !== '') {
            $schema['description'] = $options['description'];
        }

        if (isset($options['dateModified']) && $options['dateModified'] !== '') {
            $schema['dateModified'] = $options['dateModified'];
        }

        return $schema;
    }

    /**
     * Build an Article JSON-LD schema.
     *
     * @param string $headline Article headline
     * @param string $url Article URL
     * @param array<string, mixed> $options Optional author, dates, image, publisher, type
     * @return array<string, mixed>
     */
    public function schemaArticle(string $headline, string $url, array $options = []): array
    {
        $schema = [
            '@context' => 'https://schema.org',
            '@type' => $options['type'] ?? 'Article',
            'headline' => $headline,
            'url' => $this->absoluteUrl($url),
        ];

        if (isset($options['description']) && $options['description'] !== '') {
            $schema['description'] = $options['description'];
        }

        if (isset($options['datePublished']) && $options['datePublished'] !== '') {
            $schema['datePublished'] = $options['datePublished'];
        }

        if (isset($options['dateModified']) && $options['dateModified'] !== '') {
            $schema['dateModified'] = $options['dateModified'];
        }

        if (isset($options['image']) && $options['image'] !== '') {
            $schema['image'] = $this->absoluteUrl((string)$options['image']);
        }

        if (isset($options['author']) && $options['author'] !== '') {
            if (is_array($options['author'])) {
                $schema['author'] = $options['author'];
            } else {
                $schema['author'] = [
                    '@type' => 'Person',
                    'name' => (string)$options['author'],
                ];
            }
        }

        if (isset($options['publisher']) && is_array($options['publisher'])) {
            $schema['publisher'] = $options['publisher'];
        } elseif ($this->getConfig('organization') !== null) {
            $org = $this->getConfig('organization');
            if (is_array($org)) {
                $schema['publisher'] = $org;
            }
        }

        return $schema;
    }

    /**
     * Build a BreadcrumbList JSON-LD schema.
     *
     * @param array<int, array{name: string, url: string}> $items Breadcrumb items
     * @return array<string, mixed>
     */
    public function schemaBreadcrumbList(array $items): array
    {
        $listItems = [];
        foreach ($items as $position => $item) {
            $listItems[] = [
                '@type' => 'ListItem',
                'position' => $position + 1,
                'name' => $item['name'],
                'item' => $this->absoluteUrl($item['url']),
            ];
        }

        return [
            '@context' => 'https://schema.org',
            '@type' => 'BreadcrumbList',
            'itemListElement' => $listItems,
        ];
    }

    /**
     * Normalize JSON-LD input to a list of schema arrays.
     *
     * @param array<string, mixed>|array<int, array<string, mixed>> $data Schema data
     * @return array<int, array<string, mixed>>
     */
    protected function normalizeJsonLdSchemas(array $data): array
    {
        if ($data === []) {
            throw new InvalidArgumentException('JSON-LD data cannot be empty');
        }

        $schemas = array_is_list($data) ? $data : [$data];

        foreach ($schemas as $schema) {
            if (!is_array($schema) || !isset($schema['@type'])) {
                throw new InvalidArgumentException('Each JSON-LD block must include an @type key');
            }
        }

        /** @var array<int, array<string, mixed>> $schemas */
        return $schemas;
    }
}
