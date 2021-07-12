const express = require('express');
const User = require('../models/user');
const auth = require('../middleware/auth');
const { getStrValFromRedis, setStrInRedis } = require('../utils/redis');

const router = express.Router();

router.get('/', async (req, res) => {
    res.send('API is Working!');
});

router.post('/login', async (req, res) => {
    try {
        const user = await User.findByCredentials(req.body.email, req.body.password);
        const token = await user.generateAuthToken();

        res.status(200).send({ user, token });
    } catch (err) {
        res.status(400).send(err.message || err);
    }
});

router.post('/signup', async (req, res) => {
    try {
        const user = new User({ ...req.body });
        await user.save();

        const token = await user.generateAuthToken();

        res.status(201).send({ user, token });
    } catch (err) {
        if (err.code === 11000 && Object.keys(err.keyValue).includes('email')) {
            return res.status(409).send({
                status: 409,
                message: 'Email already registered'
            });
        }
        res.status(400).send(err);
    }
});

router.post('/logout', auth, async (req, res) => {
    try {
        const user = req.user;
        user.tokens = user.tokens.filter(tokenObj => tokenObj.token !== req.token);
        await user.save();
        res.status(200).send();
    } catch (err) {
        res.status(500).send(err.message);
    }
});

router.get('/locations/cities', async (req, res) => {
    try {
    // await setStrInRedis('locations-files:streets-graph', JSON.stringify())

        const citiesArray = await getStrValFromRedis('locations-files:cities');
        res.status(200).send(citiesArray);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

router.get('/locations/streets-graph', async (req, res) => {
    try {
        const streetsGraph = await getStrValFromRedis('locations-files:streets-graph');
        res.status(200).send(JSON.parse(streetsGraph)[req.query.city]);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// router.post('/locations/insert/streets-graph', async (req, res) => {
//     try {
//         await setStrValFromRedis('locations-files:streets-graph', req.body.file);
//         res.status(200).send();
//     } catch (err) {
//         res.status(500).send(err.message);
//     }
// });

router.post('/locations/insert/cities', async (req, res) => {
    try {
        await setStrInRedis('locations-files:cities', JSON.stringify(req.body.file));
        res.status(200).send('upload to redis is successful');
    } catch (err) {
        res.status(500).send(err.message);
    }
});

router.post('/locations/insert/streets-graph', async (req, res) => {
    try {
        const jsonData = require('../db/streetsGraph.json');
        await setStrInRedis('locations-files:streets-graph', JSON.stringify(jsonData));
        res.status(200).send('upload to redis is successful');
    } catch (err) {
        res.status(500).send(err.message);
    }
});

module.exports = router;