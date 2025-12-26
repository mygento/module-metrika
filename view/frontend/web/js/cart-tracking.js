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
            currencyCode: null,
            productIdAttr: 'sku'
        },

        /**
         * Widget initialization
         */
        _create: function() {
            this.initContainer();
            this.setCartDataListener();
        },

        initContainer: function() {
            window[this.options.containerName] = window[this.options.containerName] || [];
        },

        /**
         * Subscribe to cart data updates
         */
        setCartDataListener: function() {
            const self = this;

            const cart = customerData.get('cart');
            const initial = cart();
            const initialItems = initial.items || [];

            if (initialItems.length > 0 || !this.getPreviousItems().length) {
                this.savePreviousItems(initialItems);
            }

            customerData.get('cart').subscribe(function(data) {
                const previousItems = self.getPreviousItems();
                const currentItems = data.items || [];

                if (previousItems.length > 0) {
                    self.detectQtyChanges(currentItems, previousItems);
                }

                if (currentItems.length > 0) {
                    self.savePreviousItems(currentItems);
                } else if (previousItems.length > 0) {
                    self.clearPreviousItems();
                }
            });
        },

        savePreviousItems: function(items) {
            try {
                sessionStorage.setItem('mygento_metrika_previous_items', JSON.stringify(items));
            } catch (e) {}
        },

        getPreviousItems: function() {
            try {
                const stored = sessionStorage.getItem('mygento_metrika_previous_items');
                return stored ? JSON.parse(stored) : [];
            } catch (e) {
                return [];
            }
        },

        clearPreviousItems: function() {
            try {
                sessionStorage.removeItem('mygento_metrika_previous_items');
            } catch (e) {}
        },

        /**
         * Detect cart changes by comparing current and cached cart items
         */
        detectQtyChanges: function(currentItems, previousItems) {
            const self = this;
            const items = currentItems || [];

            items.forEach(function(cartItem) {
                const cachedItem = previousItems.find(function(item) {
                    return item['product_id'] === cartItem['product_id'] ||
                        item['product_sku'] === cartItem['product_sku'];
                });

                const currentQty = cartItem?.qty ?? 0;
                const previousQty = cachedItem?.qty ?? 0;
                const qtyDiff = Math.abs(currentQty - previousQty);

                if (qtyDiff > 0) {
                    if (currentQty > previousQty) {
                        self.trackCartEvent('add', cartItem, qtyDiff);
                    } else if (currentQty < previousQty) {
                        self.trackCartEvent('remove', cartItem, qtyDiff);
                    }
                }
            });

            previousItems.forEach(function(cachedItem) {
                const currentItem = items.find(function(item) {
                    return item['product_id'] === cachedItem['product_id'] ||
                        item['product_sku'] === cachedItem['product_sku'];
                });

                if (!currentItem) {
                    self.trackCartEvent('remove', cachedItem, cachedItem?.qty ?? 0);
                }
            });
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
