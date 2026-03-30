<?php
declare(strict_types=1);

if (!defined('ROOT_PATH')) {
    define('ROOT_PATH', __DIR__ . '/');
}

$configFile = ROOT_PATH . 'config.php';
$configSampleFile = ROOT_PATH . 'config.php.sample';

if (is_file($configFile)) {
    require_once $configFile;
} elseif (is_file($configSampleFile)) {
    require_once $configSampleFile;
}

require_once ROOT_PATH . 'includes/database.php';

$GLOBALS['app'] = [
    'db' => db(),
];
