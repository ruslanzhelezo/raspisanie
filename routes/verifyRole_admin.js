module.exports = function (req, res, next) {
    if (req.user.role != 2)
    {
        let err_code = 54
        let err_text = err_list[err_code]
        return res.status(401).json({ "status": false, "err_code": err_code, "err_text": err_text})
    }
    else
    {
        next();
    }
}