(function ngCatwalk($angular) {

    "use strict";

    // Bootstrap ngCatwalk!
    var app = $angular.module('ngCatwalk', ['ngCrossfilter']);

    /**
     * @module ngCatwalk
     * @submodule ngCatwalkRelationship
     * @type {Object}
     */
    var ngCatwalkRelationship = {

        /**
         * @property _collections
         * @type {Object}
         * @private
         */
        _collections: {},

        /**
         * @method options
         * @param options {Object}
         * @return {Function}
         */
        hasMany: function hasMany(options) {

            // Find the collection we're currently dealing with.
            var collection = this._collections[options.collection];

            return function HasManyRelationship(model, property) {

                var values = [];

                Object.defineProperty(model, property, {

                    /**
                     * @method get
                     * @return {Array}
                     */
                    get: function get() {

                        // Extract the models from the collection based on the relationship.
                        collection.filterBy(options.foreignKey, values, function inArray(expected, actual) {
                            return expected.indexOf(actual) !== -1;
                        });

                        // Fetch the collection and then reset the filter.
                        var models = collection._collection(Infinity);
                        collection.unfilterBy(options.foreignKey);

                        /**
                         * @method _resolve
                         * @param model {Object|String|Number}
                         * @return {String|Number}
                         * @private
                         */
                        models._resolve = function _resolve(model) {

                            if (typeof model === 'object') {

                                // Extract the property from the object if we've
                                // passed in a model.
                                return model[property]

                            }

                            return model;

                        };

                        /**
                         * @method addModel
                         * @param model {Object|String|Number}
                         * @return {void}
                         */
                        models.addModel = function addModel(model) {
                            values.push(models._resolve(model));
                        };

                        /**
                         * @method deleteModel
                         * @param model {Object|String|Number}
                         * @return {void}
                         */
                        models.deleteModel = function deleteModel(model) {
                            var index = values.indexOf(models._resolve(model));
                            values.splice(index, 1);
                        };

                        /**
                         * @method hasModel
                         * @param model {Object|String|Number}
                         * @return {Boolean}
                         */
                        models.hasModel = function hasModel(model) {
                            return values.indexOf(models._resolve(model)) !== -1;
                        };

                        return models;

                    },

                    /**
                     * @method set
                     * @return {void}
                     */
                    set: function set() {}

                });

            };

        }

    };

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
    app.service('catwalk', ['$rootScope', '$q', 'Crossfilter',

        /**
         * @method CatwalkService
         * @param $rootScope
         * @param Crossfilter
         * @return {Object}
         */
            function CatwalkService($rootScope, $q, Crossfilter) {

            /**
             * @module ngCatwalk
             * @submodule Catwalk
             * @constructor
             */
            function Catwalk() {

                // Copy the collections into the relationship submodule.
                this.relationship._collections = this._collections;
                this.relationship.$rootScope = $rootScope;

            }

            /**
             * @property prototype
             * @type {Object}
             */
            Catwalk.prototype = {

                /**
                 * @property _primaryName
                 * @type {String}
                 */
                _primaryName: '__catwalkId__',

                /**
                 * @property _primaryIndex
                 * @type {Number}
                 * @default 0
                 */
                _primaryIndex: 0,

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
                 * @property relationship
                 * @type {Object}
                 */
                relationship: ngCatwalkRelationship,

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

                        // Define the primary key as a number.
                        properties[this._primaryName] = this.attribute.number();

                        // Create the collection if we've defined the properties;
                        this._collections[name].primaryKey(this._primaryName);
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

                _awaitFeedback: function _awaitFeedback(type, name, model, failedFunction) {

                    // Broadcast the event to resolve or reject the promise.
                    var deferred = $q.defer();

                    // Broadcast the event to handle the deferred.
                    $rootScope.$broadcast('catwalk/' + type + '/' + name, deferred, model);

                    // Invoke the callback if the promise fails.
                    deferred.promise.catch(function failed() {
                        failedFunction.apply(this);
                    }.bind(this));

                },

                /**
                 * @method createModel
                 * @param name {String}
                 * @param properties {Object}
                 * @return {Array}
                 */
                createModel: function createModel(name, properties) {

                    var model = this._prepareModel(name, properties);

                    // Inject the catwalk ID into the model.
                    model[this._primaryName] = ++this._primaryIndex;

                    // Add the model to the collection.
                    this.collection(name).addModel(model);

                    this._awaitFeedback('create', name, model, function failed() {

                        // Delete the model silently if the promise fails.
                        this._deleteModel(name, model);

                    });

                },

                /**
                 * @method deleteModel
                 * @param name {String}
                 * @param model {Object}
                 * @return {void}
                 */
                deleteModel: function deleteModel(name, model) {

                    this._deleteModel(name, model);

                    this._awaitFeedback('delete', name, model, function failed() {

                        // Restore the model from the garbage collection.
                        this.collection(name).restoreModel(model);

                    });

                },

                /**
                 * @method _deleteModel
                 * @param name {String}
                 * @param model {Object}
                 * @return {void}
                 * @private
                 */
                _deleteModel: function deleteModel(name, model) {
                    this.collection(name).deleteModel(model);
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

                            if (property === 'primaryKey') {

                                // Ignore private and protected properties.
                                continue;

                            }

                            var accessor = blueprint[property];

                            if (typeof model[property] === 'undefined') {

                                // Create the property for typecasting later on.
                                model[property] = undefined;

                            }

                            // Determine if we're dealing with a relationship.
                            if (accessor.toString().match(/Relationship/i)) {

                                // Configure the relationship.
                                /*jslint newcap:true */
                                new accessor(model, property);
                                continue;

                            }

                            // Typecast the defined property.
                            model[property] = accessor(model[property]);

                        }

                    }

                    return model;

                }

            };

            return new Catwalk();

        }]);

})(window.angular);