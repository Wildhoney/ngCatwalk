(function ngCatwalk($angular, _) {

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

                return $angular.isDefined(value) ? value : defaultValue;

            };

        },

        /**
         * @method autoIncrement
         * @return {Function}
         */
        autoIncrement: function autoIncrement() {

            var index = 0;

            return function(value) {

                if (value !== null) {
                    return value;
                }

                return ++index;

            }

        },

        /**
         * @method custom
         * @param customFunction {Function}
         * @return {Function}
         */
        custom: function custom(customFunction) {

            return function(value) {
                return customFunction(value);
            };

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

                return $angular.isDefined(value) ? +value : defaultValue;

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

                return $angular.isDefined(value) ? String(value) : defaultValue;

            };

        }

    };

    /**
     * @property ngCatwalkRelationship
     * @type {Object}
     */
    var ngCatwalkRelationship = {

        /**
         * @constant TYPES
         * @type {Object}
         */
        TYPES: { ONE: 'One', MANY: 'Many' },

        /**
         * @method One
         * @param options {Object}
         * @constructor
         */
        One: function One(options) {

            /**
             * @method getOptions
             * @return {Object}
             */
            this.getOptions = function getOptions() {
                return options;
            }

        },

        /**
         * @method Many
         * @param options {Object}
         * @constructor
         */
        Many: function Many(options) {

            /**
             * @method getOptions
             * @return {Object}
             */
            this.getOptions = function getOptions() {
                return options;
            }

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
            function Catwalk() {

                // Reset all of our properties.
                this.collections = {};

            }

            /**
             * @property prototype
             * @type {Object}
             */
            Catwalk.prototype = {

                /**
                 * @property mode
                 * @type {String}
                 * @default "instant"
                 */
                mode: 'instant',

                /**
                 * @property collections
                 * @type {Object}
                 */
                collections: {},

                /**
                 * @property primaryName
                 * @type {String}
                 */
                primaryName: '_catwalkId',

                /**
                 * @property silent
                 * @type {Boolean}
                 */
                silent: false,

                /**
                 * @property eventName
                 * @type {String}
                 */
                eventName: 'catwalk/{{type}}/{{collection}}',

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
                        return new ngCatwalkRelationship[ngCatwalkRelationship.TYPES.ONE](options);
                    },

                    /**
                     * @property hasMany
                     * @param options {Object}
                     * @return {ngCatwalkRelationship.Many}
                     */
                    hasMany: function hasMany(options) {
                        return new ngCatwalkRelationship[ngCatwalkRelationship.TYPES.MANY](options);
                    }

                },

                /**
                 * @method collection
                 * @param name {String}
                 * @param properties {Object}
                 * @return {Array}
                 */
                collection: function collection(name, properties) {

                    if (!this.collections[name]) {

                        // Create the empty collection.
                        this.collections[name] = new Crossfilter([], this.primaryName);

                    }

                    if (properties) {

                        // Define the primary key as a number.
                        properties[this.primaryName] = this.attribute.number();

                        // Create the collection if we've defined the properties;
                        this.collections[name].blueprint = properties;
                        this.collections[name].index     = 0;
                        this.collections[name].name      = name;

                        this._propertyIterator(properties, function iterator(property) {

                            // Define the dimension.
                            this.collections[name].addDimension(property);

                        });

                    }

                    return this.collections[name];

                },

                /**
                 * @method setMode
                 * @param mode {String}
                 * @return {void}
                 */
                setMode: function setMode(mode) {
                    this.mode = mode;
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

                    this.silent = true;
                    processFunction.apply(this);
                    this.silent = false;

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

                    var simpleModel = this.simplifyModel(collectionName, model),
                        promise     = this.createPromise(collectionName, 'create', [simpleModel]);

                    // Promise resolution.
                    promise.then(this.resolveCreateModel(collectionName, model).bind(this));
                    promise.catch(this.rejectCreateModel(collectionName, model).bind(this));

                    return model;

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
                            if (!$angular.isDefined(typecast)) {
                                return;
                            }

                            // Overwrite the value with the one specified in the resolution of
                            // the related promise.
                            model[property] = typecast(properties[property]);

                        });

                        // Add the model to the collection and generate the promise.
                        this.collection(collectionName).addModel(model);

                    };

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
                 * @method updateModel
                 * @param collectionName {String}
                 * @param model {Object}
                 * @param properties {Object}
                 * @return {Object}
                 */
                updateModel: function updateModel(collectionName, model, properties) {

                    // Create a representation of the new model.
                    var newModel       = _.extend(_.clone(model), properties),
                        newSimpleModel = this.simplifyModel(collectionName, newModel),
                        promise        = this.createPromise(collectionName, 'update', [newSimpleModel]);

//                    if (this.mode === 'instant') {
//
//                        this.resolveUpdateModel(collectionName, newModel, model, properties).bind(this)();
//
//                    } else {
//
//                        promise.then(this.resolveUpdateModel(collectionName, newModel, model, properties).bind(this));
//
//                    }

                    // Promise resolution.
                    promise.catch(this.rejectUpdateModel(collectionName, model, newModel).bind(this));
                    promise.then(this.resolveUpdateModel(collectionName, newModel, model, properties).bind(this));

                    return model;

                },

                /**
                 * @method resolveUpdateModel
                 * @param collectionName {String}
                 * @param newModel {Object}
                 * @param oldModel {Object}
                 * @return {Function}
                 */
                resolveUpdateModel: function resolveUpdateModel(collectionName, newModel, oldModel) {

                    return function resolvePromise() {

                        this.silently(function silently() {

                            // Silently create the new model, and delete the old model.
                            this.createModel(collectionName, newModel);
                            this.deleteModel(collectionName, oldModel);

                        });

                    }

                },

                /**
                 * @method rejectUpdateModel
                 * @param collectionName {String}
                 * @param oldModel {Object}
                 * @param newModel {Object}
                 * @return {Function}
                 */
                rejectUpdateModel: function rejectUpdateModel(collectionName, oldModel, newModel) {

                    return function rejectPromise() {

                        this.silently(function silently() {

                            // Silently create the new model, and delete the old model.
//                            this.collection(collectionName).restoreModel(oldModel);
//                            this.deleteModel(collectionName, newModel);

                        });

                    };

                },

                /**
                 * @method resolveReadModel
                 * @param collectionName {String}
                 * @return {Function}
                 */
                resolveReadModel: function resolveReadModel(collectionName) {

                    return function resolvePromise(model) {

                        this.silently(function silently() {
                            this.createModel(collectionName, model);
                        })

                    }

                },

                /**
                 * @method deleteModel
                 * @param collectionName {String}
                 * @param model {Object}
                 * @return {Object}
                 */
                deleteModel: function deleteModel(collectionName, model) {

                    var simpleModel = this.simplifyModel(collectionName, model),
                        promise     = this.createPromise(collectionName, 'delete', [simpleModel]);

                    // Promise resolution.
                    promise.then(this.resolveDeleteModel(collectionName, model).bind(this));
                    promise.catch(this.rejectDeleteModel(collectionName, model).bind(this));

                    return model;

                },

                /**
                 * @method resolveDeleteModel
                 * @param collectionName {String}
                 * @param model {Object}
                 * @return {Function}
                 */
                resolveDeleteModel: function resolveDeleteModel(collectionName, model) {

                    return function resolvePromise() {

                        // Delete the model from the collection and generate the promise.
                        this.collection(collectionName).deleteModel(model);

                    };

                },

                /**
                 * @method rejectDeleteModel
                 * @param collectionName {String}
                 * @param model {Object}
                 * @return {Function}
                 */
                rejectDeleteModel: function rejectDeleteModel(collectionName, model) {

                    return function rejectPromise() {

                        this.silently(function silentlyRestore() {
                            this.collection(collectionName).restoreModel(model);
                        });

                    };

                },

                /**
                 * @method simplifyModel
                 * @param collectionName {String}
                 * @param model {Object}
                 * @return {Object}
                 */
                simplifyModel: function simplifyModel(collectionName, model) {

                    var simpleModel = _.clone(model);
                    delete simpleModel[this.primaryName];
                    delete simpleModel.$$hashKey;
                    return simpleModel;

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

                    if (this.silent) {

                        // Immediately resolve the promise if we're in silent mode.
                        deferred.resolve();
                        return deferred.promise;

                    }

                    if (!_.isArray(args)) {

                        // Ensure the `args` variable is an array.
                        args = args ? [args] : [];

                    }

                    // Attach the promise for the developer to resolve or reject.
                    args.unshift(deferred);

                    // Create and broadcast the event.
                    var eventName = $interpolate(this.eventName)({ type: type, collection: collectionName });
                    $rootScope.$broadcast(eventName, args[0], args[1], args[2]);
                    return deferred.promise;

                },

                /**
                 * @method throwRelationshipException
                 * @return {void}
                 */
                throwRelationshipException: function throwRelationshipException() {
                    throwException("Congratulations! You managed to create an invalid relationship");
                },

                /**
                 * Responsible for cleaning a model based on the collection's blueprint.
                 *
                 * @param collectionName {String}
                 * @param model {Object}
                 * @return {Object}
                 */
                cleanModel: function cleanModel(collectionName, model) {

                    var primaryKey          = this.primaryName,
                        blueprint           = this.collection(collectionName).blueprint,
                        iterator            = this._propertyIterator,
                        relationshipType = this.relationshipType.bind(this);

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
                            if (!$angular.isDefined(model[property]) && property !== primaryKey) {

                                // Create the property on the model, and typecast it.
                                model[property] = null;

                            }

                            if (!relationshipType(collectionName, property)) {

                                var typecast = blueprint[property];

                                // Typecast each property accordingly.
                                model[property] = typecast(model[property]);
                                return;

                            }

                            // Now we know we're dealing with a relationship.
//                            createRelationship(collectionName, model, property);

                        });

                    })();

                    return model;

                },

                /**
                 * @method relationshipType
                 * @param collectionName {String}
                 * @param property {String}
                 * @return {String|null}
                 */
                relationshipType: function relationshipType(collectionName, property) {

                    var propertyBlueprint = this.collection(collectionName).blueprint[property],
                        relationships     = {};

                    // Define the relationships using the constants.
                    relationships[ngCatwalkRelationship.TYPES.ONE]  = ngCatwalkRelationship.One;
                    relationships[ngCatwalkRelationship.TYPES.MANY] = ngCatwalkRelationship.Many;

                    for (var index in relationships) {

                        if (relationships.hasOwnProperty(index)) {

                            if (propertyBlueprint instanceof relationships[index]) {
                                return index;
                            }

                        }

                    }

                    return null;

                },

                /**
                 * @method _propertyIterator
                 * @return {void}
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

})(window.angular, window._);