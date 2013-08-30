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
var flotChart, flotSmallChart;      // pointers to charts
var yMin, yMax;                     // max extents of flotChart y-axis (only used to reset zoom)


/*************************************************************************
 * Chart functions
 *
 */

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

    displayAnnotations( min, max );
}

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
            //timeformat: "%e %b %Y",
            font: { size: 10, family: "sans-serif", color: "#000" },
            ticks:generateXaxisTicks,
            tickFormatter: xAxisDateFormat
        },
        yaxis: {
            reserveSpace: 50,
            tickFormatter: numberWithCommas
        },
        colors: lineColours,

        /*
         * Remove chart slippy map behaviour
         *
        zoom: {
            interactive: true
        },
        pan: {
            interactive: true
        },
         *
         */

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
    
    /* setup legend
     */

    $('#legendList li').remove();
    for(var i=0;i<columnNames.length;i++){
        //console.log( "Name: " + columnNames[i]);
        $("#legendList").append( 
                "<li class=\"legendItem\"><span class=\"legendBox\" style=\"background-color:"
                + lineColours[i] + ";\"></span> " + columnNames[i] + "</li>" );
     }
    
    //make menu item bold with focus
    $(".legendItem").mouseover( function() {
        //console.log("Mouseover: " + $(this).index() );
        $(".legendItem").removeClass("legendActiveItem");
        $(".legendItem").addClass("legendInactiveItem");

        $(this).removeClass("legendInactiveItem");
        $(this).addClass("legendActiveItem");

        var flotOptions=flotChart.getOptions();
        var newLineColours = new Array();
        for(var i=0;i<lineColours.length;i++){
            newLineColours.push( "#CCC" );
        }
        // reset colour of selected line
        newLineColours[ $(this).index()-1 ] = lineColours[$(this).index()-1];
        flotOptions.colors = newLineColours;
        flotChart = $.plot("#flotchart", rowData, flotOptions );
    });

    /* setup annotations
     */

    displayAnnotations( flotChart.getAxes().xaxis.min, flotChart.getAxes().xaxis.max ); 


    /* setup slider
     */

    var xaxis = flotChart.getAxes().xaxis;
    //console.log("min:" + xaxis.min);
    //console.log("max:" + xaxis.max);
    $("#slider").dateRangeSlider({
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
    $("#slider").on("valuesChanging", function(e, data){
        setChartExtents( data.values.min, data.values.max );
    });
}


/* function numberWithCommas( n )
 *      given integer n, return string of number commas between thousands
 *      1234567 -> 1,234,567
 */
function numberWithCommas(n) {
    return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function xAxisDateFormat( n ) {
    return "<span class=\"rotatedLable\">"
            + $.format.date(n, "yyyy MMM d") + "</span>";
}

function generateXaxisTicks( axis ) {
    var ticks=[], 
        t=0,
        sp=(axis.max-axis.min)/5;
    do {
        ticks.push( t * sp );
        ++t;
    } while ( (t * sp) < axis.max);
    return ticks;
}


/*************************************************************************
 * Navigation functions
 *
 */

function setExtent( id ) {
    var d = new Date();
    var m = d.getMonth(),
        y = d.getFullYear();
    console.log("Now: " + m + "  " + y);

    switch( id ) {
        case "currentYear":
            var min = new Date( y, 0 ),
                max = new Date( y+ 1, 0);
            break;
    }
    console.log("extent:" + min + " " + max);
    $("#slider").dateRangeSlider("values", min, max);
    setChartExtents( min.getTime(), max.getTime() ); 
}


/*************************************************************************
 * Annotation functions
 *
 */


function displayAnnotations( min, max ) {
    $('#annotationList li').remove();
    for( var i=0; i< annotations.length; i++){
        if( annotations[i].max >= min && annotations[i].max <= max ) {
            $("#annotationList").append(
                    "<li class=\"annotationItem\" name=\"" + i + "\">"
                    + "<b>" + annotations[i].title + "</b><br\>"
                    + annotations[i].description
                    + "<br\><i>" + $.format.date( annotations[i].max,"ddd, dd MMM yyyy") + "</i>"
                    + "</li>" );
        }
    }
    
    //make menu item bold with focus
    $(".annotationItem").hover( 
        function() {
            $(".annotationItem").removeClass("annotationActiveItem");
            $(".annotationItem").addClass("annotationInactiveItem");
            $(this).removeClass("annotationInactiveItem");
            $(this).addClass("annotationActiveItem");
            flotChart.highlightEvent($(this).attr("name") );
        }, 
        function() {
            $(this).removeClass("annotationActiveItem");
            $(this).addClass("annotationInactiveItem");
            flotChart.unhighlightEvent($(this).attr("name") );
    });
}

/*************************************************************************
 * Document functions / jQuery setup
 *
 */

$(function() {

    // setup legend interactivity
    $("#legendList").mouseleave( function() {   //reset legend when looses focus
        $(".legendItem").removeClass("legendActiveItem");
        $(".legendItem").removeClass("legendInactiveItem");
        
        var flotOptions=flotChart.getOptions();
        flotOptions.colors = lineColours.slice(0);  //clone colours
        flotChart = $.plot("#flotchart", rowData, flotOptions );
    });

    // setup annotation interactivity
    $("#annotationList").mouseleave( function() {   //reset annotation when looses focus
        $(".annotationItem").removeClass("annotationActiveItem");
        $(".annotationItem").removeClass("annotationInactiveItem");
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
        //"font-weight": "bold",
        "font-size": "small"
    }).appendTo("body");
    
   
    $("#flotchart").bind("plothover", function (event, pos, item) {
        if (item) {
            var y = item.datapoint[1],
                x = item.datapoint[0];
            $("#datatooltip").html(
                "<b>" + item.series.label + ": " 
                + numberWithCommas( y) + "</b>"
                + "<br/><i>" + $.format.date(x, "yyyy MMM d") +"</i>"
            ).css({top: item.pageY+5, left: item.pageX+5})
            .fadeIn(200);
        } else {
            $("#datatooltip").hide();
        }
    });

    updateChartData( $('#dataView').val() );

});



