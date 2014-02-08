'use strict';
angular.module('angular-Openlayers', []);
angular.module('angular-Openlayers').directive('olLayer', function () {
  return {
    restrict: 'E',
    require: '^olMap',
    scope: { lyrOptions: '=' },
    link: function (scope, element, attrs, olMapCtrl) {
      function addPointsLayer(lyerName, pointData, attrNames) {
        var pointsForLayer = [];
        angular.forEach(pointData, function (val) {
          var lonLat = new OpenLayers.LonLat(val.lon, val.lat).transform(new OpenLayers.Projection('EPSG:4326'), new OpenLayers.Projection('EPSG:3857'));
          var point = new OpenLayers.Feature.Vector(new OpenLayers.Geometry.Point(lonLat.lon, lonLat.lat));
          if (attrNames) {
            var attributesToUse = attrNames;
            var att = {};
            angular.forEach(attributesToUse, function (item) {
              att[item] = val[item];
            });
            point.attributes = att;
          } else {
            point.attributes = val;
          }
          pointsForLayer.push(point);
        });
        var pointsLayer = new OpenLayers.Layer.Vector(lyerName);
        pointsLayer.addFeatures(pointsForLayer);
        olMapCtrl.addLayer(pointsLayer);
      }
      function addWktLayer(lyerName, wktData, attrNames) {
        var featuresForLayer = [];
        var projFormat = {
            'internalProjection': new OpenLayers.Projection('EPSG:3857'),
            'externalProjection': new OpenLayers.Projection('EPSG:4326')
          };
        angular.forEach(wktData, function (val) {
          var feature = new OpenLayers.Format.WKT(projFormat).read(val.WKT);
          var attributesToUse = attrNames;
          var att = {};
          angular.forEach(attributesToUse, function (item) {
            att[item] = val[item];
          });
          feature.attributes = att;
          featuresForLayer.push(feature);
        });
        var wktLayer = new OpenLayers.Layer.Vector(lyerName, { renderers: ['SVG'] });
        wktLayer.addFeatures(featuresForLayer);
        olMapCtrl.addLayer(wktLayer);
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
        olMapCtrl.addLayer(jsonLayer);
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
      scope.$watch('lyrOptions.lyrOrder', function (newValue) {
        olMapCtrl.setLayerOrder(layer.lyrName, newValue);
      });
      scope.$watch('lyrOptions.lyrVisable', function (newValue) {
        olMapCtrl.setLayerVisability(layer.lyrName, newValue);
      });
      scope.$watch('lyrOptions.lyrActive', function (newValue) {
        if (newValue) {
          olMapCtrl.setActiveLayer(layer.lyrName);
        }
      });
      scope.$watch('lyrOptions.lyrStyle', function (newValue) {
        if (newValue) {
          olMapCtrl.setLayerStyle(layer.lyrName, newValue);
        }
      }, true);
    }
  };
});
angular.module('angular-Openlayers').directive('olMap', [
  'olOutput',
  '$timeout',
  function (olOutput, $timeout) {
    return {
      template: '<div class="map"><div ng-transclude></div></div>',
      restrict: 'E',
      replace: true,
      transclude: true,
      controller: [
        '$scope',
        function ($scope) {
          this.addLayer = function (tileLayer) {
            $scope.addNewLayer(tileLayer);
          };
          this.setBounds = function (bounds) {
            $scope.toExtend(bounds);
          };
          this.setLayerOrder = function (layername, order) {
            $scope.setLayerOrder(layername, order);
          };
          this.setLayerVisability = function (layername, visabil) {
            $scope.setLayerVisibility(layername, visabil);
          };
          this.setActiveLayer = function (layername) {
            $scope.activateLayer(layername);
          };
          this.setLayerStyle = function (layername, lyrstyle) {
            $scope.setLayerStyle(layername, lyrstyle);
          };
        }
      ],
      link: function (scope, element, attrs) {
        var zoombox = new OpenLayers.Control.ZoomBox({ alwaysZoom: true });
        var mapCtls = [
            zoombox,
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
        var activeControl = 'panMap';
        if (attrs.addBlankbase) {
          var blankLayer = new OpenLayers.Layer('Blankbase', { isBaseLayer: true });
          map.addLayer(blankLayer);
        }
        scope.addNewLayer = function (layer) {
          map.addLayer(layer);
        };
        scope.toExtend = function (bounds) {
          map.zoomToExtent(bounds);
        };
        scope.setLayerVisibility = function (layername, visibil) {
          var layers = map.getLayersByName(layername);
          if (layers[0]) {
            layers[0].setVisibility(visibil);
          }
        };
        var activeLayer = {};
        scope.activateLayer = function (layername) {
          var layers = map.getLayersByName(layername);
          if (layers[0]) {
            activeLayer = layers[0];
            setSelectionLayer();
          }
        };
        function onIdentifySelect(feature) {
          var htmlAtt = '';
          angular.forEach(feature.attributes, function (value, key) {
            htmlAtt += '<tr><td>' + key + '</td><td>' + value + '</td></tr>';
          });
          popup = new OpenLayers.Popup.FramedCloud('chicken', feature.geometry.getBounds().getCenterLonLat(), null, '<div><table class="popuptable">' + htmlAtt + '</table></div>', null, true, function () {
            selectFeatureCtl.unselectAll();
          });
          feature.popup = popup;
          map.addPopup(popup);
        }
        function onIdentifyUnSelect(feature) {
          map.removePopup(feature.popup);
          feature.popup.destroy();
          feature.popup = null;
        }
        function setSelectionLayer() {
          var isActive = false;
          if (selectFeatureCtl) {
            if (selectFeatureCtl.active) {
              isActive = true;
            }
            selectFeatureCtl.unselectAll();
            var controls = map.getControlsByClass('OpenLayers.Control.SelectFeature');
            controls[0].deactivate();
            controls[0].destroy();
          }
          var selectedFeatures = [];
          selectFeatureCtl = new OpenLayers.Control.SelectFeature(activeLayer, {
            clickout: true,
            toggle: true,
            multiple: false,
            hover: false,
            toggleKey: 'ctrlKey',
            multipleKey: 'shiftKey',
            box: true,
            onSelect: function (feature) {
              if (activeControl == 'identify') {
                onIdentifySelect(feature);
              }
              if (activeControl == 'selectFeature') {
                selectedFeatures.push(feature.attributes);
                olOutput.setSelectedFeatures(selectedFeatures);
              }
            },
            onUnselect: function (feature) {
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
          map.addControl(selectFeatureCtl);
          if (isActive) {
            selectFeatureCtl.activate();
          }
        }
        var cacheWrite = new OpenLayers.Control.CacheWrite({
            imageFormat: 'image/jpeg',
            eventListeners: {
              cachefull: function () {
                alert('Cache full.');
              }
            }
          });
        map.addControl(cacheWrite);
        cacheWrite.activate();
        var cacheRead = new OpenLayers.Control.CacheRead();
        map.addControl(cacheRead);
        cacheRead.activate();
        scope.selectFeature = function () {
          activeControl = 'selectFeature';
          selectFeatureCtl.multiple = false;
          selectFeatureCtl.activate();
        };
        scope.zoomToActiveExtend = function () {
          activeControl = 'zoomToActiveExtend';
          map.zoomToExtent(activeLayer.getDataExtent());
          map.updateSize();
        };
        scope.panMap = function () {
          activeControl = 'panMap';
          selectFeatureCtl.deactivate();
          zoombox.deactivate();
        };
        scope.zoombox = function () {
          activeControl = 'zoomBox';
          selectFeatureCtl.deactivate();
          zoombox.activate();
        };
        scope.identify = function () {
          activeControl = 'identify';
          selectFeatureCtl.activate();
        };
        scope.labeling = function (labelField, zoomlevel) {
          activeControl = 'labeling';
          if (labelField) {
            var defaultStyle = activeLayer.styleMap.styles.default.defaultStyle;
            defaultStyle.label = '${getLabel}';
            var selectStyle = activeLayer.styleMap.styles.select.defaultStyle;
            var styles = {};
            styles.default = new OpenLayers.Style(defaultStyle, {
              context: {
                getLabel: function (feature) {
                  var showOnZoomLevel = zoomlevel ? zoomlevel : 12;
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
        scope.setBackground = function (layerName) {
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
              bgLayer = new OpenLayers.Layer.Google(layerName, {
                type: google.maps.MapTypeId.ROADMAP,
                numZoomLevels: 20
              });
            }
            if (layerName === 'GoogleHybrid') {
              bgLayer = new OpenLayers.Layer.Google(layerName, {
                type: google.maps.MapTypeId.HYBRID,
                numZoomLevels: 20
              });
            }
            if (layerName === 'GoogleSatelite') {
              bgLayer = new OpenLayers.Layer.Google(layerName, {
                type: google.maps.MapTypeId.SATELLITE,
                numZoomLevels: 20
              });
            }
            map.addLayer(bgLayer);
            layerBg = map.getLayersByName(layerName)[0];
          }
          layerBg.setVisibility(true);
          map.setBaseLayer(layerBg);
        };
        var layerOrders = [];
        scope.setLayerOrder = function (layername, order) {
          layerOrders.push({
            lyr: layername,
            ord: order
          });
          var allLayers = map.getLayersByClass('OpenLayers.Layer.Vector');
          angular.forEach(allLayers, function (val) {
            var result = layerOrders.filter(function (obj) {
                return obj.lyr === val.name;
              });
            map.setLayerIndex(val, result[0].ord);
          });
        };
        scope.setLayerStyle = function (layername, lyrStyle) {
          var layers = map.getLayersByName(layername);
          if (layers[0]) {
            var defaultStyle = null;
            if (lyrStyle.deflt) {
              var deflt = lyrStyle.deflt;
              defaultStyle = new OpenLayers.Style({
                rotation: deflt.rotation,
                graphicName: deflt.graphicName,
                pointRadius: deflt.pointRadius,
                fillColor: deflt.fillColor,
                fillOpacity: deflt.fillOpacity,
                strokeColor: deflt.strokeColor,
                strokeWidth: deflt.strokeWidth,
                graphicZIndex: 1,
                label: '${getLabel}',
                fontColor: deflt.fontColor ? deflt.fontColor : 'black',
                fontSize: deflt.fontSize ? deflt.fontSize : '10px',
                fontFamily: deflt.fontFamily,
                fontWeight: deflt.fontWeight,
                fontStyle: deflt.fontStyle,
                labelAlign: deflt.labelAlign,
                labelXOffset: 80,
                labelYOffset: 10,
                labelOutlineColor: deflt.labelOutlineColor,
                labelOutlineWidth: deflt.labelOutlineWidth
              }, {
                context: {
                  getLabel: function (feature) {
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
                pointRadius: sel.pointRadius,
                fillColor: sel.fillColor,
                strokeColor: sel.strokeColor,
                graphicZIndex: 2
              };
            }
            var styles = {};
            if (defaultStyle) {
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
        scope.setLayerThematic = function (thematic) {
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
            var elseRule = new OpenLayers.Rule({ elseFilter: true });
            var allTheRules = [elseRule];
            angular.forEach(thematic.FilterValues, function (filterValue) {
              var theRule = new OpenLayers.Rule({
                  filter: new OpenLayers.Filter.Comparison({
                    type: OpenLayers.Filter.Comparison.EQUAL_TO,
                    property: thematic.FilterAttr,
                    value: filterValue.val
                  }),
                  symbolizer: {
                    fillColor: filterValue.colr,
                    fillOpacity: 1,
                    strokeColor: 'black'
                  }
                });
              allTheRules.push(theRule);
            });
            var defaultStyle = activeLayer.styleMap.styles.default.defaultStyle;
            defaultStyle.label = '';
            var selectStyle = activeLayer.styleMap.styles.select.defaultStyle;
            var style = new OpenLayers.Style(defaultStyle, { rules: allTheRules });
            var styleMap = new OpenLayers.StyleMap({
                'default': style,
                'select': new OpenLayers.Style(selectStyle)
              });
            activeLayer.styleMap = styleMap;
            activeLayer.redraw();
          }
        };
        scope.printMap = function () {
          jQuery('#OpenLayers_Control_Attribution_5').hide();
          jQuery('.olControlZoomIn.olButton').hide();
          jQuery('.olControlZoomOut.olButton').hide();
          jQuery('#OpenLayers_Control_MousePosition_6').hide();
          element.css('width', '210mm');
          element.css('height', '210mm');
          map.updateSize();
          element.hide();
          $timeout(function () {
            element.show();
            var data = element.html();
            element.css('width', '');
            element.css('height', '');
            map.updateSize();
            jQuery('#OpenLayers_Control_Attribution_5').show();
            jQuery('.olControlZoomIn.olButton').show();
            jQuery('.olControlZoomOut.olButton').show();
            jQuery('#OpenLayers_Control_MousePosition_6').show();
            var mywindow = window.open();
            mywindow.document.write('<html><head><title>Map</title>');
            mywindow.document.write('</head><body >');
            mywindow.document.write(data);
            mywindow.document.write('</body></html>');
            mywindow.print();
            mywindow.close();
          }, 500);
        };
        if (true) {
          scope.setBackground('OpenStreet');
        }
        console.log('the map is ready');
      }
    };
  }
]);
angular.module('angular-Openlayers').factory('olOutput', [
  '$rootScope',
  function ($rootScope) {
    var selectedFeatures = [];
    function setSelectedFeatures(selected) {
      selectedFeatures.length = 0;
      angular.forEach(selected, function (value) {
        selectedFeatures.push(value);
      });
      $rootScope.$apply();
    }
    return {
      setSelectedFeatures: setSelectedFeatures,
      selectedFeatures: selectedFeatures
    };
  }
]);