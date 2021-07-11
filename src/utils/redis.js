const redisClient = require('../db/redis');

const doesKeyExistInRedis = async (key) => {
    try {
        return redisClient.existsAsync(key);
    } catch (err) {
        throw new Error(err.message);
    }
}

const getStrValFromRedis = async (key) => {
    try {
        return redisClient.getAsync(key);
    } catch (err) {
        console.log(err.message, '62');
        throw new Error(err.message);
    }
}

const setStrInRedis = async (key, value) => {
    try {
        if (typeof value !== 'string') throw new Error(`value's type must be string. value (${value}) input is of type ${typeof value}`);

        return redisClient.setAsync(key, value);
    } catch (err) {
        console.log(err.message, '73');
        throw new Error(err.message);
    }
}

module.exports = {
    doesKeyExistInRedis,
    getStrValFromRedis,
    setStrInRedis
};
