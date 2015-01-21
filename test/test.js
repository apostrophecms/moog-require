var assert = require('assert');

describe('resolution', function() {

  describe('resolver', function() {
    it('exists', function() {
      assert( require('../index.js') );
    });

    var resolver = require('../index.js')({
      localModules: __dirname + '/project_modules',
      root: module,
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

    it('should create a subclass with no options', function(done) {
      resolver = require('../index.js')({
        localModules: __dirname + '/project_modules',
        root: module,
        definitions: {
          'testModule': { }
        }
      });

      resolver.create('testModule', {}, function(err, testModule) {
        assert(!err);
        assert(testModule);
        return done();
      });
    });

    it('should create a subclass with overrides of default options', function(done) {
      resolver = require('../index.js')({
        localModules: __dirname + '/project_modules',
        root: module,
        definitions: {
          'testModule': {
            color: 'red'
          }
        }
      });

      resolver.create('testModule', {}, function(err, testModule) {
        assert(!err);
        assert(testModule._options.color === 'red');
        return done();
      });
    });

    it('should create a subclass with overrides of default options in localModules folder', function(done) {
      resolver = require('../index.js')({
        localModules: __dirname + '/project_modules',
        root: module,
        definitions: {
          // testModuleTwo is defined in ./project_modules
          'testModuleTwo': { }
        }
      });

      resolver.create('testModuleTwo', {}, function(err, testModuleTwo) {
        assert(!err);
        assert(testModuleTwo._options.color === 'red');
        return done();
      });
    });

    it('should create a subclass with overrides of default options at runtime', function(done) {
      resolver = require('../index.js')({
        localModules: __dirname + '/project_modules',
        root: module,
        definitions: {
          'testModule': { }
        }
      });

      resolver.create('testModule', { color: 'purple' }, function(err, testModule) {
        assert(!err);
        assert(testModule._options.color === 'purple');
        return done();
      });
    });

    it('should create a subclass with a new name using the `extend` property', function(done) {
      resolver = require('../index.js')({
        localModules: __dirname + '/project_modules',
        root: module,
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
        return done();
      });
    });

    it('should create a subclass with a new name by extending a module defined in localModules', function(done) {
      resolver = require('../index.js')({
        localModules: __dirname + '/project_modules',
        root: module,
        definitions: {
          'myTestModule': {
            extend: 'testModuleLocalOnly',
            newProperty: 42
          }
        }
      });

      resolver.create('myTestModule', {}, function(err, myTestModule) {
        assert(!err);
        assert(myTestModule);
        assert(myTestModule._options.color === 'purple');
        assert(myTestModule._options.newProperty === 42);
        return done();
      });
    });

    it('should create a subclass of a subclass', function(done) {
      resolver = require('../index.js')({
        localModules: __dirname + '/project_modules',
        root: module,
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
        resolver.create('mySubTestModule', {}, function(err, mySubTestModule) {
          assert(!err);
          assert(mySubTestModule);
          assert(mySubTestModule._options.color === 'orange');
          return done();
        });
      });
    });

    it('should create a subclass when both parent and subclass are in npm', function(done) {
      resolver = require('../index.js')({
        localModules: __dirname + '/project_modules',
        root: module,
        definitions: {
          'testModuleThree': {}
        }
      });

      resolver.create('testModuleThree', {}, function(err, testModuleThree) {
        assert(!err);
        assert(testModuleThree);
        assert(testModuleThree._options.age === 30);
        return done();
      });
    });

    it('should create a subclass when the parent is an npm dependency of the subclass', function(done) {
      resolver = require('../index.js')({
        localModules: __dirname + '/project_modules',
        root: module,
        definitions: {
          'testModuleFour': {}
        }
      });

      resolver.create('testModuleFour', {}, function(err, testModuleFour) {
        assert(!err);
        assert(testModuleFour);
        assert(testModuleFour._options.age === 70);
        return done();
      });
    });

  });


  describe('resolver.createAll', function() {
    var resolver;

    it('should create two subclasses', function(done) {
      resolver = require('../index.js')({
        localModules: __dirname + '/project_modules',
        root: module,
        definitions: {
          'testModule': { },
          'testModuleTwo': { }
        }
      });

      resolver.createAll({}, {}, function(err, modules) {
        assert(!err);
        assert(modules.testModule);
        assert(modules.testModuleTwo);
        return done();
      });
    });

    it('should create two subclasses with runtime options passed using `specific` options', function(done) {
      resolver = require('../index.js')({
        localModules: __dirname + '/project_modules',
        root: module,
        definitions: {
          'testModule': { },
          'testModuleTwo': { }
        }
      });

      resolver.createAll({}, {
        testModule: { color: 'green' },
        testModuleTwo: { color: 'green' }
      },
        function(err, modules) {
        assert(!err);
        assert(modules.testModule);
        assert(modules.testModule._options.color === 'green');
        assert(modules.testModuleTwo);
        assert(modules.testModuleTwo._options.color === 'green');
        return done();
      });
    });

    it('should create two subclasses with runtime options passed using `global` options', function(done) {
      resolver = require('../index.js')({
        localModules: __dirname + '/project_modules',
        root: module,
        definitions: {
          'testModule': { },
          'testModuleTwo': { }
        }
      });

      resolver.createAll({ color: 'green' }, { }, function(err, modules) {
        assert(!err);
        assert(modules.testModule);
        assert(modules.testModule._options.color === 'green');
        assert(modules.testModuleTwo);
        assert(modules.testModuleTwo._options.color === 'green');
        return done();
      });
    });
  });

  describe('resolver.bridge', function() {
    it('should run successfully', function(done) {
      var resolver = require('../index.js')({
        localModules: __dirname + '/project_modules',
        root: module,
        definitions: {
          'testModule': { },
          'testModuleTwo': { }
        }
      });

      resolver.createAll({ }, { }, function(err, modules) {
        resolver.bridge(modules);
        assert(!err);
        assert(modules.testModule);
        assert(modules.testModuleTwo);
        return done();
      });
    });

    it('should pass modules to each other', function(done) {
      var resolver = require('../index.js')({
        localModules: __dirname + '/project_modules',
        root: module,
        definitions: {
          'testModule': {
            construct: function(self, options) {
              self.setBridge = function(modules) {
                self.otherModule = modules.testModuleTwo;
              };
            }
          },
          'testModuleTwo': {
            construct: function(self, options) {
              self.setBridge = function(modules) {
                self.otherModule = modules.testModule;
              };
            }
          }
        }
      });

      resolver.createAll({ }, { }, function(err, modules) {
        assert(!err);
        resolver.bridge(modules);
        assert(modules.testModule.otherModule);
        assert(modules.testModuleTwo.otherModule);
        return done();
      });
    });
  });

  describe('module structure', function() {

    // =================================================================
    // PASSING
    // =================================================================

    it('should accept a synchronous `construct` method', function(done) {
      var resolver = require('../index.js')({
        localModules: __dirname + '/project_modules',
        root: module,
        definitions: {
          'testModule': { }
        }
      });

      resolver.createAll({ }, { }, function(err, modules) {
        assert(!err);
        assert(modules.testModule);
        return done();
      });
    });

    it('should accept an asynchronous `construct` method', function(done) {
      var resolver = require('../index.js')({
        localModules: __dirname + '/project_modules',
        root: module,
        definitions: {
          'testModuleTwo': { }
        }
      });

      resolver.createAll({ }, { }, function(err, modules) {
        assert(!err);
        assert(modules.testModuleTwo);
        return done();
      });
    });

    it('should accept a synchronous `beforeConstruct` method', function(done) {
      var resolver = require('../index.js')({
        localModules: __dirname + '/project_modules',
        root: module,
        definitions: {
          'testModule': { }
        }
      });

      resolver.createAll({ }, { }, function(err, modules) {
        assert(!err);
        assert(modules.testModule);
        return done();
      });
    });

    it('should accept an asynchronous `beforeConstruct` method', function(done) {
      var resolver = require('../index.js')({
        localModules: __dirname + '/project_modules',
        root: module,
        definitions: {
          'testBeforeConstructAsync': { }
        }
      });

      resolver.createAll({ }, { }, function(err, modules) {
        assert(!err);
        assert(modules.testBeforeConstructAsync);
        return done();
      });
    });

    // =================================================================
    // FAILING
    // =================================================================

    it('should catch a synchronous Error during `construct`', function(done) {
      var resolver = require('../index.js')({
        localModules: __dirname + '/project_modules',
        root: module,
        definitions: {
          'failingModuleSync': { }
        }
      });

      resolver.createAll({ }, { }, function(err, modules) {
        assert(err);
        assert(err.message === 'I have failed.');
        return done();
      });
    });

    it('should catch an asynchronous Error during `construct`', function(done) {
      var resolver = require('../index.js')({
        localModules: __dirname + '/project_modules',
        root: module,
        definitions: {
          'failingModuleAsync': { }
        }
      });

      resolver.createAll({ }, { }, function(err, modules) {
        assert(err);
        assert(err.message === 'I have failed.');
        return done();
      });
    });

    it('should catch a synchronous Error during `beforeConstruct`', function(done) {
      var resolver = require('../index.js')({
        localModules: __dirname + '/project_modules',
        root: module,
        definitions: {
          'failingBeforeConstructSync': { }
        }
      });

      resolver.createAll({ }, { }, function(err, modules) {
        assert(err);
        assert(err.message === 'I have failed.');
        return done();
      });
    });

    it('should catch an asynchronous Error during `beforeConstruct`', function(done) {
      var resolver = require('../index.js')({
        localModules: __dirname + '/project_modules',
        root: module,
        definitions: {
          'failingBeforeConstructAsync': { }
        }
      });

      resolver.createAll({ }, { }, function(err, modules) {
        assert(err);
        assert(err.message === 'I have failed.');
        return done();
      });
    });
  });

});
