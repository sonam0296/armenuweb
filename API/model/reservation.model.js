const mongoose = require("mongoose")

const reserve = new mongoose.Schema({
    client_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    order_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Orders',
        default: null
    },
    messages: {
        type: Array,
        default: []
    },
})

const ReservationModel = new mongoose.Schema({
    owner_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: undefined
    },
    // floor: {
    //     type: Number,
    //     default: 0
    // },
    // luxury: {
    //     type: String,
    //     default: "Non AC",
    //     enum: ["AC", "Non AC"]
    // },
    // sitingOf: {
    //     type: Number,
    //     default: 4,
    // },
    capacity: {
        type: Number,
        default: 0
    },
    arrangement: {
        type: [reserve],
        default: function () {
            let arr = []
            for (let i = 0; i < this.capacity; i++) {
                arr.push({})
            }
            return arr;
        }
    },
},
    {
        timestamps: true
    }
)
module.exports = mongoose.model("Reservation", ReservationModel)