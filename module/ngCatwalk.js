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
            function Catwalk() {}

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
                 * @method createModel
                 * @param collection {String}
                 * @param properties {Object}
                 * @return {Object}
                 */
                createModel: function createModel(collection, properties) {

                },

                /**
                 * @method updateModel
                 * @param model {Object}
                 * @param properties {Object}
                 * @return {Object}
                 */
                updateModel: function updateModel(model, properties) {

                },

                /**
                 * @method deleteModel
                 * @param collection {String}
                 * @param model {Object}
                 * @return {Object}
                 */
                deleteModel: function deleteModel(collection, model) {

                },

                /**
                 * @method createPromise
                 * @param type {String}
                 * @param args {String|Boolean|Number|Object|Array}
                 * @return {$q.promise}
                 */
                createPromise: function createPromise(type, args) {

                    var deferred = $q.defer();
                    return deferred.promise;

                }

            };

            return new Catwalk();

        }]);

})(window.angular);