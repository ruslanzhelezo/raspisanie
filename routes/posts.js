const express = require("express");
const router_posts = express.Router();
const verifyToken = require('./verifyTokens');
const verifyRoleAdmin = require('./verifyRole_admin');

router_posts.get('/',verifyToken, verifyRoleAdmin, (req,res) => {
    res.json({posts:{title: 'my post', description: 'some info'}});
});

module.exports = router_posts;