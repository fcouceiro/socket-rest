# socket-rest
A router for socket.io that handles events in a RESTful style

## Installation

  `npm install socket-rest`

## Usage

### Server
    var socketRest = require('socket-rest')();

    // Register socket rest router as socket.io middleware
    io.use(socketRest.router);

    // Use express-like router methods to define your routes
    socketRest.put('/users/:id/photos/:photoId', function (req, socket) {
    	console.log(req); // req will have path params and query params
    });

    // Use the socket instance to emit-back to clients
    socketRest.delete('/users/:id', function (req, socket, isSoftDelete) {
    	socket.emit('user:deleted', req.params.id); 
    });

### Client
    // Suffix the route with a verb expression
    socket.emit('/users/2/delete', true); // isSoftDelete will be true
    
### Verb expressions

The verb can be specified by suffixing the route with a verb expression. Several verb expressions can translate to one HTTP verb:

| Verb expressions | HTTP Verb |
|------------------|-----------|
| get, read        | GET       |
| post, create     | POST      |
| put, update      | PUT       |
| delete           | DELETE    |
    


## Tests

  `npm test`

## Contributing

In lieu of a formal style guide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code.
