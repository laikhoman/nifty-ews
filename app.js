var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var MongoClient = require('mongodb').MongoClient;
var session = require('express-session');
var bodyParser = require('body-parser');
var m= require('dotenv').config();
var hbs1 = require('hbs');

var app = express();
hbs = require('express-handlebars');
app.use(bodyParser());
var indexRouter = require('./routes/index');
var installationRouter = require('./routes/installation');
var usersRouter = require('./routes/users');
var adduserRouter = require('./routes/adduser');
var viewuserRouter = require('./routes/viewuser');
var editprofileRouter = require('./routes/editprofile');
var addroleRouter = require('./routes/addrole');
var rolesRouter = require('./routes/roles');
var addruleRouter = require('./routes/addrule');
var rulesRouter = require('./routes/rules');
var userlistRouter = require('./routes/userlist');
var addloanRouter = require('./routes/addloan');
var loanlistRouter = require('./routes/loanlist');
var viewloanRouter = require('./routes/viewloan');
var disapproveloanRouter = require('./routes/disapproveloan');
var addemiRouter = require('./routes/addemi');
var addloantypeRouter = require('./routes/addloantype');
var loantypelistRouter = require('./routes/loantypelist');
var deactivateuserRouter = require('./routes/deactivateuser');
var loginRouter = require('./routes/login');
var settingRouter = require('./routes/generalsetting');
var ajxfunRouter = require('./routes/ajaxfun');
var kendodeleteRouter = require('./routes/kendodelete');
var remindersRouter = require('./routes/reminders');
var addreminderRouter = require('./routes/addreminder');
var addnotificationtemplateRouter = require('./routes/addnotificationtemplate');
var notificationtemplateRouter = require('./routes/notificationtemplate');
var apiconfigRouter = require('./routes/apiconfig');
var addcustomfieldsRouter = require('./routes/addcustomfields');
var customfieldlistRouter = require('./routes/customfieldlist');
var addcategoryRouter = require('./routes/addcategory');
var categorylistRouter = require('./routes/categorylist');
var repaymentRouter = require('./routes/repayment');
var accessrightsRouter = require('./routes/accessright');
var addserviceRouter = require('./routes/addservice');
var servicelistRouter = require('./routes/servicelist');
var activitylogRouter = require('./routes/activitylog');
var addproductRouter = require('./routes/addproduct');
var productlistRouter = require('./routes/productlist');
var viewproductRouter = require('./routes/viewproduct');
var notelistRouter = require('./routes/notelist');
var viewnoteRouter = require('./routes/viewnote');
var impersonateRouter = require('./routes/impersonateuser');
var addeventRouter = require('./routes/addevent');
var eventlistRouter = require('./routes/eventlist');
var vieweventRouter = require('./routes/viewevent');
var reportRouter = require('./routes/report');
var notificationlistRouter = require('./routes/notificationlist');
var loanreportstRouter = require('./routes/loanreports');
var reminderscustomertRouter = require('./routes/reminders_customer');



// view engine setup
app.set('views', path.join(__dirname, 'views'));

app.engine('hbs', hbs({
    extname: 'hbs',
    defaultLayout: 'layout',
    layoutsDir: __dirname + '/views/layouts/',
    partialsDir: __dirname + '/views/partial/',
    usersDir: __dirname + '/views/users/',
    roleDir: __dirname + '/views/role/',
    loanDir: __dirname + '/views/loan/',
    generalsettingsDir: __dirname + '/views/generalsettings/',
    reminderDir: __dirname + '/views/reminder/',
    notificationDir: __dirname + '/views/notification/',
    customfieldsDir: __dirname + '/views/customfields/',
    accessrightsDir: __dirname + '/views/accessrights/',
    categoriesDir: __dirname + '/views/category/',
    serviceDir: __dirname + '/views/service/',
    activitylogDir: __dirname + '/views/activitylog/',
    productDir: __dirname + '/views/product/',
    noteDir: __dirname + '/views/notes/',
    impersonateDir: __dirname + '/views/impersonate/',
    eventsDir: __dirname + '/views/events/',
    reportDir: __dirname + '/views/report',
    notificationlistDir: __dirname + '/views/notificationlist',

    helpers: require('./helpers/handlebars'),

}));

app.set('view engine', 'hbs');


app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({
    extended: false
}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


function isAuthenticated(req, res, next) {
    // console.log('jkhjkhjkhkjhjkhhhkh');
    if (req.session.username != undefined) {
        return next();
    } else {
        res.render('login', {
            title: 'NiftyEWS',
            layout: "loginlayout"
        });
    }
};

//var fns = {isAuthenticated : isAuthenticated,}
app.use('/', loginRouter);
app.use('/logout', loginRouter);
app.use('/dashboard', indexRouter);
app.use('/users', usersRouter);
app.use('/installation', installationRouter);
app.use('/users/editprofile', editprofileRouter);
app.use('/users/adduser', adduserRouter);
app.use('/users/apiconfig', apiconfigRouter);
app.use('/users/viewuser', viewuserRouter);
app.use('/role/addrole', addroleRouter);
app.use('/rule/addrule', addruleRouter);
app.use('/role/roles', rolesRouter);
app.use('/rule/rules', rulesRouter);
app.use('/generalsettings/generalsetting', settingRouter);
app.use('/users/userlist', userlistRouter, isAuthenticated);
app.use('/users/deactivateuser', deactivateuserRouter, isAuthenticated);
app.use('/ajxfun', ajxfunRouter);
app.use('/kendodelete', kendodeleteRouter);
app.use('/loan/addloan', addloanRouter);
app.use('/loan/loanlist', loanlistRouter);
app.use('/loan/viewloan', viewloanRouter);
app.use('/loan/addemi', addemiRouter);
app.use('/loan/addloantype', addloantypeRouter);
app.use('/loan/loantypelist', loantypelistRouter);
app.use('/loan/disapproveloan', disapproveloanRouter);
app.use('/reminder/reminders', remindersRouter);
app.use('/reminder/addreminder', addreminderRouter);
app.use('/notification/addnotificationtemplate', addnotificationtemplateRouter);
app.use('/notification/notificationtemplate', notificationtemplateRouter);
app.use('/customfields/addcustomfields', addcustomfieldsRouter);
app.use('/customfields/customfieldlist', customfieldlistRouter);
app.use('/category/addcategory', addcategoryRouter);
app.use('/category/categorylist', categorylistRouter);
app.use('/loan/repayment', repaymentRouter);
app.use('/accessrights/accessright', accessrightsRouter);
app.use('/service/addservice', addserviceRouter);
app.use('/service/servicelist', servicelistRouter);
app.use('/activitylog/activitylog', activitylogRouter);
app.use('/product/addproduct', addproductRouter);
app.use('/product/productlist', productlistRouter);
app.use('/product/viewproduct', viewproductRouter);
app.use('/notes/notelist', notelistRouter);
app.use('/notes/viewnote', viewnoteRouter);
app.use('/events/addevent', addeventRouter);
app.use('/events/eventlist', eventlistRouter);
app.use('/events/viewevent', vieweventRouter);
app.use('/impersonate/impersonateuser', impersonateRouter);
app.use('/report/report', reportRouter);
app.use('/notification/notificationlist', notificationlistRouter);
app.use('/loan/loanreports', loanreportstRouter);
app.use('/reminder/reminderslist', reminderscustomertRouter);
// catch 404 and forward to error handler
app.use(function(req, res, next) {
    next(createError(404, "This page doesnot exist."));
});

const db = require('./routes/mongo_db');
global.__basedir = __dirname;

// error handler
app.use(function(err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error', {
        layout: "errorlayout",
        statuscode: err.statusCode
    });
});
db.connect(() => {
    app.listen(process.env.PORT_APP || 5555, function (){
        console.log(`Listening ${process.env.PORT}`);
    });
})

module.exports = app;