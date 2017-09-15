'use strict';

var expect = require('chai').expect;
var SocketRest = require('../index');

// Spin test server
var io = require('socket.io').listen(1234);

// Client
var ioc = require('socket.io-client');
var socketURL = 'http://0.0.0.0:1234';

describe('#socket-rest', function() {
    // Setup socket rest with socket.io
    var socketRest = new SocketRest();
    io.use(socketRest.router);

    describe('GET verb expressions', function () {
        // Register get route    
        socketRest.get('/users/:id', function(req, socket, isAdmin, callback) {
            expect(req.params.id).to.equal('4');
            expect(isAdmin).to.equal(false);
            
            callback();
        });

        it('should handle get', function(done) {
            // Connect client and request route
            var client = ioc.connect(socketURL);

            client.on('connect', function() {
                client.emit('/users/4/get', false, function(){
                    done();
                }); 
            });
        });

        it('should handle read', function(done) {
            // Connect client and request route
            var client = ioc.connect(socketURL);

            client.on('connect', function() {
                client.emit('/users/4/read', false, function(){
                    done();
                }); 
            });
        });
    });

    describe('POST verb expressions', function () {
        // Register post route    
        socketRest.post('/photos', function(req, socket, callback) {
            expect(req.query.crop).to.equal('true');
            
            callback();
        });

        it('should handle post', function(done) {
            // Connect client and request route
            var client = ioc.connect(socketURL);

            client.on('connect', function() {
                client.emit('/photos/post?crop=true', function(){
                    done();
                }); 
            });
        });

        it('should handle create', function(done) {
            // Connect client and request route
            var client = ioc.connect(socketURL);

            client.on('connect', function() {
                client.emit('/photos/create?crop=true', function(){
                    done();
                }); 
            });
        });
    });

    describe('PUT verb expressions', function () {
        // Register put route    
        socketRest.put('/users/:userId/photos/:photoId', function(req, socket, newUrl, callback) {
            expect(req.params.userId).to.equal('4');
            expect(req.params.photoId).to.equal('1');
            expect(req.query.crop).to.equal('false');
            expect(newUrl).to.equal('/new-image-path');

            callback();
        });

        it('should handle put', function(done) {
            // Connect client and request route
            var client = ioc.connect(socketURL);

            client.on('connect', function() {
                client.emit('/users/4/photos/1/put?crop=false', '/new-image-path', function(){
                    done();
                }); 
            });
        });

        it('should handle update', function(done) {
            // Connect client and request route
            var client = ioc.connect(socketURL);

            client.on('connect', function() {
                client.emit('/users/4/photos/1/update?crop=false', '/new-image-path', function(){
                    done();
                }); 
            });
        });
    });

    describe('DELETE verb expressions', function () {
        // Register delete user photo route    
        socketRest.delete('/users/:userId/photos/:photoId', function(req, socket, callback) {
            expect(req.params.userId).to.equal('4');
            expect(req.params.photoId).to.equal('1');

            callback();
        });

        // Register delete user route    
        socketRest.delete('/users/:userId', function(req, socket, callback) {
            expect(req.params.userId).to.equal('4');

            callback();
        });

        it('should handle delete', function(done) {
            // Connect client and request route
            var client = ioc.connect(socketURL);

            client.on('connect', function() {
                // Delete user photo
                client.emit('/users/4/photos/1/delete', function(){
                    // Delete user
                    client.emit('/users/4/delete', function(){
                        done();
                    }); 
                }); 
            });
        });
    });
});