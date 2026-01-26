/**
 * @author Mygento Team
 * @copyright 2015-2026 Mygento (https://www.mygento.com)
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
      productIdAttr: 'sku',
      temporaryEventStorage: [],
      cartItemsCache: [],
      actions: {},
      events: {
        AJAX_ADD_TO_CART: 'ajax:addToCart',
        AJAX_REMOVE_FROM_CART: 'ajax:removeFromCart'
      }
    },

    _create: function() {
      window[this.options.containerName] = window[this.options.containerName] || [];
      this.initActions();
      this.setListeners();
      this.setCartDataListener();
      this.subscribeProductsUpdateInCart();
    },

    initActions: function () {
      const events = this.options.events;
      this.options.actions[events.AJAX_ADD_TO_CART] = function (product) {
        window[this.options.containerName].push({
          'event': 'add',
          'ecommerce': {
            'currencyCode': this.options.currencyCode,
            'add': {
              'products': [{
                'id': this.getProductId(product),
                'name': product['product_name'],
                'price': product['product_price_value'],
                'quantity': Number(product.qty)
              }]
            }
          }
        });
      }.bind(this);

      this.options.actions[events.AJAX_REMOVE_FROM_CART] = function (product) {
        window[this.options.containerName].push({
          'event': 'remove',
          'ecommerce': {
            'currencyCode': this.options.currencyCode,
            'remove': {
              'products': [{
                'id': this.getProductId(product),
                'name': product['product_name'],
                'price': product['product_price_value'],
                'quantity': Number(product.qty)
              }]
            }
          }
        });
      }.bind(this);
    },

    setListeners: function () {
      const handlerWrapper = function (callback, type, event, eventData) {
          callback.call(this, type, eventData.productInfo);
        },
        opt = this.options;

      $(document)
      .on(
        opt.events.AJAX_ADD_TO_CART,
        handlerWrapper.bind(this, this.setToTemporaryEventStorage, opt.events.AJAX_ADD_TO_CART)
      )
      .on(
        opt.events.AJAX_REMOVE_FROM_CART,
        handlerWrapper.bind(this, this.setToTemporaryEventStorage, opt.events.AJAX_REMOVE_FROM_CART)
      )
    },

    setCartDataListener: function () {
      this.options.cartItemsCache = customerData.get('cart')().items?.slice();
      customerData.get('cart').subscribe(function (data) {
        if (this.options.temporaryEventStorage.length) {
          this.executeEvents();
        }

        this.options.cartItemsCache = data.items.slice();
      }.bind(this));
    },

    subscribeProductsUpdateInCart: function () {
      const context = this;

      $(document)
      .on('mousedown', '[data-cart-item-update]', function () {
        context.collectCustomerProducts();
      })
      .on('mousedown', '.update-cart-item', function () {
        context.collectCustomerProducts();
      })
      .on('mousedown', '.form-cart .item-actions .action-delete', function () {
        context.collectCustomerProducts();
      })
      .on('input', "[data-role=cart-item-qty]", function () {
        context.collectCustomerProducts();
      })
      .on('ajax:updateCartItemQty', function () {
        context.updateCartObserver();
      });
    },

    setToTemporaryEventStorage: function (type, productInfo) {
      this.options.temporaryEventStorage.push({
        type: type,
        productInfo: productInfo
      });
    },

    executeEvents: function () {
      let product;

      this.options.temporaryEventStorage.forEach(function (item, index) {
        if (typeof item.productInfo === 'undefined') {
          this.options.temporaryEventStorage.splice(index, 1);
          return;
        }

        item.productInfo.forEach(function (productInfoItem) {
          product = this.getProduct(productInfoItem);

          if (Object.prototype.hasOwnProperty.call(product, 'product_sku')
            && parseInt(product.qty, 10) > 0
          ) {
            this.options.actions[item.type](product);
          }

          this.options.temporaryEventStorage.splice(index, 1);
        }.bind(this));
      }.bind(this));
    },

    getProduct: function (productInfo) {
      let searchCriteria,
        productFromCache,
        productFromCart;

      searchCriteria = function (item) {
        return item['product_id'] === productInfo.id;
      };

      productFromCache = this.options.cartItemsCache.find(searchCriteria);
      productFromCart = customerData.get('cart')().items.find(searchCriteria);

      if (!productFromCache && !productFromCart) {
        return Object.assign({}, productFromCart, {
          qty: 1
        });
      }

      if (productFromCache && productFromCart) {
        return Object.assign({}, productFromCache, {
          qty: productFromCart.qty - productFromCache.qty
        });
      }

      return productFromCache || productFromCart;
    },

    collectCustomerProducts: function () {
      this.collectOriginalProducts();
      this.collectCartQtys();
      this.collectMiniCartQtys();
    },

    collectOriginalProducts: function () {
      let items = customerData.get('cart')().items;
      this.origProducts = {};

      if (!items) {
        return;
      }

      items.forEach(function (item) {
        this.origProducts[item['product_sku']] = {
          'product_id': this.getProductId(item),
          'id': item['product_sku'],
          'name': item['product_name'],
          'price': item['product_price_value'],
          'qty': Number(item.qty)
        };
      }.bind(this));
    },

    collectCartQtys: function () {
      let productQtys = [];

      $('[data-cart-item-id]').each(function (index, elem) {
        productQtys.push({
          'id': $(elem).data('cart-item-id'),
          'qty': $(elem).val()
        });
      });

      this.productQtys = productQtys;
    },

    collectMiniCartQtys: function () {
      let productQtys = [];

      $('input[data-cart-item-id]').each(function (index, elem) {
        productQtys.push({
          'id': $(elem).data('cart-item-id'),
          'qty': $(elem).val()
        });
      });

      this.productQtys = productQtys;
    },

    updateCartObserver: function () {
      this.collectProductsWithChanges();
      this.collectProductsForMessages();
      this.cartItemAdded();
      this.cartItemRemoved();
    },

    collectProductsWithChanges: function () {
      let i = 0,
        cartProduct,
        product;

      this.productWithChanges = [];

      for (i; i < this.productQtys.length; i++) {
        cartProduct = this.productQtys[i];

        if (
          Object.prototype.hasOwnProperty.call(this.origProducts, cartProduct.id)
          && cartProduct.qty != this.origProducts[cartProduct.id].qty
        ) {
          product = $.extend({}, this.origProducts[cartProduct.id]);

          if (parseInt(cartProduct.qty, 10) > 0) {
            product.qty = Number(cartProduct.qty).toPrecision(4) * 1;
            this.productWithChanges.push(product);
          }
        }
      }
    },

    collectProductsForMessages: function () {
      let i = 0,
        product;

      this.addedProducts = [];
      this.removedProducts = [];

      /* eslint-disable max-depth */
      for (i; i < this.productWithChanges.length; i++) {
        product = this.productWithChanges[i];

        if (Object.prototype.hasOwnProperty.call(this.origProducts, product.id)) {
          if (product.qty > this.origProducts[product.id].qty) {
            product.qty = Math.abs(product.qty - this.origProducts[product.id].qty);
            product.qty = Number(product.qty).toPrecision(4) * 1;
            product.product_id = this.origProducts[product.id].product_id;
            this.addedProducts.push(product);
          } else if (product.qty < this.origProducts[product.id].qty) {
            product.qty = Math.abs(this.origProducts[product.id].qty - product.qty);
            product.qty = Number(product.qty).toPrecision(4) * 1;
            product.product_id = this.origProducts[product.id].product_id;
            this.removedProducts.push(product);
          }
        }
      }

      /* eslint-enable max-depth */
    },

    cartItemAdded: function () {
      if (!this.addedProducts.length) {
        return;
      }

      window[this.options.containerName].push({
        'event': 'add',
        'ecommerce': {
          'currencyCode': this.options.currencyCode,
          'add': {
            'products': this.formatProductsArray(this.addedProducts)
          }
        }
      });

      this.addedProducts = [];
    },

    cartItemRemoved: function () {
      if (!this.removedProducts.length) {
        return;
      }

      window[this.options.containerName].push({
        'event': 'remove',
        'ecommerce': {
          'currencyCode': this.options.currencyCode,
          'remove': {
            'products': this.formatProductsArray(this.removedProducts)
          }
        }
      });

      this.removedProducts = [];
    },

    formatProductsArray: function (productsIn) {
      let productsOut = [],
        i;

      for (i in productsIn) {
        if (i != 'length' && productsIn.hasOwnProperty(i)) {
          productsOut.push({
            'id': productsIn[i].product_id,
            'name': productsIn[i].name,
            'price': productsIn[i].price,
            'quantity': Number(productsIn[i].qty)
          });
        }
      }

      return productsOut;
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
    }
  });

  return $.mygento.cartTracking;
});
