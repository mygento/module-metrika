/**
 * @author Mygento Team
 * @copyright 2015-2025 Mygento (https://www.mygento.ru)
 * @package Mygento_Metrika
 */

define([
    'jquery',
    'jquery/ui',
    'domReady!'
], function ($) {
    'use strict';

    /**
     * Category product tracking widget
     */
    $.widget('mygento.categoryTracking', {
        options: {
            categoryName: '',
            containerName: 'dataLayer',
            currencyCode: ''
        },

        /**
         * Widget initialization
         */
        _create: function() {
            this._bindEvents();
            this._sendImpressions();
        },

        /**
         * Send product impressions (view events)
         * @private
         */
        _sendImpressions: function() {
            var self = this;
            var products = [];
            var position = 1;

            // Collect all visible products, avoid duplicates
            var $products = this.element.find('.product-item, .product-item-info');
            var seenIds = new Set();

            $products.each(function() {
                var $product = $(this);
                var productId = $product.find('[data-product-sku]').data('product-sku') || $product.find('[data-product-id]').data('product-id');
                
                // Skip if already processed this product
                if (seenIds.has(productId)) {
                    return;
                }
                
                seenIds.add(productId);
                
                var productData = self._getImpressionData($product, position);
                
                if (productData.id) {
                    products.push(productData);
                    position++;
                }
            });

            if (products.length > 0) {
                var impressionsData = {
                    'ecommerce': {
                        'currencyCode': this.options.currencyCode,
                        'impressions': products
                    }
                };

                window[this.options.containerName].push(impressionsData);
            }
        },

        /**
         * Bind click events to product links
         */
        _bindEvents: function() {
            var self = this;
            
            $(document).on('click', '.product-item a, .product-image, .product-item-info a', function(e) {
                self._trackProductClick($(this));
            });
        },

        _trackProductClick: function($link) {
            var $productElement = $link.closest('.product-item, .product-item-info');
            if (!$productElement.length) return;

            var position = $productElement.parent().children('.product-item, .product-item-info').index($productElement) + 1;
            var productData = this._getProductData($productElement, position);
            
            if (!productData.id) return;

            var clickData = {
                'ecommerce': {
                    'currencyCode': this.options.currencyCode,
                    'click': {
                        'products': [productData]
                    }
                }
            };

            window[this.options.containerName].push(clickData);
        },

        /**
         * Extract product data from DOM element for impressions
         */
        _getImpressionData: function($productElement, position) {
            return this._getBaseProductData($productElement, position);
        },

        /**
         * Extract product data from DOM element for clicks
         */
        _getProductData: function($productElement, position) {
            var baseData = this._getBaseProductData($productElement, position);
            baseData.quantity = 1;
            return baseData;
        },

        _getBaseProductData: function($productElement, position) {
            return {
                'id': $productElement.find('[data-product-sku]').data('product-sku') || $productElement.find('[data-product-id]').data('product-id'),
                'name': $productElement.find('.product-item-name, .product-name, .product-item-link').first().text().trim().replace(/\s+/g, ' '),
                'price': this._getProductPrice($productElement),
                'category': this.options.categoryName,
                'list': this.options.categoryName,
                'position': position,

            };
        },

        _getProductPrice: function($productElement) {
            var priceText = $productElement.find('.price').text().trim();
            var price = parseFloat(priceText.replace(/[^\d.,]/g, '').replace(',', '.'));
            return isNaN(price) ? 0 : price;
        },
    });

    return $.mygento.categoryTracking;
});
