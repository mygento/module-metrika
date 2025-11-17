/**
 * @author Mygento Team
 * @copyright 2015-2025 Mygento (https://www.mygento.com)
 * @package Mygento_Metrika
 */

define([
    'jquery',
    'Magento_Customer/js/customer-data',
    'jquery-ui-modules/widget',
    'domReady!'
], function ($, customerData) {
    'use strict';

    /**
     * Cart events tracking widget
     */
    $.widget('mygento.cartTracking', {
        options: {
            containerName: 'dataLayer',
            addEventName: 'ajax:addToCart',
            removeEventName: 'ajax:removeFromCart',
            currencyCode: null
        },

        /**
         * Widget initialization
         */
        _create: function() {
            this._initContainer();
            this.temporaryEventStorage = [];
            this.cartItemsCache = [];
            this._bindEvents();
            this._setCartDataListener();
        },

        _initContainer: function() {
            window[this.options.containerName] = window[this.options.containerName] || [];
        },

        _bindEvents: function() {
            var self = this;

            $(document).on(this.options.addEventName, function(event, data) {
                self._setToTemporaryEventStorage(self.options.addEventName, data || {});
            });

            $(document).on(this.options.removeEventName, function(event, data) {
                self._setToTemporaryEventStorage(self.options.removeEventName, data || {});
            });
        },

        /**
         * Store event to temporary storage until cart data is updated
         */
        _setToTemporaryEventStorage: function(eventType, eventData) {
            this.temporaryEventStorage.push({
                type: eventType,
                data: eventData
            });
        },

        /**
         * Subscribe to cart data updates
         */
        _setCartDataListener: function() {
            var self = this;

            customerData.get('cart').subscribe(function(data) {
                if (self.temporaryEventStorage.length) {
                    self._executeEvents(data);
                }

                self.cartItemsCache = data.items ? data.items.slice() : [];
            });
        },

        /**
         * Execute pending events with full product data from cart
         */
        _executeEvents: function(cartData) {
            var self = this;
            var items = cartData.items || [];

            this.temporaryEventStorage.forEach(function(event) {
                var eventData = event.data;
                var productInfo = eventData.productInfo || [];

                if (!Array.isArray(productInfo)) {
                    productInfo = [productInfo];
                }

                productInfo.forEach(function(info) {


                    if (event.type === self.options.addEventName) {
                        var cartItem = self._findCartItem(items, info);
                        self._handleAddToCart(cartItem);
                    } else if (event.type === self.options.removeEventName) {
                        var cartItemCache = self._findCartItem(self.cartItemsCache, info);
                        self._handleRemoveFromCart(cartItemCache);
                    }
                });
            });

            this.temporaryEventStorage = [];
        },

        /**
         * Find cart item by product id
         */
        _findCartItem: function(items, productInfo) {
            var productId = productInfo.id;

            for (var i = 0; i < items.length; i++) {
                if (items[i]['product_id'] === productId) {
                    return items[i];
                }
            }

            return null;
        },

        _handleAddToCart: function(cartItem) {
            this._trackCartEvent('add', cartItem);
        },

        _handleRemoveFromCart: function(cartItem) {
            this._trackCartEvent('remove', cartItem);
        },

        _trackCartEvent: function(action, cartItem) {
            var item = this._extractProductData(cartItem);

            if (!item.id) {
                return;
            }

            var ecommerceData = {};
            ecommerceData[action] = {
                products: [item]
            };

            if (item.currencyCode || this.options.currencyCode) {
                ecommerceData.currencyCode = item.currencyCode || this.options.currencyCode;
            }

            window[this.options.containerName].push({
                ecommerce: ecommerceData
            });
        },

        _extractProductData: function(cartItem) {
            if(!cartItem.length) {
                return {};
            }

            return {
                id: cartItem['product_sku'] || cartItem['product_id'] || cartItem['product_name'],
                name: cartItem['product_name'] ,
                price: cartItem['product_price_value'] ,
                quantity: cartItem.qty
            };
        }
    });

    return $.mygento.cartTracking;
});
