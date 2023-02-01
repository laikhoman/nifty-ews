'use strict';
var hbs1 = require('hbs');
var fs = require('fs');
var db = require('../routes/mongo_db');
var ObjectId = require('mongodb').ObjectId;
var dateFormat = require('dateformat');

module.exports = {
    getuserdata: function(id, fieldname, callback) {
        var xyz = db.get();
        var myquery = {
            "_id": ObjectId(id)
        };
        xyz.collection("Users").find(myquery).toArray(function(err, result) {
            if (result.length > 0) {
                if (fieldname == "name") {
                    var username = result[0].firstname + " " + result[0].lastname;
                    return callback(username);
                } else {
                    return callback(result[0][fieldname]);
                }
            } else {
                return "No User";
            }
        });
    },
    getloantype: function(id, fieldname, callback) {
        var xyz = db.get();
        var myquery = {
            "_id": ObjectId(id)
        };
        xyz.collection("loantype").find(myquery).toArray(function(err, result) {
            if (result.length > 0) {
                return callback(result[0][fieldname]);
            } else {
                return "No loantype";
            }
        });
    },
    getrole(id, fieldname, callback) {
        var xyz = db.get();
        var myquery = {
            "_id": ObjectId(id)
        };

        xyz.collection("Role").find(myquery).toArray(function(err, result) {
            console.log(result);
            console.log("123456");
            if (result.length > 0) {
                return callback(result[0][fieldname]);
            } else {
                return "No Role";
            }
        });
    },
    getuserrole(id) {
        var xyz = db.get();
        var myquery = {
            "_id": ObjectId(id)
        };

        xyz.collection("Role").find(myquery).toArray(function(err, result) {

            if (result.length > 0) {
                var rolename = result[0].role_nm;
                //return callback(result[0].role_nm);
                //console.log(rolename);
                return rolename;
            } else {
                return "No Role";
            }
        });
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

        return dateFormat(date1, trans);
    },

}