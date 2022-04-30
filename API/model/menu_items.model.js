const mongoose = require('mongoose');

const link = "https://appetizar.nyc3.digitaloceanspaces.com/1611485121216-default.jpg";
const image_name = "1611485121216-default.jpg";

const outlets = new mongoose.Schema({
	outlet_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: undefined
    },
    item_available: {
        type: Boolean,
        default: true
    }
});

const MenusModel = new mongoose.Schema({
    //---------- user id-----------
    owner_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    outlets: {
		type: [outlets],
		default: []
	},
    menu_category_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MenuCategory',
        default: null
    },
    item_name: {
        type: String,
        default: null
    },
    recommend: {
        type: Boolean,
        default: false
    },
    veg: {
        type: Boolean,
        default: true
    },
    item_description: {
        type: String,
        default: null
    },
    item_price: {
        type: Number,
        default: null
    },
    order_count: {
        type: Number,
        default: 0
    },
    dish_rating: {
        type: Number,
        default: 0,
        max:5
    },
    total_reviews: {
        type: Number,
        default: 0
    },
    vat_percentage: {
        type: Number,
        default: null
    },
    item_available: {
        type: Boolean,
        default: true
    },
    enable_variants: {
        type: Boolean,
        default: true
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
},{
    timestamps: true
});

module.exports = mongoose.model('Menus', MenusModel)