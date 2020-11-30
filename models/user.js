var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var passportLocalMongoose = require('passport-local-mongoose');

const User = Schema({
    firstname: {
        type: String,
        default: ''
      },
    lastname: {
        type: String,
        default: ''
      },
    email: {
        type: String,
        required: true,
        unique: true
    },
    admin:   {
        type: Boolean,
        default: false
    }
});

User.plugin(passportLocalMongoose);

module.exports = mongoose.model('User', User);