const mongoose = require('mongoose');

//match_lesson_numbers
const lesson_numbers_schema = mongoose.Schema({
    code: Number,
    name: String,
    time: String
}, {
    collection: "match_lesson_numbers",
    versionKey: false
})
const lesson_numbers = mongoose.model('lesson_numbers', lesson_numbers_schema)

//match_lesson_types
const lesson_types_schema = mongoose.Schema({
    code: Number,
    name: String
}, {
    collection: "match_lesson_types",
    versionKey: false
})
const lesson_types = mongoose.model('lesson_types', lesson_types_schema)

//match_days_of_the_week
const days_of_the_week_schema = mongoose.Schema({
    code: Number,
    name: String
}, {
    collection: "  ",
    versionKey: false
})
const days_of_the_week = mongoose.model('days_of_the_week', days_of_the_week_schema)

//export
module.exports = {
    lesson_numbers: lesson_numbers,
    lesson_types: lesson_types,
    days_of_the_week: days_of_the_week
  }