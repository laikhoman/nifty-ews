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
var Mail = require('./email');

router.use(lang.init);
router.use(cookieParser());
router.use(session({
    secret: '222222'
}));
router.use(flash());


/* GET users listing. */
router.route('/:id?')
    .get(isAuthenticated, function(req, res) {
        var languages = lang.getLocale();
        var dbo = db.get();
        var id = req.params.id;
        if (id) {
            var myquery = {
                "_id": ObjectId(id)
            };
            var query = {
                "categorytypes": "event"
            };
            var rolequery = {
                "status": 0
            };
            dbo.collection("category").find(query).toArray(function(err, category) {
                dbo.collection("events").find(myquery).toArray(function(err, events) {
                    if (events[0].eventfor != "all") {
                        for (const [key, value] of Object.entries(events)) {
                            events[key].eventforid_d = ObjectId(value.eventfor).toString();
                        };
                    }
                    dbo.collection("Role").find(rolequery).toArray(function(err, roles) {
                        for (const [key, value] of Object.entries(roles)) {
                            roles[key].id_d = ObjectId(value._id).toString();
                        };
                        res.render('events/addevent', {
                            title: 'Edit event',
                            session: req.session,
                            messages: req.flash(),
                            data: events,
                            type: category,
                            role: roles
                        });
                    });
                });
            });
        } else {
            var news = [{
                'userid': '-1'
            }];
            var query = {
                "categorytypes": "event"
            };
            var rolequery = {
                "status": 0
            };
            dbo.collection("category").find(query).toArray(function(err, category) {
                dbo.collection("Role").find(rolequery).toArray(function(err, roles) {
                    res.render('events/addevent', {
                        title: 'Add event',
                        session: req.session,
                        messages: req.flash(),
                        data: news,
                        type: category,
                        role: roles
                    });
                });
            });
        }
    })
    .post(isAuthenticated, function(req, res) {
        var id = req.body.id;
        var dbo = db.get();
        var eventfor = req.body.eventfor;
        if (eventfor == "all") {
            var forevent = "all";
        } else {
            var forevent = ObjectId(eventfor);
        }
        if (id) {
            var myquery = {
                "_id": ObjectId(id)
            };
            if (req.body.duration == "one day") {
                var newvalues = {
                    $set: {
                        eventtype: req.body.eventtype,
                        eventtitle: req.body.eventtitle,
                        eventvenue: req.body.eventvenue,
                        duration: req.body.duration,
                        startdate: req.body.startdate,
                        eventfor: forevent,
                        eventdetail: req.body.eventdetail,
                    }
                };
            } else {
                var newvalues = {
                    $set: {
                        eventtype: req.body.eventtype,
                        eventtitle: req.body.eventtitle,
                        eventvenue: req.body.eventvenue,
                        duration: req.body.duration,
                        startdate: req.body.startdate,
                        enddate: req.body.enddate,
                        eventfor: forevent,
                        eventdetail: req.body.eventdetail,
                    }
                };
            }
            dbo.collection("events").updateOne(myquery, newvalues, function(err, result) {
                if (eventfor == "all") {
                    var queries = {
                        "status": 1
                    };
                    dbo.collection("Users").find(queries).toArray(function(err, useresult) {
                        if (req.body.duration == "one day") {
                            dbo.collection("notificationtemplate").find({
                                templatetitle: "one day event updated"
                            }).toArray(function(err, notification) {
                                for (const [key, value] of Object.entries(notification)) {
                                    for (const [key1, value1] of Object.entries(useresult)) {
                                        var message = value.content;
                                        var subject = value.subject;
                                        var Obj = {
                                            '_USERFIRSTNAME_': value1.firstname,
                                            '_USERLASTNAME_': value1.lastname,
                                            '_EVENTDURATION_': req.body.duration,
                                            '_EVENTSTARTDATE_': req.body.startdate,
                                            '_EVENTENDDATE_': req.body.enddate,
                                            '_EVENTNAME_': req.body.eventtitle,
                                            '_EVENTVENUE_': req.body.eventvenue,
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
                                templatetitle: "multiple day event updated"
                            }).toArray(function(err, notification) {
                                for (const [key, value] of Object.entries(notification)) {
                                    for (const [key1, value1] of Object.entries(useresult)) {
                                        var message = value.content;
                                        var subject = value.subject;
                                        var Obj = {
                                            '_USERFIRSTNAME_': value1.firstname,
                                            '_USERLASTNAME_': value1.lastname,
                                            '_EVENTDURATION_': req.body.duration,
                                            '_EVENTSTARTDATE_': req.body.startdate,
                                            '_EVENTENDDATE_': req.body.enddate,
                                            '_EVENTNAME_': req.body.eventtitle,
                                            '_EVENTVENUE_': req.body.eventvenue,
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
                            "role": ObjectId(req.body.eventfor)
                        }, {
                            "status": 1
                        }]
                    };
                    dbo.collection("Users").find(mailquery).toArray(function(err, useresult) {
                        if (req.body.duration == "one day") {
                            dbo.collection("notificationtemplate").find({
                                templatetitle: "one day event updated"
                            }).toArray(function(err, notification) {
                                for (const [key, value] of Object.entries(notification)) {
                                    for (const [key1, value1] of Object.entries(useresult)) {
                                        var message = value.content;
                                        var subject = value.subject;
                                        var Obj = {
                                            '_USERFIRSTNAME_': value1.firstname,
                                            '_USERLASTNAME_': value1.lastname,
                                            '_EVENTDURATION_': req.body.duration,
                                            '_EVENTSTARTDATE_': req.body.startdate,
                                            '_EVENTENDDATE_': req.body.enddate,
                                            '_EVENTNAME_': req.body.eventtitle,
                                            '_EVENTVENUE_': req.body.eventvenue,
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
                                templatetitle: "multiple day event updated"
                            }).toArray(function(err, notification) {
                                for (const [key, value] of Object.entries(notification)) {
                                    for (const [key1, value1] of Object.entries(useresult)) {
                                        var message = value.content;
                                        var subject = value.subject;
                                        var Obj = {
                                            '_USERFIRSTNAME_': value1.firstname,
                                            '_USERLASTNAME_': value1.lastname,
                                            '_EVENTDURATION_': req.body.duration,
                                            '_EVENTSTARTDATE_': req.body.startdate,
                                            '_EVENTENDDATE_': req.body.enddate,
                                            '_EVENTNAME_': req.body.eventtitle,
                                            '_EVENTVENUE_': req.body.eventvenue,
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

                var date = Date(Date.now());
                var formatdate = moment(date).format("YYYY-MM-DD");
                var myobjs = {
                    date: formatdate,
                    module: "Event",
                    action: "updated event",
                    user: ObjectId(req.session.user_id),
                    item: req.body.eventtitle,
                    status: 0,
                };
                dbo.collection("activitylog").insertOne(myobjs, function(err, activity) {});

                if (err) {
                    req.flash('error', 'Error occured.');
                    res.redirect('/events/eventlist');
                } else {
                    req.flash('success', lang.__('Event Updated Sucessfully.'));
                    res.redirect('/events/eventlist');
                }
            });
        } else {
            var myobj = {
                eventtype: req.body.eventtype,
                eventtitle: req.body.eventtitle,
                eventvenue: req.body.eventvenue,
                duration: req.body.duration,
                startdate: req.body.startdate,
                enddate: req.body.enddate,
                eventfor: forevent,
                eventdetail: req.body.eventdetail,
            }
            dbo.collection("events").insertOne(myobj, function(err, result) {
                var date = Date(Date.now());
                var formatdate = moment(date).format("YYYY-MM-DD");
                var myobj = {
                    date: formatdate,
                    module: "Event",
                    action: "inserted event",
                    user: ObjectId(req.session.user_id),
                    item: req.body.servicename,
                    status: 0,
                };
                dbo.collection("activitylog").insertOne(myobj, function(err, activity) {});
                if (eventfor == "all") {
                    var queries = {
                        "status": 1
                    };
                    dbo.collection("Users").find(queries).toArray(function(err, useresult) {
                        if (req.body.duration == "one day") {
                            dbo.collection("notificationtemplate").find({
                                templatetitle: "One day Event Added"
                            }).toArray(function(err, notification) {
                                for (const [key, value] of Object.entries(notification)) {
                                    for (const [key1, value1] of Object.entries(useresult)) {
                                        var message = value.content;
                                        var subject = value.subject;
                                        var Obj = {
                                            '_USERFIRSTNAME_': value1.firstname,
                                            '_USERLASTNAME_': value1.lastname,
                                            '_EVENTDURATION_': req.body.duration,
                                            '_EVENTSTARTDATE_': req.body.startdate,
                                            '_EVENTENDDATE_': req.body.enddate,
                                            '_EVENTNAME_': req.body.eventtitle,
                                            '_EVENTVENUE_': req.body.eventvenue,
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
                                templatetitle: "Multiple days Event Added"
                            }).toArray(function(err, notification) {
                                for (const [key, value] of Object.entries(notification)) {
                                    for (const [key1, value1] of Object.entries(useresult)) {
                                        var message = value.content;
                                        var subject = value.subject;
                                        var Obj = {
                                            '_USERFIRSTNAME_': value1.firstname,
                                            '_USERLASTNAME_': value1.lastname,
                                            '_EVENTDURATION_': req.body.duration,
                                            '_EVENTSTARTDATE_': req.body.startdate,
                                            '_EVENTENDDATE_': req.body.enddate,
                                            '_EVENTNAME_': req.body.eventtitle,
                                            '_EVENTVENUE_': req.body.eventvenue,
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
                            "role": ObjectId(req.body.eventfor)
                        }, {
                            "status": 1
                        }]
                    };
                    dbo.collection("Users").find(mailquery).toArray(function(err, useresult) {
                        if (req.body.duration == "one day") {
                            dbo.collection("notificationtemplate").find({
                                templatetitle: "One day Event Added"
                            }).toArray(function(err, notification) {
                                for (const [key, value] of Object.entries(notification)) {
                                    for (const [key1, value1] of Object.entries(useresult)) {
                                        var message = value.content;
                                        var subject = value.subject;
                                        var Obj = {
                                            '_USERFIRSTNAME_': value1.firstname,
                                            '_USERLASTNAME_': value1.lastname,
                                            '_EVENTDURATION_': req.body.duration,
                                            '_EVENTSTARTDATE_': req.body.startdate,
                                            '_EVENTENDDATE_': req.body.enddate,
                                            '_EVENTNAME_': req.body.eventtitle,
                                            '_EVENTVENUE_': req.body.eventvenue,
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
                                templatetitle: "Multiple days Event Added"
                            }).toArray(function(err, notification) {
                                for (const [key, value] of Object.entries(notification)) {
                                    for (const [key1, value1] of Object.entries(useresult)) {
                                        var message = value.content;
                                        var subject = value.subject;
                                        var Obj = {
                                            '_USERFIRSTNAME_': value1.firstname,
                                            '_USERLASTNAME_': value1.lastname,
                                            '_EVENTDURATION_': req.body.duration,
                                            '_EVENTSTARTDATE_': req.body.startdate,
                                            '_EVENTENDDATE_': req.body.enddate,
                                            '_EVENTNAME_': req.body.eventtitle,
                                            '_EVENTVENUE_': req.body.eventvenue,
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
                if (err) {
                    req.flash('error', 'Error occured.');
                    res.redirect('/events/eventlist');
                } else {
                    req.flash('success', lang.__('Event Inserted Sucessfully.'));
                    res.redirect('/events/eventlist');
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
                        if (result[0].access_type.events != undefined) {
                            if (result[0].access_type.events.add != undefined) {
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
                        if (result[0].access_type.events != undefined) {
                            if (result[0].access_type.events.update != undefined) {
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