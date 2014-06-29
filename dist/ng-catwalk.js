( function ngCatwalk( $angular ) {
    "use strict";
    var app = $angular.module( 'ngCatwalk', [ 'ngCrossfilter' ] );
    var _throwException = function _throwException( message ) {
        throw "ngCatwalk: " + message + ".";
    };
    var ngCatwalkAttribute = {
        generic: function generic( value ) {
            return value;
        },
        number: function number( value ) {
            return +value;
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
                createModel: function createModel( collectionName, properties ) {
                    var model = this.collection( collectionName ).createModel( properties ),
                        promise = this.createPromise( collectionName, 'create', [ model ] );
                    promise.catch( function andCatch() {} );
                    return model;
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
