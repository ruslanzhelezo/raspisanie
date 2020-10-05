const express = require("express");
const router_timetable_teacher = express.Router();
const timetable_schema = require('../models/timetable')
const err_list = require('../errors.js')
const verifyToken = require('./verifyTokens');
const verifyRoleAdmin = require('./verifyRole_admin');
// ВКЛЮЧИТЬ ВСЕХ (РАБОТАЕТ)
// router_timetable_teacher.post('/enable_all', async (req, res) => {

//     const data = await timetable_schema.teacher.find({})
//     var flag = true
//     var promises = []
//     for (let i = 0; i < data.length; i++) {
//         promises.push(timetable_schema.teacher.findOneAndUpdate({ _id: data[i]._id }, { todelete: false }))
//     }
//     const results = await Promise.all(promises);
//     console.log(results);
//     res.status(200).json({ "status": true, "count": data.length, results })
// });

// router_timetable_teacher.post('/rebuild', async (req, res) => {

//     const data = req.body
//     var flag = true
//     var promises = []
//     for (let i = 0; i < data.length; i++) {
//         var teacher = new timetable_schema.teacher
//         teacher._id = req.body[i]._id
//         teacher.name = req.body[i].name
//         teacher.name_imported = req.body[i].name_imported
//         try {
//             await teacher.save()
//         }
//         catch (err) {
//             let err_code = 99
//             let err_text = err_list[err_code]
//             return res.status(400).json({ "status": false, "err_code": err_code, "err_text": err_text, "message": err })
//         }
//     }

//     res.status(200).json({ "status": true, "count": data.length })
// });

// router_timetable_teacher.post('/rename', async (req, res) => {

//     const data = req.body
//     var flag = true
//     var promises = []
//     for (let i = 0; i < data.length; i++) {

//         try {
//             var result = await timetable_schema.teacher.findOneAndUpdate({ name: data[i].name_imported }, { name: data[i].name })
//         }
//         catch (err) {
//             let err_code = 99
//             let err_text = err_list[err_code]
//             return res.status(400).json({ "status": false, "err_code": err_code, "err_text": err_text, "message": err })
//         }
//     }
//     res.status(200).json({ "status": true, "count": data.length })
// });

router_timetable_teacher.get('/', async (req, res) => {
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
        const data = await timetable_schema.teacher.find(find)
        res.status(200).json(data);
    } catch (err) {
        let err_code = 99
        let err_text = err_list[err_code]
        res.status(400).json({ "status": false, "err_code": err_code, "err_text": err_text, "message": err })
    }

});

router_timetable_teacher.post('/',verifyToken, verifyRoleAdmin, async (req, res) => {
    var flag_id = false
    var flag_fullname = false
    // Если в теле МАССИВ, значит нужно обновить name
    if (Array.isArray(req.body)) {
        var teachers_arr = await timetable_schema.teacher.find({})
        //console.log(teachers_arr)
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
            else if ((teachers_arr.filter(elem => elem._id == req.body[i]._id)).length == 0) { // Или если _id из массива не найден в базе
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
                    await timetable_schema.teacher.findOneAndUpdate({ _id: req.body[i]._id }, { name: req.body[i].name })
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
        flag_fullname = req.body.hasOwnProperty('name')
        if (!flag_id && !flag_fullname) {
            let err_code = 11
            let err_text = err_list[err_code]
            res.status(400).json({ "status": false, "err_code": err_code, "err_text": err_text, "request": req.body })
        }
        else if (flag_id && !flag_fullname) {
            let err_code = 11
            let err_text = err_list[err_code]
            res.status(400).json({ "status": false, "err_code": err_code, "err_text": err_text, "request": req.body })
        }
        else if (!flag_id && flag_fullname) {
            // если только name, значит добавить нового
            var data = await timetable_schema.teacher.findOne({ name: { $regex: '^' + req.body.name + '$', $options: 'i' } })
            if (data) {
                if (data.todelete) {
                    try {
                        await timetable_schema.teacher.findOneAndUpdate({ _id: data._id }, { todelete: false })
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
                var teacher = new timetable_schema.teacher
                teacher.name = req.body.name
                try {
                    data = await teacher.save()
                    res.status(200).json({ "status": true, data })
                }
                catch (err) {
                    let err_code = 99
                    let err_text = err_list[err_code]
                    res.status(400).json({ "status": false, "err_code": err_code, "err_text": err_text, "message": err })
                }
            }
        }
        else if (flag_id && flag_fullname) {
            // если есть _id, значит нужно name поменять на тот, что в запросе
            try {
                await timetable_schema.teacher.findOneAndUpdate({ _id: req.body._id }, { name: req.body.name })
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

router_timetable_teacher.delete('/',verifyToken, verifyRoleAdmin, async (req, res) => {
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
            const data = await timetable_schema.timetable.find({ teacher_id: req.body._id })
            if (data.length != 0) {
                let err_code = 31
                let err_text = err_list[err_code]
                console.log(err_text)
                res.status(400).json({ "status": false, "err_code": err_code, "err_text": err_text, "request": req.body, data })
            }
            else {
                try {
                    await timetable_schema.teacher.findOneAndUpdate({ _id: req.body._id }, { todelete: true })
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

router_timetable_teacher.delete('/remove_from_db',verifyToken, verifyRoleAdmin, async (req, res) => {

    var removed = await timetable_schema.teacher.deleteMany({ todelete: true })
    console.log (removed)
    return res.status(200).json({ "status": true, removed })
});

router_timetable_teacher.post('/enable',verifyToken, verifyRoleAdmin, async (req, res) => {
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
            await timetable_schema.teacher.findOneAndUpdate({ _id: req.body._id }, { todelete: false })
            return res.status(200).json({ "status": true })
        }
        catch (err) {
            let err_code = 99
            let err_text = err_list[err_code]
            return  res.status(400).json({ "status": false, "err_code": err_code, "err_text": err_text, "message": err })
        }

    }

});

router_timetable_teacher.get('/info', async (req, res) => {
    var body = "<label>Список роутов для /timetable/teachers</label><br>"
    body += "<label>GET /timetable/teachers</label><br>"

    body = `<div>
    GET /timetable/teachers <br>
    &emsp;Параметры запроса: deleted = true/false <br>
    &emsp;Список ФИО. <br>
    &emsp;Если deleted=true, то дополнительно возвращается список помеченных как удаленные. <br>
    &emsp;Если deleted=false или если параметр отсутствует, то возвращается список "активных". <br>
    <br>
    POST /timetable/teachers <br>
    &emsp;Тело запроса: {name = string} <br>
    &emsp;Добавить новое ФИО в таблицу <br>
    &emsp;Если пользователь есть - код 21 <br>
    &emsp;Если пользователь есть и помечен как удаленный - метка удаления снимается <br>
    <br>
    POST /timetable/teachers <br>
    &emsp;Тело запроса: {_id = string, name = string} <br>
    &emsp;Обновить пользователю с _id поле name <br>
    <br>
    POST /timetable/teachers <br>
    &emsp;Тело запроса: [{_id = string, name = string}] <br>
    &emsp;Аналогично предыдущему, только для массива<br>
    <br>
    DELETE /timetable/teachers <br>
    &emsp;Тело запроса: {_id = string} <br>
    &emsp;Пометить ФИО с _id как удаленное<br>
    &emsp;Нельзя удалить, если есть связанный с ним элемент расписания - ошибка 31 <br>
    <br>
    POST /timetable/teachers/enable <br>
    &emsp;Тело запроса: {_id = string} <br>
    &emsp;Снять метку удаления<br>


    </div>`
    res.status(200).send(body)



});

module.exports = router_timetable_teacher;