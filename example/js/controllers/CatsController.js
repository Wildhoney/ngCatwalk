(function($app) {

    /**
     * @controller CatsController
     */
    $app.controller('CatsController', function catsController($scope, catwalk) {

        /**
         * @property catName
         * @type {String}
         */
        $scope.catName = 'Kipper';

        /**
         * @property cats
         * @type {Array}
         */
        $scope.cats = catwalk.collection('cat');

        // Create our cat collection.
        catwalk.collection('cat', {

            /**
             * @property primaryKey
             * @type {String}
             */
            primaryKey: 'name',

            /**
             * @property id
             *
             */
            id: catwalk.attribute.autoincrement(),

            /**
             * @property name
             * @type {String}
             */
            name: catwalk.attribute.string()

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
            $scope.catName = '';

        };

        $scope.deleteCat = function deleteCat(model) {

            // Delete our cat model!
            catwalk.deleteModel('cat', model);

        }

    });

})(window.catwalkApp);