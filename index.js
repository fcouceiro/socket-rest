'use strict';

var URL = require('url-parse');
var UrlPattern = require('url-pattern');
var path = require('path');
var debug = require('debug')('socket-rest');

function SocketRest() {
    var self = this;

    // Routes holder
    var routes = {
        POST: [],
        GET: [],
        PUT: [],
        DELETE: []
    };

    // Default verbs
    var verbs = {
        POST: ['create', 'post'],
        GET: ['read', 'get'],
        PUT: ['update', 'put'],
        DELETE: ['delete']
    };

    // Route pattern
    var routeUrlPattern = new UrlPattern('*/:verbExpression');

    function evalVerb(verbExpression) {
        var allVerbs = Object.keys(verbs);

        for (var i = allVerbs.length - 1; i >= 0; i--) {
            var knownExpressions = verbs[allVerbs[i]];
            if(knownExpressions.includes(verbExpression)){
                return allVerbs[i];
            }
        }
    }

    function isVerbValid(verb) {
        return verb in verbs;
    }

    function parseRoute(route) {
        // Strip path and query
        var url = new URL(route, true);
        var fullRoute = url.pathname;
        var query = url.query;

        // Match resource and verb
        var routeMatch = routeUrlPattern.match(fullRoute);
        if(!routeMatch){
            return null;
        }

        var resource = routeMatch._;
        var verbExpression = routeMatch.verbExpression;

        return {
            query: query,
            resource: resource,
            verbExpression: verbExpression
        };
    }

    // -- API --

    self.add = function (verb, routeExpression, routeFn) {
        if (!isVerbValid(verb) || !routeExpression || typeof routeFn !== "function"){
            throw new Error('Failed to create route');
        }

        // Store route in appropriate verb array
        routes[verb].push({
            pattern: new UrlPattern(routeExpression),
            routeFn: routeFn
        });
    };

    self.post = function (routeExpression, routeFn) {
        self.add('POST', routeExpression, routeFn);
    };

    self.get = function (routeExpression, routeFn) {
        self.add('GET', routeExpression, routeFn);
    };

    self.put = function (routeExpression, routeFn) {
        self.add('PUT', routeExpression, routeFn);
    };

    self.delete = function (routeExpression, routeFn) {
        self.add('DELETE', routeExpression, routeFn);
    };

    function dispatch(routeExpression, payloadArgs, socket) {
        // Parse route
        var route = parseRoute(routeExpression);
        if(!route){
            debug("Invalid route", routeExpression);
            return;
        }


        // Eval verb
        var verb = evalVerb(route.verbExpression);
        if(!isVerbValid(verb)){
            debug("Invalid verb", route.verbExpression);
            return;
        }

        debug(verb, routeExpression);

        // Find matching route
        var verbRoutes = routes[verb];
        for (var i = verbRoutes.length - 1; i >= 0; i--) {
            var routeCandidate = verbRoutes[i];

            // Check if route matches
            var resourceMatch = routeCandidate.pattern.match(route.resource);

            // Fire route function
            if(resourceMatch){
                // Create request information holder
                var req = {
                    query : route.query,
                    params : resourceMatch,
                    resource : route.resource
                };

                // Create route fn args array (including the socket)
                var args = [
                    req,
                    socket
                ];
                args = args.concat(payloadArgs); // Concats any payload args from the client call

                // Dispatch
                routeCandidate.routeFn.apply(routeCandidate.routeFn, args);
                return true;
            }
        }

        debug(routeExpression, "not found");
        return false;
    };

    // Middleware for Socket.IO
    self.router = function(socket, next) {
        socket.use(handlePacketMiddleware.bind(socket));
        return next();
    };

    // Dispatch each incoming packet event to the router.
    // If an appropriate route is available its callback function
    // will be fired, passing an object with the request information,
    // the socket for response and the provided payload data
    function handlePacketMiddleware(packet, next){
        if(dispatch(packet[0], packet.slice(1), this)){
            debug('⇒ handled with socket-rest');
        }

        return next();
    };

    debug('Initialized');
    return self;
}

module.exports = SocketRest;