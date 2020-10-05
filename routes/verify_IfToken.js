const jwt = require('jsonwebtoken');
const err_list = require('../errors.js')

module.exports = function(req,res,next) {
    const token = req.header('auth-token');
    if(!token) 
    {
        req.user = false
        console.log("токена нет")
        return next();
    }
    try{
        const verified = jwt.verify(token, process.env.TOKEN_SECRET);
        req.user = verified;
        console.log("токен есть")
        return next();
    }catch (err) {
        req.user = false
        console.log("токен невалидный")
        return next();
    }
}

