const mongoose = require('mongoose');

const cartContent = new mongoose.Schema({
	menu_item_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Menus',
        default: undefined
    },
    menu_item_qty: {
        type: Number,
        default: undefined
    },
    final_item_price: {
        type: Number,
        default: undefined
    },
    extras_id:[{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'extras',
        default: undefined
    }],
    variant_id:[{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'variants',
        default: undefined
    }]
});
const CartsModel = new mongoose.Schema({
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
    myCart:{
        type:[cartContent],
        default:undefined
    },
    sub_total: {
        type: Number,
        default: undefined
    }
},{
    timestamps: true
});

module.exports = mongoose.model('Carts', CartsModel)