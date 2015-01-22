var async = require('async');
var _ = require('lodash');
var fs = require('fs');
var npmResolve = require('resolve');
var path = require('path');

module.exports = function(options) {
  var self = require('moog')(options);

  if (!self.options.root) {
    throw 'The root option is required. Pass the node variable "module" as root. This allows moog to require modules on your behalf.';
  }

  self.bundled = {};

  if (self.options.bundles) {
    _.each(self.options.bundles, function(bundleName) {
      var bundlePath = getNpmPath(self.root.filename, bundleName);
      if (!bundlePath) {
        throw 'The configured bundle ' + bundleName + ' was not found in npm.';
      }
      var bundle = require(bundlePath);
      if (!bundle.moogBundle) {
        throw 'The configured bundle ' + bundleName + ' does not export a moogBundle property.';
      }
      var modules = bundle.moogBundle.modules;
      if (!modules) {
        throw 'The configured bundle ' + bundleName + ' does not have a "modules" property within its "moogBundle" property.';
      }
      _.each(modules, function(name) {
        self.bundled[name] = path.normalize(path.dirname(bundlePath) + '/' + bundle.moogBundle.directory + '/' + name + '/index.js');
      });
    });
  }

  var superDefine = self.define;
  self.define = function(type, definition) {
    var projectLevelDefinition;
    var npmDefinition;

    var projectLevelFolder = self.options.localModules + '/' + type;
    var projectLevelPath = projectLevelFolder + '/index.js';
    projectLevelPath = path.normalize(projectLevelPath);
    if (fs.existsSync(projectLevelPath)) {
      projectLevelDefinition = self.root.require(projectLevelPath);
    }

    var npmPath = getNpmPath(relativeTo, type);
    if (npmPath) {
      npmDefinition = require(npmPath);
      npmDefinition.__meta = {
        npm: true,
        dirname: path.dirname(npmPath),
        filename: npmPath,
        name: type
      };
    }

    if (!(definition || localDefinition || npmDefinition)) {
      // Can't find it nohow. Use the standard undefined type error message
      return superDefine(type);
    }

    if (!definition) {
      definition = {};
    }
    definition.__meta = definition.__meta || {};

    if (!projectLevelDefinition) {
      projectLevelDefinition = {};
    }

    projectLevelDefinition.__meta.dirname = path.dirname(projectLevelPath);
    projectLevelDefinition.__meta.filename = projectLevelFile;

    _.defaults(definition, projectLevelDefinition);

    // Call twice so that the local definition becomes
    // an implicit subclass. This allows local template overrides
    // even if there is no other local code
    if (npmDefinition) {
      superDefine(type, npmDefinition);
    }
    superDefine(type, definition);
  };

  function getNpmPath(parentPath, type) {
    if (_.has(self.bundled, type)) {
      return self.bundled[type];
    }
    try {
      return npmResolve.sync(type, { basedir: path.dirname(parentPath) });
    } catch (e) {
      // Not found via npm. This does not mean it doesn't
      // exist as a project-level thing
      return null;
    }
  }
};

