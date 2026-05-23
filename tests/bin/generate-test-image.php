#!/usr/bin/env php
<?php

/**
 * Regenerate the ImageHelper test fixture at tests/test_app/webroot/images/test.png.
 *
 * Usage:
 *   php tests/bin/generate-test-image.php
 *   composer generate-test-image
 */

declare(strict_types=1);

if (PHP_SAPI !== 'cli') {
    fwrite(STDERR, "This script must be run from the command line.\n");
    exit(1);
}

if (!extension_loaded('gd')) {
    fwrite(STDERR, "The GD extension is required to generate the test image.\n");
    exit(1);
}

$root = dirname(__DIR__, 2);
$outputPath = $root . '/tests/test_app/webroot/images/test.png';
$outputDir = dirname($outputPath);

if (!is_dir($outputDir) && !mkdir($outputDir, 0755, true) && !is_dir($outputDir)) {
    fwrite(STDERR, "Failed to create directory: {$outputDir}\n");
    exit(1);
}

$width = 120;
$height = 80;

$image = imagecreatetruecolor($width, $height);
if ($image === false) {
    fwrite(STDERR, "Failed to create image resource.\n");
    exit(1);
}

$palette = [
    imagecolorallocate($image, 220, 53, 69),
    imagecolorallocate($image, 25, 135, 84),
    imagecolorallocate($image, 13, 110, 253),
    imagecolorallocate($image, 255, 193, 7),
];

for ($y = 0; $y < $height; $y++) {
    for ($x = 0; $x < $width; $x++) {
        $index = (int)(($x / $width + $y / $height) * 2) % count($palette);
        imagesetpixel($image, $x, $y, $palette[$index]);
    }
}

$white = imagecolorallocate($image, 255, 255, 255);
imagestring($image, 5, 8, 32, 'Brammo', $white);
imagestring($image, 3, 8, 52, 'test fixture', $white);

if (!imagepng($image, $outputPath)) {
    imagedestroy($image);
    fwrite(STDERR, "Failed to write PNG: {$outputPath}\n");
    exit(1);
}

imagedestroy($image);

$size = getimagesize($outputPath);
$dimensions = $size !== false ? "{$size[0]}x{$size[1]}" : 'unknown';
$bytes = filesize($outputPath);

echo "Generated {$outputPath} ({$dimensions}, {$bytes} bytes)\n";
