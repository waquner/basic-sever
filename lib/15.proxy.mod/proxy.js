/*
** © 2012 by YOUSURE Tarifvergleich GmbH
*/

module.exports = setup;

var https = require('https');
var http = require('http');
var isArray = require('util').isArray;
var queryString = require('querystring').stringify;

function setup(app) {
  var config = app.get('config')('proxy');
  if (!config) return;
  Object.keys(config).forEach(function(route) {
    var cfg = config[route];
    var proxy = (cfg.ssl ? https : http);
    cfg.responseFilter = cfg.responseFilter || {};
    var filter = Object.keys(cfg.responseFilter).map(function(match) {
      return { 
        match:new RegExp(match,'g'),
        replace:cfg.responseFilter[match]
      };
    });
    var handler = handle.bind(app, app, proxy, cfg, filter);
    app.all(route, handler);  
  });
}

function parseCookie(str) {
  str = str.split('; ');
  var cookie = {};
  str.forEach(function(piece, idx) {
    piece = piece.split('=');
    if (!idx) {
      cookie.name = piece[0];
      cookie.value = piece.slice(1).join('=').replace(/%([0-9a-fA-F]{2})/g, function(match, hex) { return String.fromCharCode(parseInt(hex,16)); });
      return;
    }
    if (piece[0] == 'httponly') return;
    cookie[piece[0]] = piece.slice(1).join('=').replace(/%([0-9a-fA-F]{2})/g, function(match, hex) { return String.fromCharCode(parseInt(hex,16)); });
  });
  if (cookie.expires) cookie.expires=new Date(Date.parse(cookie.expires));
  return cookie;
}
function handle(app, proxy, config, filter, req, res, next) {
  var opts = {
    host:config.host,
    port:config.port,
    path:[ req.path ],
    method:req.method,
    headers:{}
  };
  if (req.query && Object.keys(req.query).length) opts.path.push(queryString(req.query));
  opts.path = opts.path.join('?');
  Object.keys(req.headers).forEach(function(header) {
    if ([ 'path', 'accept-encoding' ].indexOf(header.toLowerCase()) > -1) return;
    opts.headers[header.toLowerCase()] = req.headers[header];
  });
  Object.keys(config.requestHeaders).forEach(function(header) {
    var val = config.requestHeaders[header];
    if ('object' === typeof val) {
      if ('string' === typeof opts.headers[header.toLowerCase()]) {
        Object.keys(val).forEach(function(match) {
          var subst = val[match];
          match = new RegExp(match);
          opts.headers[header.toLowerCase()] = opts.headers[header.toLowerCase()].replace(match, subst);
        });
      }
    } else {
      opts.headers[header.toLowerCase()] = val;  
    }
  });
  var preq = proxy.request(opts, function(pres) {
    var h = {};
    Object.keys(pres.headers).forEach(function(header) {
      if ([ 'connection', 'server', 'pragma', 'cache-control'].indexOf(header.toLowerCase()) > -1) return;
      if (header.match(/^X-/i)) return;
      if ('set-cookie' === header.toLowerCase()) {
        pres.headers[header] = isArray(pres.headers[header]) ? pres.headers[header] : [ pres.headers[header] ];
        pres.headers[header] = pres.headers[header].forEach(function(cookie) {
          cookie = parseCookie(cookie);
          res.cookie(cookie.name, cookie.value, cookie);
        });
        return;
      } 
      res.set(header, ('string' === typeof pres.headers[header]) ? String(pres.headers[header]).replace(/^https?:\/\/[^\/]+\//,'/') : pres.headers[header]);
      h[header.toLowerCase()] = res.get(header);
    });
    res.statusCode=pres.statusCode;
    if (filter.length && (String(pres.headers['content-type']).substr(0, 'text/'.length) === 'text/')) {
      var data = [];
      pres.on('data', data.push.bind(data));
      pres.on('end', function() {
        data = Buffer.concat(data, isNaN(pres.headers['content-length']) ? undefined : parseInt(pres.headers['content-length'],10));
        data = data.toString('utf-8');
        filter.forEach(function(filter) {
          data = data.replace(filter.match, filter.replace);
        });
        data = new Buffer(data, 'utf-8');
        res.set('Content-Length', data.length);
        res.end(data);
      });
    } else {
      pres.pipe(res);
    }
  });
  preq.on('error', next);
  req.pipe(preq);
  req.resume();
}
