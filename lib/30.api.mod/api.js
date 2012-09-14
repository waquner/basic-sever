/*
** © 2012 by YOUSURE Tarifvergleich GmbH
*/

module.exports = setup;

var path = require('path');
var load = require('loadexten');

function setup(app) {
  var prefix = app.get('config')('api.prefix') || '/api';
  prefix += (prefix[prefix.length -1] === '/')  ? '' : '/';
  var modules = path.resolve(__dirname, app.get('config').$path('api.modules') || '../api');
  var extension = app.get('config')('api.extension') || '.api';
  console.error('Loading API('+prefix+') from: '+modules);
  load(modules, extension, app, prefix);
  app.all(prefix+'*', notFound.bind(app, prefix));
  app.use(error.bind(app, prefix));
}

function notFound(prefix, req, res, next) {
  if (prefix !== req.url.substr(0, prefix.length)) return next();
  var err = new Error('Invalid API Call: '+req.path);
  err.status=404;
  next(err);
}

function error(prefix, err, req, res, next) {
  if (prefix !== req.url.substr(0, prefix.length)) return next(err);
  var data = {
    success:false,
    error:err.message || String(err),
    source:(err && err.stack)?(String(err.stack).split(/\r?\n/).slice(1).shift() || '').replace(/^.*\((.*)\).*$/,'$1'):undefined
  };
  res.json(data);
  this.log(err, req, res);
}
