/*
** © 2012 by YOUSURE Tarifvergleich GmbH
*/

module.exports = setup;

function setup(app) {
  app.use(app.get('express').compress());
}

function start(compress, req, res, next) {
  if (req.isSpdy) return next();
  compress(req, res, next);
}
