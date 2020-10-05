const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const router_auth = express.Router();
const auth_schema = require('../models/auth')
const timetable_schema = require('../models/timetable')
const err_list = require('../errors.js')
const ObjectId = require('mongoose').Types.ObjectId;
const verifyToken = require('./verifyTokens');
const verifyRoleAdmin = require('./verifyRole_admin');

router_auth.get('/register', async (req, res) => {
    res.send(req.header)
})

router_auth.post('/register',verifyToken, verifyRoleAdmin, async (req, res) => {
    console.log(req.body)
    if (Array.isArray(req.body)) {
        let err_code = 15
        let err_text = err_list[err_code]
        return res.status(400).json({ "status": false, "err_code": err_code, "err_text": err_text, "request": req.body })
    }
    flag = req.body.hasOwnProperty('login') && req.body.hasOwnProperty('password') && req.body.hasOwnProperty('teacher_id') && req.body.hasOwnProperty('role')
    if (!flag) {
        let err_code = 11
        let err_text = err_list[err_code]
        return res.status(400).json({ "status": false, "err_code": err_code, "err_text": err_text, "request": req.body })
    }

    if (req.body.login.length < 3) {
        let err_code = 23
        let err_text = err_list[err_code]
        return res.status(200).json({ "status": false, "err_code": err_code, "err_text": err_text })
    }

    if (req.body.password.length < 6) {
        let err_code = 24
        let err_text = err_list[err_code]
        return res.status(200).json({ "status": false, "err_code": err_code, "err_text": err_text })
    }

    if (!([1, 2].includes(req.body.role))) {
        let err_code = 25
        let err_text = err_list[err_code]
        return res.status(200).json({ "status": false, "err_code": err_code, "err_text": err_text })
    }

    try {
        const userExist = await auth_schema.user.findOne({ login: { $regex: '^' + req.body.login + '$', $options: 'i' } });
        if (userExist) {
            let err_code = 22
            let err_text = err_list[err_code]
            return res.status(200).json({ "status": false, "err_code": err_code, "err_text": err_text })
        }
    }
    catch (err) {
        let err_code = 99
        let err_text = err_list[err_code]
        return res.status(400).json({ "status": false, "err_code": err_code, "err_text": err_text, "message": err })
    }

    //If teacher exist

    if (!ObjectId.isValid(req.body.teacher_id)) {
        let err_code = 17
        let err_text = err_list[err_code]
        return res.status(200).json({ "status": false, "err_code": err_code, "err_text": err_text })
    }
    var teacherExist = await timetable_schema.teacher.findOne({ _id: req.body.teacher_id })
    if (teacherExist) {
        console.log("teacher found:", teacherExist)
    }
    else {
        let err_code = 26
        let err_text = err_list[err_code]
        return res.status(200).json({ "status": false, "err_code": err_code, "err_text": err_text })
    }

    //Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.password, salt);

    //Create a new user
    const user = new auth_schema.user({
        login: req.body.login,
        password: hashedPassword,
        role: req.body.role,
        teacher_id: teacherExist._id
    });
    try {
        const savedUser = await user.save()
        return res.status(200).json({ "status": true })
    } catch (err) {
        let err_code = 99
        let err_text = err_list[err_code]
        return res.status(400).json({ "status": false, "err_code": err_code, "err_text": err_text, "message": err })
    }
});

router_auth.post('/login', async (req, res) => {
    const user = await auth_schema.user.findOne({ login: req.body.login });
    if (!user) {
        let err_code = 51
        let err_text = err_list[err_code]
        return res.status(400).json({ "status": false, "err_code": err_code, "err_text": err_text, "request": req.body })
    }
    const validPass = await bcrypt.compare(req.body.password, user.password);
    if (!validPass) {
        let err_code = 51
        let err_text = err_list[err_code]
        return res.status(400).json({ "status": false, "err_code": err_code, "err_text": err_text, "request": req.body })
    }
    var name
    var teacher = await timetable_schema.teacher.findOne({ _id: user.teacher_id })
    if (!teacher) name = user.login
    else name = teacher.name

    //JWT
    var jvt_date = {
        "id": user._id,
        "login": user.login,
        "role": user.role,
        "name": name,
        "teacher_id": user.teacher_id
    }
    const token = jwt.sign(jvt_date, process.env.TOKEN_SECRET);
    return res.status(200).header('jwt', token).json({ "status": true, "jwt": token })
});

router_auth.get('/accounts',verifyToken, verifyRoleAdmin, async (req, res) => {
    var accounts = await auth_schema.user.find({}, { password: 0 }).lean();

    var teachers_arr = await timetable_schema.teacher.find({})
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
    for (let i = 0; i < accounts.length; i++)
    {
        accounts[i].teacher_name = await getOne_teacher(accounts[i].teacher_id)
    }
    return res.status(200).json({ "status": true, accounts })
});

module.exports = router_auth;
