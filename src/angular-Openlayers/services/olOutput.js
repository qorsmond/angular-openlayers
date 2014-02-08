'use strict';

angular.module('angular-Openlayers')
    .factory('olOutput', function($rootScope) {
        // Service logic
        var selectedFeatures = [];

        function setSelectedFeatures(selected) {
            selectedFeatures.length = 0;
            angular.forEach(selected, function(value) {
                selectedFeatures.push(value);
            });
            $rootScope.$apply();
        }

        // Public API here
        return {
            setSelectedFeatures: setSelectedFeatures,
            selectedFeatures: selectedFeatures
        };
    });
