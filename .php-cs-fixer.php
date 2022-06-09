<?php
$header = <<<EOF
@author Mygento Team
@copyright 2015-2022 Mygento (https://www.mygento.ru)
@package Mygento_Metrika
EOF;

$finder = PhpCsFixer\Finder::create()->in('.')->name('*.phtml');
$config = new \Mygento\CS\Config\Module($header);
$config->setFinder($finder);
return $config;
