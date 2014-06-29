describe('ngCatwalk', function() {

    var $rootScope, $catwalk;

    beforeEach(module('ngCatwalk', 'ngCrossfilter'));

    beforeEach(function() {

        inject(function($injector, catwalk) {

            catwalk.collection('team', {
                name: catwalk.attribute.generic(),
                colour: catwalk.attribute.string()
            });

            // Accessible by the tests themselves.
            $catwalk   = catwalk;
            $rootScope = $injector.get('$rootScope');
            spyOn($rootScope, '$broadcast');

        });

    });

    describe('Collection', function() {

        it('Should be able to define collections;', function() {
            expect(typeof $catwalk._collections.unknown).toEqual('undefined');
            expect(typeof $catwalk.collection('unknown')).toEqual('object');
            expect(typeof $catwalk._collections.team).toEqual('object');
            expect(typeof $catwalk.collection('team')).toEqual('object');
        });

        it('Should be able to create a model;', function() {

            var model = $catwalk.createModel('team', {
                name: 'Netherlands',
                manager: 'Louis van Gaal'
            });

            expect(model.name).toBe('Netherlands');
            expect(model.colour).toBe('');
            expect(model.manager).toBeUndefined();

        })

    });

});