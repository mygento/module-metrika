<?php

/**
 * @author Mygento Team
 * @copyright 2015-2018 Mygento (https://www.mygento.ru)
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
     * @var \Mygento\Base\Helper\Data
     */
    private $helper;

    public function __construct(
        \Magento\Framework\Session\SessionManagerInterface $session,
        \Mygento\Base\Helper\Data $helper
    ) {
        $this->session = $session;
        $this->helper = $helper;
    }

    /**
     * @param Observer $observer
     * @return void
     */
    public function execute(\Magento\Framework\Event\Observer $observer)
    {
        $product = $observer->getEvent()->getProduct();
        $request = $observer->getEvent()->getRequest();
        $params = $request->getParams();
        $qty = isset($params['qty']) && $params['qty'] ? $params['qty'] : 1;

        $data = [
            'ecommerce' => [
                'add' => [
                    'products' => [
                        'id' => (string)$this->helper->getAttrValueByParam(
                            'metrika/general/skuAttr',
                            $product->getId()
                        ),
                        'name' => $product->getName(),
                        'price' => round($product->getFinalPrice(), 2),
                        'quantity' => $qty,
                    ]
                ]
            ]
        ];
        $this->setSessionData($data);
    }

    /**
     * Set or Update Session Data
     *
     * @param $data
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
