const express = require("express");
const router_test = express.Router();
const timetable_schema = require('../models/timetable')
const err_list = require('../errors.js')

function Unique(value, index, self) {
    return self.indexOf(value) === index;
}
function hasDuplicates(array) {
    return (new Set(array)).size !== array.length;
}


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

router_test.get('/weeks', async (req, res) => {
    var lesson_new = {
        "weeks_arr": [18, 19, 20, 30],
        "subgroups": 2,
        "group_id": "5eba8e602d3d2221ac83fc8d",
        "dweek": 4,
        "nlesson": 3
    }
    var flag_params = true
    var params = ["group_id", "lesson_id", "teacher_id", "weeks_arr", "weeks_str", "dweek", "nlesson", "subgroups", "lesson_type", "room"]
    for (let i = 0; i < params.length; i++) {
        var param = params[i]
        if (!(req.body.hasOwnProperty(param))) {
            flag_params = false
        }
    }
    if (Array.isArray(req.body)) {
        let err_code = 15
        let err_text = err_list[err_code]
        res.status(400).json({ "status": false, "err_code": err_code, "err_text": err_text, "request": req.body })
    }
    else if (!flag_id) {
        let err_code = 11
        let err_text = err_list[err_code]
        res.status(400).json({ "status": false, "err_code": err_code, "err_text": err_text, "request": req.body })
    }


    CheckResult = await CheckIfNewLessonWeeksIntersectsWithExist(lesson_new)
    if (CheckResult.status == false) {
        return res.status(200).json(CheckResult)
    }
    return res.status(200).json(CheckResult)




});


router_test.get('/check_all', async (req, res) => {
    var weeks = req.body.weeks_arr
    var subgroup = req.body.subgroup

    var lessons_all = await timetable_schema.timetable.find({})
    var groups = await timetable_schema.group.find({})

    for (let i = 0; i < groups.length; i++) {
        group_id = groups[i]._id
        for (let dweek = 1; dweek <= 6; dweek++) {
            for (let nlesson = 1; nlesson <= 5; nlesson++) {
                var weeks_subgrp0 = []
                var weeks_subgrp1 = []
                var weeks_subgrp2 = []
                var weeks_subgrps12 = []
                var lessons_dweek_nlesson = lessons_all.filter(lesson => (lesson.group_id == group_id && lesson.dweek == dweek && lesson.nlesson == nlesson))
                //console.log(group_id, "dw:"+dweek, "nl:"+nlesson, "length:"+lessons_dweek_nlesson.length)
                if (lessons_dweek_nlesson.length != 0) {
                    for (let j = 0; j < lessons_dweek_nlesson.length; j++) {
                        if (lessons_dweek_nlesson[j].subgroups == 0) weeks_subgrp0 = weeks_subgrp0.concat(lessons_dweek_nlesson[j].weeks_arr)
                        else if (lessons_dweek_nlesson[j].subgroups == 1) weeks_subgrp1 = weeks_subgrp1.concat(lessons_dweek_nlesson[j].weeks_arr)
                        else if (lessons_dweek_nlesson[j].subgroups == 2) weeks_subgrp2 = weeks_subgrp2.concat(lessons_dweek_nlesson[j].weeks_arr)
                    }
                    flag_weeks_subgrp0 = !hasDuplicates(weeks_subgrp0)
                    flag_weeks_subgrp1 = !hasDuplicates(weeks_subgrp1)
                    flag_weeks_subgrp2 = !hasDuplicates(weeks_subgrp2)

                    weeks_subgrps12 = weeks_subgrp1.concat(weeks_subgrp2).filter(Unique).sort()
                    if (flag_weeks_subgrp0 && flag_weeks_subgrp1 && flag_weeks_subgrp2) {
                        //console.log("норм")
                    }
                    else {
                        console.log(group_id, "dw:" + dweek, "nl:" + nlesson, "length:" + lessons_dweek_nlesson.length)
                        console.log("что-то не так", weeks_subgrp0, weeks_subgrp1, weeks_subgrp2)
                    }
                    var flag_weeks_cross = false
                    for (let j = 0; j < weeks_subgrp0.length; j++) {
                        if (weeks_subgrps12.includes(weeks_subgrp0[j])) {
                            flag_weeks_cross = true
                        }
                    }
                    if (flag_weeks_cross) {
                        console.log("массивы пересекаются", group_id, "dw:" + dweek, "nl:" + nlesson, weeks_subgrp0, weeks_subgrp1, weeks_subgrp2)
                    }

                }
            }
        }

    }
    return res.status(200).json({ "ok": "ok" })

});

router_test.get('/date', async (req, res) => {
    var date_unix = Date.now()
    var a = new Date(date_unix)
    var months = ['01','02','03','04','05','06','07','08','09','10','11','12'];
    var year = a.getFullYear();
    var month = months[a.getMonth()];
    var date = a.getDate();
    var hour = a.getHours();
    var min = a.getMinutes();
    var sec = a.getSeconds();
    var date_human = date + '.' + month + '.' + year + ' ' + hour + ':' + min + ':' + sec ;

    console.log(date_human);

    res.json({ "date": date_unix, "frmt": date_human })

});
module.exports = router_test;