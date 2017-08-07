var MailerService = require("./mailer.service");
var htmlToPdf = require('html-to-pdf');
// var pdf = require('html-pdf');
var ejs = require('ejs');
var moment = require('moment');

var _generatePdf = function (data, cb) {

    var pdfName = __basedir + '/uploads/salary_structure/' + data.Sap_Id + '_salary.pdf';
    var _htmlStr = '';
    ejs.renderFile(__basedir + '/public/flexi-pdf.ejs', {data:data, moment:moment}, function (err, str) {
        if (err) {
            cb(err);
            return;
        }
        _htmlStr = str;
    });
    if (!_htmlStr) {
        return;
    }

    htmlToPdf.convertHTMLString(_htmlStr, pdfName,
        function (err) {
            if (err) {
                cb(err);
                return;
            }
            var _data = {
                username: data.Name,
                email: data.Email_Id,
                pdfName: pdfName.split('/').slice(-1)[0],
                pdfPath: pdfName
            };

            MailerService.sendSalaryStructure(_data, function (err) {
                if (err) {
                    cb(err);
                    return;
                }
                cb(null,_data); 
            });
        }
    );
};

module.exports = {
    generatePdf: _generatePdf
};
