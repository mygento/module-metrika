<?php

/**
 * @author Mygento Team
 * @copyright 2015-2025 Mygento (https://www.mygento.ru)
 * @package Mygento_Metrika
 */

namespace Mygento\Metrika\Block;

use Magento\Framework\Json\Helper\Data as JsonHelper;
use Magento\Framework\Registry;
use Magento\Framework\View\Element\Template\Context;
use Magento\Store\Model\StoreManagerInterface;
use Mygento\Base\Api\ProductAttributeHelperInterface;
use Mygento\Base\Helper\Data;

/**
 * Metrika Page Block
 */
class Tracker extends \Magento\Framework\View\Element\Template
{
    /**
     * Session
     *
     * @var \Magento\Framework\Session\SessionManagerInterface
     */
    protected $session;

    public function __construct(
        private StoreManagerInterface $storeManager,
        protected Data $helper,
        protected ProductAttributeHelperInterface $attributeHelper,
        protected Registry $coreRegistry,
        protected JsonHelper $jsonHelper,
        protected Context $context,
        array $data = [],
    ) {
        parent::__construct($context, $data);
        $this->session = $context->getSession();
    }

    /**
     * Get Dynamic tracker through events
     * @return array
     */
    public function getDynamicTrackers()
    {
        $data = $this->session->getMetrika();
        if ($data && is_array($data)) {
            $this->session->unsMetrika();

            return $data;
        }

        return [];
    }

    /**
     *  Get parameters for counter
     *
     * @return array
     */
    public function getOptions()
    {
        $options = [];
        $options['id'] = $this->getCode();
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
            $options['trackhash'] = (bool) $this->getConfig('trackhash');
        }
        if ($this->getConfig('accuratetrackbounce')) {
            $options['accurateTrackBounce'] =
                (bool) $this->getConfig('accuratetrackbounce');
        }
        if ($this->getConfig('noindex')) {
            $options['ut'] = 'noindex';
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
        return $this->storeManager->getStore()->getCurrentCurrencyCode();
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
