<?php

/**
 * @author Mygento Team
 * @copyright 2015-2025 Mygento (https://www.mygento.com)
 * @package Mygento_Metrika
 */

namespace Mygento\Metrika\Block\Tracker;

use Magento\Catalog\Model\Category;
use Magento\Framework\View\Element\BlockInterface;
use Mygento\Metrika\Block\Tracker;

/**
 * Metrika Page Block
 */
class Impression extends Tracker
{
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
     */
    public function getCurrentCategoryName(): string
    {
        if (!$this->getShowCategory()) {
            return '';
        }
        /** @var Category $category */
        $category = $this->getCurrentCategory();

        if ($category && $this->_storeManager->getStore()->getRootCategoryId() != $category->getId()) {
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
     */
    protected function _toHtml(): string
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

    private function getProductCollection(): mixed
    {
        if (!$this->getListBlock()) {
            return null;
        }

        if (in_array($this->getListType(), ['related', 'crosssell', 'upsell'])) {
            return  $this->getListBlock()->getItemCollection() ?: $this->getListBlock()->getItems();
        }

        return $this->getListBlock()->getLoadedProductCollection();
    }
}
