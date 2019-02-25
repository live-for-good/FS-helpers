Package.describe({
  name: 'origenstudio:files-helpers',
  version: '1.0.0-alpha.2',
  summary: 'Provides helpers for validating and manipulating files and move them to third parties',
  git: 'https://github.com/OrigenStudio/FS-helpers',
  documentation: 'README.md'
});

Package.onUse(api => {
  api.versionsFrom('1.6.0.1');

  api.use(['ecmascript']);

  api.mainModule('lib/server/main.js', 'server');
  api.mainModule('lib/client/main.js', 'client');
});
