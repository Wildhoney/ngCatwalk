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
                relationshipStore: {},
                deferStore: {},
                relationships: {},
                silent: false,
                eventName: 'catwalk/{{type}}/{{collection}}',
                deferName: 'catwalk/defer/{{collection}}/{{property}}/{{value}}',
                relationshipName: '{{localCollection}}/{{localProperty}}/{{foreignCollection}}/{{foreignProperty}}',
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
                        newSimpleModel = this.simplifyModel( collectionName, newModel );
                    console.log( JSON.stringify( newSimpleModel ) );
                    var promise = this.createPromise( collectionName, 'update', [ newSimpleModel ] );
                    promise.catch( this.rejectUpdateModel( collectionName, model, newModel ).bind( this ) );
                    promise.then( this.resolveUpdateModel( collectionName, newModel, model, properties ).bind( this ) );
                    return model;
                },
                resolveUpdateModel: function resolveUpdateModel( collectionName, newModel, oldModel, updatedProperties ) {
                    return function resolvePromise() {
                        var internalId = oldModel[ this.primaryName ];
                        this._propertyIterator( newModel, function iterator( property ) {
                            if ( this.relationshipType( collectionName, property ) ) {
                                newModel[ property ] = this.relationshipStore[ collectionName ][ internalId ][ property ];
                            }
                        } );
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
                    var simpleModel = _.clone( model ),
                        internalId = simpleModel[ this.primaryName ];
                    delete simpleModel[ this.primaryName ];
                    delete simpleModel.$$hashKey;
                    this._propertyIterator( simpleModel, function iterator( property ) {
                        if ( !this.relationshipType( collectionName, property ) ) {
                            return;
                        }
                        var attribute = simpleModel[ property ];
                        simpleModel[ property ] = this.relationshipStore[ collectionName ][ internalId ][ property ];
                        switch ( this.relationshipType( collectionName, property ) ) {
                        case ( ngCatwalkRelationship.TYPES.MANY ):
                            if ( attribute[ 0 ] ) {
                                _.forEach( attribute, function forEach( currentModel, index ) {
                                    if ( currentModel[ this.primaryName ] === model[ this.primaryName ] ) {
                                        simpleModel[ property ].splice( index, 1 );
                                    }
                                }.bind( this ) );
                            }
                            break;
                        }
                    } );
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
                createRelationship: function createRelationship( collectionName, model, property ) {
                    var localCollection = this.collection( collectionName ),
                        blueprint = localCollection.blueprint[ property ],
                        options = blueprint.getOptions(),
                        foreignCollection = this.collection( options.collection ),
                        store = this.relationshipStore,
                        internalId = model[ this.primaryName ];
                    ( function storeRelationshipData() {
                        var record = {
                            localCollection: collectionName,
                            localProperty: property,
                            foreignCollection: options.collection,
                            foreignProperty: options.foreignKey
                        };
                        var key = $interpolate( this.relationshipName )( record );
                        this.relationships[ key ] = record;
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
                    switch ( this.relationshipType( collectionName, property ) ) {
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
                    this._propertyIterator( this.relationships, function iterator( property ) {
                        var relationshipData = this.relationships[ property ];
                        if ( relationshipData.foreignCollection !== modifiedCollectionName ) {
                            return;
                        }
                        var valueToDelete = model[ relationshipData.foreignProperty ],
                            models = this.collection( relationshipData.localCollection ).collection(),
                            relationshipType = this.relationshipType( relationshipData.localCollection, relationshipData.localProperty );
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
                    var internalId = model[ this.primaryName ],
                        store = this.relationshipStore,
                        createPromise = this.createPromise.bind( this );
                    store[ collectionName ][ internalId ][ property ] = model[ property ] || '';
                    $object.defineProperty( model, property, {
                        get: function get() {
                            var entry = store[ collectionName ][ internalId ][ property ];
                            foreignCollection.filterBy( foreignKey, entry );
                            var foreignModel = foreignCollection.collection()[ 0 ];
                            if ( entry.length && foreignCollection.length === 0 ) {
                                var name = $interpolate( this.deferName )( {
                                    collection: foreignCollection.name,
                                    property: foreignKey,
                                    value: entry
                                } );
                                if ( !this.deferStore[ name ] ) {
                                    this.deferStore[ name ] = true;
                                    var promise = createPromise( foreignCollection.name, 'read', [ foreignKey, entry ] );
                                    if ( !this.silent ) {
                                        promise.then( this.resolveReadModel( foreignCollection.name ).bind( this ) );
                                    }
                                }
                            }
                            foreignCollection.unfilterBy( foreignKey );
                            return foreignModel || {};
                        }.bind( this ),
                        set: function set( value ) {
                            store[ collectionName ][ internalId ][ property ] = value;
                        }
                    } );
                },
                createHasManyRelationship: function createHasManyRelationship( collectionName, model, property, foreignCollection, foreignKey ) {
                    var internalId = model[ this.primaryName ],
                        store = this.relationshipStore,
                        createPromise = this.createPromise.bind( this );
                    store[ collectionName ][ internalId ][ property ] = model[ property ] || [];
                    var entry = store[ collectionName ][ internalId ][ property ];
                    var inArray = function inArray( expected, actual ) {
                        return expected.indexOf( actual ) !== -1;
                    };
                    $object.defineProperty( model, property, {
                        get: function get() {
                            foreignCollection.filterBy( foreignKey, entry, inArray );
                            var foreignModels = foreignCollection.collection();
                            if ( entry.length && foreignModels.length !== entry.length ) {
                                var difference = entry,
                                    values = [ 'ok' ];
                                if ( foreignModels && foreignModels.length ) {
                                    values = _.pluck( foreignModels, foreignKey );
                                    difference = _.difference( entry, values );
                                }
                                if ( values.length !== 0 ) {
                                    for ( var index = 0; index < difference.length; index++ ) {
                                        var name = $interpolate( this.deferName )( {
                                            collection: foreignCollection.name,
                                            property: foreignKey,
                                            value: difference[ index ]
                                        } );
                                        if ( this.deferStore[ name ] ) {
                                            continue;
                                        }
                                        this.deferStore[ name ] = true;
                                        var promise = createPromise( foreignCollection.name, 'read', [ foreignKey, difference[ index ] ] );
                                        if ( !this.silent ) {
                                            promise.then( this.resolveReadModel( foreignCollection.name ).bind( this ) );
                                        }
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
                        }.bind( this ),
                        set: function set( value ) {
                            if ( entry.indexOf( value ) === -1 ) {
                                entry.push( value );
                            }
                        }
                    } );
                },
                cleanModel: function cleanModel( collectionName, model ) {
                    var primaryKey = this.primaryName,
                        blueprint = this.collection( collectionName ).blueprint,
                        iterator = this._propertyIterator,
                        relationshipType = this.relationshipType.bind( this ),
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
                            if ( !relationshipType( collectionName, property ) ) {
                                var typecast = blueprint[ property ];
                                model[ property ] = typecast( model[ property ] );
                                return;
                            }
                            createRelationship( collectionName, model, property );
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
} )( window.angular, window._, window.Object );
