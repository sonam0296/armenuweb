const mongoose = require("mongoose")

const planModel  = new mongoose.Schema({
    userType:{
        type:String,
        enum:[
            "owner",
            "driver_aggregator",
        ],
        default:"owner"
    },
    title:{
        type:String
    },
    diver_capacity: {
        type: Number,
        default: function() {
            if (this.userType === "driver_aggregator") {
               return null;
            } else {
               return undefined;
            }
         }
    },
    content:{
        type:String
    },
    country:{
        type:String,
        text : true
    },
    country_code: {
		type: String,
		default: undefined
	},
    currency:{
        type:String
    },
    currency_symbol:{
        type:String
    },
    unit_amount:{
        type:Number
    },
    usage_charge_unit:{
        type:Number,
        default: function() {
			if (this.userType === "owner") {
			   return 0;
			} else {
			   return undefined;
			}
		 }
    },
    usage_threshold:{
        type:Number,
        default: function() {
			if (this.userType === "owner") {
			   return 0;
			} else {
			   return undefined;
			}
		 }
    },
    recurring:{
        interval:{
            type:String
        },
        interval_count:{
            type:Number
        },
        total_count:{
            type:Number,
            default:undefined
        }
    },
    is_active:{
        type:Boolean,
        default:true
    },
    cancel_reason:{
        type:String
    },
    trial_days:{
        type:Number,
        default:0
    },
    stripe_product:{
        type:Object,
        default:undefined
    },
    stripe_price:{
        type:Object,
        default:undefined
    },
    razor_product:{
        type:Object,
        default:undefined
    },
},
{
    timestamps: true
}
)

module.exports = mongoose.model("Plans",planModel)