const express = require('express');
const Apartment = require('../models/apartment');
const auth = require('../middleware/auth');
const FileModel = require('../models/file');
const publishApartment = require('../middleware/publishApartment');
const {
    uploadFilesToS3, getFileFromS3
} = require('../middleware/s3-handlers');

const router = express.Router();

const rootRoute = '/apartments/'

router.post(rootRoute + 'publish', auth, publishApartment, uploadFilesToS3, async (req, res) => {
    console.log(req.file, req.files, req.body, "\n\n\n\n\n\n\n\n\n", req.files.length);
    if (!req.files) { // ! check what happens if no files are provided (not provided on purpose)
        return res.status(422).send({
            status: 422,
            message: "file not uploaded"
        });
    }

    try {
        let fileObjectsSavesPromises = [];
        for (let i = 0; i < req.files.length; i++) {
            let reqFile = req.files[i];
            let file = new FileModel({
                originalName: reqFile.originalname,
                storageName: reqFile.key.split("/")[1],
                bucket: process.env.S3_BUCKET,
                region: process.env.AWS_REGION,
                key: reqFile.key,
                type: reqFile.mimetype,
                owner: req.apartment._id,
                isMainFile: i === 0
            });
            fileObjectsSavesPromises.push(file.save());
        }
        await Promise.allSettled(fileObjectsSavesPromises, (values) => {});
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
    const params = req.params;

    let strAndBoolQueries = [];
    for (let [key, value] of Object.entries(params)) {
        if (!apartmentModelStrFields.includes(key) && !apartmentModelBoolFields.includes(key)) continue;
        let modelKey;
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
    }

    let numericQueries = [];
    for (let [key, value] of Object.entries(params)) {
        let field = key.substring(4); // "Omits the min- or max- label"
        if (!apartmentModelNumFields.includes(field)) continue; // !! find({ airedAt: { $gte: '1987-10-19', $lte: '1987-10-26' } }). DATE FORMAT

        let modelKey;
        if (field === 'houseNum' || field === 'floor' || field === 'buildingMaxFloor') modelKey = `location.${field}`;
        else if (field === 'builtSqm' || field === 'totalSqm') modelKey = `size.${field}`;
        else if (field === 'date') modelKey = `entranceDate.${field}`;
        else if (field === 'price') modelKey = field;
        else modelKey = `properties.${field}`;

        let isMin = key.substring(0, 3) === "min"; // ! Check if I this works or if I need to put $and if there is both $gte and $lte
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
        await Promise.allSettled(populateFilesPromises, (values) => {});

        res.status(200).send(apartments);
    } catch (err) {
        console.log(err.message, '138');
        res.status(500).send(err);
    }
});

router.get(rootRoute + 'get-file', getFileFromS3, async (req, res) => {
    try {
        const stream = Readable.from(req.fileBuffer);
        const fileName = req.query.name;

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