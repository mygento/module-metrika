/**
 * @author Mygento Team
 * @copyright 2015-2025 Mygento (https://www.mygento.com)
 * @package Mygento_Metrika
 */

define([
    'jquery',
    'jquery-ui-modules/widget',
    'domReady!'
], function ($) {
    'use strict';

    /**
     * Product click tracking widget
     */
    $.widget('mygento.clickTracking', {
        options: {
            categoryName: '',
            containerName: 'dataLayer',
            currencyCode: '',
            productSelector: '.product-item-info',
            productIdAttr: 'sku'
        },

        /**
         * Widget initialization
         */
        _create: function() {
            this.bindEvents();
        },

        /**
         * Bind click events to product links
         */
        bindEvents: function() {
            const self = this;
            
            $(document).on('click', this.options.productSelector + ' a', function(e) {
                self.trackProductClick($(this));
            });
        },

        trackProductClick: function($link) {
            const $productElement = $link.closest(this.options.productSelector);
            if (!$productElement.length) return;

            const position = $productElement.parent().children(this.options.productSelector).index($productElement) + 1;
            const productData = this.getProductData($productElement, position);
            
            if (!productData.id) return;

            const clickData = {
                'ecommerce': {
                    'currencyCode': this.options.currencyCode,
                    'click': {
                        'products': [productData]
                    }
                }
            };

            window[this.options.containerName].push(clickData);
        },

        getProductData: function($productElement, position) {
            return {
                'id': this.getProductId($productElement),
                'name': $productElement.find('.product-item-name, .product-name, .product-item-link').first().text().trim().replace(/\s+/g, ' '),
                'price': this.getProductPrice($productElement),
                'category': this.options.categoryName,
                'list': this.options.categoryName,
                'position': position,
                'quantity': 1,

            };
        },

        getProductPrice: function($productElement) {
            const priceText = $productElement.find('.price').text().trim();
            const price = parseFloat(priceText.replace(/[^\d.,]/g, '').replace(',', '.'));
            return isNaN(price) ? 0 : price;
        },

        getProductId: function($productElement) {
            const attr = this.options.productIdAttr;

            if (attr === 'entity_id') {
                return $productElement.find('[data-product-id]').data('product-id');
            }

            if (attr === 'name') {
                return $productElement
                    .find('.product-item-name, .product-name, .product-item-link')
                    .first()
                    .text()
                    .trim()
                    .replace(/\s+/g, ' ');
            }

            return $productElement.find('[data-product-sku]').data('product-sku');
        },
    });

    return $.mygento.clickTracking;
});
