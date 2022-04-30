const mongoose = require('mongoose');

const variant_OP = new mongoose.Schema({
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
    option_name: {
        type: String,
        default: undefined
    },
}, {
    timestamps: true
});

module.exports = mongoose.model('variant_options', variant_OP)