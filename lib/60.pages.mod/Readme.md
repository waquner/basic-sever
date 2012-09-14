# pages.mod

Renders pages from static JSON files.

## Configuration

    "static":{
      "root":"static",
      "maxAge":60
    }

* *root* - where are the JSON files
* *maxAge* - seconds in the future that the *Expires* header should be set to
