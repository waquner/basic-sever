# api.mod

Registers API modules and catches errors in them. It then handles the errors by outputing a JSON document as a response.

## Configuration

    {
      "api":{
        "prefix":"/api",
        "modules":"../api/lib/api",
        "extension":".api"
      }
    }

 * *prefix* - the URL-Prefix that the API should be located under (default :/api)
 * *modules* - the directory where the modules are located (default: ../api (relative to the module))
 * *extension* - the extension the modules should have (default: .api)

**Error Messages**

    {
      "errors": {
        "404": "Ooooops! The Page you were looking for is not there",
        "500": "Ooooops! We made a blunder. Please try again later"
      }
    }

Uses this for the error-messages in error-handling, depending on *err.status*.
