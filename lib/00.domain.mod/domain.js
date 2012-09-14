/*
** © 2012 by YOUSURE Tarifvergleich GmbH
*/

module.exports = setup;

var domain = require('domain').create;

function setup(app) {
  var msg = app.get('config')('errors') || {};
  app.use(domainify.bind(app, msg));
}

function domainify(msg, req, res, next) {
  var d = domain();
  d.on('error', error.bind(this, msg, req, res));
  d.add(req);
  d.add(res);
  d.run(req.next);
}

function parseStack(err) {
  return String(err ? err.stack : '').split(/\r?\n/).slice(1).map(function(line) {
    line = line.replace(/^\s+at\s+/,'');
    var match = /^(.*)\s+\(([^:]+):([^:]+):([^:]+)\)$/.exec(line);
    if (!match) {
      match = line.split(':');
      match.unshift('anonymous');
      match.unshift(line);
    }
    return match ? {
      'function':match[1],
      'file':match[2],
      'line':match[3],
      'column':match[4]
    } : undefined;
  }).filter(function(line) { return line; });
}

function error(msg, req, res, err) {
  console.error(err.stack);
  var d = domain();
  d.run(function() {
    var data = {};
    data.status = 500;
    data.message = msg[data.status] || err.message;
    data.cause = err.message;
    data.stack = parseStack(err);
    res.setHeader('Date', (new Date()).toGMTString());
    res.status(data.status).render('error', data);
  });
}
