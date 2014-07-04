describe('ngCatwalk', function() {

    beforeEach(module('ngCatwalk', 'ngCrossfilter'));

    /**
     * @method setupCollection
     * @param catwalk {Object}
     * @return {void}
     */
    var setupCollection = inject(function(catwalk) {

        catwalk.collection('team', {
            name: catwalk.attribute.string('Unknown'),
            colour: catwalk.attribute.string('None')
        });

    });

    /**
     * @method nextTick
     * @param fn {Function}
     * @return {void}
     */
    var nextTick = function nextTick(fn) {
        setTimeout(fn, Math.random() * 10);
    };

    describe('Collections', function() {

        it('Should be able to define collections;', inject(function(catwalk) {

            catwalk.collection('team', {
                name:   catwalk.attribute.any(),
                colour: catwalk.attribute.string('none')
            });

            expect(typeof catwalk.collections.unknown).toEqual('undefined');
            expect(typeof catwalk.collection('unknown')).toEqual('object');
            expect(typeof catwalk.collections.team).toEqual('object');
            expect(typeof catwalk.collection('team')).toEqual('object');

        }));

    });

    describe('Models', function() {

        /**
         * @property $model
         * @type {Object}
         */
        var $model = {};

        /**
         * @method $createModel
         * @return {void}
         */
        var $createModel = inject(function($rootScope, catwalk) {

            spyOn($rootScope, '$on').and.callThrough();
            spyOn($rootScope, '$broadcast').and.callThrough();

            setupCollection();

            var model = $model = catwalk.createModel('team', { name: 'Netherlands' });
            expect($rootScope.$broadcast).toHaveBeenCalled();
            expect(catwalk.collection('team').collection().length).toEqual(0);
            expect(model.name).toEqual('Netherlands');
            expect(model.colour).toEqual('None');

        });

        describe('Create', function() {

            it('Resolve: Should be able to create models;', function(done) {

                inject(function($rootScope, catwalk) {

                    $rootScope.$apply(function() {

                        $rootScope.$on('catwalk/create/team', function(event, deferred) {
                            
                            nextTick(function() {
                                
                                deferred.resolve();
                                $rootScope.$digest();
                                expect(catwalk.collection('team').collection().length).toEqual(1);
                                done();
                                
                            });

                        });

                        $createModel();

                    });

                });

            });

            it('Resolve: Should be able to create models w/ additional properties;', function(done) {

                inject(function($rootScope, catwalk) {

                    $rootScope.$apply(function() {

                        $rootScope.$on('catwalk/create/team', function(event, deferred) {

                            nextTick(function() {

                                deferred.resolve({ colour: 'Orange' });
                                $rootScope.$digest();
                                expect(catwalk.collection('team').collection()[0].name).toEqual('Netherlands');
                                expect(catwalk.collection('team').collection()[0].colour).toEqual('Orange');
                                expect(catwalk.collection('team').collection().length).toEqual(1);
                                done();

                            });

                        });

                        $createModel();

                    });

                });

            });

            it('Reject: Should be able to create models;', function(done) {

                inject(function($rootScope, catwalk) {

                    $rootScope.$apply(function() {

                        $rootScope.$on('catwalk/create/team', function(event, deferred) {

                            nextTick(function() {

                                deferred.reject();
                                $rootScope.$digest();
                                expect(catwalk.collection('team').collection().length).toEqual(0);
                                done();

                            });

                        });

                        $createModel();

                    });

                });

            });

        });

        describe('Delete', function() {

            it('Resolve: Should be able to delete models;', function(done) {

                inject(function($rootScope, catwalk) {

                    $rootScope.$apply(function() {

                        $rootScope.$on('catwalk/create/team', function(event, deferred) {

                            nextTick(function() {

                                deferred.resolve();
                                $rootScope.$digest();
                                expect(catwalk.collection('team').collection().length).toEqual(1);
                                catwalk.deleteModel('team', $model);

                            });

                        });

                        $rootScope.$on('catwalk/delete/team', function(event, deferred) {

                            nextTick(function() {

                                expect(catwalk.collection('team').collection().length).toEqual(1);
                                deferred.resolve();
                                $rootScope.$digest();
                                expect(catwalk.collection('team').collection().length).toEqual(0);
                                done();

                            });

                        });

                        $createModel();
                        expect(catwalk.collection('team').collection().length).toEqual(0);

                    });

                });

            });

            it('Reject: Should be able to delete models;', function(done) {

                inject(function($rootScope, catwalk) {

                    $rootScope.$apply(function() {

                        $rootScope.$on('catwalk/create/team', function(event, deferred) {

                            nextTick(function() {

                                deferred.resolve();
                                $rootScope.$digest();
                                expect(catwalk.collection('team').collection().length).toEqual(1);
                                catwalk.deleteModel('team', $model);

                            });

                        });

                        $rootScope.$on('catwalk/delete/team', function(event, deferred) {

                            nextTick(function() {

                                expect(catwalk.collection('team').collection().length).toEqual(1);
                                deferred.reject();
                                $rootScope.$digest();
                                expect(catwalk.collection('team').collection().length).toEqual(1);
                                done();

                            });

                        });

                        $createModel();
                        expect(catwalk.collection('team').collection().length).toEqual(0);

                    });

                });

            });

        });

    });

});