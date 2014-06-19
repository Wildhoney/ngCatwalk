( function ngCatwalk( $angular, $catwalk ) {
    "use strict";
    var app = $angular.module( 'ngCatwalk', [] );
    app.service( 'catwalk', [ '$window', '$rootScope',
        function catwalkService( $window, $rootScope ) {
            $angular.forEach( [ 'create', 'read', 'update', 'delete' ], function forEach( operation ) {
                $catwalk.event.on( operation, function ( collectionName ) {
                    var eventName = 'catwalk/' + operation + '/' + collectionName;
                    $rootScope.$broadcast( eventName, arguments[ 0 ], arguments[ 1 ], arguments[ 2 ] );
                } );
            } );
            $catwalk.updated( function ( collections ) {
                $rootScope.$apply( function () {
                    for ( var name in collections ) {
                        if ( collections.hasOwnProperty( name ) ) {
                            $angular.copy( collections[ name ].all(), catwalk.collections[ name ] );
                        }
                    }
                } );
            } );
            var Catwalk = function Catwalk() {};
            Catwalk.prototype = $catwalk;
            var catwalk = new Catwalk();
            catwalk.collections = {};
            catwalk.collection = function collection( name, blueprint ) {
                if ( !catwalk.collections[ name ] ) {
                    catwalk.collections[ name ] = [];
                }
                if ( blueprint ) {
                    return catwalk.__proto__.collection( name, blueprint );
                }
                return catwalk.collections[ name ];
            };
            catwalk.createModel = function createModel( name, properties ) {
                catwalk.using( name ).createModel( properties );
            };
            catwalk.updateModel = function updateModel( name, model, properties ) {
                catwalk.using( name ).updateModel( model, properties );
            };
            catwalk.deleteModel = function deleteModel( name, model ) {
                catwalk.using( name ).deleteModel( model );
            };
            catwalk.using = function using( name ) {
                return $catwalk.collection( name );
            };
            return catwalk;
        }
    ] );
} )( window.angular, window.catwalk );
