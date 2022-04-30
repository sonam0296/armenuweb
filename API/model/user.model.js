const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const { string, boolean } = require('joi');
dotenv.config();
const link = "https://appetizar.nyc3.digitaloceanspaces.com/1611485121216-default.jpg"
const image_name = "1611485121216-default.jpg"

const socialCredential = new mongoose.Schema({
	socialId: {
		type: String,
		default: null
	},
	socialProvider: {
		type: String,
		default: null
	}
});


const workingHours = new mongoose.Schema({
	weekDay: {
		type: Number,
		default: undefined
	},
	isChecked: {
		type: Boolean,
		default: false
	},
	openingTime: {
		type: String,
		default: undefined
	},
	closingTime: {
		type: String,
		default: undefined
	},
});
const UserModel = new mongoose.Schema({
	name: {
		type: String,
		default: null
	},
	email: {
		type: String,
		default: null
	},
	password: {
		type: String,
		default: null,
		select: false
	},
	phone: {
		type: String,
		default: undefined,
		unique: [true, 'phone must be unique'],
		sparse: true
	},
	is_phone_verified: {
		type: Boolean,
		default: function () {
			if (this.userType === "client" || this.userType === "driver") {
				return false;
			} else {
				return undefined;
			}
		}
	},
	dial_code: {
		type: String,
		default: undefined
	},
	country_name: {
		type: String,
		default: undefined
	},
	country_code: {
		type: String,
		default: undefined
	},
	address: [{
		user_address: {
			type: String,
			default: undefined
		},
		landmark: {
			type: String,
			default: undefined
		},
	}],
	userType: {
		type: String,
		enum: [
			"admin",
			"owner",
			"client",
			"driver",
			"driver_aggregator",
		],
	},
	profile_image: {
		image_name: {
			type: String,
			default: image_name
		},
		image_url: {
			type: String,
			default: link
		}
	},
	currencies: {
		code: {
			type: String,
			default: undefined
		},
		curr_name: {
			type: String,
			default: undefined
		},
		symbol: {
			type: String,
			default: undefined
		},
		zero_decimal_currencies: {
			type: Boolean,
			default: false
		}
	},
	language_preference: {
		type: String,
		default: 'en',
	},
	user_languages: [{
		iso639_1: {
			type: String,
			default: undefined
		},
		iso639_2: {
			type: String,
			default: undefined
		},
		name: {
			type: String,
			default: undefined
		},
		nativeName: {
			type: String,
			default: undefined
		}
	}],
	favorite_dish: [{
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Menus',
		default: function () {
			if (this.userType === "client") {
				return null;
			} else {
				return undefined;
			}
		}
	}],
	favorite_restaurant: [{
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User',
		default: function () {
			if (this.userType === "client") {
				return null;
			} else {
				return undefined;
			}
		}
	}],

	location: {
		type: {
			type: String, // Don't do `{ location: { type: String } }`
			enum: ['Point'], // 'location.type' must be 'Point'
			default: undefined
		},
		coordinates: {
			type: [Number],
			default: undefined
		}
	},
	delivery_area: {
		type: {
			type: String, // Don't do `{ location: { type: String } }`
			enum: ['MultiPolygon'], // 'location.type' must be 'Polygon'
			default: undefined
		},
		coordinates: {
			type: [[[[Number]]]], // Array of arrays of arrays of numbers
			default: undefined
		}
	},


	// ------------restaurants details---------------
	raz_account_id: {
		type: String,
		default: undefined
	},
	is_stripe_connected: {
		type: Boolean,
		default: function () {
			if (this.userType === "owner") {
				return false;
			} else {
				return undefined;
			}
		}
	},
	stripe_customer: {
		type: Object,
		default: undefined
	},
	razor_customer: {
		type: Object,
		default: undefined
	},
	stripe_account: {
		stripe_user_id: {
			type: String,
			default: undefined
		},
		details_submitted: {
			type: Boolean,
			default: undefined
		},
		stripe_account_status: {
			type: Array,
			default: undefined
		}
	},


	// -----subscription status --------
	subscription_status: {
		subscription_id: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Subscriptions',
			default: undefined
		},
		stripe_subscription_id: {
			type: String,
			default: undefined
		},
		razor_subscription_id: {
			type: String,
			default: undefined
		},
		razor_oto_id: {   //oto = one time order id
			type: String,
			default: undefined
		},
		razor_otpm_id: {   //ots = one time payment id
			type: String,
			default: undefined
		},
		current_period_end: {
			type: Number,
			default: undefined
		},
		status: {
			type: String,
			enum: [
				// --stripe --
				"active",
				"past_due",
				"unpaid",
				"canceled",
				"incomplete",
				"incomplete_expired",
				"trialing",
				"not_started",
				"deprecated",
		
				// --razor pay --
				"created",
				"authenticated",
				"activated",
				"charged",
				"completed",
				"updated",
				"pending",
				"halted",
				"cancelled",
				"paused",
				"resumed",

				// ---default status ---
				"no_plan_selected"
			],
			default: function () {
				if (this.userType === "owner" || this.userType === "driver_aggregator") {
					return "no_plan_selected";
				} else {
					return undefined;
				}
			}
		},
		is_trial_used: {
			type: Boolean,
			default: function () {
				if (this.userType === "owner" || this.userType === "driver_aggregator") {
					return null;
				} else {
					return undefined;
				}
			}
		},
		is_schedule_awaiting: {
			type: Boolean,
			default: undefined
		},
		stripe_sub_schedule_id: {
			type: String,
			default: undefined
		},
		message: {
			type: String,
			default: undefined
		}
	},
	master_brand: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User',
		default: undefined
	},
	is_outlet: {
		type: Boolean,
		default: function () {
			if (this.userType === "owner") {
				return false;
			} else {
				return undefined;
			}
		},
	},
	restaurant_Name: {
		type: String,
		default: undefined
	},
	hosting_Address: {
		type: String,
		default: function () {
			if (this.userType === "owner" || this.userType === "admin") {
				return null;
			} else {
				return undefined;
			}
		},
	},
	restaurant_Description: {
		type: String,
		default: undefined
	},
	restaurant_Address: {
		type: String,
		default: undefined
	},
	restaurant_city: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Cities',
		default: undefined
	},
	restaurant_Minimum_order: {
		type: Number,
		default: undefined
	},
	restaurant_ratings: {
		type: Number,
		default: function () {
			if (this.userType === "owner") {
				return 0;
			} else {
				return undefined;
			}
		},
		max: 5
	},
	self_service: {
		type: Boolean,
		default: function () {
			if (this.userType === "owner") {
				return false;
			} else {
				return undefined;
			}
		},
	},
	qrcode: {
		type: String,
		default: undefined
	},
	total_reviews: {
		type: Number,
		default: function () {
			if (this.userType === "owner") {
				return 0;
			} else {
				return undefined;
			}
		},
	},
	Working_hours: {
		type: [workingHours],
		default: undefined
	},
	restaurant_image: {
		image_name: {
			type: String,
			default: undefined
		},
		image_url: {
			type: String,
			default: undefined
		}
	},
	restaurant_cover_image: {
		image_name: {
			type: String,
			default: undefined
		},
		image_url: {
			type: String,
			default: undefined
		}
	},
	default_image: {
		image_name: {
			type: String,
			default: undefined
		},
		image_url: {
			type: String,
			default: undefined
		}
	},
	IsFeatured: {
		type: Boolean,
		default: undefined
	},
	fee_percent: {
		type: Number,
		default: undefined
	},
	static_fee: {
		type: Number,
		default: undefined
	},
	delivery_charge: {
		type: Number,
		default: function () {
			if (this.userType === "dummy_aggregator") {
				return null;
			} else {
				return undefined;
			}
		}
	},
	driver_capacity: {
		type: Number,
		default: function () {
			if (this.userType === "dummy_aggregator") {
				return null;
			} else {
				return undefined;
			}
		}
	},
	isActive: {
		type: Boolean,
		default: false
	},
	otp: {
		type: Number,
		select: false
	},
	otpExpire: {
		type: Date,
		select: false
	},
	socialCredentials: {
		type: [socialCredential],
		default: []
	},
	Mobile_user: {
		type: Array,
		default: undefined
	},
	fcm_registration_token: {
		type: Array,
		default: undefined
	},
	resetOTP: {
		type: String,
		select: false
	},
	resetPasswordExpire: {
		type: Date,
		select: false
	},
	employer_id: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User',
		default: undefined
	},
	aggregator_id: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User',
		default: undefined
	},
	use_driver_aggregator: {
		type: Boolean,
		default: function () {
			if (this.userType === "owner") {
				return false;
			} else {
				return undefined;
			}
		}
	},
	isRestaurantDrivers: {
		type: Boolean,
		default: function () {
			if (this.userType === "driver") {
				return false;
			} else {
				return undefined;
			}
		}
	},
	isAggregatorDrivers: {
		type: Boolean,
		default: function () {
			if (this.userType === "driver") {
				return false;
			} else {
				return undefined;
			}
		}
	}

}, {
	timestamps: true
});
// Encrypt password using bcrypt
UserModel.methods.encryptPassword = async function (password) {
	const salt = await bcrypt.genSalt(10);
	const encryptedPassword = await bcrypt.hash(password, salt);
	return encryptedPassword;
};

// Match user entered password to hashed password in database
UserModel.methods.matchPassword = async function (enteredPassword) {
	return await bcrypt.compare(enteredPassword, this.password);
};

// generate JWT token and return
UserModel.methods.generateJWTToken = function () {
	return jwt.sign({
		id: this._id,
		email: this.email,
		userType: this.userType
	}, process.env.JWT_SECRET);
}

module.exports = mongoose.model('User', UserModel);