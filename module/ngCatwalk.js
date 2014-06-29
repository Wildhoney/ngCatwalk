(function ngCatwalk($angular) {

    "use strict";

    // Bootstrap ngCatwalk!
    var app = $angular.module('ngCatwalk', ['ngCrossfilter']);

    /**
     * @method _throwException
     * @param message {String}
     * @return {void}
     * @private
     */
    var _throwException = function _throwException(message) {
        throw "ngCatwalk: " + message + ".";
    };

    /**
     * @property ngCatwalkAttribute
     * @type {Object}
     */
    var ngCatwalkAttribute = {

        /**
         * @method generic
         * @return {Number|String|Object|Array|Boolean}
         */
        generic: function generic(value) {
            return value;
        },

        /**
         * @method number
         * @param value {Number|String|Object|Array|Boolean}
         * @returns {Number}
         */
        number: function number(value) {
            return +value;
        }

    };

    /**
     * @property ngCatwalkRelationship
     * @type {Object}
     */
    var ngCatwalkRelationship = {

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
                 * @type ngCatwalkRelationship
                 */
                relationship: ngCatwalkRelationship,

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
                 * @param properties {Object}
                 * @return {Object}
                 */
                createModel: function createModel(collectionName, properties) {

                    var model   = this.collection(collectionName).createModel(properties),
                        promise = this.createPromise(collectionName, 'create', [model]);

                    promise.catch(function andCatch() {

                    });

                    return model;

                },

                /**
                 * @method revertCreateModel
                 * @param collectionName {String}
                 * @param model {Object}
                 * @return {Object}
                 */
                revertCreateModel: function revertCreateModel(collectionName, model) {

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
                 * @method oldProperties
                 * @param collectionName {String}
                 * @param model {Object}
                 * @param oldProperties {Object}
                 * @return {Object}
                 */
                revertUpdateModel: function revertUpdateModel(collectionName, model, oldProperties) {

                },

                /**
                 * @method deleteModel
                 * @param collectionName {String}
                 * @param model {Object}
                 * @return {Object}
                 */
                deleteModel: function deleteModel(collectionName, model) {

                },

                /**
                 * @method revertDeleteModel
                 * @param collectionName {String}
                 * @param model {Object}
                 * @return {Object}
                 */
                revertDeleteModel: function revertDeleteModel(collectionName, model) {

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
                    $rootScope.$broadcast.call(this, eventName, args);

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

                }

            };

            return new Catwalk();

        }]);

})(window.angular);