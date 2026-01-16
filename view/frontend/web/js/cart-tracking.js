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
            updateEventName: 'ajax:updateItemQty',
            currencyCode: null,
            productIdAttr: 'sku'
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
            const self = this;

            $(document).on(this.options.addEventName, function(event, data) {
                self.setToTemporaryEventStorage(self.options.addEventName, data || {});
            });

            $(document).on(this.options.removeEventName, function(event, data) {
                self.setToTemporaryEventStorage(self.options.removeEventName, data || {});
            });

            $(document).on(this.options.updateEventName, function(event, data) {
                self.setToTemporaryEventStorage(self.options.updateEventName, data || {});
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
            const self = this;

            const cart = customerData.get('cart');
            const initial = cart();
            self.cartItemsCache = initial.items ? initial.items.map(a => {return {...a}}) : [];

            customerData.get('cart').subscribe(function(cartItems) {
                if (self.temporaryEventStorage.length) {
                    self.detectQtyChanges(cartItems.items, self.cartItemsCache);
                }

                self.cartItemsCache = cartItems.items ? cartItems.items.map(a => {return {...a}}) : [];
            });
        },

        /**
         * Detect cart changes by comparing current and cached cart items
         */
        detectQtyChanges: function(currentItems, previousItems) {
            const self = this;
            const items = currentItems || [];

            items.forEach(function(cartItem) {
                const cachedItem = previousItems.find(function(item) {
                    return item['product_id'] === cartItem['product_id'];
                });

                const currentQty = cartItem?.qty ?? 0;
                const previousQty = cachedItem?.qty ?? 0;
                const qtyDiff = Math.abs(currentQty - previousQty);

                if (qtyDiff > 0) {
                    if (currentQty > previousQty) {
                        self.handleAddToCart(cartItem, qtyDiff);
                    } else if (currentQty < previousQty) {
                        self.handleRemoveFromCart(cartItem, qtyDiff);
                    }
                }
            });

            previousItems.forEach(function(cachedItem) {
                const currentItem = items.find(function(item) {
                    return item['product_id'] === cachedItem['product_id'];
                });

                if (!currentItem) {
                    self.handleRemoveFromCart(cachedItem, cachedItem?.qty ?? 0);
                }
            });
        },

        handleAddToCart: function(cartItem, qty) {
            this.trackCartEvent('add', cartItem, qty);
        },

        handleRemoveFromCart: function(cartItem, qty) {
            this.trackCartEvent('remove', cartItem, qty);
        },

        trackCartEvent: function(action, cartItem, qty) {
            let item = this.extractProductData(cartItem);

            if (!item.id) {
                return;
            }
            item.quantity = qty;

            let ecommerceData = {};
            ecommerceData[action] = {
                products: [item]
            };

            if (this.options.currencyCode) {
                ecommerceData.currencyCode = this.options.currencyCode;
            }

            window[this.options.containerName].push({
                ecommerce: ecommerceData
            });
        },

        extractProductData: function(cartItem) {
            if (!Object.keys(cartItem ?? {}).length) {
                return {};
            }

            return {
                id: this.getProductId(cartItem),
                name: cartItem['product_name'] ,
                price: cartItem['product_price_value'] ,
            };
        },

        getProductId: function(cartItem) {
            const attr = this.options.productIdAttr;

            switch (attr) {
                case 'entity_id':
                    return cartItem['product_id'] || '';
                case 'name':
                    return cartItem['product_name'] || '';
                case 'sku':
                default:
                    return cartItem['product_sku'] || '';
            }
        },
    });

    return $.mygento.cartTracking;
});
