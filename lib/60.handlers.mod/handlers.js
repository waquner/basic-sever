/*
** © 2012 by YOUSURE Tarifvergleich GmbH
*/

module.exports = setup;

var path = require('path');
var load = require('loadexten');

function setup(app) {
  var modules = path.resolve(__dirname, app.get('config').$path('handlers.modules') || '../handlers');
  var extension = app.get('config')('handlers.extension') || '.handler';
  console.error('Loading Plugins from: '+modules);
  load(modules, extension, app);
}
