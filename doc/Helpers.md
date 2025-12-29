# Helpers

The Content plugin provides the following view helpers:

## DateHelper

Format dates and date ranges in a human-readable, localized format.

```php
$this->loadHelper('Brammo/Content.Date');

echo $this->Date->nice('2025-06-15');
// Returns: 15 June 2025

echo $this->Date->range('2025-06-10', '2025-06-15');
// Returns: 10 – 15 June 2025
```

[Full DateHelper documentation](DateHelper.md)

## ImageHelper

Process and cache images with automatic resizing, cropping, and fitting operations.

```php
$this->loadHelper('Brammo/Content.Image');

echo $this->Image->resize('/images/photo.jpg', 200, 200);
// Returns: /thumb/200x200/images/photo.jpg

echo $this->Image->crop('/images/photo.jpg', 100, 100);
// Returns: /thumb/100x100c/images/photo.jpg
```

[Full ImageHelper documentation](ImageHelper.md)

## VideoHelper

Embed videos from YouTube, Vimeo, and other platforms.

```php
$this->loadHelper('Brammo/Content.Video');

echo $this->Video->embed('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
// Returns: <iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ" allowfullscreen></iframe>

$thumbnail = $this->Video->image('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
// Returns: https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg
```

[Full VideoHelper documentation](VideoHelper.md)
