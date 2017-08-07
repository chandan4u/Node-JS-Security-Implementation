var mongoose = require('mongoose');
var Schema = mongoose.Schema;
module.exports = mongoose.model('FlexiUser', new Schema({
	name: {type: String, required: true, trim: true },
    key_id: {type: String, required: true, trim: true },
    email_id: {type: String, required: true, trim: true },
    password: {type: String, required: true, trim: true },
    role: {type: String, required: true, trim: true, default: 'ADMIN'},
    status: {type: Boolean, required: true, trim: true },
    created_at: {type: Date, required: true, default: +(new Date())}
	}));