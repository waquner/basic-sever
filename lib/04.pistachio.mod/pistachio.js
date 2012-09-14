/*
** © 2012 by YOUSURE Tarifvergleich GmbH
*/

module.exports = setup;

var pistachio = require('pistachio');
function setup(app) {
  app.engine('pistachio', pistachio.express);

  var config = app.get('config');
  var engine = config('views.engine');
  var views = config.$path('views.path');
  var cache = config('views.cache');
  if (engine === 'pistachio') {
    app.set('view engine', 'pistachio');
    app.set('views', views);
    app.set('cachePistachios', cache?true:false);
  }
}
