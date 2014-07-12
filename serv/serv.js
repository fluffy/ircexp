/*jslint  devel: true,  node: true, vars: true, todo: true, white: true, unparam:true */

var http = require('http');
var express = require('express');
var serveStatic = require('serve-static');
var app = express();

/************ Serve up static files *******/

app.use( "/lib", serveStatic( __dirname + "/lib/." ) );

/********** HTML web page calls ******/

app.get('/', function(req, res){
    res.sendfile( __dirname + "/main.gen.html" ); 
});

app.get('/main.gen.css', function(req, res){
    res.sendfile( __dirname + "/main.gen.css" ); 
});

app.get('/main.js', function(req, res){
    res.sendfile( __dirname + "/main.js" ); 
});

/****** Server *********************/

var server = http.createServer(app);
server.listen(8080);
console.log('Listening on: http://localhost:' + server.address().port );

