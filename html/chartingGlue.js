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
 * Global variables
 *
 */

var rowData = [];                   // array of data coordinates for each line/series
var columnNames = [];               // name of each data series
var annotations = [];               // array of annotation (date, label)
var BASEURL = "http://localhost:8080/chartdata/";   // url for dataProvider
var lineColours = [];               // array of colours for each line/series
var flotChart, flotSmallChart;      // pointers to charts
var yMin, yMax;                     // max extents of flotChart y-axis (only used to reset zoom)


/*************************************************************************
 * Chart functions
 *
 */

var rangeselectionCallback = function(o){
    //console.log("New selection:"+o.start+","+o.end);
    setChartExtents( o.start, o.end );
}

function setChartExtents( min, max ) {
    var xaxis = flotChart.getAxes().xaxis;
    xaxis.options.min = min;
    xaxis.options.max = max;
    var yaxis = flotChart.getAxes().yaxis;
    yaxis.options.min = yMin;
    yaxis.options.max = yMax;

    updateDateRangeBox( min, max);
    flotChart.setupGrid();
    flotChart.draw();

}

function updateDateRangeBox( fromDate,toDate ) {
    $('#dateRangeBox').val( 
            $.format.date(new Date( fromDate ),'yyyy MMM dd') + 
            " to " + 
            $.format.date(new Date( toDate ),'yyyy MMM dd'));
}

//function getGFIdata( url )
//  url: url of data source
//  json from data source must be properly formatted to contain:
//      .data - 2-dimensional array of data points, inexed by columnName
//      .columns - array of column names
//      .annotations - array of dates and labels for annotations
function getGFIdata( url )  {
    var json;
    return $.getJSON( url, function( json ) {
        rowData = json.gfiData.data;  // extract data points
        columnNames = json.columns;
        annotations = json.gfiData.annotations;
        for (var i=0, l=rowData.length; i < l; i++) {
            rowData[i].label = columnNames[i];
        }
    });
}

//function updateChartData( chartType )
//  
function updateChartData( chartType ) {
    switch( chartType ) {
        case 'all':
            var url = BASEURL + 'gfiall/flot';
            lineColours = ['#0C0099','#990B00','#00990B'];
            break;
        case 'year':
            var url = BASEURL + 'gfi/flot';
            lineColours = ['#030032','#0C0099','#1300FF','#7165FF',
                           '#320300','#990B00','#FF1200','#FF7065',
                           '#003203','#00990B','#00FF12','#65FF70'];
            break;
    }
    
    getGFIdata( url ).done( function() {
        buildChart( rowData, columnNames, annotations );
    });
}

//function buildChart( rowData )
//  
function buildChart( rowData, columnNames, annotations ) {
    var flotOptions = {
        legend: {
            show:false
        },
        events: {
            data: annotations
        },
        series: {
            lines: {show: true}
        },
        xaxis: { 
            mode: "time", 
            minTickSize: [1, "day"],
            timeformat: "%e %b %Y",
            font: { size: 10, family: "sans-serif", color: "#000" }
        },
        yaxis: {
            //labelWidth: 100,
            reserveSpace: 50,
            tickFormatter: function(val, axis) {
                return numberWithCommas( val );
            }
        },
        colors: lineColours,
        zoom: {
            interactive: true
        },
        pan: {
            interactive: true
        },
        grid: {
            hoverable: true,   // needed for tooltip
            autoHighlight: true
        }
    }
    
    flotChart = $.plot("#flotchart", rowData, flotOptions );
    yMin = flotChart.getAxes().yaxis.min;
    yMax = flotChart.getAxes().yaxis.max;
    
    //draw smallchart
    var sData = $.extend(true,[],rowData);
    for(var i=0;i<sData.length;i++){
        sData[i].color = '#2E2E2E';
        sData[i].label = undefined;
    }
    flotsmallchart = $.plot("#flotsmallchart",sData,{
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
            color: "#666"
        }
    });
    
    // setup legend
    for(var i=0;i<columnNames.length;i++){
        console.log( "Name: " + columnNames[i]);
        //$("#chartLegend").append("<div class=\"legendBox\" style=\"background-color:" + + "#b0c4de;\"></div>" + columnNames[i] +"<br/>");
        //var t = document.createTextNode(  );
        $("#chartLegend").append( "<span class=\"legendText\"><div class=\"legendBox\" style=\"background-color:" + lineColours[i] + ";\"></div> " + columnNames[i] + "<br/></span>" );
    }

    
    var xaxis = flotChart.getAxes().xaxis;
    console.log("min:" + xaxis.min);
    console.log("max:" + xaxis.max);
    $("#slider").dateRangeSlider({
        defaultValues:{min: new Date(xaxis.min),max: new Date(xaxis.max)},
        bounds:{min: new Date(xaxis.min),max: new Date(xaxis.max)},
        formatter:function(val){
            var monthNamesShort= ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            var days = val.getDate(),
                    year = val.getFullYear();
            return year + " " + monthNamesShort[val.getMonth()] + " " + days;
        }
    });
    $("#slider").on("valuesChanging", function(e, data){
        setChartExtents( data.values.min, data.values.max );
    });
}


/* function numberWithCommas( n )
 *      given integer n, return string of number commas between thousands
 */
function numberWithCommas(n) {
    return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}



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
            //console.log("Mouse gone");
        });
    });
    $(".legendItem").mouseover( function() {    //make menu item bold with focus
        console.log("Mouseover: " + $(this).index() );
        $(".legendItem").removeClass("legendActiveItem");
        $(".legendItem").addClass("legendInactiveItem");

        $(this).removeClass("legendInactiveItem");
        $(this).addClass("legendActiveItem");
    });

    //pulldown list to change view of data
    //  All data: date range beginning to end
    //  Year on year: current year overlapping previous years
    $('#dataView').change(function() {
        updateChartData( $('#dataView').val() );
    });
    
    // datatooltip box for mouse hover
    $("<div id='datatooltip'></div>").css({
        position: "absolute",
        display: "none",
        border: "1px solid #fdd",
        padding: "2px",
        "background-color": "#fee",
        opacity: 0.80,
        "font-family": "sans-serif",
        "font-size": "small",
        "font-weight": "bold"
    }).appendTo("body");
    
    $("#flotchart").bind("plotpan", function (plot, args) {
        updateDateRangeBox( flotChart.getAxes().xaxis.options.min, flotChart.getAxes().xaxis.options.max );
    });
    
    $("#flotchart").bind("plotzoom", function (plot, args) {
        updateDateRangeBox( flotChart.getAxes().xaxis.options.min, flotChart.getAxes().xaxis.options.max );
    });
    
    $("#flotchart").bind("plothover", function (event, pos, item) {
        if (item) {
            var y = item.datapoint[1];
            $("#datatooltip").html(item.series.label + ": " + numberWithCommas( y))
            .css({top: item.pageY+5, left: item.pageX+5})
            .fadeIn(200);
        } else {
            $("#datatooltip").hide();
        }
    });

    updateChartData( $('#dataView').val() );

});



