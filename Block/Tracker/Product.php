<?php

/**
 * @author Mygento Team
 * @copyright 2015-2020 Mygento (https://www.mygento.ru)
 * @package Mygento_Metrika
 */

namespace Mygento\Metrika\Block\Tracker;

/**
 * Metrika Page Block
 */
class Product extends \Mygento\Metrika\Block\Tracker
{
    /**
     * Render Metrika tracking product scripts
     * @throws \Magento\Framework\Exception\NoSuchEntityException
     * @return string
     *
     * @SuppressWarnings(PHPMD.CamelCaseMethodName)
     */
    protected function _toHtml()
    {
        $currentProduct = $this->getRegistry('current_product');
        if (!$currentProduct || !$this->getConfig('ecommerce')) {
            return '';
        }
        $prodData = [
            'id' => (string) $this->attributeHelper->getValueByConfigPathOrDefault(
                'metrika/general/skuAttr',
                $currentProduct->getId()
            ),
            'name' => $currentProduct->getName(),
            'price' => round($currentProduct->getFinalPrice(), 2),
        ];
        if ($this->getRegistry('current_category')) {
            $prodData['category'] = $this->getRegistry('current_category')
                ->getName();
        }
        $data = [
            'ecommerce' => [
                'detail' => [
                    'products' => [$prodData],
                ],
            ],
        ];

        return '<script>' . $this->getConfig('container_name') . '.push(' .
            $this->jsonEncode($data) .
            ');</script>' . "\n";
    }
}
