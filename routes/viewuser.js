'use strict';
var express = require('express');
var router = express.Router();
var http = require('http');
var db = require('./mongo_db');
var ObjectId = require('mongodb').ObjectId;
var bodyParser = require('body-parser');
var fs = require('fs');
var lang = require('./languageconfig');
router.use(lang.init);

/* GET users listing. */
router.route('/:id?')
    .get(isAuthenticated, function(req, res) {

        var dbo = db.get();
        var id = req.params.id;
        // var dbo = db.get();
        //res.json({ success: true });
        if (id) {
            var myquery = {
                "_id": ObjectId(id)
            };
            var result_data = [];
            dbo.collection("Users").find(myquery).toArray(function(err, result) {
                var role = {
                    "_id": result[0].role
                };
                dbo.collection("Role").find(role).toArray(function(err, rolename) {
                    if (err) throw err;

                    result_data = result;
                    var query = {
                        "user_id": ObjectId(id)
                    };

                    var family_data = [];
                    dbo.collection("familydata").find(query).toArray(function(err, family_data1) {
                        if (family_data1 != "") {
                            family_data = family_data1;
                            family_data[0].id_d = ObjectId(family_data1[0]._id).toString();
                        }
                        res.render('users/viewuser', {
                            title: "View User",
                            data: result,
                            role: rolename,
                            family: family_data,
                            id: id,
                            session: req.session,
                        });
                    });
                });
            });
            var news = [];
            var this_news = {
                OrderID: 33,
                ShipName: 33,
                ShipCountry: 30
            };
            news.push(this_news);
            //ews.push(this_news1);
            // db.close();
            var myJsonString = JSON.stringify(news);
        } else {
            var news = [{
                'userid': '-1'
            }];
            res.render('users/adduser', {
                title: "View User",
                data: news,
                family: news,
                session: req.session
            });
        }
    });

function isAuthenticated(req, res, next) {
    if (req.session.username != undefined) {
        if (req.session.admin_access == 1) {
            return next();
        } else {
            var dbo = db.get();
            var query = {
                "rolename": req.session.role_slug
            };
            dbo.collection("Access_Rights").find(query).toArray(function(err, result) {
                if (result[0].access_type != undefined) {
                    if (result[0].access_type.user != undefined) {
                        if (result[0].access_type.user.view != undefined) {
                            return next();
                        } else {
                            res.redirect('/dashboard');
                        }
                    } else {
                        res.redirect('/dashboard');
                    }
                } else {
                    res.redirect('/dashboard');
                }
            });
        }
    } else {
        res.redirect('/');
    }
};

module.exports = router;