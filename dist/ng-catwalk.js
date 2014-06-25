( function ngCatwalk( $angular ) {
    "use strict";
    var app = $angular.module( 'ngCatwalk', [ 'ngCrossfilter' ] );
    var _throwException = function _throwException( message ) {
        throw "ngCatwalk: " + message + ".";
    };
    var injector = $angular.injector( [ 'ngCatwalk', 'ng' ] ),
        $q = injector.get( '$q' );
    var ngCatwalkRelationship = {
        hasMany: function hasMany( options ) {
            return function HasManyRelationship( model, property, dependencies ) {
                var collection = this._collections[ options.collection ],
                    promises = {},
                    values = model[ property ] || [],
                    createModel = this.createModel.bind( this ),
                    $rootScope = dependencies.rootScope;
                var difference = function difference( desired, got ) {
                    var copy = [];
                    $angular.forEach( desired, function forEach( model ) {
                        copy.push( model );
                    } );
                    $angular.forEach( got, function forEach( model ) {
                        var property = model[ options.foreignKey ],
                            index = copy.indexOf( property );
                        copy.splice( index, 1 );
                    } );
                    return copy;
                };
                Object.defineProperty( model, property, {
                    get: function get() {
                        collection.filterBy( options.foreignKey, values, function inArray( expected, actual ) {
                            return expected.indexOf( actual ) !== -1;
                        } );
                        var models = collection._collection( Infinity );
                        collection.unfilterBy( options.foreignKey );
                        $angular.forEach( difference( values, models ), function required( value ) {
                            if ( typeof promises[ value ] !== 'undefined' ) {
                                return;
                            }
                            var deferred = promises[ value ] = $q.defer();
                            $rootScope.$broadcast( 'catwalk/read/' + options.collection, deferred, options.foreignKey, value );
                            deferred.promise.then( function then( model ) {
                                createModel( options.collection, model );
                            } );
                            deferred.promise.catch( function failure() {
                                var index = values.indexOf( value );
                                values.splice( index, 1 );
                            } );
                        } );
                        models._resolve = function _resolve( model ) {
                            if ( typeof model === 'object' ) {
                                return model[ property ]
                            }
                            return model;
                        };
                        models.addModel = function addModel( model ) {
                            values.push( models._resolve( model ) );
                        };
                        models.deleteModel = function deleteModel( model ) {
                            var index = values.indexOf( models._resolve( model ) );
                            values.splice( index, 1 );
                        };
                        models.hasModel = function hasModel( model ) {
                            return values.indexOf( models._resolve( model ) ) !== -1;
                        };
                        return models;
                    },
                    set: function set() {}
                } );
            };
        }
    };
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
    app.service( 'catwalk', [ '$rootScope', '$q', 'Crossfilter',
        function CatwalkService( $rootScope, $q, Crossfilter ) {
            function Catwalk() {}
            Catwalk.prototype = {
                _primaryName: '__catwalkId__',
                _primaryIndex: 0,
                _collections: {},
                attribute: ngCatwalkTypecast,
                relationship: ngCatwalkRelationship,
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
                createModel: function createModel( name, properties ) {
                    var model = this._prepareModel( name, properties );
                    model[ this._primaryName ] = ++this._primaryIndex;
                    this.collection( name ).addModel( model );
                    this._awaitFeedback( 'create', name, model, function failed() {
                        this._deleteModel( name, model );
                    } );
                },
                updateModel: function updateModel( name, model, properties ) {
                    var oldProperties = {};
                    for ( var index in properties ) {
                        if ( properties.hasOwnProperty( index ) ) {
                            oldProperties[ index ] = model[ index ];
                        }
                    }
                    this._updateModel( name, model, properties );
                    this._awaitFeedback( 'update', name, model, function failed() {
                        this._updateModel( name, model, oldProperties );
                    } );
                },
                _updateModel: function _updateModel( name, model, properties ) {
                    var blueprint = this._collections[ name ].blueprint;
                    for ( var index in properties ) {
                        if ( properties.hasOwnProperty( index ) ) {
                            var accessor = blueprint[ index ];
                            if ( this._isRelationship( accessor ) ) {
                                _throwException( "Cannot redefine a relationship" );
                            }
                            model[ index ] = accessor( properties[ index ] );
                        }
                    }
                },
                deleteModel: function deleteModel( name, model ) {
                    this._deleteModel( name, model );
                    this._awaitFeedback( 'delete', name, model, function failed() {
                        this.collection( name ).restoreModel( model );
                    } );
                },
                _deleteModel: function deleteModel( name, model ) {
                    this.collection( name ).deleteModel( model );
                },
                _isRelationship: function _isRelationship( accessor ) {
                    return accessor.toString().match( /(HasManyRelationship|HasOneRelationship)/i );
                },
                _prepareModel: function _prepareModel( name, model ) {
                    model = model || {};
                    var blueprint = this.collection( name ).blueprint;
                    for ( var property in blueprint ) {
                        if ( blueprint.hasOwnProperty( property ) ) {
                            if ( property === 'primaryKey' ) {
                                continue;
                            }
                            var accessor = blueprint[ property ];
                            if ( typeof model[ property ] === 'undefined' ) {
                                model[ property ] = undefined;
                            }
                            if ( this._isRelationship( accessor ) ) {
                                accessor.call( this, model, property, {
                                    rootScope: $rootScope
                                } );
                                continue;
                            }
                            model[ property ] = accessor( model[ property ] );
                        }
                    }
                    for ( var index in model ) {
                        if ( model.hasOwnProperty( index ) ) {
                            if ( typeof blueprint[ index ] === 'undefined' ) {
                                delete model[ index ];
                            }
                        }
                    }
                    return model;
                },
                _awaitFeedback: function _awaitFeedback( type, name, model, failedFunction ) {
                    var deferred = $q.defer();
                    $rootScope.$broadcast( 'catwalk/' + type + '/' + name, deferred, model );
                    deferred.promise.catch( function failed() {
                        failedFunction.apply( this );
                    }.bind( this ) );
                }
            };
            return new Catwalk();
        }
    ] );
} )( window.angular );
