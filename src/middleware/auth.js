const jwt = require("jsonwebtoken");
const User = require("../models/user");

const auth = async (req, res, next) => {
    try {
        let token =
            req.query.token == undefined
                ? req.header("Authorization").replace("Bearer ", "")
                : req.query.token;
        const data = jwt.verify(token, process.env.TOKEN_SECRET);

        const user = await User.findOne({
            _id: data._id,
            "tokens.token": token,
        });

        if (!user) {
            throw new Error("User not found");
        }

        req.user = user;
        req.token = token;
        next();
    } catch (err) {
        res.status(403).send({
            status: 403,
            message: "Not authenticated",
        });
    }
};

module.exports = auth;
