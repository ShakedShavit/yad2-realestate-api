const Apartment = require('../models/apartment');

const publishApartment = async (req, res, next) => {
    let apartment;
    try {
        let apartmentObj = {
            type: req.type,
            condition: req.condition,
            location: {
                town: req.town,
                streetName: req.streetName,
                houseNum: req.houseNum,
                floor: req.floor,
                buildingMaxFloor: req.buildingMaxFloor
            },
            properties: {
                isStandingOnPolls: req.isStandingOnPolls,
                numberOfRooms: req.numberOfRooms,
                numberOfParkingSpots: req.numberOfParkingSpots,
                numberOfBalconies: req.numberOfBalconies,
                hasAirConditioning: req.hasAirConditioning,
                hasFurniture: req.hasFurniture,
                isRenovated: req.isRenovated,
                hasSafeRoom: req.hasSafeRoom,
                isAccessible: req.isAccessible,
                hasKosherKitchen: req.hasKosherKitchen,
                hasShed: req.hasShed,
                hasLift: req.hasLift,
                hasSunHeatedWaterTanks: req.hasSunHeatedWaterTanks,
                hasPandorDoors: req.hasPandorDoors,
                hasTadiranAc: req.hasTadiranAc,
                hasWindowBars: req.hasWindowBars,
                description: req.description
            },
            price: req.price,
            size: {
                builtSqm: req.builtSqm,
                totalSqm: req.totalSqm
            },
            entranceDate: {
                date: req.entranceDate,
                isImmediate: req.isImmediate
            },
            publishers: [],
            contactEmail: req.contactEmail,
            publisher: req.user._id
        }

        //!!! Check here how it will work with fd
        console.log(req.publishers);
        if (!req.publishers || req.publishers.length === 0) throw new Error("Apartment's publishers are missing, must include at least one (name, phone number)");
        req.publishers.forEach(publisher => {
            apartmentObj.publisher.push({
                publisherName: publisher.publisherName,
                phoneNumber: publisher.phoneNumber,
                canBeInContactOnWeekends: publisher.canBeInContactOnWeekends
            });
        });

        apartment = new Apartment(apartmentObj);
        await apartment.save();
        req.apartment = apartment;
        
        next();
    } catch (err) {
        console.log(err.message, '8');
        res.status(400).send(err.message);
    }
}

module.exports = publishApartment;