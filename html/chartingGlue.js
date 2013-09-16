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
 *      Flot event graphics (annotations): http://joeloughton.com/blog/web-applications/flot-plugins-event-graphics/
 *
 * Author: Andrew Ross <andrew_ross@bctransit.com>
 * Date: 2013 August 27
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
var flotChart = {};                 // pointers to charts

/*************************************************************************
 * Chart functions
 *
 */



function updateDateRangeBox( fromDate,toDate ) {
    $('#dateRangeBox').val( 
            $.format.date(new Date( fromDate ),'yyyy MMM dd') + 
            " to " + 
            $.format.date(new Date( toDate ),'yyyy MMM dd'));
}


/* function getGFIdata( url )
 *      url: url of data source
 *      json from data source must be properly formatted to contain:
 *      .data - 2-dimensional array of data points, inexed by columnName
 *      .columns - array of column names
 *      .annotations - array of dates and labels for annotations
 */
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


/* function updateChartData( chartType )
 */
  
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


/* function buildChart( rowData )
 *
 */
  
function buildChart( rowData, columnNames, annotations ) {
    var flotOptions = {
        legendlist:{
           legendTitle: "Legend",
           legendDiv: "chartLegend"
        },
        legend: {
            show:false
        },
        events: {
            data: annotations,
            eventsListDiv: "chartAnnotations"
        },
        series: {
            lines: {show: true}
        },
        xaxis: { 
            mode: "time", 
            minTickSize: [1, "day"],
            font: { size: 10, family: "sans-serif", color: "#000" }
        },
        yaxis: {},
        colors: lineColours
    }
    
    flotChart = new BiCharting.fullChart( flotOptions, rowData, "mainChart" );
 
}


/*************************************************************************
 * Navigation functions
 *
 */

function setExtent( id ) {
    var d = new Date();
    var m = d.getMonth(),
        y = d.getFullYear();

    switch( id ) {
        case "fullExtent":
            var min = new Date(flotChart.xMin),  //use chart extents
                max = new Date(flotChart.xMax);
            break;
        case "currentYear":
            var min = new Date( y,0,1),
                max = new Date( y+1,0,0);
            break;
        case "currentMonth":
            var min = new Date( y,m,1),
                max = new Date( y,m+1,0);
            break;
        case "lastYear":
            var min = new Date( y-1,0,1),
                max = new Date( y,0,0);
            break;
        case "lastMonth":
            var min = new Date( y,m-1,1),
                max = new Date( y,m,0);
            break;
    }
    flotChart.setExtents( min, max );
}


/*************************************************************************
 * Document functions / jQuery setup
 *
 */

$(function() {
    $('#dataView').change(function() {
        updateChartData( $('#dataView').val() );
    });
    updateChartData( $('#dataView').val() );
});



