/*=========================================================================================
    File Name: bar.js
    Description: Morris bar chart
    ----------------------------------------------------------------------------------------
    Item Name: Stack - Responsive Admin Theme
    Version: 2.1
    Author: PIXINVENT
    Author URL: http://www.themeforest.net/user/pixinvent
==========================================================================================*/

// Bar chart
// ------------------------------
$(window).on("load", function(){

    Morris.Bar({
        element: 'bar-chart',
        data: [{
                y: '2017',
                a: 250,
                b: 590
            }, {
                y: '2016',
                a: 650,
                b: 420
            }, {
                y: '2015',
                a: 540,
                b: 380
            }, {
                y: '2014',
                a: 480,
                b: 360
            }, {
                y: '2013',
                a: 320,
                b: 390
            }, {
                y: '2012',
                a: 150,
                b: 100
            }
        ],
        xkey: 'y',
        ykeys: ['a', 'b'],
        labels: ['Pending', 'Complete'],
        barGap: 6,
        barSizeRatio: 0.15,
        smooth: true,
        gridLineColor: '#e3e3e3',
        numLines: 5,
        gridtextSize: 14,
        fillOpacity: 0.4,
        resize: true,
        barColors: ['#ffc107', '#2DCEE3']
    });
});