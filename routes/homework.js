const express = require("express");
const router_homework = express.Router();
const timetable_schema = require('../models/timetable')
const homework_schema = require('../models/homework')
const accounts_schema = require('../models/auth')
const mongoose = require('mongoose');
const err_list = require('../errors.js')
const ObjectId = require('mongoose').Types.ObjectId;
const verifyToken = require('./verifyTokens');
const verifyRoleAdmin = require('./verifyRole_admin');
const verify_IfToken = require('./verify_IfToken');

router_homework.get('/', verify_IfToken, async (req, res) => {
    var params = ['group_id', 'lesson_id', 'timetable_id']
    var flag_params = true
    for (let i = 0; i < params.length; i++) {
        var param = params[i]
        if (!(req.query.hasOwnProperty(param))) {
            flag_params = false
        }
    }
    if (!flag_params) {
        let err_code = 11
        let err_text = err_list[err_code]
        return res.status(400).json({ "status": false, "err_code": err_code, "err_text": err_text, "request": req.body })
    }
    if (!ObjectId.isValid(req.query.group_id)) {
        let err_code = 17
        let err_text = err_list[err_code]
        return res.status(200).json({ "status": false, "err_code": err_code, "err_text": err_text })
    }
    if (!ObjectId.isValid(req.query.lesson_id)) {
        let err_code = 17
        let err_text = err_list[err_code]
        return res.status(200).json({ "status": false, "err_code": err_code, "err_text": err_text })
    }
    if (!ObjectId.isValid(req.query.timetable_id)) {
        let err_code = 17
        let err_text = err_list[err_code]
        return res.status(200).json({ "status": false, "err_code": err_code, "err_text": err_text })
    }

    var homework = await homework_schema.homework.findOne({ group_id: req.query.group_id, lesson_id: req.query.lesson_id }).lean()
    if (!homework) {
        let err_code = 61
        let err_text = err_list[err_code]
        return res.status(400).json({ "status": false, "err_code": err_code, "err_text": err_text })
    }
    if (req.user) {
        var teacher_id = req.user.teacher_id
        var timetable_id = req.query.timetable_id
        var whocanchange_arr = homework.whocanchange
        var filtered = whocanchange_arr.filter(elem => (elem.teacher_id == teacher_id && elem.timetable_id == timetable_id))
        if (homework.homework.length != 0) {
            console.log("домашка не пустая:", homework.homework.length)
            var accounts = await accounts_schema.user.find({})
            var teachers = await timetable_schema.teacher.find({})
            //console.log(teachers.filter(t => t._id == "5ebbe886332ca600073cada3"))
            for (let i = 0; i < homework.homework.length; i++) {
                //if (homework.homework[i].hasOwnProperty('creator')) {
                if (homework.homework[i].creator != (null || undefined)) {
                    console.log("есть креатор")
                    var creator_id = homework.homework[i].creator
                    var creator_acc = accounts.filter(acc => acc._id == creator_id)
                    var creator_teacher = teachers.filter(t => t._id == creator_acc[0].teacher_id)
                    homework.homework[i].creator_name = creator_teacher[0].name
                }
                //if (homework.homework[i].hasOwnProperty('editor')) {
                if (homework.homework[i].editor != (null || undefined)) {
                    console.log("есть едитор")
                    var editor_id = homework.homework[i].editor
                    var editor_acc = accounts.filter(acc => acc._id == editor_id)
                    var editor_teacher = teachers.filter(t => t._id == creator_acc[0].teacher_id)
                    homework.homework[i].editor_name = editor_teacher[0].name
                }
            }

        }
        if (filtered.length != 0 || req.user.role == 2) {
            //console.log("Ему можно менять домашку", req.user)
            return res.status(200).json({ "status": true, "canchange": true, "homework": homework.homework, "homework_id": homework._id })
        }
        else {
            console.log("Нельзя менять домашку")
            return res.status(200).json({ "status": true, "canchange": false, "homework": homework.homework, "homework_id": homework._id })
        }
    }
    else {
        return res.status(200).json({ "status": true, "canchange": false, "homework": homework.homework, "homework_id": homework._id })
    }
});

// new homework (ok)
router_homework.put('/', verify_IfToken, async (req, res) => {
    var params = ['homework_id', 'timetable_id', 'homework']
    var flag_params = true
    for (let i = 0; i < params.length; i++) {
        var param = params[i]
        if (!(req.body.hasOwnProperty(param))) {
            flag_params = false
        }
    }
    if (!flag_params) {
        let err_code = 11
        let err_text = err_list[err_code]
        return res.status(400).json({ "status": false, "err_code": err_code, "err_text": err_text, "request": req.body })
    }
    if (!ObjectId.isValid(req.body.homework_id)) {
        let err_code = 17
        let err_text = err_list[err_code]
        console.log("Не ID - group_id")
        return res.status(200).json({ "status": false, "err_code": err_code, "err_text": err_text })
    }
    if (!ObjectId.isValid(req.body.timetable_id)) {
        let err_code = 17
        let err_text = err_list[err_code]
        console.log("Не ID - timetable_id")
        return res.status(200).json({ "status": false, "err_code": err_code, "err_text": err_text })
    }

    if (req.user) {
        console.log("Добавление домашки", "инфо о юзере", req.user)
        var homework = await homework_schema.homework.findOne({ _id: req.body.homework_id })
        if (!homework) {
            let err_code = 61
            let err_text = err_list[err_code]
            return res.status(400).json({ "status": false, "err_code": err_code, "err_text": err_text })
        }
        console.log("Добавление домашки", "Домашка из базы", homework)
        var teacher_id = req.user.teacher_id
        var timetable_id = req.body.timetable_id
        var whocanchange_arr = homework.whocanchange
        var filtered = whocanchange_arr.filter(elem => (elem.teacher_id == teacher_id && elem.timetable_id == timetable_id))
        if (filtered.length != 0 || req.user.role == 2) {
            console.log("Ему можно менять домашку")
            var task = req.body.homework
            task.created_at = Date.now() //UNIX time
            task.creator = req.user.id
            // var task = {
            //     "text": "Домашнее задание на будущее"
            // }
            homework.homework.push(task)

            var save_res = await homework.save()
            console.log(save_res)
            return res.status(200).json({ "status": true })
        }
        else {
            let err_code = 53
            let err_text = err_list[err_code]
            return res.status(401).json({ "status": false, "err_code": err_code, "err_text": err_text })
        }
    }
    else {
        let err_code = 52
        let err_text = err_list[err_code]
        return res.status(401).json({ "status": false, "err_code": err_code, "err_text": err_text })
    }
});

// update homework 
router_homework.post('/', verify_IfToken, async (req, res) => {
    var params = ['homework_id', 'task_id', 'timetable_id', 'text']
    var flag_params = true
    for (let i = 0; i < params.length; i++) {
        var param = params[i]
        if (!(req.body.hasOwnProperty(param))) {
            flag_params = false
        }
    }
    if (!flag_params) {
        let err_code = 11
        let err_text = err_list[err_code]
        return res.status(400).json({ "status": false, "err_code": err_code, "err_text": err_text, "request": req.body })
    }
    if (!ObjectId.isValid(req.body.homework_id)) {
        let err_code = 17
        let err_text = err_list[err_code]
        console.log("Не ID - group_id")
        return res.status(200).json({ "status": false, "err_code": err_code, "err_text": err_text })
    }
    if (!ObjectId.isValid(req.body.task_id)) {
        let err_code = 17
        let err_text = err_list[err_code]
        console.log("Не ID - lesson_id")
        return res.status(200).json({ "status": false, "err_code": err_code, "err_text": err_text })
    }
    if (!ObjectId.isValid(req.body.timetable_id)) {
        let err_code = 17
        let err_text = err_list[err_code]
        console.log("Не ID - timetable_id")
        return res.status(200).json({ "status": false, "err_code": err_code, "err_text": err_text })
    }

    if (req.user) {
        console.log("Добавление домашки", "инфо о юзере", req.user)
        var homework = await homework_schema.homework.findOne({ _id: req.body.homework_id })
        if (!homework) {
            let err_code = 61
            let err_text = err_list[err_code]
            return res.status(400).json({ "status": false, "err_code": err_code, "err_text": err_text })
        }
        console.log("Изменение домашки", "Домашка из базы", homework)
        var teacher_id = req.user.teacher_id
        var timetable_id = req.body.timetable_id
        var whocanchange_arr = homework.whocanchange
        var filtered = whocanchange_arr.filter(elem => (elem.teacher_id == teacher_id && elem.timetable_id == timetable_id))
        if (filtered.length != 0 || req.user.role == 2) {
            console.log("Ему можно менять домашку")
            var task = req.body.homework
            // var task = {
            //     "text": "Домашнее задание на будущее"
            // }
            //
            for (let i = 0; i < homework.homework.length; i++) {
                if (homework.homework[i]._id == req.body.task_id) {
                    homework.homework[i].text = req.body.text
                    homework.homework[i].edited_at = Date.now() //UNIX time
                    homework.homework[i].editor = req.user.id
                }

            }
            var save_res = await homework.save()
            console.log(save_res)
            return res.status(200).json({ "status": true })
        }
        else {
            let err_code = 53
            let err_text = err_list[err_code]
            return res.status(401).json({ "status": false, "err_code": err_code, "err_text": err_text })
        }
    }
    else {
        let err_code = 52
        let err_text = err_list[err_code]
        return res.status(401).json({ "status": false, "err_code": err_code, "err_text": err_text })
    }
});

// delete homework (ok)
router_homework.delete('/', verify_IfToken, async (req, res) => {
    var params = ['homework_id', 'task_id', 'timetable_id']
    var flag_params = true
    for (let i = 0; i < params.length; i++) {
        var param = params[i]
        if (!(req.body.hasOwnProperty(param))) {
            flag_params = false
        }
    }
    if (!flag_params) {
        let err_code = 11
        let err_text = err_list[err_code]
        return res.status(400).json({ "status": false, "err_code": err_code, "err_text": err_text, "request": req.body })
    }
    if (!ObjectId.isValid(req.body.homework_id)) {
        let err_code = 17
        let err_text = err_list[err_code]
        console.log("Не ID - group_id")
        return res.status(200).json({ "status": false, "err_code": err_code, "err_text": err_text })
    }
    if (!ObjectId.isValid(req.body.task_id)) {
        let err_code = 17
        let err_text = err_list[err_code]
        console.log("Не ID - lesson_id")
        return res.status(200).json({ "status": false, "err_code": err_code, "err_text": err_text })
    }
    if (!ObjectId.isValid(req.body.timetable_id)) {
        let err_code = 17
        let err_text = err_list[err_code]
        console.log("Не ID - lesson_id")
        return res.status(200).json({ "status": false, "err_code": err_code, "err_text": err_text })
    }

    if (req.user) {
        console.log("Получение домашки для удаления", "инфо о юзере", req.user)
        var homework = await homework_schema.homework.findOne({ _id: req.body.homework_id })
        if (!homework) {
            let err_code = 61
            let err_text = err_list[err_code]
            return res.status(400).json({ "status": false, "err_code": err_code, "err_text": err_text })
        }
        console.log("Удаление домашки", "Домашка из базы", homework)
        var teacher_id = req.user.teacher_id
        var timetable_id = req.body.timetable_id
        var whocanchange_arr = homework.whocanchange
        var filtered = whocanchange_arr.filter(elem => (elem.teacher_id == teacher_id && elem.timetable_id == timetable_id))
        if (filtered.length != 0 || req.user.role == 2) {
            console.log("Ему можно менять домашку")
            var filtered = homework.homework.filter(function (value) { return value._id != req.body.task_id; })
            homework.homework = filtered
            var save_res = await homework.save()
            console.log(save_res)
            return res.status(200).json({ "status": true })
        }
        else {
            let err_code = 53
            let err_text = err_list[err_code]
            return res.status(401).json({ "status": false, "err_code": err_code, "err_text": err_text })
        }
    }
    else {
        let err_code = 52
        let err_text = err_list[err_code]
        return res.status(401).json({ "status": false, "err_code": err_code, "err_text": err_text })
    }
});
module.exports = router_homework;
