// ##############################################################################################
// ####################################   START DEMO  ##########################################
// #################################### CHANDAN KUMAR  ##########################################
// ##############################################################################################

// ------------------------------------- Import Library -----------------------------------------

var express = require('express');
var https = require('https');
var app = express();
var mongoose = require('mongoose');
var morgan = require('morgan');
var bodyParser = require('body-parser');
var config = require('./config');
var methodOverride = require('method-override');
var argv = require('yargs').argv;
var path = require('path');
var DEMO = require('./model/DEMO');
var XLSX = require('xlsx');
var formidable = require('formidable');
var FileSaver = require('file-saver');
var fs = require('fs');
var otpController = require('./otp/otpController');
var helmet = require('helmet');
var cors = require('cors');
var csrf = require('csurf');
var session = require('express-session');
var cookieParser = require('cookie-parser');
var expressValidator = require('express-validator');
var util = require('util');
var crypto = require('./services/crypto.service');
var pdfService = require('./services/pdf.service');
var mailerServices = require('./services/mailer.service');
var backendLoginController = require('./admin/loginController');
var md5 = require("blueimp-md5");
var async = require("async");

// ----------------------------------- Import Library -------------------------------------------

// ----------------------------------- Define Base Directory ------------------------------------
global.__basedir = __dirname;
// ----------------------------------- Define Base Directory ------------------------------------

// ------------------------------ CORS Implementation ----------------------------------
app.use(cors({
    origin: ['https://DEMO.example.in'],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'x-access-token', 'XSRF-TOKEN'],
    preflightContinue: false
}));
// ------------------------------ CORS Implementation ----------------------------------

// ------------------------------ Helmet Implementation --------------------------------
app.use(helmet());
app.use(helmet.noCache());
app.use(helmet.frameguard({action: 'deny'}));
// ------------------------------ Helmet Implementation --------------------------------

// ------------------------------ Database Connection ----------------------------------
var port = argv.PORT || process.env.PORT || 8383;
var environment = config.DEVELOPMENT;
mongoose.Promise = global.Promise;
var authVerify = mongoose.connect(config[environment].database, {
    server: {
        auto_reconnect: true,
        socketOptions: {
            keepAlive: 1,
            connectTimeoutMS: 300000,
            socketTimeoutMS: 300000
        }
    }
});
// ----------------------------- Database Connection -----------------------------------

// ----------------------------- Set Secret Key ----------------------------------------
app.set('superSecret', config[environment].secret);
// ----------------------------- Set Secret Key ----------------------------------------

// ----------------------------- Use EJS File System -----------------------------------
app.set('view engine', 'ejs');
// ----------------------------- Use EJS File System -----------------------------------

// ----------------------------- Healthcheck Route -------------------------------------
app.use('/healthcheck', function (req, res) {
    res.render(__dirname + '/public/healthcheck');
});
// ----------------------------- Healthcheck Route -------------------------------------

// ----------------------------- Custom Validator --------------------------------------

app.use(expressValidator({
    customValidators: {
        gte: function (param, num) {
            return param <= num && param >= 0;
        }
    }
}));

// ----------------------------- Custom Validator --------------------------------------

// ----------------------------- Body Parser -------------------------------------------
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
// ------------------ For Access public folder files through code ----------------------
app.use(express.static(path.join(__dirname, 'public')));


// ----------------------------- Body Parser -------------------------------------------

// ----------------------------- Session Security Implementation -----------------------
app.use(cookieParser());
var MemoryStore = session.MemoryStore;
app.use(session({
    name: 'session',
    secret: "DEMO-the-times-internet-dot-in",
    resave: true,
    store: new MemoryStore(),
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        secure: false,
        // domain: 'example.com',
        maxAge: 60 * 60 * 1000
    }
}));
// ---------------------------- Session Security Implemetation ------------------------ 

// -------------------------- CSRF Implementation -------------------------------------

app.use(csrf({cookie: true}));

app.use(function (req, res, next) {
    var token = req.csrfToken();
    res.cookie('XSRF-TOKEN', token);
    res.locals.csrfToken = token;
    next();
});

// ------------------------- CSRF Implementation -------------------------------------

// ------------------------------ Constant Values according to Level Limits ------------------------

global.forMonth = 8;
global.mealVoucherAmount = 26400;
global.zeroPrintConstant = 0;

// -------------------------------- Constant values according to Level Limits -------------------------


// ------------------------------ get login view -------------------------------------------
app.get('/', function (req, res) {
    if (req.session && req.session.frontendUser && req.session.frontendUser.email && !req.session.frontendUser.user) {
        res.render(__dirname + '/public/login', {status: false, message: 'Session expired, please login again.'});
    } else if (req.session && req.session.frontendUser && req.session.frontendUser.email && req.session.frontendUser.user) {
        res.redirect('/home');
    } else {
        res.render(__dirname + '/public/login', {status: true, message: '', csrfToken: req.csrfToken()});
    }
});
// ------------------------------ get login view -------------------------------------------

// ------------------------------ get otp Password -------------------------------------------
app.post('/', otpController.getOtp);
// ------------------------------ get otp password -------------------------------------------

// ------------------------------- Logout ----------------------------------------------------
app.get('/logout', function (req, res) {
    req.session.frontendUser = null;
    res.redirect('/');
});
// ------------------------------- Logout ---------------------------------------------------

// ---------------------------- get dashboard View --------------------------------------------
app.get('/home', function (req, resp) {
    if (!req.session.frontendUser || !req.session.frontendUser.user) {
        resp.redirect('/');
    } else {
        DEMO.findOne({
            Email_Id: req.session.frontendUser.user.email,
            Sap_Id: req.session.frontendUser.user.sap_id
        }, {__v: 0}, function (err, user) {
            if (err) {
                resp.redirect('/');
            }
            else {
                resp.render(__dirname + '/public/index', {
                    csrfToken: req.csrfToken(),
                    DEMOData: crypto.compileDecryption(user.toObject())
                });
            }
        });

    }
});
// ---------------------------- get dashboard View -------------------------------------------

// -------------------------------- Revised and Update Salary --------------------------------
app.post('/revised/', function (req, resp) {
    if (!req.session.frontendUser || !req.session.frontendUser.user) {
        resp.redirect('/');
    } else {


        // Start : -------------------- Server Side Validation -------------------------------

        DEMO.findOne({
            Email_Id: req.session.frontendUser.user.email,
            Sap_Id: req.session.frontendUser.user.sap_id,
            _id: req.body.DEMOUserId
        }, {__v: 0}, function (err, user) {
            if (err) {
                req.session.frontendUser = null;
                resp.redirect('/');
            }
            else {

                var byPass=['DEMOUserId','_csrf','mealVoucherStatus','mealOriginalStatus'];
                Object.keys(req.body).forEach(function(k){
                    if(byPass.indexOf(k) == -1)
                      req.body[k] = (!req.body[k] || isNaN(req.body[k])) ? 0 : req.body[k];
                });

                var mealVoucherTotalLimitValidation = 26400;
                var mealVoucherNewLimitValidation = 26400 - parseInt(crypto.decryption(user.Meal_Voucher_Utilized));
                var medicalLimitValidation = 15000;
                var medicalNewLimitValidation = 15000 - parseInt(crypto.decryption(user.Medical_Reimbursement_Utilized));
                var ttrMaxLimitValidation = parseInt(crypto.decryption(user.TTR_Current));
                var totalHraBasicValueMaxLimit = parseInt(crypto.decryption(user.Basic));
                var totalHraNewBasicValueMaxLimit = parseInt(crypto.decryption(user.Basic)) - parseInt(crypto.decryption(user.Hra_Utilized));
                


                // End : -------------------- Server Side Validation ----------------------------------

                req.checkBody('paySlipValueNewTotalHiddenValue', 'Amount must be an integer less than or equal to ' + ttrMaxLimitValidation + '.').isInt().gte(parseInt(ttrMaxLimitValidation));
                req.checkBody('hraNewValueSubmitted', 'Amount must be an integer less than or equal to ' + totalHraNewBasicValueMaxLimit + '.').isInt().gte(parseInt(totalHraNewBasicValueMaxLimit));
                req.checkBody('hraTotalValue', 'Amount must be an integer less than or equal to ' + totalHraBasicValueMaxLimit + '.').isInt().gte(parseInt(totalHraBasicValueMaxLimit));
                req.checkBody('specialAllowanceNewValue', 'Amount must be an integer less than or equal to ' + ttrMaxLimitValidation + '.').isInt().gte(parseInt(ttrMaxLimitValidation));
                req.checkBody('specialAllowanceTotalValue', 'Amount must be an integer less than or equal to ' + ttrMaxLimitValidation + '').isInt().gte(parseInt(ttrMaxLimitValidation));
                req.checkBody('paySlipValueNew', 'Amount must be an integer less than or equal to ' + ttrMaxLimitValidation + '.').isInt().gte(parseInt(ttrMaxLimitValidation));
                req.checkBody('paySlipValueNewTotal', 'Amount must be an integer less than or equal to ' + ttrMaxLimitValidation + '.').isInt().gte(parseInt(ttrMaxLimitValidation));
                req.checkBody('ConveyanceReimbursementNewView', 'Amount must be an integer less than or equal to ' + newConveyance + '.').isInt().gte(parseInt(newConveyance));
                req.checkBody('ConveyanceReimbursementTotal', 'Amount must be an integer less than or equal to ' + conveyance + '.').isInt().gte(parseInt(conveyance));
                req.checkBody('CommunicationReimbursementNewView', 'Amount must be an integer less than or equal to ' + newCommunication + '.').isInt().gte(parseInt(newCommunication));
                req.checkBody('CommunicationReimbursementTotal', 'Amount must be an integer less than or equal to ' + communication + '.').isInt().gte(parseInt(communication));
                req.checkBody('medicalReimbursementNewView', 'Amount must be an integer less than or equal to ' + medicalNewLimitValidation + '.').isInt().gte(parseInt(medicalNewLimitValidation));
                req.checkBody('medicalReimbursementTotal', 'Amount must be an integer less than or equal to ' + medicalLimitValidation + '.').isInt().gte(parseInt(medicalLimitValidation));
                req.checkBody('mealNewValue', 'Amount must be an integer less than or equal to ' + mealVoucherNewLimitValidation + '.').isInt().gte(parseInt(mealVoucherNewLimitValidation));
                req.checkBody('mealVoucherTotal', 'Amount must be an integer less than or equal to ' + mealVoucherTotalLimitValidation + '.').isInt().gte(parseInt(mealVoucherTotalLimitValidation));
                req.checkBody('mealVoucherStatus', 'Meal Voucher Status Required.').notEmpty();
                req.checkBody('ltaReimbursementNewView', 'Amount must be an integer less than or equal to ' + newLta + '').isInt().gte(parseInt(newLta));
                req.checkBody('ltaReimbursementTotal', 'Amount must be an integer less than or equal to ' + lta + '.').isInt().gte(parseInt(lta));

                var _user = {
                    Total_Reimbursement_Total: crypto.encryption(req.body.paySlipValueNewTotalHiddenValue),
                    Total_Reimbursement_New: crypto.encryption(req.body.paySlipValueNewTotalHiddenValue),
                    Hra_New: crypto.encryption(req.body.hraNewValueSubmitted),
                    Hra_Total: crypto.encryption(req.body.hraTotalValue),
                    Special_Allowance_New: crypto.encryption(req.body.specialAllowanceNewValue),
                    Special_Allowance_Total: crypto.encryption(req.body.specialAllowanceTotalValue),
                    Payslip_Value_New: crypto.encryption(req.body.paySlipValueNew),
                    Payslip_Value_Total: crypto.encryption(req.body.paySlipValueNewTotal),
                    Conveyance_Reimbursement_New: crypto.encryption(req.body.ConveyanceReimbursementNewView),
                    Conveyance_Reimbursement_Total: crypto.encryption(req.body.ConveyanceReimbursementTotal),
                    Communication_Reimbursement_New: crypto.encryption(req.body.CommunicationReimbursementNewView),
                    Communication_Reimbursement_Total: crypto.encryption(req.body.CommunicationReimbursementTotal),
                    Medical_Reimbursement_New: crypto.encryption(req.body.medicalReimbursementNewView),
                    Medical_Reimbursement_Total: crypto.encryption(req.body.medicalReimbursementTotal),
                    Meal_Voucher_New: crypto.encryption(req.body.mealNewValue),
                    Meal_Voucher_Total: crypto.encryption(req.body.mealVoucherTotal),
                    Meal_Voucher_New_Status: crypto.encryption(req.body.mealVoucherStatus),
                    LTA_New: crypto.encryption(req.body.ltaReimbursementNewView),
                    LTA_Total: crypto.encryption(req.body.ltaReimbursementTotal),
                    Updated_Status: 'TRUE',
                    Updated_at: new Date()
                };


                req.getValidationResult().then(function (result) {

                    if (!result.isEmpty()) {
                        return resp.status(400).send('There have been validation errors: ' + util.inspect(result.array()));
                    } else if (!_user) {
                        return resp.send(500, {error: {"message": "Something Went Wrong"}});
                    }
                    else {
                        // Start : ----------------------- Updation Coding and PDF Generation --------------------------------
                        DEMO.update({
                            _id: req.body.DEMOUserId,
                            Sap_Id: req.session.frontendUser.user.sap_id,
                            Email_Id: req.session.frontendUser.user.email
                        }, {
                            $set: _user
                        }, {upsert: true, strict: false}, function (err, doc) {

                            if (err) {
                                req.session.frontendUser = null;
                                resp.render(__basedir + '/public/error');
                                return;
                            }

                            DEMO.findOne({
                                Email_Id: req.session.frontendUser.user.email,
                                Sap_Id: req.session.frontendUser.user.sap_id
                            }, {__v: 0}, function (err, user) {
                                if (err) {
                                    req.session.frontendUser=null;
                                    resp.render(__basedir + '/public/error');
                                }
                                else {
                                    var _user = crypto.compileDecryption(user.toObject());
                                    pdfService.generatePdf(_user, function (err, data) {
                                        fs.unlink(data.pdfPath);
                                        resp.redirect('/');
                                    });
                                }
                            });

                        });
                        // End : ------------------------- Updation Coding and PDF Generation --------------------------------

                    }
                });

                // ----------------------------------- Server Side Validation Closer Boundary ----------------------------

            }
        });

        // ----------------------------------- Server Side Validation Closer Boundary ----------------------------

    }

});

// ------------------------------- Revised and Update Salary ------------------------------

// ----------------------------- OTP View -------------------------------------------------
app.get('/otp', function (req, resp) {
    if (!req.session || !req.session.frontendUser || !req.session.frontendUser.email) {
        resp.redirect('/');
    } else if (req.session && req.session.frontendUser && req.session.frontendUser.email && req.session.frontendUser.user) {
        resp.redirect('/home');
    } else {
        resp.render(__basedir + '/public/otp', {
            status: true,
            otpexpired: false,
            expire: req.session.frontendUser.otp_expire,
            email: req.session.frontendUser.email,
            message: '',
            csrfToken: req.csrfToken()
        });
    }
});
// ---------------------------- OTP View --------------------------------------------------

// ------------------------- get OTP ------------------------------------------------------
app.post('/otp', otpController.verifyOtp);
// -------------------------get OTP -------------------------------------------------------

// ------------------------- Resend OTP ---------------------------------------------------
app.get('/otp/resend', otpController.resendOtp);
// ------------------------- Resend OTP ---------------------------------------------------


// ------------------------------- get salary structure -----------------------------------
app.get('/salary/:sapId', function (req, res) {

    if (!req.params.sapId) {
        res.status(500).send('Please make sure that you have right access or you are a valid user.').end();
        return;
    }
    if (!req.session || !req.session.frontendUser || !req.session.frontendUser.email || !req.session.frontendUser.user) {
        res.redirect('/');
    } else if (req.session && req.session.frontendUser && req.session.frontendUser.email && req.session.frontendUser.user && req.params.sapId !== crypto.decryption(req.session.frontendUser.user.sap_id)) {
        res.redirect('/home');
    } else {
        var pdfName = __basedir + '/uploads/demo/' + req.params.sapId + 'demo.pdf';
        fs.readFile(pdfName, function (err, data) {
            if (err) {
                res.status(500).send('Something went wrong, please try again.').end();
                return;
            }
            res.contentType("application/pdf");
            res.send(data).end();
        });
    }
});
// -------------------------------- get salary structure ----------------------------------


// ------------------------------------- Start :: Backend Admin Panel Code -------------------------------------

// Start :: Get and Post Login View and Controller
app.get('/admin/login', function (req, res) {
    if (req.session && req.session.backendUser) {
        res.redirect('/admin/dashboard');
    } else {
        res.render(__dirname + '/public/admin/index', {csrfToken: req.csrfToken()});
    }
});

app.post('/admin/login', backendLoginController.auth);
// End :: Post and Get Login View and Controller

// Start :: Registration Form
app.get('/admin/registration', function (req, res) {
    if (req.session && req.session.backendUser) {
        res.render(__dirname + '/public/admin/registration', {csrfToken: req.csrfToken(),userEmail:crypto.decryption(req.session.backendUser.email_id)});
    } else {
        res.redirect('/admin/login');
    }
});

app.post('/admin/registration', backendLoginController.registration);
// End :: Registration Form 

// Start :: Registration Form
app.get('/admin/dashboard', function (req, res) {
    if (req.session && req.session.backendUser) {
        // an example using an object instead of an array
        async.parallel({
            totalEmployee: function(callback) {
                DEMO.count({}, function (err, data) {
                    if (err) {
                        callback(err);
                    }
                    else {
                        callback(null, data);
                    }
                });
            },
            reach: function(callback) {
                DEMO.count({otp:{$exists:true}}, function (err, data) {
                    if (err) {
                        callback(err);
                    }
                    else {
                        callback(null, data);
                    }
                });
            },
            notReach: function(callback) {
                DEMO.count({otp:{$exists:false}}, function (err, data) {
                    if (err) {
                        callback(err);
                    }
                    else {
                        callback(null, data);
                    }
                });
            },
            updateSalary: function(callback) {
                DEMO.count({Updated_Status:'TRUE'}, function (err, data) {
                    if (err) {
                        callback(err);
                    }
                    else {
                        callback(null, data);
                    }
                });
            }
        }, function(err, data) {
            if (err){
                res.redirect('/admin/logout');
            }else {
                res.render(__dirname + '/public/admin/dashboard', {csrfToken: req.csrfToken(), userEmail:crypto.decryption(req.session.backendUser.email_id), data:data});
            }
        });

    } else {
        res.redirect('/admin/login');
    }
});
// End :: Registration Form


// Start :: usermanagement
app.get('/admin/usermanagement', function (req, res) {
    if (req.session && req.session.backendUser) {
        res.render(__dirname + '/public/admin/usermanagement', {csrfToken: req.csrfToken(), userEmail:crypto.decryption(req.session.backendUser.email_id)});
    } else {
        res.redirect('/admin/login');
    }
});

app.get('/admin/adduser', function (req, res) {
    if (req.session && req.session.backendUser) {
        res.render(__dirname + '/public/admin/addEditUser', {csrfToken: req.csrfToken(), userEmail:crypto.decryption(req.session.backendUser.email_id)});
    } else {
        res.redirect('/admin/login');
    }
});

app.post('/admin/edituser/:id', function (req, res) {
    if (req.session && req.session.backendUser) {
        res.render(__dirname + '/public/admin/addEditUser', {csrfToken: req.csrfToken()});
    } else {
        res.redirect('/admin/login');
    }
});
// End :: usermanagement

// Start :: record management
app.post('/admin/search', function (req, res) {
    if (req.session && req.session.backendUser) {
        var _query = {$or: [{'Sap_Id': crypto.encryption(req.body.searchStr)}, {'Name': crypto.encryption(req.body.searchStr)}, {'Email_Id': crypto.encryption(req.body.searchStr)}]};
        DEMO.findOne(_query, function (err, user) {
            if (err) {
                return res.send(err);
            }
            var data = [];
            if (user) {
                var _user = user.toObject();
                var str = crypto.decryption(_user.Name) + ' ' + crypto.decryption(_user.Email_Id) + ' ' + crypto.decryption(_user.Sap_Id);
                data.push({
                    result: str,
                    _id: _user._id
                });
            } else {
                data = null;
            }

            res.send(data).end();
        });
    } else {
        res.redirect('/admin/login');
    }
});

app.get('/admin/record/:_id', function (req, res) {
    if (req.session && req.session.backendUser) {
        DEMO.findOne({_id: req.params._id}, {
            __v: 0,
            logs: 0,
            otp: 0,
            expire: 0,
            Updated_Status: 0,
            Updated_at: 0,
            Created_at: 0
        }, function (err, user) {
            if (err) {
                res.redirect('/admin/dashboard');
            }
            else {
                res.render(__dirname + '/public/admin/editrecord', {
                    csrfToken: req.csrfToken(),
                    userEmail:crypto.decryption(req.session.backendUser.email_id),
                    DEMOData: crypto.compileDecryption(user.toObject())
                });
            }
        });
    } else {
        res.redirect('/admin/login');
    }
});

app.post('/admin/record/:_id', function (req, res) {
    if (req.session && req.session.backendUser) {
        var _data = {
            Sap_Id: crypto.encryption(req.body.Sap_Id),
            Name: crypto.encryption(req.body.Name),
            Email_Id: crypto.encryption(req.body.Email_Id),
            Business: crypto.encryption(req.body.Business),
            Cluster: crypto.encryption(req.body.Cluster),
            Level: crypto.encryption(req.body.Level),
            Basic: crypto.encryption(req.body.Basic),
            Basic_Utilized: crypto.encryption(req.body.Basic_Utilized),
            Basic_Total: crypto.encryption(req.body.Basic_Total),
            Hra_Current: crypto.encryption(req.body.Hra_Current),
            Hra_Utilized: crypto.encryption(req.body.Hra_Utilized),
            Hra_New: crypto.encryption(req.body.Hra_New),
            Hra_Total: crypto.encryption(req.body.Hra_Total),
            Special_Allowance_Current: crypto.encryption(req.body.Special_Allowance_Current),
            Special_Allowance_Utilized: crypto.encryption(req.body.Special_Allowance_Utilized),
            Special_Allowance_New: crypto.encryption(req.body.Special_Allowance_New),
            Special_Allowance_Total: crypto.encryption(req.body.Special_Allowance_Total),
            Transport_Allowance_Current: crypto.encryption(req.body.Transport_Allowance_Current),
            Transport_Allowance_Utilized: crypto.encryption(req.body.Transport_Allowance_Utilized),
            Transport_Allowance_New: crypto.encryption(req.body.Transport_Allowance_New),
            Transport_Allowance_Total: crypto.encryption(req.body.Transport_Allowance_Total),
            Payslip_Value_Current: crypto.encryption(req.body.Payslip_Value_Current),
            Payslip_Value_Utilized: crypto.encryption(req.body.Payslip_Value_Utilized),
            Payslip_Value_New: crypto.encryption(req.body.Payslip_Value_New),
            Payslip_Value_Total: crypto.encryption(req.body.Payslip_Value_Total),
            Meal_Voucher_Old_Status: crypto.encryption(req.body.Meal_Voucher_Old_Status),
            Meal_Voucher_Utilized: crypto.encryption(req.body.Meal_Voucher_Utilized),
            Meal_Voucher_New_Status: crypto.encryption(req.body.Meal_Voucher_New_Status),
            Meal_Voucher_New: crypto.encryption(req.body.Meal_Voucher_New),
            Meal_Voucher_Total: crypto.encryption(req.body.Meal_Voucher_Total),
            Conveyance_Reimbursement_Current: crypto.encryption(req.body.Conveyance_Reimbursement_Current),
            Conveyance_Reimbursement_Utilized: crypto.encryption(req.body.Conveyance_Reimbursement_Utilized),
            Conveyance_Reimbursement_New: crypto.encryption(req.body.Conveyance_Reimbursement_New),
            Conveyance_Reimbursement_Total: crypto.encryption(req.body.Conveyance_Reimbursement_Total),
            Communication_Reimbursement_Current: crypto.encryption(req.body.Communication_Reimbursement_Current),
            Communication_Reimbursement_Utilized: crypto.encryption(req.body.Communication_Reimbursement_Utilized),
            Communication_Reimbursement_New: crypto.encryption(req.body.Communication_Reimbursement_New),
            Communication_Reimbursement_Total: crypto.encryption(req.body.Communication_Reimbursement_Total),
            Medical_Reimbursement_Current: crypto.encryption(req.body.Medical_Reimbursement_Current),
            Medical_Reimbursement_Utilized: crypto.encryption(req.body.Medical_Reimbursement_Utilized),
            Medical_Reimbursement_New: crypto.encryption(req.body.Medical_Reimbursement_New),
            Medical_Reimbursement_Total: crypto.encryption(req.body.Medical_Reimbursement_Total),
            LTA_Status: crypto.encryption(req.body.LTA_Status),
            LTA_Current: crypto.encryption(req.body.LTA_Current),
            LTA_Utilized: crypto.encryption(req.body.LTA_Utilized),
            LTA_New: crypto.encryption(req.body.LTA_New),
            LTA_Total: crypto.encryption(req.body.LTA_Total),
            Total_Reimbursement_Current: crypto.encryption(req.body.Total_Reimbursement_Current),
            Total_Reimbursement_Utilized: crypto.encryption(req.body.Total_Reimbursement_Utilized),
            Total_Reimbursement_New: crypto.encryption(req.body.Total_Reimbursement_New),
            Total_Reimbursement_Total: crypto.encryption(req.body.Total_Reimbursement_Total),
            PF_Current: crypto.encryption(req.body.PF_Current),
            PF_Utilized: crypto.encryption(req.body.PF_Utilized),
            PF_New: crypto.encryption(req.body.PF_New),
            PF_Total: crypto.encryption(req.body.PF_Total),
            Gratuity_Current: crypto.encryption(req.body.Gratuity_Current),
            Gratuity_Utilized: crypto.encryption(req.body.Gratuity_Utilized),
            Gratuity_New: crypto.encryption(req.body.Gratuity_New),
            Gratuity_Total: crypto.encryption(req.body.Gratuity_Total),
            TTR_Current: crypto.encryption(req.body.TTR_Current),
            TTR_Utilized: crypto.encryption(req.body.TTR_Utilized),
            TTR_Available: crypto.encryption(req.body.TTR_Available),
            TVP_Total: crypto.encryption(req.body.TVP_Total),
            BPL_Current: crypto.encryption(req.body.BPL_Current),
            BPL_Utilized: crypto.encryption(req.body.BPL_Utilized),
            BPL_New: crypto.encryption(req.body.BPL_New),
            BPL_Total: crypto.encryption(req.body.BPL_Total),
            CarMonetization_Current: crypto.encryption(req.body.CarMonetization_Current),
            CarMonetization_Utilized: crypto.encryption(req.body.CarMonetization_Utilized),
            CarMonetization_New: crypto.encryption(req.body.CarMonetization_New),
            CarMonetization_Total: crypto.encryption(req.body.CarMonetization_Total),
            Conveyance_Upper_Limit: crypto.encryption(req.body.Conveyance_Upper_Limit)
        };
        DEMO.update({_id: req.params._id}, {
            $set: _data
        }, {upsert: true, strict: false}, function (err, doc) {
            res.redirect('/admin/dashboard');
        });

    } else {
        res.redirect('/admin/login');
    }
});
// End :: record management

//  Start Import Code and Encryption Login
app.get('/admin/import', function (req, res) {
    if (req.session && req.session.backendUser) {
        res.render(__dirname + '/public/admin/import', {csrfToken: req.csrfToken(),userEmail:crypto.decryption(req.session.backendUser.email_id)});
    } else {
        res.redirect('/admin/login');
    }
});

app.post('/admin/import', function (req, res) {
    if (req.session && req.session.backendUser) {

        var form = new formidable.IncomingForm();

        form.multiples = false;

        form.uploadDir = path.join(__dirname, '/uploads');

        form.on('file', function (field, file) {
            var ext = file.name.split('.').splice(-1)[0];
            if (ext === "xlsx") {
                var data = [];
                fs.rename(file.path, path.join(form.uploadDir, file.name));
                var workbook = XLSX.readFile(__dirname + '/uploads/' + file.name);
                var sheet_name_list = workbook.SheetNames;
                sheet_name_list.forEach(function (y) {
                    var worksheet = workbook.Sheets[y];
                    var headers = {};
                    for (z in worksheet) {
                        if (z[0] === '!') continue;
                        var tt = 0;
                        for (var i = 0; i < z.length; i++) {
                            if (!isNaN(z[i])) {
                                tt = i;
                                break;
                            }
                        }

                        var col = z.substring(0, tt);
                        var row = parseInt(z.substring(tt));
                        var value;

                        if(headers[col]==='DOJ'){
                            value=worksheet[z].w;
                        }else{
                            value=worksheet[z].v;
                        }




                        if (row === 1 && value) {
                            headers[col] = value;
                            continue;
                        }

                        if (!data[row]) data[row] = {};
                        data[row][headers[col]] = crypto.encryption(value);
                    }
                    data.shift();
                    data.shift();
                });

                DEMO.insertMany(data)
                    .then(function (docs) {
                        fs.unlink(__dirname + '/uploads/' + file.name);
                    })
                    .catch(function (err) {
                        fs.unlink(__dirname + '/uploads/' + file.name);
                    }); 
            }
            else {
                console.log('Not a xlsx File ! please upload xlsx file.');
            }
        });

        form.on('error', function (err) {
            res.send(err);
        });

        form.on('end', function () {
            res.redirect('/admin/dashboard');
        });

        form.parse(req);
    } else {
        res.redirect('/admin/login');
    }
});
//  End Import Data and Encryption Logic

// Start Export Data Concept and Decryptio Login
app.post('/admin/export', function (req, res) {
    if (req.session && req.session.backendUser) {
        var _cols = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', 'AA', 'AB', 'AC', 'AD', 'AE', 'AF', 'AG', 'AH', 'AI', 'AJ', 'AK', 'AL', 'AM', 'AN', 'AO', 'AP', 'AQ', 'AR', 'AS', 'AT', 'AU', 'AV', 'AW', 'AX', 'AY', 'AZ', 'BA', 'BB', 'BC', 'BD', 'BE', 'BF', 'BG', 'BH', 'BI', 'BJ', 'BK', 'BL', 'BM', 'BN', 'BO', 'BP', 'BQ', 'BR', 'BS', 'BT', 'BU'];

        DEMO.find({}, {
            _id: 0,
            __v: 0,
            Created_at: 0,
            Updated_Status:0,
            Updated_at:0,
            logs: 0,
            expire: 0,
            otp: 0
        }, function (err, data) {
            if (err) throw err;

            var workbook = XLSX.readFile(__dirname + '/template/export.xlsx');
            var ws = workbook.Sheets['Sheet1'];
            var rowLen = data.length + 2;
            var lastColsIndx = _cols.length - 1;

            ws['!ref'] = _cols[0] + '1:' + _cols[lastColsIndx] + rowLen;

            data.forEach(function (user, indx) {

                var _user = crypto.compileDecryption(user.toObject());
                var row = indx + 2;

                Object.keys(_user).forEach(function (key, index) {
                    var _cell = _cols[index] + row;

                    if (_user.hasOwnProperty(key)) {
                        var _value = _user[key];
                        if (!_value) {
                            _value = 0;
                        }

                        ws[_cell] = {t: isNaN(_value) ? 's' : 'n', v: _value, h: _value, w: _value};
                    }
                });
            });


            var wbbuf = XLSX.write(workbook, {type: 'base64'});
            var buffer = new Buffer(wbbuf, 'base64');
            res.writeHead(200, [['Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']]);
            res.end(buffer);


        });
    } else {
        res.redirect('/admin/login');
    }
});
// End :: Export Data Concept


// Start: Logout
app.get('/admin/logout', function (req, res) {
    req.session.backendUser=null;
    res.redirect('/admin/login');
});
// End: Logout

app.get('/*', function (req, res) {
    res.redirect('/');
});


//------------------------------------- End :: Backend Admin panel Code -------------------------------------

// ------------------------- Port Listen SSL Implementation --------------------------------------------------------
var privateKey  = fs.readFileSync(__dirname + 'public/certificates/example.key', 'utf8');
var certificate = fs.readFileSync(__dirname + 'public/certificates/star.example.in.crt', 'utf8');
var credentials = {key: privateKey, cert: certificate};

var server = https.createServer(credentials, app);
server.listen(port, function(){
    console.log('Express server listening to port '+port);
});

app.listen(port);
console.log("Server Start on given port:", port);
// ------------------------- Port Listen --------------------------------------------------------

// ##############################################################################################
// ####################################   END DEMO    ##########################################
// #################################### CHANDAN KUMAR  ##########################################
// ##############################################################################################
