<?php

/**
 * @author Mygento Team
 * @copyright 2015-2021 Mygento (https://www.mygento.ru)
 * @package Mygento_Metrika
 */

namespace Mygento\Metrika\Observer;

/**
 * Class QuoteRemoveItem
 * @package Mygento\Metrika\Observer
 */
class QuoteRemoveItem implements \Magento\Framework\Event\ObserverInterface
{
    /**
     * @var \Mygento\Base\Helper\Data
     */
    private $helper;

    /**
     * Session
     *
     * @var \Magento\Framework\Session\SessionManagerInterface
     */
    private $session;

    /**
     * @var \Mygento\Base\Api\ProductAttributeHelperInterface
     */
    private $productHelper;

    /**
     * @param \Magento\Framework\Session\SessionManagerInterface $session
     * @param \Mygento\Base\Api\ProductAttributeHelperInterface $productHelper
     * @param \Mygento\Base\Helper\Data $helper
     */
    public function __construct(
        \Magento\Framework\Session\SessionManagerInterface $session,
        \Mygento\Base\Api\ProductAttributeHelperInterface $productHelper,
        \Mygento\Base\Helper\Data $helper
    ) {
        $this->session = $session;
        $this->productHelper = $productHelper;
        $this->helper = $helper;
    }

    /**
     * @param \Magento\Framework\Event\Observer $observer
     * @throws \Magento\Framework\Exception\NoSuchEntityException
     */
    public function execute(\Magento\Framework\Event\Observer $observer)
    {
        if (!$this->helper->getConfig('metrika/general/enabled')) {
            return;
        }

        $item = $observer->getEvent()->getQuoteItem();
        $product = $item->getProduct();
        $data = [
            'ecommerce' => [
                'remove' => [
                    'products' => [
                        'id' => (string) $this->productHelper->getValueByConfigPathOrDefault(
                            'metrika/general/skuAttr',
                            $product->getId()
                        ),
                        'name' => $product->getName(),
                    ],
                ],
            ],
        ];
        $this->setSessionData($data);
    }

    /**
     * Set or Update Session Data
     *
     * @param mixed $data
     * @return mixed
     */
    private function setSessionData($data)
    {
        $sessionData = $this->session->getMetrika();
        if ($sessionData && is_array($sessionData)) {
            $sessionData[] = $data;

            return $this->session->setMetrika($sessionData);
        }

        return $this->session->setMetrika([$data]);
    }
}
