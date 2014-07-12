/*jslint  devel: true,  node: true, vars: true, todo: true, white: true, nomen: true, unparam:true */
/*global  */
/* jshint strict: true  */
"use strict";

// todo - make work with no linkedin  for auth 
// todo - check security that have auth on all needed things

var ws = require('ws');
var wss = ws.Server;
var http = require('http');
var express = require('express');
var serveStatic = require('serve-static');
var serveIndex = require('serve-index');

var app = express();

var amqp = require('amqp'); // RabbitMQ
var url = require('url');
var morgan  = require('morgan'); // logger for express 

var fs = require('fs');

var mongoose = require('mongoose');
var db = mongoose.connection;

var config = require('./secret.json');

var responseTime = require('response-time');
var session = require('express-session');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

//var NodeCache = require( "node-cache" );
//var localCache = new NodeCache( { stdTTL: 10*60, checkperiod: 60 } );

var RedisStore = require('connect-redis')(session);

var redis = new RedisStore({ url: config.redisUrl });

// RabitMQ stuff
var wss = null;
var rabbitMsgBus = null;
var exchange = null;



/************ Serve up static files *******/

var devMode = false;

var bundleVersion = "0.0.0";
var bundlePath = "/bad";

// big warning - the order of the app.use fucntions in this file matters

app.use(responseTime(5));

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

app.use(cookieParser( config.cookieSecret)); 

app.use( session({ store: redis, secret: config.sessionSecret }) ); 

/********** redis  *************/

redis.on( "connect" , function () {
    console.log("Connected to Redis server");
});

redis.on( "disconnect" , function () {
    console.log("Error: Redis server disconnected");
});


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

    exchange.publish('',  JSON.stringify( msg ) );
    console.log( "published" + JSON.stringify( msg ) );
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

/****** Server and WS Server ***/


var server = http.createServer(app);
server.listen(8080);
console.log('Listening on: http://localhost:' + server.address().port );

function rabbitInit() {
    wss = new ws.Server( {server: server} );
    
    rabbitMsgBus = amqp.createConnection({url: config.rabbitMQUrl,
					  heartbeat:5 });

    rabbitMsgBus.on('ready', function(){
        console.log( 'Connected to RabbitMQ' );

	rabbitMsgBus.exchange('logs', {type: 'fanout', autoDelete: false },
			      function(newExchange){
				  exchange = newExchange;
				  console.log( "MsgBus exch ready" );
			      } );
    });

    rabbitMsgBus.on('close', function(err){
        console.log( 'RabbitMQ closed: ' + err );

        process.exit(1); // todo 
    });

    rabbitMsgBus.on('error', function(err){
        console.log( 'RabbitMQ Error: ' + err );

        process.exit(1); // todo 
    });

    wss.on('connection', function(ws) {
        ws.on('message', function( msgString ) {
            //console.log('got message from client: ' + msgString );
	    var msg = {};
	    try {
		msg = JSON.parse( msgString );
	    }
	    catch (e) {
		console.log( "bad msg from client: " + msgString );
		return;
	    }
            console.log( "Client ws send: " + JSON.stringify(msg) );
	    //processMesssage( msg ); // todo - use post for upload 
            //exchange.publish('', msgString ); // todo revove
        });
        ws.on('close', function() {
            console.log('websocket got close');
        });
        rabbitMsgBus.queue('tmp-' + Math.random(), {exclusive: true}, function(queue){
            queue.bind('logs', '');
            console.log(' bound to mq ');
            
            queue.subscribe( function(msg) {
                //console.log("from mq got %s", msg.data.toString('utf-8'));
                try {
                    ws.send(  msg.data.toString('utf-8') );
                }
                catch ( e ) {
                    console.log( "WS failed to send: " + e );
                    queue.destroy();
                    ws.terminate();
                }
            });
        });
    });
}

rabbitInit(); // reset does not work but first time does - todo 
