/*jslint  browser: true, devel: true,  vars: true, todo: true, white: true */
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
	
	if ( elem.dead ) {
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
    }

    function viewNewFrag( elem ) {
	//console.log( "In viewNewFrag" );
	console.assert( elem.type === 'frag' );

	var span=null;

	if ( elem.content === 'text' ) {
            span = $( "<span id='" + elem.rid + "'>" + elem.text + "</span>" );
	}
	else {
            console.log( "Unknown content of " + elem.content ); // todo 
	    console.log( "Elem = " + JSON.stringify( elem ) );
	}

	$( 'span#' + elem.prev ).after( span );
    }

    /* functions used by local UI to do UI actions and update DOM & Server */

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
	return elem;
    }

    /* cursor managment code ************************************************/ 

    var insertRid = "rid0" ;

    function cursorUpdate( rid ) {
	insertRid = rid;
    }

    function cursorGetRid() {
	return insertRid;
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

    /******* init and setup **********************/

    function init() {
	docRidStart = 'rid0';
	docRidEnd   = 'rid1';
	cursorUpdate( docRidStart );
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

