'use strict';
var express = require('express');
var router = express.Router();
var http = require('http');
var db = require('./mongo_db');
var ObjectId = require('mongodb').ObjectId;
var Mail = require('./email');
var flash = require('express-flash');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var lang = require('./languageconfig');
var multer = require('multer');

var passarray = multer();
router.use(lang.init);
router.use(cookieParser());
router.use(session({
    secret: '222222'
}));
router.use(flash());

router.route('/:id?')
    .get(isAuthenticated, function(req, res) {
        var dbo = db.get();
        var languages = lang.getLocale();
        var query = {
            "status": 0
        };
        dbo.collection("Role").find(query).toArray(function(err, result) {
            dbo.collection("Access_Rights").find().toArray(function(err, access) {
                dbo.collection("Role").aggregate([{
                    $lookup: {
                        from: 'Access_Rights',
                        localField: 'role_slug',
                        foreignField: 'rolename',
                        as: 'role_db'
                    }
                }, {
                    $unwind: '$role_db'
                }, {
                    $match: {
                        $and: [{
                            status: 0
                        }]
                    }
                }]).toArray(function(err, results) {
                    if (err) throw err;

                    for (const [key, value] of Object.entries(results)) {
                        result[key].dataofaccess = value.role_db;

                    }
                    res.render('accessrights/accessright', {
                        title: "Access Rights",
                        roledata: results,
                        session: req.session,
                        accessrightdata: access,
                        setlang: languages
                    });
                });
            });
        });
    })
    .post(passarray.array(), isAuthenticated, function(req, res) {
        //console.log("------------------------------------");
        //console.log(req.session.access_rights);
        var id = req.body.id;
        if (id) {
            var myquery = {
                "rolename": req.body.role_name
            };
            var dbo = db.get();
            var newvalues = {
                $set: {
                    rolename: req.body.role_name,
                    access_type: req.body.accessrights
                }
            };
            dbo.collection("Access_Rights").updateOne(myquery, newvalues, function(err, access) {
                dbo.collection("Access_Rights").find(myquery).toArray(function(err, accessdata) {
                    //if(req.session.admin_access==0){
                    req.session.access_rights = accessdata[0].access_type;
                    //}
                    if (err) {
                        req.flash('error', 'Error occured.');
                        // console.log(req.flash())
                        res.redirect('/accessrights/accessright');
                    } else {
                        //console.log(req.session.access_rights)
                        //console.log("req.session.access_rights")
                        req.flash('success', lang.__('Access_Rights Updated Sucessfully.'));
                        if (req.session.access_rights != undefined) {
                            if (req.session.access_rights.access != undefined || req.session.admin_access == 1) {
                                res.redirect('/accessrights/accessright');
                            } else {
                                res.redirect("/dashboard")
                            }
                        } else {
                            res.redirect("/dashboard")
                        }
                    }

                });
            });
        } else {
            var dbo = db.get();
            var myobj = {
                rolename: req.body.role_name,
                access_type: req.body.accessrights,
            };
            dbo.collection("Access_Rights").insertOne(myobj, function(err, access) {

                if (err) {
                    req.flash('error', 'Error occured.');
                    //console.log(req.flash())
                    res.redirect('/accessrights/accessright');
                } else {
                    req.flash('success', lang.__('Access_Rights Updated Sucessfully.'));
                    res.redirect('/accessrights/accessright');
                }
            });
        }
    })

function isAuthenticated(req, res, next) {
    var xyz = db.get();
    if (req.session.username != undefined) {
        if (req.session.admin_access == 1) {
            return next();
        } else {
            var query = {
                "rolename": req.session.role_slug
            };
            xyz.collection("Access_Rights").find(query).toArray(function(err, result) {
                if (result[0].access_type != undefined) {
                    if (result[0].access_type.access != undefined) {
                        if (result[0].access_type.access.view != undefined) {
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