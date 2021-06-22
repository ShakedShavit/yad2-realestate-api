const express = require('express');
const Apartment = require('../models/apartment');
const auth = require('../middleware/auth');
const FileModel = require('../models/file');
const {
    uploadFilesToS3,
    getFileFromS3
} = require('../middleware/s3-handlers');
const validateApartment = require('../middleware/validateApartment');
const {
    Readable
} = require('stream');

const router = express.Router();

const rootRoute = '/apartments/'

router.post(rootRoute + 'publish', auth, async (req, res) => {
    try {
        let apartmentObj = {
            type: req.body.type,
            condition: req.body.condition,
            location: {
                town: req.body.town,
                streetName: req.body.streetName,
                houseNum: req.body.houseNum,
                floor: req.body.floor,
                buildingMaxFloor: req.body.buildingMaxFloor
            },
            properties: {
                isStandingOnPolls: req.body.isStandingOnPolls,
                numberOfRooms: req.body.numberOfRooms,
                numberOfParkingSpots: req.body.numberOfParkingSpots,
                numberOfBalconies: req.body.numberOfBalconies,
                hasAirConditioning: req.body.hasAirConditioning,
                hasFurniture: req.body.hasFurniture,
                isRenovated: req.body.isRenovated,
                hasSafeRoom: req.body.hasSafeRoom,
                isAccessible: req.body.isAccessible,
                hasKosherKitchen: req.body.hasKosherKitchen,
                hasShed: req.body.hasShed,
                hasLift: req.body.hasLift,
                hasSunHeatedWaterTanks: req.body.hasSunHeatedWaterTanks,
                hasPandorDoors: req.body.hasPandorDoors,
                hasTadiranAc: req.body.hasTadiranAc,
                hasWindowBars: req.body.hasWindowBars,
                description: req.body.description
            },
            price: req.body.price,
            size: {
                builtSqm: req.body.builtSqm,
                totalSqm: req.body.totalSqm
            },
            entranceDate: {
                date: req.body.date,
                isImmediate: req.body.isImmediate
            },
            contactEmail: req.body.contactEmail,
            publisher: req.user._id
        }

        if (!req.body.publishers || req.body.publishers.length === 0) throw new Error("Apartment's publishers are missing, must include at least one (name, phone number)");
        apartmentObj.publishers = [...req.body.publishers];

        const apartment = new Apartment(apartmentObj);
        await apartment.save();

        res.status(201).send(apartment);
    } catch (err) {
        console.log(err.message, '42');
        res.status(400).send(err);
    }
});

router.post(rootRoute + 'publish/upload-files', auth, validateApartment, uploadFilesToS3, async (req, res) => {
    if (!req.files) {
        return res.status(422).send({
            status: 422,
            message: "file not uploaded"
        });
    }

    try {
        await req.apartment.populate('files').execPopulate();
        let isFirstFileOfApartment = req.apartment.files.length === 0;

        let files = [];
        let fileObjectsSavesPromises = [];
        for (let reqFile of req.files) {
            let file = new FileModel({
                originalName: reqFile.originalname,
                storageName: reqFile.key.split("/")[1],
                bucket: process.env.S3_BUCKET,
                region: process.env.AWS_REGION,
                key: reqFile.key,
                type: reqFile.mimetype,
                owner: req.query.apartmentId,
                isMainFile: isFirstFileOfApartment
            });
            fileObjectsSavesPromises.push(file.save());
            if (isFirstFileOfApartment) isFirstFileOfApartment = false; // Makes sure only the first file is saved as the main one
        }
        const values = await Promise.allSettled(fileObjectsSavesPromises);
        values.forEach(value => {
            if (value.status === "fulfilled") files.push(value.value)
        });

        res.status(201).send(files)
    } catch (err) {
        console.log(err.message, '42');
        res.status(500).send(err);
    }
});

const apartmentModelStrFields = [
    'type',
    'condition',
    'town',
    'streetName',
    'description'
];
const apartmentModelBoolFields = [
    // 'isStandingOnPolls',
    'hasAirConditioning',
    'hasFurniture',
    'isRenovated',
    'hasSafeRoom',
    'isAccessible',
    'hasKosherKitchen',
    'hasShed',
    'hasLift',
    'hasSunHeatedWaterTanks',
    'hasPandorDoors',
    'hasTadiranAc',
    'hasWindowBars',
    'isImmediate',
    // 'canBeInContactOnWeekends'
];
const apartmentModelNumFields = [
    'houseNum',
    'floor',
    'buildingMaxFloor',
    'numberOfRooms',
    'numberOfParkingSpots',
    'numberOfBalconies',
    'price',
    'builtSqm',
    'totalSqm',
    'date'
];

router.get(rootRoute, async (req, res) => {
    const apartmentsPollLimit = 20;
    const params = req.query;
    if (!params.apartmentIds) params.apartmentIds = [];

    let strAndBoolQueries = [];
    let numericQueries = [];

    for (let [key, value] of Object.entries(params)) {
        let modelKey;
        if (apartmentModelStrFields.includes(key) || apartmentModelBoolFields.includes(key)) {
            if (key === 'town' || key === 'streetName') modelKey = `location.${key}`;
            else if (key === 'isImmediate') modelKey = `entranceDate.${key}`;
            else if (key === 'type' || key === 'condition') modelKey = key;
            else modelKey = `properties.${key}`;

            if (key === 'description') {
                strAndBoolQueries.push({
                    [`${modelKey}`]: {
                        $regex: `${value.substring(0, 400)}`
                    }
                });
                continue;
            }
            strAndBoolQueries.push({
                [`${modelKey}`]: value
            });

            continue;
        }

        let field = key.substring(4); // "Omits the min- or max- label"
        if (apartmentModelNumFields.includes(field)) {
            if (!apartmentModelNumFields.includes(field)) continue; // !! find({ airedAt: { $gte: '1987-10-19', $lte: '1987-10-26' } }). DATE FORMAT

            if (field === 'houseNum' || field === 'floor' || field === 'buildingMaxFloor') modelKey = `location.${field}`;
            else if (field === 'builtSqm' || field === 'totalSqm') modelKey = `size.${field}`;
            else if (field === 'date') modelKey = `entranceDate.${field}`;
            else if (field === 'price') modelKey = field;
            else modelKey = `properties.${field}`;

            let isMin = key.substring(0, 3) === "min";
            isMin ? numericQueries.push({
                [modelKey]: {
                    $gte: value
                }
            }) : numericQueries.push({
                [modelKey]: {
                    $lte: value
                }
            });
        }
    }

    try {
        const apartments = await Apartment.find({
            $and: [...strAndBoolQueries, ...numericQueries, {
                _id: {
                    $nin: [...params.apartmentIds]
                }
            }]
        }).limit(apartmentsPollLimit);

        let populateFilesPromises = [];
        for (apartment of apartments) {
            populateFilesPromises.push(apartment.populate('files').execPopulate());
        }
        await Promise.allSettled(populateFilesPromises);
        let apartmentObjects = apartments.map(apartment => ({
            apartment,
            files: apartment.files || []
        }));

        res.status(200).send(apartmentObjects || []);
    } catch (err) {
        console.log(err.message, '138');
        res.status(500).send(err);
    }
});

router.get(rootRoute + 'get-file', getFileFromS3, async (req, res) => {
    try {
        const stream = Readable.from(req.fileBuffer);
        //const fileName = req.query.name;
        const fileName = req.query.key.substring(req.query.key.lastIndexOf('/') + 1);

        if (req.query.download === 'true') {
            res.setHeader(
                'Content-Disposition',
                'attachment; filename=' + fileName
            );
        } else {
            res.setHeader(
                'Content-Disposition',
                'inline'
            );
        }

        stream.pipe(res);
    } catch (err) {
        console.log(err);
        res.status(500).send(err);
    }
});

module.exports = router;