/*jslint  browser: true, devel: true,  vars: true, todo: true, white: true */
/*global  $ */
/* jshint strict: true, jquery: true */

var Fluffy;
Fluffy = Fluffy || {}; // setup namespace

Fluffy.Edit = (function () {
    "use strict";

    function init() {
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

