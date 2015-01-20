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

  describe('resolver.create', function() {
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

    it('should create a subclass with overrides of default options at runtime', function() {
      resolver = require('../index.js')({
        localModules: __dirname + '/project_modules',
        definitions: {
          'testModule': { }
        }
      });

      resolver.create('testModule', { color: 'purple' }, function(err, testModule) {
        assert(!err);
        assert(testModule._options.color === 'purple');
      });
    });

    it('should create a subclass with a new name using the `extend` property', function() {
      resolver = require('../index.js')({
        localModules: __dirname + '/project_modules',
        definitions: {
          'myTestModule': {
            extend: 'testModule',
            color: 'red'
          }
        }
      });

      resolver.create('myTestModule', {}, function(err, myTestModule) {
        assert(!err);
        assert(myTestModule);
        assert(myTestModule._options.color === 'red');
      });
    });

    it('should create a subclass with a new name by extending a module defined in localModules', function() {
      resolver = require('../index.js')({
        localModules: __dirname + '/project_modules',
        definitions: {
          'myTestModule': {
            extend: 'testModuleTwo',
            newProperty: 42
          }
        }
      });

      resolver.create('myTestModule', {}, function(err, myTestModule) {
        assert(!err);
        assert(myTestModule);
        assert(myTestModule._options.color === 'blue');
        assert(myTestModule._options.newProperty === 42);
      });
    });

    it('should create a subclass of a subclass', function() {
      resolver = require('../index.js')({
        localModules: __dirname + '/project_modules',
        definitions: {
          'myTestModule': {
            extend: 'testModule'
          },
          'mySubTestModule': {
            extend: 'myTestModule',
            color: 'orange'
          }
        }
      });

      resolver.create('myTestModule', {}, function(err, myTestModule) {
        assert(!err);
        assert(myTestModule);
        assert(myTestModule._options.color === 'blue');
      });

      resolver.create('mySubTestModule', {}, function(err, mySubTestModule) {
        assert(!err);
        assert(mySubTestModule);
        assert(mySubTestModule._options.color === 'orange');
      });
    });
  });


  describe('resolver.createAll', function() {
    var resolver;

    it('should create two subclasses', function() {
      resolver = require('../index.js')({
        localModules: __dirname + '/project_modules',
        definitions: {
          'myTestModule': { },
          'myTestModuleTwo': { }
        }
      });

      resolver.createAll({}, {}, function(err, modules) {
        assert(!err);
        assert(modules.myTestModule);
        assert(modules.myTestModuleTwo);
      });
    });

    it('should create two subclasses with runtime options passed using `specific` options', function() {
      resolver = require('../index.js')({
        localModules: __dirname + '/project_modules',
        definitions: {
          'myTestModule': { },
          'myTestModuleTwo': { }
        }
      });

      resolver.createAll({}, {
        myTestModule: { color: 'green' },
        myTestModuleTwo: { color: 'green' }
      },
        function(err, modules) {
        assert(!err);
        assert(modules.myTestModule);
        assert(modules.myTestModule._options.color === 'green');
        assert(modules.myTestModuleTwo);
        assert(modules.myTestModuleTwo._options.color === 'green');
      });
    });

    it('should create two subclasses with runtime options passed using `global` options', function() {
      resolver = require('../index.js')({
        localModules: __dirname + '/project_modules',
        definitions: {
          'myTestModule': { },
          'myTestModuleTwo': { }
        }
      });

      resolver.createAll({ color: 'green' }, { }, function(err, modules) {
        assert(!err);
        assert(modules.myTestModule);
        assert(modules.myTestModule._options.color === 'green');
        assert(modules.myTestModuleTwo);
        assert(modules.myTestModuleTwo._options.color === 'green');
      });
    });
  });

  describe('resolver.bridge', function() {
    it('should run successfully', function() {
      var resolver = require('../index.js')({
        localModules: __dirname + '/project_modules',
        definitions: {
          'myTestModule': { },
          'myTestModuleTwo': { }
        }
      });

      resolver.createAll({ }, { }, function(err, modules) {
        assert(!err);
        resolver.bridge(modules);
      });


    });
  });

});