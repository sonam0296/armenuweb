const mongoose = require('mongoose');
const { nanoid } = require('nanoid');
const items = new mongoose.Schema({

    menu_item_id: {
        _id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Menus',
            default: undefined
        },
        item_name: {
            type: String,
            default: undefined
        },
        item_price: {
            type: Number,
            default: undefined
        },
        vat_percentage: {
            type: Number,
            default: undefined
        },
        vat_value: {
            type: Number,
            default: undefined
        }

    },
    variant_id: [
        {
            _id: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'variants',
                default: undefined
            },
            price: {
                type: Number,
                default: undefined
            },
            variant_name: {
                type: String,
                default: undefined
            },
        }
    ],
    extras_id: [
        {
            _id:
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'extras',
                default: undefined
            },
            extras_name: {
                type: String,
                default: undefined
            },
            price: {
                type: Number,
                default: undefined
            }
        }
    ],
    menu_item_qty: {
        type: Number,
        default: undefined
    },
    final_item_price: {
        type: Number,
        default: undefined
    }
});

const status = new mongoose.Schema({
    status_from: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: undefined
    },
    userType: {
        type: String,
        default: undefined
    },
    status_message: {
        type: String,
        default: null
    },
    updated_time: {
        type: Date,
        default: new Date()
    }
});
const OrdersModel = new mongoose.Schema({
    // --------check out page -------------
    client_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    owner_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: undefined
    },
    driver_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    aggregator_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    reviews_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Review',
        default: null
    },
    o_id: {
        type: String,
        default: function () {
            return '#order_' + nanoid()
        },
        unique: true, sparse: true
    },
    items: {
        type: [items],
        default: undefined
    },
    sub_total: {
        type: Number,
        default: null
    },
    total_items: {
        type: Number,
        default: undefined
    },
    total: {
        type: Number,
        default: null
    },
    total_vat: {
        type: Number,
        default: undefined
    },
    net_value: {
        type: Number,
        default: undefined
    },
    is_delivery: {
        type: Boolean,
        default: undefined
    },
    delivery_type: {
        type: String,
        default:"Deliver",
        enum:["Dine","Deliver","Pickup"]
    },
    is_cod: {
        type: Boolean,
        default: undefined
    },
    client_name: {
        type: String,
        default: undefined
    },
    card_number: {
        type: Number,
        default: undefined
    },
    eta_upper_bound: {
        type: Date,
        default: undefined
    },
    eta_lower_bound: {
        type: Date,
        default: undefined
    },
    delivery_address: {
        type: String,
        default: undefined
    },
    comment: {
        type: String,
        default: undefined
    },

    // --------- razor attributes ------------
    ispaid: {
        type: Boolean,
        default: undefined
    },
    razorpay_order_id: {
        type: String,
        default: undefined
    },
    razorpay_payment_id: {
        type: String,
        default: undefined
    },
    razorpay_signature: {
        type: String,
        default: undefined
    },

    razorpay_transfer_id: {
        type: String,
        default: undefined
    },

    razorpay_refund: {
        status: {
            type: String,
            default: undefined
        },
        reason: {
            type: String,
            default: undefined
        },
    },

    // --------- Stripe attributes ----------------
    stripe_payment_intent_id: {
        type: String,
        default: undefined
    },
    stripe_client_secret: {
        type: String,
        default: undefined
    },
    stripe_payment_data: {
        // type: Object,
        // default: undefined
        stripe_payment_status: {
            type: String,
            default: undefined
        },
        stripe_cancellation_reason: {
            type: String,
            default: undefined
        },
        stripe_refund_reason: {
            type: String,
            default: undefined
        },
        last_payment_error: {
            type: String,
            default: undefined
        },
        stripe_payment_receipt_url: {
            type: String,
            default: undefined
        },
    },

    // --------- orders dash-board page -----------

    status_history: {
        type: [status],
        default: undefined
    },
    last_status: {
        type: String,
        default: undefined
    },
    delivery_history: {
        type: [status],
        default: undefined
    },
    delivery_status: {
        type: String,
        default: function() {
			if (this.delivery_type === "Deliver" || this.delivery_type === "Pickup") {
			   return "Pending";
			} else {
			   return undefined;
			}
		 }
    },
    is_live: {
        type: Boolean,
        default: true
    },
    is_canceled: {
        type: Boolean,
        default: false
    },
    Ordered_time: {
        type: Date,
        default: Date.now()
    },
    coupon_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Coupon',
        default: null
    },
    prepare_time: {
        type: String,
        default: undefined
    },
    Order_cancel_time: {
        type: Date,
        default: undefined
    },
    Order_Delivered_time: {
        type: Date,
        default: undefined
    },

    // --- usage charges ---
    owner_usage_charged:{
        type:Boolean,
        default:false
    }

}, {
    timestamps: true
});

module.exports = mongoose.model('Orders', OrdersModel)