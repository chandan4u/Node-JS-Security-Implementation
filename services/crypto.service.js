var crypto = require("crypto");

// ################ Encryption Decryption START ######################################

var _encryption = function (getRequest) {
    var algorithm = 'aes256';
    var key = 'flexi9211';
    var text = getRequest.toString();
    var cipher = crypto.createCipher(algorithm, key);
    var encrypted = cipher.update(text, 'utf8', 'hex') + cipher.final('hex');
    return encrypted
};

var _decryption = function (getRequest) {
    var algorithm = 'aes256';
    var key = 'flexi9211';
    var decipher = crypto.createDecipher(algorithm, key);
    var decrypted = decipher.update(getRequest, 'hex', 'utf8') + decipher.final('utf8');
    return decrypted;
};

var _compileDecryption = function (getRequest) {
    var obj = {};
    var byPassKeys = ['_id', '__v', 'otp', 'expire', 'Created_at', 'logs','Updated_at','Updated_Status'];

    Object.keys(getRequest).forEach(function (key) {
        if (byPassKeys.indexOf(key) === -1) {
            obj[key] = _decryption(getRequest[key]);
        } else {
            obj[key] = getRequest[key];
        }

        if (!isNaN(obj[key])) {
            obj[key] = +obj[key];
        }
    });

    return JSON.parse(JSON.stringify(obj));
};

// ################ Encryption Decryption END #########################################


module.exports = {
    encryption: _encryption,
    decryption: _decryption,
    compileDecryption: _compileDecryption
};
