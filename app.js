const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors")
const app = express();

//MIDDLEWARES
app.use(cors());
app.use(express.json());

//connect to DB
const options = {useNewUrlParser: true,useUnifiedTopology: true, useCreateIndex: true, useFindAndModify: false };
mongoose.connect(process.env.MONGODB_URL,options,
     () => console.log("connected to DB!"));

// IMPORT ROUTES
//const route_raspisanie = require('./routes/raspisanie');
const router_service = require("./routes/service");
const router_timetable = require("./routes/timetable");
const router_auth = require("./routes/auth");
const router_homework = require("./routes/homework");
const router_post = require("./routes/posts");
const router_test = require("./routes/test");


app.use('/service', router_service);
app.use('/timetable', router_timetable);
app.use('/user', router_auth);
app.use('/homework', router_homework)
app.use('/posts', router_post);
app.use('/test', router_test);


//ROUTES
app.get('/', (req, res) => {
    //res.send(process.env.MONGODB_URL);
    //console.log(process.env.MONGODB_URL);
    //res.send("asdasd");
});

// Listenning
app.listen(3000);

 
