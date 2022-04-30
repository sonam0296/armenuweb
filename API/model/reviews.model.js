const mongoose = require("mongoose")

const Schema = mongoose.Schema;

const ReviewsModel = Schema({
    owners_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    client_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    orders_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    restaurant_ratings: {
        type: Number,
        default: null
    },
    dish_review: [
        {
            dish_rating: {
                type: Number,
                default: null,
                max:5
            },
            dish_id: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Menus',
                default: null
            },
        }
    ],
    comments: {
        type: String,
        default: undefined
    }
}, {
    timestamps: true
}
)
module.exports = mongoose.model('Review', ReviewsModel);