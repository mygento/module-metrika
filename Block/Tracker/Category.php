<?php

/**
 * @author Mygento Team
 * @copyright 2015-2025 Mygento (https://www.mygento.com)
 * @package Mygento_Metrika
 */

namespace Mygento\Metrika\Block\Tracker;

use Magento\Framework\Registry;

/**
 * Metrika Page Block
 */
class Category extends \Mygento\Metrika\Block\Tracker
{
    /**
     * Get current category from registry
     *
     * @return \Magento\Catalog\Model\Category|null
     */
    public function getCurrentCategory()
    {
        return $this->getRegistry('current_category');
    }

    /**
     * Render Metrika tracking success scripts
     *
     * @SuppressWarnings(PHPMD.CamelCaseMethodName)
     * @return string
     */
    protected function _toHtml()
    {
        if (!$this->getConfig('ecommerce')) {
            return '';
        }

        return parent::_toHtml();
    }
}
