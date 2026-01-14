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

            customerData.get('cart').subscribe(function(data) {
                if (self.temporaryEventStorage.length) {
                    self.executeEvents(data);
                }

                self.cartItemsCache = data.items ? data.items.map(a => {return {...a}}) : [];
            });
        },

        /**
         * Execute pending events with full product data from cart
         */
        executeEvents: function(cartData) {
            const self = this;
            const items = cartData.items || [];

            this.temporaryEventStorage.forEach(function(event) {
                const eventData = event.data;

                const cartItem = self.findCartItem(items, eventData);
                const cartItemCache = self.findCartItem(self.cartItemsCache, eventData);

                const currentQty = cartItem?.qty ?? 0;
                const prevQty = cartItemCache?.qty ?? 0;
                const qty = currentQty - prevQty;

                if (event.type === self.options.addEventName) {
                    self.handleAddToCart(cartItem, Math.abs(qty));
                } else if (event.type === self.options.removeEventName) {
                    self.handleRemoveFromCart(cartItemCache, Math.abs(qty));
                } else if (event.type === self.options.updateEventName) {
                    if (qty>0) {
                        self.handleAddToCart(cartItem, Math.abs(qty));
                    } else {
                        self.handleRemoveFromCart(cartItemCache, Math.abs(qty));
                    }
                }

            });

            this.temporaryEventStorage = [];
        },

        /**
         * Find cart item by product id
         */
        findCartItem: function(items, data) {

            const productId = (data.productInfo?.length === 1 && data.productInfo[0]?.id) || '';
            const itemId = data.item_id || data.id || '';
            const sku = data.sku || '';

            return items.find(item =>
                Number(item.item_id) === Number(itemId) ||
                item.product_id === productId ||
                item.product_sku === sku
            );
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

            if (item.currencyCode || this.options.currencyCode) {
                ecommerceData.currencyCode = item.currencyCode || this.options.currencyCode;
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
