# apostrophe-resolver (todo: name isn't meta enough)

`apostrophe-resolver` provides powerful module subclassing. Features include:

* Implicit `require` of base classes from project level, or from npm
* Implicit subclassing at project level to do simple overrides and also change the behavior of all subclasses
* Explicit subclassing at project or npm level
* Access to "asset chain" of subclass module directories and type names, to implement template overrides and the like
* Synchronous or asynchronous constructors in any combination
* Easy declaration of default options
* `beforeConstruct` mechanism for advanced manipulation of options
* Optional default base class for all modules
* "self" is always provided, methods are always instance methods: no confusion about the scope of `this`, ever

## Example

```javascript

// IMPLICIT BASE CLASS OF ALL MODULES
//
// In node_modules/module/index.js

module.exports = {
  self.construct = function(self, options) {

    self.renderTemplate = function(name, data) {
      var i;
      for (i = 0; (i < options._directories.length); i++) {
        var directory = options._directories[i];
        var path = directory.dirname + '/views/' + directory.name + '.html';
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

var resolver = require('apostrophe-resolve')({
  localModules: __dirname + '/lib/modules',
  defaultBaseClass: 'module',
  definitions: {

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
  }
});

// Instantiate all the modules, passing in some
// universal options that are provided to all of them

return resolver.createAll({ mailer: myMailer }, function(err, modules) {
  return modules.events.get({ ... }, function(err, events) {
    ...
  });
});

// We can also tell the modules about each other. This
// invokes the setBridge method of each module, if any,
// and passes the modules object to it

resolver.bridge(modules);

// We can also create an instance of any module at any time,
// and pass it additional options. This is useful if you are
// not following the singleton pattern. We don't promise
// killer performance if you create thousands of objects
// per second

return resolver.create('parties', { color: 'purple' }, function(err, party) {
  ...
});
```

"What if I want to `require` the module I am `extend`ing myself?"

If you want to write this:

```javascript
`extend': require('./lib/weird-place/my-module/index.js')
```

You may do so, but in that case your module must export its `__name` and its `__dirname`, like so:

```javascript
module.exports = {
  __name: 'my-module',
  __dirname: __dirname,
  construct: function(self, options) { ... }
};
```

This is only necessary if you are using `require` directly. Most of the time, you will be happier if you just specify a module name and let us `require` it for you. This even works in npm modules. (Yes, it will still find it if it is an npm dependency of your own module.)
