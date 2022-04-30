const { string } = require('joi');
const mongoose = require('mongoose');

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

const MenuCategoryModel = new mongoose.Schema({

    owner_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    outlets: {
		type: [outlets],
		default: []
	},
    category: {
        type: String,
        default: null
    },
    category_image: {
        image_name: {
            type: String,
            default: "1611485121216-default.jpg"
        },
        image_url: {
            type: String,
            default: "https://appetizar.nyc3.digitaloceanspaces.com/1611485121216-default.jpg"
        }
    },
    food_type: {
        type: String,
        default: undefined
    },
}, {
    timestamps: true
});

module.exports = mongoose.model('MenuCategory', MenuCategoryModel)