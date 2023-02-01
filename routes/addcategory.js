'use strict';
var express = require('express');
var router = express.Router();
var db = require('./mongo_db');
var ObjectId = require('mongodb').ObjectId;
var lang = require('./languageconfig');
var flash = require('express-flash');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var moment = require('moment');

router.use(lang.init);
router.use(cookieParser());
router.use(session({
    secret: '222222'
}));
router.use(flash());

router.route('/:id?')
    .get(isAuthenticated, function(req, res) {
        var languages = lang.getLocale();
        var dbo = db.get();
        var id = req.params.id;
        if (id) {
            var myquery = {
                "_id": ObjectId(id)
            };
            dbo.collection("category").find(myquery).toArray(function(err, result) {
                dbo.collection("categorytypes").find().toArray(function(err, cat_types) {
                    res.render('category/addcategory', {
                        title: 'Edit Category',
                        session: req.session,
                        messages: req.flash(),
                        data: result,
                        types: cat_types
                    });
                });
            });
        } else {
            var myquery = {
                "_id": ObjectId(id)
            };
            var news = [{
                'userid': '-1'
            }];
            dbo.collection("categorytypes").find().toArray(function(err, cat_types) {
                res.render('category/addcategory', {
                    title: "Add Category",
                    data: news,
                    session: req.session,
                    types: cat_types
                });
            });
        }
    })
    .post(isAuthenticated, function(req, res) {
        var id = req.body.id;
        var dbo = db.get();
        var date = Date(Date.now());
        var formatdate = moment(date).format("YYYY-MM-DD");
        if (id) {
            var myquery = {
                "_id": ObjectId(id)
            };
            var newvalues = {
                $set: {
                    categorytypes: req.body.categorytypes,
                    categoryname: req.body.categoryname,
                }
            };
            dbo.collection("category").updateOne(myquery, newvalues, function(err, result) {
                var myobj = {
                    date: formatdate,
                    module: "Category",
                    action: "updated category",
                    user: ObjectId(req.session.user_id),
                    item: req.body.categoryname,
                    status: 0,
                };
                dbo.collection("activitylog").insertOne(myobj, function(err, activity) {});
                if (err) {
                    req.flash('error', 'Error occured.');
                    res.redirect('/category/categorylist');
                } else {
                    req.flash('success', lang.__('Category Updated Sucessfully.'));
                    res.redirect('/category/categorylist');
                }
            });
        } else {
            var myobj = {
                categorytypes: req.body.categorytypes,
                categoryname: req.body.categoryname,
            };
            dbo.collection("category").insertOne(myobj, function(err, result) {
                var myobj = {
                    date: formatdate,
                    module: "Category",
                    action: "inserted category",
                    user: ObjectId(req.session.user_id),
                    item: req.body.categoryname,
                    status: 0,
                };
                dbo.collection("activitylog").insertOne(myobj, function(err, activity) {});
                if (err) {
                    req.flash('error', 'Error occured.');
                    res.redirect('/category/categorylist');
                } else {
                    req.flash('success', lang.__('Category Inserted Sucessfully.'));
                    res.redirect('/category/categorylist');
                }
            });
        }
    })

function isAuthenticated(req, res, next) {
    var dbo = db.get();
    if (req.session.username != undefined) {
        if (req.session.admin_access == 1) {
            return next();
        } else {
            var query = {
                "rolename": req.session.role_slug
            };
            dbo.collection("Access_Rights").find(query).toArray(function(err, result) {
                if (req.url == "/") {
                    if (result[0].access_type != undefined) {
                        if (result[0].access_type.category != undefined) {
                            if (result[0].access_type.category.add != undefined) {
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
                } else {
                    if (result[0].access_type != undefined) {
                        if (result[0].access_type.category != undefined) {
                            if (result[0].access_type.category.update != undefined) {
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
                }
            });
        }
    } else {
        res.redirect('/');
    }
};
module.exports = router;