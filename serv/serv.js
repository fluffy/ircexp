/*jslint  devel: true,  node: true, vars: true, todo: true, white: true, nomen: true, unparam:true */
/*global  */
/* jshint strict: true  */
"use strict";

// todo - make work with no linkedin  for auth 
// todo - check security that have auth on all needed things

var http = require('http');
var express = require('express');
var serveStatic = require('serve-static');
var serveIndex = require('serve-index');
var app = express();
var url = require('url');
var morgan  = require('morgan'); // logger for express 
var fs = require('fs');
var mongoose = require('mongoose');
var db = mongoose.connection;
var config = require('./secret.json');
var bodyParser = require('body-parser');


/************ Serve up static files *******/

var devMode = false;

var bundleVersion = "0.0.0";
var bundlePath = "/bad";

fs.readFile(__dirname + "/" + "package.json", function (err, file) {
    if (err) {
        console.log("Problem reading config package.json");
    }
    var config = JSON.parse( file );
    console.log( "sink version:" + config.version );

    bundleVersion = config.version;

    if ( devMode ) {
        bundlePath = '/static-dev/bundle'+bundleVersion;
    } else {
        bundlePath ='/static/bundle'+bundleVersion;
    }
             
    if ( devMode ) {
        app.use( '/static-dev', serveIndex( __dirname+'/static-dev/') );
    }
    app.use( bundlePath, serveStatic( __dirname+bundlePath) );
} );

process.argv.slice(2).forEach( function(val /* , index, array*/ ) {
    // console.log(index + ': ' + val);
    if ( ( val === '-dev' ) ||  ( val === '--dev' ) )
    {
	console.log( "In development mode" );
	devMode = true;
    }
});

/********* DataBase ********/

var elementSchema = mongoose.Schema({
    rid: { type: String, index: true, required:true, unique: true  },
    creationTime: Number, // ms since unix epoch
    creatorUId: String, // coresponds to uID in userDocSchema
    creatorDisplayName: String,

    // docID: { type: String, index: true, required:true, unique: true  },
    type: String, // frag, marker, para, ...

    prev: { type: String, required:true },
    prevModTime: Number, 

    dead: Boolean,
    deadModTime: Number, 

    style: String, 
    styleModTime: Number, 

    text: String, 
    content: String, // text, image, audio, video (text field is URI pointing at data )

    iconURL: String
});

var Element = mongoose.model('Element', elementSchema);

db.on('error', function() {
    console.log( "Error connecting to mongodb" );
    process.exit(1); // todo 
});

db.once('open', function() {
    console.log( "Connected to mongodb" );
});

mongoose.connect( config.mongoUrl ); 

app.use(function(req,res,next){
    req.db = db;
    next();
});


/*********** Middleware ************/

app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(bodyParser.json());

app.use(bodyParser.json({ type: 'application/vnd.api+json' }));

app.use( morgan('dev') ); 

/********** Handle Messages ***************/

function processMesssage( msg ) {
    if ( msg.operation === 'new' ) {
	var e = new Element( msg );

	e.save( function(err, elem) { // TODO - deal with no save on dups 
	    if (err) {
		console.log( "problem saving to db: " + err );
	    } 
            else {
		console.log( "create new element in db was OK" );
	    }
	});
    } 
    else if ( msg.operation === 'kill' ) {
	Element.update( { rid: msg.rid }, 
                        { $set: { dead: msg.dead, deadModTime: msg.deadModTime }},  
                        function(err, elem) { // TODO - deal with no save on dups 
	                    if (err) {
		                console.log( "problem killing elem in db: " + err );
	                    } 
                            else {
		                console.log( "kill elem in db was OK" );
	                    }
	                });
    }  
    else if ( msg.operation === 'style' ) {
	Element.update( { rid: msg.rid }, 
                        { $set: { style: msg.style, styleModTime: msg.styleModTime }},  
                        function(err, elem) { // TODO - deal with no save on dups 
	                    if (err) {
		                console.log( "problem setting style for elem in db: " + err );
	                    } 
                            else {
		                console.log( "set style in db was OK" );
	                    }
	                });
    } 
    else {
        console.log( "Unknown operation of: " + msg.operation );
    }
}

/******* API Calls *****/

app.get('/v1/rids', function(req,res) {
    var db = req.db;

    Element.find().lean().sort('creationTime').exec( function (err, result) {
        var e,o;
	var data = [];
	if (err) {
	    console.log( "Error reading from db: " + err );
	}
	
	for( e in result ) {
            if ( result.hasOwnProperty( e ) ) {
	        o = result[e];
	        delete o._id; //delete o["_id"];
	        delete o.__v; //delete o["__v"];
	        data.push( o );
            }
	}
	
	res.send( JSON.stringify( data ) );
    });
});

app.post('/v1/update',  function(req, res){  
  
    processMesssage( req.body );

    res.send( JSON.stringify( { status: "OK" } )  );
});

/********** HTML web page calls ******/

app.get('/', function(req, res){
    res.redirect('/doc/test');
});

app.get('/doc/:docName', function(req, res){
    res.sendfile( __dirname + bundlePath + "/html/main.gen.html" ); 
});

/****** Server *********************/

var server = http.createServer(app);
server.listen(8080);
console.log('Listening on: http://localhost:' + server.address().port );

