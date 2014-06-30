describe('ngCatwalk', function() {

    beforeEach(module('ngCatwalk', 'ngCrossfilter'));

    describe('Typecasting', function() {

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

                spyOn($rootScope, '$broadcast').and.callFake(function fake(name, deferred) {
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

        })

    });

});