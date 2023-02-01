'use strict';
var express = require('express');
var router = express.Router();
var db = require('./mongo_db');
var ObjectId = require('mongodb').ObjectId;
var fs = require('fs');
var Mail = require('./email');
var functions = require('../helpers/function');
var moment = require('moment');
var AmortizeJS = require('amortizejs').Calculator;
var session = require('express-session');
router.use(session({
    secret: '343ji43j4n3jn4jk3n',
    cookie: {
        maxAge: 3600000
    }
}));

/* GET users listing. */
router.get('/', isAuthenticated, function(req, res, next) {
    var dbo = db.get("BankingSystem");
    var query = {
        status: 1
    };
    var result_final = [];

    /*dbo.collection("Users").find(query).toArray(function(err, result) {
		if (err) throw err;

		for (const [key,value] of Object.entries(result)) {
			var birthdate_f=functions.getdate(value.birthdate,req.session.generaldata.date_format);
			result[key].birthdate = birthdate_f;
			
		}
		res.json(result);
	});*/

    dbo.collection("Users").aggregate([{
        $lookup: {
            from: 'Role',
            localField: 'role',
            foreignField: '_id',
            as: 'role_nm'
        }
    }, {
        $unwind: '$role_nm'
    }, {
        $match: {
            $and: [{
                status: 1
            }]
        }
    }]).toArray(function(err, result) {
        if (err) throw err;
        if (req.session.admin_access == 0) {
            if (req.session.access_rights.user.owndata) {

                for (const [key, value] of Object.entries(result)) {
                    if (req.session.user_id == value._id) {
                        var birthdate_f = functions.getdate(value.birthdate, req.session.generaldata.date_format);
                        result[key].birthdate = birthdate_f;
                        result_final.push(result[key]);
                    }
                }
            } else {
                for (const [key, value] of Object.entries(result)) {

                    if (value.role_nm.role_slug == 'admin' || value.role_nm.role_slug == 'superadmin') {

                    } else {
                        var birthdate_f = functions.getdate(value.birthdate, req.session.generaldata.date_format);
                        result[key].birthdate = birthdate_f;
                        result_final.push(result[key]);
                    }
                }
            }
        } else {
            for (const [key, value] of Object.entries(result)) {
                var birthdate_f = functions.getdate(value.birthdate, req.session.generaldata.date_format);
                result[key].birthdate = birthdate_f;
                result_final.push(result[key]);
            }
        }

        res.json(result_final);
    })
});

router.get('/deactivateuser', isAuthenticated, function(req, res, next) {
    var dbo = db.get("BankingSystem");
    var query = {
        status: 0
    };

    dbo.collection("Users").find(query).toArray(function(err, result) {
        if (err) throw err;
        // res.setHeader('Content-Type', 'application/json');

        res.json(result);
        //res.json({ data: result });
    });
});
router.get('/delete/', isAuthenticated, function(req, res) {
    var dbo = db.get("BankingSystem");
    var id = req.query._id;
    var myquery = {
        "_id": ObjectId(id)
    };

    var newvalues = {
        $set: {
            status: 0,
        }
    }

    dbo.collection("Users").updateOne(myquery, newvalues, function(err, result) {
        var date = Date(Date.now());
        var formatdate = moment(date).format("YYYY-MM-DD");
        dbo.collection("Users").find(myquery).toArray(function(err, useresult) {
            dbo.collection("notificationtemplate").find({
                templatetitle: "user deleted"
            }).toArray(function(err, notification) {
                for (const [key, value] of Object.entries(notification)) {
                    for (const [key1, value1] of Object.entries(useresult)) {
                        var message = value.content;
                        var subject = value.subject;
                        var Obj = {
                            '_USERFIRSTNAME_': value1.firstname,
                            '_USERLASTNAME_': value1.lastname,
                            '_DATETIME_': formatdate,
                            '_newline_': '<br>',
                            '_tab_': '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;',
                            '_systemname_': req.session.generaldata.com_name,
                        };
                        var trans = message.replace(/_USERFIRSTNAME_|_USERLASTNAME_|_DATETIME_|_newline_|_tab_|_systemname_/gi, function(matched) {
                            return Obj[matched];
                        });
                        var subtrans = subject.replace(/_USERFIRSTNAME_|_USERLASTNAME_|_DATETIME_|_newline_|_tab_|_systemname_/gi, function(matched) {
                            return Obj[matched];
                        });
                        Mail.sendMail(value1.email, subtrans, trans);
                    };
                };
            });
        });
        if (err) {
            res.json(false);
        } else {
            res.json(true);
        }
    });

    //res.redirect('/userlist');
});
router.get('/deleteloan/', isAuthenticated, function(req, res) {
    var dbo = db.get("BankingSystem");
    var id = req.query._id;
    var myquery = {
        "_id": ObjectId(id)
    };
    var newvalues = {
        $set: {
            status: 0,
        }
    }
    dbo.collection("loan_details").updateOne(myquery, newvalues, function(err, result) {
        dbo.collection("emi_details").remove({
            "loan_id": ObjectId(id)
        }, function(err, result) {

            if (err) {
                res.json(false);
            } else {
                res.json(true);
            }
        });
    });
});
router.get('/deletenoti', isAuthenticated, function(req, res) {
    var dbo = db.get("BankingSystem");
    /* dbo.collection("notification_badges").updateOne(myquery, newvalues, function(err, result) { "_id" : ObjectId(req.query.notivalue)}); */
    var myquery = {
        "_id": ObjectId(req.query.notivalue)
    };
    var newvalues = {
        $set: {
            status: 0,
        }
    }
    var query = {
        $and: [{
            status: 1
        }, {
            "user": ObjectId(req.session.user_id)
        }]
    };
    dbo.collection("notification_badges").updateOne(myquery, newvalues, function(err, result) {

        dbo.collection("notification_badges").count((query), function(error, activenoti) {
            dbo.collection("notification_badges").count({
                status: 1
            }, function(error, adminnoticount) {
                if (req.session.admin_access == 1) {
                    req.session.noticount = adminnoticount;
                } else {
                    req.session.noticount = activenoti;
                }
                res.json(req.session.noticount);

            });
        });
    });
});
router.get('/roles', isAuthenticated, function(req, res) {

    var dbo = db.get("BankingSystem");
    var query = {
        status: 0
    }
    dbo.collection("Role").find(query).toArray(function(err, result) {
        if (err) throw err;
        res.json(result);
    });
});
router.get('/customfields', isAuthenticated, function(req, res) {
    var dbo = db.get("BankingSystem");
    dbo.collection("customfields").find({}).toArray(function(err, result) {
        if (err) throw err;
        for (const [key, value] of Object.entries(result)) {
            result[key].valids = (value.validation).toString();
        };
        res.json(result);
    });
});

router.get('/category', isAuthenticated, function(req, res) {
    var dbo = db.get("BankingSystem");
    dbo.collection("category").find({}).toArray(function(err, result) {
        if (err) throw err;
        res.json(result);
    });
});

router.get('/service', isAuthenticated, function(req, res) {
    var dbo = db.get("BankingSystem");
    var result_final = [];
    dbo.collection("service").find({}).toArray(function(err, result) {

        if (req.session.admin_access == 0) {
            if (req.session.access_rights.service.owndata) {

                for (const [key, value] of Object.entries(result)) {
                    if (value.assigned_staff != "") {
                        for (const [key1, value1] of Object.entries(value.assigned_staff)) {
                            if (req.session.user_id == value) {
                                result_final.push(result[key]);
                            }
                        }
                    }
                }
            } else {
                result_final = result;
            }
        } else {
            for (const [key, value] of Object.entries(result)) {
                result_final.push(result[key]);
            }
        }

        res.json(result_final);

    });
    /* dbo.collection("service").find({}).toArray(function(err, result) {
			if (err) throw err;
			res.json(result);
	}); */
});

router.get('/product', isAuthenticated, function(req, res) {
    var dbo = db.get("BankingSystem");
    dbo.collection("product").find({}).toArray(function(err, result) {
        if (err) throw err;
        res.json(result);
    });
});

router.get('/events', isAuthenticated, function(req, res) {
    var dbo = db.get("BankingSystem");
    var result_final = [];
    dbo.collection("events").find({}).toArray(function(err, result) {
        if (err) throw err;
        if (req.session.admin_access == 0) {
            if (req.session.access_rights.events.owndata) {
                for (const [key, value] of Object.entries(result)) {
                    if (value.eventfor == "all" || value.eventfor == ObjectId(req.session.role)) {
                        result_final.push(result[key]);
                    }
                }
            } else {
                result_final = result;
            }
        } else {
            result_final = result;
        }

        res.json(result_final);
    });
});

router.get('/mapevents', isAuthenticated, function(req, res) {
    var dbo = db.get("BankingSystem");
    var data = []
    dbo.collection("events").find({}).toArray(function(err, result) {
        if (err) throw err;


        if (req.session.admin_access == 0) {
            if (req.session.access_rights.events.owndata != undefined) {
                for (const [key, value] of Object.entries(result)) {
                    if (value.eventfor == "all" || value.eventfor == ObjectId(req.session.role)) {

                        var this_data = {
                            title: value.eventtitle,
                            start: value.startdate,
                            end: value.enddate,
                            color: "darkcyan"
                        }
                        data.push(this_data);

                    }
                }
                dbo.collection("emi_details").aggregate([{
                    $lookup: {
                        from: "loan_details",
                        localField: "loan_id",
                        foreignField: "_id",
                        as: "loan"
                    }
                }, {
                    $unwind: "$loan"
                }, {
                    $lookup: {
                        from: "Users",
                        localField: "user_id",
                        foreignField: "_id",
                        as: "user"
                    }
                }, {
                    $unwind: "$user"
                }, {
                    $match: {
                        $and: [{
                            user_id: ObjectId(req.session.user_id)
                        }]
                    }
                }]).toArray(function(err, result1) {
                    if (err) throw err;
                    for (const [key1, value1] of Object.entries(result1)) {
                        if (value1.loan.approvestatus == 1 || value1.loan.status == 0) {
                            var this_data = {
                                title: "Emi " + value1.user.firstname,
                                start: value1.date,
                                color: "red"
                            }
                            data.push(this_data);
                        }
                    }
                    res.json(data);
                });




            } else {
                dbo.collection("emi_details").aggregate([{
                    $lookup: {
                        from: "loan_details",
                        localField: "loan_id",
                        foreignField: "_id",
                        as: "loan"
                    }
                }, {
                    $unwind: "$loan"
                }, {
                    $lookup: {
                        from: "Users",
                        localField: "user_id",
                        foreignField: "_id",
                        as: "user"
                    }
                }, {
                    $unwind: "$user"
                }]).toArray(function(err, result1) {
                    if (err) throw err;
                    for (const [key1, value1] of Object.entries(result1)) {
                        if (value1.loan.approvestatus == 1 || value1.loan.status == 0) {
                            var this_data = {
                                title: "Emi " + value1.user.firstname,
                                start: value1.date,
                                color: "red"
                            }
                            data.push(this_data);
                        }
                    }

                    result.forEach(element => {
                        var this_data = {
                            title: element.eventtitle,
                            start: element.startdate,
                            end: element.enddate,
                            color: "darkcyan"
                        }
                        data.push(this_data);
                    });

                    res.json(data);


                });
            }
        } else {
            dbo.collection("emi_details").aggregate([{
                $lookup: {
                    from: "loan_details",
                    localField: "loan_id",
                    foreignField: "_id",
                    as: "loan"
                }
            }, {
                $unwind: "$loan"
            }, {
                $lookup: {
                    from: "Users",
                    localField: "user_id",
                    foreignField: "_id",
                    as: "user"
                }
            }, {
                $unwind: "$user"
            }]).toArray(function(err, result1) {

                if (err) throw err;
                for (const [key1, value1] of Object.entries(result1)) {
                    if (value1.loan.approvestatus == 1 || value1.loan.status == 0) {

                        var this_data = {
                            title: "Emi " + value1.user.firstname,
                            start: value1.date,
                            color: "#FFA87D"
                        }
                        data.push(this_data);
                    }

                }

                result.forEach(element => {
                    var this_data = {
                        title: element.eventtitle,
                        start: element.startdate,
                        end: element.enddate,
                        color: "darkcyan"
                    }
                    data.push(this_data);
                });

                res.json(data);


            });

        }
    });
});

router.post('/addcategorytype', isAuthenticated, function(req, res) {
    var dbo = db.get("BankingSystem");
    var data = {
        category_type: req.body.cat_type
    };
    dbo.collection("categorytypes").insertOne(data, function(err, result) {
        if (err) throw err;
    });
});

router.get('/reminder', isAuthenticated, function(req, res) {
    var dbo = db.get("BankingSystem");
    dbo.collection("Reminder").find({}).toArray(function(err, result) {
        if (err) throw err;

        res.json(result);
    });
});
router.get('/loantypelist', isAuthenticated, function(req, res) {
    var dbo = db.get("BankingSystem");
    dbo.collection("loantype").find({}).toArray(function(err, result) {
        if (err) throw err;
        res.json(result);
    });
});

router.get('/rules', isAuthenticated, function(req, res) {
    var dbo = db.get("BankingSystem");
    dbo.collection("Rule").find({}).toArray(function(err, result) {
        if (err) throw err;

        res.json(result);
    });
});

router.get('/notes', isAuthenticated, function(req, res) {
    var dbo = db.get("BankingSystem");
    dbo.collection("notes").find({}).toArray(function(err, result) {
        for (const [key, value] of Object.entries(result)) {
            result[key].obj = (value.note).toString();
            if (value.fileattach == "") {
                result[key].object = "No files attached"
            } else {
                result[key].object = (value.fileattach).toString();
            }
        };
        if (err) throw err;
        res.json(result);
    });
});

router.get('/notificationtemplate', isAuthenticated, function(req, res) {
    var dbo = db.get("BankingSystem");
    dbo.collection("notificationtemplate").find({}).toArray(function(err, result) {
        if (err) throw err;
        res.json(result);
    });
});

router.get('/rules/delete', isAuthenticated, function(req, res) {
    var dbo = db.get("BankingSystem");
    var id = req.query._id;

    var myquery = {
        _id: id
    };
    dbo.collection("Rule").remove({
        _id: new ObjectId(id)
    }, function(err, result) {
        if (err) {
            res.json(false);
        } else {
            res.json(true);
        }

    });
});
router.get('/events/delete', isAuthenticated, function(req, res) {
    var dbo = db.get("BankingSystem");
    var id = req.query._id;
    var myquery = {
        "_id": ObjectId(id)
    };
    dbo.collection("events").find(myquery).toArray(function(err, eventresult) {
        if (eventresult[0].eventfor == "all") {
            var queries = {
                "status": 1
            };
            dbo.collection("Users").find(queries).toArray(function(err, useresult) {
                if (eventresult[0].duration == "one day") {
                    dbo.collection("notificationtemplate").find({
                        templatetitle: "one day event deleted"
                    }).toArray(function(err, notification) {
                        for (const [key, value] of Object.entries(notification)) {
                            for (const [key1, value1] of Object.entries(useresult)) {
                                var message = value.content;
                                var subject = value.subject;
                                var Obj = {
                                    '_USERFIRSTNAME_': value1.firstname,
                                    '_USERLASTNAME_': value1.lastname,
                                    '_EVENTDURATION_': eventresult[0].duration,
                                    '_EVENTSTARTDATE_': eventresult[0].startdate,
                                    '_EVENTNAME_': eventresult[0].eventtitle,
                                    '_EVENTVENUE_': eventresult[0].eventvenue,
                                    '_newline_': '<br>',
                                    '_tab_': '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;',
                                    '_systemname_': req.session.generaldata.com_name,
                                };
                                var trans = message.replace(/_USERFIRSTNAME_|_USERLASTNAME_|_EVENTDURATION_|_EVENTNAME_|_EVENTSTARTDATE_|_EVENTVENUE_|_newline_|_tab_|_systemname_/gi, function(matched) {
                                    return Obj[matched];
                                });
                                var subtrans = subject.replace(/_USERFIRSTNAME_|_USERLASTNAME_|_EVENTDURATION_|_EVENTNAME_|_EVENTSTARTDATE_|_EVENTVENUE_|_newline_|_tab_|_systemname_/gi, function(matched) {
                                    return Obj[matched];
                                });
                                Mail.sendMail(value1.email, subtrans, trans);
                            };
                        };
                    });
                } else {
                    dbo.collection("notificationtemplate").find({
                        templatetitle: "multiple day event deleted"
                    }).toArray(function(err, notification) {
                        for (const [key, value] of Object.entries(notification)) {
                            for (const [key1, value1] of Object.entries(useresult)) {
                                var message = value.content;
                                var subject = value.subject;
                                var Obj = {
                                    '_USERFIRSTNAME_': value1.firstname,
                                    '_USERLASTNAME_': value1.lastname,
                                    '_EVENTDURATION_': eventresult[0].duration,
                                    '_EVENTSTARTDATE_': eventresult[0].startdate,
                                    '_EVENTENDDATE_': eventresult[0].enddate,
                                    '_EVENTNAME_': eventresult[0].eventtitle,
                                    '_EVENTVENUE_': eventresult[0].eventvenue,
                                    '_newline_': '<br>',
                                    '_tab_': '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;',
                                    '_systemname_': req.session.generaldata.com_name,
                                };
                                var trans = message.replace(/_USERFIRSTNAME_|_USERLASTNAME_|_EVENTDURATION_|_EVENTNAME_|_EVENTSTARTDATE_|_EVENTVENUE_|_EVENTENDDATE_|_newline_|_tab_|_systemname_/gi, function(matched) {
                                    return Obj[matched];
                                });
                                var subtrans = subject.replace(/_USERFIRSTNAME_|_USERLASTNAME_|_EVENTDURATION_|_EVENTNAME_|_EVENTSTARTDATE_|_EVENTVENUE_|_EVENTENDDATE_|_newline_|_tab_|_systemname_/gi, function(matched) {
                                    return Obj[matched];
                                });
                                Mail.sendMail(value1.email, subtrans, trans);
                            };
                        };
                    });
                }
            });
        } else {
            var mailquery = {
                $and: [{
                    "role": ObjectId(eventresult[0].eventfor)
                }, {
                    "status": 1
                }]
            };
            dbo.collection("Users").find(mailquery).toArray(function(err, useresult) {
                if (req.body.duration == "one day") {
                    dbo.collection("notificationtemplate").find({
                        templatetitle: "one day event deleted"
                    }).toArray(function(err, notification) {
                        for (const [key, value] of Object.entries(notification)) {
                            for (const [key1, value1] of Object.entries(useresult)) {
                                var message = value.content;
                                var subject = value.subject;
                                var Obj = {
                                    '_USERFIRSTNAME_': value1.firstname,
                                    '_USERLASTNAME_': value1.lastname,
                                    '_EVENTDURATION_': eventresult[0].duration,
                                    '_EVENTSTARTDATE_': eventresult[0].startdate,
                                    '_EVENTENDDATE_': eventresult[0].enddate,
                                    '_EVENTNAME_': eventresult[0].eventtitle,
                                    '_EVENTVENUE_': eventresult[0].eventvenue,
                                    '_newline_': '<br>',
                                    '_tab_': '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;',
                                    '_systemname_': req.session.generaldata.com_name,
                                };
                                var trans = message.replace(/_USERFIRSTNAME_|_USERLASTNAME_|_EVENTDURATION_|_EVENTNAME_|_EVENTSTARTDATE_|_EVENTVENUE_|_EVENTENDDATE_|_newline_|_tab_|_systemname_/gi, function(matched) {
                                    return Obj[matched];
                                });
                                var subtrans = subject.replace(/_USERFIRSTNAME_|_USERLASTNAME_|_EVENTDURATION_|_EVENTNAME_|_EVENTSTARTDATE_|_EVENTVENUE_|_EVENTENDDATE_|_newline_|_tab_|_systemname_/gi, function(matched) {
                                    return Obj[matched];
                                });
                                Mail.sendMail(value1.email, subtrans, trans);
                            };
                        };
                    });
                } else {
                    dbo.collection("notificationtemplate").find({
                        templatetitle: "multiple day event deleted"
                    }).toArray(function(err, notification) {
                        for (const [key, value] of Object.entries(notification)) {
                            for (const [key1, value1] of Object.entries(useresult)) {
                                var message = value.content;
                                var subject = value.subject;
                                var Obj = {
                                    '_USERFIRSTNAME_': value1.firstname,
                                    '_USERLASTNAME_': value1.lastname,
                                    '_EVENTDURATION_': eventresult[0].duration,
                                    '_EVENTSTARTDATE_': eventresult[0].startdate,
                                    '_EVENTENDDATE_': eventresult[0].enddate,
                                    '_EVENTNAME_': eventresult[0].eventtitle,
                                    '_EVENTVENUE_': eventresult[0].eventvenue,
                                    '_newline_': '<br>',
                                    '_tab_': '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;',
                                    '_systemname_': req.session.generaldata.com_name,
                                };
                                var trans = message.replace(/_USERFIRSTNAME_|_USERLASTNAME_|_EVENTDURATION_|_EVENTNAME_|_EVENTSTARTDATE_|_EVENTVENUE_|_EVENTENDDATE_|_newline_|_tab_|_systemname_/gi, function(matched) {
                                    return Obj[matched];
                                });
                                var subtrans = subject.replace(/_USERFIRSTNAME_|_USERLASTNAME_|_EVENTDURATION_|_EVENTNAME_|_EVENTSTARTDATE_|_EVENTVENUE_|_EVENTENDDATE_|_newline_|_tab_|_systemname_/gi, function(matched) {
                                    return Obj[matched];
                                });
                                Mail.sendMail(value1.email, subtrans, trans);
                            };
                        };
                    });
                }
            });
        }
        dbo.collection("events").remove({
            _id: new ObjectId(id)
        }, function(err, result) {
            if (err) {
                res.json(false);
            } else {
                res.json(true);
            }
        });

    });
});
router.get('/customfield/delete', isAuthenticated, function(req, res) {
    var dbo = db.get("BankingSystem");
    var id = req.query._id;

    var myquery = {
        _id: id
    };
    dbo.collection("customfields").remove({
        _id: new ObjectId(id)
    }, function(err, result) {
        if (err) {
            res.json(false);
        } else {
            res.json(true);
        }

    });
});
router.get('/notes/delete', isAuthenticated, function(req, res) {
    var dbo = db.get("BankingSystem");
    var id = req.query._id;

    var myquery = {
        _id: id
    };
    dbo.collection("notes").remove({
        _id: new ObjectId(id)
    }, function(err, result) {
        if (err) {
            res.json(false);
        } else {
            res.json(true);
        }

    });
});
router.get('/category/delete', isAuthenticated, function(req, res) {
    var dbo = db.get("BankingSystem");
    var id = req.query._id;

    var myquery = {
        _id: id
    };
    dbo.collection("category").remove({
        _id: new ObjectId(id)
    }, function(err, result) {
        if (err) {
            res.json(false);
        } else {
            res.json(true);
        }
    });
});

router.post('/clearlog', isAuthenticated, function(req, res) {
    var dbo = db.get("BankingSystem");
    var date = Date(Date.now());
    var formatdate = moment(date).format("YYYY-MM-DD");
    var myobjs = {
        module: "Log",
        date: formatdate,
        action: "cleared",
        user: ObjectId(req.session.user_id),
        item: "activitylog",
    };
    dbo.collection("activitylog").remove({});


    dbo.collection("activitylog").insertOne(myobjs, function(err, activity) {
        if (err) {
            res.json(false);
        } else {
            res.json(true);
        }
    });
});

router.get('/service/delete', isAuthenticated, function(req, res) {
    var dbo = db.get("BankingSystem");
    var id = req.query._id;

    var myquery = {
        _id: id
    };
    dbo.collection("service").remove({
        _id: new ObjectId(id)
    }, function(err, result) {
        if (err) {
            res.json(false);
        } else {
            res.json(true);
        }
    });
});

router.get('/product/delete', isAuthenticated, function(req, res) {
    var dbo = db.get("BankingSystem");
    var id = req.query._id;
    var myquery = {
        _id: id
    };
    dbo.collection("product").remove({
        _id: new ObjectId(id)
    }, function(err, result) {
        if (err) {
            res.json(false);
        } else {
            res.json(true);
        }
    });
});
router.get('/roles/delete', isAuthenticated, function(req, res) {
    var dbo = db.get("BankingSystem");
    var id = req.query._id;

    var myquery = {
        _id: id
    };
    dbo.collection("Role").remove({
        _id: new ObjectId(id)
    }, function(err, result) {
        if (err) {
            res.json(false);
        } else {
            res.json(true);
        }
    });
});
router.get('/reminder/delete', isAuthenticated, function(req, res) {
    var dbo = db.get("BankingSystem");
    var id = req.query._id;

    var myquery = {
        _id: id
    };
    dbo.collection("Reminder").remove({
        _id: new ObjectId(id)
    }, function(err, result) {
        if (err) {
            res.json(false);
        } else {
            res.json(true);
        }
    });
});

router.get('/loanlist', isAuthenticated, function(req, res) {
    var dbo = db.get("BankingSystem");
    var id = req.query._id;
    var result_final = [];
    var query = {
        $and: [{
            status: 1
        }, {
            approvestatus: 1
        }]
    };
    /*dbo.collection("loan_details").find(query).toArray(function(err, result) {
		if (err) throw err;				
		res.json(result);
	});*/

    dbo.collection("loan_details").aggregate([{
        $lookup: {
            from: "loantype",
            localField: "loantype",
            foreignField: "_id",
            as: "loan"
        }
    }, {
        $unwind: "$loan"
    }, {
        $lookup: {
            from: "Users",
            localField: "user",
            foreignField: "_id",
            as: "user"
        }
    }, {
        $unwind: "$user"
    }, {
        $match: {
            $and: [{
                status: 1
            }, {
                approvestatus: 1
            }]
        }
    }]).toArray(function(err, result) {
        if (err) throw err;
        if (req.session.admin_access == 0) {
            if (req.session.access_rights.loanlist.owndata) {

                for (const [key, value] of Object.entries(result)) {
                    if (req.session.user_id == value.user._id) {
                        result_final.push(result[key]);
                    }
                }
            } else {
                result_final = result;
            }
        } else {
            for (const [key, value] of Object.entries(result)) {
                result_final.push(result[key]);
            }
        }

        res.json(result_final);
    });
});

router.get('/disapproveloan', isAuthenticated, function(req, res) {
    var dbo = db.get("BankingSystem");
    var query = {
        $and: [{
            status: 1
        }, {
            approvestatus: 0
        }]
    };
    var result_final = [];
    /*dbo.collection("loan_details").find(query).toArray(function(err, result) {
		if (err) throw err;
		res.json(result);  
	});*/

    dbo.collection("loan_details").aggregate([{
        $lookup: {
            from: "loantype",
            localField: "loantype",
            foreignField: "_id",
            as: "loan"
        }
    }, {
        $unwind: "$loan"
    }, {
        $lookup: {
            from: "Users",
            localField: "user",
            foreignField: "_id",
            as: "user"
        }
    }, {
        $unwind: "$user"
    }, {
        $match: {
            $and: [{
                status: 1
            }, {
                approvestatus: 0
            }]
        }
    }]).toArray(function(err, result) {
        if (err) throw err;
        if (req.session.admin_access == 0) {
            if (req.session.access_rights.disapproveloanlist.owndata) {

                for (const [key, value] of Object.entries(result)) {
                    if (req.session.user_id == value.user._id) {
                        result_final.push(result[key]);
                    }
                }
            } else {
                result_final = result;
            }
        } else {
            for (const [key, value] of Object.entries(result)) {
                result_final.push(result[key]);
            }
        }

        res.json(result_final);
    });
});

router.get('/loanlist/delete', isAuthenticated, function(req, res) {
    var dbo = db.get("BankingSystem");
    var id = req.query._id;

    var myquery = {
        _id: id
    };
    dbo.collection("loan_details").remove({
        _id: new ObjectId(id)
    }, function(err, result) {
        if (err) {
            res.json(false);
        } else {
            res.json(true);
        }

    });
});
router.get('/loantypedesc', isAuthenticated, function(req, res) {
    var dbo = db.get("BankingSystem");
    var id = req.query.loanid;
    var myquery = {
        "_id": ObjectId(id)
    };
    dbo.collection("loantype").find(myquery).toArray(function(err, result) {
        if (err) throw err;
        res.json({
            loantype: result
        });
    });
});
router.get('/username', isAuthenticated, function(req, res) {
    var dbo = db.get("BankingSystem");
    var user = req.query.username;
    var myquery = {
        "username": user
    };
    dbo.collection("Users").find(myquery).toArray(function(err, result) {
        if (err) throw err;
        res.json(result);
    });
});
router.get('/duplicateemail', isAuthenticated, function(req, res) {
    var dbo = db.get("BankingSystem");
    var email = req.query.email;
    var myquery = {
        "email": email
    };
    dbo.collection("Users").find(myquery).toArray(function(err, result) {
        if (err) throw err;
        res.json(result);
    });
});

router.get('/duplicatephoneno', isAuthenticated, function(req, res) {
    var dbo = db.get("BankingSystem");
    var mobile = req.query.mobile;
    var myquery = {
        "mobile": mobile
    };
    dbo.collection("Users").find(myquery).toArray(function(err, result) {
        if (err) throw err;
        res.json(result);
    });
});
//role updea using juqery....
router.post('/addrole', isAuthenticated, function(req, res) {
    var id = req.body.id;
    if (id) {
        var myquery = {
            "_id": ObjectId(id)
        };
        var dbo = db.get();

        var name1 = req.body.name;

        if (name1 == 'allow_access') {

            if ('checked' == req.body.allow_access) {
                var value = 1;
            } else {
                var value = 0;
            }
            var newvalues = {
                $set: {
                    allow_access: value
                }
            };
        } else {

            if ('checked' == req.body.admin_access) {
                var value = 1;
            } else {
                var value = 0;
            }

            var newvalues = {
                $set: {
                    admin_access: value
                }
            };
        }

        dbo.collection("Role").updateOne(myquery, newvalues, function(err, res) {
            if (err) throw err;
        });
    } else {

        var dbo = db.get();

        var myobj = {
            role_nm: req.body.role_nm,
            role_slug: req.body.role_slug,
            role_desc: req.body.role_desc,
            admin_access: req.body.admin_access,
            allow_access: req.body.allow_access

        };
        dbo.collection("Role").insertOne(myobj, function(err, res) {
            if (err) throw err;
        });
        res.redirect('/role/roles');
    }
    //res.redirect('/roles');
})
router.post('/approveloan', isAuthenticated, function(req, res) {
    var id = req.body.id;
    if (id) {
        var myquery = {
            "_id": ObjectId(id)
        };
        var dbo = db.get();
        var name1 = req.body.name;
        if (name1 == 'approvestatus') {
            if ('checked' == req.body.approvestatus) {
                var value = 1;
                dbo.collection("loan_details").find(myquery).toArray(function(err, result) {
                    var userid = result[0].user;
                    var iduser = ObjectId(userid);
                    var loantype = result[0].loantype;
                    var typeid = ObjectId(loantype);
                    var date = Date(Date.now());
                    var formatdate = moment(date).format("YYYY-MM-DD");
                    dbo.collection("Users").find(iduser).toArray(function(err, resultuser) {
                        dbo.collection("notificationtemplate").find({
                            templatetitle: "Loan Approved"
                        }).toArray(function(err, notification) {
                            dbo.collection("loantype").find(typeid).toArray(function(err, typeloan) {
                                for (const [key, value] of Object.entries(notification)) {
                                    var message = value.content;
                                    var subject = value.subject;
                                    var Obj = {
                                        '_USERFIRSTNAME_': resultuser[0].firstname,
                                        '_USERLASTNAME_': resultuser[0].lastname,
                                        '_DATETIME_': formatdate,
                                        '_LOANTYPE_': typeloan[0].type,
                                        '_newline_': '<br>',
                                        '_tab_': '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;',
                                        '_systemname_': req.session.generaldata.com_name,
                                    };
                                    var trans = message.replace(/_USERFIRSTNAME_|_USERLASTNAME_|_DATETIME_|_newline_|_LOANTYPE_|_tab_|_systemname_/gi, function(matched) {
                                        return Obj[matched];
                                    });

                                    Mail.sendMail(resultuser[0].email, subject, trans);
                                };

                            });
                        });
                    });
                });
            } else {
                var value = 0;
            }
            var newvalues = {
                $set: {
                    approvestatus: value
                }
            };
        }
        dbo.collection("loan_details").updateOne(myquery, newvalues, function(err, result) {
            if (err) {
                req.flash('error', ('Error occured.'));
                res.redirect('/loan/loanlist');
            } else {
                req.flash('success', ('Loan Updated Sucessfully.'));
                res.redirect('/loan/loanlist');


            }
        });
    }
});
router.post('/state', isAuthenticated, function(req, res) {
    var id = req.body.countryId;

    fs.readFile('public/data/states.json', function(err, data) {
        var jsonData = data;
        var jsonParsed = JSON.parse(jsonData);
        var states = jsonParsed.states;
        var data = [];
        for (const [key, value] of Object.entries(states)) {
            if (id == value.country_id) {
                var data_push = {
                    "name": value.name,
                    "id": value.id,
                    "country_id": value.country_id,
                }
                data.push(data_push);
            }
        };
        res.json({
            state: data
        });
    });
});
router.post('/city', isAuthenticated, function(req, res) {
    var id = req.body.stateId;
    fs.readFile('public/data/cities.json', function(err, data) {
        var jsonData = data;

        var jsonParsed = JSON.parse(jsonData);
        var cities = jsonParsed.cities;
        var data = [];

        for (const [key, value] of Object.entries(cities)) {
            if (id == value.state_id) {
                var data_push = {
                    "name": value.name,
                    "id": value.id,
                    "state_id": value.state_id,
                }
                data.push(data_push);
            }
        };
        res.json({
            city: data
        });
    });
});

function isAuthenticated(req, res, next) {

    if (req.session.username != undefined) {
        return next();
    } else {
        res.redirect('/');
    }
};
router.post('/emi_calculator', isAuthenticated, function(req, res) {
	var data=[];
	var loan_amount = req.body.loan_amount;
	var rate = req.body.rate;
	var year = req.body.year;
	var month= year * 12;
	var date = Date(Date.now());
    var formatdate = moment(date).format("YYYY-MM-DD");
	
	var mortgage = AmortizeJS.calculate({
                        method: 'mortgage',
                        apr: rate,
                        balance: loan_amount,
                        loanTerm: month,
                        startDate: formatdate,
                    });
	var monthly_emi= mortgage.periodicPayment;
	var total_payment= mortgage.totalPayment;
	var totalInterest= mortgage.totalInterest;
	var result={"loan_amount":loan_amount,"monthly_emi":monthly_emi,"total_payment":total_payment,"totalInterest":totalInterest}; 
	/*data.push(result); */
	res.json({
            data: result
        });
});

module.exports = router;