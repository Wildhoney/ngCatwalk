(function ngCatwalk($angular, $catwalk) {

    "use strict";

    // Bootstrap ngCatwalk!
    var app = $angular.module('ngCatwalk', []);

    /**
     * @module ngCatwalk
     * @author Adam Timberlake
     * @link https://github.com/Wildhoney/ngCatwalk
     */
    app.service('catwalk', ['$window', '$rootScope', function catwalkService($window, $rootScope) {

        // Iterate over each event listener for Angular.js style observers.
        $angular.forEach(['create', 'read', 'update', 'delete'], function forEach(operation) {

            $catwalk.event.on(operation, function(collectionName) {

                // Broadcast the event to complete the operation.
                var eventName = 'catwalk/' + operation + '/' + collectionName;
                $rootScope.$broadcast(eventName, arguments[0], arguments[1], arguments[2]);

            });

        });

        // Once the content has been changed we need to update the scope variables.
        $catwalk.updated(function(collections) {

            $rootScope.$apply(function() {

                for (var name in collections) {

                    // Usual suspect!
                    if (collections.hasOwnProperty(name)) {

                        // Use the Angular approach to copying the values.
                        $angular.copy(collections[name].all(), catwalk.collections[name]);

                    }

                }

            });

        });

        /**
         * @property Catwalk
         * @constructor
         */
        var Catwalk = function Catwalk() {};

        /**
         * @property prototype
         * @type {Object}
         */
        Catwalk.prototype = $catwalk;

        // Instantiate Catwalk!
        var catwalk = new Catwalk();

        /**
         * @property collections
         * @type {Object}
         */
        catwalk.collections = {};

        /**
         * @method collection
         * @param name {String}
         * @param blueprint {Object}
         * @returns {Object}
         */
        catwalk.collection = function collection(name, blueprint) {

            if (!catwalk.collections[name]) {

                // Create the empty collection if it doesn't already exist.
                catwalk.collections[name] = [];

            }

            if (blueprint) {

                // Create the collection using the prototype chain.
                /*jshint proto: true */
                return catwalk.__proto__.collection(name, blueprint);

            }

            return catwalk.collections[name];

        };

        /**
         * @method createModel
         * @param name {String}
         * @param properties {Object}
         * @return {void}
         */
        catwalk.createModel = function createModel(name, properties) {
            catwalk.using(name).createModel(properties);
        };

        /**
         * @method updateModel
         * @param name {String}
         * @param model {Object}
         * @param properties {Object}
         * @return {void}
         */
        catwalk.updateModel = function updateModel(name, model, properties) {
            catwalk.using(name).updateModel(model, properties);
        };

        /**
         * @method deleteModel
         * @param name {String}
         * @param model {Object}
         * @return {void}
         */
        catwalk.deleteModel = function deleteModel(name, model) {
            catwalk.using(name).deleteModel(model);
        };

        /**
         * @method using
         * @param name {String}
         * @returns {Object}
         */
        catwalk.using = function using(name) {
            return $catwalk.collection(name);
        };

        return catwalk;

    }]);

})(window.angular, window.catwalk);