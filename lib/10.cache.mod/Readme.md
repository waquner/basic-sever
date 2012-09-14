# cache.mod

This caches responses in memcached transparently.

## Configuration

    {
      "cache":{
        "status":[ 200 ],
        "types":[ "text/html", "text/css", "text/javascript", "application/javascript" ],
        "patterns":[ "*" ],
        "server":"127.0.0.1:11211",
        "expiration":30
      }
    }

 * *status* - an array of HTTP-Status codes that can be cached
 * *types* - an array of MIME-Types that can be cached
 * *patterns* - an array of patterns to cache (either a string or an object { expression:"regex-string", flags:"regex-flags" })
 * *server" - a string that defines the MemcacheD server
 * *expiration" - an integer that tells how many seconds to cache a page
