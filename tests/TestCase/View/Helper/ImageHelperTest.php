<?php

declare(strict_types=1);

namespace Brammo\Content\Test\TestCase\View\Helper;

use Brammo\Content\View\Helper\ImageHelper;
use Cake\TestSuite\TestCase;
use Cake\View\View;

/**
 * ImageHelper Test Case
 */
class ImageHelperTest extends TestCase
{
    protected ImageHelper $Image;

    protected function setUp(): void
    {
        parent::setUp();
        $view = new View();
        $this->Image = new ImageHelper($view);
    }

    protected function tearDown(): void
    {
        unset($this->Image);
        parent::tearDown();
    }

    /**
     * Test default configuration values
     *
     * @return void
     */
    public function testDefaultConfiguration(): void
    {
        $this->assertSame('/thumb', $this->Image->getConfig('tempFolder'));
        $this->assertSame('auto', $this->Image->getConfig('driver'));
        $this->assertSame('#ffffff', $this->Image->getConfig('backgroundColor'));
    }

    /**
     * Test custom configuration
     *
     * @return void
     */
    public function testCustomConfiguration(): void
    {
        $view = new View();
        $helper = new ImageHelper($view, [
            'tempFolder' => '/cache/images',
            'driver' => 'gd',
            'backgroundColor' => '#000000',
        ]);

        $this->assertSame('/cache/images', $helper->getConfig('tempFolder'));
        $this->assertSame('gd', $helper->getConfig('driver'));
        $this->assertSame('#000000', $helper->getConfig('backgroundColor'));
    }

    /**
     * Test resize processes an existing image and returns cache path
     *
     * @return void
     */
    public function testResizeProcessesExistingImage(): void
    {
        if (!extension_loaded('gd')) {
            $this->markTestSkipped('GD extension not available.');
        }

        $view = new View();
        $helper = new ImageHelper($view, ['driver' => 'gd', 'tempFolder' => '/thumb-test']);
        $sourcePath = '/images/test.png';
        $expectedCache = '/thumb-test/50x50/images/test.png';

        $result = $helper->resize($sourcePath, 50, 50);
        $this->assertSame($expectedCache, $result);

        $cacheFullPath = WWW_ROOT . ltrim($expectedCache, '/');
        $this->assertFileExists($cacheFullPath);

        $cachedAgain = $helper->resize($sourcePath, 50, 50);
        $this->assertSame($expectedCache, $cachedAgain);

        if (is_file($cacheFullPath)) {
            unlink($cacheFullPath);
        }
        $this->removeEmptyCacheDirs(dirname($cacheFullPath));
    }

    /**
     * Test resize returns original path when source file doesn't exist
     *
     * @return void
     */
    public function testResizeReturnsOriginalOnMissingFile(): void
    {
        $result = $this->Image->resize('/images/nonexistent.jpg', 100, 100);
        $this->assertSame('/images/nonexistent.jpg', $result);
    }

    /**
     * Test crop returns original path when source file doesn't exist
     *
     * @return void
     */
    public function testCropReturnsOriginalOnMissingFile(): void
    {
        $result = $this->Image->crop('/images/nonexistent.jpg', 100, 100);
        $this->assertSame('/images/nonexistent.jpg', $result);
    }

    /**
     * Test fit returns original path when source file doesn't exist
     *
     * @return void
     */
    public function testFitReturnsOriginalOnMissingFile(): void
    {
        $result = $this->Image->fit('/images/nonexistent.jpg', 100, 100);
        $this->assertSame('/images/nonexistent.jpg', $result);
    }

    /**
     * Test fit scales a smaller image up to the target dimensions before padding
     *
     * @return void
     */
    public function testFitScalesUpSmallerImage(): void
    {
        if (!extension_loaded('gd')) {
            $this->markTestSkipped('GD extension not available.');
        }

        $helper = new ImageHelper(new View(), ['driver' => 'gd', 'tempFolder' => '/thumb-test']);
        $result = $helper->fit('/images/test.png', 240, 240);
        $cacheFullPath = WWW_ROOT . 'thumb-test/240x240f/images/test.png';

        try {
            $this->assertSame('/thumb-test/240x240f/images/test.png', $result);
            $this->assertFileExists($cacheFullPath);

            $image = imagecreatefrompng($cacheFullPath);
            $this->assertNotFalse($image);
            $this->assertSame(240, imagesx($image));
            $this->assertSame(240, imagesy($image));

            // 120x80 source scales to 240x160: left edge is image, top rows are padding
            $white = 0xFFFFFF;
            $this->assertSame($white, imagecolorat($image, 120, 2) & 0xFFFFFF);
            $this->assertNotSame($white, imagecolorat($image, 2, 120) & 0xFFFFFF);
        } finally {
            if (is_file($cacheFullPath)) {
                unlink($cacheFullPath);
            }
            $this->removeEmptyCacheDirs(dirname($cacheFullPath));
        }
    }

    /**
     * Test getDriverInfo returns expected structure
     *
     * @return void
     */
    public function testGetDriverInfo(): void
    {
        $info = $this->Image->getDriverInfo();

        $this->assertArrayHasKey('driver', $info);
        $this->assertArrayHasKey('available', $info);
        $this->assertArrayHasKey('imagick', $info['available']);
        $this->assertArrayHasKey('vips', $info['available']);
        $this->assertArrayHasKey('gd', $info['available']);
        $this->assertIsBool($info['available']['imagick']);
        $this->assertIsBool($info['available']['vips']);
        $this->assertIsBool($info['available']['gd']);
    }

    /**
     * Test getDriverInfo driver value matches available extensions
     *
     * @return void
     */
    public function testGetDriverInfoMatchesAvailable(): void
    {
        $info = $this->Image->getDriverInfo();

        if ($info['available']['vips']) {
            $this->assertSame('vips', $info['driver']);
        } elseif ($info['available']['imagick']) {
            $this->assertSame('imagick', $info['driver']);
        } elseif ($info['available']['gd']) {
            $this->assertSame('gd', $info['driver']);
        }
    }

    /**
     * Test cache path generation for resize
     *
     * @return void
     */
    public function testCachePathResize(): void
    {
        $reflection = new \ReflectionClass($this->Image);
        $method = $reflection->getMethod('getCachePath');
        $method->setAccessible(true);

        $result = $method->invoke($this->Image, '/images/photo.jpg', 100, 100, 'resize', 'jpg');
        $this->assertSame('/thumb/100x100/images/photo.jpg', $result);
    }

    /**
     * Test cache path generation for crop
     *
     * @return void
     */
    public function testCachePathCrop(): void
    {
        $reflection = new \ReflectionClass($this->Image);
        $method = $reflection->getMethod('getCachePath');
        $method->setAccessible(true);

        $result = $method->invoke($this->Image, '/images/photo.jpg', 200, 150, 'crop', 'jpg');
        $this->assertSame('/thumb/200x150c/images/photo.jpg', $result);
    }

    /**
     * Test cache path generation for fit
     *
     * @return void
     */
    public function testCachePathFit(): void
    {
        $reflection = new \ReflectionClass($this->Image);
        $method = $reflection->getMethod('getCachePath');
        $method->setAccessible(true);

        $result = $method->invoke($this->Image, '/images/photo.png', 300, 200, 'fit', 'png');
        $this->assertSame('/thumb/300x200f/images/photo.png', $result);
    }

    /**
     * Test cache path with format conversion
     *
     * @return void
     */
    public function testCachePathWithFormatConversion(): void
    {
        $reflection = new \ReflectionClass($this->Image);
        $method = $reflection->getMethod('getCachePath');
        $method->setAccessible(true);

        $result = $method->invoke($this->Image, '/images/photo.jpg', 100, 100, 'resize', 'webp');
        $this->assertSame('/thumb/100x100/images/photo.webp', $result);
    }

    /**
     * Test cache path with custom temp folder
     *
     * @return void
     */
    public function testCachePathWithCustomTempFolder(): void
    {
        $view = new View();
        $helper = new ImageHelper($view, ['tempFolder' => '/cache/thumbs']);

        $reflection = new \ReflectionClass($helper);
        $method = $reflection->getMethod('getCachePath');
        $method->setAccessible(true);

        $result = $method->invoke($helper, '/images/photo.jpg', 100, 100, 'resize', 'jpg');
        $this->assertSame('/cache/thumbs/100x100/images/photo.jpg', $result);
    }

    /**
     * Test cache path preserves nested directory structure
     *
     * @return void
     */
    public function testCachePathPreservesNestedDirectory(): void
    {
        $reflection = new \ReflectionClass($this->Image);
        $method = $reflection->getMethod('getCachePath');
        $method->setAccessible(true);

        $result = $method->invoke($this->Image, '/images/products/electronics/photo.jpg', 100, 100, 'resize', 'jpg');
        $this->assertSame('/thumb/100x100/images/products/electronics/photo.jpg', $result);
    }

    /**
     * Test cache path for a file in the webroot has no empty or dot directory segment
     *
     * @return void
     */
    public function testCachePathForRootLevelFile(): void
    {
        $reflection = new \ReflectionClass($this->Image);
        $method = $reflection->getMethod('getCachePath');

        $this->assertSame('/thumb/100x100/photo.jpg', $method->invoke($this->Image, '/photo.jpg', 100, 100, 'resize', 'jpg'));
        $this->assertSame('/thumb/100x100c/photo.jpg', $method->invoke($this->Image, 'photo.jpg', 100, 100, 'crop', 'jpg'));
    }

    /**
     * Test tempFolder without a leading slash or with a trailing slash is normalized
     *
     * @return void
     */
    public function testCachePathNormalizesTempFolder(): void
    {
        $helper = new ImageHelper(new View(), ['tempFolder' => 'cache/thumbs/']);
        $reflection = new \ReflectionClass($helper);
        $method = $reflection->getMethod('getCachePath');

        $result = $method->invoke($helper, '/images/photo.jpg', 100, 100, 'resize', 'jpg');
        $this->assertSame('/cache/thumbs/100x100/images/photo.jpg', $result);
    }

    /**
     * Test a path without a leading slash is resolved against the webroot
     *
     * @return void
     */
    public function testResizePathWithoutLeadingSlash(): void
    {
        if (!extension_loaded('gd')) {
            $this->markTestSkipped('GD extension not available.');
        }

        $helper = new ImageHelper(new View(), ['driver' => 'gd', 'tempFolder' => '/thumb-test']);
        $result = $helper->resize('images/test.png', 54, 54);
        $cacheFullPath = WWW_ROOT . 'thumb-test/54x54/images/test.png';

        try {
            $this->assertSame('/thumb-test/54x54/images/test.png', $result);
            $this->assertFileExists($cacheFullPath);
        } finally {
            if (is_file($cacheFullPath)) {
                unlink($cacheFullPath);
            }
            $this->removeEmptyCacheDirs(dirname($cacheFullPath));
        }
    }

    /**
     * Test unsupported output formats return the original path without processing
     *
     * @return void
     */
    public function testUnsupportedFormatReturnsOriginal(): void
    {
        $helper = new ImageHelper(new View(), ['tempFolder' => '/thumb-test']);

        $this->assertSame('/images/test.png', $helper->resize('/images/test.png', 55, 55, 'tiff'));
        $this->assertDirectoryDoesNotExist(WWW_ROOT . 'thumb-test/55x55');
    }

    /**
     * Test an unknown driver name fails safely
     *
     * @return void
     */
    public function testUnknownDriverReturnsOriginal(): void
    {
        $helper = new ImageHelper(new View(), ['driver' => 'imagemagick', 'tempFolder' => '/thumb-test']);
        $reflection = new \ReflectionClass($helper);
        $method = $reflection->getMethod('createDriver');

        try {
            $this->assertSame('/images/test.png', $helper->resize('/images/test.png', 56, 56));
            $this->assertFileDoesNotExist(WWW_ROOT . 'thumb-test/56x56/images/test.png');
        } finally {
            $this->removeEmptyCacheDirs(WWW_ROOT . 'thumb-test/56x56/images');
        }

        $this->expectException(\InvalidArgumentException::class);
        $method->invoke($helper, 'imagemagick');
    }

    /**
     * Test getDriverInfo reports the configured driver
     *
     * @return void
     */
    public function testGetDriverInfoReportsConfiguredDriver(): void
    {
        $helper = new ImageHelper(new View(), ['driver' => 'GD']);
        $info = $helper->getDriverInfo();

        $this->assertSame('gd', $info['driver']);
        $this->assertSame(extension_loaded('gd'), $info['available']['gd']);
    }

    /**
     * Test driver detection priority: vips > imagick > gd
     *
     * @return void
     */
    public function testDetectDriverPriority(): void
    {
        $reflection = new \ReflectionClass($this->Image);
        $method = $reflection->getMethod('isVipsAvailable');
        $method->setAccessible(true);
        $vipsAvailable = $method->invoke($this->Image);

        $detectMethod = $reflection->getMethod('detectDriver');
        $detectMethod->setAccessible(true);
        $result = $detectMethod->invoke($this->Image);

        $this->assertContains($result, ['imagick', 'vips', 'gd']);

        if ($vipsAvailable) {
            $this->assertSame('vips', $result);
        } elseif (extension_loaded('imagick')) {
            $this->assertSame('imagick', $result);
        }
    }

    /**
     * Test paths with parent-directory segments are returned unchanged and not processed
     *
     * @return void
     */
    public function testParentDirectorySegmentsAreRejected(): void
    {
        $helper = new ImageHelper(new View(), ['tempFolder' => '/thumb-test']);
        $path = '/../webroot/images/test.png';

        $this->assertSame($path, $helper->resize($path, 51, 51));
        $this->assertSame('/images/../images/test.png', $helper->crop('/images/../images/test.png', 51));
        $this->assertDirectoryDoesNotExist(WWW_ROOT . 'thumb-test/51x51');
        $this->assertDirectoryDoesNotExist(WWW_ROOT . 'thumb-test/51x51c');
    }

    /**
     * Test an unwritable cache directory returns the original path instead of throwing
     *
     * @return void
     */
    public function testUnwritableCacheDirectoryReturnsOriginal(): void
    {
        $cacheDir = WWW_ROOT . 'thumb-test/52x52/images';
        if (!is_dir($cacheDir)) {
            mkdir($cacheDir, 0755, true);
        }
        chmod($cacheDir, 0555);

        try {
            if (is_writable($cacheDir)) {
                $this->markTestSkipped('Cannot make directory read-only (running as root?).');
            }

            $helper = new ImageHelper(new View(), ['tempFolder' => '/thumb-test']);
            $this->assertSame('/images/test.png', $helper->resize('/images/test.png', 52, 52));
        } finally {
            chmod($cacheDir, 0755);
            $this->removeEmptyCacheDirs($cacheDir);
        }
    }

    /**
     * Test a cached image older than its source is regenerated
     *
     * @return void
     */
    public function testStaleCacheIsRegenerated(): void
    {
        if (!extension_loaded('gd')) {
            $this->markTestSkipped('GD extension not available.');
        }

        $helper = new ImageHelper(new View(), ['driver' => 'gd', 'tempFolder' => '/thumb-test']);
        $cachePath = $helper->resize('/images/test.png', 53, 53);
        $cacheFullPath = WWW_ROOT . ltrim($cachePath, '/');
        $sourceMtime = (int)filemtime(WWW_ROOT . 'images/test.png');

        try {
            $this->assertFileExists($cacheFullPath);
            touch($cacheFullPath, $sourceMtime - 60);
            clearstatcache();

            $this->assertSame($cachePath, $helper->resize('/images/test.png', 53, 53));
            clearstatcache();
            $this->assertGreaterThanOrEqual($sourceMtime, filemtime($cacheFullPath));
        } finally {
            if (is_file($cacheFullPath)) {
                unlink($cacheFullPath);
            }
            $this->removeEmptyCacheDirs(dirname($cacheFullPath));
        }
    }

    /**
     * @param string $path
     * @return void
     */
    private function removeEmptyCacheDirs(string $path): void
    {
        while (str_starts_with($path, WWW_ROOT) && $path !== WWW_ROOT && is_dir($path)) {
            if (!@rmdir($path)) {
                break;
            }
            $path = dirname($path);
        }
    }
}
