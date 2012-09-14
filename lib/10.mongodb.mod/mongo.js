/*
** © 2012 by YOUSURE Tarifvergleich GmbH
*/

module.exports = setup;

var mongo = require('mongo-simple');

function setup(app) {
  var config = app.get('config')('database');
  var db = config ? mongo(config, config.name) : dummy();
  db.on('error', app.log);
  app.set('database',db);
}

function dummy() {
  var obj={};
  Object.defineProperty(obj, 'name', { value:'not-available' });
  Object.defineProperty(obj, 'find', { value:dummy.errOp });
  Object.defineProperty(obj, 'update', { value:dummy.errOp });
  Object.defineProperty(obj, 'upsert', { value:dummy.errOp });
  Object.defineProperty(obj, 'insert', { value:dummy.errOp });
  Object.defineProperty(obj, 'remove', { value:dummy.errOp });
  Object.defineProperty(obj, 'file', { value:dummy.errOp });
  Object.defineProperty(obj, 'unlink', { value:dummy.errOp });
  var emitter = new EventEmitter();
  Object.defineProperty(obj, 'on', { value:emitter.on.bind(emitter) });
  Object.defineProperty(obj, 'emit', { value:emitter.emit.bind(emitter) });
  return obj;
}
dummy.errOp = function() {
  var res = dummy.dummy(arguments.length ? arguments[arguments.length - 1] : undefined);
  process.nextTick(res.complete);
  return res;
};
dummy.dummy = function handler(cb) {
  var store=[];

  store.push(cb);
  Object.defineProperty(store, 'done', { value:function() {} });
  Object.defineProperty(store, 'fail', { value:store.push.bind(store) });
  Object.defineProperty(store, 'always', { value:store.push.bind(store) });
  Object.defineProperty(store, 'complete', { value:dummy.dummy.complete.bind(store) });

  return store;
};
dummy.dummy.complete = function() {
  this.filter(function(cb) { return 'function' === typeof cb; }).forEach(function(cb) {
    cb(new Error('Not Available'));
  });
};
