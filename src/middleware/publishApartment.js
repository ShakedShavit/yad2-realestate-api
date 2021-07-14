// const Apartment = require('../models/apartment');
// const { default: getApartmentObj } = require('../utils/getApartmentObj');

// const publishApartment = async (req, res, next) => {
//     let apartment;
//     try {
//         let apartmentObj = getApartmentObj(req, [], req.user._id);

//         if (!req.publishers || req.publishers.length === 0) throw new Error("Apartment's publishers are missing, must include at least one (name, phone number)");
//         req.publishers.forEach(publisherObj => {
//             apartmentObj.publishers.push({
//                 publisherName: publisherObj.publisherName,
//                 phoneNumber: publisherObj.phoneNumber,
//                 canBeInContactOnWeekends: publisherObj.canBeInContactOnWeekends
//             });
//         });

//         apartment = new Apartment(apartmentObj);
//         await apartment.save();
//         req.apartment = apartment;
        
//         next();
//     } catch (err) {
//         console.log(err.message, '8');
//         res.status(400).send(err.message);
//     }
// }

// module.exports = publishApartment;