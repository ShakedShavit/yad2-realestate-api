const Apartment = require("../models/apartment");

const validateApartment = async (req, res, next) => {
    if (!req.query.apartmentId) return res.status(400).send("Must include apartment's object id");

    try {
        const apartment = await Apartment.findById(req.query.apartmentId);
        if (!apartment) return res.status(400).send("Apartment was not found");

        next();
    } catch (err) {
        console.log(err);
        res.status(400).send(err.message);
    }
}

module.exports = validateApartment;