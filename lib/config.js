/*
** © 2012 by YOUSURE Tarifvergleich Gmbh
*/

module.exports = Config;

var fs=require('fs');
var path=require('path');

function Config(file) {
  var ctx={};

  var obj = ProtoProperty.bind(ctx, ctx);

  ctx.configFile=path.resolve(file);
  ctx.configBase=path.dirname(ctx.configFile);
  ctx.data=JSON.parse(fs.readFileSync(ctx.configFile, 'utf-8'));
  ctx.content={};

  Object.defineProperty(obj, '$path', { value:ProtoPath.bind(obj, ctx) });
  Object.defineProperty(obj, '$content', { value:ProtoContent.bind(obj, ctx) });

  return obj;
}

function ProtoProperty(ctx, property, value) {
  if (!property) {
    return ctx.data;
  }
  if ('undefined' !== typeof value) {
    var name = property.split('.');
    var data = ctx.data;
    while (name.length > 1) {
      if ('undefined' === typeof data[name[0]]) {
        data[name[0]] = {};
      }
      data = data[name[0]];
      name.shift();
    }
    data[name[0]] = value;
  }
  property = '["'+property.split('.').join('"]["')+'"]';
  try {
    return (new Function('ctx','return ctx.data'+property))(ctx);
  } catch(ex) {
    //console.error(ex.stack);
  }
  return undefined;
}

function ProtoPath(ctx, property) {
  try {
    return path.resolve(ctx.configBase, this(property));
  } catch(ex) {
    console.error(ex.stack);
    return undefined;
  }
}

function ProtoContent(ctx, property, encoding) {
  try {
    return fs.readFileSync(this.$path(property), encoding);
  } catch(ex) {
    //console.error(ex.stack);
    return undefined;
  }
}
