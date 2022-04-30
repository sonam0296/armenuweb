const mongoose = require("mongoose");
const subscriptionModel = new mongoose.Schema(
  {
    owner_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    plan_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Plans",
      default: null,
    },
    is_payment_offline: {
      type: Boolean,
      default: undefined,
    },
    subscription_type:{
      type: String,
      default: 'subscription',
      enum: [
        "subscription",
        "subscription_schedule",
      ],
    },
    stripe_subscription_id: {
      type: String,
      default: undefined,
    },
    razor_subscription_id: {
      type: String,
      default: undefined,
    },
    razor_oto_id: {   //oto = one time order id
			type: String,
			default: undefined
		},
		razor_otpm_id: {   //ots = one time payment id
			type: String,
			default: undefined
		},
    stripe_price_id: {
      type: String,
      default: undefined,
    },
    razor_plan_id: {
      type: String,
      default: undefined,
    },
    cancellation_reason: {
      type: String,
      default: undefined,
    },
    subscription_status: {
      type: String,
      enum: [
        // --stripe --
        "active",
        "past_due",
        "unpaid",
        "canceled",
        "incomplete",
        "incomplete_expired",
        "trialing",
        "not_started",
        "deprecated",
        // --razor pay --
        "created",
        "authenticated",
        "activated",
        "charged",
        "completed",
        "updated",
        "pending",
        "halted",
        "cancelled",
        "paused",
        "resumed"
      ],
      text: true,
    },
    is_subscription_canceled: {
      type: Boolean,
      default: undefined,
    },
    canceled_at: {
      type: Date,
      default: undefined,
    },
    stripe_subscription: {
      type: Object,
      default:undefined
    },
    stripe_subscription_cycle: {
      type: Object,
      default:undefined
    },
    razor_subscription: {
      type: Object,
      default:undefined
    },
    razor_subscription_cycle: {
      type: Object,
      default:undefined
    },
    version:{
      type:Number,
      default:2
    }
  },
  {
    timestamps: true,
  }
);
module.exports = mongoose.model("Subscriptions", subscriptionModel);
