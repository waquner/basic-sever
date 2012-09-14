# handlers.mod

Enables handlers to be loaded from an external source

## Configuration

    {
      "handlers":{
        "modules":"path to modules",
        "extension":".handler"
      }
    }

 * *modules* - the path to your handler modules
 * *extension* - the extension your modules have

Each plugin needs to export a function that is called as *handler(app)*
