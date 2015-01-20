// A subclass of widget-editor

apos.define('slideshow-widget-editor', {

  extends: 'widget-editor',

  beforeConstruct: function(self, options) {
    options.fileGroup = options.fileGroup || 'images';
  },

  construct: function(self, options) {
    self.beforeCancel = function(callback) {
      if (confirm('Are you sure you want to cancel your edits to this slideshow?')) {
        return callback(null);
      } else {
        return callback('canceled');
      }
    };

    self.afterCreatingEl = function() {
      $items = self.$el.find('[data-items]');
      $items.sortable({
        update: function(event, ui) {
          reflect();
          self.preview();
        }
      });
      ...
    };
  }
});

// A subclass of snippets

apos.define('apostrophe-events', {
  extends: 'apostrophe-snippets',

  // Add and override methods inside "construct"
  // Base class construct has already been called

  construct: function(self, options /* , callback */) {
    self.addingToManager = function($el, $snippet, snippet) {
      $snippet.find('[data-date]').text(snippet.startDate);
      var status;
      if (snippet.trash) {
        status = 'Trash';
      } else if (snippet.published) {
        status = 'Published';
      } else {
        status = 'Draft';
      }
      $snippet.find('[data-status]').text(status);
    };
  }
});
