<?php

declare(strict_types=1);

namespace Brammo\Content\Test\TestCase\View\Helper;

use Brammo\Content\View\Helper\FlagHelper;
use Cake\TestSuite\TestCase;
use Cake\View\View;

/**
 * Brammo\Content\View\Helper\FlagHelper Test Case
 */
class FlagHelperTest extends TestCase
{
    /**
     * Test subject
     *
     * @var \Brammo\Content\View\Helper\FlagHelper
     */
    protected FlagHelper $FlagHelper;

    /**
     * setUp method
     *
     * @return void
     */
    public function setUp(): void
    {
        parent::setUp();
        $view = new View();
        $this->FlagHelper = new FlagHelper($view);
    }

    /**
     * tearDown method
     *
     * @return void
     */
    public function tearDown(): void
    {
        unset($this->FlagHelper);
        parent::tearDown();
    }

    /**
     * Test icon method with lowercase country code
     *
     * @return void
     */
    public function testIconWithLowercaseCode(): void
    {
        $result = $this->FlagHelper->icon('us');

        $this->assertSame('<i class="flag-icon flag-icon-us"></i>', $result);
    }

    /**
     * Test icon method with uppercase country code
     *
     * @return void
     */
    public function testIconWithUppercaseCode(): void
    {
        $result = $this->FlagHelper->icon('DE');

        $this->assertSame('<i class="flag-icon flag-icon-de"></i>', $result);
    }

    /**
     * Test icon method with mixed case country code
     *
     * @return void
     */
    public function testIconWithMixedCaseCode(): void
    {
        $result = $this->FlagHelper->icon('Nl');

        $this->assertSame('<i class="flag-icon flag-icon-nl"></i>', $result);
    }

    /**
     * Test icon method with invalid code (too long)
     *
     * @return void
     */
    public function testIconWithTooLongCode(): void
    {
        $result = $this->FlagHelper->icon('usa');

        $this->assertSame('', $result);
    }

    /**
     * Test icon method with invalid code (too short)
     *
     * @return void
     */
    public function testIconWithTooShortCode(): void
    {
        $result = $this->FlagHelper->icon('u');

        $this->assertSame('', $result);
    }

    /**
     * Test icon method with invalid code (numeric)
     *
     * @return void
     */
    public function testIconWithNumericCode(): void
    {
        $result = $this->FlagHelper->icon('12');

        $this->assertSame('', $result);
    }

    /**
     * Test icon method with invalid code (alphanumeric)
     *
     * @return void
     */
    public function testIconWithAlphanumericCode(): void
    {
        $result = $this->FlagHelper->icon('u1');

        $this->assertSame('', $result);
    }

    /**
     * Test icon method with empty string
     *
     * @return void
     */
    public function testIconWithEmptyString(): void
    {
        $result = $this->FlagHelper->icon('');

        $this->assertSame('', $result);
    }

    /**
     * Test that CSS is appended to view block on initialization
     *
     * @return void
     */
    public function testCssBlockIsAppended(): void
    {
        $view = new View();
        new FlagHelper($view);

        $cssBlock = $view->fetch('css');

        $this->assertStringContainsString('<link rel="stylesheet"', $cssBlock);
        $this->assertStringContainsString('flag-icons.min.css', $cssBlock);
        $this->assertStringContainsString('integrity=', $cssBlock);
        $this->assertStringContainsString('crossorigin=', $cssBlock);
    }

    /**
     * Test custom CSS configuration
     *
     * @return void
     */
    public function testCustomCssConfiguration(): void
    {
        $view = new View();
        new FlagHelper($view, [
            'cssPath' => 'https://example.com/flags.css',
            'cssIntegrity' => 'sha256-test',
            'cssCrossorigin' => 'use-credentials',
        ]);

        $cssBlock = $view->fetch('css');

        $this->assertStringContainsString('https://example.com/flags.css', $cssBlock);
        $this->assertStringContainsString('sha256-test', $cssBlock);
        $this->assertStringContainsString('use-credentials', $cssBlock);
    }

    /**
     * Test default configuration values
     *
     * @return void
     */
    public function testDefaultConfiguration(): void
    {
        $this->assertStringContainsString(
            'cdn.jsdelivr.net',
            $this->FlagHelper->getConfig('cssPath')
        );
        $this->assertNotEmpty($this->FlagHelper->getConfig('cssIntegrity'));
        $this->assertSame('anonymous', $this->FlagHelper->getConfig('cssCrossorigin'));
    }
}
