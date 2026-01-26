<?php

/**
 * @author Mygento Team
 * @copyright 2015-2026 Mygento (https://www.mygento.com)
 * @package Mygento_Metrika
 */

namespace Mygento\Metrika\Block;

use Magento\Framework\Json\Helper\Data as JsonHelper;
use Magento\Framework\Registry;
use Magento\Framework\View\Element\Template\Context;
use Mygento\Base\Api\ProductAttributeHelperInterface;
use Mygento\Base\Helper\Data;

/**
 * Metrika Page Block
 */
class Tracker extends \Magento\Framework\View\Element\Template
{
    public function __construct(
        protected Data $helper,
        protected ProductAttributeHelperInterface $attributeHelper,
        protected Registry $coreRegistry,
        protected JsonHelper $jsonHelper,
        protected Context $context,
        array $data = [],
    ) {
        parent::__construct($context, $data);
    }

    /**
     *  Get parameters for counter
     *
     * @return array
     */
    public function getOptions()
    {
        $options = [];
        if ($this->getConfig('webvisor')) {
            $options['webvisor'] = (bool) $this->getConfig('webvisor');
        }
        if ($this->getConfig('clickmap')) {
            $options['clickmap'] = (bool) $this->getConfig('clickmap');
        }
        if ($this->getConfig('tracklinks')) {
            $options['trackLinks'] = (bool) $this->getConfig('tracklinks');
        }
        if ($this->getConfig('trackhash')) {
            $options['trackHash'] = (bool) $this->getConfig('trackhash');
        }
        if ($this->getConfig('accuratetrackbounce')) {
            $options['accurateTrackBounce'] =
                (bool) $this->getConfig('accuratetrackbounce');
        }
        if ($this->getConfig('ecommerce')) {
            $options['ecommerce'] = $this->getConfig('container_name');
        }

        return $options;
    }

    /**
     * Get Tracker Code
     *
     * @return string
     */
    public function getCode()
    {
        return $this->getConfig('counter');
    }

    /**
     * Get config
     *
     * @param string $path
     * @return mixed
     */
    public function getConfig($path)
    {
        return $this->helper->getConfig('metrika/general/' . $path);
    }

    /**
     * Get data from Registry
     *
     * @param string $name
     * @return mixed
     */
    public function getRegistry($name)
    {
        return $this->coreRegistry->registry($name);
    }

    /**
     * @param mixed $data
     * @return string
     */
    public function jsonEncode($data)
    {
        return $this->jsonHelper->jsonEncode($data);
    }

    public function getCurrentCurrencyCode(): string
    {
        return $this->_storeManager->getStore()->getCurrentCurrencyCode();
    }

    /**
     * Render Metrika tracking scripts
     *
     * @SuppressWarnings(PHPMD.CamelCaseMethodName)
     * @return string
     */
    protected function _toHtml()
    {
        if (!$this->getConfig('enabled')) {
            return '';
        }

        return parent::_toHtml();
    }
}
