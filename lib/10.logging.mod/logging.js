/*
** © 2012 by YOUSURE Tarifvegleich GmbH
*/

module.exports = setup;

function setup(app) {
  app.log = log.bind(app, app);
  app.log.make = makeError;
  app.use(app.get('express').cookieParser());
  app.use(start.bind(app,app));
}

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

function start(app, req, res, next) {
  req._startTime = process.hrtime();
  res.end = end.bind(req, app, req, res, res.end);
  var uid = req.cookies.uid || [ ('000000000000000'+Date.now().toString(16)).slice(-11), ('000000000000000'+Math.round(Math.random() * 1000000000000)).toString(16).slice(-9) ].join('');
  if (uid != req.cookies.uid) res.cookie('uid', req.cookies.uid=uid, { path: '/', secure: true, maxAge:1314000000 });
  if(('undefined' !== typeof req.cookies['']) && !req.cookies[''].length) delete req.cookies[''];
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
      'status':res?res.statusCode:500,
      'message':err.message,
      'context':parseStack(err)
    },
    'request':(req && res)?{
      'url':req.url,
      'status':res.statusCode,
      'method':req.method,
      'protocol':req.isSpdy?'SPDY':'HTTP',
      'version':req.isSpdy?req.socket.spdyVersion:req.httpVersion,
      'content-type':res.get('content-type'),
      'content-length':res.get('content-length')
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

function timestamp(ts) {
  ts = new Date(ts);
  var prefix = [
    [
      ('00'+ts.getDate()).slice(-2),
      timestamp.months[ts.getMonth()],
      ts.getFullYear()
    ].join('/'),
    ('00'+ts.getHours()).slice(-2),
    ('00'+ts.getMinutes()).slice(-2),
    ('00'+ts.getMinutes()).slice(-2)
  ].join(':');
  var zone = [
    (ts.getTimezoneOffset() < 0 ? '-' : ''),
    ('00'+Math.round(Math.abs(ts.getTimezoneOffset()) / 60)).slice(-2),
    ('00'+Math.round(Math.abs(ts.getTimezoneOffset()) % 60)).slice(-2)
  ].join('');
  return '['+[ prefix, zone ].join(' ')+']';
}
timestamp.months=[ 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec' ];

function format(item) {
  var parts=[];
  if (item.type !== 'request') {
    parts.push(timestamp(item.timestamp));
    parts.push('[error]');
    parts.push('['+((item.client && item.client.address) ? item.client.address : item.type)+']');
    parts.push((item.error && item.error.message) ? item.error.message : JSON.stringify(item));
  } else {
    parts.push((item.client && item.client.address) ? item.client.address : '-');
    parts.push('-');
    parts.push('-');
    parts.push(timestamp(item.timestamp));
    parts.push(item.request ? ('"'+item.request.method+' '+item.request.url+' '+item.request.protocol+'/'+(item.request.version || '1.1')+'"') : '-');
    parts.push(item.request ? item.request.status : '-');
    parts.push(item.request && item.request['content-length'] ? item.request['content-length'] : '-');
  }
  return parts.join(' ');
}

function log(app, item, req, res) {
  item = (item instanceof Error) ? makeError(item, req, res) : item;
  if (!item.type || !item.timestamp) return;
  var out = ((item.type !== 'request')?console.error:console.log).bind(console);
  out(format(item));
  if ((app.get('release') === 'debug') && (item.type === 'server-error')) out(item.error.context.map(function(line) {
    return '  '+(('object' == typeof line) ? (line['function']+'('+line.file+':'+line.line+')') : line);
  }).join('\n'));
}
