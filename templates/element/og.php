<?php
/**
 * Open Graph and Twitter Card meta tags element
 *
 * @var \Cake\View\View $this
 * @var string $title Page title for og:title and twitter:title
 * @var string|null $description Optional page description
 * @var string|null $image Optional image URL (absolute, or app-relative path)
 * @var string|null $url Optional page URL (defaults to current request URL)
 * @var string $type Open Graph type (default: website)
 * @var string|null $siteName Optional og:site_name
 * @var string|null $locale Optional og:locale (e.g. en_US)
 * @var int|null $imageWidth Optional og:image:width
 * @var int|null $imageHeight Optional og:image:height
 * @var string|null $imageAlt Optional og:image:alt
 * @var string|null $twitterCard Optional twitter:card (default: summary_large_image when image is set)
 * @var string|null $twitterSite Optional twitter:site handle (e.g. @example)
 * @var string|null $twitterTitle Optional twitter:title override
 * @var string|null $twitterDescription Optional twitter:description override
 * @var string|null $twitterImage Optional twitter:image override
 */

if (!isset($title) || $title === '') {
    throw new \InvalidArgumentException('Missing required $title variable for og element');
}

if (!isset($this->Seo)) {
    $this->loadHelper('Brammo/Content.Seo');
}

$options = [
    'title' => $title,
    'type' => $type ?? 'website',
];

$optionalKeys = [
    'description',
    'image',
    'url',
    'siteName',
    'locale',
    'imageWidth',
    'imageHeight',
    'imageAlt',
    'twitterCard',
    'twitterSite',
    'twitterTitle',
    'twitterDescription',
    'twitterImage',
];

foreach ($optionalKeys as $key) {
    if (isset($$key)) {
        $options[$key] = $$key;
    }
}

echo $this->Seo->openGraph($options);
