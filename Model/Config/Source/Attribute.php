<?php

/**
 * @author Mygento Team
 * @copyright 2015-2025 Mygento (https://www.mygento.com)
 * @package Mygento_Metrika
 */

namespace Mygento\Metrika\Model\Config\Source;

class Attribute implements \Magento\Framework\Data\OptionSourceInterface
{
    public function toOptionArray()
    {
        return  [
            ['value' => 'entity_id', 'label' => 'Entity ID'],
            ['value' => 'sku', 'label' => 'SKU'],
            ['value' => 'name', 'label' => 'Name'],
        ];
    }
}
