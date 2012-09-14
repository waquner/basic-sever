/*
** © 2012 by YOUSURE Tarifvergleich GmbH
*/

module.exports = setup;

var os = require('os');
var fs = require('fs');

function setup(app) {
  var config = app.get('config')('status');
  if (!config) return;
  app.set('status', {});
  app.on('status', status);
  setInterval(update.bind(app,app), 30000);
  update.call(app,app);
}

function status(sender, stat) {
  var current = this.get('status');
  current.modified=new Date();
  Object.keys(stat).forEach(function(key) { current[key]=stat[key]; });
  this.set('status', current);
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

var hasRaid;
function raid(callback) {
  if (hasRaid===false) return callback([]);
  fs.readFile('/proc/mdstat', function(err, val) {
    if (err) {
      hasRaid = hasRaid || false;
      return callback([]);
    }
    hasRaid=true;
    val = val.toString('utf-8').split('\n\n').map(function(item) {
      item = item.split('\n');
      while (item.length > 2) item.shift();
      var raid = item.shift().split(' : ');
      var stat = item.shift().replace(/^\s*|\s*$/g,'').split(' ');
      if (raid.length != 2) return undefined;
      var name = raid.shift();
      raid = raid.shift().split(' ');
      var res = {};
      res.name = name;
      res.state = raid.shift();
      res.type = raid.shift();
      res.devices = raid.map(function(dev) {
        dev = dev.replace(/\[\d+\]/,'');
        return { name:dev };
      });
      res.size = stat.shift();
      stat = stat.slice(2);
      res.superVersion = stat.shift();
      var astat = stat.shift().replace(/^\[|\]$/g,'').split('/');
      res.should = astat.shift();
      res.have = astat.shift();
      stat.shift().replace(/^\[|\]$/g,'').split('').forEach(function(state, idx) {
        switch(state) {
          case 'U': state='active'; break;
          case '_': state='missing'; break;
          case 'F': state='failed'; break;
        }
        if (res.devices[idx]) res.devices[idx].state = state;
      });
      return res;
    }).filter(function(item) {
      return item;
    });

    callback(undefined, val);
  });
}

function update(app) {
  var status = {};

  // Process
  var pstat = status[process.pid] = {};

  pstat.title = process.title;
  pstat.process = process.pid;
  pstat.hostname = os.hostname();
  pstat.uptime = process.uptime();
  pstat.versions = process.versions;
  pstat.user = process.getuid();
  pstat.group = process.getgid();
  pstat.arch = process.arch;
  pstat.cwd = process.cwd();
  pstat.args = process.argv.slice(2);
  pstat.umask = process.umask();
  pstat.memory = process.memoryUsage();

  // System
  status.system = {};
  status.system.architecture = os.arch();
  status.system.os = os.type();
  status.system.plattform = os.platform();
  status.system.release = os.release();
  status.system.uptime = os.uptime();
  status.system.memory = {};
  status.system.memory.total = os.totalmem();
  status.system.memory.free = os.freemem();
  status.system.cpus = os.cpus().map(function(cpu) {
    var res = {};
    res.model = cpu.model;
    res.speed = cpu.speed;
    var ops = 0;
    Object.keys(cpu.times).forEach(function(key) { ops += cpu.times[key]; });
    res.load = {};
    res.load.idle = cpu.times.idle / ops;
    res.load.user = cpu.times.user / ops;
    res.load.system = cpu.times.sys / ops;
    res.load.nice = cpu.times.nice / ops;
    res.load.irq = cpu.times.irq / ops;
    return res;
  });
  status.system.load = os.loadavg().shift();// / status.system.cpus.length;
  var net = os.networkInterfaces();
  status.system.network = {};
  Object.keys(net).forEach(function(iface) {
    var addr = net[iface].filter(function(addr) { return !addr.internal && (addr.family==='IPv4'); }).map(function(addr) { return addr.address; });
    if (addr.length) status.system.network[iface] = addr.shift();
  });
  var primary = Object.keys(net).filter(function(iface) {
    return iface.indexOf(':') < 0;
  }).sort().shift();
  status.system.network.primary = !primary ? undefined : status.system.network[primary];

  // Send Off
  raid(function(raid) {
    status.system.raid = raid;
    var all = app.get('status');
    all[serverIP]=status;
    app.broadcast('status', all);
  });
}
