(function ngCatwalk($angular) {

    "use strict";

    // Bootstrap ngCatwalk!
    var app = $angular.module('ngCatwalk', ['ngCrossfilter']);

    /**
     * @module ngCatwalk
     * @submodule ngCatwalkTypecast
     * @type {Object}
     */
    var ngCatwalkTypecast = {

        /**
         * @method string
         * @param defaultValue {String|Number|Array|Object}
         * @returns {Function}
         */
        string: function(defaultValue) {

            return function toString(value) {

                return typeof value === 'undefined' ? this._default(defaultValue, '') : String(value);

            }.bind(this)

        },

        /**
         * @method autoincrement
         * @returns {Function}
         */
        autoincrement: function() {

            var value = 0;

            return function toAutoincrement() {
                return ++value;
            }.bind(this)

        },

        /**
         * @method number
         * @param defaultValue {String|Number|Array|Object}
         * @returns {Function}
         */
        number: function(defaultValue) {

            return function toNumber(value) {

                return typeof value === 'undefined' ? this._default(defaultValue, 0) : Number(value);

            }.bind(this)

        },

        /**
         * @method _default
         * @param defaultValue {String|Number|Array|Object}
         * @param fallbackValue {String|Number|Array|Object}
         * @return {String|Number|Array|Object}
         * @private
         */
        _default: function _default(defaultValue, fallbackValue) {
            return typeof defaultValue === 'undefined' ? fallbackValue : defaultValue;
        }

    };

    /**
     * @module ngCatwalk
     * @author Adam Timberlake
     * @link https://github.com/Wildhoney/ngCatwalk
     */
    app.service('catwalk', ['$rootScope', 'Crossfilter',

        /**
         * @method CatwalkService
         * @param $rootScope
         * @param Crossfilter
         * @return {Object}
         */
            function CatwalkService($rootScope, Crossfilter) {

            /**
             * @module ngCatwalk
             * @submodule Catwalk
             * @constructor
             */
            function Catwalk() {}

            /**
             * @property prototype
             * @type {Object}
             */
            Catwalk.prototype = {

                /**
                 * @property _collections
                 * @type {Object}
                 * @private
                 */
                _collections: {},

                /**
                 * @property attribute
                 * @type {Object}
                 */
                attribute: ngCatwalkTypecast,

                /**
                 * @method collection
                 * @param name {String}
                 * @param properties {Object}
                 * @return {Array}
                 */
                collection: function collection(name, properties) {

                    if (!this._collections[name]) {

                        // Create the empty collection.
                        this._collections[name] = new Crossfilter([]);

                    }

                    if (properties) {

                        // Create the collection if we've defined the properties;
                        this._collections[name].primaryKey(properties._primaryKey);
                        this._collections[name].blueprint = properties;

                        for (var property in properties) {

                            if (properties.hasOwnProperty(property)) {

                                // Define the dimension.
                                this._collections[name].addDimension(property);

                            }

                        }

                    }

                    // Otherwise we'll retrieve the collection.
                    return this._collections[name];

                },

                /**
                 * @method createModel
                 * @param name {String}
                 * @param properties {Object}
                 * @return {Array}
                 */
                createModel: function createModel(name, properties) {
                    var model = this._prepareModel(name, properties);
                    this.collection(name).addModel(model);
                },

                /**
                 * @property _prepareModel
                 * @param name {String}
                 * @param model {Object}
                 * @return {Object}
                 * @private
                 */
                _prepareModel: function _prepareModel(name, model) {

                    // Assume a default model if one hasn't been specified.
                    model = model || {};

                    var blueprint = this.collection(name).blueprint;

                    // Iterate over the blueprint to typecast and fill in missing properties.
                    for (var property in blueprint) {

                        if (blueprint.hasOwnProperty(property)) {

                            if (property.charAt(0) === '_') {

                                // Ignore private and protected properties.
                                continue;

                            }

                            var typecast = blueprint[property];

                            if (typeof model[property] === 'undefined') {

                                // Create the property for typecasting later on.
                                model[property] = undefined;

                            }

                            // Typecast the defined property.
                            model[property] = typecast(model[property]);

                        }

                    }

                    return model;

                }

            };

            return new Catwalk();

        }]);

})(window.angular);