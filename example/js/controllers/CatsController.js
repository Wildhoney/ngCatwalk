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
         * @property addCat
         * @param name {String}
         * @return {void}
         */
        $scope.addCat = function addCat(name) {

            // Create our cat model!
            catwalk.createModel('cat', { name: name });

        };

    });

})(window.catwalkApp);