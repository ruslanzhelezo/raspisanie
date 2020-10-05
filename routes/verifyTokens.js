const jwt = require('jsonwebtoken');
const err_list = require('../errors.js')

module.exports = function(req,res,next) {
    const token = req.header('auth-token');
    if(!token) 
    {
        let err_code = 52
        let err_text = err_list[err_code]
        return res.status(401).json({ "status": false, "err_code": err_code, "err_text": err_text})
    }
    try{
        const verified = jwt.verify(token, process.env.TOKEN_SECRET);
        req.user = verified;
        next();
    }catch (err) {
        let err_code = 53
        let err_text = err_list[err_code]
        return res.status(401).json({ "status": false, "err_code": err_code, "err_text": err_text})
    }
}

