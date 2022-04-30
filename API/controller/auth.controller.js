const httpStatus = require('http-status');
const dotenv = require('dotenv');
const APIError = require('../helpers/APIError');
const resPattern = require('../helpers/resPattern');
const sendSMS = require('../helpers/sendSMS');
const User = require('../model/user.model');
const { sendEmail, mail_template } = require('../helpers/sendEmail');
dotenv.config();
const fs = require("fs")
const QRcode = require("qrcode");
const { qrupload } = require('../helpers/fileUpload');
const { i18_translate, translate_meta } = require('../helpers/i18n');
const stripeHelper = require("../helpers/stripe.payment");
const mongoose = require('mongoose');
const generator = require("generate-password");
const razorHelper = require("../helpers/razor.payment");

// temporary created function for mailing without creating doc
const var_controller = async (req, res) => {
	const reqData = req.body;

	const payload = {
		data: reqData,
		template: "place_order",
	}
	const result = await mail_template(payload);
	let obj = resPattern.successPattern(httpStatus.OK, result, 'success');
	return res.status(obj.code).json(obj);
}

// ---- registration through mobile -----
const mobi_registration = async (req, res, next) => {
	try {
		// find user by phone and check.
		const requestData = req.body;
		const user = await User.findOne({ phone: requestData.phone });
		if (user && user.is_phone_verified) {
			const token = user.generateJWTToken();
			let obj = resPattern.successPattern(httpStatus.OK, { user: user, token }, 'success');
			return res.status(obj.code).json(obj);
		}
		if (requestData.phone && !user) {
			const encryptPassword = await new User().encryptPassword(requestData.password);
			let newUser = await User.create({
				phone: requestData.phone,
				password: encryptPassword,
				country_name: requestData.country_name,
				country_code: requestData.country_code,
				dial_code: requestData.dial_code,
				userType: requestData.userType,
				is_phone_verified: true,
			});
			const token = newUser.generateJWTToken();
			newUser.password = undefined;
			// response data
			// send response.
			let obj = resPattern.successPattern(httpStatus.OK, { user: newUser, token }, 'success');
			return res.status(obj.code).json(obj);

		}
	} catch (e) {
		return next(new APIError(e.message, httpStatus.BAD_REQUEST, true));
	}
}

// verify otp
const verifyOTP = async (req, res, next) => {
	try {
		// find user by phone and check.
		const phone = req.body.phone ? req.body.phone : undefined;
		const otp = req.body.otp;
		let user = await User.findOne({ $and: [{ otp: otp }, { phone: phone }] });

		if (!user) {
			const message = `Invalid OTP.`;
			return next(new APIError(message, httpStatus.BAD_REQUEST, true));
		}

		// get OTP and check OTP with expired time
		let checkOTP = await User.findOne({
			phone,
			otp,
			otpExpire: { $gt: Date.now() }
		}).select('+otp +otpExpire').lean();

		if (!checkOTP) {
			const message = 'The OTP has expired,resend the OTP.'
			return next(new APIError(message, httpStatus.BAD_REQUEST, true));
		}

		// update user if OTP is valid
		let updatedData = await User.findByIdAndUpdate(checkOTP._id, {
			$set: {
				otp: undefined,
				otpExpire: undefined,
				isActive: true,
				is_phone_verified: true
			}
		}, { new: true });

		// response data
		updatedData.password = undefined;
		const resData = updatedData;

		// send response.
		let obj = resPattern.successPattern(httpStatus.OK, resData, 'success');
		return res.status(obj.code).json(obj);
	} catch (e) {
		return next(new APIError(e.message, httpStatus.BAD_REQUEST, true));
	}
}

// social authentication
const socialAuth = async (req, res, next) => {
	try {
		const requestData = req.body;

		// get user by email/phone
		let user = await User.findOne({ email: requestData.email });
		if (user) {
			// ------ user found --------
			if (user.socialCredentials.length > 0) {
				const socialCredentials = user.socialCredentials;
				const length = socialCredentials.length;
				let flag = false;
				for (let i = 0; i < length; i++) {
					if (socialCredentials[i].socialProvider === requestData.socialProvider) {
						flag = true;
						if (flag) {
							if (socialCredentials[i].socialId == requestData.socialId) {
								// ------ log in with existing social id success-------
								if (requestData.fcm_registration_token) {
									await User.findOneAndUpdate({ _id: user._id }, {
										$addToSet: { 'fcm_registration_token': requestData.fcm_registration_token }
									}, { new: true });									// user = await User.findById(user._id);
								}
								socialAuthResponse(user, res);
							}
							else {
								// ------ log in with existing social id success-------
								const message = `Login with ${requestData.socialProvider} failed.`
								return next(new APIError(message, httpStatus.BAD_REQUEST, true));
							}
						}

					}
				}
				if (!flag) {
					// merge new social auth to existing social user
					const social_credentials = {
						socialId: requestData.socialId,
						socialProvider: requestData.socialProvider
					}
					await User.findOneAndUpdate({ _id: user._id }, {
						$addToSet: {
							socialCredentials: social_credentials
						}
					}, { new: true });
					user = await User.findById(user._id);
					socialAuthResponse(user, res);
				}

			} else {
				// merge social auth to existing manual user

				user.socialCredentials.push({
					socialId: requestData.socialId,
					socialProvider: requestData.socialProvider
				});
				if (requestData.fcm_registration_token) {
					await User.findOneAndUpdate({ _id: user._id }, {
						$addToSet: { 'fcm_registration_token': requestData.fcm_registration_token }
					}, { new: true });
					user = await User.findById(user._id);
				}
				user = await user.save();
				socialAuthResponse(user, res);
			}
		} else {
			const newUser = await User.create({
				name: requestData.name,
				email: requestData.email,
				phone: requestData.phone,
				country_name: requestData.country_name,
				country_code: requestData.country_code,
				dial_code: requestData.dial_code,
				isActive: requestData.userType == "owner" ? false : true,
				userType: requestData.userType,
				user_languages: requestData.user_languages ? requestData.user_languages : undefined,
				currencies: requestData.currencies ? requestData.currencies : undefined,
				fcm_registration_token: requestData.fcm_registration_token,
				socialCredentials: {
					socialId: requestData.socialId,
					socialProvider: requestData.socialProvider
				}
			});

			socialAuthResponse(newUser, res);
		}
	} catch (e) {
		return next(new APIError(e.message, httpStatus.BAD_REQUEST, true));
	}
}

// generate response data and send
function socialAuthResponse(user, res) {
	// response data
	user.password = undefined;
	const resData = user;

	const token = user.generateJWTToken();

	// // send response.
	let obj = resPattern.successPattern(httpStatus.OK, { user: resData, token }, 'success');
	return res.status(obj.code).json(obj);
}
// create user - manual
const createUser = async (req, res, next) => {
	try {
		const requestData = req.body;
		const domain = requestData.userType === 'owner' ? requestData.restaurant_Name.replace(/ +/g, "").trim().toLowerCase() + ".appetizar.io" : undefined;
		
		// find user by email and verify  
		// if(requestData.userType === 'owner' || requestData.userType === 'driver_aggregator'){
		let userByEmail = await User.findOne({
			email: requestData.email
		});
		if (userByEmail) {
			const message = `User already exist with email: '${requestData.email}'.`
			return next(new APIError(message, httpStatus.BAD_REQUEST, true));
		}
		if (!requestData.is_outlet && await User.findOne({
			userType: "owner", hosting_Address: domain
		})) {
			const message = `The sub-domain ${domain} is already reserved. please try another value.`
			return next(new APIError(message, httpStatus.BAD_REQUEST, true));
		}
	// }
	
		const encryptPassword = await new User().encryptPassword(requestData.password);
		let user = new User({
			name: requestData.name,
			restaurant_Name: requestData.restaurant_Name,
			email: requestData.email,
			country_name: requestData.country_name,
			country_code: requestData.country_code,
			dial_code: requestData.dial_code,
			phone: requestData.phone,
			hosting_Address: domain,
			user_languages: requestData.user_languages,
			currencies: requestData.currencies,
			password: encryptPassword,
			userType: requestData.userType,
			isActive: requestData.userType == "owner" ? false : true
		});
		const zero_decimal_country = ["bi",
			"cl",
			"dj",
			"gn",
			"jp",
			"km",
			"kr",
			"mg",
			"py",
			"rw",
			"ug",
			"vn",
			"vu",
		]
	
		user.currencies.zero_decimal_currencies = zero_decimal_country.includes(requestData.country_code);
		let stripe_customer = undefined;
		if ((requestData.userType == "owner" && !requestData.is_outlet) || requestData.userType == "driver_aggregator") {
			if (user.country_code === 'in') {
				user.razor_customer = await razorHelper.customer(user);
			} else {
				stripe_customer = await stripeHelper.create_customer(user);
				user.stripe_customer = stripe_customer;
			}
		}
		if (requestData.userType == "owner") {
			user.restaurant_Name = requestData.restaurant_Name;
			if (requestData.is_outlet) {
				const payload = {
					email: user.email,
					subject: `Out let registration for ${user.restaurant_Name}`,
					message: `Greetings from Appetizar, your Outlet account for restaurant ${user.restaurant_Name} has been created successfully and your login password is:\n ${requestData.password}\n(Please do not share)`,
				}
				await sendEmail(payload);
				user.is_outlet = requestData.is_outlet;
				user.master_brand = mongoose.Types.ObjectId(requestData.master_brand);
			} else {
				const filename = Date.now() + "-" + `${user.restaurant_Name}` + "-qrcode.png"
				const path = "./uploads/" + filename

				await QRcode.toFile(path, `${user.hosting_Address}`)

				let url = await qrupload(filename, next)

				fs.unlinkSync(path)

				user.qrcode = url
			}
		}
		await user.save();
		if (user) {
			user.password = undefined;

			const payload = {
				data: user,
				template: "welcome",
			}
			await mail_template(payload);

			const token = user.generateJWTToken();
			let obj = resPattern.successPattern(httpStatus.CREATED, { user: user, token }, 'success');
			return res.status(obj.code).json(obj);
		} else {
			const errorMsg = 'Something went wrong while registering user.';
			return next(new APIError(errorMsg, httpStatus.BAD_REQUEST, true));
		}
	} catch (e) {
		return next(new APIError(e.message, httpStatus.BAD_REQUEST, true));
	}
}

// login
const loginUser = async (req, res, next) => {
	try {
		const { email, password, fcm_registration_token, phone } = req.body;
		// find user by email
		let user = undefined;
		if (email) {
			user = await User.findOne({ email }).select('+password');
		}
		if (phone) {
			user = await User.findOne({ phone }).select('+password');
		}

		if (!user || user.password === null) {
			return next(new APIError('Incorrect email or password.', httpStatus.UNAUTHORIZED, true));
		}

		// Check if password matches
		const isMatch = await user.matchPassword(password);
		if (!isMatch) {
			return next(new APIError('Incorrect email or password.', httpStatus.UNAUTHORIZED, true));
		}
		if (fcm_registration_token) {
			await User.findOneAndUpdate({ _id: user._id }, {
				$addToSet: { 'fcm_registration_token': fcm_registration_token }
			}); user = await User.findById(user._id);
		}
		// generate JWT token
		const token = user.generateJWTToken();
		user.password = undefined;
		// send response
		let obj = resPattern.successPattern(httpStatus.OK, { user: user, token }, 'success');
		return res.status(obj.code).json(obj);
	} catch (e) {
		return next(new APIError(e.message, httpStatus.BAD_REQUEST, true));
	}
}

// logout
const logoutUser = async (req, res, next) => {
	try {
		const loggedInUser = req.user;
		const reqData = req.body;
		let mobile_user = undefined;
		// if the regi_token is set to true means the fcm token is deprecated so pull the token from db
		if (reqData.deviceToken) {
			mobile_user = await User.findByIdAndUpdate(loggedInUser._id, {
				$pull: { 'Mobile_user': reqData.deviceToken }
			}, { new: true });
		}
		if (reqData.fcm_regi_token === true) {
			if (reqData.fcm_registration_token) {
				mobile_user = await User.findByIdAndUpdate(loggedInUser._id,
					{
						$pull: { "fcm_registration_token": reqData.fcm_registration_token }
					}, { new: true })
			}
		}
		//response data
		if (mobile_user) {
			const resData = {
				message: "User logged out successfully"
			}
			// send response
			let obj = resPattern.successPattern(httpStatus.OK, { user: resData }, 'success');
			return res.status(obj.code).json(obj);
		}

	} catch (e) {
		return next(new APIError(e.message, httpStatus.BAD_REQUEST, true));
	}
}

const refreshtoken = async (req, res, next) => {
	try {
		const loggedInUser = req.user;
		const reqData = req.body;
		let mobile_user = undefined;

		if (reqData.fcm_deprecated_token) {

			mobile_user = await User.findByIdAndUpdate(loggedInUser._id,
				{
					$pull: { "fcm_registration_token": reqData.fcm_deprecated_token }
				}, { new: true }
			);

		}

		if (reqData.fcm_regi_token === true) {
			if (reqData.fcm_registration_token) {
				mobile_user = await User.findByIdAndUpdate(loggedInUser._id,
					{
						$addToSet: { "fcm_registration_token": reqData.fcm_registration_token }
					}, { new: true }
				)
			}
		}
		//response data

		// send response
		let obj = resPattern.successPattern(httpStatus.OK, { user: mobile_user }, 'success');
		return res.status(obj.code).json(obj);


	} catch (e) {
		return next(new APIError(e.message, httpStatus.BAD_REQUEST, true));
	}
}

// change user password
const changePassword = async (req, res, next) => {
	try {
		const requestData = req.body;
		// get current user password
		let user = await User.findById(req.user._id).select('+password');

		// verify old password
		const isMatch = await user.matchPassword(requestData.oldPassword);
		if (!isMatch) {
			return next(new APIError('Mismatch old password.', httpStatus.UNAUTHORIZED, true));
		}

		// update password
		const hashedPassword = await user.encryptPassword(requestData.newPassword);
		user = await User.findByIdAndUpdate(req.user._id, {
			password: hashedPassword
		}, { new: true });

		// send response
		let obj = resPattern.successPattern(httpStatus.OK, 'password changed', 'success');
		return res.status(obj.code).json(obj);
	} catch (e) {
		return next(new APIError(e.message, httpStatus.BAD_REQUEST, true));
	}
}

// forgot user password
const forgotPassword = async (req, res, next) => {
	try {
		const requestedEmail = req.body.email;
		const language_preference = req.body.language_preference;

		// find user
		const user = await User.findOne({ email: requestedEmail });

		// --- translate on user preference ---

		translate_meta.lan = user ? user.language_preference : language_preference;
		translate_meta.key = user ? 'forgot_password.message' : 'forgot_password.userNotFound';
		translate_meta.interpolation = {
			requestedEmail: requestedEmail,
			resetOTP: undefined
		}


		if (!user) {
			const message = `User not found with email: '${requestedEmail}.`;
			// return await i18_translate_err(translate_meta, next);
			return next(new APIError(message, httpStatus.BAD_REQUEST, true));
		}

		// Get reset token
		const resetOTP = generateOTP();
		translate_meta.interpolation.resetOTP = resetOTP;
		// Hash token and set to resetPasswordToken field

		// Set expire
		const resetPasswordExpire = new Date();
		resetPasswordExpire.setMinutes(resetPasswordExpire.getMinutes() + 5);

		try {
			// save reset token and expire date
			await User.findByIdAndUpdate(user._id, {
				resetOTP,
				resetPasswordExpire
			}, { new: true }).select('+resetOTP +resetPasswordExpire').lean();
			translate_meta.payload = {
				email: user.email,
				subject: 'Appetizar Password reset token',
				// message
			}

			//  translate mail and send to client's mail
			await i18_translate(translate_meta, sendEmail);

			// send response
			let obj = resPattern.successPattern(httpStatus.OK, { message: 'Email sent successfully', email: user.email }, 'success');
			return res.status(obj.code).json(obj);
		} catch (e) {
			user.resetPasswordToken = undefined;
			user.resetPasswordExpire = undefined;
			return next(new APIError(e.message, httpStatus.BAD_REQUEST, true));
		}
	} catch (e) {
		return next(new APIError(e.message, httpStatus.BAD_REQUEST, true));
	}
}

// reset user password
const reset_otp_verify = async (req, res, next) => {
	try {
		// Get hashed token
		const resetOTP = req.body.OTP;
		const mail = req.body.email;

		// find user and verify
		let user = await User.findOne({
			resetOTP: resetOTP,
			email: mail,
			resetPasswordExpire: { $gt: Date.now() }
		});
		if (!user) {
			return next(new APIError('OTP invalid or expired', httpStatus.BAD_REQUEST, true));
		}
		// send response
		let obj = resPattern.successPattern(httpStatus.OK, 'OTP Verified', 'success');
		return res.status(obj.code).json(obj);
	} catch (e) {
		return next(new APIError(e.message, httpStatus.BAD_REQUEST, true));
	}
}

// reset user password
const resetPassword = async (req, res, next) => {
	try {
		// Get hashed token
		const email = req.body.email;
		const newPassword = req.body.password;

		// find user and verify
		let user = await User.findOne({
			email: email,
			resetPasswordExpire: { $gt: Date.now() }
		});

		if (!user) {
			return next(new APIError('OTP invalid or expired', httpStatus.BAD_REQUEST, true));
		}

		// Set new password
		const hashedPassword = await user.encryptPassword(newPassword);
		user.password = hashedPassword;
		user.resetOTP = undefined;
		user.resetPasswordExpire = undefined;
		await user.save();

		// send response
		let obj = resPattern.successPattern(httpStatus.OK, 'password changed', 'success');
		return res.status(obj.code).json(obj);
	} catch (e) {
		return next(new APIError(e.message, httpStatus.BAD_REQUEST, true));
	}
}

// generate OTP
function generateOTP() {
	const digits = '123456789';
	let otp = '';
	for (let i = 1; i <= 6; i++) {
		let index = Math.floor(Math.random() * (digits.length));
		otp = otp + digits[index];
	}
	return otp;
}

module.exports = {
	mobi_registration,
	verifyOTP,
	socialAuth,
	createUser,
	loginUser,
	logoutUser,
	changePassword,
	forgotPassword,
	reset_otp_verify,
	resetPassword,
	refreshtoken,
	var_controller
};
