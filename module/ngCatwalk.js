(function ngCatwalk($angular) {

    "use strict";

    // Bootstrap ngCatwalk!
    var app = $angular.module('ngCatwalk', ['ngCrossfilter']);

    /**
     * @method throwException
     * @param message {String}
     * @return {void}
     */
    var throwException = function throwException(message) {
        throw "ngCatwalk: " + message + ".";
    };

    /**
     * @property ngCatwalkAttribute
     * @type {Object}
     */
    var ngCatwalkAttribute = {

        /**
         * @method any
         * @property defaultValue {Object|Array|Number|Boolean|Date|String|RegExp}
         * @return {Function}
         */
        any: function any(defaultValue) {

            return function(value) {

                if (value === null) {
                    return null;
                }

                return typeof value !== 'undefined' ? value : defaultValue;

            };

        },

        /**
         * @method autoIncrement
         * @return {Function}
         */
        autoIncrement: function autoIncrement() {

            var index = 0;

            return function() {
                return ++index;
            }

        },

        /**
         * @method number
         * @param defaultValue {Number}
         * @returns {Function}
         */
        number: function number(defaultValue) {

            return function(value) {

                if (value === null) {
                    return null;
                }

                return typeof value !== 'undefined' ? +value : defaultValue;

            };

        },

        /**
         * @method string
         * @property defaultValue {String}
         * @returns {Function}
         */
        string: function string(defaultValue) {

            return function(value) {

                if (value === null) {
                    return defaultValue || null;
                }

                return typeof value !== 'undefined' ? String(value) : defaultValue;

            };

        }

    };

    /**
     * @property ngCatwalkRelationship
     * @type {Object}
     */
    var ngCatwalkRelationship = {

        /**
         * @method One
         * @param options {Object}
         * @constructor
         */
        One: function One(options) {


        }

    };

    /**
     * @module ngCatwalk
     * @author Adam Timberlake
     * @link https://github.com/Wildhoney/ngCatwalk
     */
    app.service('catwalk', ['$rootScope', '$q', '$interpolate', 'Crossfilter',

        /**
         * @method CatwalkService
         * @param $rootScope {Object}
         * @param $interpolate {Function}
         * @param $q {Object}
         * @param Crossfilter {Function}
         * @return {Object}
         */
        function CatwalkService($rootScope, $q, $interpolate, Crossfilter) {

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
                 * @property attribute
                 * @type ngCatwalkAttribute
                 */
                attribute: ngCatwalkAttribute,

                /**
                 * @property relationship
                 * @type {Object}
                 */
                relationship: {

                    /**
                     * @property hasOne
                     * @param options {Object}
                     * @return {ngCatwalkRelationship.One}
                     */
                    hasOne: function hasOne(options) {
                        return new ngCatwalkRelationship.One(options);
                    }

                },

                /**
                 * @property _primaryName
                 * @type {String}
                 */
                _primaryName: '_catwalkId',

                /**
                 * @property _silent
                 * @type {Boolean}
                 */
                _silent: false,

                /**
                 * @property _eventName
                 * @type {String}
                 */
                _eventName: 'catwalk/{{type}}/{{collection}}',

                /**
                 * @property _collections
                 * @type {Object}
                 * @private
                 */
                _collections: {},

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
                        this._collections[name].index     = 0;

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
                 * Invokes a CRUD method which normally emits an event. However, when wrapped in the
                 * silently method, the CRUD method behaves as normal, minus the emitting of the event.
                 *
                 * @method silently
                 * @param processFunction {Function}
                 * @return {void}
                 */
                silently: function silently(processFunction) {
                    this._silent = true;
                    processFunction.apply(this);
                    this._silent = false;
                },

                /**
                 * @method createModel
                 * @param collectionName {String}
                 * @param model {Object}
                 * @return {Object}
                 */
                createModel: function createModel(collectionName, model) {

                    // Ensure the model conforms with the collection blueprint.
                    model = this.cleanModel(collectionName, model);

                    // Add the model to the collection and generate the promise.
                    this.collection(collectionName).addModel(model);
                    var promise = this.createPromise(collectionName, 'create', [model]);

                    // Promise resolution.
                    promise.then(this.resolveCreateModel(collectionName, model).bind(this));
                    promise.catch(this.rejectCreateModel(collectionName, model).bind(this));

                    return model;

                },

                /**
                 * @method rejectCreateModel
                 * @param collectionName {String}
                 * @param model {Object}
                 * @return {Function}
                 */
                rejectCreateModel: function rejectCreateModel(collectionName, model) {

                    return function rejectPromise() {

                        this.silently(function silentlyDelete() {
                            this.collection(collectionName).deleteModel(model);
                        });

                    };

                },

                /**
                 * @method resolveCreateModel
                 * @param collectionName {String}
                 * @param model {Object}
                 * @return {Function}
                 */
                resolveCreateModel: function resolveCreateModel(collectionName, model) {

                    return function resolvePromise(properties) {

                        var blueprint = this.collection(collectionName).blueprint;

                        this._propertyIterator(properties, function iterator(property) {

                            var typecast = blueprint[property];

                            // Don't add properties to the model if it hasn't been defined in
                            // the blueprint.
                            if (typeof typecast === 'undefined') {
                                return;
                            }

                            // Overwrite the value with the one specified in the resolution of
                            // the related promise.
                            model[property] = typecast(properties[property]);

                        });

                    };

                },

                /**
                 * @method updateModel
                 * @param collectionName {String}
                 * @param model {Object}
                 * @param properties {Object}
                 * @return {Object}
                 */
                updateModel: function updateModel(collectionName, model, properties) {

                },

                /**
                 * @method resolveUpdateModel
                 * @param collectionName {String}
                 * @param model {Object}
                 * @return {Object}
                 */
                resolveUpdateModel: function resolveUpdateModel(collectionName, model) {

                },

                /**
                 * @method rejectUpdateModel
                 * @param collectionName {String}
                 * @param model {Object}
                 * @param oldProperties {Object}
                 * @return {Object}
                 */
                rejectUpdateModel: function rejectUpdateModel(collectionName, model, oldProperties) {

                },

                /**
                 * @method deleteModel
                 * @param collectionName {String}
                 * @param model {Object}
                 * @return {Object}
                 */
                deleteModel: function deleteModel(collectionName, model) {

                    // Add the model to the collection and generate the promise.
                    this.collection(collectionName).deleteModel(model);
                    var promise = this.createPromise(collectionName, 'delete', [model]);

                    // Promise resolution.
                    promise.then(this.resolveDeleteModel(collectionName, model).bind(this));
                    promise.catch(this.rejectDeleteModel(collectionName, model).bind(this));

                    return model;

                },

                /**
                 * @method resolveDeleteModel
                 * @param collectionName {String}
                 * @param model {Object}
                 * @return {Object}
                 */
                resolveDeleteModel: function resolveDeleteModel(collectionName, model) {

                    return function resolvePromise() {};

                },

                /**
                 * @method rejectDeleteModel
                 * @param collectionName {String}
                 * @param model {Object}
                 * @return {Object}
                 */
                rejectDeleteModel: function rejectDeleteModel(collectionName, model) {

                    return function rejectPromise() {

                        this.silently(function silentlyRestore() {
                            this.collection(collectionName).restoreModel(model);
                        });

                    };

                },

                /**
                 * @method createPromise
                 * @param collectionName {String}
                 * @param type {String}
                 * @param args {Array}
                 * @return {$q.promise}
                 */
                createPromise: function createPromise(collectionName, type, args) {

                    var deferred = $q.defer();

                    if (!Array.isArray(args)) {

                        // Ensure the `args` variable is an array.
                        args = args ? [args] : [];

                    }

                    // Attach the promise for the developer to resolve or reject.
                    args.unshift(deferred);

                    // Create and broadcast the event.
                    var eventName = $interpolate(this._eventName)({ type: type, collection: collectionName });
                    $rootScope.$broadcast(eventName, args[0], args[1], args[2]);
                    return deferred.promise;

                },

                /**
                 * @method createHasManyRelationship
                 * @param model {Object}
                 * @param fromCollectionName {String}
                 * @param fromProperty {String}
                 * @param toCollectionName {String}
                 * @param toProperty {String}
                 * @param value {Array}
                 * @return {Boolean}
                 */
                createHasManyRelationship: function createHasManyRelationship(model, fromCollectionName, fromProperty, toCollectionName, toProperty, value) {

                },

                /**
                 * @method createHasOneRelationship
                 * @param model {Object}
                 * @param fromCollectionName {String}
                 * @param fromProperty {String}
                 * @param toCollectionName {String}
                 * @param toProperty {String}
                 * @param value {String|Number|Boolean}
                 * @return {Boolean}
                 */
                createHasOneRelationship: function createHasOneRelationship(model, fromCollectionName, fromProperty, toCollectionName, toProperty, value) {

                },

                /**
                 * Responsible for cleaning a model based on the collection's blueprint.
                 *
                 * @param collectionName {String}
                 * @param model {Object}
                 * @return {Object}
                 */
                cleanModel: function cleanModel(collectionName, model) {

                    var blueprint      = this.collection(collectionName).blueprint,
                        iterator       = this._propertyIterator,
                        isRelationship = this.isRelationship.bind(this),
                        primaryKey     = this._primaryName;

                    // Add the primary key to the model.
                    model[primaryKey] = ++this.collection(collectionName).index;

                    /**
                     * @method removeProperties
                     * @return {void}
                     */
                    (function removeProperties() {

                        iterator(model, function iterator(property) {

                            if (!blueprint.hasOwnProperty(property)) {

                                // Remove the property if it's not in the blueprint.
                                delete model[property];

                            }

                        });

                    })();

                    /**
                     * @method addAndTypecastProperties
                     * @return {void}
                     */
                    (function addAndTypecastProperties() {

                        iterator(blueprint, function iterator(property) {

                            // Ignore if it's already been defined, or it's the primary key.
                            if (typeof model[property] === 'undefined' && property !== primaryKey) {

                                // Create the property on the model, and typecast it.
                                model[property] = null;

                            }

                            if (!isRelationship(collectionName, property)) {

                                var typecast = blueprint[property];

                                // Typecast each property accordingly.
                                model[property] = typecast(model[property]);
                                return;

                            }

                            // Now we know we're dealing with a relationship.

                        });

                    })();

                    return model;

                },

                /**
                 * @method isRelationship
                 * @param collectionName {String}
                 * @param property {String}
                 * @return {Boolean}
                 */
                isRelationship: function isRelationship(collectionName, property) {

                    var propertyBlueprint = this.collection(collectionName).blueprint[property],
                        relationships     = [ngCatwalkRelationship.One];

                    for (var index in relationships) {

                        if (relationships.hasOwnProperty(index)) {

                            if (propertyBlueprint instanceof relationships[index]) {
                                return true;
                            }

                        }

                    }

                    return false;

                },

                /**
                 * @method _propertyIterator
                 *
                 * @private
                 */
                _propertyIterator: function _propertyIterator(model, iteratorFunction) {

                    for (var property in model) {

                        if (model.hasOwnProperty(property)) {
                            iteratorFunction.call(this, property);
                        }

                    }

                }

            };

            return new Catwalk();

        }]);

})(window.angular);