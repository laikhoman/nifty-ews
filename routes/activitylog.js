"use strict";
var express = require("express");
var router = express.Router();
var db = require("./mongo_db");
var ObjectId = require("mongodb").ObjectId;
var lang = require("./languageconfig");
var flash = require("express-flash");
var cookieParser = require("cookie-parser");
var session = require("express-session");

router.use(lang.init);
router.use(cookieParser());
router.use(session({
    secret: "222222"
}));
router.use(flash());

/* GET users listing. */
router.get("/", isAuthenticated, function(req, res, next) {
    var dbo = db.get();
    var result_final = [];
    dbo.collection("activitylog").aggregate([{
            $lookup: {
                from: "Users",
                localField: "user",
                foreignField: "_id",
                as: "user"
            }
        }, {
            $unwind: "$user"
        }, {
            $sort: {
                "_id": -1
            }
        },

    ]).toArray(function(err, result) {
        if (result.length !== 0) {

            if (req.session.admin_access == 0) {

                for (const [key, value] of Object.entries(result)) {
                    if (value.user._id == req.session.user_id) {
                        result_final.push(result[key]);
                    }
                }
                res.render("activitylog/activitylog", {
                    title: "Activity Log",
                    session: req.session,
                    messages: req.flash(),
                    activity: result_final
                });
            } else {
                res.render("activitylog/activitylog", {
                    title: "Activity Log",
                    session: req.session,
                    messages: req.flash(),
                    activity: result
                });
            }
        } else {
            var news = [];
            res.render("activitylog/activitylog", {
                title: "Activity Log",
                session: req.session,
                messages: req.flash(),
                activity: news
            });
        }
    });


});

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
                if (result[0].access_type != undefined) {
                    if (result[0].access_type.activitylog != undefined) {
                        if (result[0].access_type.activitylog.view != undefined) {
                            return next();
                        } else {
                            res.redirect("/dashboard");
                        }
                    } else {
                        res.redirect("/dashboard");
                    }
                } else {
                    res.redirect("/dashboard");
                }
            });
        }
    } else {
        res.redirect("/");
    }
};
module.exports = router;