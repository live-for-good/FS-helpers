Package.describe({
  name: 'origenstudio:files',
  version: '0.0.1',
  // Brief, one-line summary of the package.
  summary: 'It provides helpers for validating and manupulating files and move them to third parties',
  // URL to the Git repository containing the source code for this package.
  git: 'https://github.com/OrigenStudio/FS-helpers',
  // By default, Meteor will default to using README.md for documentation.
  // To avoid submitting documentation, set this field to null.
  documentation: 'README.md'
});

Package.onUse(api => {
  api.versionsFrom('1.6.0.1');

  api.use(['ecmascript']);

  api.mainModule('lib/server/main.js', 'server');
  api.mainModule('lib/client/main.js', 'client');
});
