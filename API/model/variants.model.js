const mongoose = require('mongoose');

const variantsModel = new mongoose.Schema({
    owner_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    dish_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Menus',
        default: null
    },
    variant_op_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'variant_options',
        default: null
    },
    variant_name: {
        type: String,
        default: undefined
    },
    price: {
        type: Number,
        default: undefined
    }
}, {
    timestamps: true
});


module.exports = mongoose.model('variants', variantsModel)

