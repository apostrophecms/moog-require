module.exports = {
  extends: 'apostrophe-snippets',
  instance: 'party',
  addFields: [ ... some schema fields ... ],

  // Invoked before construct, so we can
  // modify options before the base class constructs itself
  beforeConstruct: function(self, options) {
    options.colors = (options.colors || []).concat('blue');
  }

  // Add and override methods inside "construct"
  // Base class construct has already been called
  construct: function(self, options /* , callback */) {
    self.dispatch = function(callback) {
      // Do fancy things, then...
      return callback(null);
    };
  },

};
