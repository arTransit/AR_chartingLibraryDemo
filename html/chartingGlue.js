/*
 * chartingGlue.js
 * 
 * Functions for managing flot chart, slider/zoom bar, legend, and annotations.
 * 
 * Requirements:
 *      jquery
 *      jquery-ui
 *      flot: http://www.flotcharts.org/
 *      jquery dateFormat: https://github.com/phstc/jquery-dateFormat
 *      jquery rangeSlider: http://ghusse.github.io/jQRangeSlider/
 *
 * Author: Andrew Ross <andrew_ross@bctransit.com>
 * Date: 2013 August 22
 *
 */


/*************************************************************************
 * Legend functions
 *
 */



/*************************************************************************
 * Document functions / jQuery setup
 *
 */

$(function() {

    // setup legend interactivity

    $("#legendList").mouseleave( function() {   //reset legend when looses focus
        var listItems = $("#legendList li");
        listItems.each(function() {
            $(this).removeClass("legendInactiveItem");
            $(this).removeClass("legendActiveItem");
            console.log("Moue gone");
        });
    });
    $(".legendItem").mouseover( function() {    //make menu item bold with focus
        console.log("Mouseover: " + $(this).index() );
        $(".legendItem").removeClass("legendActiveItem");
        $(".legendItem").addClass("legendInactiveItem");

        $(this).removeClass("legendInactiveItem");
        $(this).addClass("legendActiveItem");
    });
});



