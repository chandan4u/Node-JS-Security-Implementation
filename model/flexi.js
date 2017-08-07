var mongoose = require('mongoose');

var flexiSchema = new mongoose.Schema({
    Name: {type: String, required: true, trim: true },
    Key_id: {type: String, required: true, trim: true },
    Email_Id: {type: String, required: true, trim: true },
    logs:[],
    otp: {type: String, trim: true},
    expire: {type: Date},
    Updated_Status: {type: String, required: true, default: 'FALSE'},
    Updated_at: {type: Date, required: true, default: +(new Date())},
    Created_at: {type: Date, required: true, default: +(new Date())}
});

var FlexiModel = mongoose.model('Flexi', flexiSchema);

module.exports = FlexiModel;