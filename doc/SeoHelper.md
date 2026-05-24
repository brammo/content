# SeoHelper

Generate SEO meta tags, canonical links, Open Graph/Twitter tags, and JSON-LD structured data.

## Usage

Load the helper in your `AppView.php`:

```php
$this->loadHelper('Brammo/Content.Seo', [
    'siteName' => 'My Site',
    'twitterSite' => '@mysite',
    'locale' => 'en_US',
]);
```

### Combined head output

Use `head()` to render multiple SEO tags in one call:

```php
echo $this->Seo->head([
    'canonical' => '/articles/' . $article->slug,
    'description' => $article->summary,
    'robots' => ['index', 'follow'],
    'openGraph' => [
        'title' => $article->title,
        'description' => $article->summary,
        'type' => 'article',
        'image' => '/uploads/' . $article->share_image,
    ],
    'jsonLd' => [
        $this->Seo->schemaArticle($article->title, '/articles/' . $article->slug, [
            'datePublished' => $article->published,
            'author' => $article->author_name,
            'image' => '/uploads/' . $article->share_image,
        ]),
        $this->Seo->schemaBreadcrumbList([
            ['name' => 'Home', 'url' => '/'],
            ['name' => 'Articles', 'url' => '/articles'],
            ['name' => $article->title, 'url' => '/articles/' . $article->slug],
        ]),
    ],
]);
```

### Individual methods

#### canonical()

Generates a `<link rel="canonical">` tag. Defaults to the current request URL.

```php
echo $this->Seo->canonical();
echo $this->Seo->canonical('/about');
echo $this->Seo->canonical('https://example.com/page');
```

#### robots()

Generates a `<meta name="robots">` tag.

```php
echo $this->Seo->robots('noindex,nofollow');
echo $this->Seo->robots(['noindex', 'max-snippet:-1']);
echo $this->Seo->robots(index: false, follow: true);
echo $this->Seo->robots(); // index,follow
```

#### description()

Generates a classic `<meta name="description">` tag (distinct from Open Graph description).

```php
echo $this->Seo->description('A short summary of the page.');
```

#### openGraph()

Generates Open Graph and Twitter Card meta tags. `$options['title']` is required.

```php
echo $this->Seo->openGraph([
    'title' => 'My Page Title',
    'description' => 'A short summary.',
    'type' => 'article',
    'image' => '/images/share.jpg',
    'url' => '/articles/example',
]);
```

See [Open Graph Element](OgElement.md) for the full list of supported options.

#### jsonLd()

Generates one or more `<script type="application/ld+json">` blocks.

```php
echo $this->Seo->jsonLd($this->Seo->schemaWebSite('My Site', '/'));

echo $this->Seo->jsonLd([
    $this->Seo->schemaWebSite('My Site', '/'),
    $this->Seo->schemaWebPage('About', '/about'),
]);
```

### JSON-LD presets

Each preset returns a schema array for use with `jsonLd()` or `head()`.

| Method | `@type` | Notes |
|--------|---------|-------|
| `schemaWebSite($name, $url, $options)` | `WebSite` | Optional `searchUrl` adds `SearchAction` |
| `schemaOrganization($name, $url, $options)` | `Organization` | Optional `logo`, `sameAs[]` |
| `schemaWebPage($name, $url, $options)` | `WebPage` | Optional `description`, `dateModified` |
| `schemaArticle($headline, $url, $options)` | `Article` / `NewsArticle` | Optional `author`, dates, `image`, `publisher`, `type` |
| `schemaBreadcrumbList($items)` | `BreadcrumbList` | Array of `['name' => '...', 'url' => '...']` |

```php
$schema = $this->Seo->schemaOrganization('Acme Inc', '/about', [
    'logo' => '/logo.png',
    'sameAs' => ['https://twitter.com/acme'],
]);
echo $this->Seo->jsonLd($schema);
```

#### absoluteUrl()

Converts app-relative paths to absolute URLs using `App.fullBaseUrl`.

```php
$url = $this->Seo->absoluteUrl('/images/share.jpg');
// Returns: https://example.com/images/share.jpg
```

## Configuration

| Option | Default | Description |
|--------|---------|-------------|
| `siteName` | `null` | Default `og:site_name` |
| `twitterSite` | `null` | Default `twitter:site` handle |
| `locale` | `null` | Default `og:locale` |
| `organization` | `null` | Default publisher for `schemaArticle()` |

Per-call options in `openGraph()` override config defaults.

## URL handling

- Relative paths are converted to absolute URLs using `App.fullBaseUrl`.
- Absolute `http://` and `https://` URLs are passed through unchanged.

## Open Graph element

The [`og` element](OgElement.md) delegates to `SeoHelper::openGraph()`. You can use either the helper directly or the element wrapper:

```php
<?= $this->element('Brammo/Content.og', ['title' => $title, 'description' => $description]) ?>
```

The element auto-loads `Brammo/Content.Seo` if it is not already loaded.

## Future extensions

Possible additions for future versions: `hreflang()`, pagination `prev`/`next` links, `article:published_time` OG tags, additional JSON-LD presets (`Product`, `FAQPage`, `LocalBusiness`), and `theme-color` meta tags.
