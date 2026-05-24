# Open Graph Element

Render [Open Graph](https://ogp.me/) and [Twitter Card](https://developer.twitter.com/en/docs/twitter-for-websites/cards/overview/abouts-cards) meta tags for social sharing previews.

## Usage

Include the element in your layout `<head>`. The element delegates to `SeoHelper::openGraph()` and auto-loads the Seo helper if needed.

```php
<?= $this->element('Brammo/Content.og', [
    'title' => 'My Page Title',
    'description' => 'A short summary of the page.',
    'image' => '/images/share.jpg',
]) ?>
```

**Note:** The `$title` variable is required. An `InvalidArgumentException` will be thrown if it is missing or empty.

## Example

```php
// In your layout or view head section
<?= $this->element('Brammo/Content.og', [
    'title' => $article->title,
    'description' => $article->summary,
    'type' => 'article',
    'siteName' => 'My Website',
    'locale' => 'en_US',
    'url' => '/articles/' . $article->slug,
    'image' => '/uploads/articles/' . $article->share_image,
    'imageWidth' => 1200,
    'imageHeight' => 630,
    'imageAlt' => $article->title,
    'twitterSite' => '@mywebsite',
]) ?>
```

## Variables

| Variable | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `$title` | `string` | Yes | — | Page title for `og:title` and `twitter:title` |
| `$description` | `string` | No | — | Page description for `og:description` and `twitter:description` |
| `$image` | `string` | No | — | Share image URL (absolute URL or app-relative path) |
| `$url` | `string` | No | Current request URL | Canonical page URL |
| `$type` | `string` | No | `website` | Open Graph type (`website`, `article`, etc.) |
| `$siteName` | `string` | No | — | Site name for `og:site_name` |
| `$locale` | `string` | No | — | Locale for `og:locale` (e.g. `en_US`) |
| `$imageWidth` | `int` | No | — | Width for `og:image:width` |
| `$imageHeight` | `int` | No | — | Height for `og:image:height` |
| `$imageAlt` | `string` | No | — | Alt text for `og:image:alt` |
| `$twitterCard` | `string` | No | `summary_large_image` when image is set, otherwise `summary` | Twitter card type |
| `$twitterSite` | `string` | No | — | Twitter handle for `twitter:site` (e.g. `@example`) |
| `$twitterTitle` | `string` | No | `$title` | Override for `twitter:title` |
| `$twitterDescription` | `string` | No | `$description` | Override for `twitter:description` |
| `$twitterImage` | `string` | No | `$image` | Override for `twitter:image` |

## URL handling

- `$url` defaults to the current request URL with the application base URL.
- Relative paths (e.g. `/images/share.jpg`) are converted to absolute URLs using `App.fullBaseUrl`.
- Absolute `http://` and `https://` URLs are passed through unchanged.

## Output

The element outputs `<meta>` tags directly. Place it inside your layout `<head>`:

```php
<head>
    <?= $this->Html->charset() ?>
    <title><?= h($title) ?></title>
    <?= $this->element('Brammo/Content.og', [
        'title' => $title,
        'description' => $description,
        'image' => $image,
    ]) ?>
</head>
```

## Generated tags

**Open Graph**

- `og:title`
- `og:type`
- `og:url`
- `og:description` (when `$description` is set)
- `og:site_name` (when `$siteName` is set)
- `og:locale` (when `$locale` is set)
- `og:image`, `og:image:width`, `og:image:height`, `og:image:alt` (when image data is provided)

**Twitter Card**

- `twitter:card`
- `twitter:title`
- `twitter:description` (when description data is available)
- `twitter:image` (when image data is available)
- `twitter:site` (when `$twitterSite` is set)
