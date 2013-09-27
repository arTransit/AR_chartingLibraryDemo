/*
 * biCharting.js
 * 
 * Wrapper class for flot charts, adding time s222lider & overall view chart
 * 
 * Requirements:
 *      jquery
 *      jquery-ui
 *      flot: http://www.flotcharts.org/
 *      jquery dateFormat: https://github.com/phstc/jquery-dateFormat
 *      jquery rangeSlider: http://ghusse.github.io/jQRangeSlider/
 *      Flot event graphics (annotations): http://joeloughton.com/blog/web-applications/flot-plugins-event-graphics/
 *
 * Author: Andrew Ross <andrew_ross@bctransit.com>
 * Date: 2013 September 09
 *
 */

BiCharting = window.BiCharting || {};
BiCharting = function() {

    function _fullChart( chartOptions, data, chartContainerDiv ) {
        this.data = data;
        this.divs = {
                "chartContainer": chartContainerDiv,
                "mainChartDiv": chartContainerDiv + "_bigchart",
                "smallChartDiv": chartContainerDiv + "_flotsmallchart",
                "sliderDiv": chartContainerDiv + "_slider"
                };
        //update chart options with callbacks for axis formatting
        if (! chartOptions.xaxis.ticks) {
            chartOptions.xaxis.ticks = _generateXaxisTicks;
        }
        if (! chartOptions.xaxis.tickFormatter ) {
            chartOptions.xaxis.tickFormatter = _xAxisDateFormat;
        }
        if (! chartOptions.yaxis.tickFormatter ) {
            chartOptions.yaxis.tickFormatter = _numberWithCommas;
        }
        //chartOptions.yaxis.reserveSpace = 50;
        chartOptions.grid = {
            margin:{top:0,left:0,bottom:0,right:15}, //issue with non-aligning right edges
            hoverable: true,
            autoHighlight: true
        }
        
        //create chart containers and draw components
        _createDivs( this.divs );
        this.bigChart = $.plot( "#" + this.divs.mainChartDiv, data, chartOptions );
        this.smallChart = _drawSmallChart( data, this.divs.smallChartDiv, this.bigChart );
        //_drawSlider( this.bigChart, this.divs.sliderDiv );
        
        //save chart extents
        var _axes = this.bigChart.getAxes()
        this.yMin = _axes.yaxis.min;
        this.yMax = _axes.yaxis.max;
        this.xMin = _axes.xaxis.min;
        this.xMax = _axes.xaxis.max;

        function _setChartExtents( chart, min, max ) {
            var xaxis = chart.getAxes().xaxis;
            xaxis.options.min = min;
            xaxis.options.max = max;

            updateDateRangeBox( min, max);
            chart.setupGrid();
            chart.draw();
        }
        this.setChartExtents = function( min, max ) {
            _setChartExtents(this.bigChart, min, max);
        }
        
        
        function _setSliderExtents( sliderDiv, min, max ){
            $("#" +sliderDiv).dateRangeSlider("values", min, max);
        }
        this.setSliderExtents = function( min, max ) {
            _setSliderExtents( this.divs.sliderDiv, min, max );
        }
        
        function _setExtents( min, max ){
            _setChartExtents( this.bigChart, min.getTime(), max.getTime() );
            //_setSliderExtents( this.divs.sliderDiv, min, max );
        }
        this.setExtents = _setExtents;

        function _createDivs( divs ) {
            $("#" +divs.chartContainer).empty();
            $("#" +divs.chartContainer).append(
                    "<div id=\"" + divs.mainChartDiv + "\"></div>" +
                    //"<div id=\"" + divs.sliderDiv + "\"></div>" +
                    "<div id=\"" + divs.smallChartDiv + "\"></div>"
                );
            var width = $("#" +divs.chartContainer).width();
            var height = $("#" +divs.chartContainer).height();

            $("#" +divs.mainChartDiv).width( width ).height( height-170 );
            $("#" +divs.smallChartDiv).width( width ).height( 100 );
            //$("#" +divs.sliderDiv).width( width -25 );
            //$("#" +divs.sliderDiv).css( "margin-left",25 );

            // datatooltip box for mouse hover
            // append name of container to 'tooltip' to make unique name
            $("<div id=\"" + divs.chartContainer +"tooltip\"></div>").css({
                position: "absolute",
                display: "none",
                border: "1px solid #fdd",
                padding: "2px",
                "background-color": "#fee",
                opacity: 0.80,
                "font-family": "sans-serif",
                //"font-weight": "bold",
                "font-size": "small"
            }).appendTo("body");
            
            $("#" +divs.chartContainer).bind("plothover", function (event, pos, item) {
                if (item) {
                    var y = item.datapoint[1],
                        x = item.datapoint[0];
                    $("#" + divs.chartContainer + "tooltip").html(
                        "<b>" + item.series.label + ": " 
                        + _numberWithCommas( y) + "</b>"
                        + "<br/><i>" + $.format.date(x, "yyyy MMM d") +"</i>"
                    ).css({top: item.pageY+5, left: item.pageX+5})
                    .fadeIn(200);
                } else {
                    $("#" + divs.chartContainer + "tooltip").hide();
                }
            });
        }

        function _drawSmallChart( data, smallChartDiv, bigChart ){
            var sData = $.extend(true,[],data);
            for(var i=0;i<sData.length;i++){
                sData[i].color = '#2E2E2E';
                sData[i].label = undefined;
            }
            var flotSmallChart = $.plot("#" + smallChartDiv,sData,{
                xaxis: {
                    mode: "time", 
                    minTickSize: [6, "month"],
                    timeformat: "%b %Y",
                    font: { size: 8, weight: "bold", family: "sans-serif", color: "#000" }
                },
                yaxis: {
                    reserveSpace: 50,
                    show: false
                },
                grid:{
                    margin:{top:0,left:0,bottom:0,right:15}, //issue with non-aligning right edges
                    color: "#666"
                },
                sliderBox: { linkedChart: bigChart }
            });
            return flotSmallChart;
        }
        
        function _drawSlider( chart, sliderDiv ) {
            var xaxis = chart.getAxes().xaxis;
            $("#" +sliderDiv).dateRangeSlider({
                defaultValues:{min: new Date(xaxis.min),max: new Date(xaxis.max)},
                bounds:{min: new Date(xaxis.min),max: new Date(xaxis.max)},
                formatter:function(val){
                    var days = val.getDate(),
                        year = val.getFullYear();
                    return year + " " 
                            + ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                               'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][val.getMonth()] 
                            + " " + days;
                }
            });
            $("#" +sliderDiv).on("valuesChanging", function(e, data){
                _setChartExtents( chart, data.values.min, data.values.max );
            });
        }
    }
    
    _numberWithCommas = function (n) {
        return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }
    _xAxisDateFormat = function( n ) {
        return "<span style=\"white-space:nowrap;\">"
                + $.format.date(n, "yyyy MMM d") + "</span>";
    }
    _generateXaxisTicks = function( axis ) {
        var ticks=[], 
            t=0,
            sp=(axis.max-axis.min)/5;
        do {
            ticks.push( t * sp );
            ++t;
        } while ( (t * sp) < axis.max);
        return ticks;
    }
    
    return {
        "fullChart" : _fullChart,
        "numberWithCommas" : _numberWithCommas,
        "xAxisDateFormat" : _xAxisDateFormat,
        "generateXaxisTicks" : _generateXaxisTicks
        }
}();




