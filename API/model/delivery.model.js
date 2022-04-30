const mongoose = require("mongoose")

const link = "https://appetizar.nyc3.digitaloceanspaces.com/1611485121216-default.jpg";
const image_name = "1611485121216-default.jpg";

const CouponModel = new mongoose.Schema({
    owner_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: undefined
    },
    coupon_code: {
        type: String,
        default: undefined
    },
    flat_discount: {
        type: Boolean,
        default: false
    },
    coupon_terms: {
        type: String,
        default: undefined
    },
    coupon_weight: {
        type: Number,
        default: undefined
    },
    coupon_threshold: {
        type: Number,
        default: undefined
    },
    coupon_archive: {
        type: Boolean,
        default: false
    },
    item_image:{
        image_name: {
			type: String,
			default: image_name
		},
		image_url: {
			type: String,
			default: link
		}
    },
},
    {
        timestamps: true
    }
)
module.exports = mongoose.model("Coupon", CouponModel)