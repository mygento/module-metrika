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
            this.initContainer();
            this.temporaryEventStorage = [];
            this.cartItemsCache = [];
            this.bindEvents();
            this.setCartDataListener();
        },

        initContainer: function() {
            window[this.options.containerName] = window[this.options.containerName] || [];
        },

        bindEvents: function() {
            var self = this;

            $(document).on(this.options.addEventName, function(event, data) {
                self.setToTemporaryEventStorage(self.options.addEventName, data || {});
            });

            $(document).on(this.options.removeEventName, function(event, data) {
                self.setToTemporaryEventStorage(self.options.removeEventName, data || {});
            });
        },

        /**
         * Store event to temporary storage until cart data is updated
         */
        setToTemporaryEventStorage: function(eventType, eventData) {
            this.temporaryEventStorage.push({
                type: eventType,
                data: eventData
            });
        },

        /**
         * Subscribe to cart data updates
         */
        setCartDataListener: function() {
            var self = this;

            customerData.get('cart').subscribe(function(data) {
                if (self.temporaryEventStorage.length) {
                    self.executeEvents(data);
                }

                self.cartItemsCache = data.items ? data.items.slice() : [];
            });
        },

        /**
         * Execute pending events with full product data from cart
         */
        executeEvents: function(cartData) {
            var self = this;
            var items = cartData.items || [];

            this.temporaryEventStorage.forEach(function(event) {
                var eventData = event.data;
                var productInfo = eventData.productInfo || [];

                if (!Array.isArray(productInfo)) {
                    productInfo = [productInfo];
                }

                productInfo.forEach(function(info) {
                    var cartItem = self.findCartItem(items, info);
                    var cartItemCache = self.findCartItem(self.cartItemsCache, info);
                    var qty = cartItem && cartItemCache
                        ? Math.abs(cartItem.qty - cartItemCache.qty) : cartItem ? cartItem.qty : cartItemCache.qty;
                    if (event.type === self.options.addEventName) {
                        self.handleAddToCart(cartItem, qty);
                    } else if (event.type === self.options.removeEventName) {
                        self.handleRemoveFromCart(cartItemCache, qty);
                    }
                });
            });

            this.temporaryEventStorage = [];
        },

        /**
         * Find cart item by product id
         */
        findCartItem: function(items, productInfo) {
            var productId = productInfo.id;

            for (var i = 0; i < items.length; i++) {
                if (items[i]['product_id'] === productId) {
                    return items[i];
                }
            }

            return null;
        },

        handleAddToCart: function(cartItem, qty) {
            this.trackCartEvent('add', cartItem, qty);
        },

        handleRemoveFromCart: function(cartItem, qty) {
            this.trackCartEvent('remove', cartItem, qty);
        },

        trackCartEvent: function(action, cartItem, qty) {
            var item = this.extractProductData(cartItem);

            if (!item.id) {
                return;
            }
            item.quantity = qty;

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

        extractProductData: function(cartItem) {
            if(!Object.keys(cartItem).length) {
                return {};
            }

            return {
                id: cartItem['product_sku'] || cartItem['product_id'] || cartItem['product_name'],
                name: cartItem['product_name'] ,
                price: cartItem['product_price_value'] ,
            };
        }
    });

    return $.mygento.cartTracking;
});
