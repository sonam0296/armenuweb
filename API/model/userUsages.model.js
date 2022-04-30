const mongoose = require("mongoose")
const userUsageModel = new mongoose.Schema({
    client_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: undefined
    },
    owner_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: undefined
    },
    driver_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: undefined
    },
    aggregator_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: undefined
    },
    order_counts:{
        type:Number,
        default:0
    }
},
    {
        timestamps: true
    }
)
module.exports = mongoose.model("userUsages", userUsageModel)