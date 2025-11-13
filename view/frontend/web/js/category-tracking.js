/**
 * @author Mygento Team
 * @copyright 2015-2025 Mygento (https://www.mygento.com)
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
            currencyCode: '',
            productSelector: '.product-item-info'
        },

        /**
         * Widget initialization
         */
        _create: function() {
            this._bindEvents();
            this._initIntersectionObserver();
        },

        /**
         * Initialize Intersection Observer for product visibility tracking
         */
        _initIntersectionObserver: function() {
            var self = this;
            var trackedProducts = new Set();
            var pendingProducts = [];
            var sendTimeout = null;

            var observerOptions = {
                threshold: 0.5 // 50% of product must be visible
            };

            var observer = new IntersectionObserver(function(entries) {
                entries.forEach(function(entry) {
                    if (entry.isIntersecting) {
                        var $product = $(entry.target);
                        var productId = $product.find('[data-product-sku]').data('product-sku') || 
                                       $product.find('[data-product-id]').data('product-id');

                        if (!trackedProducts.has(productId)) {
                            trackedProducts.add(productId);
                            var position = $product.parent().children(self.options.productSelector).index($product) + 1;
                            var productData = self._getImpressionData($product, position);

                            pendingProducts.push(productData);
                        }
                    }
                });

                // Wait 100ms to collect more products
                clearTimeout(sendTimeout);
                sendTimeout = setTimeout(function() {
                    if (pendingProducts.length) {
                        self._sendBatchImpressions(pendingProducts.splice(0));
                    }
                }, 100);
            }, observerOptions);

            // Observe all products
            this.element.find(this.options.productSelector).each(function() {
                observer.observe(this);
            });
        },

        /**
         * Send batch of product impressions
         */
        _sendBatchImpressions: function(products) {
            if (products.length === 0) {
                return;
            }

            var impressionsData = {
                'ecommerce': {
                    'currencyCode': this.options.currencyCode,
                    'impressions': products
                }
            };

            window[this.options.containerName].push(impressionsData);
        },

        /**
         * Bind click events to product links
         */
        _bindEvents: function() {
            var self = this;
            
            $(document).on('click', this.options.productSelector + ' a', function(e) {
                self._trackProductClick($(this));
            });
        },

        _trackProductClick: function($link) {
            var $productElement = $link.closest(this.options.productSelector);
            if (!$productElement.length) return;

            var position = $productElement.parent().children(this.options.productSelector).index($productElement) + 1;
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
