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
        if (!extension_loaded('gd') && !extension_loaded('imagick') && !$this->isVipsAvailableForTest()) {
            $this->markTestSkipped('No image processing extension available.');
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
     * @return bool
     */
    private function isVipsAvailableForTest(): bool
    {
        return extension_loaded('vips')
            && class_exists('Intervention\\Image\\Drivers\\Vips\\Driver');
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
