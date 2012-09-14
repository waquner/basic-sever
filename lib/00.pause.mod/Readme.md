# pause.mod

This pauses the request stream, so that async stuff is possible without loosing data. However this means that if you want the body data, you need to:

    req.resume();

