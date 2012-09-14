/*
** © 2012 by YOUSURE Tarifvergleich GmbH
*/

module.exports = setup;

function setup(app) {
  var modules = path.resolve(__dirname, app.get('config').$path('plugins.modules') || '../plugins');
  var extension = app.get('config')('plugins.extension') || '.plugin';
  console.error('Loading Plugins from: '+modules);
  load(modules, extension, app);
}
