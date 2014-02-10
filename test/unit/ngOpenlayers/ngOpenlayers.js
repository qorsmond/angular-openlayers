'use strict';

// Set the jasmine fixture path
// jasmine.getFixtures().fixturesPath = 'base/';

describe('ngOpenlayers', function() {
    
    var elm, scope;

    // load the module
    beforeEach(module('ngOpenlayers'));

    // load the templates
    beforeEach(inject(function ($rootScope, $compile) {
        elm = angular.element(
          '<div>' +
            '<ol-map>' +
              '<ol-layer ng-repeat="layer in mapLayers" lyr-options="layer">' +
              '</ol-layer>' +
            '</ol-map>' +
          '</div>');

        scope = $rootScope;
        $compile(elm)(scope);
        scope.$digest();
    }));

    //it('should create a map', inject(function ($compile, $rootScope) {
    //    var map = elm.find('');
    //}));


    it('should load config module', function() {
        //expect(hasModule('ngOpenlayers.config')).toBeTruthy();
    });

    

    
    it('should load directives module', function() {
        //expect(hasModule('ngOpenlayers.directives')).toBeTruthy();
    });
    

    
    it('should load services module', function() {
        //expect(hasModule('ngOpenlayers.services')).toBeTruthy();
    });
    

});
