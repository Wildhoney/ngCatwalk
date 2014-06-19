(function($app) {

    /**
     * @controller CatsController
     */
    $app.controller('CatsController', function catsController($scope, catwalk) {

        /**
         * @property cats
         * @type {Array}
         */
        $scope.cats = catwalk.collection('cat');

        /**
         * @property name
         * @type {String}
         */
        $scope.name = '';

        // Create our cat collection.
        catwalk.collection('cat', {

            /**
             * @property _primaryKey
             * @type {String}
             */
            _primaryKey: 'name',

            /**
             * @property name
             * @type {String}
             */
            name: catwalk.attribute.string

        });

        /**
         * @event catwalk/create/cat
         */
        $scope.$on('catwalk/create/cat', function createCat(event, collectionName, deferred, model) {
            deferred.resolve();
        });

        /**
         * @property createCat
         * @param name {String}
         * @return {void}
         */
        $scope.createCat = function createCat(name) {

            // Create our cat model!
            catwalk.createModel('cat', { name: name });

            // ...And reset the name property.
            $scope.name = '';

        };

        /**
         * @method deleteCat
         * @param model {Object}
         * @return {void}
         */
        $scope.deleteCat = function deleteCat(model) {

            // Remove the requested model!
            catwalk.deleteModel('cat', model);

        };

    });

})(window.catwalkApp);