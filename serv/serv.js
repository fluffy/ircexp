/*jslint  devel: true,  node: true, vars: true, todo: true, white: true, unparam:true */

var http = require('http');
var express = require('express');
var serveStatic = require('serve-static');
var app = express();
var mongoose = require('mongoose');
var db = mongoose.connection;
var bodyParser = require('body-parser');


/************ Serve up static files *******/

app.use( "/lib", serveStatic( __dirname + "/lib/." ) );

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

mongoose.connect( "mongodb://localhost/fluffyTest1" ); 

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

