const path = require('path');
const multer = require('multer');
const httpStatus = require('http-status');
const APIError = require('../helpers/APIError');
const multerS3 = require('multer-s3')
const fs = require("fs")
const dotenv = require('dotenv');
const moment = require('moment')
dotenv.config();

const AWS = require("aws-sdk");

AWS.config.loadFromPath('./config/config.json');

let bucketName = process.env.Bucket_Name
const spacesEndpoint = new AWS.Endpoint('nyc3.digitaloceanspaces.com');
// let s3 = new AWS.S3({ params: { Bucket: bucketName } })
let s3 = new AWS.S3({
	endpoint: spacesEndpoint
});

//QR code Uploading....
const qrupload = async (filename,next) => {

	try {
		let filecontent = fs.readFileSync("./uploads/" + filename)
		const params = {
			Bucket: bucketName,
			Key: filename,
			Body: filecontent,
			ACL: 'public-read',
			ContentType: "image/png",
			ContentDisposition: "inline"
		}

		let imageurl = await s3.upload(params).promise()

		let url = imageurl.Location
		return url
	} catch (e) {
		return next(new APIError(e.message, httpStatus.BAD_REQUEST, true));
	}


}

// ------multer image storage------

let storage = multerS3({
	s3: s3,
	bucket: bucketName,
	acl: 'public-read',
	contentType: multerS3.AUTO_CONTENT_TYPE,
	metadata: function (req, file, cb) {

		cb(null, { fieldName: file.fieldname });
	},
	key: function (req, file, cb) {

		cb(null, moment.now() + '-' + file.originalname)
	}
})
const upload = multer({

	storage: storage,
	// file type
	fileFilter: function (req, file, callback) {
		const ext = path.extname(file.originalname);
		if (ext !== '.png' && ext !== '.jpg' && ext !== '.gif' && ext !== '.jpeg'
			&& ext !== '.pdf' && ext !== '.docx' && ext !== '.tif' && ext !== '.webp') {
			return callback(new APIError(
				'only files with extension Image/Document is allowed to upload.',
				httpStatus.BAD_REQUEST,
				true
			));
		}
		callback(null, true);
	},
	limits: {
		fileSize: 1024 * 1024 * 10
	}

});




module.exports = {
	upload,
	qrupload
};
