var async = require('async');
var _ = require('lodash');

module.exports = function(options) {

  var self = {};

  self.options = options;
  self.resolved = {};

  self.create = function(type, options, callback) {

    // You can't create an instance of something that
    // is not present in your definitions (you can't
    // create an instance of an abstract base class)

    if (!self.options.definitions[type]) {
      return callback(new Error('unconfigured module type: ' + type));
    }

    var definition = resolve(type);

    return instantiate(definition, options, callback);

    function resolve(type, npmOnly) {

      // I have: a type name
      // I want: the right definition object, with the right
      // 'extend' chain

      if (_.has(self.resolved, type)) {
        return self.resolved[type];
      }

      // Local module folder index.js and app.js are both allowed,
      // app.js wins

      var definition;

      if (!npmOnly) {
        var projectLevelFolder = self.options.localModules + '/' + type;
        var projectLevelDefinition = projectLevelFolder + '/index.js';
        if (fs.existsSync(projectLevelDefinition)) {
          definition = require(projectLevelDefinition);
        }

        if (self.options.definitions[type]) {
          if (definition) {
            _.extend(definition, self.options.definitions[type]);
          } else {
            definition = self.options.definitions[type];
          }
        }
      }

      // Now look in npm

      var npmDefinition;

      var npmPath = getNpmPath(type);
      if (npmPath) {
        npmDefinition = require(npmPath);
        npmDefinition.__npm = true;
        npmDefinition.__dirname = path.dirname(npmPath);
        npmDefinition.name = type;
        if (definition) {
          definition.extend = npmDefinition;
          resolveExtend(npmDefinition);
        } else {
          definition = npmDefinition;
        }
      }

      if (!definition) {
        return callback(new Error('No such type is defined, in app.js, project-level modules or npm: ' + type));
      }

      resolveExtend(definition);

      self.resolved[type] = definition;

      return definition;
    }

    function resolveExtend(definition) {
      if (definition.extend) {
        if (typeof(definition.extend === 'object')) {
          // Already resolved
          return;
        }
        if (typeof(definition.extend) === 'string') {
          definition.extend = resolve(definition.extend);
        }
      } else {
        // Implicit subclassing

        // If this is not from npm, and has the same name as an
        // available npm module, implicitly extend that module,
        // and make our module name unique
        var name = definition.__name;
        if ((!definition.__npm) && getNpmPath(name)) {
          definition.__name = 'my-' + name;
          definition.extend = resolve(name, true);
        } else if (self.options.defaultBaseClass && (definition.__name !== self.options.defaultBaseClass)) {
          // If there is a default base class, and we're not it,
          // implicitly extend that base class
          definition.extend = resolve(self.options.defaultBaseClass);
        } else {
          // We don't extend anything, which is OK too
        }
      }
    }

    function instantiate(definition, options, callback) {
      var that = {};
      var next = definition;
      var steps = [];
      options._directories = options._directories || [];

      while (next) {
        options._directories.push({ dirname: next.__dirname, name: next.__name });
        steps.push(next);
        next = next.extend;
      }

      return async.series({
        beforeConstruct: function(callback) {
          return async.eachSeries(steps, function(step, callback) {
            // Apply the simple option defaults
            _.each(step, function(val, key) {
              if ((key === 'construct') || (key === 'extend') || (key === 'beforeConstruct')) {
                return;
              }
              if (key.substr(0, 2) === '__') {
                return;
              }
              if (_.has(options, key)) {
                return;
              }
              options[key] = val;
            });

            // Invoke beforeConstruct, defaulting to an empty one
            var beforeConstruct = next.beforeConstruct || function(self, options, callback) { return setImmediate(callback); };

            // Turn sync into async
            if (beforeConstruct.length === 2) {
              var syncBeforeConstruct = beforeConstruct;
              beforeConstruct = function(self, options, callback) {
                syncBeforeConstruct(self, options);
                return setImmediate(callback);
              };
            }

            return beforeConstruct(self, options, callback);
          }, callback);
        },
        construct: function(callback) {
          // Now we want to start from the base class and go down
          steps.reverse();
          return async.eachSeries(steps, function(step, callback) {
            // Invoke construct, defaulting to an empty one
            var construct = next.construct || function(self, options, callback) { return setImmediate(callback); };

            // Turn sync into async
            if (construct.length === 2) {
              var syncConstruct = construct;
              construct = function(self, options, callback) {
                syncConstruct(self, options);
                return setImmediate(callback);
              };
            }

            return construct(self, options, callback);
          });
        }
      }, callback);
    }
  };

  self.createAll = function(globalOptions, specificOptions, callback) {
    return async.eachSeries(_.keys(options.definitions), self.create, callback);
  };

  self.bridge = function(modules) {
    return _.each(modules, function(module) {
      if (module.setBridge) {
        module.setBridge(modules);
      }
    });
  }
};

