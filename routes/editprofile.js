'use strict';
var express = require('express');
var router = express.Router();
var http = require('http');
var db = require('./mongo_db');
var ObjectId = require('mongodb').ObjectId;
var bodyParser = require('body-parser');
var md5 = require('md5');
var flash = require('express-flash');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var fs = require('fs');
var lang = require('./languageconfig');
router.use(lang.init);

// FOR IMAGE SAVE
var multer = require('multer');
var app = express();
var jsonParser = bodyParser.json();

// create application/x-www-form-urlencoded parser
var urlencodedParser = bodyParser.urlencoded({
    extended: false
});
var storage = multer.diskStorage({

    // file upload destination
    destination: function(req, file, callback) {
        callback(null, 'public/images/upload/');
    },
    filename: function(req, file, callback) {
        callback(null, Date.now() + '-' + file.originalname);
    }
});
var upload = multer({
        storage: storage
    });
    // IMAGE SAVE END

// FOR GETTING VALUE IN FORM EDIT
router.use(cookieParser());
router.use(session({
    secret: '222222'
}));
router.use(flash());

router.route('/:id?')
    .get(isAuthenticated, function(req, res) {
        var dbo = db.get();
        var id = req.params.id;
        global.msg = 1;

        if (id) {
            var myquery = {
                "_id": ObjectId(id)
            };
            var result_data = [];
            dbo.collection("Users").find(myquery).toArray(function(err, result) {
                //res.render('adduser', { data: result,id:id	}); 
                result_data = result;
                result_data[0].id_d = ObjectId(result_data[0].role).toString();


                dbo.collection("Role").find().toArray(function(err, role_name) {

                    fs.readFile('public/data/countries.json', function(err, data) {
                        var jsonData = data;
                        var jsonParsed = JSON.parse(jsonData);
                        for (const [key, value] of Object.entries(role_name)) {

                            role_name[key].id_d = ObjectId(value._id).toString();

                        };
                        dbo.collection("Generalsetting").find().toArray(function(err, setting) {

                            res.render('users/editprofile', {
                                title: "Edit Profile",
                                data: result_data,
                                id: id,
                                role: role_name,
                                session: req.session,
                                country: jsonParsed.countries,
                                setting: setting
                            });
                        });
                    });
                });
            });
        } else {
            dbo.collection("Role").find().toArray(function(err, role_name) {
                var news = [{
                    'userid': '-1'
                }];
                fs.readFile('public/data/countries.json', function(err, data) {
                    var jsonData = data;
                    var jsonParsed = JSON.parse(jsonData);
                    res.render('users/adduser', {
                        title: "Edit Profile",
                        data: news,
                        role: role_name,
                        session: req.session,
                        country: jsonParsed.countries
                    });
                });
            });
        }
    })
    // FOR FORM UPDATE AND ADD
    .post(upload.single('photo'), isAuthenticated, function(req, res) {
        var id = req.body.id;
        var msg;
        if (id) {
            var myquery = {
                "_id": ObjectId(id)
            };
            var dbo = db.get();
            if (req.file != undefined) {
                var photo = req.file.filename;
            } else {
                var photo = req.body.photo_old;
            }
            if (req.body.password != '') {
                var pass = md5(req.body.password);

            } else {
                var pass = req.body.password_old;	
            }
            var roleid = req.body.role;
            var idrole = ObjectId(roleid);
            var newvalues = {
                $set: {
                    firstname: req.body.firstname,
                    middlename: req.body.middlename,
                    lastname: req.body.lastname,
                    email: req.body.email,
                    photo: photo,
                    ccode: req.body.ccode,
                    mobile: req.body.mobile,
                    occupation: req.body.occupation,
                    birthdate: req.body.birthdate,
                    gender: req.body.gender,
                    username: req.body.username,
                    role: idrole,
                    password: pass,
                    address: req.body.address,
                    country: parseInt(req.body.country, 10),
                    state: parseInt(req.body.state, 10),
                    city: parseInt(req.body.city, 10),
                    pincode: req.body.pincode,
                    status: 1,
                }
            };
            dbo.collection("Users").updateOne(myquery, newvalues, function(err, result) {
                if (err) {
                    req.flash('error', 'Error occured.');
                    res.redirect('/dashboard');
                } else {
                    req.session.email = req.body.email;
                    req.session.username = req.body.username;
                    req.session.photo = photo;
                    req.session.role = idrole;

                    req.flash('success', 'User Updated Sucessfully.');
                    res.redirect('/dashboard');
                }

            });
        } else {
            var dbo = db.get();
            var pass = md5(req.body.password);
            var pass1 = md5(req.body.confirmpassword);
            var roleid = req.body.role;
            var idrole = ObjectId(roleid);
            var myobj = {
                firstname: req.body.firstname,
                middlename: req.body.middlename,
                lastname: req.body.lastname,
                email: req.body.email,
                photo: req.file.filename,
                ccode: req.body.ccode,
                mobile: req.body.mobile,
                occupation: req.body.occupation,
                birthdate: req.body.birthdate,
                gender: req.body.gender,
                username: req.body.username,
                role: idrole,
                password: pass,
                address: req.body.address,
                country: parseInt(req.body.country, 10),
                state: parseInt(req.body.state, 10),
                city: parseInt(req.body.city, 10),
                pincode: req.body.pincode,
                status: 1,
            };
            dbo.collection("Users").insertOne(myobj, function(err, result) {
                if (err) {
                    req.flash('error', 'Error occured.');
                    res.redirect('/dashboard');
                } else {
                    req.session.email = req.body.email;
                    req.session.username = req.body.username;
                    req.session.photo = photo;
                    req.session.role = idrole;

                    req.flash('success', 'User Instered Sucessfully.');
                    res.redirect('/dashboard');
                }
            });
        }
    });
// router.post('/getstate',isAuthenticated, function (req, res){
// fs.readFile('public/data/countries.json', function(err, data) { 
// var jsonData = data;
// var jsonParsed = JSON.parse(jsonData);
// });
// });


function isAuthenticated(req, res, next) {

    if (req.session.username != undefined) {
        return next();
    } else {
        res.redirect('/');
    }

};

module.exports = router;