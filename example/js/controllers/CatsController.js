(function($app) {

    /**
     * @controller CatsController
     */
    $app.controller('CatsController', function catsController($scope, $timeout, catwalk) {

        /**
         * @property catName
         * @type {String}
         */
        $scope.catName = 'Kipper';

        $scope.$on('catwalk/read/cat', function(event, deferred, a, b) {
            console.log(a);
            console.log(b);
            deferred.resolve();
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
         * @property cats
         * @type {Array}
         */
        $scope.cats = catwalk.collection('cat', {

            /**
             * @property id
             * @type {Number}
             */
            id: catwalk.attribute.autoIncrement(),

            /**
             * @property name
             * @type {String}
             */
            name: catwalk.attribute.string(),

            /**
             * @property friends
             * @type {Array}
             */
            friends: catwalk.relationship.hasMany({
                collection: 'cat',
                foreignKey: 'name'
            })

        });

        /**
         * @method createCat
         * @param name {String}
         * @return {void}
         */
        $scope.createCat = function createCat(name) {

            var model = catwalk.createModel('cat', {
                name: name,
                friends: ['Splodge']
            });

            $scope.catName = 'Mango';

        };

        /**
         * @method updateCatName
         * @param model {Object}
         * @param name {String}
         * @return {void}
         */
        $scope.updateCatName = function updateCatName(model, name) {

            catwalk.updateModel('cat', model, {
                name: name
            });

        };

        /**
         * @method deleteCat
         * @param model {Object}
         * @return {void}
         */
        $scope.deleteCat = function deleteCat(model) {
            catwalk.deleteModel('cat', model);
        };

        /**
         * @method hasFriend
         * @param model {Object}
         * @param name {String}
         * @return {Boolean}
         */
        $scope.hasFriend = function hasFriend(model, name) {
            return model.friends.has(name);
        };

        /**
         * @method addFriend
         * @param model {Object}
         * @param name {String}
         * @return {void}
         */
        $scope.addFriend = function addFriend(model, name) {

            if ($scope.hasFriend(model, name)) {
                model.friends.remove(name);
                return;
            }

            model.friends.add(name);

        };

    });

})(window.catwalkApp);