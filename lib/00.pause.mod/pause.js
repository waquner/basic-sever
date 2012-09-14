/*
** © 2012 by YOUSURE Tarifvergleich GmbH
*/

module.exports = setup;

var parseURL = require('url').parse;
var exten = require('path').extname;

function setup(app) {
  app.use(pause.bind(app, app.get('config')('serverName')));
}

function log(err) {
  var e = (new Error('log')).stack.split(/\r?\n/).slice(2).shift().replace(/^.*\((.*)\).*$/,'$1');
  console.error(e, this.path, err?err:'served');
  if (err && err.stack) {
    console.error(err.stack);
  }
}

function pause(server, req, res, next) {
  if (!req.log) req.log=log;
  res.on('header', function(header) {
    res.removeHeader('X-Powered-By');
    if (server) res.set('Server',server);
  });
  req.pause();
  req.path = req.path || parseURL(req.url).pathname || '/';
  req.query = req.query || parseURL(req.url, true).query || {};
  if (exten(req.path) === '.less') res.type('text/less; charset=utf-8');
  req.next = process.nextTick.bind(process, req.next.bind(req));
  req.next();
}
