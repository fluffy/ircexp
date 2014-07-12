/*jslint  browser: true, devel: true,  vars: true, todo: true, white: true, bitwise: true */
/*global  $ */
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
	else {
            console.log( "Unknown content of " + elem.content ); // todo 
	    console.log( "Elem = " + JSON.stringify( elem ) );
	}

	$( 'span#' + elem.prev ).after( span );

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
    }

    function modelLoad() {
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

	viewNewFrag( elem );

	elem.operation = 'new';
	modelSendUpdate( elem );


	return elem;
    }

    function modelNewPara( prevRid ) {
	var elem = {};  // todo move all elem.foo = into here 
	console.log( "In modelNewPara" );

	elem.rid =  'rid' + Math.floor( Math.random() * 1e9 );
	elem.creationTime = new Date().getTime();
	elem.type = 'para';

	elem.prev = prevRid;
	elem.dead = false;
	elem.style = 'para-Body';

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


    /******* init and setup **********************/

    function init() {
	docRidStart = 'rid0';
	docRidEnd   = 'rid1';
	cursonInit( docRidStart );
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

