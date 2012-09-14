/*
** © 2021 by YOUSURE Tarifvergleich Gmbh
*/

module.exports = setup;

function setup(app) {
  var messages = app.get('config')('errors') || {};
  app.use(notFound);
  app.use(errors.bind(app, messages));
}

function notFound(req, res, next) {
  var err = new Error('Location "'+req.url+'" not found');
  err.status=404;
  next(err);
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

function errors(msg, err, req, res, next) {
  var data = {};
  data.status = err.status || 500;
  data.message = msg[data.status] || err.message;
  data.cause = err.message;
  data.stack = parseStack(err);
  res.setHeader('Date', (new Date()).toGMTString());
  res.status(data.status).render('error', data);
  this.log(err, req, res);
}
