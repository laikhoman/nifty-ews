var hbs1 = require('hbs');
var fs = require('fs');
var db = require('../routes/mongo_db');
var ObjectId = require('mongodb').ObjectId;
var Promise = require('rsvp').Promise;
var i18n = require('i18n');
var path = require('path');
var str = "";
var time = "";
var dateFormat = require('dateformat');

module.exports = {
    __: function(options) {
        return i18n.__.apply(this, arguments);
    },
    getFormat: function(value, format, options) {
        // THIS USE ONLY datepicker DATE FORMATE
        if (value == 'date_format') {
            if (format != undefined) {
                var str = format;
            } else {
                var str = 'Y-m-d';
            }
            var Obj = {
                Y: "YYYY",
                m: "MM",
                d: "DD",
                j: "D",
                F: "MMM",
            };
            var trans = str.replace(/Y|m|d|j|F/gi, function(matched) {
                return Obj[matched];
            });
            return trans;
        } else if (value == 'time_format') {
            var time = format;

            var Obj = {
                i: "mm",
                h: "hh",
                H: "HH",
                s: "ss",
            };
            var trans = time.replace(/i|h|H|s/gi, function(matched) {
                return Obj[matched];
            });
            return trans;
        }
    },
    formatNumber: function(number, decimals, dec_point, thousands_sep, options) {

        var n = !isFinite(+number) ? 0 : +number,
            prec = !isFinite(+decimals) ? 0 : Math.abs(decimals),
            sep = (typeof thousands_sep === 'undefined') ? ',' : thousands_sep,
            dec = (typeof dec_point === 'undefined') ? '.' : dec_point,
            toFixedFix = function(n, prec) {
                // Fix for IE parseFloat(0.55).toFixed(0) = 0;
                var k = Math.pow(10, prec);
                return Math.round(n * k) / k;
            },
            s = (prec ? toFixedFix(n, prec) : Math.round(n)).toString().split('.');
        if (s[0].length > 3) {
            s[0] = s[0].replace(/\B(?=(?:\d{3})+(?!\d))/g, sep);
        }
        if ((s[1] || '').length < prec) {
            s[1] = s[1] || '';
            s[1] += new Array(prec - s[1].length + 1).join('0');
        }
        return s.join(dec);

    },
    getstatebyid: function(value, options) {
        var id = value;
        var data1 = [];
        var jsonData = fs.readFileSync('public/data/states.json', 'utf8');

        var jsonParsed = JSON.parse(jsonData);
        var states = jsonParsed.states;

        for (const [key, value] of Object.entries(states)) {
            if (id == value.id) {
                var result = "<p>" + value.name + "</p>";
                return value.name;

            }
        };
    },
    getcountrybyid: function(value, options) {
        var id = value;
        var data1 = [];
        var jsonData = fs.readFileSync('public/data/countries.json', 'utf8');

        var jsonParsed = JSON.parse(jsonData);
        var countries = jsonParsed.countries;

        for (const [key, value] of Object.entries(countries)) {
            if (id == value.id) {
                var result = "<p>" + value.name + "</p>";
                return value.name;
            }
        };
        return "India";
    },
    getcitybyid: function(value, options) {
        var id = value;
        var data1 = [];
        var jsonData = fs.readFileSync('public/data/cities.json', 'utf8');

        var jsonParsed = JSON.parse(jsonData);
        var cities = jsonParsed.cities;

        for (const [key, value] of Object.entries(cities)) {
            if (id == value.id) {
                var result = "<p>" + value.name + "</p>";
                return value.name;
            }
        };
    },
    hiddenmodules: function(access_data, admin_access, options, v1) {
        if (admin_access == 0 && access_data != undefined) {
            return (v1) ? options.inverse(this) : options.fn(this);
        } else if (admin_access == 1) {
            return (v1) ? options.inverse(this) : options.fn(this);
        } else {
            return "";
        }
    },
    // inaccessright:function (notification_tem, access_rights, custom_fields, options, v1)
    // {	
    // console.log(notification_tem);
    // console.log(access_rights);
    // console.log("......................");
    // if(notification_tem != undefined || access_rights != undefined || custom_fields != undefined){
    // return (true);
    // }
    // else{
    // return (false);
    // }
    // },
    check_value_in: function(array, v1, options) {
        var i = 0;
        if (array.length > 0) {
            for (const [key, value] of Object.entries(array)) {
                if (value.rolename == v1) {
                    var i = 0;
                    return (v1) ? options.fn(this) : options.inverse(this);
                } else {
                    i++;
                }
            }
            if (i != 0) {
                return options.inverse(this);
            }
        } else {
            return options.inverse(this);
        }
    },
    ifEquals: function(array, v1, options) {
        for (var i = 0; i < array.length; i++) {
            if (array > 0) {

                for (var j = 0; j < array[i].length; j++) {
                    console.log("second loop");
                    if (array[i][j] == v1) {
                        return "checked";
                    }
                }
            } else {
                if (array[i] == v1) {
                    return "checked";
                }
            }
        }
    },
    ifEqual: function(array, v1, options) {
        if (array != undefined) {
            for (var i = 0; i < array.length; i++) {
                if (array[i] == v1) {
                    return (v1) ? options.fn(this) : options.inverse(this);
                }
            }
        }
    },
    regexlimit: function(options) {
        var limit = "{1,5000}";
        return new hbs1.SafeString(limit);
    },
    ifCond: function(v1, operator, v2, options) {
        switch (operator) {
            case '==':
                return (v1 == v2) ? options.fn(this) : options.inverse(this);
            case '===':
                return (v1 === v2) ? options.fn(this) : options.inverse(this);
            case '!==':
                return (v1 !== v2) ? options.fn(this) : options.inverse(this);
            case '<':
                return (v1 < v2) ? options.fn(this) : options.inverse(this);
            case '<=':
                return (v1 <= v2) ? options.fn(this) : options.inverse(this);
            case '>':
                return (v1 > v2) ? options.fn(this) : options.inverse(this);
            case '>=':
                return (v1 >= v2) ? options.fn(this) : options.inverse(this);
            case '&&':
                return (v1 && v2) ? options.fn(this) : options.inverse(this);
            case '||':
                return (v1 || v2) ? options.fn(this) : options.inverse(this);
                // default:
                // return options.inverse(this);
        }
    },

    ifCondition: function(v1, operator, v2, operator, v3, options) {

        switch (operator) {
            case '&&':
                return (v1 && v2 && v3) ? options.fn(this) : options.inverse(this);
            case '||':
                return (v1 || v2 || v3) ? options.fn(this) : options.inverse(this);
        }

    },
    ifConditionfive: function(v1, operator, v2, operator, v3, operator, v4, operator, v5, options) {

        switch (operator) {
            case '&&':
                return (v1 && v2 && v3 && v4 && v5) ? options.fn(this) : options.inverse(this);
            case '||':
                return (v1 || v2 || v3 || v4 || v5) ? options.fn(this) : options.inverse(this);
        }

    },

    breadcrums: function(v1, v2, options) {
        var result = '<section class="card"><div class="app-content container123 center-layout mt-2 mx-md-3 px-1"><div class="content-wrapper row"><div class="content-header-left col-md-6 col-sm-6 col-12 mb-1 "><h2 class="content-header-title">' + v2 + '</h2> </div><div class=" breadcrumbs-right breadcrumbs-top col-sm-6 col-md-6 col-12"><div class="breadcrumb-wrapper float-md-right"><ol class="breadcrumb"><li class="breadcrumb-item"><a href="/"><i class="fa fa-home  "></i>' + v1 + '</a></li><li><i class="ft-chevron-right"></i>' + v2 + '</li></ol></div></div></div></div></section>';
        return new hbs1.SafeString(result);
    },

    addelement: function(v1, options) {
        if (v1 == "data") {
            var add = '<div id="addeddiv" class="col-md-6 pb-1"><div class="form-group" style="float:left; width: 92%; margin-right: 8px; "><label class="custom-control-label-date ml-2">Upload Document</label><input class="form-control border-light fileUpload"  name="document" type="file" multiple><span class="required red notice"></span></div><button class="btn" type="button" onclick="deleteParentElement()"><i class=" ft-x"></i></button></div>';
        } else {
            var add = '<div class="col-md-6 pb-1"><div class="form-group"><label class="custom-control-label-date ml-2">Upload Document<span class="required red">*</span></label><input class="form-control border-light fileUpload docfile" id="fileUpload" name="document"  data-validation-required-message="Document is required" type="file" multiple><span class="required red notice"></span></div><div class="help-block"></div></div>';
        }
        return new hbs1.SafeString(add);
    },
    addimage: function(v1, options) {
        if (v1 == "data") {
            var add = '<div id="addedimage" class="col-md-12 p-0"><div class="form-group" style="float:left; width: 90%; margin-right: 8px; "><label class="custom-control-label-date ml-2">Upload Image</label><input class="form-control border-light fileUpload"  name="uploadimages" type="file" multiple><span class="required red notice"></span></div><button style="margin-bottom: 27px;" class="btn" type="button" onclick="deleteaddedimage()"><i class=" ft-x"></i></button></div>';
        } else {
            var add = '<div class="col-md-12 p-0"><div class="form-group"><label class="custom-control-label-date ml-2">Upload Image<span class="required red">*</span></label><input class="form-control border-light fileUpload docfile" id="fileUpload" name="uploadimages"  data-validation-required-message="Image is required" type="file" multiple><span class="required red notice"></span></div><div class="help-block"></div></div>';
        }
        return new hbs1.SafeString(add);
    },
    addnote: function(v1, options) {
        if (v1 == "data") {
            var add = '<div id="addednote" class="col-md-12 p-0 mr-0"><div class="form-group" style="float:left; width: 90%; margin-right: 8px; "><label class="custom-control-label-date ml-2"  style="z-index: 9;">Add Note</label><textarea class="form-control custom-control" rows="4" name="note" style="resize:none"></textarea></div><button style="margin-bottom: 72px;" class="btn" type="button" onclick="deleteaddednote()"><i class=" ft-x"></i></button></div>';
        } else {
            var add = '<div class="col-md-12 p-0 mr-0"><div class="form-group"><label class="custom-control-label-date ml-2"  style="z-index: 9;">Add Note</label><textarea class="form-control custom-control" rows="4" name="note" style="resize:none"></textarea></div><div class="help-block"></div></div>';
        }
        return new hbs1.SafeString(add);
    },
    attachfile: function(v1, options) {
        if (v1 == "data") {
            var add = '<div id="attachfile" class="col-md-12 p-0"><div class="form-group" style="float:left; width: 90%; margin-right: 8px; "><label class="custom-control-label-date ml-2">Attach file</label><input class="form-control border-light"  name="attachfile" type="file" multiple></div><button style="margin-bottom: 27px;" class="btn" type="button" onclick="deleteattachfile()"><i class=" ft-x"></i></button></div>';
        } else {
            var add = '<div class="col-md-12 p-0"><div class="form-group"><label class="custom-control-label-date ml-2">Attach file</label><input class="form-control border-light  docfile" id="fileupload" name="attachfile" type="file" multiple></div><div class="help-block"></div></div>';
        }
        return new hbs1.SafeString(add);
    },
    productimage: function(v1, options) {
        if (v1 == "data") {
            var add = '<div id="addedfile" class="col-md-12 p-0"><div class="form-group" style="float:left; width: 90%; margin-right: 8px; "><label class="custom-control-label-date ml-2">Product Image</label><input class="form-control border-light fileUpload"  name="productimage" type="file" multiple><span class="notice"></span></div><button style="margin-bottom: 27px;" class="btn" type="button" onclick="deleteaddedfile()"><i class=" ft-x"></i></button></div>';
        } else {
            var add = '<div class="col-md-12 p-0"><div class="form-group"><label class="custom-control-label-date ml-2">Product Image</label><input class="form-control border-light fileUpload docfile" id="fileUpload" name="productimage" type="file" multiple><span class="required red notice"></span></div><div class="help-block"></div></div>';
        }
        return new hbs1.SafeString(add);
    },

    getdate: function(date, format) {
        // THIS USE ONLY HBS DATE FORMATE
        if (date != '') {
            var date1 = date;
        } else {
            var date1 = new Date();
        }
        if (format != undefined) {
            var str = format;
        } else {
            var str = 'Y-m-d';
        }
        var Obj = {
            Y: "yyyy",
            m: "mm",
            d: "dd",
            j: "dd",
            F: "mmmm",
        };
        var trans = str.replace(/Y|m|d|j|F/gi, function(matched) {
            return Obj[matched];
        });
        //return dateFormat(date1, trans);
        return dateFormat(date1, trans);
    }, 
	humanize: function(str) {
        // THIS USE ONLY HBS DATE FORMATE
         var i, frags = str.split('_');
		  for (i=0; i<frags.length; i++) {
			frags[i] = frags[i].charAt(0).toUpperCase() + frags[i].slice(1);
		  }
		  return frags.join(' ');
    },

    loannumber: function() {

        //return new Date().getTime();
        return Math.round(new Date().getTime() / 1000);

    },
    currencyList: function(key, options) {

        var currency_symbols = {
            'AED': '&#1583;.&#1573;', // ?
            'AFN': '&#65;&#102;',
            'ALL': '&#76;&#101;&#107;',
            'AMD': '',
            'ANG': '&#402;',
            'AOA': '&#75;&#122;', // ?
            'ARS': '&#36;',
            'AUD': '&#36;',
            'AWG': '&#402;',
            'AZN': '&#1084;&#1072;&#1085;',
            'BAM': '&#75;&#77;',
            'BBD': '&#36;',
            'BDT': '&#2547;', // ?
            'BGN': '&#1083;&#1074;',
            'BHD': '.&#1583;.&#1576;', // ?
            'BIF': '&#70;&#66;&#117;', // ?
            'BMD': '&#36;',
            'BND': '&#36;',
            'BOB': '&#36;&#98;',
            'BRL': '&#82;&#36;',
            'BSD': '&#36;',
            'BTN': '&#78;&#117;&#46;', // ?
            'BWP': '&#80;',
            'BYR': '&#112;&#46;',
            'BYN': '&#8381;',
            'BZD': '&#66;&#90;&#36;',
            'CAD': '&#36;',
            'CDF': '&#70;&#67;',
            'CHF': '&#67;&#72;&#70;',
            'CLF': '', // ?
            'CLP': '&#36;',
            'CNY': '&#165;',
            'COP': '&#36;',
            'CRC': '&#8353;',
            'CUP': '&#8396;',
            'CVE': '&#36;', // ?
            'CZK': '&#75;&#269;',
            'DJF': '&#70;&#100;&#106;', // ?
            'DKK': '&#107;&#114;',
            'DOP': '&#82;&#68;&#36;',
            'DZD': '&#1583;&#1580;', // ?
            'EGP': '&#163;',
            'ETB': '&#66;&#114;',
            'EUR': '&#8364;',
            'FJD': '&#36;',
            'FKP': '&#163;',
            'GBP': '&#163;',
            'GEL': '&#4314;', // ?
            'GHS': '&#162;',
            'GIP': '&#163;',
            'GMD': '&#68;', // ?
            'GNF': '&#70;&#71;', // ?
            'GTQ': '&#81;',
            'GYD': '&#36;',
            'HKD': '&#36;',
            'HNL': '&#76;',
            'HRK': '&#107;&#110;',
            'HTG': '&#71;', // ?
            'HUF': '&#70;&#116;',
            'IDR': '&#82;&#112;',
            'ILS': '&#8362;',
            'IRL': '&#65020;',
            'INR': '&#8377;',
            'IQD': '&#1593;.&#1583;', // ?
            'IRR': '&#65020;',
            'ISK': '&#107;&#114;',
            'JEP': '&#163;',
            'JMD': '&#74;&#36;',
            'JOD': '&#74;&#68;', // ?
            'JPY': '&#165;',
            'KES': '&#75;&#83;&#104;', // ?
            'KGS': '&#1083;&#1074;',
            'KHR': '&#6107;',
            'KMF': '&#67;&#70;', // ?
            'KPW': '&#8361;',
            'KRW': '&#8361;',
            'KWD': '&#1583;.&#1603;', // ?
            'KYD': '&#36;',
            'KZT': '&#1083;&#1074;',
            'LAK': '&#8365;',
            'LBP': '&#163;',
            'LKR': '&#8360;',
            'LRD': '&#36;',
            'LSL': '&#76;', // ?
            'LTL': '&#76;&#116;',
            'LVL': '&#76;&#115;',
            'LYD': '&#1604;.&#1583;', // ?
            'MAD': '&#1583;.&#1605;.', //?
            'MDL': '&#76;',
            'MGA': '&#65;&#114;', // ?
            'MKD': '&#1076;&#1077;&#1085;',
            'MMK': '&#75;',
            'MNT': '&#8366;',
            'MOP': '&#77;&#79;&#80;&#36;', // ?
            'MRO': '&#85;&#77;', // ?
            'MUR': '&#8360;', // ?
            'MVR': '.&#1923;', // ?
            'MWK': '&#77;&#75;',
            'MXN': '&#8369;',
            'MYR': '&#82;&#77;',
            'MZN': '&#77;&#84;',
            'NAD': '&#36;',
            'NGN': '&#8358;',
            'NIO': '&#67;&#36;',
            'NOK': '&#107;&#114;',
            'NPR': '&#8360;',
            'NZD': '&#36;',
            'OMR': '&#65020;',
            'PAB': '&#66;&#47;&#46;',
            'PEN': '&#83;&#47;&#46;',
            'PGK': '&#75;', // ?
            'PHP': '&#8369;',
            'PKR': '&#8360;',
            'PLN': '&#122;&#322;',
            'PYG': '&#71;&#115;',
            'QAR': '&#65020;',
            'RON': '&#108;&#101;&#105;',
            'RSD': '&#1044;&#1080;&#1085;&#46;',
            'RUB': '&#1088;&#1091;&#1073;',
            'RWF': '&#1585;.&#1587;',
            'SAR': '&#65020;',
            'SBD': '&#36;',
            'SCR': '&#8360;',
            'SDG': '&#163;', // ?
            'SEK': '&#107;&#114;',
            'SGD': '&#36;',
            'SHP': '&#163;',
            'SLL': '&#76;&#101;', // ?
            'SOS': '&#83;',
            'SRD': '&#36;',
            'STD': '&#68;&#98;', // ?
            'SVC': '&#36;',
            'SYP': '&#163;',
            'SZL': '&#76;', // ?
            'THB': '&#3647;',
            'TJS': '&#84;&#74;&#83;', // ? TJS (guess)
            'TMT': '&#109;',
            'TND': '&#1583;.&#1578;',
            'TOP': '&#84;&#36;',
            'TRY': '&#8356;', // New Turkey Lira (old symbol used)
            'TTD': '&#36;',
            'TWD': '&#78;&#84;&#36;',
            'TZS': '',
            'UAH': '&#8372;',
            'UGX': '&#85;&#83;&#104;',
            'USD': '&#36;',
            'UYU': '&#36;&#85;',
            'UZS': '&#1083;&#1074;',
            'VEF': '&#66;&#115;',
            'VND': '&#8363;',
            'VUV': '&#86;&#84;',
            'WST': '&#87;&#83;&#36;',
            'XAF': '&#70;&#67;&#70;&#65;',
            'XCD': '&#36;',
            'XDR': '',
            'XOF': '',
            'XPF': '&#70;',
            'YER': '&#65020;',
            'ZAR': '&#82;',
            'ZMK': '&#90;&#75;', // ?
            'ZWL': '&#90;&#36;',
        };
        if (key != null) {
            return currency_symbols[key];
        } else {
            return 'Error!!';
        }
    }
}