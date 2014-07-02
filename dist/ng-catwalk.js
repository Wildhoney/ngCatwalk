( function ngCatwalk( $angular, _, $object ) {
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
                this._collections = {};
                this._relationships = {};
                this._relationshipStore = {};
            }
            Catwalk.prototype = {
                _collections: {},
                _primaryName: '_catwalkId',
                _relationshipStore: {},
                _relationships: {},
                _silent: false,
                _eventName: 'catwalk/{{type}}/{{collection}}',
                _relationshipName: '{{localCollection}}/{{localProperty}}/{{foreignCollection}}/{{foreignProperty}}',
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
                    if ( !this._collections[ name ] ) {
                        this._collections[ name ] = new Crossfilter( [], this._primaryName );
                    }
                    if ( properties ) {
                        properties[ this._primaryName ] = this.attribute.number();
                        this._collections[ name ].blueprint = properties;
                        this._collections[ name ].index = 0;
                        this._collections[ name ].name = name;
                        this._propertyIterator( properties, function iterator( property ) {
                            this._collections[ name ].addDimension( property );
                        } );
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
                updateModel: function updateModel( collectionName, oldModel, properties ) {
                    var blueprint = this.collection( collectionName ).blueprint,
                        updatedProperties = {};
                    this._propertyIterator( properties, function iterator( property ) {
                        if ( this.getRelationshipType( collectionName, property ) ) {
                            return;
                        }
                        if ( !$angular.isDefined( blueprint[ property ] ) ) {
                            return;
                        }
                        updatedProperties[ property ] = properties[ property ];
                    } );
                    var newModel = _.extend( _.clone( oldModel ), updatedProperties );
                    newModel[ this._primaryName ] = ++this.collection( collectionName ).index;
                    this.silently( function silently() {
                        this.deleteModel( collectionName, oldModel );
                        this.createModel( collectionName, newModel );
                    } );
                    var promise = this.createPromise( collectionName, 'update', [ newModel, oldModel ] );
                    promise.then( this.resolveUpdateModel( collectionName, oldModel, newModel ).bind( this ) );
                    promise.catch( this.rejectUpdateModel( collectionName, oldModel, newModel ).bind( this ) );
                    return newModel;
                },
                resolveUpdateModel: function resolveUpdateModel( collectionName, oldModel, newModel ) {
                    return function resolvePromise() {
                        this.pruneRelationships( collectionName, newModel );
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
                    this.collection( collectionName ).deleteModel( model );
                    var promise = this.createPromise( collectionName, 'delete', [ model ] );
                    promise.then( this.resolveDeleteModel( collectionName, model ).bind( this ) );
                    promise.catch( this.rejectDeleteModel( collectionName, model ).bind( this ) );
                    return model;
                },
                resolveDeleteModel: function resolveDeleteModel( collectionName, model ) {
                    return function resolvePromise() {
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
                createPromise: function createPromise( collectionName, type, args ) {
                    var deferred = $q.defer();
                    if ( !_.isArray( args ) ) {
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
                    case ( ngCatwalkRelationship.TYPES.ONE ):
                        method = 'createHasOneRelationship';
                        break;
                    case ( ngCatwalkRelationship.TYPES.MANY ):
                        method = 'createHasManyRelationship';
                        break;
                    }
                    this[ method ]( collectionName, model, property, foreignCollection, options.foreignKey );
                },
                pruneRelationships: function pruneRelationships( modifiedCollectionName, model ) {
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
                            case ( ngCatwalkRelationship.TYPES.ONE ):
                                models[ index ][ relationshipData.localProperty ] = '';
                                break;
                            case ( ngCatwalkRelationship.TYPES.MANY ):
                                models[ index ][ relationshipData.localProperty ].remove( valueToDelete );
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
                        store = this._relationshipStore,
                        createPromise = this.createPromise.bind( this );
                    store[ collectionName ][ internalId ][ property ] = model[ property ] || '';
                    $object.defineProperty( model, property, {
                        get: function get() {
                            var entry = store[ collectionName ][ internalId ][ property ];
                            foreignCollection.filterBy( foreignKey, entry );
                            var foreignModel = foreignCollection.collection()[ 0 ];
                            if ( entry.length && foreignCollection.length === 0 ) {
                                createPromise( foreignCollection.name, 'read', [ foreignKey, entry ] );
                            }
                            foreignCollection.unfilterBy( foreignKey );
                            return foreignModel || {};
                        },
                        set: function set( value ) {
                            store[ collectionName ][ internalId ][ property ] = value;
                        }
                    } );
                },
                createHasManyRelationship: function createHasManyRelationship( collectionName, model, property, foreignCollection, foreignKey ) {
                    var internalId = model[ this._primaryName ],
                        store = this._relationshipStore,
                        createPromise = this.createPromise.bind( this );
                    store[ collectionName ][ internalId ][ property ] = model[ property ] || [];
                    var entry = store[ collectionName ][ internalId ][ property ];
                    var inArray = function inArray( expected, actual ) {
                        return expected.indexOf( actual ) !== -1;
                    };
                    $object.defineProperty( model, property, {
                        get: function get() {
                            foreignCollection.filterBy( foreignKey, entry, inArray );
                            var foreignModels = foreignCollection.collection( Infinity );
                            if ( entry.length && foreignModels.length !== entry.length ) {
                                var values = _.pluck( foreignModels, foreignKey ),
                                    difference = _.difference( entry, values );
                                if ( values.length !== 0 ) {
                                    for ( var index = 0; index < difference.length; index++ ) {
                                        createPromise( foreignCollection.name, 'read', [ foreignKey, difference[ index ] ] );
                                    }
                                }
                            }
                            foreignCollection.unfilterBy( foreignKey );
                            foreignModels.add = function add( value ) {
                                if ( !foreignModels.has( value ) ) {
                                    entry.push( value );
                                }
                            };
                            foreignModels.remove = function remove( value ) {
                                var index = entry.indexOf( value );
                                if ( index !== -1 ) {
                                    entry.splice( index, 1 );
                                }
                            };
                            foreignModels.clear = function clear() {
                                entry = [];
                            };
                            foreignModels.has = function has( value ) {
                                return entry.indexOf( value ) !== -1;
                            };
                            return foreignModels || [];
                        },
                        set: function set( value ) {
                            if ( entry.indexOf( value ) === -1 ) {
                                entry.push( value );
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
} )( window.angular, window._, window.Object );
