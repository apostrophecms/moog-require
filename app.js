// app.js

require('apostrophe-site')({
  modules: {
    'my-apostrophe-blog': {
      extend: 'apostrophe-blog',
      color: 'blue'
    },
    'news': {
      extend: 'apostrophe-blog'
    }
  }
});
