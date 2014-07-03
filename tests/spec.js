describe('ngCatwalk', function() {

    beforeEach(module('ngCatwalk', 'ngCrossfilter'));

    describe('Collections', function() {

        it('Should be able to define collections;', inject(function(catwalk) {

            catwalk.collection('team', {
                name:         catwalk.attribute.any(),
                colour:       catwalk.attribute.string('none'),
                worldCupWins: catwalk.attribute.number()
            });

            expect(typeof catwalk._collections.unknown).toEqual('undefined');
            expect(typeof catwalk.collection('unknown')).toEqual('object');
            expect(typeof catwalk._collections.team).toEqual('object');
            expect(typeof catwalk.collection('team')).toEqual('object');

        }));

    });

    describe('Attributes', function() {

        it('Should be able to provide default values;', inject(function(catwalk) {

            var stringAttribute = catwalk.attribute.string('Adam');
            expect(stringAttribute()).toEqual('Adam');
            expect(stringAttribute('Bob')).toEqual('Bob');
            expect(stringAttribute(null)).toBe('Adam');

            var numberAttribute = catwalk.attribute.number(5);
            expect(numberAttribute()).toEqual(5);
            expect(numberAttribute(10)).toEqual(10);
            expect(numberAttribute(null)).toBe(null);

            var anyAttribute = catwalk.attribute.any(true);
            expect(anyAttribute()).toEqual(true);
            expect(anyAttribute(false)).toEqual(false);
            expect(anyAttribute(null)).toBe(null);

        }));

        it('Should be able to typecast values accordingly;', inject(function(catwalk) {

            var stringAttribute = catwalk.attribute.string();
            expect(stringAttribute()).toBe(undefined);
            expect(stringAttribute(0)).toEqual('0');
            expect(stringAttribute(null)).toBe(null);

            var numberAttribute = catwalk.attribute.number('Maria');
            expect(numberAttribute()).toEqual('Maria');
            expect(numberAttribute('Karl')).toEqual(NaN);
            expect(numberAttribute(null)).toBe(null);

        }));

        it('Should be able to increment autoincrement attribute;', inject(function(catwalk) {

            var firstAutoIncrementAttribute = catwalk.attribute.autoIncrement();
            expect(firstAutoIncrementAttribute()).toEqual(1);
            expect(firstAutoIncrementAttribute()).toEqual(2);
            expect(firstAutoIncrementAttribute()).toEqual(3);

            var secondAutoIncrementAttribute = catwalk.attribute.autoIncrement();
            expect(secondAutoIncrementAttribute()).toEqual(1);

            expect(firstAutoIncrementAttribute()).toEqual(4);
            expect(secondAutoIncrementAttribute()).toEqual(2);

        }));

        it('Should be able to use custom attribute;', inject(function(catwalk) {

            var customAttribute = catwalk.attribute.custom(function(value) {
                return String(value).toUpperCase();
            });

            expect(customAttribute('Argentina')).toEqual('ARGENTINA');

        }));

    });

//    describe('Relationships', function() {
//
//        it('Should be able to define relationships;', inject(function(catwalk) {
//
//            catwalk.collection('team', {
//                name: catwalk.attribute.string(),
//                playing: catwalk.relationship.hasOne({
//                    collection: 'team',
//                    foreignKey: 'name'
//                })
//            });
//
//            var netherlandsModel = catwalk.createModel('team', { name: 'Netherlands', playing: 'Brazil' }),
//                brazilModel      = catwalk.createModel('team', { name: 'Brazil', playing: 'Netherlands' });
//
//            expect(netherlandsModel.playing).toBeDefined();
//            expect(brazilModel.playing).toBeDefined();
//
//        }));
//
//        describe('Has One', function() {
//
//            it('Should be able to define a hasOne relationship;', inject(function(catwalk) {
//
//                catwalk.collection('team', {
//                    name: catwalk.attribute.string(),
//                    playing: catwalk.relationship.hasOne({
//                        collection: 'team',
//                        foreignKey: 'name'
//                    })
//                });
//
//                var netherlandsModel = catwalk.createModel('team', { name: 'Netherlands', playing: 'Brazil' }),
//                    brazilModel      = catwalk.createModel('team', { name: 'Brazil', playing: 'Netherlands' });
//
//                expect(typeof netherlandsModel.playing).toBe('object');
//                expect(typeof brazilModel.playing).toBe('object');
//
//                expect(netherlandsModel.playing.name).toEqual('Brazil');
//                expect(brazilModel.playing.name).toEqual('Netherlands');
//
//                catwalk.deleteModel('team', brazilModel);
//                expect(netherlandsModel.playing.name).toEqual();
//
//            }));
//
//            it('Should be able to define a hasOne relationship to another collection;', inject(function($rootScope, catwalk) {
//
//                var englandModel, royHodgsonModel;
//
//                $rootScope.$apply(function() {
//
//                    $rootScope.$on('catwalk/update/manager', function(event, deferred) {
//                        deferred.resolve();
//                    });
//
//                    $rootScope.$on('catwalk/delete/manager', function(event, deferred) {
//                        deferred.resolve();
//                    });
//
//                    catwalk.collection('team', {
//                        name: catwalk.attribute.string(),
//                        manager: catwalk.relationship.hasOne({
//                            collection: 'manager',
//                            foreignKey: 'name'
//                        })
//                    });
//
//                    catwalk.collection('manager', {
//                        name: catwalk.attribute.string()
//                    });
//
//                    englandModel    = catwalk.createModel('team', { name: 'England', manager: 'Roy Hodgson' });
//                    royHodgsonModel = catwalk.createModel('manager', { name: 'Roy Hodgson' });
//
//                });
//
//                $rootScope.$apply(function() {
//
//                    expect(catwalk.collection('team').length).toEqual(1);
//                    expect(catwalk.collection('manager').length).toEqual(1);
//
//                    expect(englandModel.manager.name).toEqual('Roy Hodgson');
//
//                    catwalk.deleteModel('manager', royHodgsonModel);
//
//                });
//
//                $rootScope.$apply(function() {
//
//                    expect(englandModel.manager.name).toEqual();
//
//                    royHodgsonModel = catwalk.createModel('manager', { name: 'Roy Hodgson' });
//                    expect(englandModel.manager.name).toEqual();
//
//                    englandModel.manager = 'Roy Hodgson';
//                    expect(englandModel.manager.name).toEqual('Roy Hodgson');
//
//                    catwalk.updateModel('manager', royHodgsonModel, {
//                        name: 'Gary Linekar'
//                    });
//
//                });
//
//                $rootScope.$apply(function() {
//
//                    expect(englandModel.manager.name).toEqual();
//
//                    catwalk.updateModel('manager', royHodgsonModel, {
//                        name: 'Roy Hodgson'
//                    });
//
//                    expect(englandModel.manager.name).toEqual();
//
//                    englandModel.manager = 'Roy Hodgson';
//                    expect(englandModel.manager.name).toEqual('Roy Hodgson');
//
//                });
//
//            }));
//
//            it('Should be able to update a hasOne relationship;', inject(function($rootScope, catwalk) {
//
//                var netherlandsModel, brazilModel, englandModel;
//
//                $rootScope.$apply(function() {
//
//                    $rootScope.$on('catwalk/update/team', function (event, deferred) {
//                        deferred.resolve();
//                    });
//
//                    catwalk.collection('team', {
//                        name: catwalk.attribute.string(),
//                        playing: catwalk.relationship.hasOne({
//                            collection: 'team',
//                            foreignKey: 'name'
//                        })
//                    });
//
//                    netherlandsModel = catwalk.createModel('team', { name: 'Netherlands', playing: 'Brazil' });
//                    brazilModel = catwalk.createModel('team', { name: 'Brazil' });
//                    englandModel = catwalk.createModel('team', { name: 'England' });
//
//                    expect(typeof netherlandsModel.playing).toBe('object');
//                    expect(typeof brazilModel.playing).toBe('object');
//                    expect(typeof englandModel.playing).toBe('object');
//
//                    expect(netherlandsModel.playing.name).toEqual('Brazil');
//                    netherlandsModel.playing = 'England';
//                    expect(netherlandsModel.playing.name).toEqual('England');
//
//                    catwalk.deleteModel('team', englandModel);
//
//                });
//
//                $rootScope.$apply(function() {
//
//                    expect(netherlandsModel.playing.name).toBeUndefined();
//
//                    netherlandsModel.playing = 'Non-existent';
//                    expect(netherlandsModel.playing.name).toBeUndefined();
//
//                    netherlandsModel.playing = 'Netherlands';
//                    expect(netherlandsModel.playing.name).toEqual('Netherlands');
//
//                    netherlandsModel.playing = 'Spain';
//                    expect(netherlandsModel.playing.name).toEqual();
//
//                    netherlandsModel.playing = 'Brazil';
//                    expect(netherlandsModel.playing.name).toEqual('Brazil');
//
//                    catwalk.updateModel('team', brazilModel, {
//                        name: 'Costa Rica'
//                    });
//
//                });
//
//                $rootScope.$apply(function() {
//
//                    expect(netherlandsModel.playing.name).toEqual();
//
//                    catwalk.updateModel('team', brazilModel, {
//                        name: 'Brazil'
//                    });
//
//                });
//
//                $rootScope.$apply(function() {
//
//                    expect(netherlandsModel.playing.name).toEqual();
//                    netherlandsModel.playing = 'Brazil';
//                    expect(netherlandsModel.playing.name).toEqual('Brazil');
//
//                });
//
//            }));
//
//        });
//
//        describe('Has Many', function() {
//
//            it('Should be able to define a hasMany relationship;', inject(function(catwalk) {
//
//                catwalk.collection('team', {
//                    name: catwalk.attribute.string(),
//                    inGroup: catwalk.relationship.hasMany({
//                        collection: 'team',
//                        foreignKey: 'name'
//                    })
//                });
//
//                var netherlandsModel = catwalk.createModel('team', { name: 'Netherlands', inGroup: ['Brazil', 'England'] }),
//                    brazilModel      = catwalk.createModel('team', { name: 'Brazil' }),
//                    englandModel     = catwalk.createModel('team', { name: 'England' });
//
//                expect(typeof netherlandsModel.inGroup).toBe('object');
//                expect(typeof brazilModel.inGroup).toBe('object');
//                expect(typeof englandModel.inGroup).toBe('object');
//
//                expect(Array.isArray(netherlandsModel.inGroup)).toBeTruthy();
//                expect(Array.isArray(brazilModel.inGroup)).toBeTruthy();
//                expect(Array.isArray(englandModel.inGroup)).toBeTruthy();
//
//                expect(netherlandsModel.inGroup.length).toEqual(2);
//                expect(netherlandsModel.inGroup[0].name).toEqual('Brazil');
//                expect(netherlandsModel.inGroup[1].name).toEqual('England');
//
//            }));
//
//            it('Should be able to define a hasMany relationship to another collection;', inject(function(catwalk) {
//
//                catwalk.collection('team', {
//                    name: catwalk.attribute.string(),
//                    players: catwalk.relationship.hasMany({
//                        collection: 'player',
//                        foreignKey: 'name'
//                    })
//                });
//
//                catwalk.collection('player', {
//                    name: catwalk.attribute.string()
//                });
//
//                var players      = ['Leighton Baines', 'Steven Gerrard'],
//                    englandModel = catwalk.createModel('team', { name: 'England', players: players });
//
//                catwalk.createModel('player', { name: 'Leighton Baines' });
//                catwalk.createModel('player', { name: 'Steven Gerrard' });
//
//                expect(englandModel.players.length).toEqual(2);
//                expect(englandModel.players[0].name).toEqual('Leighton Baines');
//                expect(englandModel.players[1].name).toEqual('Steven Gerrard');
//
//                englandModel.players.remove('Leighton Baines');
//                expect(englandModel.players.length).toEqual(1);
//                expect(englandModel.players[0].name).toEqual('Steven Gerrard');
//                expect(englandModel.players[1]).toBeUndefined();
//
//                englandModel.players.clear();
//                expect(englandModel.players.length).toEqual(0);
//                englandModel.players = 'Steven Gerrard';
//                expect(englandModel.players.length).toEqual(1);
//                expect(englandModel.players[0].name).toEqual('Steven Gerrard');
//
//            }));
//
//            it('Should be able to update a hasMany relationship;', inject(function($rootScope, catwalk) {
//
//                var netherlandsModel, brazilModel, englandModel;
//
//                $rootScope.$apply(function() {
//
//                    catwalk.collection('team', {
//                        name: catwalk.attribute.string(),
//                        inGroup: catwalk.relationship.hasMany({
//                            collection: 'team',
//                            foreignKey: 'name'
//                        })
//                    });
//
//                    $rootScope.$on('catwalk/delete/team', function(event, deferred) {
//                        deferred.resolve();
//                    });
//
//                    netherlandsModel = catwalk.createModel('team', { name: 'Netherlands' });
//                    brazilModel      = catwalk.createModel('team', { name: 'Brazil' });
//                    englandModel     = catwalk.createModel('team', { name: 'England' });
//
//                    expect(Array.isArray(netherlandsModel.inGroup)).toBeTruthy();
//                    expect(Array.isArray(brazilModel.inGroup)).toBeTruthy();
//                    expect(Array.isArray(englandModel.inGroup)).toBeTruthy();
//
//                    expect(typeof netherlandsModel.inGroup.add).toEqual('function');
//                    netherlandsModel.inGroup.add('Brazil');
//                    expect(netherlandsModel.inGroup.length).toEqual(1);
//                    expect(netherlandsModel.inGroup[0].name).toEqual('Brazil');
//
//                    netherlandsModel.inGroup.remove('Brazil');
//                    expect(netherlandsModel.inGroup.length).toEqual(0);
//
//                    netherlandsModel.inGroup.add('Brazil');
//                    netherlandsModel.inGroup.add('England');
//                    netherlandsModel.inGroup.add('Algeria');
//                    expect(netherlandsModel.inGroup.length).toEqual(2);
//                    expect(netherlandsModel.inGroup.has('England')).toBeTruthy();
//                    expect(netherlandsModel.inGroup.has('France')).toBeFalsy();
//                    expect(netherlandsModel.inGroup.has('Algeria')).toBeTruthy();
//
//                    netherlandsModel.inGroup.remove('England');
//                    expect(netherlandsModel.inGroup.length).toEqual(1);
//
//                    netherlandsModel.inGroup = 'England';
//                    expect(netherlandsModel.inGroup.length).toEqual(2);
//
//                    netherlandsModel.inGroup = 'England';
//                    expect(netherlandsModel.inGroup.length).toEqual(2);
//
//                    var algeriaModel = catwalk.createModel('team', { name: 'Algeria' });
//                    expect(netherlandsModel.inGroup.length).toEqual(3);
//                    catwalk.deleteModel('team', algeriaModel);
//
//                });
//
//                $rootScope.$apply(function() {
//
//                    expect(netherlandsModel.inGroup.length).toEqual(2);
//                    expect(netherlandsModel.inGroup.has('Algeria')).toBeFalsy();
//
//                });
//
//            }));
//
//        });
//
//    });

    describe('Models', function() {

        describe('Create', function() {

            it('Should be able to create a model;', inject(function(catwalk) {

                catwalk.collection('team', {
                    name:         catwalk.attribute.any(),
                    colour:       catwalk.attribute.string(),
                    worldCupWins: catwalk.attribute.number()
                });

                var model = catwalk.createModel('team', {
                    name:         'Netherlands',
                    worldCupWins: '0',
                    manager:      'Louis van Gaal'
                });

                expect(model[catwalk._primaryName]).toBe(1);
                expect(model.name).toBe('Netherlands');
                expect(model.worldCupWins).toBe(0);
                expect(model.colour).toBeNull();
                expect(model.manager).toBeUndefined();

            }));

            it('Should be able to create a model using default properties;', inject(function(catwalk) {

                catwalk.collection('team', {
                    name:         catwalk.attribute.any(),
                    colour:       catwalk.attribute.string('none'),
                    worldCupWins: catwalk.attribute.number()
                });

                var model = catwalk.createModel('team', {
                    name:    'Netherlands',
                    manager: 'Louis van Gaal'
                });

                expect(model.colour).toEqual('none');

            }));

            it('Should be able to reject the creation of a model;', inject(function($rootScope, catwalk) {

                $rootScope.$apply(function() {

                    catwalk.collection('team', {
                        name:         catwalk.attribute.any(),
                        colour:       catwalk.attribute.string('none'),
                        worldCupWins: catwalk.attribute.number()
                    });

                    spyOn($rootScope, '$broadcast').and.callThrough();

                    $rootScope.$on('catwalk/create/team', function(event, deferred) {
                        deferred.reject();
                    });

                    catwalk.createModel('team', {
                        name:   'Netherlands',
                        colour: 'Orange'
                    });

                });

                $rootScope.$apply(function() {

                    expect($rootScope.$broadcast).toHaveBeenCalled();
                    expect(catwalk.collection('team').length).toEqual(0);

                });

            }));

            it('Should be able to resolve the creation of a model with additional properties;', inject(function($rootScope, catwalk) {

                var model;

                $rootScope.$apply(function() {

                    catwalk.collection('team', {
                        name: catwalk.attribute.any(),
                        colour: catwalk.attribute.string('none'),
                        worldCupWins: catwalk.attribute.number()
                    });

                    spyOn($rootScope, '$broadcast').and.callThrough();

                    $rootScope.$on('catwalk/create/team', function (event, deferred) {
                        deferred.resolve({ colour: 'Blue' });
                    });

                    model = catwalk.createModel('team', {
                        name: 'Netherlands',
                        colour: 'Orange'
                    });

                });

                $rootScope.$apply(function() {

                    expect($rootScope.$broadcast).toHaveBeenCalled();
                    expect(catwalk.collection('team').collection().length).toEqual(1);
                    expect(model.colour).toEqual('Blue');

                });

            }));

        });

//        describe('Read', function() {
//
//            it('Should be able to read a model in a hasOne relationship;', inject(function ($rootScope, catwalk) {
//
//                var netherlandsModel;
//
//                $rootScope.$apply(function() {
//
//                    $rootScope.$on('catwalk/read/team', function(event, deferred, property, value) {
//                        console.log('Here');
//                        catwalk.createModel('team', { name: 'Brazil' });
//                    });
//
//                    catwalk.collection('team', {
//                        name:   catwalk.attribute.string(),
//                        versus: catwalk.relationship.hasOne({
//                            collection: 'team',
//                            foreignKey: 'name'
//                        })
//                    });
//
//                    netherlandsModel = catwalk.createModel('team', {
//                        name: 'Netherlands',
//                        versus: 'Brazil'
//                    });
//
//                    expect(catwalk.collection('team').collection().length).toEqual(2);
//                    expect(netherlandsModel.versus.name).toEqual('Brazil');
//
//                });
//
//            }));
//
//            it('Should be able to read a model in a hasMany relationship;', inject(function ($rootScope, catwalk) {
//
//                $rootScope.$apply(function() {
//
//                    $rootScope.$on('catwalk/read/player', function(event, deferred, property, value) {
//                        catwalk.createModel('player', { name: 'Robin van Persie' });
//                    });
//
//                    catwalk.collection('team', {
//                        name:    catwalk.attribute.string(),
//                        players: catwalk.relationship.hasMany({
//                            collection: 'player',
//                            foreignKey: 'name'
//                        })
//                    });
//
//                    catwalk.collection('player', {
//                        name: catwalk.attribute.string()
//                    });
//
//                    var netherlandsModel = catwalk.createModel('team', {
//                        name: 'Netherlands',
//                        players: ['Dirk Kuyt', 'Robin van Persie']
//                    });
//
//                    expect(catwalk.collection('player').collection().length).toEqual(0);
//                    catwalk.createModel('player', { name: 'Dirk Kuyt' });
//                    expect(catwalk.collection('player').collection().length).toEqual(1);
//
//                    expect(netherlandsModel.players.length).toEqual(1);
//                    expect(catwalk.collection('player').collection().length).toEqual(2);
//                    expect(catwalk.collection('player').collection()[0].name).toEqual('Dirk Kuyt');
//                    expect(catwalk.collection('player').collection()[1].name).toEqual('Robin van Persie');
//
//                });
//
//            }));
//
//        });

        describe('Update', function() {

            it('Should be able to update a model;', inject(function(catwalk) {

                catwalk.collection('team', {
                    name:    catwalk.attribute.any(),
                    colour:  catwalk.attribute.string(),
                    playing: catwalk.relationship.hasOne({
                        collection: 'team',
                        foreignKey: 'name'
                    })
                });

                var model = catwalk.createModel('team', {
                    name:   'Iceland',
                    colour: 'Blue'
                });

                expect(catwalk.collection('team').collection()[0].name).toEqual('Iceland');
                expect(catwalk.collection('team').collection()[0].colour).toEqual('Blue');

                catwalk.updateModel('team', model, {
                    name:    'France',
                    manager: 'Didier Deschamps',
                    playing: 'Modifying Relationship'
                });

                expect(catwalk.collection('team').collection()[0].name).toEqual('France');
                expect(catwalk.collection('team').collection()[0].manager).toBeUndefined();
                expect(typeof catwalk.collection('team').collection()[0].playing).toEqual('object');

            }));

            it('Should be able to reject the updating of a model;', inject(function($rootScope, catwalk) {

                $rootScope.$apply(function() {

                    catwalk.collection('team', {
                        name:   catwalk.attribute.string(),
                        colour: catwalk.attribute.string()
                    });

                    $rootScope.$on('catwalk/update/team', function(event, deferred) {
                        deferred.reject();
                    });

                    var model = catwalk.createModel('team', {
                        name:   'Iceland',
                        colour: 'Blue'
                    });

                    spyOn($rootScope, '$broadcast').and.callThrough();

                    catwalk.updateModel('team', model, {
                        name:   'Argentina',
                        colour: 'Sky Blue'
                    });

                });

                $rootScope.$apply(function() {

                    expect($rootScope.$broadcast).toHaveBeenCalled();
                    expect(catwalk.collection('team').collection().length).toEqual(1);
                    expect(catwalk.collection('team').collection()[0].name).toEqual('Iceland');
                    expect(catwalk.collection('team').collection()[0].colour).toEqual('Blue');

                });

            }));

        });

        describe('Delete', function() {

            it('Should be able to delete a model;', inject(function($rootScope, catwalk) {

                $rootScope.$apply(function() {

                    catwalk.collection('team', {
                        name:         catwalk.attribute.any(),
                        colour:       catwalk.attribute.string(),
                        worldCupWins: catwalk.attribute.number()
                    });

                    var model = catwalk.createModel('team', {
                        name:   'Iceland',
                        colour: 'Blue'
                    });

                    expect(catwalk.collection('team').collection().length).toEqual(1);
                    catwalk.deleteModel('team', model);

                });

                $rootScope.$apply(function() {

                    expect(catwalk.collection('team').collection().length).toEqual(0);

                });

            }));

            it('Should be able to reject the deletion of a model;', inject(function($rootScope, catwalk) {

                $rootScope.$apply(function() {

                    catwalk.collection('team', {
                        name: catwalk.attribute.any(),
                        colour: catwalk.attribute.string(),
                        worldCupWins: catwalk.attribute.number()
                    });

                    spyOn($rootScope, '$broadcast').and.callThrough();

                    $rootScope.$on('catwalk/delete/team', function (event, deferred) {
                        deferred.reject();
                    });

                    var model = catwalk.createModel('team', {
                        name: 'Iceland',
                        colour: 'Blue'
                    });

                    catwalk.deleteModel('team', model);

                });

                $rootScope.$apply(function() {

                    expect($rootScope.$broadcast).toHaveBeenCalled();
                    expect(catwalk.collection('team').collection().length).toEqual(1);

                });

            }));

        });

    });

    describe('Asynchronicity', function() {

//        it('Should be able to lazy-load a hasOne relationship model;', function(done) {
//
//            var ferrariModel;
//
//            inject(function($rootScope, catwalk) {
//
//                $rootScope.$apply(function() {
//
//                    $rootScope.$on('catwalk/read/colour', function() {
//
//                        setTimeout(function timeout() {
//
//                            catwalk.createModel('colour', { name: 'Red' });
//
//                            expect(ferrariModel.colour.name).toEqual('Red');
//                            expect(catwalk.collection('colour').collection().length).toEqual(4);
//
//                            done();
//
//                        }, 500);
//
//                    });
//
//                    catwalk.collection('car', {
//                        name: catwalk.attribute.string(),
//                        colour: catwalk.relationship.hasOne({
//                            collection: 'colour',
//                            foreignKey: 'name'
//                        })
//                    });
//
//                    catwalk.collection('colour', {
//                        name: catwalk.attribute.string()
//                    });
//
//                    ferrariModel = catwalk.createModel('car', {
//                        name: 'Ferrari',
//                        colour: 'Red'
//                    });
//
//                    expect(catwalk.collection('car').collection().length).toEqual(1);
//
//                    catwalk.createModel('colour', { name: 'Green' });
//                    catwalk.createModel('colour', { name: 'Blue' });
//                    catwalk.createModel('colour', { name: 'Yellow' });
//                    expect(catwalk.collection('colour').collection().length).toEqual(3);
//
//                });
//
//            });
//
//        });
//
//        it('Should be able to lazy-load a single hasMany relationship model;', function(done) {
//
//            var ferrariModel;
//
//            inject(function($rootScope, catwalk) {
//
//                $rootScope.$apply(function() {
//
//                    $rootScope.$on('catwalk/read/colour', function() {
//
//                        setTimeout(function timeout() {
//
//                            expect(ferrariModel.colours.length).toEqual(1);
//
//                            catwalk.createModel('colour', { name: 'Black' });
//
//                            expect(ferrariModel.colours.length).toEqual(2);
//                            expect(ferrariModel.colours[0].name).toEqual('Red');
//                            expect(ferrariModel.colours[1].name).toEqual('Black');
//                            expect(catwalk.collection('colour').collection().length).toEqual(5);
//
//                            done();
//
//                        }, 10);
//
//                    });
//
//                    catwalk.collection('car', {
//                        name: catwalk.attribute.string(),
//                        colours: catwalk.relationship.hasMany({
//                            collection: 'colour',
//                            foreignKey: 'name'
//                        })
//                    });
//
//                    catwalk.collection('colour', {
//                        name: catwalk.attribute.string()
//                    });
//
//                    ferrariModel = catwalk.createModel('car', {
//                        name: 'Ferrari',
//                        colours: ['Red', 'Black']
//                    });
//
//                    expect(catwalk.collection('car').collection().length).toEqual(1);
//
//                    catwalk.createModel('colour', { name: 'Green' });
//                    catwalk.createModel('colour', { name: 'Red' });
//                    catwalk.createModel('colour', { name: 'Blue' });
//                    catwalk.createModel('colour', { name: 'Yellow' });
//
//                    expect(catwalk.collection('colour').collection().length).toEqual(4);
//                    expect(ferrariModel.colours.length).toEqual(1);
//
//                });
//
//            });
//
//        });

//        it('Should be able to lazy-load multiple hasMany relationship model;', function(done) {
//
//            var ferrariModel;
//
//            inject(function($rootScope, catwalk) {
//
//                var index = 2;
//
//                $rootScope.$apply(function() {
//
//                    $rootScope.$on('catwalk/read/colour', function(deferred, model, property, value) {
//
//                        setTimeout(function timeout() {
//
//                            catwalk.createModel('colour', { name: value });
//                            expect(ferrariModel.colours[index - 1].name).toEqual(value);
//                            expect(catwalk.collection('colour').collection().length).toEqual(++index);
//
//                        }, 300);
//
//                    });
//
//                    setTimeout(function timeout() {
//
//                        expect(catwalk.collection('colour').collection().length).toEqual(5);
//                        expect(ferrariModel.colours[0].name).toEqual('Green');
//                        expect(ferrariModel.colours[1].name).toEqual('Red');
//                        expect(ferrariModel.colours[2].name).toEqual('Black');
//                        done();
//
//                    }, 400);
//
//                    catwalk.collection('car', {
//                        name: catwalk.attribute.string(),
//                        colours: catwalk.relationship.hasMany({
//                            collection: 'colour',
//                            foreignKey: 'name'
//                        })
//                    });
//
//                    catwalk.collection('colour', {
//                        name: catwalk.attribute.string()
//                    });
//
//                    ferrariModel = catwalk.createModel('car', {
//                        name: 'Ferrari',
//                        colours: ['Red', 'Black']
//                    });
//
//                    expect(catwalk.collection('car').collection().length).toEqual(1);
//                    catwalk.createModel('colour', { name: 'Green' });
//                    catwalk.createModel('colour', { name: 'Yellow' });
//                    expect(catwalk.collection('colour').collection().length).toEqual(2);
//
//                    ferrariModel.colours.add('Green');
//
//                    expect(ferrariModel.colours.length).toEqual(1);
//
//                });
//
//            });
//
//        });

//        it('Should be able to reject the lazy-deletion of a model;', function(done) {
//
//            inject(function($rootScope, catwalk) {
//
//                $rootScope.$apply(function () {
//
//                    $rootScope.$on('catwalk/delete/player', function(event, deferred) {
//
//                        deferred.reject();
//
//                        setTimeout(function timeout() {
//
//                            expect(catwalk.collection('player').collection().length).toEqual(1);
//                            done();
//
//                        }, 100);
//
//                    });
//
//                    catwalk.collection('player', {
//                        name: catwalk.attribute.string()
//                    });
//
//                    var messiModel = catwalk.createModel('player', { name: 'Lionel Messi' });
//                    expect(catwalk.collection('player').collection().length).toEqual(1);
//                    catwalk.deleteModel('player', messiModel);
//
//                });
//
//            });
//
//        });

//        it('Should be able to lazy-delete a hasMany relationship model;', function(done) {
//
//            var fordModel;
//
//            inject(function($rootScope, catwalk) {
//
//                $rootScope.$apply(function() {
//
//                    $rootScope.$on('catwalk/delete/colour', function() {
//
//                        setTimeout(function timeout() {
//
//                            expect(fordModel.colours.length).toEqual(1);
//                            done();
//
//                        }, 10);
//
//                    });
//
//                    catwalk.collection('car', {
//                        name: catwalk.attribute.string(),
//                        colours: catwalk.relationship.hasMany({
//                            collection: 'colour',
//                            foreignKey: 'name'
//                        })
//                    });
//
//                    catwalk.collection('colour', {
//                        name: catwalk.attribute.string()
//                    });
//
//                    fordModel = catwalk.createModel('car', { name: 'fordModel', colours: ['Blue', 'Orange'] });
//
//                    var blueModel = catwalk.createModel('colour', { name: 'Blue' });
//                    catwalk.createModel('colour', { name: 'Green' });
//                    catwalk.createModel('colour', { name: 'Orange' });
//
//                    expect(fordModel.colours.length).toEqual(2);
//                    catwalk.deleteModel('colour', blueModel);
//
//                });
//
//            });

//        });

    });

});