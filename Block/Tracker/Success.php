<?php

/**
 * @author Mygento Team
 * @copyright 2015-2019 Mygento (https://www.mygento.ru)
 * @package Mygento_Metrika
 */

namespace Mygento\Metrika\Block\Tracker;

/**
 * Metrika Page Block
 */
class Success extends \Mygento\Metrika\Block\Tracker
{
    /**
     * @var \Magento\Checkout\Model\Session
     */
    private $checkoutSession;

    /**
     * Success constructor.
     * @param \Mygento\Base\Helper\Data $helper
     * @param \Mygento\Base\Api\ProductAttributeHelperInterface $attributeHelper
     * @param \Magento\Checkout\Model\Session $checkoutSession
     * @param \Magento\Framework\Registry $coreRegistry
     * @param \Magento\Framework\Json\Helper\Data $jsonHelper
     * @param \Magento\Framework\View\Element\Template\Context $context
     * @param array $data
     */
    public function __construct(
        \Mygento\Base\Helper\Data $helper,
        \Mygento\Base\Api\ProductAttributeHelperInterface $attributeHelper,
        \Magento\Checkout\Model\Session $checkoutSession,
        \Magento\Framework\Registry $coreRegistry,
        \Magento\Framework\Json\Helper\Data $jsonHelper,
        \Magento\Framework\View\Element\Template\Context $context,
        array $data = []
    ) {
        parent::__construct($helper, $attributeHelper, $coreRegistry, $jsonHelper, $context, $data);
        $this->checkoutSession = $checkoutSession;
    }

    /**
     * Render Metrika tracking success scripts
     *
     * @SuppressWarnings(PHPMD.CamelCaseMethodName)
     * @return string
     */
    protected function _toHtml()
    {
        $order = $this->checkoutSession->getLastRealOrder();
        if (!$order->getIncrementId() || !$this->getConfig('ecommerce')) {
            return '';
        }
        $prodData = [];
        foreach ($order->getAllVisibleItems() as $item) {
            $qty = (int) $item->getQtyOrdered();
            $price = ($item->getRowTotal() - $item->getDiscountAmount()) / $qty;
            $prodData[] = [
                'id' => (string) $this->attributeHelper->getValueByConfigPathOrDefault(
                    'metrika/general/skuAttr',
                    $item->getProductId()
                ),
                'name' => $item->getName(),
                'price' => round($price, 2),
                'quantity' => (int) $item->getQtyOrdered(),
            ];
        }
        $data = [
            'ecommerce' => [
                'purchase' => [
                    'actionField' => [
                        'id' => (string) $order->getIncrementId(),
                        'shipping' => $order->getShippingAmount(),
                    ],
                    'products' => [$prodData],
                ],
            ],
        ];

        return '<script>' . $this->getConfig('container_name') . '.push(' .
            $this->jsonEncode($data) .
            ');</script>' . "\n";
    }
}
