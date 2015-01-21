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
        assert(testModule._options.color === 'blue');
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

    it('should accept a `defaultBaseClass` that is inherited by empty definitions', function(done) {
      var resolver = require('../index.js')({
        localModules: __dirname + '/project_modules',
        defaultBaseClass: 'testModule',
        root: module,
        definitions: {
          'newModule': { }
        }
      });

      resolver.createAll({ }, { }, function(err, modules) {
        assert(!err);
        assert(modules.newModule);
        assert(modules.newModule._options.color === 'blue');
        return done();
      });
    });

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

  describe('order of operations', function() {

    // =================================================================
    // MULTIPLE `construct`s AND `beforeConstruct`s
    // =================================================================

    it('should call both the project-level `construct` and the npm module\'s `construct`', function(done) {
      var resolver = require('../index.js')({
        localModules: __dirname + '/project_modules',
        root: module,
        definitions: {
          'testDifferentConstruct': {
            extend: 'testModule'
          }
        }
      });

      resolver.createAll({ }, { }, function(err, modules) {
        assert(!err);
        assert(modules.testDifferentConstruct._options);
        assert(modules.testDifferentConstruct._differentOptions);
        return done();
      });
    });

    it('should call both the project-level `beforeConstruct` and the npm module\'s `beforeConstruct`', function(done) {
      var resolver = require('../index.js')({
        localModules: __dirname + '/project_modules',
        root: module,
        definitions: {
          'testDifferentConstruct': {
            extend: 'testModule'
          }
        }
      });

      resolver.createAll({ }, { }, function(err, modules) {
        assert(!err);
        assert(modules.testDifferentConstruct._bcOptions);
        assert(modules.testDifferentConstruct._bcDifferentOptions);
        return done();
      });
    });

    it('should override the project-level `construct` using a definitions-level `construct`', function(done) {
      var resolver = require('../index.js')({
        localModules: __dirname + '/project_modules',
        root: module,
        definitions: {
          'testDifferentConstruct': {
            extend: 'testModule',
            construct: function(self, options) {
              self._definitionsLevelOptions = options;
            }
          }
        }
      });

      resolver.createAll({ }, { }, function(err, modules) {
        assert(!err);
        assert(modules.testDifferentConstruct._options);
        assert(!modules.testDifferentConstruct._differentOptions);
        assert(modules.testDifferentConstruct._definitionsLevelOptions);
        return done();
      });
    });

    it('should override the project-level `beforeConstruct` using a definitions-level `beforeConstruct`', function(done) {
      var resolver = require('../index.js')({
        localModules: __dirname + '/project_modules',
        root: module,
        definitions: {
          'testDifferentConstruct': {
            extend: 'testModule',
            beforeConstruct: function(self, options) {
              self._bcDefinitionsLevelOptions = options;
            }
          }
        }
      });

      resolver.createAll({ }, { }, function(err, modules) {
        assert(!err);
        assert(modules.testDifferentConstruct._bcOptions);
        assert(!modules.testDifferentConstruct._bcDifferentOptions);
        assert(modules.testDifferentConstruct._bcDefinitionsLevelOptions);
        return done();
      });
    });

    // =================================================================
    // ORDER OF OPERATIONS
    // =================================================================

    it('should respect baseClass-first order-of-operations for `beforeConstruct` and `construct`', function(done) {
      var resolver = require('../index.js')({
        localModules: __dirname + '/project_modules',
        root: module,
        definitions: {
          'testOrderOfOperations': { }
        }
      });

      resolver.createAll({ }, { }, function(err, modules) {
        assert(!err);
        assert(modules.testOrderOfOperations._bcOrderOfOperations[0] === 'notlast');
        assert(modules.testOrderOfOperations._bcOrderOfOperations[1] === 'last');
        assert(modules.testOrderOfOperations._orderOfOperations[0] === 'first');
        assert(modules.testOrderOfOperations._orderOfOperations[1] === 'second');
        return done();
      });
    });

    it('should respect baseClass-first order-of-operations for `beforeConstruct` and `construct` with subclassing', function(done) {
      var resolver = require('../index.js')({
        localModules: __dirname + '/project_modules',
        root: module,
        definitions: {
          'subTestOrderOfOperations': {
            extend: 'testOrderOfOperations',
            beforeConstruct: function(self, options) {
              self._bcOrderOfOperations = (self._bcOrderOfOperations || []).concat('first');
            },
            construct: function(self, options) {
              self._orderOfOperations = (self._orderOfOperations || []).concat('third');
            }
          }
        }
      });

      resolver.createAll({ }, { }, function(err, modules) {
        assert(!err);
        assert(modules.subTestOrderOfOperations._bcOrderOfOperations[0] === 'first');
        assert(modules.subTestOrderOfOperations._bcOrderOfOperations[1] === 'notlast');
        assert(modules.subTestOrderOfOperations._bcOrderOfOperations[2] === 'last');
        assert(modules.subTestOrderOfOperations._orderOfOperations[0] === 'first');
        assert(modules.subTestOrderOfOperations._orderOfOperations[1] === 'second');
        assert(modules.subTestOrderOfOperations._orderOfOperations[2] === 'third');
        return done();
      });
    });
  });

});
