var FlexiModel = require('../model/flexi');
var MailerService = require('../services/mailer.service');
var CryptoServices = require('../services/crypto.service');
var moment = require('moment');


var _getOtp = function (req, resp) {

    //var _otp = Math.random().toString(36).slice(-6);
    var _otp = '123';//TODO: it is only for testing.Please remove this line and uncomment above after testing.

    if (!req.body.email) {
        req.session.frontendUser = null;
        resp.render(__basedir + '/public/login', {
            status: false,
            message: 'Please make sure that you have entered a valid email.'
        });
        return;
    }

    FlexiModel.findOne({Email_Id: CryptoServices.encryption(req.body.email)}, function (err, user) {
        if (err) {
            req.session.frontendUser = null;
            resp.render(__basedir + '/public/login', {
                status: false,
                message: 'Somthing went wrong, Please try again.'
            });
        } else if (!user) {
            req.session.frontendUser = null;
            resp.render(__basedir + '/public/login', {
                status: false,
                message: 'Please make sure that you are logging-in with your official demo id .'
            });
        } else {
            user.otp = _otp;
            user.expire = moment().add(3, 'm').format('x');
            user.save(function (err) {
                if (err) {
                    req.session.frontendUser = null;
                    resp.render(__basedir + '/public/login', {
                        status: false,
                        message: 'Somthing went wrong, Please try again.'
                    });
                } else {
                    MailerService.sendOtp(user.toObject());
                    req.session.frontendUser = {
                        email: CryptoServices.decryption(user.toObject().Email_Id),
                        otp_expire: user.toObject().expire
                    };
                    resp.redirect('/otp');
                }
            });
        }
    });

};

var _resendOtp = function (req, resp) {

    if (req.session && req.session.frontendUser && req.session.frontendUser.email && req.session.frontendUser.user) {
        resp.redirect('/home');
        return;
    }

    if (!req.session || !req.session.frontendUser) {
        resp.redirect('/');
        return;
    }

    var _otp = Math.random().toString(36).slice(-6);

    if (!req.session.frontendUser.email) {
        req.session.frontendUser = null;
        resp.render(__basedir + '/public/otp', {
            status: false,
            email: '',
            expire: '',
            otpexpired: false,
            message: 'Please make sure that you have entered a valid email.'
        });
        return;
    }

    FlexiModel.findOne({Email_Id: CryptoServices.encryption(req.session.frontendUser.email)}, function (err, user) {
        if (err) {
            req.session.frontendUser = null;
            resp.render(__basedir + '/public/otp', {
                status: false,
                otpexpired: false,
                expire: '',
                email: '',
                message: 'Somthing went wrong, Please try again.'
            });
        } else if (!user) {
            var _email = req.session.frontendUser.email;
            req.session.frontendUser = null;
            resp.render(__basedir + '/public/otp', {
                status: false,
                email: _email,
                otpexpired: false,
                expire: '',
                message: 'Please make sure that you are logging-in with your official demo id .'
            });
        } else {
            user.otp = _otp;
            user.expire = moment().add(3, 'm').format('x');
            user.save(function (err) {
                if (err) {
                    var _email = req.session.frontendUser.email;
                    req.session.frontendUser = null;
                    resp.render(__basedir + '/public/otp', {
                        status: false,
                        email: _email,
                        otpexpired: false,
                        expire: '',
                        message: 'Somthing went wrong, Please try again.'
                    });
                } else {
                    MailerService.sendOtp(user.toObject());
                    req.session.frontendUser={
                        email : CryptoServices.decryption(user.toObject().Email_Id),
                        otp_expire : user.toObject().expire
                    };
                    resp.redirect('/otp');
                }
            });
        }
    });

};

var _verifyOtp = function (req, resp) {

    if (!req.body.email) {
        resp.render(__basedir + '/public/otp', {
            status: false,
            otpexpired: false,
            expire: '',
            email: '',
            message: 'Please make sure that you have entered a valid email.'
        });
        return;
    }

    if (!req.body.otp) {
        resp.render(__basedir + '/public/otp', {
            status: false,
            email: req.body.email,
            expire: req.session.frontendUser.otp_expire,
            otpexpired: false,
            message: 'Please make sure that you have entered a valid RTP.'
        });
        return;
    }

    FlexiModel.findOne({Email_Id: CryptoServices.encryption(req.body.email)}, function (err, user) {
        if (err) {
            resp.render(__basedir + '/public/otp', {
                status: false,
                email: req.body.email,
                otpexpired: false,
                expire: req.session.frontendUser.otp_expire,
                message: 'Somthing went wrong, Please try again.'
            });
        } else if (!user) {
            resp.render(__basedir + '/public/otp', {
                status: false,
                email: req.body.email,
                otpexpired: false,
                expire: '',
                message: 'Please make sure that you are logging-in with your official demo id .'
            });
        } else if (req.body.otp && user.toObject().otp !== req.body.otp) {
            resp.render(__basedir + '/public/otp', {
                status: false,
                email: req.body.email,
                expire: req.session.frontendUser.otp_expire,
                otpexpired: false,
                message: 'You have entered an invalid RTP.'
            });
        } else if (moment().isAfter(moment(user.toObject().expire))) {
            resp.render(__basedir + '/public/otp', {
                status: false,
                email: req.body.email,
                expire: req.session.frontendUser.otp_expire,
                otpexpired: true,
                message: 'RTP expired.'
            });
        } else {
            req.session.frontendUser.user = {
                email: user.toObject().Email_Id,
                sap_id: user.toObject().Sap_Id
            };

            resp.redirect('/home');
        }
    });

};


module.exports = {
    getOtp: _getOtp,
    verifyOtp: _verifyOtp,
    resendOtp: _resendOtp
};
