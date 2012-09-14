# proxy.mod

This is a reverse proxy module to forward requests to other servers.

## Configuration

    {
      "proxy": {
        "/artikel*": {
          "requestHeaders": {
            "Host": "durchblicker.at",
            "Origin": "https://durchblicker.at",
            "Referer": {
              "^https?://[^/]+/": "https://durchblicker.at/"
            }
          },
          "responseFilter": {
            "https?:\/\/durchblicker.at/": "/"
          },
          "ssl": false,
          "host": "wordpress.durchblicker.at",
          "port": 2020
        }
      }
    }

*proxy* is an object that contains the URL-patterns to proxy as the *keys*. The *values* are the routes to proxy to.

 * *requestHeaders* - an object-hash that contains request headers to replace. Either as a *RegExp* or a fixed string
 * *responseFilter* - an object-hash that contains *RegExp* replacements to run over the content
 * *ssl* - *boolean* that decides on *HTTP* vs. *HTTPS*
 * *host* - the host to proxy to
 * *port* - the port to proxy to
 * *view* - the view to render with the repsonse as { "content":"&lt;the-proxied-content&gt;" }
