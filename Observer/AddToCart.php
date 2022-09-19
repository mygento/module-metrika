<?php

/**
 * @author Mygento Team
 * @copyright 2015-2021 Mygento (https://www.mygento.ru)
 * @package Mygento_Metrika
 */

namespace Mygento\Metrika\Observer;

/**
 * Class AddToCart
 * @package Mygento\Metrika\Observer
 */
class AddToCart implements \Magento\Framework\Event\ObserverInterface
{
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
     * @var \Mygento\Base\Helper\Data
     */
    private $helper;

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
        $this->helper = $helper;
        $this->productHelper = $productHelper;
    }

    /**
     * @param \Magento\Framework\Event\Observer $observer
     * @return void
     */
    public function execute(\Magento\Framework\Event\Observer $observer)
    {
        if (!$this->helper->getConfig('metrika/general/enabled')) {
            return;
        }

        $product = $observer->getEvent()->getProduct();
        $request = $observer->getEvent()->getRequest();
        $params = $request->getParams();
        $qty = isset($params['qty']) && $params['qty'] ? $params['qty'] : 1;

        $data = [
            'ecommerce' => [
                'add' => [
                    'products' => [
                        'id' => (string) $this->productHelper->getValueByConfigPathOrDefault(
                            'metrika/general/skuAttr',
                            $product->getId()
                        ),
                        'name' => $product->getName(),
                        'price' => round($product->getFinalPrice(), 2),
                        'quantity' => $qty,
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
