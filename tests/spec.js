describe('ngCatwalk', function() {

    var $rootScope, $catwalk;

    beforeEach(module('ngCatwalk', 'ngCrossfilter'));

    beforeEach(function() {

        inject(function($injector, catwalk) {

            catwalk.collection('team', {
                name: catwalk.attribute.generic()
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

    });

});