const express = require("express");
const User = require("../models/user");
const auth = require("../middleware/auth");

const router = express.Router();

router.get("/", async (req, res) => {
    res.send("API is Working!");
});

router.post("/login", async (req, res) => {
    try {
        const user = await User.findByCredentials(req.body.email, req.body.password);
        const token = await user.generateAuthToken();

        res.status(200).send({ user, token });
    } catch (err) {
        res.status(400).send(err.message || err);
    }
});

router.post("/signup", async (req, res) => {
    try {
        const user = new User({ ...req.body });
        await user.save();

        const token = await user.generateAuthToken();

        res.status(201).send({ user, token });
    } catch (err) {
        console.log(err);
        if (err.code === 11000 && Object.keys(err.keyValue).includes("email")) {
            return res.status(409).send({
                status: 409,
                message: "Email already registered",
            });
        }
        res.status(400).send(err);
    }
});

router.post("/logout", auth, async (req, res) => {
    try {
        const user = req.user;
        user.tokens = user.tokens.filter((tokenObj) => tokenObj.token !== req.token);
        await user.save();
        res.status(200).send();
    } catch (err) {
        res.status(500).send(err.message);
    }
});

module.exports = router;
