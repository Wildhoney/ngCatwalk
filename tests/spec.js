describe('ngCatwalk', function() {

    beforeEach(module('ngCatwalk', 'ngCrossfilter'));

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

    describe('Relationships', function() {

        it('Should be able to define relationships;', inject(function(catwalk) {

            catwalk.collection('team', {
                name: catwalk.attribute.string(),
                playing: catwalk.relationship.hasOne({
                    collection: 'team',
                    foreignKey: 'name'
                })
            });

            var netherlandsModel = catwalk.createModel('team', { name: 'Netherlands', playing: 'Brazil' }),
                brazilModel      = catwalk.createModel('team', { name: 'Brazil', playing: 'Netherlands' });

            expect(netherlandsModel.playing).toBeDefined();
            expect(brazilModel.playing).toBeDefined();

        }));

        it('Should be able to define a hasOne relationship;', inject(function(catwalk) {

            catwalk.collection('team', {
                name: catwalk.attribute.string(),
                playing: catwalk.relationship.hasOne({
                    collection: 'team',
                    foreignKey: 'name'
                })
            });

            var netherlandsModel = catwalk.createModel('team', { name: 'Netherlands', playing: 'Brazil' }),
                brazilModel      = catwalk.createModel('team', { name: 'Brazil', playing: 'Netherlands' });

            expect(typeof netherlandsModel.playing).toBe('object');
            expect(typeof brazilModel.playing).toBe('object');

            expect(netherlandsModel.playing.name).toEqual('Brazil');
            expect(brazilModel.playing.name).toEqual('Netherlands');

        }));

        it('Should be able to update a hasOne relationship;', inject(function(catwalk) {

            catwalk.collection('team', {
                name: catwalk.attribute.string(),
                playing: catwalk.relationship.hasOne({
                    collection: 'team',
                    foreignKey: 'name'
                })
            });

            var netherlandsModel = catwalk.createModel('team', { name: 'Netherlands', playing: 'Brazil' }),
                brazilModel      = catwalk.createModel('team', { name: 'Brazil' }),
                englandModel     = catwalk.createModel('team', { name: 'England' });

            expect(typeof netherlandsModel.playing).toBe('object');
            expect(typeof brazilModel.playing).toBe('object');
            expect(typeof englandModel.playing).toBe('object');

            expect(netherlandsModel.playing.name).toEqual('Brazil');
            netherlandsModel.playing = 'England';
            expect(netherlandsModel.playing.name).toEqual('England');

            catwalk.deleteModel('team', englandModel);
            expect(netherlandsModel.playing.name).toBeUndefined();

            netherlandsModel.playing = 'Non-existent';
            expect(netherlandsModel.playing.name).toBeUndefined();

            netherlandsModel.playing = 'Netherlands';
            expect(netherlandsModel.playing.name).toEqual('Netherlands');

        }));

        it('Should be able to define a hasMany relationship;', inject(function(catwalk) {

            catwalk.collection('team', {
                name: catwalk.attribute.string(),
                inGroup: catwalk.relationship.hasMany({
                    collection: 'team',
                    foreignKey: 'name'
                })
            });

            var netherlandsModel = catwalk.createModel('team', { name: 'Netherlands', inGroup: ['Brazil', 'England'] }),
                brazilModel      = catwalk.createModel('team', { name: 'Brazil' }),
                englandModel     = catwalk.createModel('team', { name: 'England' });

            expect(typeof netherlandsModel.inGroup).toBe('object');
            expect(typeof brazilModel.inGroup).toBe('object');
            expect(typeof englandModel.inGroup).toBe('object');

            expect(Array.isArray(netherlandsModel.inGroup)).toBeTruthy();
            expect(Array.isArray(brazilModel.inGroup)).toBeTruthy();
            expect(Array.isArray(englandModel.inGroup)).toBeTruthy();

            expect(netherlandsModel.inGroup.length).toEqual(2);
            expect(netherlandsModel.inGroup[0].name).toEqual('Brazil');
            expect(netherlandsModel.inGroup[1].name).toEqual('England');

        }));

    });

    describe('Collection', function() {

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

                catwalk.collection('team', {
                    name:         catwalk.attribute.any(),
                    colour:       catwalk.attribute.string('none'),
                    worldCupWins: catwalk.attribute.number()
                });

                spyOn($rootScope, '$broadcast').and.callFake(function fake(name, deferred) {
                    deferred.reject();
                });

                catwalk.createModel('team', {
                    name:   'Netherlands',
                    colour: 'Orange'
                });

                $rootScope.$digest();

                expect($rootScope.$broadcast).toHaveBeenCalled();
                expect(catwalk.collection('team').length).toEqual(0);

            }));

            it('Should be able to resolve the creation of a model with additional properties;', inject(function($rootScope, catwalk) {

                catwalk.collection('team', {
                    name:         catwalk.attribute.any(),
                    colour:       catwalk.attribute.string('none'),
                    worldCupWins: catwalk.attribute.number()
                });

                spyOn($rootScope, '$broadcast').and.callFake(function fake(name, deferred, model) {

                    expect(typeof model).toEqual('object');

                    deferred.resolve({
                        colour: 'Blue'
                    });

                });

                var model = catwalk.createModel('team', {
                    name:   'Netherlands',
                    colour: 'Orange'
                });

                $rootScope.$digest();

                expect($rootScope.$broadcast).toHaveBeenCalled();
                expect(catwalk.collection('team').length).toEqual(1);
                expect(model.colour).toEqual('Blue');

            }));

        });

        describe('Delete', function() {

            it('Should be able to delete a model;', inject(function(catwalk) {

                catwalk.collection('team', {
                    name:         catwalk.attribute.any(),
                    colour:       catwalk.attribute.string(),
                    worldCupWins: catwalk.attribute.number()
                });

                var model = catwalk.createModel('team', {
                    name: 'Iceland',
                    colour: 'Blue'
                });

                expect(catwalk.collection('team').length).toEqual(1);
                catwalk.deleteModel('team', model);
                expect(catwalk.collection('team').length).toEqual(0);

            }));

            it('Should be able to reject the deletion of a model;', inject(function($rootScope, catwalk) {

                catwalk.collection('team', {
                    name:         catwalk.attribute.any(),
                    colour:       catwalk.attribute.string(),
                    worldCupWins: catwalk.attribute.number()
                });

                spyOn($rootScope, '$broadcast').and.callFake(function fake(name, deferred, model) {

                    expect(typeof model).toEqual('object');

                    deferred.reject();

                });

                catwalk.createModel('team', {
                    name: 'Iceland'
                });

                var model = catwalk.createModel('team', {
                    name: 'Iceland',
                    colour: 'Blue'
                });

                catwalk.deleteModel('team', model);

                $rootScope.$digest();

                expect($rootScope.$broadcast).toHaveBeenCalled();
                expect(catwalk.collection('team').length).toEqual(0);

            }));

        });

    });

});