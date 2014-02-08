'use strict';

// Set the jasmine fixture path
// jasmine.getFixtures().fixturesPath = 'base/';

describe('ngOpenlayers', function() {

    var module;
    var dependencies;
    dependencies = [];

    var hasModule = function(module) {
        return dependencies.indexOf(module) >= 0;
    };

    beforeEach(function() {

        // Get module
        module = angular.module('ngOpenlayers');
        dependencies = module.requires;
    });

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
