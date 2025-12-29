<?php

declare(strict_types=1);

namespace Brammo\Content\Test\TestCase\View\Helper;

use Brammo\Content\View\Helper\DateHelper;
use Cake\I18n\Date;
use Cake\I18n\DateTime;
use Cake\TestSuite\TestCase;
use Cake\View\View;

/**
 * App\View\Helper\DateHelper Test Case
 */
class DateHelperTest extends TestCase
{
    /**
     * Test subject
     *
     * @var \App\View\Helper\DateHelper
     */
    protected DateHelper $DateHelper;

    /**
     * setUp method
     *
     * @return void
     */
    public function setUp(): void
    {
        parent::setUp();
        $view = new View();
        $this->DateHelper = new DateHelper($view);
    }

    /**
     * tearDown method
     *
     * @return void
     */
    public function tearDown(): void
    {
        unset($this->DateHelper);
        parent::tearDown();
    }

    /**
     * Test nice method with DateTime object
     *
     * @return void
     */
    public function testNiceWithDateTime(): void
    {
        $date = new DateTime('2025-06-15');
        $result = $this->DateHelper->nice($date);

        $this->assertStringContainsString('15', $result);
        $this->assertStringContainsString('2025', $result);
    }

    /**
     * Test nice method with Date object
     *
     * @return void
     */
    public function testNiceWithDate(): void
    {
        $date = new Date('2025-12-25');
        $result = $this->DateHelper->nice($date);

        $this->assertStringContainsString('25', $result);
        $this->assertStringContainsString('2025', $result);
    }

    /**
     * Test nice method with string
     *
     * @return void
     */
    public function testNiceWithString(): void
    {
        $result = $this->DateHelper->nice('2025-01-01');

        $this->assertStringContainsString('1', $result);
        $this->assertStringContainsString('2025', $result);
    }

    /**
     * Test range method with same date
     *
     * @return void
     */
    public function testRangeSameDate(): void
    {
        $date = '2025-06-15';
        $result = $this->DateHelper->range($date, $date);

        // Should return the nice format of a single date
        $this->assertStringContainsString('15', $result);
        $this->assertStringContainsString('2025', $result);
        $this->assertStringNotContainsString('–', $result);
    }

    /**
     * Test range method with same month
     *
     * @return void
     */
    public function testRangeSameMonth(): void
    {
        $result = $this->DateHelper->range('2025-06-10', '2025-06-15');

        // Should show: 10 – 15 June 2025
        $this->assertStringContainsString('10', $result);
        $this->assertStringContainsString('15', $result);
        $this->assertStringContainsString('2025', $result);
        $this->assertStringContainsString('–', $result);
    }

    /**
     * Test range method with different months same year
     *
     * @return void
     */
    public function testRangeDifferentMonthsSameYear(): void
    {
        $result = $this->DateHelper->range('2025-06-28', '2025-07-05');

        // Should show: 28 June – 5 July 2025
        $this->assertStringContainsString('28', $result);
        $this->assertStringContainsString('5', $result);
        $this->assertStringContainsString('2025', $result);
        $this->assertStringContainsString('–', $result);
    }

    /**
     * Test range method with different years
     *
     * @return void
     */
    public function testRangeDifferentYears(): void
    {
        $result = $this->DateHelper->range('2025-12-28', '2026-01-05');

        // Should show full dates for both
        $this->assertStringContainsString('28', $result);
        $this->assertStringContainsString('2025', $result);
        $this->assertStringContainsString('5', $result);
        $this->assertStringContainsString('2026', $result);
        $this->assertStringContainsString('–', $result);
    }
}
