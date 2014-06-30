( function ngCatwalk( $angular, $object ) {
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
            return function () {
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
                this._collections = {};
                this._relationships = {};
                this._relationshipStore = {};
            }
            Catwalk.prototype = {
                attribute: ngCatwalkAttribute,
                relationship: {
                    hasOne: function hasOne( options ) {
                        return new ngCatwalkRelationship.One( options );
                    },
                    hasMany: function hasMany( options ) {
                        return new ngCatwalkRelationship.Many( options );
                    }
                },
                _primaryName: '_catwalkId',
                _relationshipStore: {},
                _relationships: {},
                _silent: false,
                _eventName: 'catwalk/{{type}}/{{collection}}',
                _relationshipName: '{{localCollection}}/{{localProperty}}/{{foreignCollection}}/{{foreignProperty}}',
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
                            if ( !$angular.isDefined( typecast ) ) {
                                return;
                            }
                            model[ property ] = typecast( properties[ property ] );
                        } );
                    };
                },
                deleteModel: function deleteModel( collectionName, model ) {
                    this.collection( collectionName ).deleteModel( model );
                    var promise = this.createPromise( collectionName, 'delete', [ model ] );
                    promise.catch( this.rejectDeleteModel( collectionName, model ).bind( this ) );
                    this.flushRelationships( collectionName, model );
                    return model;
                },
                rejectDeleteModel: function rejectDeleteModel( collectionName, model ) {
                    return function rejectPromise() {
                        this.silently( function silentlyRestore() {
                            this.collection( collectionName ).restoreModel( model );
                        } );
                    };
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
                createRelationship: function createRelationship( collectionName, model, property ) {
                    var localCollection = this.collection( collectionName ),
                        blueprint = localCollection.blueprint[ property ],
                        options = blueprint.getOptions(),
                        foreignCollection = this.collection( options.collection ),
                        store = this._relationshipStore,
                        internalId = model[ this._primaryName ];
                    ( function storeRelationshipData() {
                        var record = {
                            localCollection: collectionName,
                            localProperty: property,
                            foreignCollection: options.collection,
                            foreignProperty: options.foreignKey
                        };
                        var key = $interpolate( this._relationshipName )( record );
                        this._relationships[ key ] = record;
                    }.bind( this ) )();
                    ( function recursivelyCreateRelationshipStore() {
                        if ( !$angular.isDefined( store[ collectionName ] ) ) {
                            store[ collectionName ] = {};
                        }
                        if ( !$angular.isDefined( store[ collectionName ][ internalId ] ) ) {
                            store[ collectionName ][ internalId ] = {};
                        }
                    } )();
                    var method = 'throwRelationshipException';
                    switch ( this.getRelationshipType( collectionName, property ) ) {
                    case ( 'One' ):
                        method = 'createHasOneRelationship';
                        break;
                    case ( 'Many' ):
                        method = 'createHasManyRelationship';
                        break;
                    }
                    this[ method ]( collectionName, model, property, foreignCollection, options.foreignKey );
                },
                flushRelationships: function flushRelationships( modifiedCollectionName, model ) {
                    this._propertyIterator( this._relationships, function iterator( property ) {
                        var relationshipData = this._relationships[ property ];
                        if ( relationshipData.foreignCollection !== modifiedCollectionName ) {
                            return;
                        }
                        var valueToDelete = model[ relationshipData.foreignProperty ],
                            models = this.collection( relationshipData.localCollection ),
                            relationshipType = this.getRelationshipType( relationshipData.localCollection, relationshipData.localProperty );
                        for ( var index = 0; index < models.length; index++ ) {
                            switch ( relationshipType ) {
                            case ( 'Many' ):
                                models[ index ][ relationshipData.localProperty ].remove( valueToDelete );
                                break;
                            case ( 'One' ):
                                models[ index ][ relationshipData.localProperty ] = '';
                                break;
                            }
                        }
                    } );
                },
                throwRelationshipException: function throwRelationshipException() {
                    throwException( "Congratulations! You managed to create an invalid relationship" );
                },
                createHasOneRelationship: function createHasOneRelationship( collectionName, model, property, foreignCollection, foreignKey ) {
                    var internalId = model[ this._primaryName ],
                        store = this._relationshipStore;
                    store[ collectionName ][ internalId ][ property ] = model[ property ] || '';
                    $object.defineProperty( model, property, {
                        get: function get() {
                            foreignCollection.filterBy( foreignKey, store[ collectionName ][ internalId ][ property ] );
                            var foreignModel = foreignCollection[ 0 ];
                            foreignCollection.unfilterAll();
                            return foreignModel || "Adam";
                        },
                        set: function set( value ) {
                            store[ collectionName ][ internalId ][ property ] = value;
                        }
                    } );
                },
                createHasManyRelationship: function createHasManyRelationship( collectionName, model, property, foreignCollection, foreignKey ) {
                    var internalId = model[ this._primaryName ],
                        store = this._relationshipStore;
                    store[ collectionName ][ internalId ][ property ] = model[ property ] || [];
                    var inArray = function inArray( expected, actual ) {
                        return expected.indexOf( actual ) !== -1;
                    };
                    $object.defineProperty( model, property, {
                        get: function get() {
                            foreignCollection.filterBy( foreignKey, store[ collectionName ][ internalId ][ property ], inArray );
                            var foreignModels = foreignCollection.collection( Infinity );
                            foreignCollection.unfilterAll();
                            foreignModels.add = function add( value ) {
                                if ( !foreignModels.has( value ) ) {
                                    store[ collectionName ][ internalId ][ property ].push( value );
                                }
                            };
                            foreignModels.remove = function remove( value ) {
                                var index = store[ collectionName ][ internalId ][ property ].indexOf( value );
                                if ( index !== -1 ) {
                                    store[ collectionName ][ internalId ][ property ].splice( index, 1 );
                                }
                            };
                            foreignModels.clear = function clear() {
                                store[ collectionName ][ internalId ][ property ] = [];
                            };
                            foreignModels.has = function has( value ) {
                                return store[ collectionName ][ internalId ][ property ].indexOf( value ) !== -1;
                            };
                            return foreignModels;
                        },
                        set: function set( value ) {
                            if ( store[ collectionName ][ internalId ][ property ].indexOf( value ) === -1 ) {
                                store[ collectionName ][ internalId ][ property ].push( value );
                            }
                        }
                    } );
                },
                cleanModel: function cleanModel( collectionName, model ) {
                    var primaryKey = this._primaryName,
                        blueprint = this.collection( collectionName ).blueprint,
                        iterator = this._propertyIterator,
                        getRelationshipType = this.getRelationshipType.bind( this ),
                        createRelationship = this.createRelationship.bind( this );
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
                            if ( !getRelationshipType( collectionName, property ) ) {
                                var typecast = blueprint[ property ];
                                model[ property ] = typecast( model[ property ] );
                                return;
                            }
                            createRelationship( collectionName, model, property );
                        } );
                    } )();
                    return model;
                },
                getRelationshipType: function getRelationshipType( collectionName, property ) {
                    var propertyBlueprint = this.collection( collectionName ).blueprint[ property ],
                        relationships = {
                            One: ngCatwalkRelationship.One,
                            Many: ngCatwalkRelationship.Many
                        };
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
} )( window.angular, window.Object );
