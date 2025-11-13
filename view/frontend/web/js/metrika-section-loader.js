/**
 * @author Mygento Team
 * @copyright 2015-2025 Mygento (https://www.mygento.com)
 * @package Mygento_Metrika
 */

define([
    'jquery',
    'Magento_Customer/js/customer-data'
], function($, customerData) {
    'use strict';

    var MetrikaSectionLoader = {
        containerName: 'dataLayer',

        /**
         * Process metrika data from section
         */
        processMetrikaData: function(data) {
            if (!data) {
                return;
            }

            var items = Object.values(data);

            if (items.length > 0) {
                window[this.containerName] = window[this.containerName] || [];
                items.forEach(function(item) {
                    if (item && item.ecommerce) {
                        window[this.containerName].push(item);
                    }
                }.bind(this));
            }
        },

        /**
         * Initialize metrika section loader
         */
        init: function() {
            // Subscribe to future updates
            customerData.get('metrika').subscribe(function(data) {
                this.processMetrikaData(data);
                customerData.invalidate(['metrika']);
            }.bind(this));
        }
    };

    return MetrikaSectionLoader;
});
