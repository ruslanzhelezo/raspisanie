const mongoose = require('mongoose');


const users_schema = mongoose.Schema({
    login: String,
    password: String,
    role: Number,
    name: String,
    teacher_id: String,
    todelete: {
        type: Boolean,
        default: false
    }
}, {
    collection: "accounts",
    versionKey: false
})
const user = mongoose.model('user', users_schema)

//export
module.exports = {
    user: user
}