<?php

/**
 * @author Mygento Team
 * @copyright 2015-2025 Mygento (https://www.mygento.com)
 * @package Mygento_Metrika
 */

namespace Mygento\Metrika\CustomerData;

use Magento\Customer\CustomerData\SectionSourceInterface;
use Magento\Framework\Session\SessionManagerInterface;

class Metrika implements SectionSourceInterface
{
    public function __construct(
        private SessionManagerInterface $session,
    ) {}

    public function getSectionData(): array
    {
        $data = $this->session->getMetrika();
        if ($data && is_array($data)) {
            $this->session->unsMetrika();

            return $data;
        }

        return [];
    }
}
