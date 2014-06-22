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
         * @method addFriend
         * @param model {Object}
         * @param name {String}
         * @return {void}
         */
        $scope.addFriend = function addFriend(model, name) {

            var index = model.friends.indexOf(name);

            if (index !== -1) {

                model.friends.splice(index, 1);
                return;

            }

//            model.friends = [name];
            model.friends.addModel(name);

        };

    });

})(window.catwalkApp);