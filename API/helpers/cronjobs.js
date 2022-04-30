const cron = require('node-cron');
const { send_req } = require('../helpers/sendRequest')
const moment = require('moment')
const unix_now = moment().unix()
const unix_plus_day = moment().add(1, 'days').unix()
const unix_medium = moment().add(8, 'hours').unix()
const Plan = require("../model/plan.model");
const User = require("../model/user.model");
const Subscription = require("../model/subscription.model");
const Orders = require("../model/orders.model");
const stripeHelper = require("../helpers/stripe.payment");
const razorHelper = require("../helpers/razor.payment");
const bulkController = require("../controller/bulk.controller");

// console.log(unix_now, "<", unix_medium, "<", unix_plus_day, "===>", unix_now <= unix_medium, unix_medium < unix_plus_day);

// ---- cron jobs ----

// --- charge owners with razorpay subscription ---

const raz_owner_hunt = cron.schedule('15 */8 * * *',
  // // --- tick function --

  async () => {
    console.log('running a task every 8 hours of 1st min');
    User.find({
      userType: "owner",
      country_name: "India",
      isActive: true,
      "subscription_status.current_period_end": { $gte: unix_now, $lt: unix_plus_day }
    }).exec().then(async (data) => {

      // --- find all outlets or restaurants of which the subscription will get renew 24 afterwards ---

      // console.log(data);
      data.forEach(async (element) => {
        // await razorHelper.raz_addOn()
        // --- find the uncharged orders of current subscription ---
        const count = await User.aggregate([
          { $match: { hosting_Address: element.hosting_Address } },
          {
            $lookup: {
              from: 'orders',
              let: { 'owner': '$_id' },
              pipeline: [{
                "$match": {
                  $and:
                    [{ "$expr": { "$eq": ["$owner_id", "$$owner"] } },
                    { "$expr": { "$eq": ["$owner_usage_charged", false] } }]
                }
              },
              {
                "$project": {
                  _id: 1
                }
              }
                // {
                //   "$count": "order_count"
                // }
              ],
              as: 'Orders'
            }
          },
          {
            $facet: {
              orders: [
                { $unwind: "$Orders" },
                {
                  $project: {
                    Order_ids: "$Orders",
                  }
                },
                {
                  $group: {
                    _id: null,
                    // outlet:{$push:"$$ROOT"},
                    total_ids: { $push: "$Order_ids._id" },
                  }
                }
              ],
              order_summery: [
                {
                  $project: {
                    outlets: {
                      _id: "$_id",
                      Order_count: { $size: "$Orders" },
                    },
                  },
                },
                {
                  $group: {
                    _id: null,
                    Outlet_performance: { $push: "$outlets" },
                    total_orders: { $sum: "$outlets.Order_count" },
                  }
                }
              ],
            }
          },
        ])

        // --- figure which plan the restaurant belongs to for measuring if the usage threshold exceeds ---

        //   const plan = await Subscription.findById(element.subscription_status.subscription_id).populate('plan_id').select('razor_subscription_id plan_id')

        // --- charge for extra usages ---
        // let razorAddon = undefined;
        // if (count && count[0].order_summery.length > 0 && count[0].order_summery[0].total_orders >= plan.plan_id.usage_threshold) {
        // const quantity = count[0].order_summery[0].total_orders - plan.plan_id.usage_threshold
        // razorAddon = await razorHelper.raz_addOn(plan.razor_subscription_id, plan.plan_id, quantity)
        // }

        let order_updates = undefined

        if (count && count[0].orders.length > 0) {
          // console.log("update executed");
          order_updates = await Orders.updateMany({ _id: { $in: count[0].orders[0].total_ids } }, { $set: { owner_usage_charged: true } })
        }
        // await send_req("https://untitled-b2sp64kueh2z.runkit.sh/owners", { count, order_updates })
      })
    })

  });

const raz_stat_owner_hunt = cron.schedule('30 */8 * * *',
  // // --- tick function --

  async () => {
    // console.log('running a task every 10 secs');
    console.log('running a task every 8 hours of 1st min');
    User.find({
      userType: "owner",
      country_name: "India",
      isActive: true,
      "subscription_status.current_period_end": { $gte: unix_now, $lt: unix_plus_day }
    }).exec().then(async (data) => {

      // --- find all outlets or restaurants of which the subscription will get renew 24 afterwards ---

      // console.log(data);
      if (data && data.length > 0) {
        data.forEach(async (element) => {

          await User.updateMany(
            { _id: element._id },
            {
              isActive: false,
              "subscription_status.status": "cancelled",
            })

          await Subscription
            .findByIdAndUpdate(element.subscription_status.subscription_id, {
              subscription_status: "cancelled",
              is_subscription_canceled: true,
              canceled_at: moment().toDate()
            })

          // await send_req("https://untitled-b2sp64kueh2z.runkit.sh/owners", { element })
          // await send_req("https://untitled-b2sp64kueh2z.runkit.sh/owners", { user, subscription })

        })
      }
    })
  });

const stripe_owner_hunt = cron.schedule('45 */8 * * *',
  // // --- tick function --

  async () => {
    // console.log('running a task every 20 seconds');
    console.log('running a task every 8 hours of 30th min');

    User.find({
      userType: "owner",
      isActive: true,
      country_name: { $ne: "India" },
      "subscription_status.current_period_end": { $gte: unix_now, $lt: unix_plus_day }
    }).exec().then(async (data) => {

      // --- find all outlets or restaurants of which the subscription will get renew 24 afterwards ---

      // console.log(data);
      data.forEach(async (element) => {
        // await razorHelper.raz_addOn()
        // --- find the uncharged orders of current subscription ---
        const count = await User.aggregate([
          { $match: { hosting_Address: element.hosting_Address } },
          {
            $lookup: {
              from: 'orders',
              let: { 'owner': '$_id' },
              pipeline: [{
                "$match": {
                  $and:
                    [{ "$expr": { "$eq": ["$owner_id", "$$owner"] } },
                    { "$expr": { "$eq": ["$owner_usage_charged", false] } }]
                }
              },
              {
                "$project": {
                  _id: 1
                }
              }
                // {
                //   "$count": "order_count"
                // }
              ],
              as: 'Orders'
            }
          },
          {
            $facet: {
              orders: [
                { $unwind: "$Orders" },
                {
                  $project: {
                    Order_ids: "$Orders",
                  }
                },
                {
                  $group: {
                    _id: null,
                    // outlet:{$push:"$$ROOT"},
                    total_ids: { $push: "$Order_ids._id" },
                  }
                }
              ],
              order_summery: [
                {
                  $project: {
                    outlets: {
                      _id: "$_id",
                      Order_count: { $size: "$Orders" },
                    },
                  },
                },
                {
                  $group: {
                    _id: null,
                    Outlet_performance: { $push: "$outlets" },
                    total_orders: { $sum: "$outlets.Order_count" },
                  }
                }
              ],
            }
          },
        ])

        // --- figure which plan the restaurant belongs to for measuring if the usage threshold exceeds ---

        const subscription = await Subscription.findById(element.subscription_status.subscription_id)
          // .populate('plan_id')
          .select('stripe_subscription_cycle plan_id')

        // --- charge for extra usages ---
        // let stripeUsageCharge = undefined;
        if (count && count[0].order_summery[0].total_orders > 0) {
          // console.log(subscription.stripe_subscription_cycle.items.data[0].id);
          // console.log(count[0].order_summery[0].total_orders);
          const quantity = count[0].order_summery[0].total_orders
          stripeUsageCharge = await stripeHelper.sub_usage_charge(subscription.stripe_subscription_cycle.items.data[0].id, quantity)
        }

        let order_updates = undefined
        // console.log(count[0].orders.length);
        if (count && count[0].orders.length > 0) {
          // console.log("update executed");
          order_updates = await Orders.updateMany({ _id: { $in: count[0].orders[0].total_ids } }, { $set: { owner_usage_charged: true } })
        }
        // await send_req("https://untitled-b2sp64kueh2z.runkit.sh/owners", { count, order_updates })
      })
    })

  });

// const bulk_write = cron.schedule('*/2 * * * * *', async () => {
//   const url = "https://untitled-b2sp64kueh2z.runkit.sh/owners"
//   const req = {
//     body: {
//       count: 1000
//     }
//   }
//   const docs = await User.countDocuments()
//   if (docs <= 2000000) {
//     console.log(`running a task every 10 seconds ${docs}`);
//     await bulkController.add_users(req)
//   }

// })

// bulk_write.start()
// bulk_write.stop()

module.exports = {
  raz_owner_hunt,
  stripe_owner_hunt,
  raz_stat_owner_hunt
}