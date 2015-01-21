var async = require('async');
var _ = require('lodash');
var fs = require('fs');
var npmResolve = require('resolve');
var path = require('path');

module.exports = function(options) {

  var self = {};

  self.options = options;
  self.resolved = {};
  self.root = options.root;
  if (!self.root) {
    throw 'The root option is required. Pass the node variable "module" as root. This allows resolution to require modules on your behalf.';
  }

  self.create = function(type, options, callback) {

    var definition = resolve(type);

    return instantiate(definition, options, callback);

    function resolve(type, npmOnly, relativeTo) {

      if (!relativeTo) {
        relativeTo = self.root.filename;
      }
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
        projectLevelDefinition = path.normalize(projectLevelDefinition);
        if (fs.existsSync(projectLevelDefinition)) {
          definition = self.root.require(projectLevelDefinition);
          definition.__filename = projectLevelDefinition;
        }

        if (self.options.definitions[type]) {
          if (definition) {
            _.extend(definition, self.options.definitions[type]);
          } else {
            definition = self.options.definitions[type];
            definition.__filename = self.root.filename;
          }
        }
      }

      // Now look in npm

      var npmDefinition;

      var npmPath = getNpmPath(relativeTo, type);
      if (npmPath) {
        npmDefinition = require(npmPath);
        npmDefinition.__npm = true;
        npmDefinition.__dirname = path.dirname(npmPath);
        npmDefinition.__filename = npmPath;
        npmDefinition.__name = type;
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

      definition.__name = type;

      resolveExtend(definition);

      self.resolved[type] = definition;

      return definition;
    }

    function getNpmPath(parentPath, type) {
      console.log(type);
      try {
        return npmResolve.sync(type, { basedir: path.dirname(parentPath) });
      } catch (e) {
        // Not found via npm. This does not mean it doesn't
        // exist as a project-level thing
        return null;
      }
    }

    function resolveExtend(definition) {
      if (definition.extend) {
        if (typeof(definition.extend) === 'object') {
          // Already resolved
          return;
        }
        if (typeof(definition.extend) === 'string') {
          // require it relative to the module that extends it
          definition.extend = resolve(definition.extend, false, definition.__filename);
        }
      } else {
        // Implicit subclassing

        // If this is not from npm, and has the same name as an
        // available npm module, implicitly extend that module,
        // and make our module name unique
        var name = definition.__name;
        if ((!definition.__npm) && getNpmPath(self.root.filename, name)) {
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
            var beforeConstruct = step.beforeConstruct || function(self, options, callback) { return setImmediate(callback); };
            // Turn sync into async
            if (beforeConstruct.length === 2) {
              var syncBeforeConstruct = beforeConstruct;
              beforeConstruct = function(self, options, callback) {
                try {
                  syncBeforeConstruct(self, options);
                } catch (e) {
                  return setImmediate(_.partial(callback, e));
                }
                return setImmediate(callback);
              };
            }
            if (beforeConstruct.length < 3) {
              return callback(new Error('beforeConstruct must take the following arguments: "self", "options", and (if it is async) "callback"'));
            }

            return beforeConstruct(that, options, callback);
          }, callback);
        },
        construct: function(callback) {
          // Now we want to start from the base class and go down
          steps.reverse();
          return async.eachSeries(steps, function(step, callback) {
            // Invoke construct, defaulting to an empty one
            var construct = step.construct || function(self, options, callback) { return setImmediate(callback); };

            // Turn sync into async
            if (construct.length === 2) {
              var syncConstruct = construct;
              construct = function(self, options, callback) {
                try {
                  syncConstruct(self, options);
                } catch (e) {
                  return setImmediate(_.partial(callback, e));
                }
                return setImmediate(callback);
              };
            }
            if (construct.length < 3) {
              return callback(new Error('construct must take the following arguments: "self", "options", and (if it is async) "callback"'));
            }
            return construct(that, options, callback);
          }, callback);
        }
      }, function(err) {
        if (err) {
          return callback(err);
        }
        return callback(null, that);
      });
    }
  };

  self.createAll = function(globalOptions, specificOptions, callback) {
    var result = {};
    return async.eachSeries(
      _.keys(options.definitions),
      function(name, callback) {
        var options = {};
        _.extend(options, globalOptions);
        if (_.has(specificOptions, name)) {
          _.extend(options, specificOptions[name]);
        }
        return self.create(name, options, function(err, obj) {
          if (err) {
            return callback(err);
          }
          result[name] = obj;
          return callback(null);
        });
      },
      function(err) {
        if (err) {
          return callback(err);
        }
        return callback(null, result);
      }
    );
  };

  self.bridge = function(modules) {
    return _.each(modules, function(module) {
      if (module.setBridge) {
        module.setBridge(modules);
      }
    });
  }

  return self;
};

