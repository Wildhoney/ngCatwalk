( function ngCatwalk( $angular, _ ) {
    "use strict";
    var app = $angular.module( 'ngCatwalk', [ 'ngCrossfilter' ] );
    var throwException = function throwException( message ) {
        throw "ngCatwalk: " + message + ".";
    };
    var ngCatwalkAttribute = {
        any: function any( defaultValue ) {
            return function ( value ) {
                if ( value === null ) {
                    return null;
                }
                return $angular.isDefined( value ) ? value : defaultValue;
            };
        },
        autoIncrement: function autoIncrement() {
            var index = 0;
            return function ( value ) {
                if ( value !== null ) {
                    return value;
                }
                return ++index;
            }
        },
        custom: function custom( customFunction ) {
            return function ( value ) {
                return customFunction( value );
            };
        },
        number: function number( defaultValue ) {
            return function ( value ) {
                if ( value === null ) {
                    return null;
                }
                return $angular.isDefined( value ) ? +value : defaultValue;
            };
        },
        string: function string( defaultValue ) {
            return function ( value ) {
                if ( value === null ) {
                    return defaultValue || null;
                }
                return $angular.isDefined( value ) ? String( value ) : defaultValue;
            };
        }
    };
    var ngCatwalkRelationship = {
        TYPES: {
            ONE: 'One',
            MANY: 'Many'
        },
        One: function One( options ) {
            this.getOptions = function getOptions() {
                return options;
            }
        },
        Many: function Many( options ) {
            this.getOptions = function getOptions() {
                return options;
            }
        }
    };
    app.service( 'catwalk', [ '$rootScope', '$q', '$interpolate', 'Crossfilter',
        function CatwalkService( $rootScope, $q, $interpolate, Crossfilter ) {
            function Catwalk() {
                this.collections = {};
                this.relationships = {};
                this.relationshipStore = {};
                this.deferStore = {};
            }
            Catwalk.prototype = {
                mode: 'instant',
                collections: {},
                primaryName: '_catwalkId',
                silent: false,
                eventName: 'catwalk/{{type}}/{{collection}}',
                attribute: ngCatwalkAttribute,
                relationship: {
                    hasOne: function hasOne( options ) {
                        return new ngCatwalkRelationship[ ngCatwalkRelationship.TYPES.ONE ]( options );
                    },
                    hasMany: function hasMany( options ) {
                        return new ngCatwalkRelationship[ ngCatwalkRelationship.TYPES.MANY ]( options );
                    }
                },
                collection: function collection( name, properties ) {
                    if ( !this.collections[ name ] ) {
                        this.collections[ name ] = new Crossfilter( [], this.primaryName );
                    }
                    if ( properties ) {
                        properties[ this.primaryName ] = this.attribute.number();
                        this.collections[ name ].blueprint = properties;
                        this.collections[ name ].index = 0;
                        this.collections[ name ].name = name;
                        this._propertyIterator( properties, function iterator( property ) {
                            this.collections[ name ].addDimension( property );
                        } );
                    }
                    return this.collections[ name ];
                },
                setMode: function setMode( mode ) {
                    this.mode = mode;
                },
                silently: function silently( processFunction ) {
                    this.silent = true;
                    processFunction.apply( this );
                    this.silent = false;
                },
                createModel: function createModel( collectionName, model ) {
                    model = this.cleanModel( collectionName, model );
                    var simpleModel = this.simplifyModel( collectionName, model ),
                        promise = this.createPromise( collectionName, 'create', [ simpleModel ] );
                    promise.then( this.resolveCreateModel( collectionName, model ).bind( this ) );
                    promise.catch( this.rejectCreateModel( collectionName, model ).bind( this ) );
                    return model;
                },
                resolveCreateModel: function resolveCreateModel( collectionName, model ) {
                    return function resolvePromise( properties ) {
                        var blueprint = this.collection( collectionName ).blueprint;
                        this._propertyIterator( properties, function iterator( property ) {
                            var typecast = blueprint[ property ];
                            if ( !$angular.isDefined( typecast ) ) {
                                return;
                            }
                            model[ property ] = typecast( properties[ property ] );
                        } );
                        this.collection( collectionName ).addModel( model );
                    };
                },
                rejectCreateModel: function rejectCreateModel( collectionName, model ) {
                    return function rejectPromise() {
                        this.silently( function silentlyDelete() {
                            this.collection( collectionName ).deleteModel( model );
                        } );
                    };
                },
                updateModel: function updateModel( collectionName, model, properties ) {
                    var newModel = _.extend( _.clone( model ), properties ),
                        newSimpleModel = this.simplifyModel( collectionName, newModel ),
                        promise = this.createPromise( collectionName, 'update', [ newSimpleModel ] );
                    promise.catch( this.rejectUpdateModel( collectionName, model, newModel ).bind( this ) );
                    promise.then( this.resolveUpdateModel( collectionName, newModel, model, properties ).bind( this ) );
                    return model;
                },
                resolveUpdateModel: function resolveUpdateModel( collectionName, newModel, oldModel, updatedProperties ) {
                    return function resolvePromise() {
                        this.silently( function silently() {
                            this.createModel( collectionName, newModel );
                            this.deleteModel( collectionName, oldModel );
                        } );
                        this.pruneRelationships( collectionName, updatedProperties );
                    }
                },
                resolveReadModel: function resolveReadModel( collectionName ) {
                    return function resolvePromise( model ) {
                        this.silently( function silently() {
                            this.createModel( collectionName, model );
                        } )
                    }
                },
                rejectUpdateModel: function rejectUpdateModel( collectionName, oldModel, newModel ) {
                    return function rejectPromise() {
                        this.silently( function silently() {
                            this.collection( collectionName ).restoreModel( oldModel );
                            this.deleteModel( collectionName, newModel );
                        } );
                    };
                },
                deleteModel: function deleteModel( collectionName, model ) {
                    var simpleModel = this.simplifyModel( collectionName, model ),
                        promise = this.createPromise( collectionName, 'delete', [ simpleModel ] );
                    promise.then( this.resolveDeleteModel( collectionName, model ).bind( this ) );
                    promise.catch( this.rejectDeleteModel( collectionName, model ).bind( this ) );
                    return model;
                },
                resolveDeleteModel: function resolveDeleteModel( collectionName, model ) {
                    return function resolvePromise() {
                        this.collection( collectionName ).deleteModel( model );
                        this.pruneRelationships( collectionName, model );
                    };
                },
                rejectDeleteModel: function rejectDeleteModel( collectionName, model ) {
                    return function rejectPromise() {
                        this.silently( function silentlyRestore() {
                            this.collection( collectionName ).restoreModel( model );
                        } );
                    };
                },
                simplifyModel: function simplifyModel( collectionName, model ) {
                    var simpleModel = _.clone( model );
                    delete simpleModel[ this.primaryName ];
                    delete simpleModel.$$hashKey;
                    return simpleModel;
                },
                createPromise: function createPromise( collectionName, type, args ) {
                    var deferred = $q.defer();
                    if ( this.silent ) {
                        deferred.resolve();
                        return deferred.promise;
                    }
                    if ( !_.isArray( args ) ) {
                        args = args ? [ args ] : [];
                    }
                    args.unshift( deferred );
                    var eventName = $interpolate( this.eventName )( {
                        type: type,
                        collection: collectionName
                    } );
                    $rootScope.$broadcast( eventName, args[ 0 ], args[ 1 ], args[ 2 ] );
                    return deferred.promise;
                },
                throwRelationshipException: function throwRelationshipException() {
                    throwException( "Congratulations! You managed to create an invalid relationship" );
                },
                cleanModel: function cleanModel( collectionName, model ) {
                    var primaryKey = this.primaryName,
                        blueprint = this.collection( collectionName ).blueprint,
                        iterator = this._propertyIterator,
                        relationshipType = this.relationshipType.bind( this );
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
                            if ( !$angular.isDefined( model[ property ] ) && property !== primaryKey ) {
                                model[ property ] = null;
                            }
                            if ( !relationshipType( collectionName, property ) ) {
                                var typecast = blueprint[ property ];
                                model[ property ] = typecast( model[ property ] );
                                return;
                            }
                        } );
                    } )();
                    return model;
                },
                relationshipType: function relationshipType( collectionName, property ) {
                    var propertyBlueprint = this.collection( collectionName ).blueprint[ property ],
                        relationships = {};
                    relationships[ ngCatwalkRelationship.TYPES.ONE ] = ngCatwalkRelationship.One;
                    relationships[ ngCatwalkRelationship.TYPES.MANY ] = ngCatwalkRelationship.Many;
                    for ( var index in relationships ) {
                        if ( relationships.hasOwnProperty( index ) ) {
                            if ( propertyBlueprint instanceof relationships[ index ] ) {
                                return index;
                            }
                        }
                    }
                    return null;
                },
                _propertyIterator: function _propertyIterator( model, iteratorFunction ) {
                    for ( var property in model ) {
                        if ( model.hasOwnProperty( property ) ) {
                            iteratorFunction.call( this, property );
                        }
                    }
                }
            };
            return new Catwalk();
        }
    ] );
} )( window.angular, window._ );
