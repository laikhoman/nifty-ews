'use strict';
var express = require('express');
var router = express.Router();
var http = require('http');
var db = require('./mongo_db');
var ObjectId = require('mongodb').ObjectId;
var bodyParser = require('body-parser');
var LoanJS = require('loanjs');
var AmortizeJS = require('amortizejs').Calculator;
var Mail = require('./email');
var lang = require('./languageconfig');
var flash = require('express-flash');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var multer = require('multer');
var moment = require('moment');
var jsonParser = bodyParser.json();
var urlencodedParser = bodyParser.urlencoded({
    extended: false
});
router.use(bodyParser());

var storage = multer.diskStorage({
    destination: function(req, file, callback) {
        callback(null, 'public/images/upload/documents');
    },
    filename: function(req, file, callback) {
        callback(null, Date.now() + '-' + file.originalname);
    }
});
var upload = multer({
    storage: storage
});
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
            var result_data = [];
            dbo.collection("loan_details").find(myquery).toArray(function(err, result) {
                result_data = result;
                result_data[0].id_d = ObjectId(result_data[0].user).toString();
                var query = {
                    status: 1
                };
                dbo.collection("Users").find(query).toArray(function(err, User_name) {
                    for (const [key, value] of Object.entries(User_name)) {
                        User_name[key].id_d = ObjectId(value._id).toString();
                    };
                    dbo.collection("loantype").find().toArray(function(err, loan_type) {
                        for (const [key, value] of Object.entries(loan_type)) {
                            loan_type[key].id_d = ObjectId(value._id).toString();
                        };
                        dbo.collection("Generalsetting").find().toArray(function(err, geninfo) {
                            for (const [key, value] of Object.entries(geninfo)) {
                                geninfo[key].id_d = ObjectId(value._id).toString();
                            };
                            var mydata = {
                                $and: [{
                                    "module_name": "loan"
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

                                    var notequery = {
                                        "module_id": ObjectId(id)
                                    };

                                    dbo.collection("notes").find(notequery).toArray(function(err, notes) {
                                        res.render('loan/addloan', {
                                            title: "Edit Loan",
                                            data: result_data,
                                            id: id,
                                            session: req.session,
                                            user: User_name,
                                            loan: loan_type,
                                            geninfo: geninfo,
                                            setlang: languages,
                                            newfield: customfield,
                                            customfield_value: customfield_value,
                                            note: notes
                                        });
                                    });
                                });
                            });
                        });
                    });
                });
            });
        } else {
            var query = {
                status: 1
            };
            dbo.collection("Users").find(query).toArray(function(err, User_name) {
                dbo.collection("loantype").find().toArray(function(err, loan_type) {
                    dbo.collection("Generalsetting").find().toArray(function(err, geninfo) {
                        var mydata = {
                            $and: [{
                                "module_name": "loan"
                            }, {
                                "field_visibility": 1
                            }]
                        };
                        dbo.collection("customfields").find(mydata).toArray(function(err, customfield) {
                            for (const [key, value] of Object.entries(geninfo)) {
                                User_name[key].id_d = ObjectId(value._id).toString();
                            };
                            var news = [{
                                'userid': '-1'
                            }];
                            res.render('loan/addloan', {
                                title: "Add Loan",
                                data: news,
                                session: req.session,
                                user: User_name,
                                loan: loan_type,
                                geninfo: geninfo,
                                newfield: customfield,
                                note: news
                            });
                        });
                    });
                });
            });
        }
    })

.post(upload.any(), isAuthenticated, function(req, res) {
    //console.log("1st time");
    var id = req.body.id;
    var dbo = db.get();
    var data = [];
    var attachfiles = [];
    var i = 0;
    var j = 0;
    //notes and attach file start
    var note = req.body.note;
    var addnote = [];
    if (Array.isArray(note)) {
        var addnote = req.body.note;
    } else {
        addnote.push(note);
    }
    var doc = req.body.doc_old;
    if (doc != undefined) {
        if (Array.isArray(doc)) {
            var data = req.body.doc_old;
        } else {
            data.push(doc);
        }
    }
    for (const [keys1, values1] of Object.entries(req.files)) {
        if (values1.fieldname == "document") {
            var docs = values1.filename;
            data.push(docs);
            i++;
        }
    }

    var atimg = req.body.attachfile_old;
    if (atimg != undefined) {
        if (Array.isArray(atimg)) {
            var attachfiles = req.body.attachfile_old
        } else {
            attachfiles.push(atimg);
        }
    }
    for (const [keys, values] of Object.entries(req.files)) {
        if (values.fieldname == "attachfile") {
            var attach = values.filename;
            attachfiles.push(attach);
            j++;
        }
    }
    if (id) {
        var myquery = {
            "_id": ObjectId(id)
        };
        var userid = req.body.user;
        var loanid = req.body.loantype;
        var iduser = ObjectId(userid);
        var idloan = ObjectId(loanid);
        var startdate = moment(req.body.startdate).format("YYYY-MM-DD");
        var enddate = moment(req.body.enddate).format("YYYY-MM-DD");
        var newvalues = {
            $set: {
                loancount: req.body.loancount,
                loantype: idloan,
                user: iduser,
                description: req.body.description,
                document: data,
                loanamount: req.body.loanamount,
                interestrate: req.body.interestrate,
                years: req.body.years,
                startdate: startdate,
                enddate: enddate,
                totalemimonth: req.body.totalemimonth,
                processingfee: req.body.processingfee,
                incomeperyear: req.body.incomeperyear,
                incomepermonth: req.body.incomepermonth,
                oincome: req.body.oincome,
                workdetail: req.body.workdetail,
                colleague: req.body.colleague,
                address: req.body.address,
                mobile: req.body.mobile,
                addtype: req.body.addtype,
                othertext: req.body.othertext,
            }
        };
        dbo.collection("loan_details").updateOne(myquery, newvalues, function(err, result) {
            var date = Date(Date.now());
            var formatdate = moment(date).format("YYYY-MM-DD");
            var myobj = {
                date: formatdate,
                module: "Loan",
                action: "updated loan no.",
                user: ObjectId(req.session.user_id),
                item: req.body.loancount,
                status: 0,
            };
            dbo.collection("activitylog").insertOne(myobj, function(err, activity) {});
            if (err) throw err;
            var notequery = {
                "module": "loan",
                "module_id": ObjectId(id)
            };
            dbo.collection("notes").find(notequery).toArray(function(err, notedata) {
                if (notedata != "") {
                    if (req.files) {
                        for (const [keys, values] of Object.entries(notedata)) {
                            var nquery = {
                                "_id": ObjectId(values._id)
                            };

                            if (req.body.note || value.fieldname == "attachfile") {
                                var this_data = {
                                    $set: {
                                        note: addnote,
                                        fileattach: attachfiles,
                                        module: "loan",
                                        module_id: ObjectId(id),
                                    }
                                }
                                dbo.collection("notes").updateOne(nquery, this_data, function(err, notefile) {});

                            }
                        }
                    }
                }

                if (req.body.customfields) {
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
                                                    if (value.fieldname == "document" || value.fieldname == "attachfile") {} else {
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
                                        module: "loan",
                                        user_id: ObjectId(req.session.user_id),
                                        reference_id: ObjectId(id),
                                        updated_at: formatdate,
                                    }
                                    dbo.collection("custom_field_meta").insertOne(this_data, function(err, result2) {});
                                }
                            }
                            var m = 0;
                            for (const [key, value] of Object.entries(req.files)) {
                                if (value.fieldname == "document" || value.fieldname == "attachfile") {} else {
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
                                            module: "loan",
                                            user_id: ObjectId(req.session.user_id),
                                            reference_id: ObjectId(id),
                                            updated_at: formatdate,
                                        }
                                        dbo.collection("custom_field_meta").insertOne(this_data, function(err, result2) {});
                                    }
                                }
                            }
                        } else {
                            var date = Date(Date.now());
                            var formatdate = moment(date).format("YYYY-MM-DD");
                            if (req.body.customfields) {
                                for (const [key, value] of Object.entries(req.body.customfields)) {
                                    var this_data = {
                                        custom_field_id: ObjectId(key),
                                        customfield_value: value,
                                        module: "loan",
                                        user_id: ObjectId(req.session.user_id),
                                        reference_id: ObjectId(id),
                                        updated_at: formatdate,
                                    }
                                    dbo.collection("custom_field_meta").insertOne(this_data, function(err, result2) {});
                                }
                            }
                            if (req.files) {
                                for (const [key, value] of Object.entries(req.files)) {
                                    if (value.fieldname == "document" || value.fieldname == "attachfile") {} else {
                                        var this_data = {
                                            custom_field_id: ObjectId(value.fieldname),
                                            customfield_value: value.filename,
                                            module: "loan",
                                            user_id: ObjectId(req.session.user_id),
                                            reference_id: ObjectId(id),
                                            updated_at: formatdate,
                                        }
                                    }
                                    dbo.collection("custom_field_meta").insertOne(this_data, function(err, result5) {});
                                }
                            }
                        }
                    });
                }
                var nquery = {
                    "module_id": ObjectId(id)
                };
                dbo.collection("notes").find(nquery).toArray(function(err, notedata) {
                    if (req.body.note || req.files.attachfile) {
                        for (const [keys, values] of Object.entries(notedata)) {
                            var query3 = {
                                "_id": ObjectId(values._id)
                            };
                            var newvalues = {
                                $set: {
                                    note: addnote,
                                    fileattach: attachfiles,
                                }
                            }
                            dbo.collection("notes").updateOne(query3, newvalues, function(err, result) {});
                        }
                    }
                });
                dbo.collection("loantype").find({
                    "_id": idloan
                }).toArray(function(err, typeloans) {
                    var myobj = {
                        action: "Loan Updated",
                        desc: "is updated",
                        loan: ObjectId(id),
                        user: iduser,
                        userby: ObjectId(req.session.user_id),
                        Name: typeloans[0].type,
                        date: formatdate,
                        status: 1
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
                                            res.redirect('/loan/loanlist');
                                        } else {

                                            req.flash('success', lang.__('Loan Updated Sucessfully.'));
                                            res.redirect('/loan/loanlist');
                                        }
                                    });
                                });
                            });
                        });
                    });
                });

            });
        });
    } else {
        var userid = req.body.user;
        var iduser = ObjectId(userid);
        var type = req.body.loantype;
        var loantype = ObjectId(type);
        var startdate = moment(req.body.startdate).format("YYYY-MM-DD");
        var enddate = moment(req.body.enddate).format("YYYY-MM-DD");
        var myobj = {
            loancount: req.body.loancount,
            loantype: loantype,
            user: iduser,
            description: req.body.description,
            document: data,
            loanamount: req.body.loanamount,
            interestrate: req.body.interestrate,
            years: req.body.years,
            startdate: startdate,
            enddate: enddate,
            totalemimonth: req.body.totalemimonth,
            processingfee: req.body.processingfee,
            incomeperyear: req.body.incomeperyear,
            incomepermonth: req.body.incomepermonth,
            oincome: req.body.oincome,
            workdetail: req.body.workdetail,
            colleague: req.body.colleague,
            address: req.body.address,
            mobile: req.body.mobile,
            addtype: req.body.addtype,
            othertext: req.body.othertext,
            status: 1,
            approvestatus: parseInt("0"),
        };
        dbo.collection("loan_details").insertOne(myobj, function(err, resultes) {
            var date = Date(Date.now());
            var formatdate = moment(date).format("YYYY-MM-DD");
            var myobj = {
                date: formatdate,
                module: "Loan",
                action: "updated loan no.",
                user: ObjectId(req.session.user_id),
                item: req.body.loancount,
                status: 0,
            };
            dbo.collection("activitylog").insertOne(myobj, function(err, activity) {});
            dbo.collection("Users").find(iduser).toArray(function(err, result) {
                dbo.collection("notificationtemplate").find({
                    templatetitle: "Loan Add"
                }).toArray(function(err, notification) {
                    dbo.collection("loantype").find(loantype).toArray(function(err, typeloan) {
                        for (const [key, value] of Object.entries(notification)) {
                            var message = value.content;
                            var subject = value.subject;
                            var startdate = moment(req.body.startdate).format("YYYY-MM-DD");
                            var enddate = moment(req.body.enddate).format("YYYY-MM-DD");
                            var Obj = {
                                '_USERFIRSTNAME_': result[0].firstname,
                                '_USERLASTNAME_': result[0].lastname,
                                '_LOANTYPE_': typeloan[0].type,
                                '_datetime_': formatdate,
                                '_LOANSTARTDATE_': startdate,
                                '_LOANENDDATE_': enddate,
                                '_newline_': '<br>',
                                '_tab_': '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;',
                                '_systemname_': req.session.generaldata.com_name,
                            };
                            var trans = message.replace(/_USERFIRSTNAME_|_USERLASTNAME_|_LOANTYPE_|_newline_|_tab_|_systemname_|_datetime_|_LOANSTARTDATE_|_LOANENDDATE_/gi, function(matched) {
                                return Obj[matched];
                            });
                            var subtrans = subject.replace(/_USERFIRSTNAME_|_USERLASTNAME_|_LOANTYPE_|_newline_|_tab_|_systemname_/gi, function(matched) {
                                return Obj[matched];
                            });
                            Mail.sendMail(result[0].email, subtrans, trans);
                        };
                    });
                    var mortgage = AmortizeJS.calculate({
                        method: 'mortgage',
                        apr: req.body.interestrate,
                        balance: req.body.loanamount,
                        loanTerm: req.body.totalemimonth,
                        startDate: req.body.startdate,
                    });
                    var data = [];
                    var index_id = 1;
                    var monthly_payment = mortgage.periodicPayment;

                    var query3 = {
                        "_id": ObjectId(resultes.insertedId)
                    };
                    var newvalues = {
                        $set: {
                            monthly_payment: monthly_payment
                        }
                    }
                    dbo.collection("loan_details").updateOne(query3, newvalues, function(err, result) {});

                    mortgage.schedule.forEach(element => {
                        var date = moment(element.date).format("YYYY-MM-DD");
                        var this_news = {
                            loan_id: resultes.insertedId,
                            user_id: iduser,
                            month: index_id,
                            interest: element.interest,
                            principal: element.principal,
                            remainingBalance: element.remainingBalance,
                            date: date,
                            status: 0,
                            mail_noti: 0,
                        }
                        index_id++;
                        data.push(this_news);
                    });
                    dbo.collection("emi_details").insertMany(data, function(err, result) {});
                    if (req.body.customfields) {
                        for (const [key, value] of Object.entries(req.body.customfields)) {
                            var this_data = {
                                custom_field_id: ObjectId(key),
                                customfield_value: value,
                                module: "loan",
                                user_id: ObjectId(req.session.user_id),
                                reference_id: resultes.insertedId,
                                updated_at: formatdate,
                            }
                            dbo.collection("custom_field_meta").insertOne(this_data, function(err, result2) {});
                        }
                    }
                    if (req.files) {
                        for (const [key, value] of Object.entries(req.files)) {
                            if (value.fieldname == "document" || value.fieldname == "attachfile") {} else {
                                var this_data = {
                                    custom_field_id: ObjectId(value.fieldname),
                                    customfield_value: value.filename,
                                    module: "loan",
                                    user_id: ObjectId(req.session.user_id),
                                    reference_id: resultes.insertedId,
                                    updated_at: formatdate,
                                }
                                dbo.collection("custom_field_meta").insertOne(this_data, function(err, result5) {});
                            }
                        }
                    }
                    if (req.files) {
                    var this_data = {
                            note: addnote,
                            fileattach: attachfiles,
                            module: "loan",
                            module_id: resultes.insertedId,
                        }
                        dbo.collection("notes").insertOne(this_data, function(err, notefile) {});
                }
                    dbo.collection("loantype").find({
                        "_id": loantype
                    }).toArray(function(err, typeloans) {
                        var myobj = {
                            action: "New Loan Added",
                            desc: "is added ",
                            loan: resultes.insertedId,
                            user: iduser,
                            userby: ObjectId(req.session.user_id),
                            Name: typeloans[0].type,
                            date: formatdate,
                            status: 1
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
                                                res.redirect('/loan/disapproveloan');
                                            } else {
                                                req.flash('success', lang.__('Loan Inserted Sucessfully.'));
                                                res.redirect('/loan/disapproveloan');
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
                        if (result[0].access_type.loanlist != undefined) {
                            if (result[0].access_type.loanlist.add != undefined) {
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
                        if (result[0].access_type.loanlist != undefined) {
                            if (result[0].access_type.loanlist.update != undefined) {
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