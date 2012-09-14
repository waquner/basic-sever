# errors.mod

This displays an appropriate error page when an error occurs in a handler.

## Configuration

    {
      "errors": {
        "404": "Ooooops! The Page you were looking for is not there",
        "500": "Ooooops! We made a blunder. Please try again later"
      }
    }

Uses this for the error-messages in error-handling, depending on *err.status*.
