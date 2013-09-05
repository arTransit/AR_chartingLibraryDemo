/*
 * jquery.flot.legendlist.js
 * 
 * Flot plugin for adding interactive legend.  Legend displayed in separate
 * <div> element, and highlights chart layers in response to mouse
 * hover events in legend.
 * 
 * Requirements:
 *      jquery
 *      flot: http://www.flotcharts.org/
 *
 * options:
 *      legendlist.legendDiv       name of div element to hold legend
 *      legendlist.legendTitle     title of legend, defaults to "Legend"
 *      legendlist.dullColour      colour used to 'dullen' unselected series
 *
 * CSS:
 *      .legendActiveItem       styling for active list elements ie bold
 *      .legendInactiveItem     styling for inactive list elements
 *      .legendBox              used to draw coloured box for each item 
 *      .legendList             styling for list elements
 *
 * Author: Andrew Ross <andrew_ross@bctransit.com>
 * Date:   2013 Sep 05
 *
 */



(function ($) {
    function init(plot) {
        var legendDiv = "",
            legendTitle="Legend",
            legendCreated = false,
            dullColour = "#CCC",
            originalColours=[],
            currentHighlightedItem = -1, 
            originalData = [];

        function getLegendListOptions(plot, options) {
            if (options.legendlist) {
                if (options.legendlist.legendTitle) {
                    legendTitle = options.legendlist.legendTitle;
                }
                if (options.legendlist.dullColour) {
                    dullColour = options.legendlist.dullColour;
                }
                if (options.legendlist.legendDiv) {
                    legendDiv = options.legendlist.legendDiv;

                    $('#' +legendDiv).empty();
                    $('#' +legendDiv).append(
                        "<ul class=\"legendList\" id=\"legendList\">"
                        + "<lh>" + legendTitle + "</lh>"
                        + "</ul>"
                        );
                }
                //using hook after chart drawn - createLegend() does not specifically 
                //  need 'drawOverlay' event
                plot.hooks.drawOverlay.push(createLegend);
            }
        }

        function createLegend( plot, eventHolder ) {
            if ( !legendCreated ) {
                var po = plot.getOptions();
                var dataSeries = plot.getData();
                originalColours = po.colors;

                for( var i=0; i < dataSeries.length; i++ ) {
                    $('#' +legendDiv +' ul').append(
                        "<li class=\"legendItem\"><span class=\"legendBox\" style=\"background-color:"
                        + dataSeries[i].color + ";\"></span> " + dataSeries[i].label + "</li>" );
                }

                //add mouseover events to all new legend items
                $(".legendItem").mouseover( function() {
                    $(".legendItem").removeClass("legendActiveItem");
                    $(".legendItem").addClass("legendInactiveItem");

                    $(this).removeClass("legendInactiveItem");
                    $(this).addClass("legendActiveItem");

                    var thisSeries = $(this).index() -1;
                    var newData = plot.getData();
                    if (currentHighlightedItem > -1) {
                        newData = [].concat( 
                                newData.slice(0,currentHighlightedItem), 
                                newData.slice(-1),
                                newData.slice(currentHighlightedItem,-1));
                    }
                    for (var i=0; i<newData.length; i++ ) {
                        if (i == thisSeries) {
                            newData[i].color = originalColours[i];
                        } else {
                            newData[i].color = dullColour;
                        }
                    }

                    currentHighlightedItem = thisSeries;
                    newData = [].concat( 
                            newData.slice(0,currentHighlightedItem), 
                            newData.slice(currentHighlightedItem+1),
                            newData[currentHighlightedItem] );
                    plot.setData( newData );
                    plot.draw();
                });

                $('#' +legendDiv).mouseleave( function() {   //reset legend when looses focus
                    $(".legendItem").removeClass("legendActiveItem");
                    $(".legendItem").removeClass("legendInactiveItem");
                    
                    var newData = plot.getData();
                    if (currentHighlightedItem > -1) {
                        newData = [].concat( 
                                newData.slice(0,currentHighlightedItem), 
                                newData.slice(-1),
                                newData.slice(currentHighlightedItem,-1));
                    }
                    for (var i=0; i<newData.length; i++ ) {
                        newData[i].color = originalColours[i];
                    }
                    plot.draw();
                });
                legendCreated = true;
            }

        }


        plot.hooks.processOptions.push(getLegendListOptions);
    }

    var options = {
            legendList: {
                legendDiv: "",
                legendTitle: "Legend",
                dullColour: "#CCC"
            }
        };

    $.plot.plugins.push({
        init: init,
        options: options,
        name: "legendlist",
        version: "0.1"
    });
})(jQuery);

