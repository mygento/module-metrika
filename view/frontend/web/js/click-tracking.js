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
            productSelector: '.product-item-info'
        },

        /**
         * Widget initialization
         */
        _create: function() {
            this._bindEvents();
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

        _getProductData: function($productElement, position) {
            return {
                'id': $productElement.find('[data-product-sku]').data('product-sku') || $productElement.find('[data-product-id]').data('product-id'),
                'name': $productElement.find('.product-item-name, .product-name, .product-item-link').first().text().trim().replace(/\s+/g, ' '),
                'price': this._getProductPrice($productElement),
                'category': this.options.categoryName,
                'list': this.options.categoryName,
                'position': position,
                'quantity': 1,

            };
        },

        _getProductPrice: function($productElement) {
            var priceText = $productElement.find('.price').text().trim();
            var price = parseFloat(priceText.replace(/[^\d.,]/g, '').replace(',', '.'));
            return isNaN(price) ? 0 : price;
        },
    });

    return $.mygento.clickTracking;
});
