
angular.module('ngOpenlayersDemo', ['ngOpenlayers', 'ngGrid'])
    .controller('demoCtrl', function($scope, $sce) {

        var pointData =
        [
            { id: 1, Name: 'Luanda', lon: 13.06274, lat: -8.95385 },
            { id: 2, Name: 'Pretoria', lon: 28.207397, lat: -25.762939 },
            { id: 3, Name: 'Antananarivo', lon: 47.367553, lat: -19.017333 }
        ];

        var wktData =
        [
            { UnqId: 1, Name: 'SA', SomeTestAttr: 'Test123', WKT: 'POLYGON((15.260009765625 -28.125, 30.377197265625 -21.357421875, 35.386962890625 -30.234375, 22.379150390625 -36.03515625, 17.105712890625 -35.68359375, 17.105712890625 -35.15625, 15.260009765625 -28.125))' },
            { UnqId: 2, Name: 'Angola', SomeTestAttr: 'Test555', WKT: 'POLYGON((9.9865722656252 -5.537109375, 24.752197265625 -6.240234375, 23.521728515625 -18.369140625, 10.689697265625 -17.666015625, 9.9865722656252 -5.537109375))' },
            { UnqId: 3, Name: 'Madagascar', SomeTestAttr: 'Test555', WKT: 'POLYGON((41.802978515625 -24.873046875, 47.427978515625 -26.279296875, 50.767822265625 -12.744140625, 47.779541015625 -10.986328125, 43.736572265625 -14.853515625, 41.802978515625 -24.873046875))' }
        ];

        var geoJsonData = { "type": "Feature", "properties": {}, "geometry": { "type": "Polygon", "coordinates": [[[15.875244140625, -20.6982421875], [16.578369140625, -19.9072265625], [17.457275390625, -20.56640625], [18.116455078125, -21.0498046875], [17.369384765625, -21.2255859375], [16.842041015625, -21.357421875], [15.875244140625, -20.6982421875]]] }, "crs": { "type": "name", "properties": { "name": "urn:ogc:def:crs:OGC:1.3:CRS84" } } };

        $scope.mapLayers = [
            {
                lyrName: 'WKTtest', //Identify your layer with a name
                lyrType: 'WKT', //The layer type. Supported types is: WKT, Points and geoJson
                lyrData: wktData, //The layer data
                lyrActive: true, //Is this layer active? Only one layer can be active at a time.
                lyrVisable: true, //Is the layer visible?
                lyrOrder: 1, //What is the order of the layer. Note that the highest order will be on top
                lyrStyle: {
                    deflt: {
//The default style for the features
                        fillColor: '#94eb90',
                        fillOpacity: 0.5,
                        strokeColor: '#166558',
                        strokeWidth: 1
                    },
                    select: {
//The style that will be used when features is selected
                        fillColor: '#0bfbf9',
                        strokeColor: '#000'
                    }
                },
                lyrLegend: $sce.trustAsHtml('<svg width="15" height="15"><g><rect stroke="#166558" fill="#94eb90" stroke-width="null" stroke-dasharray="null" stroke-linejoin="round" stroke-linecap="round" x="1.31864" y="1.54808" width="12.29671" height="11.76197" id="svg_field"/></g></svg>') //A representation of the feature style. This needs some more work will be nice if it can generate from the defined style
            },
            {
                lyrName: 'POItest',
                lyrType: 'Points',
                lyrData: pointData,
                lyrActive: false,
                lyrVisable: true,
                lyrOrder: 2,
                lyrStyle: {
                    deflt: {
                        graphicName: "square",
                        pointRadius: 4.5,
                        rotation: 45,
                        fillColor: '#ffff00',
                        fillOpacity: 1,
                        strokeColor: '#333300',
                        strokeWidth: 1,
                        //Labels
                        labelAlign: 'cb', //center bottom
                        fontColor: 'red',
                        fontWeight: 'bold',
                        fontStyle: 'italic',
                        fontSize: '14px',
                        labelOutlineColor: "white",
                        labelOutlineWidth: 2
                    },
                    select: {
                        pointRadius: 5,
                        fillColor: '#0bfbf9',
                        strokeColor: '#000'
                    }
                },
                lyrLegend: $sce.trustAsHtml('<svg width="15" height="15"><g><path stroke="#333300" fill="#ffff00" stroke-width="null" stroke-dasharray="null" stroke-linejoin="round" stroke-linecap="round" d="m0.9484,7.53609l6.63884,-6.52119l6.63876,6.52119l-6.63876,6.52119l-6.63884,-6.52119z" id="svg_opstal"/></g></svg>')

            }
        ];


        $scope.selectedLayers = [];
        $scope.layerGridOptions = {
            data: 'mapLayers',
            columnDefs: [
                {
                    field: 'lyrVisable',
                    displayName: '',
                    width: 25,
                    cellClass: 'lyrVisClass',
                    cellTemplate: '<div><input type="checkbox" ng-model="row.entity.lyrVisable"></div>'
                },
                {
                    field: 'lyrLegend',
                    displayName: '',
                    width: 25,
                    cellClass: 'lyrVisClass',
                    cellTemplate: '<div ng-bind-html="row.entity.lyrLegend"></div>'
                },
                { field: 'lyrName', displayName: 'Name' },
                { field: 'lyrOrder', visible: false }
            ],
            selectedItems: $scope.selectedLayers,
            sortInfo: { fields: ['lyrOrder'], directions: ['desc'] },
            multiSelect: false,
            afterSelectionChange: function() {
                //Make sure all other layers is deactivated
                angular.forEach($scope.mapLayers, function(item) {
                    item.lyrActive = false;
                });
                //Set the active layer on the map
                angular.forEach($scope.selectedLayers, function(item) {
                    if (item.lyrName === $scope.selectedLayers[0].lyrName) {
                        item.lyrActive = true;
                    }
                });
            }
        };


    });
