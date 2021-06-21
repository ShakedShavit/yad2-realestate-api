const AWS = require('aws-sdk');
const multer = require('multer');
const multerS3 = require('multer-s3');

const s3 = new AWS.S3({ region: process.env.AWS_REGION });
const bucket = process.env.S3_BUCKET;

const fileStorage = multerS3({
    s3,
    acl: 'private', //'public-read',
    contentType: multerS3.AUTO_CONTENT_TYPE,
    contentDisposition: (req, file, cb) => {
        cb(null, "inline; filename=" + file.originalname);
    },
    bucket,
    metadata: (req, file, cb) => {
        cb(null, {fieldName: file.fieldname});
    },
    key: (req, file, cb) => {
        const folderName = file.mimetype.split('/')[0] + "s/";
        const subFolderName = req.query.apartmentId + "/";
        const fileName = folderName + subFolderName + new Date().getTime() + '-' + file.originalname;
        cb(null, fileName);
    }
});

const uploadFilesToS3 = multer({ storage: fileStorage }).array("files", 10);

const getFileFromS3 = async (req, res, next) => {
    const Key = req.query.key;

    try {
        const { Body } = await s3.getObject({
            Key,
            Bucket: bucket
        }).promise();

        req.fileBuffer = Body;
        next();
    } catch (err) {
        console.log(err);
    }
};

const deleteFileFromS3 = async (req, res, next) => {
    try {
        deleteFileFromS3Util(req.body.key);
        next();
    } catch(err) {
        res.status(404).send({
            message: "File not found",
            err
        });
    }
};

const deleteFileFromS3Util = async (Key) => {
    try {
        await s3.deleteObject({
            Key,
            Bucket: bucket
        }).promise();
    } catch(err) {
        throw new Error(err);
    }
}

module.exports = {
    uploadFilesToS3,
    deleteFileFromS3,
    deleteFileFromS3Util,
    getFileFromS3
};