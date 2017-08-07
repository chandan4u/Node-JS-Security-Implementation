var flexiUserModel = require('../model/flexiUser');
var crypto = require('../services/crypto.service');
var md5 = require("blueimp-md5");

var _registration = function(req, resp){
        var flexiUser = new flexiUserModel({
            name: crypto.encryption(req.body.name),
            email_id: crypto.encryption(req.body.email),
            sap_id: crypto.encryption(req.body.sapid),
            password: crypto.encryption(req.body.password),
            status: true
        });
        flexiUser.save(function (err, user) {
        	if (err) throw err;
      		resp.redirect('/admin/login');
        });
};

var _authentication = function(req, resp){
        var _passwordMD5 = md5(req.body.password);
		flexiUserModel.findOne({email_id: crypto.encryption(req.body.email), password: _passwordMD5}, function(err, user){
		if(user){
			req.session.backendUser = {
                email_id: user.toObject().email_id,
                sap_id: user.toObject().sap_id
            };
            resp.redirect('/admin/dashboard');
        }else {
        	resp.redirect('/admin/login');
        }

		});
};

module.exports = {
    registration: _registration,
    auth: _authentication
};