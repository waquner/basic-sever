/*
** @ 2012 by YOUSURE Tarifvergleich GmbH
*/

module.exports = setup;

var path = require('path');
var load = require('loadexten');

function setup(app) {
  var modules = path.resolve(__dirname, app.get('config').$path('utilities.modules') || '../utilities');
  var extension = app.get('config')('utilities.extension') || '.utility';
  console.error('Loading Utilities from: '+modules);
  load(modules, extension, app);
}
