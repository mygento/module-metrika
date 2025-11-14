<?php

/**
 * @author Mygento Team
 * @copyright 2015-2025 Mygento (https://www.mygento.com)
 * @package Mygento_Metrika
 */

namespace Mygento\Metrika\Block\Tracker;

use Magento\Catalog\Model\Category;
use Magento\Checkout\Helper\Cart;
use Magento\Framework\Registry;
use Magento\Framework\View\Element\BlockInterface;
use Magento\Framework\View\Element\Template\Context;
use Magento\Store\Model\StoreManagerInterface;
use Mygento\Base\Api\ProductAttributeHelperInterface;
use Mygento\Base\Helper\Data;
use Mygento\Metrika\Block\Tracker;

/**
 * Metrika Page Block
 */
class Impression extends Tracker
{
    public function __construct(
        private Cart $cart,
        private StoreManagerInterface $storeManager,
        Data $helper,
        ProductAttributeHelperInterface $attributeHelper,
        Registry $coreRegistry,
        \Magento\Framework\Json\Helper\Data $jsonHelper,
        Context $context,
        array $data = [],
    ) {
        parent::__construct($storeManager, $helper, $attributeHelper, $coreRegistry, $jsonHelper, $context, $data);
    }

    public function getCurrentCategory(): ?Category
    {
        /** @var Category $category */
        $category = null;
        if ($this->getRegistry('current_category')) {
            $category = $this->getRegistry('current_category');
        }

        return $category;
    }

    public function getImpressionItems(): array
    {
        $collection = $this->getProductCollection();

        if (!$collection || !count($collection)) {
            return [];
        }

        if (is_object($collection) && $collection->getCurPage() > 0) {
            $position = ($collection->getCurPage() - 1) * $collection->getPageSize() + 1;
        } else {
            $position = 1;
        }

        $items = [];
        $categoryName = $this->getCurrentCategoryName();

        foreach ($collection as $product) {
            $items[] = [
                'id' => $this->attributeHelper->getValueByConfigPathOrDefault(
                    'metrika/general/skuAttr',
                    $product->getId(),
                ),
                'name' => $product->getName(),
                'price' => round((float) $product->getFinalPrice(), 2),
                'category' => $categoryName,
                'list' => $this->getListType(),
                'position' => $position++,
            ];
        }

        return $items;
    }

    /**
     * @throws \Magento\Framework\Exception\NoSuchEntityException
     * @return string
     */
    public function getCurrentCategoryName()
    {
        if (!$this->getShowCategory()) {
            return '';
        }
        /** @var Category $category */
        $category = $this->getCurrentCategory();

        if ($category && $this->storeManager->getStore()->getRootCategoryId() != $category->getId()) {
            return $category->getName();
        }

        return '';
    }

    public function getCategoryName(): string
    {
        $category = $this->getCurrentCategory();

        return $category ? $category->getName() : '';
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

    private function getListBlock(): bool|BlockInterface
    {
        return $this->getLayout()->getBlock($this->getBlockName());
    }

    private function getProductCollection()
    {
        if (!$this->getListBlock()) {
            return null;
        }

        $productCollection = $this->getListBlock()->getLoadedProductCollection();

        if ($this->cart->getItemsCount()) {
            $productCollection = $this->getListBlock()->getItemCollection();
        }

        if (
            empty($productCollection)
            && ($this->getBlockName() == 'catalog.product.related'
                || $this->getBlockName() == 'checkout.cart.crosssell')
        ) {
            $productCollection = $this->getListBlock()->getItems();
        }

        return $productCollection;
    }
}
