/*jslint  browser: true, devel: true,  vars: true, todo: true, white: true, bitwise: true */
/*global  $,WebSocket */
/* jshint strict: true, jquery: true */

var Fluffy;
Fluffy = Fluffy || {}; // setup namespace


Fluffy.Edit = (function () {
    "use strict";

    var trackSinceTime = 1;
    var userName = "Fluffy";
    var userPhotoUrl = "fluffy.jpg";
    var docName;
    var docRidStart;
    var docRidEnd;
    var webSocketConnection = null; // websocket connection to server 


    /* functions used to add things to the DOM */

    function viewNewPara( elem ) {
	var span=null,prevDiv,newDiv;

	//console.log( "In viewNewPara" );
	console.assert(  elem.type === 'para' );

	if ( $( 'span#' + elem.rid ).length > 0 ) {
            // duplicate add to view 
            console.log( "Got dup in viewNewPara" );
            return;
	}
	
	if ( elem.dead ) {
            //span = $( "<span id='" + elem.rid + "'> &para; </span>" );
            span = $( "<span id='" + elem.rid + "'></span>" );
            span.addClass(  elem.style ); 
	    span.addClass( 'dead' ); 
            $( 'span#' + elem.prev ).after( span );
	} 
        else {
            prevDiv = $( 'span#' + elem.prev ).parent();
            
            newDiv = $( "<div id='" +  elem.rid + "'>" + "</div>" );
            newDiv.addClass(  elem.style ); 
            prevDiv.after( newDiv );

            span = $( "<span id='" +  elem.rid + "'></span>" );
            span.addClass( 'paraMarker' ); 
            newDiv.prepend( span );
            
	    var space =  $( "<div></div>" );
	    space.addClass( 'note-space' );
	    newDiv.prepend( space );

	    var d = new Date( elem.creationTime );
	    var time =  $( "<div>" + d.toLocaleTimeString() + "</div>" );
	    time.addClass( 'note-time' );
	    newDiv.prepend( time );

	    var name =  $( "<div>" +elem.creatorDisplayName+ "</div>" );
	    name.addClass( 'note-name' );
	    newDiv.prepend( name );
	    
	    var icon = $( "<img src='"+elem.iconURL+"'></span>" );
	    icon.addClass( 'note-icon' );
	    newDiv.prepend( icon );
	    
            // take spans after split point and put in newDiv
            var spans = $( 'span#' + elem.prev ).nextAll(); 
	    newDiv.append( spans );
	}
	
	if ( span !== null ) {
	    span.click( function (e) { 
		//console.log( "event click on: " +  e.target.id  );
		cursorUpdate( e.target.id );
	    });
	}
    }


    function viewNewFrag( elem ) {
	//console.log( "In viewNewFrag" );
	console.assert( elem.type === 'frag' );

	//var span =  $( 'span#' + elem.rid );
	//console.log( span );

	if ( $( 'span#' + elem.rid ).length > 0 ) {
            // duplicate add to view 
            console.log( "Got dup in viewNewFrag" );
            return;
	}

	var span=null;

	if ( elem.content === 'text' ) {
            span = $( "<span id='" + elem.rid + "'>" + elem.text + "</span>" );
	}
	else if  ( elem.content === 'image' ) {
            span = $( "<span id='" + elem.rid + "'><img src='" + elem.text + "' height='24' width='24'></span>" );
	}
	else {
            console.log( "Unknown content of " + elem.content ); // todo 
	    console.log( "Elem = " + JSON.stringify( elem ) );
	}

	$( 'span#' + elem.prev ).after( span );
	viewChangeStyle( elem );

	if ( span ) {
	    span.click( function (e) { 
		console.log( "event click on: " +  e.target.id  );
		cursorUpdate( e.target.id );
	    });
	    span.mousedown( function (e) { 
		console.log( "event mouse down: " +  e.target.id  );
		cursorUpdateStart( e.target.id );
	    });
	    span.mouseup( function (e) { 
		console.log( "event mouse up: " +  e.target.id  );
		cursorUpdateEnd( e.target.id );
	    });
	}
    }

    function viewChangeStyle( elem ) { 
	//console.log( "In viewChangeStyle" );
	var object=null;

	//console.log( "elem=" + JSON.stringify( elem ) );

	if ( elem.type === 'para' ) {
            object = $( 'div#' + elem.rid );
	} else if  ( elem.type === 'frag' ) {
            object = $( 'span#' + elem.rid );
	}

	object.removeClass().addClass( elem.style ); 

	if ( elem.dead) {
	    if ( elem.creationTime < trackSinceTime ) {
		object.addClass( 'dead' ); 
            } else {
		object.addClass( 'old' ); 
            }
	} else {
	    if ( elem.creationTime < trackSinceTime ) {
		object.addClass( 'not-dead' ); 
            } else {
		object.addClass( 'new' ); 
            }
	}
    }

    function viewKillElement( elem ) {
	console.log( "In viewKillElement" );

	if ( elem.creationTime < trackSinceTime ) {
            $( 'span#' + elem.rid ).addClass( 'dead' );
	} else {
            $( 'span#' + elem.rid ).addClass( 'old' );
	}

	// TODO - make it so can kill para too (remove div, keep span dead )
    }


    /* functions used by local UI to do UI actions and update DOM & Server */


    function modelSendUpdate( elem ) {
	$.post( "/v1/update" , elem ).done( function () {
	    console.log( "update to db is done" );
	}).fail( function ( jqXHR, status) {
	    console.log( "update to db failed: " + status + jqXHR.url  );
	}); 
	//connection.send( JSON.stringify( elem ) );
    }

    function modelLoad() {
	$.ajax({
            url: "/v1/rids"
	}).done( function (data) {
            var i,elements,element;
	    
            elements = JSON.parse( data );
            for ( i in elements ) {
		if ( elements.hasOwnProperty(i)) {
		    element = elements[i];
		    
		    if ( element.type === 'frag' ) {
			viewNewFrag( element ); 
		    } else if ( element.type === 'para' ) {
			viewNewPara( element ); 
		    } else {
			console.log( "Unknown type in load" );
		    }
		}
            }
	}).fail( function (jqXHR,status) {
            console.log( "fetch of document from db failed: " + status + jqXHR.url );
	});
    }

    function modelNewFrag( prevRid, text , content ) {
	var elem = {}; // todo move all elem.foo = into here 

	content = (content !== undefined) ? content : 'text';

	console.log( "In modelNewFrag: " + content + " " + text );

	elem.rid =  'rid' + Math.floor( Math.random() * 1e9 ); 
	elem.creationTime = new Date().getTime();
	elem.type = 'frag';

	elem.prev = prevRid;
	elem.dead = false;
	elem.style = 'text-Plain' ; 

	elem.text = text;
	elem.content = content;

	elem.saved = false;
	localStorage.setItem( elem.rid, JSON.stringify( elem ) );

	/* 
	   var junk =  localStorage.getItem( elem.rid );
	   for (var x in localStorage) { 
           if ( x.substring(0, 3) == "rid") {
           console.log( x );
           }
	   }
	*/

	viewNewFrag( elem );

	elem.operation = 'new';
	modelSendUpdate( elem );


	return elem;
    }

    function getNextParaStyle( rid ) {
	var para = $( 'span#' + rid ).parent();
	var nextStyle = 'para-Body';

	if ( para.hasClass('para-Note') ) { nextStyle = 'para-SubNote'; }
	if ( para.hasClass('para-SubNote') ) { nextStyle = 'para-SubNote'; }
	if ( para.hasClass('para-Bullet') ) { nextStyle = 'para-Bullet'; }
	if ( para.hasClass('para-ListFirst') ) { nextStyle = 'para-ListNext'; }

	return nextStyle;
    }

    function modelNewPara( prevRid ) {
	var elem = {};  // todo move all elem.foo = into here 
	console.log( "In modelNewPara" );

	elem.rid =  'rid' + Math.floor( Math.random() * 1e9 );
	elem.creationTime = new Date().getTime();
	elem.type = 'para';

	elem.prev = prevRid;
	elem.dead = false;
	elem.style = getNextParaStyle( prevRid );

	elem.creatorDisplayName = userName;
	elem.iconURL = userPhotoUrl;
	elem.creationTime = new Date().getTime();

	elem.saved = false;
	localStorage.setItem( elem.rid, JSON.stringify( elem ) );

	viewNewPara( elem );

	elem.operation = 'new';
	modelSendUpdate( elem );
	return elem;
    }

    function modelChangeParaStyle( paraRid, style ) {
	console.log( "In modelChangeParaStyle" );

	var elem = {
            rid:  paraRid,
            type: 'para',
            style: style,
            styleModTime: new Date().getTime(),
            operation: 'style'
	};

	viewChangeStyle( elem );
	modelSendUpdate( elem );

	return elem;
    }

    function modelChangeFragStyle( fragRid, style ) {
	console.log( "In modelChangeTextStyle" );
	
	var elem = {
            rid:  fragRid,
            type: 'frag',
            style: style,
            styleModTime: new Date().getTime(),
            operation: 'style'
	};

	viewChangeStyle( elem );
	modelSendUpdate( elem );

	return elem;
    }

    function modelKillElement( rid ) {
	console.log( "In modelKillElement" );

	var elem = {
            rid: rid,
            dead: true,
            deadModTime: new Date().getTime(),
            operation: 'kill'
	};
	
	viewKillElement( elem );
	modelSendUpdate( elem );

	return elem;
    }

      /* UI code for style menus */ 

    $('#para-menu li a').click(function() {
	var style, p, paras;

	console.log( "Click text = " + $(this).text() );

	//var divRid = $( 'span#' + cursorGetRid() ).parent().attr('id');
	style = "para-" + $(this).text();
	
	paras = getSelectedPara();
	for( p in paras ) {
	    if ( paras.hasOwnProperty( p ) ) {
		modelChangeParaStyle( p, style );
	    }
	}
    });

    $('#text-menu li a').click(function() {
	var frags, style, f;

	console.log( "Click text menu = " + $(this).text() );

	//var selObj = window.getSelection();
	//var range  = selObj.getRangeAt(0); // TODO - check num ranages 
	style = "text-" + $(this).text();

	frags = getSelectedFrag();
	for ( f in frags ) {
	    if ( frags.hasOwnProperty( f ) ) {
		modelChangeFragStyle( f, style );
	    }
	}
    });

    /* cursor managment code ************************************************/ 

    var insertRid = "rid0" ;
    var startRid = "rid0" ;
    var endRid = "rid0" ;

    function cursonInit( rid ) {
	insertRid = startRid = endRid = rid;

	cursorUpdate( rid );
    }

    function getSelectedPara() {
	var para, f, frags;
	var ret = [];
	
	frags =  getSelectedFrag();
	for ( f in frags) {
	    if ( frags.hasOwnProperty( f ) ) {
		para = $( 'span#' + f ).parent().attr('id');
		ret[ para ] = true;
	    }
	}
	return ret;
    }

    function getSelectedFrag() {
	var ret,r;

	ret = [];
	if ( startRid !== endRid ) {
	    r = endRid;
	    while ( r !== startRid )
	    {
		r = getPrevRid( r );
		if ( !r ) { 
		    // something went very wrong 
		    return [];
		}
		ret[r] = true;
	    }
	}
	else
	{
	    ret[insertRid]=true;
	}
	return ret;
    }

    function cursorGetRid() {
	return insertRid;
    }

    function getPrevRid( rid ) {
	var prev;

	prev = $( 'span#' + rid ).prevAll('span:first').attr('id');

	// step from one paragraph to another 
	if ( !prev ) {
	    prev =  $( 'span#' + rid ).parent().prev().find("span").last().attr('id');
	}

	if ( !prev ) {
	    console.log( "problem in getNextRid" );
	    prev = docRidStart; // todo
	}

	// todo - step over dead objects ??? - do I want this or not 
	return prev;
    }

    function getNextRid( rid ) {
	var next;

	console.log( 'rid=' + rid );

	next = $( 'span#' + rid ).nextAll('span:first').attr('id');
	
	// step from one paragraph to another 
	if ( !next ) {
	    next =  $( 'span#'+rid ).parent().next().find("span").first().attr('id');
	}

	if ( !next ) {
	    console.log( "problem in getNextRid" );
	    next = docRidEnd; // todo 
	}

	// todo - step over dead objects ??? - do I want this or not 
	return next;
    }

    function cursorUpdateStart( rid ) {
	if (  startRid !== endRid ) {
	    // unslect old selection
	    $( 'span' ).removeClass( 'selected' );
	}
	startRid = rid;
	endRid = rid;
    }

    function cursorUpdateEnd( rid ) {
	var r,tmp;

	endRid = rid; 

	if ( startRid !== endRid ) {
	    // todo , swap start , end if in wrong order - bug 
	    r = endRid;
	    while ( r !== startRid )
	    {
		r = getPrevRid( r );
		if ( !r ) {
		    // swap order and end
		    tmp = endRid; endRid = startRid; startRid = tmp;
		    r = startRid;
		}
	    }

	    // select stuff 
	    r = endRid;
	    while ( r !== startRid )
	    {
		console.log( 'selected ' + r );
		$( 'span#' + r ).addClass( 'selected' );
		r = getPrevRid( r );
		if ( !r ) { 
		    // something went very wrong 
		    console.log( 'something wrong in selection' );
		    cursorUpdateStart( rid );
		    return;
		}
	    }
	    $( 'span#' + r ).addClass( 'selected' );
	}
    }

    function cursorUpdate( rid ) {
	var e,o,w;

	if ( rid !== undefined ) { // todo - do we ever use default or can we ditch this
            insertRid = rid;
	}
	//console.assert( rid !== undefined );
	//insertRid = rid;

	e =  $( 'span#' + insertRid );
	console.assert( e !== undefined );

	o = e.offset();
	console.assert( o !== undefined );

	w = e.outerWidth();
	console.assert( w !== undefined );
	
	o.left = o.left + w;

	//console.log( "cursor update to " + JSON.stringify( o ) );

	$('div#cur').offset( o );
    }

    function cursorBack() {
	var rid;

	rid = insertRid;
	if ( rid !== docRidStart ) { // check not walking off start 
            rid = getPrevRid( rid );
	}
	cursorUpdate( rid );
    }

    function cursorForward() {
	var rid;

	rid = getNextRid( insertRid ); 
	if ( rid === docRidEnd ) { // check not walking off end 
            rid = insertRid;
	}
	cursorUpdate( rid );
    }

    function cursorEnd() {
	var rid,next;

	rid = insertRid;
	next = insertRid;

	do {
            rid = next;
            next =  getNextRid( rid ); 
	} while ( next !== docRidEnd );

	cursorUpdate( rid );
    }

    /* UI code for editor input  *************/

    $(document).keypress( function(e) {
	var para, frag;
	//console.log( "event press charCode " + JSON.stringify( e.charCode ) );
	//console.log( "event press keyCode " + JSON.stringify( e.keyCode ) );
	if ( e.keyCode  === 13 ) { // return key pressed
	    // split the div at the cursor
	    para = modelNewPara( cursorGetRid() );
            cursorUpdate( para.rid );
	}
	else {
            frag = modelNewFrag( cursorGetRid() ,  String.fromCharCode(e.charCode)  );
            cursorUpdate( frag.rid );
	}
    });

    $(document).keydown( function(e) {
	//console.log( "event down " + JSON.stringify( e.keyCode ) );
	if ( e.keyCode === 8 ) { // delete
            e.preventDefault(); // for the record, backspace to navigate is insane 

            modelKillElement( cursorGetRid() );
            cursorBack();
	}

	if ( e.keyCode === 37 ) { // back
            cursorBack();
	}

	if ( e.keyCode === 39 ) { // forward
	    cursorForward();
	}
    });


    /************* Track Time *****************/

     function updateTrackTime() {
	var cacheTime = 1;
    }



    /* WebSocekt Communication stuff *******************/

    function webSocketInit() {
	var pageURL, wsURL;

	// TODO if ( ('WebSocket' in window) === false) {
    	//    console.log( "Websocket not supported in this browser");
	//}
	
	pageURL = window.location;
	wsURL = ((pageURL.protocol === "https:") ? "wss://" : "ws://");
	wsURL += pageURL.hostname ;
	wsURL += (((pageURL.port !== 80) && (pageURL.port !== 443)) ? ":" + pageURL.port : ""); // todo - sort of a bug 
	wsURL += '/web-socket/' ;
	

	webSocketConnection = new WebSocket( wsURL );
	
	webSocketConnection.onopen = function(){
            console.log('WebSocket Connection open!');
	};
	
	webSocketConnection.onclose = function(){
            console.log('WebSocket Connection closed');
	};
	
	webSocketConnection.onerror = function(error){
            console.log('WebSocket Error detected: ' + error);
	};
	
	webSocketConnection.onmessage = function(e){
	    var msg;

            msg = JSON.parse( e.data );
	    if (  typeof( msg.dead ) === 'string' ) {
		msg.dead = ( msg.dead.toLowerCase() === 'true' );
	    }
            console.log( "got msg from server: " + JSON.stringify( msg) );
            
	    if ( msg.operation === 'new' ) {
		if ( msg.type === 'para' ) {
	            viewNewPara( msg );
		} else if ( msg.type === 'frag' ) {
	            viewNewFrag( msg );
		}
	    } else if ( msg.operation === 'kill' ) {
		viewKillElement( msg );
	    } else if ( msg.operation === 'style' ) {
		viewChangeStyle( msg );
	    } else {
		console.log( "unknown operations from server: " + msg.operation );
	    }
	};

    }
    
    /******* init and setup coe **********************/

    function init() {
	docRidStart = 'rid0';
	docRidEnd   = 'rid1';
	cursonInit( docRidStart );
	updateTrackTime();
	webSocketInit();
        modelLoad();
    }

    var publicExport = {
        init: init
    };

    return publicExport;
}());   


$(document).ready(function(){
    "use strict";
    Fluffy.Edit.init();
});

