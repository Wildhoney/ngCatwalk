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

        $scope.$on('catwalk/read/colour', function(event, deferred, property, value) {

            $timeout(function() {
                deferred.resolve({
                    colour: value
                });
            }, 1);

        });

        $scope.$on('catwalk/create/colour', function(event, deferred, model) {

            $timeout(function() {
                deferred.resolve();
            }, 1);

        });

        $scope.$on('catwalk/create/cat', function(event, deferred, model) {

            $timeout(function() {
                deferred.resolve();
            }, 1);

        });

        $scope.$on('catwalk/delete/cat', function(event, deferred, model) {

            $timeout(function() {
                deferred.resolve();
            }, 1);

        });

        $scope.$on('catwalk/update/cat', function(event, deferred, model) {

            console.log(JSON.stringify(model));

            $timeout(function() {
                deferred.resolve();
            }, 1);

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
            }),

            /**
             * @property colour
             * @type {Object}
             */
            colour: catwalk.relationship.hasOne({
                collection: 'colour',
                foreignKey: 'colour'
            })

        });

        /**
         * @property colours
         * @type {Array}
         */
        $scope.colours = catwalk.collection('colour', {

            /**
             * @property colour
             * @type {String}
             */
            colour: catwalk.attribute.string()

        });

        catwalk.createModel('colour', {
            colour: 'Ginger'
        });

//        catwalk.createModel('colour', {
//            colour: 'Black'
//        });

        catwalk.createModel('colour', {
            colour: 'White'
        });

        /**
         * @method createCat
         * @param name {String}
         * @return {void}
         */
        $scope.createCat = function createCat(name) {

            catwalk.createModel('cat', {
                name: name,
                colour: 'Black'
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