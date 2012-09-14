# pistachio.mod

This enables [pistachio](https://github.com/phidelta/pistachio) views within *app.render()* and *res.render()*.

## Configuration

    "views":{
      "engine":"pistachio",
      "path":"templates",
      "cache":false
    }

 * *engine* - if this is "pistachio" then it registers pistachio as the default renderer and applies the "cache" flag
 * *path* - where the templates are. (Only registered if *engine*=="pistachio")
 * *cache* - whether to cache the evaled templates. (Only registered if *engine*=="pistachio")
