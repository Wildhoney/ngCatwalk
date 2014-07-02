(function ngCatwalk($angular, _, $object) {

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

            return function() {
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
                this._collections       = {};
                this._relationships     = {};
                this._relationshipStore = {};

            }

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
                 * @property _primaryName
                 * @type {String}
                 */
                _primaryName: '_catwalkId',

                /**
                 * @property _relationshipStore
                 * @type {Object}
                 */
                _relationshipStore: {},

                /**
                 * @property _relationships
                 * @type {Object}
                 */
                _relationships: {},

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
                 * @property _relationshipName
                 * @type {String}
                 */
                _relationshipName: '{{localCollection}}/{{localProperty}}/{{foreignCollection}}/{{foreignProperty}}',

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

                    if (!this._collections[name]) {

                        // Create the empty collection.
                        this._collections[name] = new Crossfilter([], this._primaryName);

                    }

                    if (properties) {

                        // Define the primary key as a number.
                        properties[this._primaryName] = this.attribute.number();

                        // Create the collection if we've defined the properties;
                        this._collections[name].blueprint = properties;
                        this._collections[name].index     = 0;
                        this._collections[name].name      = name;

                        this._propertyIterator(properties, function iterator(property) {

                            // Define the dimension.
                            this._collections[name].addDimension(property);

                        });

                    }

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
                            if (!$angular.isDefined(typecast)) {
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

                    var blueprint         = this.collection(collectionName).blueprint,
                        updatedProperties = {};

                    this._propertyIterator(properties, function iterator(property) {

                        // Exclude properties that are part of relationships from being updated.
                        if (this.getRelationshipType(collectionName, property)) {
                            return;
                        }

                        // Exclude properties that aren't in the blueprint.
                        if (!$angular.isDefined(blueprint[property])) {
                            return;
                        }

                        // Keep a track of the original properties for the pruning of the relationships.
                        updatedProperties[property] = model[property];

                        // Update the model with that specified.
                        model[property] = properties[property];

                    });

                    var promise = this.createPromise(collectionName, 'update', [model]);

                    // Promise resolution.
                    promise.then(this.resolveUpdateModel(collectionName, model, updatedProperties).bind(this));
                    promise.catch(this.rejectUpdateModel(collectionName, model, updatedProperties).bind(this));

                    return model;

                },

                /**
                 * @method resolveUpdateModel
                 * @param collectionName {String}
                 * @param model {Object}
                 * @param updatedProperties {Object}
                 * @return {Function}
                 */
                resolveUpdateModel: function resolveUpdateModel(collectionName, model, updatedProperties) {

                    return function resolvePromise() {

                        // Update relationships to remove any ghost references.
                        this.pruneRelationships(collectionName, updatedProperties);

                    }

                },

                /**
                 * @method rejectUpdateModel
                 * @param collectionName {String}
                 * @param model {Object}
                 * @param oldProperties {Object}
                 * @return {Function}
                 */
                rejectUpdateModel: function rejectUpdateModel(collectionName, model, oldProperties) {

                    return function rejectPromise() {

                        this._propertyIterator(oldProperties, function iterator(property) {
                            model[property] = oldProperties[property];
                        });

                    };

                },

                /**
                 * @method deleteModel
                 * @param collectionName {String}
                 * @param model {Object}
                 * @return {Object}
                 */
                deleteModel: function deleteModel(collectionName, model) {

                    // Delete the model from the collection and generate the promise.
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
                 * @return {Function}
                 */
                resolveDeleteModel: function resolveDeleteModel(collectionName, model) {

                    return function resolvePromise() {

                        // Update relationships to remove any ghost references.
                        this.pruneRelationships(collectionName, model);

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
                 * @method createPromise
                 * @param collectionName {String}
                 * @param type {String}
                 * @param args {Array}
                 * @return {$q.promise}
                 */
                createPromise: function createPromise(collectionName, type, args) {

                    var deferred = $q.defer();

                    if (!_.isArray(args)) {

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
                 * @method createRelationship
                 * @param collectionName {String}
                 * @param model {Object}
                 * @param property {String}
                 * @return {void}
                 */
                createRelationship: function createRelationship(collectionName, model, property) {

                    var localCollection   = this.collection(collectionName),
                        blueprint         = localCollection.blueprint[property],
                        options           = blueprint.getOptions(),
                        foreignCollection = this.collection(options.collection),
                        store             = this._relationshipStore,
                        internalId        = model[this._primaryName];

                    /**
                     * @method storeRelationshipData
                     * @return {void}
                     */
                    (function storeRelationshipData() {

                        var record = {
                            localCollection:   collectionName,
                            localProperty:     property,
                            foreignCollection: options.collection,
                            foreignProperty:   options.foreignKey
                        };

                        // Store the relationship meta data for flushing purposes.
                        var key = $interpolate(this._relationshipName)(record);
                        this._relationships[key] = record;

                    }.bind(this))();

                    /**
                     * @method recursivelyCreateRelationshipStore
                     * @return {void}
                     */
                    (function recursivelyCreateRelationshipStore() {

                        if (!$angular.isDefined(store[collectionName])) {
                            store[collectionName] = {};
                        }

                        if (!$angular.isDefined(store[collectionName][internalId])) {
                            store[collectionName][internalId] = {};
                        }

                    })();

                    var method = 'throwRelationshipException';

                    // Determine the type of the relationship, with the default being throwing an
                    // exception to congratulate the developer on somehow managing to create an
                    // invalid relationship.
                    switch (this.getRelationshipType(collectionName, property)) {

                        case (ngCatwalkRelationship.TYPES.ONE):  method = 'createHasOneRelationship'; break;
                        case (ngCatwalkRelationship.TYPES.MANY): method = 'createHasManyRelationship'; break;

                    }

                    this[method](collectionName, model, property, foreignCollection, options.foreignKey);

                },

                /**
                 * Responsible for pruning relationships where deleting and/or updating models would
                 * otherwise leave invalid relationships.
                 *
                 * @method pruneRelationships
                 * @param modifiedCollectionName {String}
                 * @param model {Object}
                 * @return {void}
                 */
                pruneRelationships: function pruneRelationships(modifiedCollectionName, model) {

                    this._propertyIterator(this._relationships, function iterator(property) {

                        var relationshipData = this._relationships[property];

                        // Current relationship is of no concern if it doesn't pertain to the collection
                        // that has been modified.
                        if (relationshipData.foreignCollection !== modifiedCollectionName) {
                            return;
                        }

                        // Locate the value from the modified model that needs to be removed from any
                        // relevant relationships.
                        var valueToDelete    = model[relationshipData.foreignProperty],
                            models           = this.collection(relationshipData.localCollection).collection(),
                            relationshipType = this.getRelationshipType(relationshipData.localCollection, relationshipData.localProperty);

                        // Iterate over each model to remove the `valueToDelete` from the relationship.
                        for (var index = 0; index < models.length; index++) {

                            switch (relationshipType) {

                                case (ngCatwalkRelationship.TYPES.ONE):
                                    models[index][relationshipData.localProperty] = '';
                                    break;

                                case (ngCatwalkRelationship.TYPES.MANY):
                                    models[index][relationshipData.localProperty].remove(valueToDelete);
                                    break;

                            }

                        }

                    });

                },

                /**
                 * @method throwRelationshipException
                 * @return {void}
                 */
                throwRelationshipException: function throwRelationshipException() {
                    throwException("Congratulations! You managed to create an invalid relationship");
                },

                /**
                 * @method createHasOneRelationship
                 * @param collectionName {String}
                 * @param model {Object}
                 * @param property {String}
                 * @param foreignCollection {Array}
                 * @param foreignKey {String}
                 * @return {Boolean}
                 */
                createHasOneRelationship: function createHasOneRelationship(collectionName, model, property, foreignCollection, foreignKey) {

                    var internalId    = model[this._primaryName],
                        store         = this._relationshipStore,
                        createPromise = this.createPromise.bind(this);

                    // Attach the property to the model relationship store.
                    store[collectionName][internalId][property] = model[property] || '';

                    $object.defineProperty(model, property, {

                        /**
                         * @method get
                         * @return {Object}
                         */
                        get: function get() {

                            var entry = store[collectionName][internalId][property];

                            // Filter the foreign collection by the value we've defined on the local model.
                            foreignCollection.filterBy(foreignKey, entry);
                            var foreignModel = foreignCollection.collection()[0];

                            if (entry.length && foreignCollection.length === 0) {

                                // Relationship exists, but we don't have the corresponding model yet, and
                                // therefore we'll need to request it.
                                createPromise(foreignCollection.name, 'read', [foreignKey, entry]);

                            }

                            foreignCollection.unfilterBy(foreignKey);

                            return foreignModel || {};

                        },

                        /**
                         * @method set
                         * @param value {Object|Array|Number|Boolean|Date|String|RegExp}
                         * @return {void}
                         */
                        set: function set(value) {
                            store[collectionName][internalId][property] = value;
                        }

                    });

                },

                /**
                 * @method createHasManyRelationship
                 * @param collectionName {String}
                 * @param model {Object}
                 * @param property {String}
                 * @param foreignCollection {Array}
                 * @param foreignKey {String}
                 * @return {Boolean}
                 */
                createHasManyRelationship: function createHasManyRelationship(collectionName, model, property, foreignCollection, foreignKey) {

                    var internalId    = model[this._primaryName],
                        store         = this._relationshipStore,
                        createPromise = this.createPromise.bind(this);

                    // Attach the property to the model relationship store.
                    store[collectionName][internalId][property] = model[property] || [];
                    var entry = store[collectionName][internalId][property];

                    /**
                     * @method inArray
                     * @param expected {String|Number}
                     * @param actual {String|Number}
                     * @return {Boolean}
                     */
                    var inArray = function inArray(expected, actual) {
                        return expected.indexOf(actual) !== -1;
                    };

                    $object.defineProperty(model, property, {

                        /**
                         * @method get
                         * @return {Array}
                         */
                        get: function get() {

                            // Fetch all of the models that pertain to our relationship array.
                            foreignCollection.filterBy(foreignKey, entry, inArray);
                            var foreignModels = foreignCollection.collection();

                            if (entry.length && foreignModels.length !== entry.length) {

                                // Determine which models need to be loaded.
                                var values     = _.pluck(foreignModels, foreignKey),
                                    difference = _.difference(entry, values);

                                if (values.length !== 0) {

                                    // Iterate over each required model to attempt to load them via
                                    // our promise.
                                    for (var index = 0; index < difference.length; index++) {
                                        createPromise(foreignCollection.name, 'read', [foreignKey, difference[index]]);
                                    }

                                }

                            }

                            foreignCollection.unfilterBy(foreignKey);

                            /**
                             * @method add
                             * @param value {String|Number}
                             * @return {void}
                             */
                            foreignModels.add = function add(value) {

                                if (!foreignModels.has(value)) {
                                    entry.push(value);
                                }

                            };

                            /**
                             * @method remove
                             * @param value {String|Number}
                             * @return {void}
                             */
                            foreignModels.remove = function remove(value) {

                                var index = entry.indexOf(value);

                                if (index !== -1) {
                                    entry.splice(index, 1);
                                }

                            };

                            /**
                             * @method clear
                             * @return {void}
                             */
                            foreignModels.clear = function clear() {
                                entry = [];
                            };

                            /**
                             * @method has
                             * @param value {String|Number}
                             * @return {Boolean}
                             */
                            foreignModels.has = function has(value) {
                                return entry.indexOf(value) !== -1;
                            };

                            return foreignModels || [];

                        },

                        /**
                         * @method set
                         * @param value {Object|Array|Number|Boolean|Date|String|RegExp}
                         * @return {void}
                         */
                        set: function set(value) {

                            if (entry.indexOf(value) === -1) {
                                entry.push(value);
                            }

                        }

                    });

                },

                /**
                 * Responsible for cleaning a model based on the collection's blueprint.
                 *
                 * @param collectionName {String}
                 * @param model {Object}
                 * @return {Object}
                 */
                cleanModel: function cleanModel(collectionName, model) {

                    var primaryKey          = this._primaryName,
                        blueprint           = this.collection(collectionName).blueprint,
                        iterator            = this._propertyIterator,
                        getRelationshipType = this.getRelationshipType.bind(this),
                        createRelationship  = this.createRelationship.bind(this);

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

                            if (!getRelationshipType(collectionName, property)) {

                                var typecast = blueprint[property];

                                // Typecast each property accordingly.
                                model[property] = typecast(model[property]);
                                return;

                            }

                            // Now we know we're dealing with a relationship.
                            createRelationship(collectionName, model, property);

                        });

                    })();

                    return model;

                },

                /**
                 * @method getRelationshipType
                 * @param collectionName {String}
                 * @param property {String}
                 * @return {String|null}
                 */
                getRelationshipType: function getRelationshipType(collectionName, property) {

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

})(window.angular, window._, window.Object);