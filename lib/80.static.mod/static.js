/*
** © 2012 by YOUSURE Tarifvergleich Gmbh
*/

module.exports = setup;

function setup(app) {
  var config = app.get('config');
  config('static.root', config.$path('static.root'));
  config=config('static');
  config.maxAge = config.maxAge || 0;
  config.redirect = false;
  var staticServer=app.get('express')['static'](config.root, config);
  app.use(staticServer);
}
