# VideoHelper

Embed videos from popular platforms like YouTube, Vimeo, and many others using the [dereuromark/media-embed](https://github.com/dereuromark/media-embed) library.

## Usage

Load the helper in your `AppView.php`:

```php
public function initialize(): void
{
    parent::initialize();
    
    $this->loadHelper('Brammo/Content.Video');
}
```

### Methods

#### embed()

Returns an iframe/embed code for a video URL.

```php
// Basic YouTube embed
echo $this->Video->embed('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
// Returns: <iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ" allowfullscreen></iframe>

// Vimeo embed
echo $this->Video->embed('https://vimeo.com/123456789');
// Returns: <iframe src="https://player.vimeo.com/video/123456789" allowfullscreen></iframe>

// Invalid URL returns empty string
echo $this->Video->embed('https://example.com/not-a-video');
// Returns: ''
```

**Options:**

```php
// Enable autoplay
echo $this->Video->embed($url, ['autoplay' => true]);

// Custom player parameters
echo $this->Video->embed($url, [
    'params' => [
        'rel' => 0,        // Don't show related videos (YouTube)
        'controls' => 1,   // Show player controls
    ],
]);

// Custom iframe attributes
echo $this->Video->embed($url, [
    'attributes' => [
        'class' => 'video-frame',
        'width' => '800',
        'height' => '450',
    ],
]);

// Combine options
echo $this->Video->embed($url, [
    'autoplay' => true,
    'params' => ['rel' => 0],
    'attributes' => ['class' => 'responsive-video'],
]);
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `$url` | `string` | The video URL to embed |
| `$options` | `array` | Optional settings (see below) |

**Options array:**

| Key | Type | Description |
|-----|------|-------------|
| `autoplay` | `bool` | Enable autoplay (default: `false`) |
| `params` | `array` | Player-specific parameters (e.g., `rel`, `controls`) |
| `attributes` | `array` | HTML attributes for the iframe (e.g., `class`, `width`, `height`) |

**Returns:** `string` - Embed HTML code, or empty string if URL is invalid

#### image()

Returns the thumbnail/placeholder image URL for a video.

```php
// Get YouTube thumbnail
$thumbnail = $this->Video->image('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
// Returns: https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg

// Use in an img tag
echo '<img src="' . $this->Video->image($url) . '" alt="Video thumbnail">';

// Invalid URL returns null
$thumbnail = $this->Video->image('https://example.com/not-a-video');
// Returns: null
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `$url` | `string` | The video URL |

**Returns:** `string|null` - Thumbnail URL, or `null` if URL is invalid or has no thumbnail

### Supported Platforms

The helper supports all platforms provided by the media-embed library, including:

- YouTube
- Vimeo
- Dailymotion
- Twitch
- TikTok
- And many more...

For a complete list of supported platforms, see the [media-embed documentation](https://github.com/dereuromark/media-embed).

### Example: Responsive Video Embed

```php
<div class="video-container">
    <?= $this->Video->embed($videoUrl, [
        'attributes' => [
            'class' => 'video-iframe',
            'width' => '100%',
            'height' => '100%',
        ],
    ]) ?>
</div>
```

```css
.video-container {
    position: relative;
    padding-bottom: 56.25%; /* 16:9 aspect ratio */
    height: 0;
    overflow: hidden;
}

.video-container .video-iframe {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
}
```
