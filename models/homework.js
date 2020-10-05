const mongoose = require('mongoose');

const homework_schema = mongoose.Schema({
    group_id: String,
    lesson_id: String,
    homework: [{
        created_at: Number,
        creator: String,
        edited_at: Number,
        editor: String,
        text: String,
        todelete: {
            type: Boolean,
            default: false
        },
        urls: [{
            url: String,
            name: String,
            icon: String
        }]
    }],
    whocanchange: [{
        teacher_id: String,
        timetable_id: String
    }]
}, {
    collection: "homework",
    versionKey: false
})
const homework = mongoose.model('homework', homework_schema)

module.exports = {
    homework: homework
}