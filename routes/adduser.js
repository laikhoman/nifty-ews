'use strict';
var express = require('express');
var router = express.Router();
var http = require('http');
var db = require('./mongo_db');
var ObjectId = require('mongodb').ObjectId;
var bodyParser = require('body-parser');
var bcrypt = require('bcrypt');
var flash = require('express-flash');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var fs = require('fs');
var Mail = require('./email');
var moment = require('moment');
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
        callback(null, 'public/images/upload');
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
        var languages = lang.getLocale();
        var dbo = db.get();
        var id = req.params.id;
        global.msg = 1;

        if (id) {
            var myquery = {
                "_id": ObjectId(id)
            };
            var result_data = [];
            dbo.collection("Users").find(myquery).toArray(function(err, result) {
                result_data = result;
                result_data[0].id_d = ObjectId(result_data[0].role).toString();
                var query = {
                    "user_id": ObjectId(id)
                };
                var family_data = [];
                dbo.collection("familydata").find(query).toArray(function(err, family_data1) {
                    if (family_data1 != "") {
                        family_data = family_data1;
                        family_data[0].id_d = ObjectId(family_data1[0]._id).toString();
                    }
                    dbo.collection("Role").find().toArray(function(err, role_name) {
                        fs.readFile('public/data/countries.json', function(err, data) {
                            var jsonData = data;
                            var jsonParsed = JSON.parse(jsonData);

                            for (const [key, value] of Object.entries(role_name)) {
                                role_name[key].id_d = ObjectId(value._id).toString();
                            };
                            dbo.collection("Generalsetting").find().toArray(function(err, setting) {
                                var mydata = {
                                    $and: [{
                                        "module_name": "user"
                                    }, {
                                        "field_visibility": 1
                                    }]
                                };
                                dbo.collection("customfields").find(mydata).toArray(function(err, customfield) {

                                    for (const [key, value] of Object.entries(customfield)) {
                                        customfield.forEach(element => {
                                            customfield[key].id_d = ObjectId(value._id).toString();
                                        });
                                    };
                                    var myquery1 = {
                                        "reference_id": ObjectId(id)
                                    };
                                    dbo.collection("custom_field_meta").find(myquery1).toArray(function(err, customfield_value) {
                                        for (const [key, value] of Object.entries(customfield_value)) {
                                            customfield_value[key].id_d = ObjectId(value.custom_field_id).toString();
                                        };
                                        res.render('users/adduser', {
                                            title: "Edit User",
                                            data: result_data,
                                            id: id,
                                            role: role_name,
                                            family: family_data,
                                            session: req.session,
                                            country: jsonParsed.countries,
                                            setting: setting,
                                            setlang: languages,
                                            newfield: customfield,
                                            customfield_value: customfield_value
                                        });
                                    });
                                });
                            });
                        });
                    });
                });
            });
        } else {
            dbo.collection("Role").find().toArray(function(err, role_name) {
                dbo.collection("Generalsetting").find().toArray(function(err, setting) {

                    var mydata = {
                        $and: [{
                            "module_name": "user"
                        }, {
                            "field_visibility": 1
                        }]
                    };
                    dbo.collection("customfields").find(mydata).toArray(function(err, customfield) {

                        var news = [{
                            'userid': '-1'
                        }];
                        fs.readFile('public/data/countries.json', function(err, data) {
                            var jsonData = data;
                            var jsonParsed = JSON.parse(jsonData);
                            res.render('users/adduser', {
                                title: "Add User",
                                data: news,
                                role: role_name,
                                family: news,
                                session: req.session,
                                country: jsonParsed.countries,
                                setting: setting,
                                newfield: customfield
                            });
                        });
                    });
                });
            });
        }
    })
    // FOR FORM UPDATE AND ADD
    .post(upload.any(), isAuthenticated, function(req, res) {
        var id = req.body.id;
        var msg;
        var i = 0;
        if (id) {
            var myquery = {
                "_id": ObjectId(id)
            };
            var dbo = db.get();
            var user_id = ObjectId(id);
            for (const [key, value] of Object.entries(req.files)) {
                if (value.fieldname == "photo") {
                    var img = value.filename;
                    i++;
                }
            }
            if (i == 0) {
                var img = req.body.photo_old;
            }
            bcrypt.hash(req.body.password, 10, function(err, hash) {
                // Store hash in database
                if (req.body.password != '') {
                    // var pass= md5(req.body.password);
                    var pass = hash;
                } else {
                    var pass = req.body.password_old;
                }
                var roleid = req.body.role;
                var idrole = ObjectId(roleid);
                var birthdate = moment(req.body.birthdate).format("YYYY-MM-DD");
                var newvalues = {
                    $set: {
                        firstname: req.body.firstname,
                        middlename: req.body.middlename,
                        lastname: req.body.lastname,
                        email: req.body.email,
                        photo: img,
                        ccode: req.body.ccode,
                        mobile: req.body.mobile,
                        occupation: req.body.occupation,
                        birthdate: birthdate,
                        gender: req.body.gender,
                        username: req.body.username,
                        role: idrole,
                        password: pass,
                        address: req.body.address,
                        country: parseInt(req.body.country, 10),
                        state: parseInt(req.body.state, 10),
                        city: parseInt(req.body.city, 10),
                        pincode: req.body.pincode,
                        accountnumber: req.body.accountnumber,
                        pannumber: req.body.pannumber,
                        status: 1,
                    }
                };

                dbo.collection("Users").updateOne(myquery, newvalues, function(err, result) {
                    var date = Date(Date.now());
                    var formatdate = moment(date).format("YYYY-MM-DD");
                    dbo.collection("notificationtemplate").find({
                        templatetitle: "user profile updated"
                    }).toArray(function(err, notification) {
                        for (const [key, value] of Object.entries(notification)) {
                            var message = value.content;
                            var subject = value.subject;
                            var Obj = {
                                '_USERFIRSTNAME_': req.body.firstname,
                                '_USERLASTNAME_': req.body.lastname,
                                '_DATETIME_': formatdate,
                                '_newline_': '<br>',
                                '_tab_': '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;',
                                '_systemname_': req.session.generaldata.com_name,
                            };
                            var trans = message.replace(/_USERFIRSTNAME_|_USERLASTNAME_|_newline_|_tab_|_systemname_|_DATETIME_/gi, function(matched) {
                                return Obj[matched];
                            });
                            var subtrans = subject.replace(/_USERFIRSTNAME_|_USERLASTNAME_|_newline_|_tab_|_systemname_|_DATETIME_/gi, function(matched) {
                                return Obj[matched];
                            });
                            Mail.sendMail(req.body.email, subtrans, trans);
                        };
                    });
                    var myobj = {
                        date: formatdate,
                        module: "User",
                        action: "updated user named",
                        user: ObjectId(req.session.user_id),
                        item: req.body.username,
                        status: 0,
                    };
                    dbo.collection("activitylog").insertOne(myobj, function(err, activity) {});

                    var query = {
                        "reference_id": ObjectId(id)
                    };
                    dbo.collection("custom_field_meta").find(query).toArray(function(err, metadata) {
                        if (metadata != "") {
                            var date = Date(Date.now());
                            var formatdate = moment(date).format("YYYY-MM-DD");
                            if (req.body.customfields) {
                                for (const [keys, values] of Object.entries(metadata)) {
                                    var findquery = {
                                        "_id": values.custom_field_id
                                    };
                                    dbo.collection("customfields").find(findquery).toArray(function(err, finddata) {
                                        for (const [keysdata, valuesdata] of Object.entries(finddata)) {
                                            if (valuesdata.field_type == 'file') {
                                                for (const [key, value] of Object.entries(req.files)) {
                                                    if (value.fieldname == "photo") {} else {
                                                        var field = ObjectId(values.custom_field_id).toString();
                                                        if (value.fieldname == field) {
                                                            var query1 = {
                                                                "_id": values._id
                                                            };
                                                            dbo.collection("custom_field_meta").remove(query1, function(err, deletealldata) {
                                                                if (err) throw err;
                                                            });
                                                        }

                                                    }
                                                }
                                            } else {
                                                var query1 = {
                                                    "_id": values._id
                                                };
                                                dbo.collection("custom_field_meta").remove(query1, function(err, deletealldata) {
                                                    if (err) throw err;
                                                });
                                            }
                                        }
                                    });
                                }
                                for (const [keys1, values1] of Object.entries(req.body.customfields)) {
                                    var this_data = {
                                        custom_field_id: ObjectId(keys1),
                                        customfield_value: values1,
                                        module: "user",
                                        user_id: ObjectId(req.session.user_id),
                                        reference_id: ObjectId(id),
                                        updated_at: formatdate,
                                    }
                                    dbo.collection("custom_field_meta").insertOne(this_data, function(err, result2) {});
                                }
                            }
                            var m = 0;
                            for (const [key, value] of Object.entries(req.files)) {
                                if (value.fieldname == "uploadimages" || value.fieldname == "attachfile") {} else {
                                    for (const [keys, values] of Object.entries(metadata)) {
                                        var query1 = {
                                            "_id": values._id
                                        };
                                        var field = ObjectId(values.custom_field_id).toString();
                                        if (value.fieldname == field) {} else {
                                            if (values._id) {
                                                m++;
                                            }
                                        }
                                    }
                                    if (m > 0) {
                                        var this_data = {
                                            custom_field_id: ObjectId(value.fieldname),
                                            customfield_value: value.filename,
                                            module: "user",
                                            user_id: ObjectId(req.session.user_id),
                                            reference_id: ObjectId(id),
                                            updated_at: formatdate,
                                        }
                                        dbo.collection("custom_field_meta").insertOne(this_data, function(err, result2) {});
                                    }
                                }
                            }
                        } else {
                            if (req.body.customfields) {
                                for (const [key, value] of Object.entries(req.body.customfields)) {
                                    var this_data = {
                                        custom_field_id: ObjectId(key),
                                        customfield_value: value,
                                        module: "user",
                                        user_id: ObjectId(req.session.user_id),
                                        reference_id: ObjectId(id),
                                        updated_at: formatdate,
                                    }
                                    dbo.collection("custom_field_meta").insertOne(this_data, function(err, result2) {});
                                }
                            }
                            if (req.files) {
                                for (const [key, value] of Object.entries(req.files)) {
                                    if (value.fieldname == "photo") {

                                    } else {
                                        var this_data = {
                                            custom_field_id: ObjectId(value.fieldname),
                                            customfield_value: value.filename,
                                            module: "user",
                                            user_id: ObjectId(req.session.user_id),
                                            reference_id: ObjectId(id),
                                            updated_at: formatdate,
                                        }
                                        dbo.collection("custom_field_meta").insertOne(this_data, function(err, result5) {});
                                    }
                                }
                            }
                        }
                        if (err) throw err;
                    });
                });
            });
            var m = 0;
            var data = [];
            if (req.body.family) {
                for (const [key, value] of Object.entries(req.body.family)) {
                    if (value.id != '') {

                        var myquery1 = {
                            "_id": ObjectId(value.id)
                        };
                        var newval = {
                            $set: {
                                familymember: value.familymember,
                                relationship: value.relationship,
                                famoccupation: value.famoccupation,
                                famcontact: value.famcontact,
                                income: value.income,
                            }
                        };
                        dbo.collection("familydata").updateOne(myquery1, newval, {
                            multi: true
                        }, function(err, result) {
                            if (err) {
                                m++;
                            }
                        });
                    } else {
                        var this_data = [];
                        this_data = {
                            user_id: user_id,
                            familymember: value.familymember,
                            relationship: value.relationship,
                            famoccupation: value.famoccupation,
                            famcontact: value.famcontact,
                            income: value.income,
                        }
                        dbo.collection("familydata").insertOne(this_data, function(err, result) {
                            if (err) {
                                m++;
                            }
                        });
                    }
                }
            }
            var date = Date(Date.now());
            var formatdate = moment(date).format("YYYY-MM-DD");
            dbo.collection("Users").find({
                "_id": ObjectId(id)
            }).toArray(function(err, useresult) {
                var myobj = {
                    action: "User Updated",
                    desc: "is updated",
                    user: ObjectId(id),
                    Name: req.body.username,
                    date: formatdate,
                    status: useresult[0].status
                };
                var noquery = {
                    "user": ObjectId(req.session.user_id)
                };
                var query = {
                    $and: [{
                        status: 1
                    }, {
                        "user": ObjectId(req.session.user_id)
                    }]
                }
                dbo.collection("notification_badges").insertOne(myobj, function(err, noti) {
                    dbo.collection("notification_badges").find(noquery).toArray(function(err, notiresult) {
                        dbo.collection("notification_badges").find().toArray(function(err, adminnoti) {
                            dbo.collection("notification_badges").count((query), function(error, activenoti) {
                                dbo.collection("notification_badges").count({}, function(error, adminnoticount) {
                                    if (req.session.admin_access == 1) {
                                        req.session.noti = adminnoti;
                                        req.session.noticount = adminnoticount;
                                    } else {
                                        req.session.noti = notiresult;
                                        req.session.noticount = activenoti;
                                    }
                                    if (m > 0) {
                                        req.flash('error', lang.__('Error occured.'));
                                        res.redirect('/users/userlist');
                                    } else {
                                        req.flash('success', lang.__('User Updated Sucessfully.'));
                                        res.redirect('/users/userlist');
                                    }
                                });
                            });
                        });
                    });
                });
            });
        } else {

            var dbo = db.get();
            for (const [key, value] of Object.entries(req.files)) {
                if (value.fieldname == "photo") {
                    var img = value.filename;
                }
            }
            bcrypt.hash(req.body.password, 10, function(err, hash) {
                // Store hash in database
                var pass = hash;
                var roleid = req.body.role;
                var idrole = ObjectId(roleid);
                var birthdate = moment(req.body.birthdate).format("YYYY-M-D");
                var myobj = {
                    firstname: req.body.firstname,
                    middlename: req.body.middlename,
                    lastname: req.body.lastname,
                    email: req.body.email,
                    photo: img,
                    ccode: req.body.ccode,
                    mobile: req.body.mobile,
                    occupation: req.body.occupation,
                    birthdate: birthdate,
                    gender: req.body.gender,
                    username: req.body.username,
                    role: idrole,
                    password: pass,
                    address: req.body.address,
                    country: parseInt(req.body.country, 10),
                    state: parseInt(req.body.state, 10),
                    city: parseInt(req.body.city, 10),
                    pincode: req.body.pincode,
                    accountnumber: req.body.accountnumber,
                    pannumber: req.body.pannumber,
                    status: 1,
                };
                dbo.collection("Users").insertOne(myobj, function(err, result) {
                    var date = Date(Date.now());
                    var formatdate = moment(date).format("YYYY-MM-DD");
                    var myobj = {
                        date: formatdate,
                        module: "User",
                        action: "inserted user named",
                        user: ObjectId(req.session.user_id),
                        item: req.body.username,
                        status: 0,
                    };
                    dbo.collection("activitylog").insertOne(myobj, function(err, activity) {});

                    if (err) throw err;
                    dbo.collection("notificationtemplate").find({
                        templatetitle: "Added User"
                    }).toArray(function(err, notification) {
                        var myquery2 = {
                            "_id": idrole
                        };
                        dbo.collection("Role").find(myquery2).toArray(function(err, role) {

                            for (const [key, value] of Object.entries(notification)) {
                                var message = value.content;
                                var subject = value.subject;
                                var Obj = {
                                    '_USERFIRSTNAME_': req.body.firstname,
                                    '_USERLASTNAME_': req.body.lastname,
                                    '_ROLENAME_': role[0].role_nm,
                                    '_username_': req.body.username,
                                    '_password_': req.body.password,
                                    '_newline_': '<br>',
                                    '_tab_': '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;',
                                    '_systemname_': req.session.generaldata.com_name,
                                };
                                var trans = message.replace(/_USERFIRSTNAME_|_USERLASTNAME_|_ROLENAME_|_newline_|_tab_|_systemname_|_username_|_password_/gi, function(matched) {
                                    return Obj[matched];
                                });
                                var subtrans = subject.replace(/_USERFIRSTNAME_|_USERLASTNAME_|_ROLENAME_|_newline_|_tab_|_systemname_|_username_|_password_/gi, function(matched) {
                                    return Obj[matched];
                                });
                                Mail.sendMail(req.body.email, subtrans, trans);
                            };
                            var data = [];
                            req.body.family.forEach(element => {
                                var this_news = {
                                    user_id: result.insertedId,
                                    familymember: element.familymember,
                                    relationship: element.relationship,
                                    famoccupation: element.famoccupation,
                                    famcontact: element.famcontact,
                                    income: element.income,
                                }
                                data.push(this_news);
                            });
                            dbo.collection("familydata").insertMany(data, function(err, result1) {
                                if (req.body.customfields) {
                                    for (const [key, value] of Object.entries(req.body.customfields)) {
                                        var this_data = {
                                            custom_field_id: ObjectId(key),
                                            customfield_value: value,
                                            module: "user",
                                            user_id: ObjectId(req.session.user_id),
                                            reference_id: result.insertedId,
                                            updated_at: formatdate,
                                        }
                                        dbo.collection("custom_field_meta").insertOne(this_data, function(err, result2) {});
                                    }
                                }
                                if (req.files) {
                                    for (const [key, value] of Object.entries(req.files)) {
                                        if (value.fieldname == "photo") {

                                        } else {
                                            var this_data = {
                                                custom_field_id: ObjectId(value.fieldname),
                                                customfield_value: value.filename,
                                                module: "user",
                                                user_id: ObjectId(req.session.user_id),
                                                reference_id: result.insertedId,
                                                updated_at: formatdate,
                                            }
                                            dbo.collection("custom_field_meta").insertOne(this_data, function(err, result5) {});
                                        }
                                    }
                                }
                                var date = Date(Date.now());
                                var formatdate = moment(date).format("YYYY-MM-DD");
                                dbo.collection("Users").find({
                                    "_id": result.insertedId
                                }).toArray(function(err, useresult) {
                                    var myobj = {
                                        action: "New User",
                                        desc: "New account created.",
                                        user: ObjectId(req.session.user_id),
                                        date: formatdate,
                                        status: useresult[0].status
                                    };
                                    var noquery = {
                                        "user": ObjectId(req.session.user_id)
                                    };
                                    var query = {
                                        $and: [{
                                            status: 1
                                        }, {
                                            "user": ObjectId(req.session.user_id)
                                        }]
                                    }
                                    dbo.collection("notification_badges").insertOne(myobj, function(err, noti) {
                                        dbo.collection("notification_badges").find(noquery).toArray(function(err, notiresult) {
                                            dbo.collection("notification_badges").find().toArray(function(err, adminnoti) {
                                                dbo.collection("notification_badges").count((query), function(error, activenoti) {
                                                    dbo.collection("notification_badges").count({}, function(error, adminnoticount) {
                                                        if (req.session.admin_access == 1) {
                                                            req.session.noti = adminnoti;
                                                            req.session.noticount = adminnoticount;
                                                        } else {
                                                            req.session.noti = notiresult;
                                                            req.session.noticount = activenoti;
                                                        }
                                                        if (err) {
                                                            req.flash('error', lang.__('Error occured.'));
                                                            res.redirect('/users/userlist');
                                                        } else {
                                                            req.flash('success', lang.__('User Instered Sucessfully.'));
                                                            res.redirect('/users/userlist');
                                                        }
                                                    });
                                                });
                                            });
                                        });
                                    });
                                });
                            });
                        });
                    });
                });
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
                        if (result[0].access_type.user != undefined) {
                            if (result[0].access_type.user.add != undefined) {
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
                        if (result[0].access_type.user != undefined) {
                            if (result[0].access_type.user.update != undefined) {
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