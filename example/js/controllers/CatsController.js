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
             * @property id
             *
             */
            id: catwalk.attribute.autoincrement(),

            /**
             * @property name
             * @type {String}
             */
            name: catwalk.attribute.string(),

            /**
             * @property friends
             * @type {Object}
             */
            friends: catwalk.relationship.hasMany({
                collection: 'cat',
                foreignKey: 'name'
            })

        });

        $scope.$on('catwalk/create/cat', function(event, deferred, model) {
            deferred.resolve();
        });

        $scope.$on('catwalk/delete/cat', function(event, deferred, model) {
            deferred.resolve();
        });

        $scope.$on('catwalk/update/cat', function(event, deferred, model) {
            deferred.resolve();
        });

        /**
         * @property createCat
         * @param name {String}
         * @return {void}
         */
        $scope.createCat = function createCat(name) {

            // Create our cat model!
            catwalk.createModel('cat', { name: name, friends: ['Kipper'] });

            // ...And reset the name property.
            $scope.catName = '';

        };

        /**
         * @method deleteCat
         * @param model {Object}
         * @return {void}
         */
        $scope.deleteCat = function deleteCat(model) {

            // Delete our cat model!
            catwalk.deleteModel('cat', model);

        };

        /**
         * @method updateCatName
         * @param model {Object}
         * @param name {String}
         * @return {void}
         */
        $scope.updateCatName = function updateCat(model, name) {

            // Update our cat model with a new name!
            catwalk.updateModel('cat', model, {
                name: name
            });

        };

        /**
         * @method addFriend
         * @param model {Object}
         * @param name {String}
         * @return {void}
         */
        $scope.addFriend = function addFriend(model, name) {

            if (model.friends.hasModel(name)) {
                model.friends.deleteModel(name);
                return;
            }

            model.friends.addModel(name);

        };

    });

})(window.catwalkApp);