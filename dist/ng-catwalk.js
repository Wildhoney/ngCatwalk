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
                    return defaultValue || null;
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
                _primaryName: '_catwalkId',
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
                        this._collections[ name ].index = 0;
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
                    promise.then( this.resolveCreateModel( collectionName, model ).bind( this ) );
                    promise.catch( this.rejectCreateModel( collectionName, model ).bind( this ) );
                    return model;
                },
                rejectCreateModel: function rejectCreateModel( collectionName, model ) {
                    return function rejectPromise() {
                        this.silently( function silentlyDelete() {
                            this.collection( collectionName ).deleteModel( model );
                        } );
                    };
                },
                resolveCreateModel: function resolveCreateModel( collectionName, model ) {
                    return function resolvePromise( properties ) {
                        var blueprint = this.collection( collectionName ).blueprint;
                        this._propertyIterator( properties, function iterator( property ) {
                            var typecast = blueprint[ property ];
                            if ( typeof typecast === 'undefined' ) {
                                return;
                            }
                            model[ property ] = typecast( properties[ property ] );
                        } );
                    };
                },
                updateModel: function updateModel( collectionName, model, properties ) {},
                resolveUpdateModel: function resolveUpdateModel( collectionName, model ) {},
                rejectUpdateModel: function rejectUpdateModel( collectionName, model, oldProperties ) {},
                deleteModel: function deleteModel( collectionName, model ) {
                    this.collection( collectionName ).deleteModel( model );
                    var promise = this.createPromise( collectionName, 'delete', [ model ] );
                    promise.then( this.resolveDeleteModel( collectionName, model ).bind( this ) );
                    promise.catch( this.rejectDeleteModel( collectionName, model ).bind( this ) );
                    return model;
                },
                resolveDeleteModel: function resolveDeleteModel( collectionName, model ) {
                    return function resolvePromise() {};
                },
                rejectDeleteModel: function rejectDeleteModel( collectionName, model ) {
                    return function rejectPromise() {};
                },
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
                    $rootScope.$broadcast( eventName, args[ 0 ], args[ 1 ], args[ 2 ] );
                    return deferred.promise;
                },
                createHasManyRelationship: function createHasManyRelationship( model, fromCollectionName, fromProperty, toCollectionName, toProperty, value ) {},
                createHasOneRelationship: function createHasOneRelationship( model, fromCollectionName, fromProperty, toCollectionName, toProperty, value ) {},
                cleanModel: function cleanModel( collectionName, model ) {
                    var blueprint = this.collection( collectionName ).blueprint,
                        iterator = this._propertyIterator,
                        primaryKey = this._primaryName;
                    model[ primaryKey ] = ++this.collection( collectionName ).index;
                    ( function removeProperties() {
                        iterator( model, function iterator( property ) {
                            if ( !blueprint.hasOwnProperty( property ) ) {
                                delete model[ property ];
                            }
                        } );
                    } )();
                    ( function addAndTypecastProperties() {
                        iterator( blueprint, function iterator( property ) {
                            var typecast = blueprint[ property ];
                            if ( typeof model[ property ] === 'undefined' && property !== primaryKey ) {
                                model[ property ] = null;
                            }
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
                }
            };
            return new Catwalk();
        }
    ] );
} )( window.angular );
