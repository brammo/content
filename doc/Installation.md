# Installation

## Requirements

- PHP 8.1+
- CakePHP 5.0+

## Install via Composer

You can install this plugin using [Composer](https://getcomposer.org):

```bash
composer require brammo/content
```

## Load the Plugin

Add the following to your `Application.php`:

```php
public function bootstrap(): void
{
    parent::bootstrap();
    
    $this->addPlugin('Brammo/Content');
}
```

Load via `config/plugins.php`:

```php
return [
    'Brammo/Content',
];
```

Or load via command line:

```bash
bin/cake plugin load Brammo/Content
```
