<?php

declare(strict_types=1);

namespace Brammo\Content\View\Helper;

use Cake\View\Helper;
use Cake\I18n\Date;
use Cake\I18n\DateTime;

/**
 * Date helper
 */
class DateHelper extends Helper
{
    /**
     * Default configuration.
     *
     * @var array<string, mixed>
     */
    protected array $_defaultConfig = [];

    /**
     * Returns nicely formatted date
     *
     * @param \Cake\I18n\Date|\Cake\I18n\DateTime|string $date Date
     * @return string Formatted text
     */
    public function nice(Date|DateTime|string $date): string
    {
        $date = new DateTime($date);

        return (string)($date->i18nFormat('d MMMM yyyy'));
    }

    /**
     * Returns formatted date range
     *
     * @param \Cake\I18n\DateTime|string $startDate Start date
     * @param \Cake\I18n\DateTime|string $endDate End date
     * @return string Formatted text
     */
    public function range($startDate, $endDate): string
    {
        $startDate = new DateTime($startDate);
        $endDate = new DateTime($endDate);

        if ($startDate == $endDate) {
            return $this->nice($startDate);
        }

        $startYear = $startDate->i18nFormat('yyyy');
        $endYear = $endDate->i18nFormat('yyyy');

        if ($startYear != $endYear) {
            return $this->nice($startDate) . ' – ' . $this->nice($endDate);
        }

        $startMonth = $startDate->i18nFormat('MMMM');
        $endMonth = $endDate->i18nFormat('MMMM');
        $startDay = $startDate->i18nFormat('d');
        $endDay = $endDate->i18nFormat('d');

        if ($startMonth == $endMonth) {
            return $startDay . ' – ' . $endDay . ' ' . $startMonth . ' ' . $startYear;
        }

        return $startDay . ' ' . $startMonth . ' – ' . $endDay . ' ' . $endMonth . ' ' . $startYear;
    }
}
