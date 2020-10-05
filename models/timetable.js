const mongoose = require('mongoose');

//match_lesson_numbers
const timetable_schema = mongoose.Schema({
    group_id: String,
    dweek: Number,
    nlesson: Number,
    subgroups: Number,
    weeks_str: String,
    weeks_arr: [Number],
    lesson_id: String,
    lesson_type: Number,
    teacher_id: String,
    room: String
}, {
    collection: "timetable",
    versionKey: false
})
const timetable = mongoose.model('timetable', timetable_schema)

//groups
const groups_schema = mongoose.Schema({
    name: { type : String , unique : true, required : true, dropDups: true },
    todelete: {
        type: Boolean,
        default: false
    }
}, {
    collection: "groups",
    versionKey: false
})
const group = mongoose.model('groups', groups_schema)

//lessons
const lessons_schema = mongoose.Schema({
    name: { type : String , unique : true, required : true, dropDups: true },
    todelete: {
        type: Boolean,
        default: false
    }
}, {
    collection: "lessons",
    versionKey: false
})
const lesson = mongoose.model('lessons', lessons_schema)

//teachers
const teachers_schema = mongoose.Schema({
    name_imported: String,
    name: String,
    todelete: {
        type: Boolean,
        default: false
    }
}, {
    collection: "teachers",
    versionKey: false
})
const teacher = mongoose.model('teachers', teachers_schema)

module.exports = {
    timetable: timetable,
    group: group,
    lesson: lesson,
    teacher: teacher    
}