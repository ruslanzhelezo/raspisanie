const express = require("express");
const router_service = express.Router();
const service_schema = require('../models/service')

router_service.get('/lesson_numbers', async (req, res) => {
    try {
        const data = await service_schema.lesson_numbers.find({},{ '_id': 0,});
        var lesson_numbers = new Object()
        data.forEach(function(item, i, data) {
            lesson_numbers[item.code] = {"name" : item.name, "time" : item.time}
        });
        res.json(lesson_numbers);
    } catch (err) {
        res.json({message:err});
    }

});

router_service.get('/lesson_types', async (req, res) => {
    try {
        const data = await service_schema.lesson_types.find({},{ '_id': 0,});
        const lesson_types = new Object()
	    data.forEach(function(item, i, data) {
		    lesson_types[item.code] = item.name
	    });
        res.json(lesson_types);
    } catch (err) {
        res.json({message:err});
    }

});

router_service.get('/days_of_the_week', async (req, res) => {
    try {
        const data = await service_schema.days_of_the_week.find({},{ '_id': 0,});
        const days_of_the_week = new Object()
	    data.forEach(function(item, i, data) {
		    days_of_the_week[item.code] = item.name
	    });
        res.json(days_of_the_week);
    } catch (err) {
        res.json({message:err});
    }

});

router_service.post('/lesson_numbers', async (req, res) => {
    const lesson_numbers = new service_schema.lesson_numbers({
        code: req.body.code,
        name: req.body.name,
        time: req.body.time
    });
    try {
        const saved_lesson_number = await lesson_numbers.save();
        res.json(saved_lesson_number);
    } catch (err) {
        res.json({message:err});
    }
});

module.exports = router_service;
