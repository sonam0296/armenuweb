const httpStatus = require("http-status");
const APIError = require("../helpers/APIError");
const resPattern = require("../helpers/resPattern");
const Plan = require("../model/plan.model");
const User = require("../model/user.model");
const Subscription = require("../model/subscription.model");
const Orders = require("../model/orders.model");
const stripeHelper = require("../helpers/stripe.payment");
const razorHelper = require("../helpers/razor.payment");
const mongoose = require("mongoose");
const moment = require("moment");
const cron = require('node-cron');
const { send_req } = require('../helpers/sendRequest')
const { sendEmail } = require('../helpers/sendEmail')
const { raz_owner_hunt, stripe_owner_hunt, raz_stat_owner_hunt } = require('../helpers/cronjobs');
const { options } = require("joi");
const unix_now = moment().unix()
const unix_plus_day = moment().add(1, 'days').unix()
const unix_medium = moment().add(8, 'hours').unix()




// ---- cron jobs ----

// --- charge owners with razorpay subscription ---
// const raz_owner_hunt = cron.schedule('*/10 * * * * *', 

raz_owner_hunt.start();
stripe_owner_hunt.start();
raz_stat_owner_hunt.start();

raz_owner_hunt.stop();
// stripe_owner_hunt.stop();
// raz_stat_owner_hunt.stop()




// -------- Stripe plans management -----------


const payment_method = async (req, res, next) => {
  let value = await stripeHelper.payment_method();
  let obj = resPattern.successPattern(httpStatus.OK, value, "success");
  return res.status(obj.code).json(obj);
}

const get_plan = async (req, res, next) => {
  try {
    let reqData = req.body;
    const result = await Plan.findById(reqData.plan_id);
    let obj = resPattern.successPattern(httpStatus.OK, result, "success");
    return res.status(obj.code).json(obj);
  } catch (e) {
    return next(new APIError(e.message, httpStatus.BAD_REQUEST, true));
  }
};

const fetch_plans_country = async (req, res, next) => {
  try {
    const result = await Plan.distinct("country_code");
    let obj = resPattern.successPattern(httpStatus.OK, result, "success");
    return res.status(obj.code).json(obj);
  } catch (e) {
    return next(new APIError(e.message, httpStatus.BAD_REQUEST, true));
  }
};

const fetch_plans = async (req, res, next) => {
  try {
    let reqData = new Plan(req.body);

    const result = await Plan.aggregate([
      { $match: { $and: [{ $text: { $search: reqData.country } }, { userType: reqData.userType }] } },

      {
        $group: {
          _id: "$country",
          data: { $push: "$$ROOT" }
        }
      }
    ]);

    if (result.length > 0) {
      let obj = resPattern.successPattern(httpStatus.OK, result, "success");
      return res.status(obj.code).json(obj);
    } else {
      const e = { message: "No data available for query " + reqData.country }
      throw e
    }
  } catch (e) {
    return next(new APIError(e.message, httpStatus.BAD_REQUEST, true));
  }
};

const create_plan = async (req, res, next) => {
  try {
    let reqData = new Plan(req.body);
    reqData.recurring = {
      interval: req.body.interval,
      interval_count: req.body.interval_count
    }
    reqData.stripe_product = await stripeHelper.create_product(reqData);
    reqData.stripe_price = reqData.userType === 'owner' ? await stripeHelper.create_price(req.body, reqData.stripe_product.id) : await stripeHelper.create_price_aggregator(req.body, reqData.stripe_product.id) ;
    const result = await reqData.save();
    req.body = result;
    await fetch_plans(req, res, next);
  } catch (e) {
    return next(new APIError(e.message, httpStatus.BAD_REQUEST, true));
  }
};

const update_plan = async (req, res, next) => {
  try {
    let reqData = req.body;
    reqData.stripe_product = await stripeHelper.update_product(reqData);
    const result = await Plan.findByIdAndUpdate(reqData.plan_id, {
      $set: {
        title: reqData.title,
        content: reqData.content,
        stripe_product: reqData.stripe_product,
        trial_days: reqData.trial_days,
      }
    });
    req.body = result;
    await fetch_plans(req, res, next);
  } catch (e) {
    return next(new APIError(e.message, httpStatus.BAD_REQUEST, true));
  }
};

const disable_plan = async (req, res, next) => {
  try {
    let reqData = req.body;
    const target_plan = await Plan.findById(reqData.plan_id);
    if (!target_plan.is_active) {

      let obj = resPattern.errorPattern(
        httpStatus.BAD_REQUEST,
        "It appears You've already archived this plan."
      );
      return res.status(obj.code).json(obj);
    } else {
      let plan = await stripeHelper.disable_product(reqData);
      const result = await Plan.findByIdAndUpdate(
        reqData.plan_id,
        {
          is_active: false,
          cancel_reason: reqData.message ? reqData.message : "The plan is canceled by admin.",
          stripe_product: plan,
        },
        { new: true }
      );
      req.body = result;
      await fetch_plans(req, res, next);
    }

  } catch (e) {
    return next(new APIError(e.message, httpStatus.BAD_REQUEST, true));
  }
};

const get_price = async (req, res, next) => {
  try {
    const reqData = req.body;
    const result = await stripeHelper.get_price(req, res, next);
    let obj = resPattern.successPattern(httpStatus.OK, result, "success");
    return res.status(obj.code).json(obj);
  } catch (e) {
    return next(new APIError(e.message, httpStatus.BAD_REQUEST, true));
  }
};

const get_subscription = async (req, res, next) => {
  try {
    const reqData = req.body;
    const loggedInUser = req.user;
    const result = await Subscription.find({ owner_id: loggedInUser._id })
      .populate({
        path: 'plan_id',
        model: 'Plans',
        select: '_id is_active recurring title content country currency country_cod unit_amount trial_days stripe_price.id stripe_price.recurring'
      })
      .select("stripe_subscription_cycle.cancel_at stripe_subscription_cycle.current_period_start stripe_subscription_cycle.current_period_end stripe_subscription_cycle.trial_start stripe_subscription_cycle.trial_end cancellation_reason is_subscription_canceled plan_id canceled_at stripe_subscription_cycle.id stripe_subscription.start_date subscription_status subscription_type stripe_subscription_id stripe_price_id razor_subscription_id razor_plan_id razor_subscription_cycle.id razor_subscription_cycle.current_start razor_subscription_cycle.current_end razor_subscription_cycle.short_url razor_subscription_cycle.has_scheduled_changes razor_subscription_cycle.change_scheduled_at razor_subscription_cycle.charge_at razor_subscription.short_url razor_subscription_cycle.payment.entity.created_at").sort({ _id: -1 });
    let obj = resPattern.successPattern(httpStatus.OK, result, "success");
    return res.status(obj.code).json(obj);
  } catch (e) {
    return next(new APIError(e.message, httpStatus.BAD_REQUEST, true));
  }
};

const preview_subscription = async (req, res, next) => {
  try {
    const reqData = req.body;
    const loggedInUser = req.user;
    const result = await stripeHelper.preview_next_subscription(reqData, loggedInUser.stripe_customer.id, loggedInUser.subscription_status.stripe_subscription_id)
    let obj = resPattern.successPattern(httpStatus.OK, result, "success");
    return res.status(obj.code).json(obj);
  } catch (e) {
    return next(new APIError(e.message, httpStatus.BAD_REQUEST, true));
  }
};

const create_subscription = async (req, res, next) => {
  try {
    const reqData = req.body;
    const loggedInUser = req.user;
    if (loggedInUser.subscription_status.status != 'no_plan_selected' && loggedInUser.subscription_status.status != 'canceled') {
      if (loggedInUser.subscription_status.status === 'active' || loggedInUser.subscription_status.status === 'trialing') {
        let obj = resPattern.errorPattern(
          httpStatus.BAD_REQUEST,
          "It appears You are already subscribed,consider updating subscription if you want."
        );
        return res.status(obj.code).json(obj);
      }
    }
    else {
      const result = await stripeHelper.create_subscription(reqData);
      if (result.subscription.status === 'active' || result.subscription.status === 'trialing') {
        let subscription = new Subscription({
          owner_id: mongoose.Types.ObjectId(loggedInUser._id),
          plan_id: mongoose.Types.ObjectId(reqData.plan_id),
          stripe_subscription_id: result.subscription.id,
          stripe_price_id: reqData.price,
          subscription_status: result.subscription.status === 'active' ? 'active' : 'trialing',
          stripe_subscription: result.subscription,
          stripe_subscription_cycle: result.subscription
        });
        subscription = await subscription.save();
        await User.findByIdAndUpdate(
          loggedInUser._id,
          {
            stripe_customer: result.customer,
            subscription_status: {
              subscription_id: subscription._id,
              stripe_subscription_id: result.subscription.id,
              status: subscription.subscription_status,
              current_period_end: result.subscription.current_period_end,
              is_trial_used: result.subscription.trial_start ? true : false,
            },
            isActive: true
          },
          { new: true }
        );
        let obj = resPattern.successPattern(
          httpStatus.OK,
          subscription,
          "success"
        );
        return res.status(obj.code).json(obj);
      } else {
        let obj = resPattern.errorPattern(
          httpStatus.BAD_REQUEST,
          "Something went wrong, kindly contact customer support if the amount is deducted.",
          "failure"
        );
        return res.status(obj.code).json(obj);
      }
    }
  } catch (e) {
    return next(new APIError(e.message, httpStatus.BAD_REQUEST, true));
  }
};

const update_subscription = async (req, res, next) => {
  try {
    let reqData = req.body;
    const loggedInUser = req.user;
    let old_subscription = await Subscription.findById(loggedInUser.subscription_status.subscription_id);
    reqData.old_subscription = old_subscription;
    if (loggedInUser.subscription_status.is_schedule_awaiting === true) {
      let obj = resPattern.errorPattern(
        httpStatus.BAD_REQUEST,
        "You have switched to subscription which is scheduled to activate at " + moment(old_subscription.stripe_subscription_cycle.cancel_at).utc().format('Do,MMM,YYYY, h:mm:ss a'),
        "failure"
      );
      return res.status(obj.code).json(obj);
    }
    else if (old_subscription.is_subscription_canceled) {
      let obj = resPattern.errorPattern(
        httpStatus.BAD_REQUEST,
        "The subscription is already canceled.",
        "failure"
      );
      return res.status(obj.code).json(obj);
    }
    else {
      const result = await stripeHelper.update_subscription(reqData, loggedInUser.subscription_status, loggedInUser.stripe_customer);

      if (result.status === 'active') {
        old_subscription = await Subscription.findByIdAndUpdate(old_subscription._id, {
          is_subscribed: false,
          subscription_status: 'canceled',
          cancellation_reason: 'switched to another plan',
          is_subscription_canceled: true,
          canceled_at: moment().toDate()
        }, { new: true })

        let subscription = new Subscription({
          owner_id: mongoose.Types.ObjectId(loggedInUser._id),
          plan_id: mongoose.Types.ObjectId(reqData.new_plan_id),
          stripe_subscription_id: result.id,
          stripe_price_id: reqData.new_price,
          subscription_status: result.status,
          stripe_subscription: result,
          stripe_subscription_cycle: result
        });
        subscription = await subscription.save();
        await User.findByIdAndUpdate(
          loggedInUser._id,
          {
            subscription_status: {
              subscription_id: subscription._id,
              stripe_subscription_id: result.id,
              status: subscription.subscription_status,
              is_trial_used: true,
              current_period_end: result.current_period_end,
            }
          },
          { new: true }
        );

        let obj = resPattern.successPattern(
          httpStatus.OK,
          subscription,
          "success"
        );
        return res.status(obj.code).json(obj);
      }
      else if (result.status === 'not_started') {
        const old_cycle = await stripeHelper.get_subscription(old_subscription.stripe_subscription_id);
        old_subscription = await Subscription.findByIdAndUpdate(old_subscription._id, {
          is_subscribed: true,
          subscription_status: 'deprecated',
          cancellation_reason: 'switched to another plan',
          is_subscription_canceled: true,
          stripe_subscription_cycle: old_cycle,
          canceled_at: moment().toDate()
        }, { new: true })
        await User.findByIdAndUpdate(loggedInUser._id, {
          $set: {
            "subscription_status.is_schedule_awaiting": true,
            // "subscription_status.status": result.status,
            "subscription_status.stripe_sub_schedule_id": result.id,
          }
        })

        let subscription = new Subscription({
          owner_id: mongoose.Types.ObjectId(loggedInUser._id),
          plan_id: mongoose.Types.ObjectId(reqData.new_plan_id),
          subscription_type: "subscription_schedule",
          stripe_subscription_id: result.id,
          stripe_price_id: reqData.new_price,
          subscription_status: result.status,
          stripe_subscription: result,
          stripe_subscription_cycle: result,
        });
        subscription = await subscription.save();

        let obj = resPattern.successPattern(
          httpStatus.OK,
          subscription,
          "success"
        );
        return res.status(obj.code).json(obj);
      }
      else {
        let obj = resPattern.errorPattern(
          httpStatus.BAD_REQUEST,
          "Something went wrong, kindly contact customer support if the amount is deducted.",
          "failure"
        );
        return res.status(obj.code).json(obj);
      }
    }

  } catch (e) {
    return next(new APIError(e.message, httpStatus.BAD_REQUEST, true));
  }
};

const cancel_subscription = async (req, res, next) => {
  try {
    const reqData = req.body;
    const loggedInUser = req.user;
    const result = await stripeHelper.cancel_subscription(reqData, loggedInUser.subscription_status);
    const target_sub = await Subscription.findById(loggedInUser.subscription_status.subscription_id);
    let canceled_sub_id = undefined;
    if (loggedInUser.subscription_status.status != 'canceled') {
      if (result.object === 'subscription_schedule') {
        canceled_sub_id = await Subscription.findOne({ stripe_subscription_id: result.id }).select({ _id: 1 });
      } else {
        canceled_sub_id = loggedInUser.subscription_status.subscription_id;
      }
      let subscription = await Subscription.findByIdAndUpdate(canceled_sub_id, {
        is_subscribed: false,
        stripe_subscription_cycle: result,
        subscription_status: result.cancel_at_period_end ? result.status : 'canceled',
        cancellation_reason: reqData.cancellation_reason ? reqData.cancellation_reason : null,
        is_subscription_canceled: true,
        canceled_at: moment().toDate(),
      }, { new: true })
      const user_hunt = await User.findByIdAndUpdate(
        loggedInUser._id,
        {
          isActive: reqData.cancel_now ? false : true,
          subscription_status: {
            subscription_id: loggedInUser.subscription_status.subscription_id,
            stripe_subscription_id: loggedInUser.subscription_status.stripe_subscription_id,
            status: result.object === 'subscription_schedule' ? 'deprecated' : result.status,
            is_trial_used: result.trial_start ? true : false,
            is_schedule_awaiting: result.object === 'subscription_schedule' ? false : undefined,
            stripe_sub_schedule_id: undefined,
          }
        },
        { new: true }
      );
      let obj = resPattern.successPattern(
        httpStatus.OK,
        subscription,
        "success"
      );
      return res.status(obj.code).json(obj);
    }
    else if (target_sub.is_subscription_canceled) {
      let obj = resPattern.errorPattern(
        httpStatus.BAD_REQUEST,
        "The subscription is already canceled.",
        "failure"
      );
      return res.status(obj.code).json(obj);
    }
    else {
      let obj = resPattern.errorPattern(
        httpStatus.BAD_REQUEST,
        "Something went wrong, kindly contact customer support if the amount is deducted.",
        "failure"
      );
      return res.status(obj.code).json(obj);
    }

  } catch (e) {
    return next(new APIError(e.message, httpStatus.BAD_REQUEST, true));
  }
};

const subscription_schedule_webhook = async (req, res, next) => {
  try {
    // -------- change the schedule document in db to subscription doc
    let reqData = req.body.data.object;
    const subscription = await Subscription.findOneAndUpdate({ stripe_subscription_id: reqData.id }, {
      is_subscribed: true,
      subscription_status: reqData.status,
      stripe_subscription: reqData,
      stripe_subscription_cycle: reqData,
    }, { new: true })

    user = await User.findByIdAndUpdate(subscription.owner_id,
      {
        subscription_status:
        {
          subscription_id: subscription._id,
          stripe_subscription_id: reqData.subscription,
          status: reqData.status,
          is_trial_used: true,
          is_schedule_awaiting: false,
          stripe_sub_schedule_id: undefined,
        }
      })
    let obj = resPattern.successPattern(
      httpStatus.OK,
      subscription,
      "success"
    );
    return res.status(obj.code).json(obj);

  } catch (e) {
    return next(new APIError(e.message, httpStatus.BAD_REQUEST, true));
  }
};


const subscription_renew_webhook = async (req, res, next) => {
  try {
    const reqType = req.body.type;
    let reqData = req.body.data.object;
    if (reqType === "customer.subscription.created") {
      //------- the case when customer has switched to new subscription but it will start after current cycle ends --------
      if (reqData.hasOwnProperty('schedule') && reqData.schedule != null) {
        const subscription = await Subscription.findOneAndUpdate({ stripe_subscription_id: reqData.schedule }, {
          is_subscribed: true,
          subscription_type: reqData.object,
          subscription_status: reqData.status,
          stripe_subscription_cycle: reqData,
        }, { new: true })
        user = await User.findByIdAndUpdate(subscription.owner_id,
          {
            isActive: true,
            subscription_status:
            {
              subscription_id: subscription._id,
              stripe_subscription_id: reqData.id,
              status: reqData.status,
              is_trial_used: true,
              is_schedule_awaiting: false,
              stripe_sub_schedule_id: undefined,
              current_period_end: reqData.current_period_end,
            }
          })
        if (!user.is_outlet) {
          const test = await User.updateMany(
            { is_outlet: true, hosting_Address: use.hosting_Address },
            { $set: { isActive: true } }
          )
        }
        let obj = resPattern.successPattern(
          httpStatus.OK,
          "success"
        );
        return res.status(obj.code).json(obj);
      }
      else {
        let obj = resPattern.successPattern(
          httpStatus.OK,
          "success"
        );
        return res.status(obj.code).json(obj);
      }
    }
    else if (reqType === "customer.subscription.updated" && reqData.cancel_at_period_end === false) {
      //------- the case when customers subscription gets renew --------
      const subscription = await Subscription.findOneAndUpdate({ stripe_subscription_id: reqData.id }, {
        $set: {
          is_subscribed: true,
          subscription_type: reqData.object,
          // subscription_status: reqData.status,
          stripe_subscription_cycle: reqData,
        }
      }, { new: true })
      await User.findByIdAndUpdate(subscription.owner_id,
        {
          $set:
          {
            "subscription_status.stripe_subscription_id": reqData.id,
            "subscription_status.status": reqData.status,
            "subscription_status.is_trial_used": true,
            "subscription_status.is_schedule_awaiting": false,
            "subscription_status.stripe_sub_schedule_id": undefined,
            "subscription_status.current_period_end": reqData.current_period_end,
          }
        })
      let obj = resPattern.successPattern(
        httpStatus.OK,
        "success"
      );
      return res.status(obj.code).json(obj);
      // }
    }
    else if (reqType === "customer.subscription.updated" && reqData.cancel_at_period_end === true && reqData.metadata.is_archived === "true") {
      //------- the case when customers subscription gets deprecated  because plan is no longer in effect--------
      const subscription = await Subscription.findOneAndUpdate({ stripe_subscription_id: reqData.id }, {
        $set: {
          is_subscribed: true,
          subscription_type: reqData.object,
          subscription_status: reqData.status,
          stripe_subscription_cycle: reqData,
        }
      }, { new: true })
      await User.findByIdAndUpdate(subscription.owner_id,
        {
          $set:
          {
            "subscription_status.subscription_id": subscription._id,
            "subscription_status.stripe_subscription_id": reqData.id,
            "subscription_status.status": reqData.status,
            "subscription_status.is_trial_used": true,
            "subscription_status.is_schedule_awaiting": false,
            "subscription_status.stripe_sub_schedule_id": undefined,
            "subscription_status.current_period_end": reqData.current_period_end,
            "subscription_status.message": "This plan is archived from admin, and will likely be ineffective once your current period ends.",
          }
        })
      let obj = resPattern.successPattern(
        httpStatus.OK,
        "success"
      );
      return res.status(obj.code).json(obj);
      // }
    }
    else if (reqType === "customer.subscription.deleted") {
      // ---- the case when customer fails to renew the payment 
      const subscription = await Subscription.findOneAndUpdate({ stripe_subscription_id: reqData.id }, {
        is_subscribed: false,
        subscription_type: reqData.object,
        subscription_status: 'canceled',
        stripe_subscription_cycle: reqData,
        is_subscription_canceled: true,
        canceled_at: moment().toDate()
      }, { new: true })
      user = await User.findById(subscription.owner_id);
      if (user.subscription_status.stripe_subscription_id === reqData.id) {
        user = await User.findByIdAndUpdate(subscription.owner_id,
          {
            $set: {
              "isActive": false,
              "subscription_status.subscription_id": subscription._id,
              "subscription_status.stripe_subscription_id": reqData.id,
              "subscription_status.status": 'canceled',
              "subscription_status.is_trial_used": true,
              "subscription_status.is_schedule_awaiting": false,
              "subscription_status.stripe_sub_schedule_id": undefined,
              "subscription_status.current_period_end": reqData.current_period_end,
            }
          })

        if (!user.is_outlet) {
          const test = await User.updateMany(
            { is_outlet: true, hosting_Address: user.hosting_Address },
            { $set: { isActive: false, "subscription_status.message": null } }
          )
          console.log(test);
        }
      }

      let obj = resPattern.successPattern(
        httpStatus.OK,
        "success"
      );
      return res.status(obj.code).json(obj);
      // }
    }
    else if (reqType === "invoice.paid") {
      const stripe_sub_res = await stripeHelper.get_subscription(reqData.subscription);
      const subscription = await Subscription.findOneAndUpdate({ stripe_subscription_id: reqData.subscription }, {
        is_subscribed: true,
        subscription_type: stripe_sub_res.object,
        subscription_status: stripe_sub_res.status,
        stripe_subscription_cycle: stripe_sub_res,
      }, { new: true })
      user = await User.findById(subscription.owner_id);
      if (user.subscription_status.stripe_subscription_id === reqData.subscription) {
        user = await User.findByIdAndUpdate(subscription.owner_id,
          {
            isActive: true,
            subscription_status:
            {
              subscription_id: subscription._id,
              stripe_subscription_id: reqData.subscription,
              status: stripe_sub_res.status,
              is_trial_used: true,
              is_schedule_awaiting: false,
              stripe_sub_schedule_id: undefined,
              current_period_end: stripe_sub_res.current_period_end,
            }
          })
      }
      let obj = resPattern.successPattern(
        httpStatus.OK,
        "success"
      );
      return res.status(obj.code).json(obj);
    }
    else {
      let obj = resPattern.successPattern(
        httpStatus.OK,
        "success"
      );
      return res.status(obj.code).json(obj);
    }
  } catch (e) {
    return next(new APIError(e.message, httpStatus.BAD_REQUEST, true));
  }
};


const subscription_detach_subscribers_webhook = async (req, res, next) => {
  try {
    const reqType = req.body.type;
    let reqData = req.body.data.object;
    if (reqType === "product.updated" && reqData.active === false) {
      const deprecated_plan = await Plan.findOne({ "stripe_product.id": reqData.id });
      await stripeHelper.remove_subscribers(deprecated_plan);
      let obj = resPattern.successPattern(
        httpStatus.OK,
        "success"
      );
      return res.status(obj.code).json(obj);
    }
    else {
      let obj = resPattern.successPattern(
        httpStatus.OK,
        "success"
      );
      return res.status(obj.code).json(obj);
    }
  } catch (e) {
    return next(new APIError(e.message, httpStatus.BAD_REQUEST, true));
  }
};

// -------- common features ---------------------
const active_plans = async (req, res, next) => {
  try {
    let reqData = new Plan(req.body);

    const result = await Plan.aggregate([
      {
        $match: {
          $and: [{ $text: { $search: reqData.country } },
          { userType: reqData.userType },
          { is_active: true }]
        }
      },

      {
        $group: {
          _id: "$country",
          data: { $push: "$$ROOT" }
        }
      }
    ]);

    if (result.length > 0) {
      let obj = resPattern.successPattern(httpStatus.OK, result, "success");
      return res.status(obj.code).json(obj);
    } else {
      const e = { message: "No data available for query " + reqData.country }
      throw e
    }
  } catch (e) {
    return next(new APIError(e.message, httpStatus.BAD_REQUEST, true));
  }
}

// -------- RazorPay plans management -----------

const raz_ping = async (req, res, next) => {
  try {
    // const user = req.user;
    // const params = req.params;
    // const query = req.query;
    const reqData = req.body;
    let obj = resPattern.successPattern(httpStatus.OK, reqData, 'success');
    return res.status(obj.code).json(obj);
  } catch (e) {
    return next(new APIError(e.message, httpStatus.BAD_REQUEST, true));
  }
}

const raz_pingV2 = async (req, res, next) => {
  try {
    // const user = req.user;
    // const params = req.params;
    // const query = req.query;
    const reqData = req.body;
    const result = await razorHelper.update_subscription(reqData);
    // const result = await razorHelper.cancel_subscription(reqData.raz_subscription_id, reqData.cancel_at_cycle_end);
    let obj = resPattern.successPattern(httpStatus.OK, result, 'success');
    return res.status(obj.code).json(obj);
  } catch (e) {
    return next(new APIError(e.message, httpStatus.BAD_REQUEST, true));
  }
}

const raz_customer = async (req, res, next) => {
  try {
    // const user = req.user;
    // const params = req.params;
    // const query = req.query;
    const reqData = req.body;
    const result = await razorHelper.customer(reqData);
    // const result = await razorHelper.fetch_plans();
    let obj = resPattern.successPattern(httpStatus.OK, result, 'success');
    return res.status(obj.code).json(obj);
  } catch (e) {
    return next(new APIError(e.message, httpStatus.BAD_REQUEST, true));
  }
}

// --- the 100 year time conversion for week,day,months etc.
const hundred_years = async (interval, interval_count = 1) => {
  let total_count = undefined
  switch (interval) {
    case "daily":
      total_count = parseInt((100 * 365) / interval_count);

      break;
    case "weekly":
      total_count = parseInt((100 * 52.143) / interval_count);

      break;
    case "monthly":
      total_count = parseInt((100 * 12) / interval_count);

      break;
    case "yearly":
      total_count = parseInt(100 / interval_count);

      break;

    default:
      break;
  }
  return total_count
}


const raz_create_plan = async (req, res, next) => {
  try {
    // const user = req.user;
    // const params = req.params;
    // const query = req.query;
    const total_count = await hundred_years(req.body.interval, req.body.interval_count)
    let reqData = new Plan(req.body);
    reqData.recurring = {
      interval: req.body.interval,
      interval_count: req.body.interval_count,
      total_count: total_count
    }
    reqData.razor_product = await razorHelper.create_plan(reqData);
    const result = await reqData.save();
    let obj = resPattern.successPattern(httpStatus.OK, result, 'success');
    return res.status(obj.code).json(obj);
  } catch (e) {
    return next(new APIError(e.message, httpStatus.BAD_REQUEST, true));
  }
}

const raz_update_plan = async (req, res, next) => {
  try {
    let reqData = req.body;
    const result = await Plan.findByIdAndUpdate(reqData.plan_id, {
      $set: {
        title: reqData.title,
        content: reqData.content,
        // trial_days: reqData.trial_days,
      }
    });
    req.body = result;
    await fetch_plans(req, res, next);
  } catch (e) {
    return next(new APIError(e.message, httpStatus.BAD_REQUEST, true));
  }
}

const raz_disable_plan = async (req, res, next) => {
  try {
    let reqData = req.body;
    let admin = req.user

    const target_plan = await Plan.findById(reqData.plan_id);

    // --- email binder ---
    async function emailBinder(admin, target_plan, data, err) {
      if (err) {
        console.log("error ayi -_-");
        console.log(data);
        const payload = {
          email: admin.email,
          subject: "Razor pay Plan archive (failure)",
          message: `Hello ${admin.name}\nYour request to cancel the plan "${target_plan.title}" and associated subscriptions has failed :(\n
           Error: ${data.error.description}`,
        }
        await sendEmail(payload)
      } else {
        console.log("Plan subscription cancelled successfully!");
        console.log(target_plan.title);
        const payload = {
          email: admin.email,
          subject: "Razor pay Plan archive (Success)",
          message: `Hello ${admin.name}\nYour request to cancel the plan "${target_plan.title}" and associated subscriptions has been successful!`,
        }
        await sendEmail(payload)
      }
    }

    if (!target_plan.is_active) {
      let obj = resPattern.errorPattern(
        httpStatus.BAD_REQUEST,
        "It appears You've already archived this plan."
      );
      return res.status(obj.code).json(obj);
    } else {
      const subscriptions = await Subscription.find({ plan_id: target_plan._id, subscription_status: { $nin: ["halted", "cancelled"] } })
      Promise.all(subscriptions.map(async (sub) => {
        // --- uncomment this function once razor pay supports subscription ---
        // const response = await razorHelper.deprecate_subscription(sub.razor_subscription_id)
        await Subscription
          .findByIdAndUpdate(sub._id, {
            subscription_status: "cancelled",
            is_subscription_canceled: true,
            canceled_at: moment().toDate()
          })
      }))
        .then(emailBinder(admin, target_plan, null, false))
        .catch((err) => {
          emailBinder(admin, target_plan, err, true)
        }
        );
      const result = await Plan.findByIdAndUpdate(
        reqData.plan_id,
        {
          is_active: false,
          cancel_reason: reqData.message ? reqData.message : "The plan is canceled by admin.",
        },
        { new: true }
      );


      req.body = result;
      await fetch_plans(req, res, next);

      // let obj = resPattern.successPattern(httpStatus.OK, plans, 'success');
      // return res.status(obj.code).json(obj);
    }
  } catch (e) {
    return next(new APIError(e.message, httpStatus.BAD_REQUEST, true));
  }
}

const razor_oneTime_sub = async (req, res, next) => {
  try {
    const reqData = req.body;
    const loggedInUser = req.user;
    // if (loggedInUser.subscription_status.status != 'no_plan_selected' && loggedInUser.subscription_status.status != 'canceled') {
    if (loggedInUser.subscription_status.status === 'active' || loggedInUser.subscription_status.status === 'authenticated' || loggedInUser.subscription_status.status === 'created') {
      let obj = resPattern.errorPattern(
        httpStatus.BAD_REQUEST,
        "It appears You are already subscribed,consider updating subscription if you want."
      );
      return res.status(obj.code).json(obj);
    }
    const plan = await Plan.findById(reqData.plan_id);
    if (plan.trial_days > 0) {
      start_date = moment().add(plan.trial_days, "days").unix()
      let subscription = new Subscription({
        owner_id: mongoose.Types.ObjectId(loggedInUser._id),
        plan_id: mongoose.Types.ObjectId(reqData.plan_id),
        is_payment_offline: false,
        version: 1,
        // razor_subscription_id: result.id,
        // razor_plan_id: plan.razor_product.id,
        subscription_status: "authenticated",
        // razor_subscription: result,
        // razor_subscription_cycle: result
      });
      subscription = await subscription.save();
      const razor_customer = await razorHelper.customer(loggedInUser);
      await User.findByIdAndUpdate(
        loggedInUser._id,
        {
          razor_customer: razor_customer,
          isActive: true,
          subscription_status: {
            subscription_id: subscription._id,
            // razor_subscription_id: result.id,
            status: "authenticated",
            current_period_end: start_date,
            is_trial_used: true,
          }
        },
        { new: true }
      );
      let obj = resPattern.successPattern(
        httpStatus.OK,
        subscription,
        "success"
      );
      return res.status(obj.code).json(obj);
    } else {
      const options = {
        amount: parseFloat((plan.unit_amount * 100).toFixed(2)), // amount == Rs 10
        currency: "INR",
        notes: { purchase_type: "subscription" },
        payment_capture: 1
        // 1 for automatic capture // 0 for manual capture
      };
      const order = await razorHelper.create_order(options);
      start_date = moment().add(1, "years").unix()
      let subscription = new Subscription({
        owner_id: mongoose.Types.ObjectId(loggedInUser._id),
        plan_id: mongoose.Types.ObjectId(reqData.plan_id),
        is_payment_offline: false,
        version: 1,
        // razor_subscription_id: result.id,
        // razor_plan_id: plan.razor_product.id,
        subscription_status: "created",
        razor_oto_id: order.id,
        razor_subscription: order,
        razor_subscription_cycle: order
      });
      subscription = await subscription.save();
      const razor_customer = await razorHelper.customer(loggedInUser);
      await User.findByIdAndUpdate(
        loggedInUser._id,
        {
          razor_customer: razor_customer,
          subscription_status: {
            subscription_id: subscription._id,
            // razor_subscription_id: result.id,
            status: "created",
            razor_oto_id: order.id,
            current_period_end: start_date,
            // is_trial_used: true,
          }
        },
        { new: true }
      );
      let obj = resPattern.successPattern(
        httpStatus.OK,
        subscription,
        "success"
      );
      return res.status(obj.code).json(obj);
    }
  } catch (e) {
    return next(new APIError(e.message, httpStatus.BAD_REQUEST, true));
  }
}

const razor_oneTime_capture = async (req, res, next) => {
  try {
    // const user = req.user;
    // const params = req.params;
    // const query = req.query;
    const reqData = req.body;
    start_date = moment().add(1, "years").unix()
    let subscription = await Subscription.findOneAndUpdate({
      razor_oto_id: reqData.payload.order.entity.id,
    },
      {
        $set: {
          razor_otpm_id: reqData.payload.payment.entity.id,
          version: 1,
          subscription_status: "active",
          razor_subscription_cycle: reqData.payload,
        }
      }
    )
    await User.findByIdAndUpdate(
      subscription.owner_id,
      {
        isActive: true,
        subscription_status: {
          subscription_id: subscription._id,
          // razor_subscription_id: result.id,
          status: "active",
          razor_otpm_id: reqData.payload.payment.entity.id,
          current_period_end: start_date,
          // is_trial_used: true,
        }
      },
      { new: true }
    );
    let obj = resPattern.successPattern(
      httpStatus.OK,
      subscription,
      "success"
    );
    return res.status(obj.code).json(obj);

  } catch (e) {
    return next(new APIError(e.message, httpStatus.BAD_REQUEST, true));
  }
}


const razor_oneTime_cancel = async (req, res, next) => {
  try {
    // const user = req.user;
    // const params = req.params;
    // const query = req.query;
    const reqData = req.body;
    let subscription = await Subscription.findByIdAndUpdate(reqData.subscription_id,
      {
        subscription_status: "cancelled",
        canceled_at: moment().toDate()
      }
    )
    await User.findByIdAndUpdate(
      subscription.owner_id,
      {
        isActive: false,
        subscription_status: {
          subscription_id: subscription._id,
          // razor_subscription_id: result.id,
          status: "cancelled",
          razor_otpm_id: subscription.razor_otpm_id,
          // is_trial_used: true,
        }
      },
      { new: true }
    );
    let obj = resPattern.successPattern(
      httpStatus.OK,
      subscription,
      "success"
    );
    return res.status(obj.code).json(obj);

  } catch (e) {
    return next(new APIError(e.message, httpStatus.BAD_REQUEST, true));
  }
}

const raz_create_subscription = async (req, res, next) => {
  try {
    const reqData = req.body;
    const loggedInUser = req.user;
    // if (loggedInUser.subscription_status.status != 'no_plan_selected' && loggedInUser.subscription_status.status != 'canceled') {
    if (loggedInUser.subscription_status.status === 'active' || loggedInUser.subscription_status.status === 'authenticated' || loggedInUser.subscription_status.status === 'created') {
      let obj = resPattern.errorPattern(
        httpStatus.BAD_REQUEST,
        "It appears You are already subscribed,consider updating subscription if you want."
      );
      return res.status(obj.code).json(obj);
    }
    // }
    else {
      const plan = await Plan.findById(reqData.plan_id);
      const total_count = await hundred_years(plan.recurring.interval, plan.recurring.interval_count)
      let start_date = undefined;
      let payload = undefined;
      if (plan.trial_days > 0) {
        start_date = moment().add(plan.trial_days, "days").unix()
        payload = {
          plan_id: plan.razor_product.id,
          total_count: total_count,
          start_at: start_date
        }
      } else {
        payload = {
          plan_id: plan.razor_product.id,
          total_count: total_count,
        }
      }
      const razor_customer = await razorHelper.customer(loggedInUser);
      const result = await razorHelper.subscribe(payload);
      if (result.status === 'created') {
        let subscription = new Subscription({
          owner_id: mongoose.Types.ObjectId(loggedInUser._id),
          plan_id: mongoose.Types.ObjectId(reqData.plan_id),
          is_payment_offline: false,
          razor_subscription_id: result.id,
          razor_plan_id: plan.razor_product.id,
          subscription_status: result.status,
          razor_subscription: result,
          razor_subscription_cycle: result
        });
        subscription = await subscription.save();
        await User.findByIdAndUpdate(
          loggedInUser._id,
          {
            razor_customer: razor_customer,
            subscription_status: {
              subscription_id: subscription._id,
              razor_subscription_id: result.id,
              status: result.status,
              current_period_end: result.current_end,
              is_trial_used: plan.trial_days > 0 ? true : false,
            }
          },
          { new: true }
        );
        let obj = resPattern.successPattern(
          httpStatus.OK,
          subscription,
          "success"
        );
        return res.status(obj.code).json(obj);
      } else {
        let obj = resPattern.errorPattern(
          httpStatus.BAD_REQUEST,
          "Something went wrong, kindly contact customer support if the amount is deducted.",
          "failure"
        );
        return res.status(obj.code).json(obj);
      }
    }
  } catch (e) {
    return next(new APIError(e.message, httpStatus.BAD_REQUEST, true));
  }
}

const raz_update_subscription = async (req, res, next) => {
  try {
    let reqData = req.body;
    const loggedInUser = req.user;
    let old_subscription = await Subscription.findById(loggedInUser.subscription_status.subscription_id);
    // reqData.old_subscription = old_subscription;
    if (loggedInUser.subscription_status.is_schedule_awaiting === true) {
      let obj = resPattern.errorPattern(
        httpStatus.BAD_REQUEST,
        "You have switched to subscription which is scheduled to activate at " + moment(old_subscription.razor_subscription_cycle.change_scheduled_at).utc().format('Do,MMM,YYYY, h:mm:ss a'),
        "failure"
      );
      return res.status(obj.code).json(obj);
    }
    else if (old_subscription.is_subscription_canceled) {
      let obj = resPattern.errorPattern(
        httpStatus.BAD_REQUEST,
        "The subscription is already canceled.",
        "failure"
      );
      return res.status(obj.code).json(obj);
    }
    else {
      const plan = await Plan.findById(reqData.new_plan_id);
      const payload = {
        raz_subscription_id: loggedInUser.subscription_status.razor_subscription_id,
        plan_id: plan.razor_product.id,
        schedule_change_at: reqData.schedule_change_at
      }
      const result = await razorHelper.update_subscription(payload);

      if ((result.status === 'active' || result.status === 'authenticated') && !result.has_scheduled_changes) {
        console.log("result.status === 'active' && !result.has_scheduled_changes");
        old_subscription = await Subscription.findByIdAndUpdate(old_subscription._id, {
          $set: {
            is_subscribed: false,
            subscription_status: 'cancelled',
            cancellation_reason: 'switched to another plan',
            is_subscription_canceled: true,
            canceled_at: moment().toDate()
          }
        }, { new: true })

        let subscription = new Subscription({
          owner_id: mongoose.Types.ObjectId(loggedInUser._id),
          plan_id: mongoose.Types.ObjectId(reqData.new_plan_id),
          razor_subscription_id: result.id,
          razor_plan_id: result.plan_id,
          subscription_status: result.status,
          razor_subscription: result,
          razor_subscription_cycle: result
        });
        subscription = await subscription.save();
        await User.findByIdAndUpdate(
          loggedInUser._id,
          {
            $set: {
              subscription_status: {
                subscription_id: subscription._id,
                razor_subscription_id: result.id,
                status: subscription.subscription_status,
                is_trial_used: true,
                current_period_end: result.current_end,
              }
            }
          },
          { new: true }
        );

        let obj = resPattern.successPattern(
          httpStatus.OK,
          subscription,
          "success"
        );
        return res.status(obj.code).json(obj);
      }
      else if (result.status === 'active' && result.has_scheduled_changes) {
        console.log("result.status === 'active' && result.has_scheduled_changes");
        old_subscription = await Subscription.findByIdAndUpdate(old_subscription._id,
          {
            $set:
            {
              is_subscribed: true,
              subscription_status: 'deprecated',
              cancellation_reason: 'switched to another plan',
              is_subscription_canceled: true,
              razor_subscription_cycle: result,
              canceled_at: moment().toDate()
            }
          }, { new: true })
        await User.findByIdAndUpdate(loggedInUser._id, {
          $set: {
            "subscription_status.is_schedule_awaiting": true,
            // "subscription_status.status": result.status,
            // "subscription_status.stripe_sub_schedule_id": result.id,
          }
        })

        let subscription = new Subscription({
          owner_id: mongoose.Types.ObjectId(loggedInUser._id),
          plan_id: mongoose.Types.ObjectId(plan._id),
          subscription_type: "subscription_schedule",
          razor_subscription_id: result.id,
          razor_plan_id: result.plan_id,
          subscription_status: result.status,
          razor_subscription: result,
          razor_subscription_cycle: result,
        });
        subscription = await subscription.save();

        let obj = resPattern.successPattern(
          httpStatus.OK,
          subscription,
          "success"
        );
        return res.status(obj.code).json(obj);
      }
      else {
        let obj = resPattern.errorPattern(
          httpStatus.BAD_REQUEST,
          "Something went wrong, kindly contact customer support if the amount is deducted.",
          "failure"
        );
        return res.status(obj.code).json(obj);
      }
    }
  } catch (e) {
    return next(new APIError(e.message, httpStatus.BAD_REQUEST, true));
  }
}

const raz_unsubscribe = async (req, res, next) => {
  try {
    const reqData = req.body;
    const loggedInUser = req.user;
    const target_sub = await Subscription.findById(loggedInUser.subscription_status.subscription_id);
    let canceled_sub_id = undefined;
    if (loggedInUser.subscription_status.status != 'cancelled') {
      const result = await razorHelper.cancel_subscription(target_sub.razor_subscription_id, reqData.cancel_at_cycle_end);
      canceled_sub_id = loggedInUser.subscription_status.subscription_id;
      let subscription = await Subscription.findByIdAndUpdate(canceled_sub_id, {
        $set:
        {
          is_subscribed: false,
          razor_subscription_cycle: result,
          subscription_status: reqData.cancel_at_cycle_end ? result.subscription.status : 'cancelled',
          cancellation_reason: reqData.cancellation_reason ? reqData.cancellation_reason : null,
          is_subscription_canceled: true,
          canceled_at: moment().toDate(),
        }
      }, { new: true })
      await User.findByIdAndUpdate(
        loggedInUser._id,
        {
          $set:
          {
            isActive: reqData.cancel_at_cycle_end ? true : false,
            subscription_status: {
              subscription_id: loggedInUser.subscription_status.subscription_id,
              razor_subscription_id: result.subscription.id,
              status: reqData.cancel_at_cycle_end ? result.subscription.status : 'cancelled',
              is_trial_used: loggedInUser.is_trial_used ? true : false,
              current_period_end: result.subscription.current_end
            }
          }
        },
        { new: true }
      );
      let obj = resPattern.successPattern(
        httpStatus.OK,
        subscription,
        "success"
      );
      return res.status(obj.code).json(obj);
    }
    else if (target_sub.is_subscription_canceled) {
      let obj = resPattern.errorPattern(
        httpStatus.BAD_REQUEST,
        "The subscription is already canceled.",
        "failure"
      );
      return res.status(obj.code).json(obj);
    }
    else {
      let obj = resPattern.errorPattern(
        httpStatus.BAD_REQUEST,
        "Something went wrong, kindly contact customer support if the amount is deducted.",
        "failure"
      );
      return res.status(obj.code).json(obj);
    }

  } catch (e) {
    return next(new APIError(e.message, httpStatus.BAD_REQUEST, true));
  }
}

// --- razor-pay subscription web-hooks --- 
const raz_sub_hooks = async (req, res, next) => {
  try {
    // const user = req.user;
    // const params = req.params;
    // const query = req.query;
    const reqData = req.body;
    const event = reqData.event;
    let isActive = undefined;
    let subscription = await Subscription.findOneAndUpdate({
      razor_subscription_id: reqData.payload.subscription.entity.id,
      razor_plan_id: reqData.payload.subscription.entity.plan_id,
    },
      {
        $set: {
          subscription_status: reqData.payload.subscription.entity.status,
          razor_subscription_cycle: reqData.payload.subscription.entity,
        }
      }
    )
    let owner = await User.findById(subscription.owner_id);
    owner.subscription_status.status = reqData.payload.subscription.entity.status;
    owner.subscription_status.current_period_end = reqData.payload.subscription.entity.current_end;
    // --- filtering the types of events send as web-hook subscription over razor-pay ---
    switch (event) {
      case "subscription.authenticated":
        // console.log("subscription.authenticated");

        isActive = true
        break;
      case "subscription.activated":
        // console.log("subscription.activated");

        isActive = true
        break;
      case "subscription.charged":
        // console.log("subscription.charged");
        isActive = true
        break;
      case "subscription.completed":
        // console.log("subscription.completed");

        isActive = false
        break;
      case "subscription.updated":
        // console.log("subscription.updated");
        isActive = true
        owner.is_trial_used = true
        break;
      case "subscription.pending":
        // console.log("subscription.pending");
        isActive = true
        break;
      case "subscription.halted":
        // console.log("subscription.halted");
        isActive = false
        break;
      case "subscription.cancelled":
        // console.log("subscription.cancelled");

        isActive = false
        owner.subscription_status.message = null
        owner.is_trial_used = true
        break;
      case "subscription.paused":
        // console.log("subscription.paused");
        isActive = false
        break;
      case "subscription.resumed":
        // console.log("subscription.resumed");
        isActive = true
        break;

      default:
        isActive = false
        console.log("default");
        break;
    }
    let result = undefined
    owner.isActive = isActive;
    if (!owner.is_outlet) {
      await User.updateMany(
        { is_outlet: true, hosting_Address: owner.hosting_Address },
        { $set: { isActive: isActive } }
      )
    }
    if (owner) { result = await owner.save() }


    let obj = resPattern.successPattern(httpStatus.OK, result, 'success');
    return res.status(obj.code).json(obj);
  } catch (e) {
    return next(new APIError(e.message, httpStatus.BAD_REQUEST, true));
  }
}

module.exports = {
  // common features 
  active_plans,

  // stripe modules
  get_price,
  create_subscription,
  create_plan,
  update_plan,
  disable_plan,
  get_plan,
  fetch_plans,
  fetch_plans_country,
  cancel_subscription,
  update_subscription,
  subscription_schedule_webhook,
  subscription_renew_webhook,
  get_subscription,
  preview_subscription,
  subscription_detach_subscribers_webhook,
  payment_method,

  //  razor pay modules
  raz_pingV2,
  raz_ping,
  raz_customer,
  raz_create_plan,
  raz_update_plan,
  raz_disable_plan,
  raz_create_subscription,
  raz_update_subscription,
  raz_unsubscribe,
  raz_sub_hooks,
  razor_oneTime_sub,
  razor_oneTime_capture,
  razor_oneTime_cancel
};
