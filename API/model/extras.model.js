const mongoose = require('mongoose');

const extrasModel = new mongoose.Schema({
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
    extras_name:{
        type:String,
        default:undefined
    },
    price:{
        type:Number,
        default:undefined
    }
},{
    timestamps: true
});

module.exports = mongoose.model('extras', extrasModel)

