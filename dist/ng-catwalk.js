( function ngCatwalk( $angular ) {
    "use strict";
    var app = $angular.module( 'ngCatwalk', [ 'ngCrossfilter' ] );
    var ngCatwalkTypecast = {
        string: function ( defaultValue ) {
            return function toString( value ) {
                return typeof value === 'undefined' ? this._default( defaultValue, '' ) : String( value );
            }.bind( this )
        },
        autoincrement: function () {
            var value = 0;
            return function toAutoincrement() {
                return ++value;
            }.bind( this )
        },
        number: function ( defaultValue ) {
            return function toNumber( value ) {
                return typeof value === 'undefined' ? this._default( defaultValue, 0 ) : Number( value );
            }.bind( this )
        },
        _default: function _default( defaultValue, fallbackValue ) {
            return typeof defaultValue === 'undefined' ? fallbackValue : defaultValue;
        }
    };
    app.service( 'catwalk', [ '$rootScope', 'Crossfilter',
        function CatwalkService( $rootScope, Crossfilter ) {
            function Catwalk() {}
            Catwalk.prototype = {
                _collections: {},
                attribute: ngCatwalkTypecast,
                collection: function collection( name, properties ) {
                    if ( !this._collections[ name ] ) {
                        this._collections[ name ] = new Crossfilter( [] );
                    }
                    if ( properties ) {
                        this._collections[ name ].primaryKey( properties._primaryKey );
                        this._collections[ name ].blueprint = properties;
                        for ( var property in properties ) {
                            if ( properties.hasOwnProperty( property ) ) {
                                this._collections[ name ].addDimension( property );
                            }
                        }
                    }
                    return this._collections[ name ];
                },
                createModel: function createModel( name, properties ) {
                    var model = this._prepareModel( name, properties );
                    this.collection( name ).addModel( model );
                },
                _prepareModel: function _prepareModel( name, model ) {
                    model = model || {};
                    var blueprint = this.collection( name ).blueprint;
                    for ( var property in blueprint ) {
                        if ( blueprint.hasOwnProperty( property ) ) {
                            if ( property.charAt( 0 ) === '_' ) {
                                continue;
                            }
                            var typecast = blueprint[ property ];
                            if ( typeof model[ property ] === 'undefined' ) {
                                model[ property ] = undefined;
                            }
                            model[ property ] = typecast( model[ property ] );
                        }
                    }
                    return model;
                }
            };
            return new Catwalk();
        }
    ] );
} )( window.angular );
