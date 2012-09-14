# plugins.mod

Enables plugins to be loaded from an external source

## Configuration

    {
      "plugins":{
        "modules":"path to modules",
        "extension":".plugin"
      }
    }

 * *modules* - the path to your plugin modules
 * *extension* - the extension your modules have

Each plugin needs to export a function that is called as *plugin(app)*
