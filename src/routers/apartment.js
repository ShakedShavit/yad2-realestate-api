const express = require("express");
const Apartment = require("../models/apartment");
const auth = require("../middleware/auth");
const FileModel = require("../models/file");
const { uploadFilesToS3, getFileFromS3 } = require("../middleware/s3-handlers");
const validateApartment = require("../middleware/validateApartment");
const { Readable } = require("stream");
const getApartmentObj = require("../utils/getApartmentObj");

const router = express.Router();

const rootRoute = "/apartments/";

router.post(rootRoute + "publish", auth, async (req, res) => {
    try {
        if (!req.body.publishers || req.body.publishers.length === 0)
            throw new Error(
                "Apartment's publishers are missing, must include at least one (name, phone number)"
            );

        let apartmentObj = getApartmentObj(req.body, [...req.body.publishers], req.user._id);

        const apartment = new Apartment(apartmentObj);
        await apartment.save();

        res.status(201).send(apartment._id);
    } catch (err) {
        console.log(err.message, "42");
        res.status(400).send(err);
    }
});

router.post(
    rootRoute + "publish/upload-files",
    auth,
    validateApartment,
    uploadFilesToS3,
    async (req, res) => {
        if (!req.files) {
            return res.status(422).send({
                status: 422,
                message: "file not uploaded",
            });
        }

        try {
            await req.apartment.populate("files").execPopulate();
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
                    isMainFile: isFirstFileOfApartment,
                });
                fileObjectsSavesPromises.push(file.save());
                if (isFirstFileOfApartment) isFirstFileOfApartment = false; // Makes sure only the first file is saved as the main one
            }
            const values = await Promise.allSettled(fileObjectsSavesPromises);
            values.forEach((value) => {
                if (value.status === "fulfilled") files.push(value.value);
            });

            res.status(201).send(files);
        } catch (err) {
            console.log(err.message, "42");
            res.status(500).send(err);
        }
    }
);

const apartmentModelStrFields = [
    "type",
    "condition",
    "town",
    "streetName",
    "description",
    "furnitureDescription",
];
const apartmentModelBoolFields = [
    "hasAirConditioning",
    "hasFurniture",
    "isRenovated",
    "hasSafeRoom",
    "isAccessible",
    "hasKosherKitchen",
    "hasShed",
    "hasLift",
    "hasSunHeatedWaterTanks",
    "hasPandorDoors",
    "hasTadiranAc",
    "hasWindowBars",
    "isImmediate",
];
const apartmentModelNumFields = [
    "houseNum",
    "floor",
    "buildingMaxFloor",
    "numberOfRooms",
    "numberOfParkingSpots",
    "numberOfBalconies",
    "price",
    "builtSqm",
    "totalSqm",
    "date",
];

const addStrAndBoolQueries = (strAndBoolQueries, key, value) => {
    let modelKey;
    switch (key) {
        case "town":
        case "streetName":
            modelKey = `location.${key}`;
            break;
        case "isImmediate":
            modelKey = `entranceDate.${key}`;
            break;
        default:
            modelKey = `properties.${key}`;
    }

    if (key === "description") {
        strAndBoolQueries.push({
            [`${modelKey}`]: {
                $regex: `${value.substring(0, 400)}`,
            },
        });
        return;
    }

    strAndBoolQueries.push({ [`${modelKey}`]: value });
};

const addNumQueries = (numericQueries, field, key, value) => {
    let modelKey;
    switch (field) {
        case "houseNum":
        case "floor":
        case "buildingMaxFloor":
            modelKey = `location.${field}`;
            break;
        case "builtSqm":
        case "totalSqm":
            modelKey = `size.${field}`;
            break;
        case "date":
            modelKey = `entranceDate.${field}`;
            break;
        case "price":
            modelKey = field;
            break;
        default:
            modelKey = `properties.${field}`;
    }

    let isMin = key.substring(0, 3) === "min";
    isMin
        ? numericQueries.push({
              [modelKey]: {
                  $gte: value,
              },
          })
        : numericQueries.push({
              [modelKey]: {
                  $lte: value,
              },
          });
};

const getApartmentSearchQuery = (strAndBoolQueries, numericQueries, orQueries) => {
    return {
        $and: [
            ...strAndBoolQueries,
            ...numericQueries,
            orQueries.length > 0
                ? {
                      $or: [...orQueries],
                  }
                : {},
        ],
    };
};

router.get(rootRoute, async (req, res) => {
    const apartmentsPollLimit = 10;
    const params = req.query;
    if (!params.types) params.types = [];
    if (!params.conditions) params.conditions = [];

    const strAndBoolQueries = [];
    const numericQueries = [];
    const orQueries = [];

    for (let [key, value] of Object.entries(params)) {
        if (apartmentModelStrFields.includes(key) || apartmentModelBoolFields.includes(key)) {
            addStrAndBoolQueries(strAndBoolQueries, key, value);
            continue;
        }

        let field = key.substring(4); // "Omits the min- or max- label"
        if (apartmentModelNumFields.includes(field))
            addNumQueries(numericQueries, field, key, value);
    }

    for (let type of params.types) orQueries.push({ type: type });
    for (let condition of params.conditions) orQueries.push({ condition: condition });

    try {
        const apartments = await Apartment.find(
            getApartmentSearchQuery(strAndBoolQueries, numericQueries, orQueries)
        )
            .limit(apartmentsPollLimit)
            .skip(parseInt(req.query.skipCounter));

        let populateFilesPromises = [];
        for (apartment of apartments)
            populateFilesPromises.push(apartment.populate("files").execPopulate());

        await Promise.allSettled(populateFilesPromises);
        let apartmentObjects = apartments.map((apartment) => ({
            apartment,
            files: apartment.files || [],
        }));

        res.status(200).send(apartmentObjects || []);
    } catch (err) {
        res.status(500).send(err);
    }
});

router.get(rootRoute + "get-file", getFileFromS3, async (req, res) => {
    try {
        const stream = Readable.from(req.fileBuffer);

        const fileName = req.query.key.substring(req.query.key.lastIndexOf("/") + 1);

        if (req.query.download === "true") {
            res.setHeader("Content-Disposition", "attachment; filename=" + fileName);
        } else {
            res.setHeader("Content-Disposition", "inline");
        }

        stream.pipe(res);
    } catch (err) {
        console.log(err);
        res.status(500).send(err);
    }
});

module.exports = router;
