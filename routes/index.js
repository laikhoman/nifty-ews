'use strict';
var express = require('express');
var router = express.Router();
var db = require('./mongo_db');
var ObjectId = require('mongodb').ObjectId;
var flash = require('express-flash');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var lang = require('./languageconfig');
var person = require('../helpers/function');
var Mail = require('./email');
var moment = require('moment');
router.use(cookieParser());
router.use(session({
    secret: '222222'
}));
router.use(flash());
router.use(lang.init);


/* GET home page. */
router.get('/', isAuthenticated, function(req, res, next) {

    var dbo = db.get("BankingSystem");
    dbo.collection("Generalsetting").find().toArray(function(err, result) {
        lang.setLocale(result[0].language);
        res.cookie('locale', result[0].language, {
            maxAge: 90000000,
            httpOnly: true
        });
        var event_result = [];
        var languages = lang.getLocale();

        if (req.session.admin_access == 0) {

            if (req.session.access_rights.loanlist.owndata === 'loan_list_owndata' && req.session.access_rights.user.owndata === 'user_owndata') {

                var query = {
                    status: 1,
                    _id: ObjectId(req.session.user_id)
                };
                var myquery = {
                    status: 0,
                    _id: ObjectId(req.session.user_id)
                };
                var query_loan_details = {
                    status: 1,
                    user: ObjectId(req.session.user_id)
                };
                var mquery = {
                    user: ObjectId(req.session.user_id)
                };
                var dquery = {
                    approvestatus: 1,
                    user: ObjectId(req.session.user_id)
                };
                var lquery = {
                    approvestatus: 0,
                    user: ObjectId(req.session.user_id)
                };
                //var event_q = {eventfor : ["all", ObjectId(req.session.role)]};

                dbo.collection("Users").count((query), function(error, activeuser) {
                    dbo.collection("Users").count((myquery), function(error, deactiveuser) {
                        //var percent = activeuser * 100 +"%";
                        if (error) return callback(error);
                        dbo.collection("loan_details").count((mquery), function(error, totaloan) {
                            dbo.collection("loan_details").count((dquery), function(error, num_of_loan) {
                                dbo.collection("loan_details").count((lquery), function(error, num_of_disloan) {
                                    if (error) return callback(error);
                                    dbo.collection("Users").find(query).limit(4).toArray(function(err, userresult) {
                                        dbo.collection("loantype").find().limit(5).toArray(function(err, loanresult) {
                                            dbo.collection("loan_details").find(query_loan_details).limit(3).toArray(function(err, loan) {
                                                dbo.collection("events").find().toArray(function(err, events) {

                                                    dbo.collection("Reminder").find().toArray(function(err, Reminder) {

                                                        res.render('index', {
                                                            title: "Dashboard",
                                                            session: req.session,
                                                            activecount: activeuser,
                                                            deactiveuser: deactiveuser,
                                                            loanno: num_of_loan,
                                                            setlang: languages,
                                                            userdata: userresult,
                                                            loandata: loanresult,
                                                            loan: loan,
                                                            events: events,
                                                            Reminder: Reminder,
                                                            num_of_disloan: num_of_disloan,
                                                            loans: totaloan
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

            } else if(req.session.access_rights.loanlist.owndata == undefined && req.session.access_rights.user.owndata === 'user_owndata') {

                var query = {
                    status: 1,
                    _id: ObjectId(req.session.user_id)
                };
                var myquery = {
                    status: 0,
                    _id: ObjectId(req.session.user_id)
                };
                var query_loan_details = {
                    status: 1
                };
                var dquery = {
                    approvestatus: 1
                };
                var lquery = {
                    approvestatus: 0
                };

                dbo.collection("Users").count((query), function(error, activeuser) {
                    dbo.collection("Users").count((myquery), function(error, deactiveuser) {
                        //var percent = activeuser * 100 +"%";
                        if (error) return callback(error);
                        dbo.collection("loan_details").count(function(error, totaloan) {
                            dbo.collection("loan_details").count((dquery), function(error, num_of_loan) {
                                dbo.collection("loan_details").count((lquery), function(error, num_of_disloan) {
                                    if (error) return callback(error);
                                    dbo.collection("Users").find(query).limit(4).toArray(function(err, userresult) {
                                        dbo.collection("loantype").find().limit(5).toArray(function(err, loanresult) {
                                            dbo.collection("loan_details").find(query_loan_details).limit(3).toArray(function(err, loan) {
                                                dbo.collection("events").find().toArray(function(err, events) {

                                                    dbo.collection("Reminder").find().toArray(function(err, Reminder) {

                                                        res.render('index', {
                                                            title: "Dashboard",
                                                            session: req.session,
                                                            activecount: activeuser,
                                                            deactiveuser: deactiveuser,
                                                            loanno: num_of_loan,
                                                            setlang: languages,
                                                            userdata: userresult,
                                                            loandata: loanresult,
                                                            loan: loan,
                                                            events: events,
                                                            Reminder: Reminder,
                                                            num_of_disloan: num_of_disloan,
                                                            loans: totaloan
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

            } else if(req.session.access_rights.loanlist.owndata === 'loan_list_owndata' && req.session.access_rights.user.owndata == undefined) {

                var query = {
                    status: 1
                };
                var myquery = {
                    status: 0
                };
                var query_loan_details = {
                    status: 1,
                    user: ObjectId(req.session.user_id)
                };
                var dquery = {
                    approvestatus: 1,
                    user: ObjectId(req.session.user_id)
                };
                var lquery = {
                    approvestatus: 0,
                    user: ObjectId(req.session.user_id)
                };

                dbo.collection("Users").count((query), function(error, activeuser) {
                    dbo.collection("Users").count((myquery), function(error, deactiveuser) {
                        //var percent = activeuser * 100 +"%";
                        if (error) return callback(error);
                        dbo.collection("loan_details").count(function(error, totaloan) {
                            dbo.collection("loan_details").count((dquery), function(error, num_of_loan) {
                                dbo.collection("loan_details").count((lquery), function(error, num_of_disloan) {
                                    if (error) return callback(error);
                                    dbo.collection("Users").find(query).limit(4).toArray(function(err, userresult) {
                                        dbo.collection("loantype").find().limit(5).toArray(function(err, loanresult) {
                                            dbo.collection("loan_details").find(query_loan_details).limit(3).toArray(function(err, loan) {
                                                dbo.collection("events").find().toArray(function(err, events) {
                                                    dbo.collection("Reminder").find().toArray(function(err, Reminder) {

                                                        res.render('index', {
                                                            title: "Dashboard",
                                                            session: req.session,
                                                            activecount: activeuser,
                                                            deactiveuser: deactiveuser,
                                                            loanno: num_of_loan,
                                                            setlang: languages,
                                                            userdata: userresult,
                                                            loandata: loanresult,
                                                            loan: loan,
                                                            events: events,
                                                            Reminder: Reminder,
                                                            num_of_disloan: num_of_disloan,
                                                            loans: totaloan
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

            } else {

                var query = {
                    status: 1
                };
                var myquery = {
                    status: 0
                };
                var dquery = {
                    approvestatus: 1
                };
                var lquery = {
                    approvestatus: 0
                };

                dbo.collection("Users").count((query), function(error, activeuser) {
                    dbo.collection("Users").count((myquery), function(error, deactiveuser) {
                        //var percent = activeuser * 100 +"%";
                        if (error) return callback(error);
                        dbo.collection("loan_details").count(function(error, totaloan) {
                            dbo.collection("loan_details").count((dquery), function(error, num_of_loan) {
                                dbo.collection("loan_details").count((lquery), function(error, num_of_disloan) {
                                    if (error) return callback(error);
                                    dbo.collection("Users").find(query).limit(4).toArray(function(err, userresult) {
                                        dbo.collection("loantype").find().limit(5).toArray(function(err, loanresult) {
                                            dbo.collection("loan_details").find(query).limit(3).toArray(function(err, loan) {
                                                dbo.collection("events").find().toArray(function(err, events) {
                                                    dbo.collection("Reminder").find().toArray(function(err, Reminder) {

                                                        res.render('index', {
                                                            title: "Dashboard",
                                                            session: req.session,
                                                            activecount: activeuser,
                                                            deactiveuser: deactiveuser,
                                                            loanno: num_of_loan,
                                                            setlang: languages,
                                                            userdata: userresult,
                                                            loandata: loanresult,
                                                            loan: loan,
                                                            events: events,
                                                            Reminder: Reminder,
                                                            num_of_disloan: num_of_disloan,
                                                            loans: totaloan
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


        } else {
            var query = {
                status: 1
            };
            var myquery = {
                status: 0
            };
            var dquery = {
                approvestatus: 1
            };
            var lquery = {
                approvestatus: 0
            };

            dbo.collection("Users").count((query), function(error, activeuser) {
                dbo.collection("Users").count((myquery), function(error, deactiveuser) {
                    //var percent = activeuser * 100 +"%";
                    if (error) return callback(error);
                    dbo.collection("loan_details").count(function(error, totaloan) {
                        dbo.collection("loan_details").count((dquery), function(error, num_of_loan) {
                            dbo.collection("loan_details").count((lquery), function(error, num_of_disloan) {
                                if (error) return callback(error);
                                dbo.collection("Users").find(query).limit(4).toArray(function(err, userresult) {
                                    dbo.collection("loantype").find().limit(5).toArray(function(err, loanresult) {
                                        dbo.collection("loan_details").find(query).limit(3).toArray(function(err, loan) {
                                            dbo.collection("events").find().toArray(function(err, events) {
                                                dbo.collection("Reminder").find().toArray(function(err, Reminder) {

                                                    res.render('index', {
                                                        title: "Dashboard",
                                                        session: req.session,
                                                        activecount: activeuser,
                                                        deactiveuser: deactiveuser,
                                                        loanno: num_of_loan,
                                                        setlang: languages,
                                                        userdata: userresult,
                                                        loandata: loanresult,
                                                        loan: loan,
                                                        events: events,
                                                        Reminder: Reminder,
                                                        num_of_disloan: num_of_disloan,
                                                        loans: totaloan
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

        // Notification for EMI
        var notificationtype = ['upcoming_emi', 'emi_pending'];
        for (const [key, value] of Object.entries(notificationtype)) {


            dbo.collection("Reminder").find({
                reminder_type: value
            }).limit(1).toArray(function(err, Reminder) {


                for (const [keys, values_n] of Object.entries(Reminder)) {

                    var befor_after = values_n.reminder_will_send;
                    var reminder_template = values_n.reminder_template;
                    for (const [keys, values1] of Object.entries(values_n.reminderdata)) {
                        var number_day = values1.number;
                    }
                }
                var date = Date(Date.now());
                var Today_date = moment(date).format("YYYY-MM-DD");
                if (befor_after == "Before") {
                    var add_date = moment(date).add(number_day, 'd');
                } else {
                    var add_date = moment(date).subtract(number_day, 'd');
                }
                var add_date = moment(add_date).format("YYYY-MM-DD");

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
                            mail_noti: 0,
							status: 0,
                        }]
                    }
                }]).toArray(function(err, result1) {
                    if (err) throw err;

                    for (const [key1, value1] of Object.entries(result1)) {
                        if (value1.loan.approvestatus == 1 || value1.loan.status == 0) {
                            var date_of_emi = value1.date;

                            if (add_date === date_of_emi) {

                                dbo.collection("notificationtemplate").find({
                                    slug: reminder_template
                                }).toArray(function(err, notification) {

                                    for (const [key, value] of Object.entries(notification)) {
                                        var message = value.content;
                                        var subject = value.subject;
                                        var startdate = date_of_emi;
                                        var enddate = date_of_emi
                                        var Obj = {
                                            '_USERFIRSTNAME_': value1.user.firstname,
                                            '_USERLASTNAME_': value1.user.lastname,

                                            '_datetime_': Today_date,
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

                                        Mail.sendMail(value1.user.email, subtrans, trans);
                                    };

                                });
                            }

                        }
                        var query3 = {
                            "_id": ObjectId(value1._id)
                        };
                    }

                    var newvalues = {
                        $set: {
                            mail_noti: 1
                        }
                    }
                    dbo.collection("emi_details").updateOne(query3, newvalues, function(err, result) {});

                });
            });
        }
    });
});

function isAuthenticated(req, res, next) {
    if (req.session.username != undefined) {
        // if (req.session.admin_access == 1){
        // return next();
        // }
        // else{
        return next();
        // }
    } else {
        res.redirect('/');
    }

};

module.exports = router;