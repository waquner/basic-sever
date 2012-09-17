/*
** @ 2012 by YOUSURE Tarifvergleich GmbH
*/

var path = require('path');
var config = require('./lib/config.js')(process.argv[2] || (__dirname+'/config.json'));
var load = require('loadexten');
var seic = require('seic');
var ensure = require('ensure-https');

config('https.options.ca', config('https.options.ca') || path.join(__dirname,'ssl','ca.crt'));
config('https.options.key', config('https.options.key') || path.join(__dirname,'ssl','server.key'));
config('https.options.cert', config('https.options.cert') || path.join(__dirname,'ssl','server.crt'));
config('https.options.ca', config.$content('https.options.ca'));
config('https.options.key', config.$content('https.options.key'));
config('https.options.cert', config.$content('https.options.cert'));
config('logFile', config('logFile') || 'error.log');
config('pidFile', config('pidFile') || 'error.pid');

var options = {
  stdout:config.$path('logFile'),
  stderr:config.$path('logFile'),
  pidfile:config.$path('pidFile'),
  ssl:config('https.options')
};

if (config('debug')) {
  console.log('Starting in Debug-Mode');
  seic.worker(options, worker);
} else {
  console.log('Starting in Release-Mode');
  seic(options).worker(worker);
}

function worker(err, app) {
  if (config('debug')) app.set('release','debug');
  console.log('Starting Worker');
  if (err) return console.error(err.stack);
  app.set('config', config);
  //app.use(app.router);
  load(__dirname+'/lib', '.mod', app);

  app.listen(config('https.port') || 443, config('https.address'));
  var http = config('http');
  if (http) {
    http = ('object' === typeof http) ? http : {};
    http.sslHost=config('https.port') || 443;
    ensure.createServer(http).listen(config('http.port') || 80, config('http.address'));
  }
  console.log('Worker Process Started');
}
