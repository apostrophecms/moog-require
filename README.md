[![Build Status](https://travis-ci.org/punkave/moog-require.svg?branch=master)](https://travis-ci.org/punkave/moog-require)

# moog-require

`moog-require` provides powerful module subclassing for server-side development. It extends the features of [moog](https://github.com/punkave/moog) with the following additions:

* Fetches modules from a local modules folder if they are not defined explicitly
* If a module is defined explicitly and also exists in localModules, the local modules folder becomes a source of defaults for properties not defined explicitly
* Fetches modules from npm if they are not defined either explicitly or via the local modules folder
* If a module exists by the same name both in npm and via explicit definition or local modules, automatically extends the npm module without the need for a new name (like the "category" feature of Objective C)
* Provides access to an "asset chain" of subclass module directories and type names, to implement template overrides and the like
* Also supports bundling moog modules in a single npm module, if explicitly configured

## Example

```javascript

// IMPLICIT BASE CLASS OF ALL MODULES
// (if configured - see app.js below)
//
// In node_modules/module/index.js

module.exports = {
  self.construct = function(self, options) {
    self.renderTemplate = function(name, data) {
      var i;
      for (i = 0; (i < options.__meta.length); i++) {
        var meta = options.__meta[i];
        var path = meta.dirname + '/views/' + name + '.html';
        if (fs.existsSync(path)) {
          // Deepest subclass wins
          return templateEngine.render(path, data);
        }
      }
    };

  };
};

// NPM MODULE
//
// In node_modules/events/index.js

module.exports = {
  color: 'red',

  construct: function(self, options) {

    self.defaultTags = options.tags;

    self.get = function(params, callback) {
      // Go get some events
      return callback(events);
    };
  }
}

// PROJECT LEVEL SUBCLASS OF NPM MODULE
//
// in lib/modules/events/index.js
module.exports = {
  color: 'green',

  construct: function(self, options) {
    var superGet = self.get;
    self.get = function(params, callback) {
      // override: only interested in upcoming events
      params.upcoming = true;
      return superGet(params, callback);
    };
  }
};

// in app.js

var synth = require('moog-require')({
  localModules: __dirname + '/lib/modules',
  defaultBaseClass: 'module'
});

synth.define({

  // SETTING A DEFAULT OPTION THAT APPLIES TO *ALL* MODULES
  // (because we're setting it for the defaultBaseClass)
  'module': {
    color: 'gray'
  },

  // CONFIGURATION (IMPLICIT SUBCLASS) OF A PROJECT-LEVEL MODULE
  // (same technique works to configure an npm module)

  'events': {
    color: 'blue',
    // More overrides in lib/modules/events/index.js (above).
    // Anything here in app.js wins
  },

  // EXTENDING A PROJECT-LEVEL MODULE TO CREATE A NEW ONE
  'parties': {

    // Let's subclass a module right here in app.js (usually we'd just
    // set site-specific options here and put code in
    // lib/modules/parties/index.js, but you're not restricted)

    extend: 'events',
    color: 'lavender',

    // Let's alter the "tags" option before the
    // base class constructors are aware of it

    beforeConstruct: function(self, options) {
      options.tags = (options.tags || []).concat('party');
    },

    // This constructor can take a callback, even though
    // the base classes don't. You can mix and match

    construct: function(self, options, callback) {
      // options.color will be lavender
      var superGet = self.get;
      self.get = function(params, callback) {
        // override: only interested in parties. Let's
        // assume the base class uses this as a query
        params.title = /party/i;
        return superGet(params, callback);
      };

      // Output names and full folder paths of all modules in the
      // subclassing chain; we can use this to push assets and
      // implement template overrides
      console.log(options._directories);
    },

    setBridge: function(modules) {
      // Do something that requires access to the
      // other modules, which are properties of
      // the modules object
    }
  }
});

// Instantiate all the modules, passing in some
// universal options that are provided to all of them. This
// only instantiates modules mentioned in `definitions`, but
// they may override or subclass modules in npm or the
// project-level modules folder

return synth.createAll({ mailer: myMailer }, function(err, modules) {
  return modules.events.get({ ... }, function(err, events) {
    ...
  });
});

// We can also tell the modules about each other. This
// invokes the setBridge method of each module, if any,
// and passes the modules object to it

synth.bridge(modules);

// We can also create an instance of any module at any time,
// and pass it additional options. This is useful if you are
// not following the singleton pattern. We don't promise
// killer performance if you create thousands of objects
// per second

return synth.create('parties', { color: 'purple' }, function(err, party) {
  ...
});
```

## Replacing a module with another npm module

The `monsters` npm module works great for most people, but you've created a superior replacement, `scary-monsters`. And you want people to be able to use it as a drop-in replacement, without changing code that refers to the `monsters` module.

This is especially useful if you want other moog types that subclass `monsters` to automatically subclass `scary-monsters` instead.

So the `index.js` of your `scary-monsters` npm module might look like:

```javascript
module.exports = {
  replace: 'monsters',
  construct: function(self, options) { ... }
}
```

Note the `replace` property.

Now, an application developer who wants to use `scary-monsters` instead of the usual `monsters` module can simply configure it instead of `monsters`. The type name `monsters` will still be defined. The type name `scary-monsters` is **not** defined.

```javascript
var synth = require('moog-require')({
  localModules: __dirname + '/lib/modules',
  defaultBaseClass: 'module'
});

synth.define({
  'scary-monsters': { ... configuration ... }
});

// This works
synth.create('monsters', {});

// This does NOT work
synth.create('scary-monsters', {});
```

Note that if you want to further extend `scary-monsters` at project level, you should use a `lib/modules/scary-monsters` folder. Anything in `lib/modules/monsters` will be ignored. Similarly, in `app.js`, don't configure `monsters`, just configure `scary-monsters`.

## Improving a module with another npm module: implicit subclassing

The `improve` property is similar to `replace`, but allows you to implicitly subclass an existing type rather than completely replacing it. If you `improve` the `monsters` type, all other code will regard your subclass as the `monsters` type.

This is useful if you wish to release an npm module that subclasses a well-known module to add more functionality, without requiring developers to change the source code of other modules in order to use it.

Here is an example:

So the `index.js` of your `scary-monsters` npm module might look like:

```javascript
module.exports = {
  improve: 'monsters',
  construct: function(self, options) {
    var superJump = self.jump;
    self.jump = function(howHigh) {
      // Limit height of jumps
      if (howHigh > 100) {
        howHigh = 100;
      }
      // Call original version
      superJump(howHigh / 2);
    };
  }
}
```

Note the `improve` property.

Just like the `replace` option, the `improve` option defines the type with the name specified by `improve`. That is, your subclass is substituted everywhere for the `monsters` type. The `scary-monsters` type is **not** defined.

Here is an example of application-level code:

```javascript
var synth = require('moog-require')({
  localModules: __dirname + '/lib/modules',
  defaultBaseClass: 'module'
});

synth.define({
  'scary-monsters': { ... configuration ... }
});

// This works
synth.create('monsters', {});

// This does NOT work
synth.create('scary-monsters', {});
```

Note that if you want to further extend `scary-monsters` at project level, you should use a `lib/modules/scary-monsters` folder. Code in `lib/modules/monsters` will be loaded, but it will subclass the original `monsters` module, and then `scary-monsters` will subclass that. This is probably not what you want. Similarly, in `app.js`, don't configure `monsters`, just configure `scary-monsters`.

## Calling `require` yourself

Don't.

Well, okay...

If you want to write this:

```javascript
`extend': require('./lib/weird-place/my-module/index.js')
```

You may do so, but in that case your module must export its `__name`, `__dirname` and `__filename`, like so:

```javascript
module.exports = {
  __name: 'my-module',
  __dirname: __dirname,
  __filename: __filename,
  construct: function(self, options) { ... }
};
```

This is only necessary if you are using `require` directly. Most of the time, you will be happier if you just specify a module name and let us `require` it for you. This even works in npm modules. (Yes, it will still find it if it is an npm dependency of your own module.)

## Packaging multiple moog-require modules in a single npm module

Sometimes several modules are conceptually distinct, but are developed and versioned in tandem. In these cases there is no benefit from separate packaging, just a significant delay in `npm install`. npm peer dependencies are one way to handle this, but [npm peer dependencies may be on the chopping block](http://dailyjs.com/2014/04/16/node-roundup/), and they are significantly slower than pre-packaging modules together.

The difficulty of course is that the link between npm module names and moog-require module names is broken when we do this. So we need another way to indicate to moog-require that it should look in the appropriate place.

Since searching for "X", where X is actually provided by module "Y", is not a core feature of npm itself we have kept this mechanism simple: you can give `moog-require` an array of npm module names that contain a "bundle" of definitions rather than a single definition. An npm "bundle" module then must export a `moogBundle` array property which contains the names of the moog-require modules it defines. The actual definitions live in `lib/modules/module-one/index.js`, `lib/modules/module-two/index.js`, etc. *within the bundle npm module*. `moog-require` will find these automatically and will consider these first before requiring normally from npm.

Here's an example:

```javascript
// In node_modules/mybundle/index.js

module.exports = {
  moogBundle: {
    modules: [ 'module-one', 'module-two' ],
    directory: 'lib/modules'
  }
};

// In node_modules/mybundle/lib/modules/module-one/index.js

module.exports = {
  construct: function(self, options) { ... }
};

// In node_modules/mybundle/lib/modules/module-two/index.js

module.exports = {
  construct: function(self, options) { ... }
};
```

```javascript
// In our application

var synth = require('moog-require')({
  bundles: [ 'mybundle' ],
  localModules: __dirname + '/lib/modules',
  defaultBaseClass: 'module'
});

synth.define({
  'module-one': {},
  'module-two': {}
});
```

Note that just as before, we must include these modules in our explicit `define` calls if we want to instantiate them with `createAll`, although we don't have to override any properties; we can pass empty objects to just use the defaults defined in the project level folder, and/or implicitly inherit from npm.

However, you may explicitly `create` a type that exists only in the project level folder and/or npm.

## Changelog

0.3.0: introduced the `replace` and `improve` options, which allow an npm module to substitute itself for another moog type completely, or enhance it via implicit subclassing. This is useful when releasing a drop-in replacement for a well-known module.

0.2.0: depends on `moog` 0.2.0 which introduces the `mirror` method.

0.1.0: compatible with `moog` 0.1.0 in which the `__meta` property became an object with `chain` and `name` properties.

