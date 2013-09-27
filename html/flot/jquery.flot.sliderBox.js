/*
 * jquery.flot.sliderBox.js
 * 
 * flot plugin to create a slider on one chart that controls the extents on another chart
 * 
 * Requirements:
 *      jquery
 *      flot: http://www.flotcharts.org/
 *      jquery dateFormat: https://github.com/phstc/jquery-dateFormat
 *
 * Author: Andrew Ross <andrew_ross@bctransit.com>
 * Date: 2013 September 24
 *
 */


(function ($) {
    function init(plot) {
        var buttonDown = false;
        var sliderBoxLeft = null,sliderBoxRight = null;
        var linkedChart = "";
        var sliderBoxEnabled = false;

        function _setChartExtents( chart, min, max ) {
            var xaxis = chart.getAxes().xaxis;
            xaxis.options.min = min;
            xaxis.options.max = max;

            chart.setupGrid();
            chart.draw();
        }

        var drawSliderBox = function(plot, ctx){
            var plotBounds = plot.getPlotOffset();
            var plotHeight = plot.height();
            var xaxis = plot.getAxes().xaxis;
            var plotDiv = plot.getPlaceholder();

            if (sliderBoxLeft==null || !sliderBoxRight==null) {
                sliderBoxLeft = xaxis.p2c( xaxis.min );
                sliderBoxRight = xaxis.p2c( xaxis.max );
            }

            ctx.fillStyle="#777";
            ctx.fillRect(plotBounds.left+sliderBoxLeft,plotBounds.top,sliderBoxRight-sliderBoxLeft,plotHeight);

            //draw and update right tag
            var rightDate = new Date(xaxis.c2p( sliderBoxRight ));
            if( !document.getElementById('rightTag' ) ) {
                plotDiv.append("<span id=\"rightTag\" class=tagClass style=\"position:absolute;\"></span>");
            }
            $("#rightTag").text( $.format.date( rightDate,"yyyy MMM dd") );
            if ((plot.width()- sliderBoxRight ) < $("#rightTag").width()) {
                var leftPostion = plotBounds.left + sliderBoxRight - $("#rightTag").width() -5;
            } else {
                var leftPostion = plotBounds.left + sliderBoxRight;
            }
            $("#rightTag").css({
                left: leftPostion,
                top: (plotHeight / 2)
            });

            //draw and update left tag
            var leftDate = new Date(xaxis.c2p( sliderBoxLeft ));
            if( !document.getElementById('leftTag' ) ) {
                plotDiv.append("<span id=\"leftTag\" class=tagClass style=\"position:absolute;\"></span>");
            }
            $("#leftTag").text( $.format.date( leftDate,"yyyy MMM dd") );
            if ((sliderBoxLeft - plotBounds.left) < $("#leftTag").width()) {
                var rightPosition = plotBounds.left + sliderBoxLeft;
            } else {
                var rightPosition = plotBounds.left + sliderBoxLeft - $("#leftTag").width() -5;
            }
            $("#leftTag").css({
                left: rightPosition,
                top: (plotHeight / 2) - $("#leftTag").height()
            });

            _setChartExtents( linkedChart, xaxis.c2p(sliderBoxLeft), xaxis.c2p(sliderBoxRight) );
        }

        function moveBox( x ) {
            x -= plot.offset().left;
            if (x < 0) { x = 0; };
            if (x > plot.width()) { x = plot.width(); };

            var leftDistance = Math.abs( x - sliderBoxLeft );
            var rightDistance = Math.abs( x - sliderBoxRight );
            if (leftDistance < rightDistance) {
                sliderBoxLeft = x;

            } else {
                sliderBoxRight = x;
            }
            plot.draw();
        }

        plot.hooks.processOptions.push( function( plot, options ) {
            if (options.sliderBox) {
                sliderBoxEnabled =true;
                linkedChart = options.sliderBox.linkedChart;

                plot.hooks.bindEvents.push( function( plot,eventHolder) {
                    eventHolder.mousedown( function(e) {
                        buttonDown = true;
                        moveBox( e.pageX );
                    });
                });
                plot.hooks.bindEvents.push( function( plot,eventHolder) {
                    eventHolder.mousemove( function(e) {
                        if( buttonDown ) {
                            moveBox( e.pageX );
                        }
                    });
                });

                // reset mouse event
                $(document).mouseup(function(e){
                    buttonDown = false;
                });

                plot.hooks.drawBackground.push( drawSliderBox );
            }
        });
    }

    var options = {
       sliderBox:null 
    }
    $.plot.plugins.push({
        init:init,
        options:options,
        name:"sliderBox",
        version:"0.1"
    });
})(jQuery);


