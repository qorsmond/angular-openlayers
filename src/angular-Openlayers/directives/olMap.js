'use strict';

angular.module('ngOpenlayers')
    .directive('olMap', function (olOutput, $timeout) {
        return {
            template: '<div class="map"><div ng-transclude></div></div>',
            restrict: 'EA',
            replace: true,
            transclude: true,
            controller: function($scope) {
                this.addLayer = function(tileLayer) {
                    $scope.addNewLayer(tileLayer);
                };

                this.setBounds = function(bounds) {
                    $scope.toExtend(bounds);
                };

                this.setLayerOrder = function(layername, order) {
                    $scope.setLayerOrder(layername, order);
                };

                this.setLayerVisability = function(layername, visabil) {
                    $scope.setLayerVisibility(layername, visabil);
                };

                this.setActiveLayer = function(layername) {
                    $scope.activateLayer(layername);
                };

                this.setLayerStyle = function(layername, lyrstyle) {
                    $scope.setLayerStyle(layername, lyrstyle);
                };
            },
            link: function(scope, element, attrs) {

                var zoombox = new OpenLayers.Control.ZoomBox({ alwaysZoom: true });
                var mapCtls = [
                    zoombox,
                    //new OpenLayers.Control.LayerSwitcher(),
                    new OpenLayers.Control.Zoom(),
                    new OpenLayers.Control.Navigation(),
                    new OpenLayers.Control.Attribution(),
                    new OpenLayers.Control.MousePosition()
                ];
                var selectFeatureCtl;
                var popup;

                var map = new OpenLayers.Map(element[0], {
                    'projection': 'EPSG:3857',
                    'displayProjection': 'EPSG:4326',
                    'controls': mapCtls
                });
                map.updateSize();

                //can be selectFeature, zoomToActiveExtend, panMap, identify, labeling
                var activeControl = 'panMap';

                if (attrs.addBlankbase) {
                    //add default blank map
                    var blankLayer = new OpenLayers.Layer('Blankbase', { isBaseLayer: true });
                    map.addLayer(blankLayer);
                }

                //Add layers after map has initialized
                scope.addNewLayer = function(layer) {
                    map.addLayer(layer);
                };

                scope.toExtend = function(bounds) {
                    map.zoomToExtent(bounds);
                };

                scope.setLayerVisibility = function(layername, visibil) {
                    var layers = map.getLayersByName(layername);
                    if (layers[0]) {
                        layers[0].setVisibility(visibil);
                    }
                };

                var activeLayer = {};
                scope.activateLayer = function(layername) {
                    var layers = map.getLayersByName(layername);
                    if (layers[0]) {
                        activeLayer = layers[0];

                        //Add the selection control to the new active layer
                        setSelectionLayer();
                    }
                };

                //--Selection helpers--
                function onIdentifySelect(feature) {
                    var htmlAtt = '';
                    angular.forEach(feature.attributes, function(value, key) {
                        htmlAtt += '<tr><td>' + key + '</td><td>' + value + '</td></tr>';
                    });

                    popup = new OpenLayers.Popup.FramedCloud('chicken',
                        feature.geometry.getBounds().getCenterLonLat(),
                        null,
                        '<div><table class="popuptable">' + htmlAtt + '</table></div>',
                        null, true, function() { selectFeatureCtl.unselectAll(); });
                    feature.popup = popup;
                    map.addPopup(popup);
                }

                function onIdentifyUnSelect(feature) {
                    map.removePopup(feature.popup);
                    feature.popup.destroy();
                    feature.popup = null;
                }

                //-- --
                function setSelectionLayer() {
                    var isActive = false; //Check if the control was active before we set it again

                    if (selectFeatureCtl) {
                        if (selectFeatureCtl.active) {
                            isActive = true;
                        }

                        //remove
                        selectFeatureCtl.unselectAll();
                        var controls = map.getControlsByClass('OpenLayers.Control.SelectFeature');
                        controls[0].deactivate();
                        controls[0].destroy();
                    }

                    var selectedFeatures = [];

                    selectFeatureCtl = new OpenLayers.Control.SelectFeature(activeLayer,
                    {
                        clickout: true,
                        toggle: true,
                        multiple: false,
                        hover: false,
                        toggleKey: "ctrlKey", // ctrl key removes from selection
                        multipleKey: "shiftKey", // shift key adds to selection
                        box: true,
                        onSelect: function(feature) {
                            //if we identify this feature show a popup
                            if (activeControl == 'identify') {
                                onIdentifySelect(feature);
                            }

                            //if we select
                            if (activeControl == 'selectFeature') {
                                //Add every selection to the array
                                selectedFeatures.push(feature.attributes);

                                //expose it to the service so that people can access the selected from the service
                                olOutput.setSelectedFeatures(selectedFeatures);
                            }
                        },
                        onUnselect: function(feature) {

                            if (activeControl == 'identify') {
                                onIdentifyUnSelect(feature);
                            }

                            if (activeControl == 'selectFeature') {
                                var remIndex = selectedFeatures.indexOf(feature.attributes);
                                selectedFeatures.splice(remIndex, 1);

                                olOutput.setSelectedFeatures(selectedFeatures);
                            }
                        }
                    });
                    //add
                    map.addControl(selectFeatureCtl);
                    if (isActive) {
                        selectFeatureCtl.activate();
                    }
                }


                //Test cache
                var cacheWrite = new OpenLayers.Control.CacheWrite({
                    imageFormat: "image/jpeg",
                    eventListeners: {
                        cachefull: function() {
                            //if (seeding) {
                            //    stopSeeding();
                            //}
                            //status.innerHTML = "Cache full.";
                            alert('Cache full.');
                        }
                    }
                });
                map.addControl(cacheWrite);
                cacheWrite.activate();

                // try cache before loading from remote resource
                var cacheRead = new OpenLayers.Control.CacheRead();
                map.addControl(cacheRead);
                cacheRead.activate();
                //--Test cache


                //--Available map functions--
                scope.selectFeature = function() {
                    activeControl = 'selectFeature';
                    selectFeatureCtl.multiple = false;
                    selectFeatureCtl.activate();
                };

                scope.zoomToActiveExtend = function() {
                    activeControl = 'zoomToActiveExtend';
                    map.zoomToExtent(activeLayer.getDataExtent());
                    map.updateSize();
                };

                scope.panMap = function() {
                    activeControl = 'panMap';
                    selectFeatureCtl.deactivate();
                    zoombox.deactivate();
                };

                scope.zoombox = function() {
                    activeControl = 'zoomBox';
                    selectFeatureCtl.deactivate();
                    zoombox.activate();
                };

                scope.identify = function() {
                    activeControl = 'identify';
                    selectFeatureCtl.activate();
                };

                scope.labeling = function(labelField, zoomlevel) {
                    activeControl = 'labeling';

                    if (labelField) {
                        //We need to reset the style map
                        //We will use the existing styles if they exist
                        var defaultStyle = activeLayer.styleMap.styles.default.defaultStyle;
                        defaultStyle.label = '${getLabel}'; //Set the label
                        var selectStyle = activeLayer.styleMap.styles.select.defaultStyle;

                        var styles = {};
                        styles.default = new OpenLayers.Style(defaultStyle, {
                            context: {
                                getLabel: function(feature) {
                                    var showOnZoomLevel = (zoomlevel ? zoomlevel : 12);
                                    if (feature.layer.map.getZoom() > showOnZoomLevel) {
                                        return feature.attributes[labelField];
                                    } else {
                                        return '';
                                    }
                                }
                            }
                        });
                        styles.select = new OpenLayers.Style(selectStyle);
                        activeLayer.styleMap = new OpenLayers.StyleMap(styles);

                    } else {
                        activeLayer.styleMap.styles.default.defaultStyle.label = '';
                    }

                    activeLayer.redraw();
                };

                scope.setBackground = function(layerName) {
                    if (layerName === 'Clear') {
                        var blankLyr = map.getLayersByName('Blankbase')[0];
                        blankLyr.setVisibility(true);
                        map.setBaseLayer(blankLyr);
                        return;
                    }

                    var layerBg = map.getLayersByName(layerName)[0];
                    if (layerBg) {

                    } else {

                        var bgLayer;

                        if (layerName === 'OpenStreet') {
                            bgLayer = new OpenLayers.Layer.OSM(layerName);
                        }
                        if (layerName === 'GoogleStreet') {
                            bgLayer = new OpenLayers.Layer.Google(layerName, { type: google.maps.MapTypeId.ROADMAP, numZoomLevels: 20 });
                        }
                        if (layerName === 'GoogleHybrid') {
                            bgLayer = new OpenLayers.Layer.Google(layerName, { type: google.maps.MapTypeId.HYBRID, numZoomLevels: 20 });
                        }
                        if (layerName === 'GoogleSatelite') {
                            bgLayer = new OpenLayers.Layer.Google(layerName, { type: google.maps.MapTypeId.SATELLITE, numZoomLevels: 20 });
                        }

                        map.addLayer(bgLayer);
                        layerBg = map.getLayersByName(layerName)[0];
                    }

                    layerBg.setVisibility(true);
                    map.setBaseLayer(layerBg);
                };

                //-- --


                var layerOrders = [];
                scope.setLayerOrder = function(layername, order) {
                    //Layers must be reordered after every layer that is added

                    layerOrders.push({ lyr: layername, ord: order }); //Store the orders in an array so we can set the order later on

                    var allLayers = map.getLayersByClass("OpenLayers.Layer.Vector");

                    angular.forEach(allLayers, function(val) {
                        var result = layerOrders.filter(function(obj) {
                            return obj.lyr === val.name;
                        });
                        map.setLayerIndex(val, result[0].ord);
                    });
                };

                scope.setLayerStyle = function(layername, lyrStyle) {
                    var layers = map.getLayersByName(layername);
                    if (layers[0]) {
                        //console.log(layers[0]);

                        var defaultStyle = null;
                        if (lyrStyle.deflt) {
                            var deflt = lyrStyle.deflt;
                            defaultStyle = new OpenLayers.Style({
                                rotation: deflt.rotation,
                                graphicName: deflt.graphicName, //Available: star,cross,x,square,triangle,circle //http://openlayers.org/dev/examples/graphic-name.js
                                pointRadius: deflt.pointRadius, //for points

                                fillColor: deflt.fillColor,
                                fillOpacity: deflt.fillOpacity,
                                strokeColor: deflt.strokeColor,
                                strokeWidth: deflt.strokeWidth,
                                graphicZIndex: 1,

                                //Label styles
                                label: '${getLabel}',
                                fontColor: deflt.fontColor ? deflt.fontColor : 'black',
                                fontSize: deflt.fontSize ? deflt.fontSize : '10px',
                                fontFamily: deflt.fontFamily,
                                fontWeight: deflt.fontWeight,
                                fontStyle: deflt.fontStyle,
                                labelAlign: deflt.labelAlign, //horizontal alignment: l=left, c=center, r=right. vertical alignment: t=top, m=middle, b=bottom.  Example values: lt, cm, rb.  Default is cm.
                                labelXOffset: 80, //--not working on canvas
                                labelYOffset: 10, //--not working on canvas
                                labelOutlineColor: deflt.labelOutlineColor,
                                labelOutlineWidth: deflt.labelOutlineWidth

                            }, {
                                context: {
                                    getLabel: function(feature) {
                                        if (feature.layer.map.getZoom() > 12) {
                                            if (deflt.labelField) {
                                                return feature.attributes[deflt.labelField];
                                            }
                                            return '';
                                        } else {
                                            return '';
                                        }
                                    }
                                }
                            });
                        }
                        var selectStyle = null;
                        if (lyrStyle.select) {
                            var sel = lyrStyle.select;
                            selectStyle = {
                                pointRadius: sel.pointRadius, //for points

                                fillColor: sel.fillColor,
                                strokeColor: sel.strokeColor,
                                graphicZIndex: 2
                            };
                        }
                        var styles = {};
                        if (defaultStyle) {
                            //console.log('set default style');
                            styles.default = defaultStyle;
                        }
                        if (selectStyle) {
                            styles.select = new OpenLayers.Style(selectStyle);
                        }

                        layers[0].styleMap = new OpenLayers.StyleMap(styles);
                        layers[0].redraw();
                    }
                };

                scope.activeThematic = null;

                scope.setLayerThematic = function(thematic) {
                    if (thematic === 'Clear') {
                        scope.activeThematic = null;

                        var resetStyleMap = new OpenLayers.StyleMap({
                            'default': new OpenLayers.Style(activeLayer.styleMap.styles.default.defaultStyle),
                            'select': new OpenLayers.Style(activeLayer.styleMap.styles.select.defaultStyle)
                        });

                        activeLayer.styleMap = resetStyleMap;
                        activeLayer.redraw();
                    }
                    if (activeLayer) {
                        scope.activeThematic = thematic;

                        var elseRule = new OpenLayers.Rule({
                            elseFilter: true
                        });

                        var allTheRules = [elseRule];

                        angular.forEach(thematic.FilterValues, function(filterValue) {
                            var theRule = new OpenLayers.Rule({
                                filter: new OpenLayers.Filter.Comparison({
                                    type: OpenLayers.Filter.Comparison.EQUAL_TO,
                                    property: thematic.FilterAttr,
                                    value: filterValue.val,
                                }),
                                symbolizer: {
                                    fillColor: filterValue.colr,
                                    fillOpacity: 1,
                                    strokeColor: "black"
                                }
                            });
                            allTheRules.push(theRule);
                        });

                        //keep the default style for this layer
                        var defaultStyle = activeLayer.styleMap.styles.default.defaultStyle;
                        defaultStyle.label = '';
                        //keep the select style for this layer
                        var selectStyle = activeLayer.styleMap.styles.select.defaultStyle;

                        var style = new OpenLayers.Style(
                            defaultStyle,
                            { rules: allTheRules });

                        var styleMap = new OpenLayers.StyleMap({
                            'default': style,
                            'select': new OpenLayers.Style(selectStyle)
                        });

                        activeLayer.styleMap = styleMap;
                        activeLayer.redraw();
                    }
                };

                scope.printMap = function() {

                    //Hide the elements on the map that we don't want to print
                    jQuery("#OpenLayers_Control_Attribution_5").hide();
                    jQuery(".olControlZoomIn.olButton").hide();
                    jQuery(".olControlZoomOut.olButton").hide();
                    jQuery("#OpenLayers_Control_MousePosition_6").hide();

                    //scale the map to the A4 paper size
                    element.css('width', '210mm');
                    element.css('height', '210mm');

                    map.updateSize();
                    element.hide(); //Hide the map so that the user don't see the odd map scale when preparing for the print

                    //Handle in a timeout so that the tiles has time to load to the new size
                    $timeout(function() {
                        element.show();

                        var data = element.html();

                        //Reset
                        element.css('width', '');
                        element.css('height', '');

                        map.updateSize();
                        //Show the element on the map that we hide
                        jQuery("#OpenLayers_Control_Attribution_5").show();
                        jQuery(".olControlZoomIn.olButton").show();
                        jQuery(".olControlZoomOut.olButton").show();
                        jQuery("#OpenLayers_Control_MousePosition_6").show();


                        //Show print window
                        var mywindow = window.open(); //will open in new tab in chrome
                        mywindow.document.write('<html><head><title>Map</title>');
                        mywindow.document.write('</head><body >');
                        mywindow.document.write(data);
                        mywindow.document.write('</body></html>');

                        mywindow.print();
                        mywindow.close();

                    }, 500);
                };

                //if in cache
                if (true) {
                    scope.setBackground('OpenStreet');
                }


                console.log('the map is ready');
            }
        };
    });
