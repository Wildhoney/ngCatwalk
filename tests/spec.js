describe('ngCatwalk', function() {

    var $rootScope, catwalk;

    beforeEach(module('ngCatwalk', 'ngCrossfilter'));

    beforeEach(function() {

        inject(function($injector) {
            $rootScope = $injector.get('$rootScope');
            spyOn($rootScope, '$broadcast');
        });

    });

    describe('Typecasting', function() {

        it('Should be able to provide default values;', inject(function(catwalk) {

            var stringAttribute = catwalk.attribute.string('Adam');
            expect(stringAttribute()).toEqual('Adam');
            expect(stringAttribute('Bob')).toEqual('Bob');
            expect(stringAttribute(null)).toBe(null);

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

        it('Should be able to create a model;', inject(function(catwalk) {

            catwalk.collection('team', {
                name:         catwalk.attribute.any(),
                colour:       catwalk.attribute.string('none'),
                worldCupWins: catwalk.attribute.number()
            });

            var model = catwalk.createModel('team', {
                name: 'Netherlands',
                worldCupWins: '0',
                manager: 'Louis van Gaal'
            });

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

        }));

    });

});