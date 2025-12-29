<?php

declare(strict_types=1);

namespace Brammo\Content\View\Helper;

use Cake\View\Helper;
use Intervention\Image\Drivers\Gd\Driver as GdDriver;
use Intervention\Image\Drivers\Imagick\Driver as ImagickDriver;
use Intervention\Image\ImageManager;
use Intervention\Image\Interfaces\DriverInterface;
use Intervention\Image\Interfaces\ImageInterface;

/**
 * Image Helper
 *
 * Provides image manipulation methods (resize, crop, fit) with automatic caching.
 * Supports GD, ImageMagick, and libvips via Intervention Image library.
 *
 * @property \Cake\View\Helper\UrlHelper $Url
 */
class ImageHelper extends Helper
{
    /**
     * List of helpers used by this helper
     *
     * @var array<array-key, mixed>
     */
    protected array $helpers = ['Url'];

    /**
     * Default configuration
     *
     * - `tempFolder`: Folder to store cached images (relative to webroot)
     * - `driver`: Image processing driver ('gd', 'imagick', 'vips', or 'auto' to detect)
     * - `backgroundColor`: Background color for 'fit' method (hex code)
     *
     * @var array<string, mixed>
     */
    protected array $_defaultConfig = [
        'tempFolder' => '/thumb',
        'driver' => 'auto',
        'backgroundColor' => '#ffffff',
    ];

    /**
     * Cached ImageManager instance
     *
     * @var \Intervention\Image\ImageManager|null
     */
    protected ?ImageManager $manager = null;

    /**
     * Resize image to fit within specified dimensions while maintaining aspect ratio.
     * Image will be scaled up if smaller than target dimensions.
     *
     * Cache path format: {tempFolder}/{width}x{height}/{filename}
     *
     * @param string $path Path to image relative to webroot
     * @param int $width Target width
     * @param int|null $height Target height. If null, height will equal width.
     * @param string|null $format Optional output format (jpg, png, gif, webp)
     * @return string Web path to processed image or original path on error
     */
    public function resize(string $path, int $width, ?int $height = null, ?string $format = null): string
    {
        if ($height === null) {
            $height = $width;
        }

        return $this->process($path, $width, $height, 'resize', $format);
    }

    /**
     * Crop image to exact dimensions from center.
     * Image will be scaled up if smaller than target dimensions before cropping.
     *
     * Cache path format: {tempFolder}/{width}x{height}c/{filename}
     *
     * @param string $path Path to image relative to webroot
     * @param int $width Target width
     * @param int|null $height Target height. If null, height will equal width.
     * @param string|null $format Optional output format (jpg, png, gif, webp)
     * @return string Web path to processed image or original path on error
     */
    public function crop(string $path, int $width, ?int $height = null, ?string $format = null): string
    {
        if ($height === null) {
            $height = $width;
        }

        return $this->process($path, $width, $height, 'crop', $format);
    }

    /**
     * Fit image within dimensions and fill remaining space with background color.
     * Image will be scaled to fit and centered, with padding added as needed.
     *
     * Cache path format: {tempFolder}/{width}x{height}f/{filename}
     *
     * @param string $path Path to image relative to webroot
     * @param int $width Target width
     * @param int|null $height Target height. If null, height will equal width.
     * @param string|null $format Optional output format (jpg, png, gif, webp)
     * @return string Web path to processed image or original path on error
     */
    public function fit(string $path, int $width, ?int $height = null, ?string $format = null): string
    {
        if ($height === null) {
            $height = $width;
        }

        return $this->process($path, $width, $height, 'fit', $format);
    }

    /**
     * Process image with specified method
     *
     * @param string $path Source image path relative to webroot
     * @param int $width Target width
     * @param int $height Target height
     * @param string $method Processing method (resize, crop, fit)
     * @param string|null $format Output format
     * @return string Web path to processed image or original on error
     */
    protected function process(string $path, int $width, int $height, string $method, ?string $format): string
    {
        $webroot = $this->getWebrootPath();
        $sourcePath = $webroot . $path;

        // Return original if source doesn't exist
        if (!is_file($sourcePath)) {
            return $path;
        }

        // Determine output format
        $outputFormat = $format ?? pathinfo($path, PATHINFO_EXTENSION);
        $outputFormat = strtolower($outputFormat);

        // Build cache path
        $cachePath = $this->getCachePath($path, $width, $height, $method, $outputFormat);
        $cacheFullPath = $webroot . $cachePath;

        // Return cached version if exists
        if (is_file($cacheFullPath)) {
            return $cachePath;
        }

        $this->ensureDirectory(dirname($cacheFullPath));

        // Process image
        try {
            $manager = $this->getImageManager();
            $image = $manager->read($sourcePath);

            $image = match ($method) {
                'resize' => $this->applyResize($image, $width, $height),
                'crop' => $this->applyCrop($image, $width, $height),
                'fit' => $this->applyFit($image, $width, $height),
                default => $image,
            };

            $this->saveImage($image, $cacheFullPath, $outputFormat);

            return $cachePath;
        } catch (\Throwable $e) {
            // Return original path on any error
            return $path;
        }
    }

    /**
     * Apply resize transformation (scale to fit within dimensions)
     *
     * @param \Intervention\Image\Interfaces\ImageInterface $image
     * @param int $width
     * @param int $height
     * @return \Intervention\Image\Interfaces\ImageInterface
     */
    protected function applyResize(ImageInterface $image, int $width, int $height): ImageInterface
    {
        return $image->scale($width, $height);
    }

    /**
     * Apply crop transformation (cover and crop to exact dimensions)
     *
     * @param \Intervention\Image\Interfaces\ImageInterface $image
     * @param int $width
     * @param int $height
     * @return \Intervention\Image\Interfaces\ImageInterface
     */
    protected function applyCrop(ImageInterface $image, int $width, int $height): ImageInterface
    {
        return $image->cover($width, $height);
    }

    /**
     * Apply fit transformation (contain within dimensions with background padding)
     *
     * @param \Intervention\Image\Interfaces\ImageInterface $image
     * @param int $width
     * @param int $height
     * @return \Intervention\Image\Interfaces\ImageInterface
     */
    protected function applyFit(ImageInterface $image, int $width, int $height): ImageInterface
    {
        $backgroundColor = $this->getConfig('backgroundColor');

        return $image->pad($width, $height, $backgroundColor);
    }

    /**
     * Save image to file with specified format
     *
     * @param \Intervention\Image\Interfaces\ImageInterface $image
     * @param string $path Full file path
     * @param string $format Output format
     * @return void
     */
    protected function saveImage(ImageInterface $image, string $path, string $format): void
    {
        $encoded = match ($format) {
            'png' => $image->toPng(),
            'gif' => $image->toGif(),
            'webp' => $image->toWebp(),
            'avif' => $image->toAvif(),
            'bmp' => $image->toBitmap(),
            default => $image->toJpeg(),
        };

        $encoded->save($path);
    }

    /**
     * Get cache path for processed image
     *
     * Preserves original directory structure to avoid filename collisions
     * from different folders with same filename.
     *
     * @param string $sourcePath Original image path
     * @param int $width Target width
     * @param int $height Target height
     * @param string $method Processing method
     * @param string $format Output format
     * @return string Cache path relative to webroot
     */
    protected function getCachePath(
        string $sourcePath,
        int $width,
        int $height,
        string $method,
        string $format
    ): string {
        $tempFolder = $this->getConfig('tempFolder');
        $suffix = match ($method) {
            'crop' => 'c',
            'fit' => 'f',
            default => '',
        };

        $dirname = ltrim(pathinfo($sourcePath, PATHINFO_DIRNAME), '/');
        $filename = pathinfo($sourcePath, PATHINFO_FILENAME);
        $sizeFolder = sprintf('%dx%d%s', $width, $height, $suffix);

        // Include original path structure: /thumb/100x100/images/products/photo.jpg
        return sprintf('%s/%s/%s/%s.%s', $tempFolder, $sizeFolder, $dirname, $filename, $format);
    }

    /**
     * Get ImageManager instance with appropriate driver
     *
     * @return \Intervention\Image\ImageManager
     */
    protected function getImageManager(): ImageManager
    {
        if ($this->manager !== null) {
            return $this->manager;
        }

        $driver = $this->getConfig('driver');

        if ($driver === 'auto') {
            $driver = $this->detectDriver();
        }

        $driverInstance = $this->createDriver($driver);

        $this->manager = new ImageManager($driverInstance);

        return $this->manager;
    }

    /**
     * Create driver instance
     *
     * @param string $driver Driver name
     * @return \Intervention\Image\Interfaces\DriverInterface
     */
    protected function createDriver(string $driver): DriverInterface
    {
        return match ($driver) {
            'imagick' => new ImagickDriver(),
            'vips' => $this->createVipsDriver(),
            default => new GdDriver(),
        };
    }

    /**
     * Create libvips driver instance
     *
     * Requires intervention/image-driver-vips package to be installed.
     *
     * @return \Intervention\Image\Interfaces\DriverInterface
     * @throws \RuntimeException If vips driver is not available
     */
    protected function createVipsDriver(): DriverInterface
    {
        $vipsDriverClass = 'Intervention\\Image\\Drivers\\Vips\\Driver';

        if (!class_exists($vipsDriverClass)) {
            throw new \RuntimeException(
                'libvips driver requires intervention/image-driver-vips package. ' .
                'Install it with: composer require intervention/image-driver-vips'
            );
        }

        /** @var DriverInterface $driver */
        $driver = new $vipsDriverClass();

        return $driver;
    }

    /**
     * Detect available image driver
     *
     * Priority: imagick > vips > gd
     *
     * @return string Driver name ('imagick', 'vips', or 'gd')
     */
    protected function detectDriver(): string
    {
        if ($this->isVipsAvailable()) {
            return 'vips';
        }

        if (extension_loaded('imagick')) {
            return 'imagick';
        }

        return 'gd';
    }

    /**
     * Check if libvips driver is available
     *
     * @return bool
     */
    protected function isVipsAvailable(): bool
    {
        return extension_loaded('vips')
            && class_exists('Intervention\\Image\\Drivers\\Vips\\Driver');
    }

    /**
     * Get webroot path from request or fallback to WWW_ROOT constant
     *
     * @return string Absolute path to webroot
     */
    protected function getWebrootPath(): string
    {
        if (!defined('WWW_ROOT')) {
            throw new \RuntimeException('WWW_ROOT constant is not defined.');
        }

        return rtrim(WWW_ROOT, DIRECTORY_SEPARATOR);
    }

    /**
     * Ensure directory exists, create if not
     *
     * @param string $path Directory path
     * @return void
     * @throws \RuntimeException If directory cannot be created or is not writable
     */
    protected function ensureDirectory(string $path): void
    {
        if (is_dir($path)) {
            if (!is_writable($path)) {
                throw new \RuntimeException(
                    sprintf('Cache directory is not writable: %s', $path)
                );
            }

            return;
        }

        if (!mkdir($path, 0755, true) && !is_dir($path)) {
            throw new \RuntimeException(
                sprintf('Failed to create cache directory: %s', $path)
            );
        }
    }

    /**
     * Get information about available image processing driver
     *
     * @return array{driver: string, available: array<string, bool>}
     */
    public function getDriverInfo(): array
    {
        return [
            'driver' => $this->detectDriver(),
            'available' => [
                'imagick' => extension_loaded('imagick'),
                'vips' => $this->isVipsAvailable(),
                'gd' => extension_loaded('gd'),
            ],
        ];
    }
}
