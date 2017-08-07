var fs = require("fs");
var postmark = require("postmark");
var config = require("../config");
var ejs = require('ejs');
var CryptoServices = require('./crypto.service');
var client = new postmark.Client(config.postmark.secret);


var _sendEmail = function (mailOptions, cb) {
    cb = cb || function () {
        };
    var _mailOptions = {
        from: config.postmark.sender,
        to: 'hr.tech@timesinternet.in',
        // to: mailOptions.to,
        subject: mailOptions.subject || '',
        textBody: mailOptions.text || '',
        htmlBody: mailOptions.html || '',
        attachments: mailOptions.attachments || []
    };

    client.sendEmail(_mailOptions, function (err, resp) {
        if (err) {
            cb(err);
        } else {
            cb(null, resp);
        }
    });
};

var _sendOtp = function (_user, cb) {
    cb = cb || function () {
        };

    var _htmlStr = '';
    ejs.renderFile(__basedir + '/public/otp-password.ejs', {
        user: {
            password: _user.otp,
            username: CryptoServices.decryption(_user.Name),
        }
    }, function (err, str) {
        if (err) {
            cb(err);
            throw err;
        }
        _htmlStr = str;
    });

    var _mailOptions = {
        to: CryptoServices.decryption(_user.Email_Id),
        subject: 'Welcome to FlexiTool',
        html: _htmlStr,
        attachments: [{
            "Content": fs.readFileSync(__basedir + '/public/assets/images/flexi.png').toString('base64'),
            "ContentId": "cid:flexi.png",
            "Name": 'short.png',
            "ContentType": 'png'
        }, {
            "Content": fs.readFileSync(__basedir + '/public/assets/images/header.jpg').toString('base64'),
            "ContentId": "cid:header.jpg",
            "Name": 'location.png',
            "ContentType": 'png'
        }]
    };
    _sendEmail(_mailOptions, cb);
};

var _sendSalaryStructure = function (data, cb) {
    cb = cb || function () {
        };

        var _htmlStr = '';
        ejs.renderFile(__basedir + '/public/salary-structure.ejs', {
            user: {
                username: data.username,
            }
        }, function (err, str) {
            if (err) {
                cb(err);
                throw err;
            }
            _htmlStr = str;
        });

        var _mailOptions = {
            to: data.email,
            subject: 'FlexiTool: Salary Structure',
            html: _htmlStr,
            attachments: [{
                "Content": fs.readFileSync(data.pdfPath).toString('base64'),
                "Name": data.pdfName,
                "ContentType": 'pdf'
            },{
            "Content": fs.readFileSync(__basedir + '/public/assets/images/flexi.png').toString('base64'),
            "ContentId": "cid:flexi.png",
            "Name": 'short.png',
            "ContentType": 'png'
            }, {
            "Content": fs.readFileSync(__basedir + '/public/assets/images/header.jpg').toString('base64'),
            "ContentId": "cid:header.jpg",
            "Name": 'location.png',
            "ContentType": 'png'
            }]
        };
        _sendEmail(_mailOptions, cb);

};

module.exports = {
    sendOtp: _sendOtp,
    sendSalaryStructure: _sendSalaryStructure
};
