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
 * CSS:
 *      
 * Author: Andrew Ross <andrew_ross@bctransit.com>
 * Date: 2013 Sep 04
 *
 */



(function ($) {
    function init(plot) {
        var legendDiv = "",
            legendTitle="Legend",
            legendCreated = false,
            dullColour = "#CCC",
            originalColours=[],
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

        function updateLegendItems(plot, canvascontext, series) {
            $('#' +legendDiv +' ul').append(
                 "<li class=\"legendItem\"><span class=\"legendBox\" style=\"background-color:"
                + series.color + ";\"></span> " + series.label + "</li>" );
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

                $(".legendItem").mouseover( function() {
                    $(".legendItem").removeClass("legendActiveItem");
                    $(".legendItem").addClass("legendInactiveItem");

                    $(this).removeClass("legendInactiveItem");
                    $(this).addClass("legendActiveItem");

                    var thisSeries = $(this).index() -1;
                    for (var i=0; i<dataSeries.length; i++ ) {
                        if (i == thisSeries) {
                            dataSeries[i].color = originalColours[i];
                        } else {
                            dataSeries[i].color = dullColour;
                        }
                    }
                    plot.draw();
                    /*
                    var flotOptions=flotChart.getOptions();
                    var newLineColours = new Array();
                    for(var i=0;i<lineColours.length;i++){
                        newLineColours.push( "#CCC" );
                    }
                    // reset colour of selected line
                    newLineColours[ $(this).index()-1 ] = lineColours[$(this).index()-1];
                    flotOptions.colors = newLineColours;
                    flotChart = $.plot("#flotchart", rowData, flotOptions );
                    */
                });

                $('#' +legendDiv).mouseleave( function() {   //reset legend when looses focus
                    $(".legendItem").removeClass("legendActiveItem");
                    $(".legendItem").removeClass("legendInactiveItem");
                    
                    for (var i=0; i<dataSeries.length; i++ ) {
                        dataSeries[i].color = originalColours[i];
                    }
                    plot.draw();
                    /*
                    var flotOptions=flotChart.getOptions();
                    flotOptions.colors = lineColours.slice(0);  //clone colours
                    flotChart = $.plot("#flotchart", rowData, flotOptions );
                    */
                });
                legendCreated = true;
            }

        }


        plot.hooks.processOptions.push(getLegendListOptions);
    }

    var options = {
            legendList: {
                legendDiv: "",
                legendTitle: "StockLegend",
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

