/*=========================================================================================
    File Name: donut.js
    Description: Morris donut chart
    ----------------------------------------------------------------------------------------
    Item Name: Stack - Responsive Admin Theme
    Version: 2.1
    Author: PIXINVENT
    Author URL: http://www.themeforest.net/user/pixinvent
==========================================================================================*/

// Donut chart
// ------------------------------
$(window).on("load", function(){

    Morris.Donut({
        element: 'donut-chart',
        data: [{
            label: "Completed",
            value: 40
        }, {
            label: "Pending",
            value: 35
        }, {
            label: "Declined",
            value: 25
        },  ],
        resize: true,
        colors: ['#2DCEE3', '#FFAB00', '#FF4558']
    });
});