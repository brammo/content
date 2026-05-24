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

$toAbsoluteUrl = function (string $path): string {
    if (str_starts_with($path, 'http://') || str_starts_with($path, 'https://')) {
        return $path;
    }

    return $this->Url->build($path, ['fullBase' => true]);
};

$type = $type ?? 'website';

if (!isset($url) || $url === '') {
    $url = $this->Url->build(null, ['fullBase' => true]);
} else {
    $url = $toAbsoluteUrl($url);
}

$imageUrl = null;
if (isset($image) && $image !== '') {
    $imageUrl = $toAbsoluteUrl($image);
}

$twitterCard = $twitterCard ?? ($imageUrl !== null ? 'summary_large_image' : 'summary');
$twitterTitle = $twitterTitle ?? $title;
$twitterDescription = $twitterDescription ?? ($description ?? null);
$twitterImageUrl = null;
if (isset($twitterImage) && $twitterImage !== '') {
    $twitterImageUrl = $toAbsoluteUrl($twitterImage);
} elseif ($imageUrl !== null) {
    $twitterImageUrl = $imageUrl;
}

$tags = [
    ['property' => 'og:title', 'content' => $title],
    ['property' => 'og:type', 'content' => $type],
    ['property' => 'og:url', 'content' => $url],
];

if (isset($description) && $description !== '') {
    $tags[] = ['property' => 'og:description', 'content' => $description];
}

if (isset($siteName) && $siteName !== '') {
    $tags[] = ['property' => 'og:site_name', 'content' => $siteName];
}

if (isset($locale) && $locale !== '') {
    $tags[] = ['property' => 'og:locale', 'content' => $locale];
}

if ($imageUrl !== null) {
    $tags[] = ['property' => 'og:image', 'content' => $imageUrl];

    if (isset($imageWidth)) {
        $tags[] = ['property' => 'og:image:width', 'content' => (string)$imageWidth];
    }

    if (isset($imageHeight)) {
        $tags[] = ['property' => 'og:image:height', 'content' => (string)$imageHeight];
    }

    if (isset($imageAlt) && $imageAlt !== '') {
        $tags[] = ['property' => 'og:image:alt', 'content' => $imageAlt];
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

if (isset($twitterSite) && $twitterSite !== '') {
    $tags[] = ['name' => 'twitter:site', 'content' => $twitterSite];
}

$output = '';
foreach ($tags as $tag) {
    $output .= $this->Html->meta($tag);
}

echo $output;
