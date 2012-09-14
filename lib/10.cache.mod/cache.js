/*
** © 2012 by YOUSURE Tarifvergleich GmbH
*/

module.exports = setup;
var Memcached = require('memcached');

function setup(app) {
  var config = app.get('config')('cache');
  if (!config || !config.server || !config.patterns || !config.patterns.length) return;
  config.expiration = config.expiration || 0;
  config.timeout =  (config.timeout || 60) * 1000;

  var ctx = {};
  ctx.config = config;
  ctx.disconnect = disconnect.bind(ctx,ctx);

  var cached = serve.bind(app, connect.bind(ctx, ctx), config);
  config.patterns.forEach(function(pattern) {
    if ('object' === typeof pattern) {
      pattern = new RegExp(pattern.expression, pattern.flags);
    }
    app.get(pattern, cached);
  });
}

function serve(memc, config, req, res, next) {
  memc(function(err, memcache) {
    if (err || !memcache) {
      req.log(err);
      return next();
    }
    memcache.get(req.path, function(err, data) {
      if (err || !data) {
        if (err) req.log(err);
        return cache(memc, config, req, res, next);
      }
      try {
        data = JSON.parse(data);
      } catch(err) {
        req.log(err);
        return cache(memc, config, req, res, next);
      }
      if (!data.headers || !data.status || !data.content) {
        req.log(err);
        return cache(memc, config, req, res, next);
      }
      try {
        data.content = new Buffer(data.content, 'base64');
      } catch(err) {
        req.log(err);
        return cache(memc, config, req, res, next);
      }
      data.headers.date=(new Date()).toGMTString();
      if (data.headers.expires && (Date.parse(data.headers.expires) < Date.now())) {
        return cache(memc, config, req, res, next);
      }
      res.writeHead(data.status, 'Cached', data.headers);
      res.end(data.content);
    });
  });
}

function cache(memc, config, req, res, next) {
  var store = [];
  res.write = write.bind(res, res.write);
  res.end = end.bind(res, res.end);
  res.on('data', function(data, encoding) {
    store.push(Buffer.isBuffer(data)?data:new Buffer(data, encoding));
  });
  res.once('end', function() {
    if (Array.isArray(config.status) && config.status.length && (config.status.indexOf(res.status) < 0)) return;
    if (Array.isArray(config.types) && config.types.length && res._headers['content-type']) {
      if(!config.types.filter(function(type) {
        return res_headers['content-type'].substr(0,type.length) === type;
      }).length) {
        return;
      }
    }
    var cache = {
      status:res.statusCode,
      headers:res._headers,
      content:Buffer.concat(store).toString('base64')
    };
    memc(function(err, memcache) {
      if (err || !memcache) return req.log(err);
      memcache.set(req.path, JSON.stringify(cache), config.expiration, function(err) {
        if (err) req.log(err);
      });
    });
  });
  next();
}

function write(fn, data, encoding) {
  fn.apply(this, Array.prototype.slice.call(arguments, 1));
  this.emit('data', data, encoding);
}
function end(fn, data, encoding) {
  fn.apply(this, Array.prototype.slice.call(arguments, 1));
  if (data) this.emit('data', data, encoding);
  this.emit('end');
}

function disconnect(ctx) {
  clearTimeout(ctx.timeout);
  ctx.connection.end();
}

function connect(ctx, callback) {
  clearTimeout(ctx.timeout);
  setTimeout(ctx.disconnect, ctx.config.timeout);
  ctx.connection = ctx.connection || new Memcached(ctx.config.server, ctx.config.options || { 'reconnect':1000, 'retries':1000 });
  callback(undefined, ctx.connection);
}
