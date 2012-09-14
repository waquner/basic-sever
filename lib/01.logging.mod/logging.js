/*
** © 2012 by YOUSURE Tarifvegleich GmbH
*/

module.exports = setup;

var serverIP = (function() {
  var os = require('os');
  var net = os.networkInterfaces();
  net = Object.keys(net).map(function(name) {
    var addr = net[name].filter(function(addr){ return !addr.internal && addr.family==='IPv4'; }).shift();
    return addr ? addr.address : undefined;
  }).filter(function(addr) {
    return addr;
  }).shift();
  return net || '0.0.0.0';
}());

function setup(app) {
  app.log = log.bind(app, app);
  app.use(app.get('express').cookieParser());
  app.use(start.bind(app,app));
}

function start(app, req, res, next) {
  req._startTime = process.hrtime();
  res.end = end.bind(req, app, req, res, res.end);
  var uid = req.cookies.uid || [ ('000000000000000'+Date.now().toString(16)).slice(-11), ('000000000000000'+Math.round(Math.random() * 1000000000000)).toString(16).slice(-9) ].join('');
  if (uid != req.cookies.uid) res.cookie('uid', req.cookies.uid=uid, { path: '/', secure: true, maxAge:1314000000 });
  next();
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

function end(app, req, res, fn, data, encoding) {
  fn.apply(res, Array.prototype.slice.call(arguments, 4));
  var status = app.get('status');
  var time = process.hrtime(req._startTime);
  time = time[0] + (time[1] * 1000000000);
  var logItem = {
    'timestamp':Date.now(),
    'type':'request',
    'request':{
      'url':req.url,
      'status':res.statusCode,
      'method':req.method,
      'protocol':req.isSpdy?'SPDY':'SSL',
      'content-type':res.get('content-type')
    },
    'client':{
      'agent':req.headers['user-agent'],
      'cookies':{},
      'address':req.ip
    },
    'server':{
      'address':serverAddress(req),
      'primary':serverIP
    }
  };
  Object.keys(req.cookies).forEach(function(name) { if (name && name.length) { logItem.client.cookies[name]=req.cookies[name]; } });
  app.log(logItem);
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
      'line':match[3]
    } : undefined;
  }).filter(function(line) { return line; });
}

function makeError(err, req, res) {
  var logItem = {
    'type':'server-error',
    'timestamp':Date.now(),
    'error':{
      'message':err.message,
      'context':parseStack(err)
    },
    'request':(req && res)?{
      'url':req.url,
      'status':res.statusCode,
      'method':req.method,
      'protocol':req.isSpdy?'SPDY':'SSL',
      'content-type':res.get('content-type')
    }:undefined,
    'client':(req && res)?{
      'agent':req.headers['user-agent'],
      'cookies':{},
      'address':req.ip
    }:undefined,
    'server':{
      'address':(req && res)?serverAddress(req):undefined,
      'primary':serverIP
    }
  };
  return logItem;
}

function log(app, item, req, res) {
  item = (item instanceof Error) ? makeError(item, req, res) : item;
  if (!item.type || !item.timestamp) return;
  if (app.get('release') === 'debug') return console.log('Logging:', JSON.stringify(item));
  app.get('database').insert('events', item).fail(function(err) {
    console.log('Logging', err.message+':', JSON.stringify(item));
  });
}
