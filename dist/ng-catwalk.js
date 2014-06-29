( function ngCatwalk( $angular ) {
    "use strict";
    var app = $angular.module( 'ngCatwalk', [ 'ngCrossfilter' ] );
    var _throwException = function _throwException( message ) {
        throw "ngCatwalk: " + message + ".";
    };
    var ngCatwalkAttribute = {
        any: function any( defaultValue ) {
            return function ( value ) {
                if ( value === null ) {
                    return null;
                }
                return typeof value !== 'undefined' ? value : defaultValue;
            };
        },
        number: function number( defaultValue ) {
            return function ( value ) {
                if ( value === null ) {
                    return null;
                }
                return typeof value !== 'undefined' ? +value : defaultValue;
            };
        },
        string: function string( defaultValue ) {
            return function ( value ) {
                if ( value === null ) {
                    return null;
                }
                return typeof value !== 'undefined' ? String( value ) : defaultValue;
            };
        }
    };
    var ngCatwalkRelationship = {};
    app.service( 'catwalk', [ '$rootScope', '$q', '$interpolate', 'Crossfilter',
        function CatwalkService( $rootScope, $q, $interpolate, Crossfilter ) {
            function Catwalk() {}
            Catwalk.prototype = {
                attribute: ngCatwalkAttribute,
                relationship: ngCatwalkRelationship,
                _primaryName: '__catwalkId__',
                _primaryIndex: 0,
                _silent: false,
                _eventName: 'catwalk/{{type}}/{{collection}}',
                _collections: {},
                collection: function collection( name, properties ) {
                    if ( !this._collections[ name ] ) {
                        this._collections[ name ] = new Crossfilter( [] );
                    }
                    if ( properties ) {
                        properties[ this._primaryName ] = this.attribute.number();
                        this._collections[ name ].primaryKey( this._primaryName );
                        this._collections[ name ].blueprint = properties;
                        for ( var property in properties ) {
                            if ( properties.hasOwnProperty( property ) ) {
                                this._collections[ name ].addDimension( property );
                            }
                        }
                    }
                    return this._collections[ name ];
                },
                silently: function silently( processFunction ) {
                    this._silent = true;
                    processFunction.apply( this );
                    this._silent = false;
                },
                createModel: function createModel( collectionName, model ) {
                    model = this.cleanModel( collectionName, model );
                    this.collection( collectionName ).addModel( model );
                    var promise = this.createPromise( collectionName, 'create', [ model ] );
                    promise.catch( function andCatch() {} );
                    return model;
                },
                cleanModel: function cleanModel( collectionName, model ) {
                    var blueprint = this.collection( collectionName ).blueprint,
                        iterator = this._propertyIterator,
                        primaryKey = this._primaryName;
                    ( function removeProperties() {
                        iterator( model, function iterator( property ) {
                            if ( !blueprint.hasOwnProperty( property ) ) {
                                delete model[ property ];
                            }
                        } );
                    } )();
                    ( function addProperties() {
                        iterator( blueprint, function iterator( property ) {
                            if ( typeof model[ property ] !== 'undefined' || property === primaryKey ) {
                                return;
                            }
                            var typecast = blueprint[ property ];
                            model[ property ] = typecast( null );
                        } );
                    } )();
                    ( function typecastProperties() {
                        iterator( blueprint, function iterator( property ) {
                            if ( model[ property ] === null ) {
                                return;
                            }
                            var typecast = blueprint[ property ];
                            model[ property ] = typecast( model[ property ] );
                        } );
                    } )();
                    return model;
                },
                _propertyIterator: function _propertyIterator( model, iteratorFunction ) {
                    for ( var property in model ) {
                        if ( model.hasOwnProperty( property ) ) {
                            iteratorFunction( property );
                        }
                    }
                },
                revertCreateModel: function revertCreateModel( collectionName, model ) {},
                updateModel: function updateModel( collectionName, model, properties ) {},
                revertUpdateModel: function revertUpdateModel( collectionName, model, oldProperties ) {},
                deleteModel: function deleteModel( collectionName, model ) {},
                revertDeleteModel: function revertDeleteModel( collectionName, model ) {},
                createPromise: function createPromise( collectionName, type, args ) {
                    var deferred = $q.defer();
                    if ( !Array.isArray( args ) ) {
                        args = args ? [ args ] : [];
                    }
                    args.unshift( deferred );
                    var eventName = $interpolate( this._eventName )( {
                        type: type,
                        collection: collectionName
                    } );
                    $rootScope.$broadcast.call( this, eventName, args );
                    return deferred.promise;
                },
                createHasManyRelationship: function createHasManyRelationship( model, fromCollectionName, fromProperty, toCollectionName, toProperty, value ) {},
                createHasOneRelationship: function createHasOneRelationship( model, fromCollectionName, fromProperty, toCollectionName, toProperty, value ) {}
            };
            return new Catwalk();
        }
    ] );
} )( window.angular );
