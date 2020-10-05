const express = require("express");
const router_timetable = express.Router();
const timetable_schema = require('../models/timetable')
const homework_schema = require('../models/homework')
const router_timetable_teacher = require("./teachers")
const router_timetable_group = require("./groups")
const router_timetable_lesson = require("./lessons")
const mongoose = require('mongoose');
const err_list = require('../errors.js')
const verifyToken = require('./verifyTokens');
const verifyRoleAdmin = require('./verifyRole_admin');
//,verifyToken, verifyRoleAdmin,
async function CheckIfNewLessonWeeksIntersectsWithExist(lesson_new) {
    /******
     *  Обязательно наличие следующих ключей в lesson_new
     * {
     *   "weeks_arr": [1,2,3],
     *   "subgroups": 0,
     *   "group_id": "5eba8e602d3d2221ac83fc8d",
     *   "dweek": 4,
     *   "nlesson": 5
     *  }
     ******/
    return new Promise(async function (resolve, reject) {
        var lessons_by_subgroups = {
            "subgroup_0": [],
            "subgroup_1": [],
            "subgroup_2": [],
            "subgroups_12": []
        }
        var lessons_arr = await timetable_schema.timetable.find({ group_id: lesson_new.group_id, dweek: lesson_new.dweek, nlesson: lesson_new.nlesson })
        console.log(lessons_arr.length)
        for (let i = 0; i < lessons_arr.length; i++) {
            if (lessons_arr[i].subgroups == 0) { lessons_by_subgroups.subgroup_0.push(lessons_arr[i]) }
            else if (lessons_arr[i].subgroups == 1) { lessons_by_subgroups.subgroup_1.push(lessons_arr[i]); lessons_by_subgroups.subgroups_12.push(lessons_arr[i]); }
            else if (lessons_arr[i].subgroups == 2) { lessons_by_subgroups.subgroup_2.push(lessons_arr[i]); lessons_by_subgroups.subgroups_12.push(lessons_arr[i]); }
        }
        var weeks_intersecting = []
        if (lessons_by_subgroups.subgroup_0.length != 0) {
            for (let i = 0; i < lessons_by_subgroups.subgroup_0.length; i++) {
                lesson_from_db = lessons_by_subgroups.subgroup_0[i]
                var filtered = lesson_new.weeks_arr.filter(week => lesson_from_db.weeks_arr.includes(week))

                if (filtered.length != 0) {
                    weeks_intersecting = weeks_intersecting.concat(filtered)
                    console.log("Пересекаются номера недель:", filtered, "с расписанием без подгрупп", lesson_from_db.weeks_arr)
                }
            }
        }
        if (lessons_by_subgroups.subgroup_1.length != 0 && ([0, 1].includes(lesson_new.subgroups))) {
            for (let i = 0; i < lessons_by_subgroups.subgroup_1.length; i++) {
                lesson_from_db = lessons_by_subgroups.subgroup_1[i]
                var filtered = lesson_new.weeks_arr.filter(week => lesson_from_db.weeks_arr.includes(week))

                if (filtered.length != 0) {
                    weeks_intersecting = weeks_intersecting.concat(filtered)
                    console.log("Пересекаются номера недель:", filtered, "с расписанием подгруппы 1", lesson_from_db.weeks_arr)
                }
            }
        }
        if (lessons_by_subgroups.subgroup_2.length != 0 && ([0, 2].includes(lesson_new.subgroups))) {
            for (let i = 0; i < lessons_by_subgroups.subgroup_2.length; i++) {
                lesson_from_db = lessons_by_subgroups.subgroup_2[i]
                var filtered = lesson_new.weeks_arr.filter(week => lesson_from_db.weeks_arr.includes(week))

                if (filtered.length != 0) {
                    weeks_intersecting = weeks_intersecting.concat(filtered)
                    console.log("Пересекаются номера недель:", filtered, "с расписанием без подгруппы 2", lesson_from_db.weeks_arr)
                }
            }
        }
        console.log(weeks_intersecting)
        if (weeks_intersecting.length != 0) {
            let err_code = 41
            let err_text = err_list[err_code] + weeks_intersecting
            console.log(err_text)
            resolve({ "status": false, "err_code": err_code, "err_text": err_text })
            // resolve(false)
        }
        else {
            resolve({ "status": true })
            // resolve(true)
        }
    })

}

router_timetable.post('/all', async (req, res) => {
    var weeks = await timetable_schema.timetable.find({}).distinct('weeks_arr');
    var groups = await timetable_schema.group.find({})
    var teachers = await timetable_schema.teacher.find({})
    var result// = {"weeks": weeks, "groups":groups, "teachers": teachers}
    var data = req.body
    for (let i = 0; i < data.length; i++) {
        //result += await timetable_schema.teacher.find({_id: data[i]._id})
        result += teachers.filter(elem => elem._id == data[i]._id)
    }
    res.json(result)
});

router_timetable.use('/teachers', router_timetable_teacher);
router_timetable.use('/groups', router_timetable_group);
router_timetable.use('/lessons', router_timetable_lesson);

router_timetable.get('/weeks', async (req, res) => {
    try {
        const data = await timetable_schema.timetable.find({}).distinct('weeks_arr');
        res.json(data);
    } catch (err) {
        res.json({ message: err });
    }
});

router_timetable.get('/', async (req, res) => {
    const flag_group = req.query.hasOwnProperty('group')
    const flag_week = req.query.hasOwnProperty('week')
    const flag_teacher = req.query.hasOwnProperty('teacher')
    var data, find, groupname
    var output = { text: 'sometext' }
    try {
        if (flag_group && flag_week && flag_teacher) {
            output.text = "group + week + teacher"
            find = { "group_id": req.query.group, "weeks_arr": parseInt(req.query.week), "teacher_id": req.query.teacher }
            // groupname = (await timetable_schema.group.findOne({ _id: req.query.group })).name
        }
        else if (flag_group && flag_week) {
            output.text = "group + week"
            find = { "group_id": req.query.group, "weeks_arr": parseInt(req.query.week) }
            // groupname = (await timetable_schema.group.findOne({ _id: req.query.group })).name
        }
        else if (flag_week && flag_teacher) {
            output.text = "teacher + week"
            find = { "weeks_arr": parseInt(req.query.week), "teacher_id": req.query.teacher }
        }
        /*else if (flag_group && flag_teacher)
        {
            output.text = "group + teacher"
            var find = {"group":req.query.group,"fio_full":req.query.teacher}
        }*/
        else {
            let err_code = 11
            let err_text = err_list[err_code]
            return res.status(400).json({ "status": false, "err_code": err_code, "err_text": err_text, "request": req.query })
        }
    } catch (err) {
        let err_code = 99
        let err_text = err_list[err_code]
        res.status(400).json({ "status": false, "err_code": err_code, "err_text": err_text, "message": err })
    }
    try {
        var groups_arr = await timetable_schema.group.find({})
        var teachers_arr = await timetable_schema.teacher.find({})
        var lessons_arr = await timetable_schema.lesson.find({})
        data = await timetable_schema.timetable.find(find).lean();

        // making empty struct
        var lessons = new Object()
        for (var i = 1; i < 7; i++) {
            lessons[i] = {}
            for (var j = 1; j < 7; j++) {
                lessons[i][j] = { "isexist": false, "subgroups": false, "lessons": {} }
            }
        }

        async function getOne_lesson(id) {
            var found
            var filter = lessons_arr.filter(elem => elem._id == id)
            if (filter.length == 0) {
                found = await timetable_schema.lesson.findOne({ _id: id }, { name: 1 })
                //lesson_cache.push(found)
                return found.name
            }
            else {
                return filter[0].name
            }
        }
        async function getOne_teacher(id) {
            var found
            var filter = teachers_arr.filter(elem => elem._id == id)
            if (filter.length == 0) {
                found = await timetable_schema.teacher.findOne({ _id: id }, { name: 1 })
                //teacher_cache.push(found)
                console.log("ADDED", found.name)
                return found.name
            }
            else {
                console.log("FOUND", filter[0].name)
                return filter[0].name

            }
        }
        async function getOne_group(id) {
            var found
            var filter = groups_arr.filter(elem => elem._id == id)
            if (filter.length == 0) {
                found = await timetable_schema.group.findOne({ _id: id }, { name: 1 })
                //lesson_cache.push(found)
                return found.name
            }
            else {
                return filter[0].name
            }
        }
        
        for (let i = 0; i < data.length; i++) {
            //data.forEach(function (item, i, data) {
            var item = data[i]

            if (item.subgroups >= 0 && item.subgroups <= 2) {
                item.group = await getOne_group(item.group_id)
                item.lesson = await getOne_lesson(item.lesson_id)
                //console.log("MAIN", item.lesson)
                item.teacher = await getOne_teacher(item.teacher_id)
                //console.log("MAIN", item.teacher)
            }

            if (item.subgroups == 0) {
                lessons[item.dweek][item.nlesson].isexist = true
                lessons[item.dweek][item.nlesson].lessons.lesson = item
            }
            if (item.subgroups == 1) {
                lessons[item.dweek][item.nlesson].isexist = true
                lessons[item.dweek][item.nlesson].subgroups = true
                lessons[item.dweek][item.nlesson].lessons.subgroup1 = item
            }
            if (item.subgroups == 2) {
                lessons[item.dweek][item.nlesson].isexist = true
                lessons[item.dweek][item.nlesson].subgroups = true
                lessons[item.dweek][item.nlesson].lessons.subgroup2 = item
            }
        };
        res.status(200).json({ "status": true, lessons })
    } catch (err) {
        let err_code = 99
        let err_text = err_list[err_code]
        res.status(400).json({ "status": false, "err_code": err_code, "err_text": err_text, "message": err })
    }
});

router_timetable.delete('/',verifyToken, verifyRoleAdmin, async (req, res) => {
    flag_id = req.body.hasOwnProperty('_id')
    if (Array.isArray(req.body)) {
        let err_code = 15
        let err_text = err_list[err_code]
        return res.status(400).json({ "status": false, "err_code": err_code, "err_text": err_text, "request": req.body })
    }
    else if (!flag_id) {
        let err_code = 11
        let err_text = err_list[err_code]
        return res.status(400).json({ "status": false, "err_code": err_code, "err_text": err_text, "request": req.body })
    }
    else {
        try {
            await timetable_schema.timetable.findOneAndRemove({ _id: req.body._id })
            res.status(200).json({ "status": true })
        }
        catch (err) {
            let err_code = 99
            let err_text = err_list[err_code]
            return res.status(400).json({ "status": false, "err_code": err_code, "err_text": err_text, "message": err })
        }
    }
});

router_timetable.post('/',verifyToken, verifyRoleAdmin, async (req, res) => {

    var params = ["group_id", "lesson_id", "teacher_id", "weeks_str", "dweek", "nlesson", "subgroups", "lesson_type", "room"]
    var flag_params = true
    for (let i = 0; i < params.length; i++) {
        var param = params[i]
        if (!(req.body.hasOwnProperty(param))) {
            flag_params = false
        }
    }
    if (Array.isArray(req.body)) {
        let err_code = 15
        let err_text = err_list[err_code]
        return res.status(400).json({ "status": false, "err_code": err_code, "err_text": err_text, "request": req.body })
    }
    else if (!flag_params) {
        let err_code = 11
        let err_text = err_list[err_code]
        return res.status(400).json({ "status": false, "err_code": err_code, "err_text": err_text, "request": req.body })
    }

    var timetable = new timetable_schema.timetable
    var homework = new homework_schema.homework
    // find group
    var groupExist = await timetable_schema.group.findOne({ _id: req.body.group_id })
    if (!groupExist) {
        // ГРУППА НЕ НАЙДЕНА
        let err_code = 14
        let err_text = err_list[err_code] + "group_id = " + req.body.group_id
        return res.status(400).json({ "status": false, "err_code": err_code, "err_text": err_text, "request": req.body })
    }
    // find lesson
    var lessonExist = await timetable_schema.lesson.findOne({ _id: req.body.lesson_id })
    if (!lessonExist) {
        // ПРЕДМЕТ НЕ НАЙДЕН
        let err_code = 14
        let err_text = err_list[err_code] + "lesson_id = " + req.body.lesson_id
        return res.status(400).json({ "status": false, "err_code": err_code, "err_text": err_text, "request": req.body })
    }
    // find teacher
    var teacherExist = await timetable_schema.teacher.findOne({ _id: req.body.teacher_id })
    if (!teacherExist) {
        // ПРЕПОД НЕ НАЙДЕН
        let err_code = 14
        let err_text = err_list[err_code] + "teacher_id = " + req.body.teacher_id
        return res.status(400).json({ "status": false, "err_code": err_code, "err_text": err_text, "request": req.body })
    }

    // make weeks_arr
    var weeks_arr = []
    let weeks_split = req.body.weeks_str.split(",")
    weeks_split.forEach(weeks_elem => {
        let element_splitted = weeks_elem.split("-")
        if (element_splitted.length == 1) {
            let el = parseInt(element_splitted[0].trim());
            weeks_arr.push(el)
        }
        else {
            let min = parseInt(element_splitted[0].trim());
            let max = parseInt(element_splitted[1].trim());
            for (let i = min; i <= max; i++) { weeks_arr.push(i) }
        }
    });

    var lesson_new = {
        "group_id": req.body.group_id,
        "lesson_id": req.body.lesson_id,
        "teacher_id": req.body.teacher_id,
        "weeks_str": req.body.weeks_str,
        "weeks_arr": weeks_arr,
        "dweek": req.body.dweek,
        "nlesson": req.body.nlesson,
        "subgroups": req.body.subgroups,
        "lesson_type": req.body.lesson_type,
        "room": req.body.room
    }
    var CheckResult = await CheckIfNewLessonWeeksIntersectsWithExist(lesson_new)
    if (CheckResult.status == false) {
        return res.status(400).json(CheckResult)
    }
    // timetable = lesson_new
    timetable.group_id = req.body.group_id
    timetable.lesson_id = req.body.lesson_id
    timetable.teacher_id = req.body.teacher_id
    timetable.weeks_str = req.body.weeks_str
    timetable.weeks_arr = weeks_arr
    timetable.dweek = req.body.dweek
    timetable.nlesson = req.body.nlesson
    timetable.subgroups = req.body.subgroups
    timetable.lesson_type = req.body.lesson_type
    timetable.room = req.body.room
    try {
        const saved_lesson = await timetable.save();
        console.log(saved_lesson)

        const whocanchange_single = {
            teacher_id: new mongoose.Types.ObjectId(timetable.teacher_id),
            timetable_id: new mongoose.Types.ObjectId(saved_lesson._id)
        }
        var homeworkExist = await homework_schema.homework.findOne({ group_id: timetable.group_id, lesson_id: timetable.lesson_id })
        if (homeworkExist) {
            homeworkExist.whocanchange.push(whocanchange_single)
            await homeworkExist.save()
        }
        else {
            homework.group_id = timetable.group_id
            homework.lesson_id = timetable.lesson_id
            homework.whocanchange = [whocanchange_single]
            await homework.save()
        }
        console.log(homework)
        res.status(200).json({ "status": true })
    }
    catch (err) {
        let err_code = 99
        let err_text = err_list[err_code]
        res.status(400).json({ "status": false, "err_code": err_code, "err_text": err_text, "message": err })
    }
});

// Используется из файла
// router_timetable.post('/lesson', async (req, res) => {
//     //console.log(req.body)
//     const timetable = new timetable_schema.timetable
//     const homework = new homework_schema.homework
//     // find group
//     //var groupExist = await timetable_schema.group.findOne({ name: { $regex: "^" + req.body.group + "$", $options: 'i' } })
//     var groupExist = await timetable_schema.group.findOne({ name: req.body.group })
//     if (groupExist) {
//         console.log("group exist:", groupExist)
//     }
//     else {
//         var group = new timetable_schema.group
//         group.name = req.body.group
//         try { groupExist = await group.save() }
//         catch (err) { console.log(err) }
//     }
//     timetable.group_id = groupExist._id
//     // find lesson
//     //var lessonExist = await timetable_schema.lesson.findOne({ name: { $regex: "^" + req.body.lesson + "$", $options: 'i' } })
//     var lessonExist = await timetable_schema.lesson.findOne({ name: req.body.lesson })
//     if (lessonExist) {
//         console.log("lesson exist:", lessonExist)
//     }
//     else {
//         var lesson = new timetable_schema.lesson
//         lesson.name = req.body.lesson
//         try { lessonExist = await lesson.save() }
//         catch (err) { console.log(err) }
//     }
//     timetable.lesson_id = lessonExist._id
//     // find teacher
//     //var teacherExist = await timetable_schema.teacher.findOne({ name: { $regex: "^" + req.body.teacher + "$", $options: 'i' } })
//     var teacherExist = await timetable_schema.teacher.findOne({ name: req.body.teacher })
//     if (teacherExist) {
//         console.log("teacher exist:", teacherExist)
//     }
//     else {
//         var teacher = new timetable_schema.teacher
//         teacher.name = req.body.teacher
//         try { teacherExist = await teacher.save() }
//         catch (err) { console.log(err) }
//     }
//     timetable.teacher_id = teacherExist._id
//     // make weeks_arr
//     const weeks_str = req.body.weeks_str
//     var weeks_arr = []
//     let weeks_split = weeks_str.split(",")
//     weeks_split.forEach(weeks_elem => {
//         let element_splitted = weeks_elem.split("-")
//         if (element_splitted.length == 1) {
//             let el = parseInt(element_splitted[0].trim());
//             weeks_arr.push(el)
//         }
//         else {
//             let min = parseInt(element_splitted[0].trim());
//             let max = parseInt(element_splitted[1].trim());
//             for (let i = min; i <= max; i++) { weeks_arr.push(i) }
//         }
//     });

//     timetable.weeks_str = weeks_str;
//     timetable.weeks_arr = weeks_arr
//     timetable.dweek = req.body.dweek
//     timetable.nlesson = req.body.nlesson
//     timetable.subgroups = req.body.subgroups
//     timetable.lesson_type = req.body.lesson_type
//     timetable.room = req.body.room
//     const saved_lesson = await timetable.save();
//     console.log(saved_lesson)

//     const whocanchange_single = {
//         teacher_id: new mongoose.Types.ObjectId(timetable.teacher_id),
//         timetable_id: new mongoose.Types.ObjectId(saved_lesson._id)
//     }
//     var homeworkExist = await homework_schema.homework.findOne({ group_id: timetable.group_id, lesson_id: timetable.lesson_id })
//     if (homeworkExist) {
//         homeworkExist.whocanchange.push(whocanchange_single)
//         await homeworkExist.save()
//     }
//     else {
//         homework.group_id = timetable.group_id
//         homework.lesson_id = timetable.lesson_id
//         homework.whocanchange = [whocanchange_single]
//         await homework.save()
//     }
//     console.log(homework)
//     //console.log(timetable)
//     res.status(200).send("maybeOK")
// });

/*
router_timetable.get('/group', async (req, res) => {
    console.log(req.query)
    timetable_schema.group.findById(req.query.id).lean().exec(function (err, results) {
        if (err) return console.error(err)
        console.log(results)
        res.send(results)
    })       
})*/

/*
router_timetable.post('/', async (req, res) => {
    const lesson = new timetable_schema.timetable({
        group: req.body.group,
        dweek: req.body.dweek,
        nlesson: req.body.nlesson,
        subgroups: req.body.subgroups,
        weeks_str: req.body.weeks_str,
        weeks_arr: req.body.weeks_arr,
        lesson_name: req.body.lesson_name,
        lesson_type: req.body.lesson_type,
        fio_full: req.body.fio_full,
        room: req.body.room
    });
    try {
        const saved_lesson = await lesson.save();
        res.json(saved_lesson);
    } catch (err) {
        res.json({ message: err });
    }
});*/

module.exports = router_timetable;
