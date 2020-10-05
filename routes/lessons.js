const express = require("express");
const router_timetable_lesson = express.Router();
const timetable_schema = require('../models/timetable')
const err_list = require('../errors.js')
const verifyToken = require('./verifyTokens');
const verifyRoleAdmin = require('./verifyRole_admin');
// ВКЛЮЧИТЬ ВСЕХ (РАБОТАЕТ)
// router_timetable_lesson.post('/enable_all', async (req, res) => {

//     const data = await timetable_schema.lesson.find({})
//     var flag = true
//     var promises = []
//     for (let i = 0; i < data.length; i++) {
//         promises.push(timetable_schema.lesson.findOneAndUpdate({ _id: data[i]._id }, { todelete: false }))
//     }
//     const results = await Promise.all(promises);
//     console.log(results);
//     res.status(200).json({ "status": true, "count": data.length, results })
// });

router_timetable_lesson.get('/', async (req, res) => {
    var flag_deleted = req.query.hasOwnProperty('deleted')
    if (flag_deleted) {
        if (req.query.delete == true) {
            var find = {}
        }
    }
    else {
        var find = { todelete: false }
    }
    try {
        const data = await timetable_schema.lesson.find(find)
        res.json(data);
    } catch (err) {
        let err_code = 99
        let err_text = err_list[err_code]
        res.status(400).json({ "status": false, "err_code": err_code, "err_text": err_text, "message": err })
    }
});

router_timetable_lesson.post('/',verifyToken, verifyRoleAdmin, async (req, res) => {
    var flag_id = false
    var flag_name = false
    // Если в теле МАССИВ, значит нужно обновить name
    if (Array.isArray(req.body)) {
        var lessons_arr = await timetable_schema.lesson.find({})
        for (let i = 0; i < req.body.length; i++) {
            var flag_ok = true
            if (!req.body[i].hasOwnProperty('_id') || !req.body[i].hasOwnProperty('name')) { // Если в массиве нет _id или name
                flag_ok = false
                let err_code = 12
                let err_text = err_list[err_code]
                console.log(err_text)
                res.status(400).json({ "status": false, "err_code": err_code, "err_text": err_text, "request": req.body[i] })
                break
            }
            else if ((lessons_arr.filter(elem => elem._id == req.body[i]._id)).length == 0) { // Или если _id из массива не найден в базе
                flag_ok = false
                let err_code = 13
                let err_text = err_list[err_code]
                console.log(req.body[i]._id, err_text)
                res.status(400).json({ "status": false, "err_code": err_code, "err_text": err_text, "request": req.body[i] })
                break
            }
            else { // Все id найдены в базе, можно обновлять.
            }
        }
        if (flag_ok) {
            try {
                for (let i = 0; i < req.body.length; i++) {
                    await timetable_schema.lesson.findOneAndUpdate({ _id: req.body[i]._id }, { name: req.body[i].name })
                }
                res.status(200).json({ "status": true })
            }
            catch (err) {
                let err_code = 99
                let err_text = err_list[err_code]
                res.status(400).json({ "status": false, "err_code": err_code, "err_text": err_text, "message": err })
            }
        }
    }
    else {
        flag_id = req.body.hasOwnProperty('_id')
        flag_name = req.body.hasOwnProperty('name')
        if (!flag_id && !flag_name) {
            let err_code = 11
            let err_text = err_list[err_code]
            res.status(400).json({ "status": false, "err_code": err_code, "err_text": err_text, "request": req.body })
        }
        else if (flag_id && !flag_name) {
            let err_code = 11
            let err_text = err_list[err_code]
            res.status(400).json({ "status": false, "err_code": err_code, "err_text": err_text, "request": req.body })
        }
        else if (!flag_id && flag_name) {
            // если только name, значит добавить новый предмет
            var data = await timetable_schema.lesson.findOne({ name: { $regex: '^' + req.body.name + '$', $options: 'i' } })
            if (data) {
                if (data.todelete) {
                    try {
                        await timetable_schema.lesson.findOneAndUpdate({ _id: data._id }, { todelete: false })
                        res.status(200).json({ "status": true })
                    }
                    catch (err) {
                        let err_code = 99
                        let err_text = err_list[err_code]
                        res.status(400).json({ "status": false, "err_code": err_code, "err_text": err_text, "message": err })
                    }
                }
                else {
                    let err_code = 21
                    let err_text = err_list[err_code]
                    res.status(200).json({ "status": false, "err_code": err_code, "err_text": err_text, "request": req.body, data })
                }
            }
            else {
                var lesson = new timetable_schema.lesson
                lesson.name = req.body.name
                try {
                    data = await lesson.save()
                    res.status(200).json({ "status": true, data })
                }
                catch (err) {
                    let err_code = 99
                    let err_text = err_list[err_code]
                    res.status(400).json({ "status": false, "err_code": err_code, "err_text": err_text, "message": err })
                }
            }
        }
        else if (flag_id && flag_name) {
            // если есть _id, значит нужно name поменять на тот, что в запросе
            try {
                await timetable_schema.lesson.findOneAndUpdate({ _id: req.body._id }, { name: req.body.name })
                res.status(200).json({ "status": true })
            }
            catch (err) {
                let err_code = 99
                let err_text = err_list[err_code]
                res.status(400).json({ "status": false, "err_code": err_code, "err_text": err_text, "message": err })
            }
        }
        else {
            let err_code = 99
            let err_text = err_list[err_code]
            console.log(err_text)
            res.status(400).json({ "status": false, "err_code": err_code, "err_text": err_text })
        }
    }
});

router_timetable_lesson.delete('/',verifyToken, verifyRoleAdmin, async (req, res) => {
    flag_id = req.body.hasOwnProperty('_id')
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
    else {
        try {
            const data = await timetable_schema.timetable.find({ lesson_id: req.body._id })
            console.log(data.length, data)
            if (data.length != 0) {
                let err_code = 31
                let err_text = err_list[err_code]
                console.log(err_text)
                res.status(400).json({ "status": false, "err_code": err_code, "err_text": err_text, "request": req.body, data })
            }
            else {
                try {
                    await timetable_schema.lesson.findOneAndUpdate({ _id: req.body._id }, { todelete: true })
                    res.status(200).json({ "status": true })
                }
                catch (err) {
                    let err_code = 99
                    let err_text = err_list[err_code]
                    res.status(400).json({ "status": false, "err_code": err_code, "err_text": err_text, "message": err })
                }
            }
        } catch (err) {
            let err_code = 99
            let err_text = err_list[err_code]
            res.status(400).json({ "status": false, "err_code": err_code, "err_text": err_text, "message": err })
        }
    }
});

router_timetable_lesson.delete('/remove_from_db',verifyToken, verifyRoleAdmin, async (req, res) => {
    var removed = await timetable_schema.lesson.deleteMany({ todelete: true })
    console.log (removed)
    return res.status(200).json({ "status": true, removed })
});

router_timetable_lesson.post('/enable',verifyToken, verifyRoleAdmin, async (req, res) => {
    flag_id = req.body.hasOwnProperty('_id')
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
    else {

        try {
            await timetable_schema.lesson.findOneAndUpdate({ _id: req.body._id }, { todelete: false })
            res.status(200).json({ "status": true })
        }
        catch (err) {
            let err_code = 99
            let err_text = err_list[err_code]
            res.status(400).json({ "status": false, "err_code": err_code, "err_text": err_text, "message": err })
        }

    }

});
module.exports = router_timetable_lesson;