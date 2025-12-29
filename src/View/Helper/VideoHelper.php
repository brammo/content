<?php

declare(strict_types=1);

namespace Brammo\Content\View\Helper;

use Cake\View\Helper;
use MediaEmbed\MediaEmbed;

/**
 * Video Helper
 *
 * Uses dereuromark/media-embed library for parsing and embedding videos.
 */
class VideoHelper extends Helper
{
    /**
     * MediaEmbed instance
     *
     * @var \MediaEmbed\MediaEmbed
     */
    protected MediaEmbed $mediaEmbed;

    /**
     * Default configuration.
     *
     * @var array<string, mixed>
     */
    protected array $_defaultConfig = [];

    /**
     * Initialize the helper
     *
     * @param array<string, mixed> $config Configuration options
     * @return void
     */
    public function initialize(array $config): void
    {
        parent::initialize($config);
        $this->mediaEmbed = new MediaEmbed();
    }

    /**
     * Returns video iframe/embed tag
     *
     * @param string $url Video URL
     * @param array<string, mixed> $options Options (supports 'autoplay', 'attributes', 'params')
     * @return string Embed code or empty string if the video URL is not valid
     */
    public function embed(string $url, array $options = []): string
    {
        $mediaObject = $this->mediaEmbed->parseUrl($url);
        if ($mediaObject === null) {
            return '';
        }

        if (!empty($options['autoplay'])) {
            $mediaObject->setParam(['autoplay' => 1]);
        }

        if (!empty($options['params']) && is_array($options['params'])) {
            $mediaObject->setParam($options['params']);
        }

        $attributes = ['allowfullscreen' => true];
        if (!empty($options['attributes']) && is_array($options['attributes'])) {
            $attributes = array_merge($attributes, $options['attributes']);
        }
        $mediaObject->setAttribute($attributes);

        return $mediaObject->getEmbedCode();
    }

    /**
     * Returns placeholder/thumbnail image URL
     *
     * @param string $url Video URL
     * @return string|null Image URL or null if the video URL is not valid or has no image
     */
    public function image(string $url): ?string
    {
        $mediaObject = $this->mediaEmbed->parseUrl($url);
        if ($mediaObject === null) {
            return null;
        }

        $imageUrl = $mediaObject->image();
        if (empty($imageUrl)) {
            // Fallback for YouTube - construct thumbnail URL from video ID
            $slug = $mediaObject->slug();
            $id = $mediaObject->id();
            if ($slug === 'youtube' && $id) {
                return "https://i.ytimg.com/vi/{$id}/hqdefault.jpg";
            }

            return null;
        }

        return $imageUrl;
    }
}
