'use strict';

angular.module('ngOpenlayers')
    .directive('olLayer', function() {
        return {
            restrict: 'EA',
            require: '^olMap',
            scope: { lyrOptions: '=' },
            link: function(scope, element, attrs, olMapCtrl) {

                function addPointsLayer(lyerName, pointData, attrNames) {
                    var pointsForLayer = [];

                    angular.forEach(pointData, function(val) {

                        var lonLat = new OpenLayers.LonLat(val.lon, val.lat)
                            .transform(
                                new OpenLayers.Projection("EPSG:4326"), // transform from WGS 1984
                                new OpenLayers.Projection('EPSG:3857') // to Spherical Mercator Projection
                            );

                        var point = new OpenLayers.Feature.Vector(new OpenLayers.Geometry.Point(lonLat.lon, lonLat.lat)); //Point must be in a vector
                        //Use only attributes we need
                        if (attrNames) {
                            var attributesToUse = attrNames;
                            var att = {};
                            angular.forEach(attributesToUse, function(item) {
                                att[item] = val[item];
                            });
                            point.attributes = att;
                        } else {
                            //Use all the attributes because it was not specified
                            point.attributes = val;
                        }

                        pointsForLayer.push(point);
                    });

                    var pointsLayer = new OpenLayers.Layer.Vector(lyerName);
                    pointsLayer.addFeatures(pointsForLayer);

                    //Add the layer to the map
                    olMapCtrl.addLayer(pointsLayer);
                }

                function addWktLayer(lyerName, wktData, attrNames) {
                    var featuresForLayer = [];
                    var projFormat = {
                        'internalProjection': new OpenLayers.Projection('EPSG:3857'),
                        'externalProjection': new OpenLayers.Projection('EPSG:4326')
                    };

                    angular.forEach(wktData, function(val) {
                        var feature = new OpenLayers.Format.WKT(projFormat).read(val.WKT);

                        //Use only attributes we need, for example we don't need the WKT attribute
                        var attributesToUse = attrNames;
                        var att = {};
                        angular.forEach(attributesToUse, function(item) {
                            att[item] = val[item];
                        });
                        feature.attributes = att;

                        featuresForLayer.push(feature);
                    });

                    var wktLayer = new OpenLayers.Layer.Vector(lyerName, { renderers: ["SVG"] }); //Canvas takes too long to select features so we use SVG for time being

                    wktLayer.addFeatures(featuresForLayer);

                    //Add the layer to the map
                    olMapCtrl.addLayer(wktLayer);

                    //Must send bounds after layer is added to map
                    var bounds = wktLayer.getDataExtent();
                    olMapCtrl.setBounds(bounds);
                }

                function addgeoJsonLayer(lyerName, geojsonData) {
                    var projFormat = {
                        'internalProjection': new OpenLayers.Projection('EPSG:3857'),
                        'externalProjection': new OpenLayers.Projection('EPSG:4326')
                    };

                    var features = new OpenLayers.Format.GeoJSON(projFormat).read(geojsonData);
                    if (features) {
                        if (features.constructor != Array) {
                            features = [features];
                        }
                    }

                    var jsonLayer = new OpenLayers.Layer.Vector(lyerName);
                    jsonLayer.addFeatures(features);

                    //Add the layer to the map
                    olMapCtrl.addLayer(jsonLayer);

                    //Must send bounds after layer is added to map
                    if (scope.lyrVisable) {
                        var bounds = jsonLayer.getDataExtent();
                        olMapCtrl.setBounds(bounds);
                    }
                }


                var layer = scope.lyrOptions;

                if (layer.lyrType == 'Points') {
                    console.log('Add points layer');
                    addPointsLayer(layer.lyrName, layer.lyrData, layer.lyrAttr);
                }
                if (layer.lyrType == 'WKT') {
                    console.log('Add WKT layer');
                    addWktLayer(layer.lyrName, layer.lyrData, layer.lyrAttr);
                }
                if (layer.lyrType == 'geoJson') {
                    console.log('Add geoJson layer');
                    addgeoJsonLayer(layer.lyrName, layer.lyrData);
                }

                scope.$watch('lyrOptions.lyrOrder', function(newValue) {
                    olMapCtrl.setLayerOrder(layer.lyrName, newValue);
                });

                scope.$watch('lyrOptions.lyrVisable', function(newValue) {
                    olMapCtrl.setLayerVisability(layer.lyrName, newValue);
                });

                scope.$watch('lyrOptions.lyrActive', function(newValue) {
                    if (newValue) {
                        olMapCtrl.setActiveLayer(layer.lyrName);
                    }
                });

                scope.$watch('lyrOptions.lyrStyle', function(newValue) {
                    if (newValue) {
                        olMapCtrl.setLayerStyle(layer.lyrName, newValue);
                    }
                }, true);
            }
        };
    });
