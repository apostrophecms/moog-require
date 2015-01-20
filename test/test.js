var assert = require('assert');

describe('resolution', function() {

  describe('resolver', function() {
    it('exists', function() {
      assert( require('../index.js') );
    });

    var resolver = require('../index.js')({
      localModules: __dirname + '/project_modules',
      definitions: { }
    });

    it('has a `create` method', function() {
      assert(resolver.create);
    });
    it('has a `createAll` method', function() {
      assert(resolver.createAll);
    });
    it('has a `bridge` method', function() {
      assert(resolver.bridge);
    });
  });

  describe('configuration', function() {
    var resolver;

    it('should create a subclass with no options', function() {
      resolver = require('../index.js')({
        localModules: __dirname + '/project_modules',
        definitions: {
          'testModule': { }
        }
      });

      resolver.create('testModule', {}, function(err, testModule) {
        assert(!err);
        assert(testModule);
      });
    });

    it('should create a subclass with overrides of default options', function() {
      resolver = require('../index.js')({
        localModules: __dirname + '/project_modules',
        definitions: {
          'testModule': {
            color: 'red'
          }
        }
      });

      resolver.create('testModule', {}, function(err, testModule) {
        assert(!err);
        assert(testModule._options.color === 'red');
      });
    });

    it('should create a subclass with overrides of default options in localModules folder', function() {
      resolver = require('../index.js')({
        localModules: __dirname + '/project_modules',
        definitions: {
          // testModuleTwo is defined in ./project_modules
          'testModuleTwo': { }
        }
      });

      resolver.create('testModuleTwo', {}, function(err, testModuleTwo) {
        assert(!err);
        assert(testModuleTwo._options.color === 'red');
      });
    });
  });

});