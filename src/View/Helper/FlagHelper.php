<?php

declare(strict_types=1);

namespace Brammo\Content\View\Helper;

use Cake\Event\EventInterface;
use Cake\View\Helper;

/**
 * Flag Helper
 *
 * Uses lipis/flag-icons for displaying country flags.
 * @see https://github.com/lipis/flag-icons
 */
class FlagHelper extends Helper
{
    /**
     * Default configuration.
     *
     * @var array<string, mixed>
     */
    protected array $_defaultConfig = [
        'cssPath' => 'https://cdn.jsdelivr.net/npm/flag-icon-css@4.1.7/css/flag-icons.min.css',
        'cssIntegrity' => 'sha256-8qup5VqQKcE2cLILwBU2zpXUkT+eW5tI1ZLzJjh/TdY=',
        'cssCrossorigin' => 'anonymous',
    ];

    /**
     * Initialize the helper
     *
     * @param array<string, mixed> $config Configuration options
     * @return void
     */
    public function initialize(array $config): void
    {
        parent::initialize($config);

        // Load CSS for flag icons
        $css = '<link rel="stylesheet" href="' . $this->getConfig('cssPath') .
            '" integrity="' . $this->getConfig('cssIntegrity') .
            '" crossorigin="' . $this->getConfig('cssCrossorigin') . '">';
        $this->getView()->append('css', $css);
    }

    /**
     * Returns flag icon HTML
     *
     * @param string $code Country ISO2 code (e.g., 'us', 'de')
     * @return string Flag icon HTML
     */
    public function icon(string $code): string
    {
        $code = strtolower($code);

        // Validate ISO2 code
        if (strlen($code) !== 2 || !ctype_alpha($code)) {
            return '';
        }

        return '<i class="flag-icon flag-icon-' . $code . '"></i>';
    }
}
