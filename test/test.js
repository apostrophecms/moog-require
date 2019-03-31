const assert = require('assert');
const _ = require('lodash');

// console.log = function(s) {
//   console.trace(s);
// };

describe('moog', function() {

  describe('synth', function() {
    it('exists', function() {
      assert( require('../index.js') );
    });

    let synth = require('../index.js')({
      localModules: __dirname + '/project_modules',
      root: module
    });

    it('has a `create` method', function() {
      assert(synth.create);
    });
  });

  describe('synth.create', function() {
    let synth;

    it('should create a subclass with no options', async function() {
      synth = require('../index.js')({
        localModules: __dirname + '/project_modules',
        root: module
      });

      synth.define({
        'testModule': { }
      });

      const testModule = await synth.create('testModule', {});
      assert(testModule);
      assert(testModule._options.color === 'blue');
    });

    it('should create a subclass with overrides of default options', async function() {
      synth = require('../index.js')({
        localModules: __dirname + '/project_modules',
        root: module
      });

      synth.define({
        'testModule': {
          color: 'red'
        }
      });

      const testModule = await synth.create('testModule', {});
      assert(testModule._options.color === 'red');
    });

    it('should create a subclass with overrides of default options in localModules folder and npm', async function() {
      synth = require('../index.js')({
        localModules: __dirname + '/project_modules',
        root: module
      });

      synth.define({
          // testModuleTwo is defined in ./project_modules and
          // ./node_modules
          'testModuleTwo': { }
        }
      );

      const testModuleTwo = await synth.create('testModuleTwo', {});
      assert(testModuleTwo._options.color === 'red');
    });

    it('should create a subclass with overrides of default options at runtime', async function() {
      synth = require('../index.js')({
        localModules: __dirname + '/project_modules',
        root: module
      });

      synth.define({
        'testModule': { }
      });

      const testModule = await synth.create('testModule', { color: 'purple' });
      assert(testModule._options.color === 'purple');
    });

    it('should create a subclass with a new name using the `extend` property', async function() {
      synth = require('../index.js')({
        localModules: __dirname + '/project_modules',
        root: module
      });

      synth.define({
        'myTestModuleExtend': {
          extend: 'testModule',
          color: 'red'
        }
      });

      const myTestModule = await synth.create('myTestModuleExtend', {});
      assert(myTestModule);
      assert(myTestModule._options.color === 'red');
    });

    it('should create a subclass with a new name by extending a module defined in localModules', async function() {
      synth = require('../index.js')({
        localModules: __dirname + '/project_modules',
        root: module
      });

      synth.define({
        'myTestModule': {
          extend: 'testModuleLocalOnly',
          newProperty: 42
        }
      });

      const myTestModule = await synth.create('myTestModule', {});
      assert(myTestModule._options.color === 'purple');
      assert(myTestModule._options.newProperty === 42);
    });

    it('should create a subclass of a subclass', async function() {
      synth = require('../index.js')({
        localModules: __dirname + '/project_modules',
        root: module
      });

      synth.define({
        'myTestModule': {
          extend: 'testModule'
        },
        'mySubTestModule': {
          extend: 'myTestModule',
          color: 'orange'
        }
      });

      const myTestModule = await synth.create('myTestModule', {});
      assert(myTestModule);
      assert(myTestModule._options.color === 'blue');
      const mySubTestModule = await synth.create('mySubTestModule', {});
      assert(mySubTestModule);
      assert(mySubTestModule._options.color === 'orange');
    });

    it('should create a subclass when both parent and subclass are in npm', async function() {
      synth = require('../index.js')({
        localModules: __dirname + '/project_modules',
        root: module
      });

      synth.define({
        'testModuleThree': {}
      });

      const testModuleThree = await synth.create('testModuleThree', {});
      assert(testModuleThree);
      assert(testModuleThree._options.age === 30);
    });

    it('should create a subclass when the parent is an npm dependency of the subclass', async function() {
      synth = require('../index.js')({
        localModules: __dirname + '/project_modules',
        root: module
      });

      synth.define({
        'testModuleFour': {}
      });

      const testModuleFour = await synth.create('testModuleFour', {});
      assert(testModuleFour);
      assert(testModuleFour._options.age === 70);
    });

  });


  describe('synth.createAll', function() {
    let synth;

    it('should create two subclasses', async function() {
      synth = require('../index.js')({
        localModules: __dirname + '/project_modules',
        root: module
      });

      synth.define({
        'testModule': { },
        'testModuleTwo': { }
      });

      const modules = await createAll(synth, {}, {});
      assert(modules.testModule);
      assert(modules.testModuleTwo);
    });

    it('should create two subclasses with runtime options passed using `specific` options', async function() {
      synth = require('../index.js')({
        localModules: __dirname + '/project_modules',
        root: module
      });

      synth.define({
        'testModule': { },
        'testModuleTwo': { }
      });

      const modules = await createAll(synth, {}, {
        testModule: { color: 'green' },
        testModuleTwo: { color: 'green' }
      });
      assert(modules.testModule);
      assert(modules.testModule._options.color === 'green');
      assert(modules.testModuleTwo);
      assert(modules.testModuleTwo._options.color === 'green');
    });

    it('should create two subclasses with runtime options passed using `global` options', async function() {
      synth = require('../index.js')({
        localModules: __dirname + '/project_modules',
        root: module
      });

      synth.define({
        'testModule': { },
        'testModuleTwo': { }
      });

      const modules = await createAll(synth, { color: 'green' }, { })
      assert(modules.testModule);
      assert(modules.testModule._options.color === 'green');
      assert(modules.testModuleTwo);
      assert(modules.testModuleTwo._options.color === 'green');
    });
  });

  describe('module structure', function() {

    it('should accept a `defaultBaseClass` that is inherited by empty definitions', async function() {
      let synth = require('../index.js')({
        localModules: __dirname + '/project_modules',
        defaultBaseClass: 'testModule',
        root: module
      });

      synth.define({
        'newModule': { }
      });

      const modules = await createAll(synth, { }, { });
      assert(modules.newModule);
      assert(modules.newModule._options.color === 'blue');
    });

    // =================================================================
    // PASSING
    // =================================================================

    it('should accept a synchronous `construct` method', async function() {
      let synth = require('../index.js')({
        localModules: __dirname + '/project_modules',
        root: module
      });

      synth.define({
        'testModule': { }
      });

      const modules = await createAll(synth, { }, { });
      assert(modules.testModule);
    });

    it('should accept an asynchronous `construct` method', async function() {
      let synth = require('../index.js')({
        localModules: __dirname + '/project_modules',
        root: module
      });

      synth.define({
        'testModuleTwo': { }
      });

      const modules = await createAll(synth, { }, { });
      assert(modules.testModuleTwo);
    });

    it('should accept a synchronous `beforeConstruct` method', async function() {
      let synth = require('../index.js')({
        localModules: __dirname + '/project_modules',
        root: module
      });

      synth.define({
        'testModule': { }
      });

      const modules = await createAll(synth, { }, { });
      assert(modules.testModule);
    });

    it('should accept an asynchronous `beforeConstruct` method', async function() {
      let synth = require('../index.js')({
        localModules: __dirname + '/project_modules',
        root: module
      });

      synth.define({
        'testBeforeConstructAsync': { }
      });

      const modules = await createAll(synth, { }, { });
      assert(modules.testBeforeConstructAsync);
    });

    // =================================================================
    // FAILING
    // =================================================================

    it('should catch a synchronous Error during `construct`', async function() {
      let synth = require('../index.js')({
        localModules: __dirname + '/project_modules',
        root: module
      });

      synth.define({
        'failingModuleSync': { }
      });

      try {
        const modules = await createAll(synth, {}, {});
        assert(false);
      } catch (e) {
        assert(e.message === 'I have failed.');
        return;
      }
    });

    it('should catch an asynchronous Error during `construct`', async function() {
      let synth = require('../index.js')({
        localModules: __dirname + '/project_modules',
        root: module
      });

      synth.define({
        'failingModuleAsync': { }
      });

      try {
        const modules = await createAll(synth, {}, {});
      } catch (e) {
        assert(e.message === 'I have failed.');
        return;
      }
      assert(false);
    });

    it('should catch a synchronous Error during `beforeConstruct`', async function() {
      let synth = require('../index.js')({
        localModules: __dirname + '/project_modules',
        root: module
      });

      synth.define({
        'failingBeforeConstructSync': { }
      });

      try {
        const modules = await createAll(synth, {}, {});
        assert(false);
      } catch (e) {
        assert(e.message === 'I have failed.');
        return;
      }

    });

    it('should catch an asynchronous Error during `beforeConstruct`', async function() {
      let synth = require('../index.js')({
        localModules: __dirname + '/project_modules',
        root: module
      });

      synth.define({
        'failingBeforeConstructAsync': { }
      });

      try {
        const modules = await createAll(synth, {}, {});
        assert(false);
      } catch (e) {
        assert(e.message === 'I have failed.');
        return;
      }

    });
  });

  describe('order of operations', function() {

    // =================================================================
    // MULTIPLE `construct`s AND `beforeConstruct`s
    // =================================================================

    it('should call both the project-level `construct` and the npm module\'s `construct`', async function() {
      let synth = require('../index.js')({
        localModules: __dirname + '/project_modules',
        root: module
      });

      synth.define({
        'testDifferentConstruct': {
          extend: 'testModule'
        }
      });

      const modules = await createAll(synth, {}, {});
      assert(modules.testDifferentConstruct._options);
      assert(modules.testDifferentConstruct._differentOptions);
    });

    it('should call both the project-level `beforeConstruct` and the npm module\'s `beforeConstruct`', async function() {
      let synth = require('../index.js')({
        localModules: __dirname + '/project_modules',
        root: module
      });

      synth.define({
        'testDifferentConstruct': {
          extend: 'testModule'
        }
      });

      const modules = await createAll(synth, {}, {});
      assert(modules.testDifferentConstruct._bcOptions);
      assert(modules.testDifferentConstruct._bcDifferentOptions);
    });

    it('should override the project-level `construct` using a definitions-level `construct`', async function() {
      let synth = require('../index.js')({
        localModules: __dirname + '/project_modules',
        root: module
      });

      synth.define({
        'testDifferentConstruct': {
          extend: 'testModule',
          construct: function(self, options) {
            self._definitionsLevelOptions = options;
          }
        }
      });

      const modules = await createAll(synth, {}, {});
      assert(modules.testDifferentConstruct._options);
      assert(!modules.testDifferentConstruct._differentOptions);
      assert(modules.testDifferentConstruct._definitionsLevelOptions);
    });

    it('should override the project-level `beforeConstruct` using a definitions-level `beforeConstruct`', async function() {
      let synth = require('../index.js')({
        localModules: __dirname + '/project_modules',
        root: module
      });

      synth.define({
        'testDifferentConstruct': {
          extend: 'testModule',
          beforeConstruct: function(self, options) {
            self._bcDefinitionsLevelOptions = options;
          }
        }
      });

      const modules = await createAll(synth, {}, {});
      assert(modules.testDifferentConstruct._bcOptions);
      assert(!modules.testDifferentConstruct._bcDifferentOptions);
      assert(modules.testDifferentConstruct._bcDefinitionsLevelOptions);
    });

    // =================================================================
    // ORDER OF OPERATIONS
    // =================================================================

    it('should respect baseClass-first order-of-operations for `beforeConstruct` and `construct`', async function() {
      let synth = require('../index.js')({
        localModules: __dirname + '/project_modules',
        root: module
      });

      synth.define({
        'testOrderOfOperations': { }
      });

      const modules = await createAll(synth, {}, {});
      assert(modules.testOrderOfOperations._bcOrderOfOperations[0] === 'notlast');
      assert(modules.testOrderOfOperations._bcOrderOfOperations[1] === 'last');
      assert(modules.testOrderOfOperations._orderOfOperations[0] === 'first');
      assert(modules.testOrderOfOperations._orderOfOperations[1] === 'second');
    });

    it('should respect baseClass-first order-of-operations for `beforeConstruct` and `construct` with subclassing', async function() {
      let synth = require('../index.js')({
        localModules: __dirname + '/project_modules',
        root: module
      });

      synth.define({
        'subTestOrderOfOperations': {
          extend: 'testOrderOfOperations',
          beforeConstruct: function(self, options) {
            self._bcOrderOfOperations = (self._bcOrderOfOperations || []).concat('first');
          },
          construct: function(self, options) {
            self._orderOfOperations = (self._orderOfOperations || []).concat('third');
          }
        }
      });

      const modules = await createAll(synth, {}, {});
      assert(modules.subTestOrderOfOperations._bcOrderOfOperations[0] === 'first');
      assert(modules.subTestOrderOfOperations._bcOrderOfOperations[1] === 'notlast');
      assert(modules.subTestOrderOfOperations._bcOrderOfOperations[2] === 'last');
      assert(modules.subTestOrderOfOperations._orderOfOperations[0] === 'first');
      assert(modules.subTestOrderOfOperations._orderOfOperations[1] === 'second');
      assert(modules.subTestOrderOfOperations._orderOfOperations[2] === 'third');
    });
  });

  describe('bundles', function() {
    it('should expose two new modules via a bundle', async function() {
      let synth = require('../index.js')({
        localModules: __dirname + '/project_modules',
        root: module,
        bundles: ['testBundle']
      });

      synth.define({
        'bundleModuleOne': { },
        'bundleModuleTwo': { }
      });

      const modules = await createAll(synth, {}, {});
      assert(modules.bundleModuleOne);
      assert(modules.bundleModuleOne._options.color === 'blue');
      assert(modules.bundleModuleTwo);
      assert(modules.bundleModuleTwo._options.color === 'blue');
    });
  });

  describe('scoped bundles', function() {
    it('should expose npm-style scoped modules via a bundle', async function() {
      let synth = require('../index.js')({
        localModules: __dirname + '/project_modules',
        root: module,
        bundles: [ 'testBundle' ]
      });

      synth.define({
        '@scoped/bundleModule': { }
      });

      const modules = await createAll(synth, {}, {});
      assert(modules['@scoped/bundleModule']);
      assert(modules['@scoped/bundleModule'].scopedBundledModulesWork);
    });
  });

  describe('metadata', function() {
    it('should expose correct dirname metadata for npm, project level, and explicitly defined classes in the chain', async function() {
      let synth = require('../index.js')({
        localModules: __dirname + '/project_modules',
        root: module
      });

      synth.define('metadataExplicit', {
        color: 'red',
        extend: 'metadataProject'
      });

      const m = await synth.create('metadataExplicit', { });
      assert(m);
      assert(m.__meta);
      assert(m.__meta.chain);
      assert(m.__meta.chain[0]);
      assert(m.__meta.chain[0].dirname === __dirname + '/node_modules/metadataNpm');
      assert(m.__meta.chain[1]);
      assert(m.__meta.chain[1].dirname === __dirname + '/project_modules/metadataNpm');
      assert(m.__meta.chain[2]);
      assert(m.__meta.chain[2].dirname === __dirname + '/project_modules/metadataProject');
      assert(m.__meta.chain[3]);
      assert(m.__meta.chain[3].dirname === __dirname + '/project_modules/metadataExplicit');
    });
  });

  describe('error handling', async function() {
    it('should prevent cyclical module definitions', async function() {
      let synth = require('../index.js')({
        localModules: __dirname + '/project_modules',
        root: module
      });

      synth.define({
        'myNewModuleOne': {
          extend: 'myNewModuleTwo'
        },
        'myNewModuleTwo': {
          extend: 'myNewModuleOne'
        }
      });

      try {
        const modules = await createAll(synth, {}, {});
        assert(false);
      } catch (e) {
        return;
      }
    });
  });

  describe('replace option', function() {
    it('should substitute a replacement type when replace option is used', async function() {
      let synth = require('../index.js')({
        localModules: __dirname + '/project_modules',
        root: module
      });
      synth.define('replaceTestOriginal');
      synth.define('replaceTestReplacement');
      let instance = await synth.create('replaceTestOriginal', {});
      assert(instance._options);
      assert(!instance._options.color);
      assert(instance._options.size === 'large');
    });
  });

  describe('improve option', function() {
    it('should substitute an implicit subclass when improve option is used', async function() {
      let synth = require('../index.js')({
        localModules: __dirname + '/project_modules',
        root: module
      });
      synth.define('improveTestOriginal');
      synth.define('improveTestReplacement');
      let instance = await synth.create('improveTestOriginal', {});
      assert(instance._options);
      assert(instance._options.color === 'red');
      assert(instance._options.size === 'large');
    });
    it('should require the original for you if needed', async function() {
      let synth = require('../index.js')({
        localModules: __dirname + '/project_modules',
        root: module
      });
      synth.define('improveTestReplacement');
      let instance = await synth.create('improveTestOriginal', {});
      assert(instance._options);
      assert(instance._options.color === 'red');
      assert(instance._options.size === 'large');
    });
  });

  describe('scoped npm modules', function() {
    it('should instantiate a scoped module from npm', async function() {
      let synth = require('../index.js')({
        localModules: __dirname + '/project_modules',
        nestedModuleSubdirs: true,
        root: module
      });
      synth.define({
          '@test/test': {
            construct: function(self, options) {
              self.localWorked = true;
            }
          }
        }
      );

      let instance = await synth.create('@test/test', {});
      assert(instance);
      assert(instance.localWorked);
      assert(instance.npmWorked);
    });
  });

  describe('nestedModuleSubdirs option', function() {
    it('should load a module from a regular folder without the nesting feature enabled', async function() {
      let synth = require('../index.js')({
        localModules: __dirname + '/project_modules',
        root: module
      });
      synth.define('testModuleSimple');
      let instance = await synth.create('testModuleSimple', {});
      assert(instance._options);
      assert(instance._options.color === 'red');
    });
    it('should load a module from a nested or non-nested folder with the nesting option enabled', async function() {
      let synth = require('../index.js')({
        localModules: __dirname + '/project_modules',
        nestedModuleSubdirs: true,
        root: module
      });
      synth.define('testModuleSimple');
      let instance = await synth.create('testModuleSimple', {});
      assert(instance._options);
      assert(instance._options.color === 'red');
      synth.define('nestedModule');
      instance = await synth.create('nestedModule', {});
      assert(instance._options);
      assert(instance._options.color === 'green');
    });
  });

});

async function createAll(synth, globalOptions, specificOptions) {
  const self = synth;
  const result = {};
  const defined = Object.keys(self.definitions);
  const explicit = defined.filter(function(type) {
    return self.definitions[type].__meta.explicit === true;
  });

  for (let name of explicit) {
    const options = applyOptions(name);
    const obj = await self.create(name, options);
    result[name] = obj;
  }
  return result;

  function applyOptions(name) {
    return { ...globalOptions, ...(specificOptions[name] || {}) };
  }
}

