'use strict';
var express = require('express');
var router = express.Router();
var db = require('./mongo_db');
var ObjectId = require('mongodb').ObjectId;
var bcrypt = require('bcrypt');
var app = express();
var cookieParser = require('cookie-parser');
var session = require('express-session');
var flash = require('express-flash');
var lang = require('./languageconfig');
var installdata = require('./installation');
var functions = require('../helpers/function');
var moment = require('moment');
var fs = require('fs');

router.use(lang.init);
router.use(cookieParser());
router.use(session({
    secret: '343ji43j4n3jn4jk3n',
    cookie: {
        maxAge: 3600000
    }
}));
router.use(flash());

// Access the session as req.session
/* GET users listing. */
router.get('/', isinstalled, isAuthenticated, function(req, res, next) {
    var languages = lang.getLocale();

    if (req.session.username != undefined) {
        res.redirect('/dashboard');
    } else {
        res.render('login', {
            title: 'NiftyEWS',
            layout: "loginlayout",
            session: req.session,
            message: req.flash(),
            setlang: languages
        });
    }
});
router.post('/', function(req, res) {
    var dbo = db.get();
    /* dbo.collection("Generalsetting").find().toArray(function(err, result) {
			//res.cookie('locale', result[0].language, { maxAge: 90000000, httpOnly: true });
		}); */
    var myquery = {
        "username": req.body.username
    };
    var name = req.body.username;
    var frompass = req.body.password;

    dbo.collection("Users").find(myquery).toArray(function(err, result) {

        if (err) throw err;
        else {
            if (result.length > 0) {
                roleaccess(result[0].role, function(access) {
                    if (access == 1 && result[0].status == 1) {
                        bcrypt.compare(frompass, result[0].password, function(err, rest) {
                            if (rest && name == result[0].username) {
                                // if(frompass == result[0].password && name == result[0].username){
                                req.session.email = result[0].email;
                                req.session.username = result[0].username;
                                req.session.password = req.body.password;
                                req.session.photo = result[0].photo;
                                req.session.user_id = result[0]._id;
                                req.session.role = result[0].role;

                                var noquery = {
                                    "user": ObjectId(req.session.user_id),
                                    status: 1
                                };
                                var query = {
                                    $and: [{
                                        status: 1
                                    }, {
                                        "user": ObjectId(req.session.user_id)
                                    }]
                                }
                                var myquery1 = {
                                    "id": req.body._id
                                };
                                dbo.collection("Generalsetting").find(myquery1).toArray(function(err, result1) {
                                    dbo.collection("Role").find({
                                        "_id": result[0].role
                                    }).toArray(function(err, roledata) {
                                        var mysort = {
                                            date: -1
                                        };
                                        dbo.collection("notification_badges").find(noquery).sort(mysort).toArray(function(err, notiresult) {
                                            dbo.collection("notification_badges").find({
                                                status: 1
                                            }).sort(mysort).toArray(function(err, adminnoti) {
                                                dbo.collection("notification_badges").count((query), function(error, activenoti) {
                                                    dbo.collection("notification_badges").count({
                                                        status: 1
                                                    }, function(error, adminnoticount) {
                                                        dbo.collection("Access_Rights").find({
                                                            "rolename": roledata[0].role_slug
                                                        }).toArray(function(err, accessdata) {
                                                            if (err) throw err;
                                                            else {

                                                                var language = result1[0].language;
                                                                res.cookie('locale', language, {
                                                                    maxAge: 900000,
                                                                    httpOnly: true
                                                                });
                                                                req.session.gen_id = result1[0]._id;
                                                                req.session.company_logo = result1[0].company_logo;
                                                                req.session.footertext = result1[0].footer_text;
                                                                req.session.generaldata = result1[0];
                                                                req.session.role_slug = roledata[0].role_slug;
                                                                req.session.admin_access = roledata[0].admin_access;
                                                                if (accessdata != "") {
                                                                    req.session.access_rights = accessdata[0].access_type;
                                                                }
                                                                if (req.session.admin_access == 1) {
                                                                    req.session.noti = adminnoti;
                                                                    req.session.noticount = adminnoticount;
                                                                } else {
                                                                    req.session.noti = notiresult;
                                                                    req.session.noticount = activenoti;
                                                                }
                                                                var date = Date(Date.now());
                                                                var formatdate = moment(date).format("YYYY-MM-DD");

                                                                if (roledata[0].role_slug == 'admin' || roledata[0].role_slug == 'superadmin') {
                                                                    var query = {
                                                                        "date": formatdate,
                                                                        "status": 0
                                                                    };
                                                                    dbo.collection("emi_details").find(query).toArray(function(err, resulted) {
                                                                        var data = [];
                                                                        resulted.forEach(element => {
                                                                            var myquery = {
                                                                                "_id": element['_id']
                                                                            };

                                                                            var newvalues = {
                                                                                $set: {
                                                                                    status: 1,
                                                                                }
                                                                            };
                                                                            dbo.collection("emi_details").updateOne(myquery, newvalues, function(err, resulted) {
                                                                                if (err) {

                                                                                } else {

                                                                                }
                                                                            });
                                                                        });

                                                                    });
                                                                } else {
                                                                    var query = {
                                                                        "user_id": result[0]._id,
                                                                        "status": 1,
                                                                        "date": formatdate
                                                                    };
                                                                }
                                                            }
                                                            req.session.impersondata = '';
                                                            res.redirect('/dashboard');
                                                        });
                                                    });
                                                });
                                            });
                                        });
                                    });
                                });
                            } else {
                                req.flash('error', 'You are not allow to login. Enter correct username or password.');
                                res.render('login', {
                                    title: 'NiftyEWS',
                                    layout: "loginlayout"
                                });
                            }
                        });
                    } else {
                        req.flash('error', 'You are not allow to login.');
                        res.render('login', {
                            title: 'NiftyEWS',
                            layout: "loginlayout"
                        });
                    }
                });
            } else {
                req.flash('error', 'Invalid username or password.');
                res.render('login', {
                    title: 'NiftyEWS',
                    layout: "loginlayout"
                });
            }
        }
    });
    /*for Generalsetting id*/
});

router.get('/logout', isAuthenticated, function(req, res) {
    req.session.destroy(function(err) {
        res.clearCookie('locale');
        res.redirect('/');
    })
});

function isinstalled(req, res, next) {
    fs.exists('./temp/temp.txt', function(exists) {
        console.log("file exists ? " + exists);
        if (exists == true) {
            return next();
        } else {
            res.render('installation', {
                title: 'NiftyEWS',
                layout: "loginlayout"
            });
        }
    });
};

function isAuthenticated(req, res, next) {

    if (req.session.username != undefined) {
        return next();
    } else {
        res.render('login', {
            title: 'NiftyEWS',
            layout: "loginlayout"
        });
    }
};

function roleaccess(role, callback) {
    var dbo = db.get();
    var myquery = {
        "_id": ObjectId(role)
    };
    var dbo = db.get();
    dbo.collection("Role").find(myquery).toArray(function(err, result) {
        if (result.length > 0) {
            if (1 == result[0].allow_access) {
                return callback(1);
            } else {
                return callback(0);
            }
        }
    });
};

module.exports = router;