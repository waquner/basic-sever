/*
** © 2012 by YOUSURE Tarifvergleich GmbH
*/

module.exports = setup;

var path = require('path');
var fs = require('fs');
var async = require('async'); //require('domain-async');
var qs=require('querystring').stringify;
var us=require('url').format;

function setup(app) {
  var config = app.get('config');
  config = {
    root:config.$path('static.root'),
    maxAge:config('static.maxAge') || 0
  };
  if (config.root) {
    app.get('*', serve.bind(app, config));
    app.head('*', serve.bind(app, config));
  }
}

function etag(stat) {
  return [
    '"',
    [
      stat.size,
      Number(stat.mtime)
    ].join('-'),
    '"'
  ].join('');
}

function stat(name, callback) {
  fs.stat(name, function(err, stat) {
    return callback(null, stat);
  });
}

function serverAddress(req) {
  var local;
  try {
    local = req.isSpdy ? req.connection.connection.socket.address() : req.connection.address();
    local = local.address;
  } catch (ex) {
    local = ('string' === typeof local) ? local : undefined;
  }
  return local;
}

function serve(cfg, req, res, next) {
  if (path.extname(req.path).length) return next();
  var file = path.resolve(cfg.root, req.path.slice(1));
  var options = [ file, '.page', '/index.page' ].map(function(append) { return file+append; });
  async.map(options, stat, function(err, stat) {
    stat = stat.map(function(stat, idx) {
      if (stat) stat.file=options[idx];
      return stat;
    }).filter(function(stat) {
      return stat && stat.isFile();
    }).shift();

    if (!stat) return next();

    res.setHeader('Content-Type','text/html; charset=utf-8');
    res.setHeader('Date', (new Date()).toGMTString());
    res.setHeader('Expires', (new Date(Date.now()+(cfg.maxAge * 1000))).toGMTString());
    res.setHeader('Last-Modified', stat.mtime.toGMTString());
    res.setHeader('ETag', etag(stat));

    if ((req.headers['if-none-match'] && (req.headers['if-none-match'] === etag(stat))) || (req.headers['if-modified-since'] && (Date.parse(req.headers['if-modified-since']) <= stat.mtime.getTime()))) return res.status(304).end();

    fs.readFile(stat.file, function(err, data) {
      if (err) return next(err);
      data=JSON.parse(data.toString('utf-8'));
      var template = data.template || 'page';
      delete data.template;
      var request={
        host:req.get('host'),
        port:req.get('host').split(':').pop() || '443',
        hostname:req.host,
        pathname:req.path,
        protocol:'https:',
        query:req.query,
        search:qs(req.query),
        'user-agent':req.get('user-agent'),
        referer:req.get('referer'),
        cookies:req.cookies,
        client:req.ip,
        server:serverAddress(req),
        userid:req.cookies.uid
      };
      request.url=us(request);
      res.locals.request=request;
      data.settings = ('undefined' === typeof data.settings) ? undefined : data.settings;
      data._locals = ('undefined' === typeof data._locals) ? undefined : data._locals;
      res.status(200);
      res.render(template, data);
    });
  });
}
