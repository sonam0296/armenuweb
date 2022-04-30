const dotenv = require('dotenv');
dotenv.config();
const Razorpay = require('razorpay');
const crypto = require('crypto');
const axios = require('axios');
const moment = require('moment')

const razor_instance = new Razorpay({
    key_id: process.env.Razor_test_key_id,
    key_secret: process.env.Razor_test_key_secret,
});

// --- razor pay order payment management ---
const create_order = async function (options) {
    const order = await razor_instance.orders.create(options);
    return order;
}

// create_order({
//     amount: parseFloat((10 * 100).toFixed(2)), // amount == Rs 10
//     currency: "INR",
//     notes:{purchase_type:"subscription"},
//     payment_capture: 1
//     // 1 for automatic capture // 0 for manual capture
//   }).then((data)=>{
//       console.log(data);
//   })
const get_payment_details = async function (options) {
    const payment = await razor_instance.payments.fetch(options.razorpay_payment_id)
    return payment;
}

const verify_raz_signature = async function (options) {
    const hmac = crypto.createHmac('sha256', process.env.Razor_test_key_secret);
    const generated_signature = hmac.update(options.razorpay_order_id + "|" + options.razorpay_payment_id).digest("hex");
    if (generated_signature.toString() == options.razorpay_signature.toString()) {
        return true
    }
    else {
        return false;
    }
}

const verify_raz_transfer = async function (req) {
    const web_hook_secret = crypto.createHmac('sha256', process.env.Razor_web_hook_secret);
    const generated_signature = web_hook_secret.update(JSON.stringify(req.body));
    const digest = generated_signature.digest("hex");

    return digest.toString() === req.headers['x-razorpay-signature'].toString();
}

const razor_refund = async (payment_id) => {
    const result = await razor_instance.payments.refund(payment_id,
        {
            reverse_all: 1,
            notes: {
                reason: "Requested by customer"
            }
        });
    return result;
}


// --- razor pay order payment management ---

const create_plan = async (data) => {
    try {
        const payload = {
            period: data.recurring.interval,
            interval: data.recurring.interval_count,
            item: {
                name: data.title,
                amount: parseInt((data.unit_amount * 100).toFixed(2)),
                currency: "INR",
                description: data.content
            },
            notes: {
                initial_name: data.title
            }
        }
        let value = await razor_instance.plans.create(payload);
        return value
    }
    catch (error) {
        error = {
            message: error.error.description
        }
        throw error
    }
}

const fetch_plans = async (data = {}) => {
    try {
        let value = await razor_instance.plans.all(data);
        return value
    } catch (error) {
        error = {
            message: error
        }
    }
}



const plan = async (planId) => {
    try {
        let value = await razor_instance.plans.fetch(planId);
        return value
    } catch (error) {
        error = {
            message: error.error.description
        }
        throw error
    }
}

const customer = async (data) => {
    try {
        let user = {
            name: data.name,
            email: data.email,
            contact: data.phone,
            fail_existing: 0          //fetches the already created customer
        }
        let value = await razor_instance.customers.create(user);
        return value
    } catch (error) {
        error = {
            message: error.error.description
        }
        throw error
    }
}

const subscribe = async (data) => {
    try {
        let value = await razor_instance.subscriptions.create(data);
        return value
    } catch (error) {
        error = {
            message: error.error.description
        }
        throw error
    }
}

const get_subscription = async (subscriptionId) => {
    try {
        let value = await razor_instance.subscriptions.fetch(subscriptionId);
        return value
    } catch (error) {
        error = {
            message: error.error.description
        }
        throw error
    }
}

// get_subscription("sub_GrfMeblpjgVLIb").then(result =>{
//    console.log(result);
// }).catch(err=>{
//    console.log(err);
// });

const update_subscription = async (subscription) => {
    try {
        /**
         * subscription {
         * raz_subscription_id:sub_*****
         * plan_id: plan_*****
         * schedule_change_at: now/cycle_end
         * }
         */
        // const url = `/v1/subscriptions/${subscription.raz_subscription_id}`
        const url = `https://api.razorpay.com/v1/subscriptions/${subscription.raz_subscription_id}`
        const old_sub = await get_subscription(subscription.raz_subscription_id)
        subscription.remaining_count = old_sub.remaining_count - 1;
        delete subscription.raz_subscription_id;

        const postData = JSON.stringify(subscription);
        var options = {
            url: url,
            // baseURL: 'https://api.razorpay.com',
            auth: {
                'username': process.env.Razor_test_key_id,
                'password': process.env.Razor_test_key_secret
            },
            data: postData,
            method: "PATCH",
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };
        let value = undefined;
        await axios(options).then(result => {
            value = result.data
        }).catch(err => {
            err = {
                message: err.response.data.error.description
            }
            throw err
        });
        return value
    } catch (error) {
        throw error
    }
}

const cancel_subscription = async (subscriptionId, cancelAtCycleEnd) => {
    try {
        let subscription = undefined;
        let invoices = undefined;
        let duration = undefined;
        if (!cancelAtCycleEnd) {
            subscription = await get_subscription(subscriptionId);
            if (subscription.status === 'authenticated') {
                subscription = await razor_instance.subscriptions.cancel(subscriptionId, cancelAtCycleEnd);
                return { subscription }
            }
            const running_plan = await plan(subscription.plan_id);
            duration = {
                current_start: subscription.current_start,
                current_end: subscription.current_end,
                current_time: moment().unix(),
                cycle_amount: running_plan.item.amount
            }
            duration.spent_duration = duration.current_time - duration.current_start
            duration.unused_duration = duration.current_end - duration.current_time
            duration.cycle_duration = duration.current_end - duration.current_start
            duration.charge = Math.floor((duration.spent_duration * duration.cycle_amount) / duration.cycle_duration)
            duration.refund = Math.floor((duration.unused_duration * duration.cycle_amount) / duration.cycle_duration)

            subscription = await razor_instance.subscriptions.cancel(subscriptionId, cancelAtCycleEnd);

            const url = `https://api.razorpay.com/v1/invoices?subscription_id=${subscriptionId}`
            var options = {
                url: url,
                // baseURL: 'https://api.razorpay.com',
                auth: {
                    'username': process.env.Razor_test_key_id,
                    'password': process.env.Razor_test_key_secret
                },
                method: "GET",
            };
            await axios(options).then(result => {
                invoices = result.data
            }).catch(err => {
                err = {
                    message: err.response.data.error.description
                }
                throw err
            });
            console.log(duration);
            const refund = await raz_refund(invoices.items[0].payment_id, duration.refund)
            return { subscription, running_plan, duration, invoices, refund }
        }
        else {
            subscription = await razor_instance.subscriptions.cancel(subscriptionId, cancelAtCycleEnd);
            return { subscription }
        }

    } catch (error) {
        error = {
            message: error.error.description
        }
        throw error
    }
}

const deprecate_subscription = async (subscriptionId) => {
    let subscription = subscription = await razor_instance.subscriptions.cancel(subscriptionId, true);
    return subscription
}

const raz_refund = async (paymentId, amount) => {
    let value = await razor_instance.payments.refund(paymentId,
        {
            amount: amount,
            notes: {
                reason: "Refund to customer"
            }
        });
    return value
}


const raz_addOn = async (subscriptionId, plan, quantity) => {
    const params = {
        item: {
            "name": plan.title ? plan.title : "no plan title submitted",
            "amount": plan.usage_charge_unit ? plan.usage_charge_unit * 100 : 100,
            "currency": "INR",
            "description": plan._id ? plan._id.toString() : "no plan id submitted",
        },
        quantity: quantity ? quantity : 10
    }
    let value = await razor_instance.subscriptions.createAddon(subscriptionId, params);
    return value
}

const raz_addOn_delete = async (addOnId) => {
    let value = await razor_instance.addons.delete(addOnId);
    return value
}


// raz_addOn_delete("ao_GtBbWNv3ft8hFB").then(result =>{
//     console.log(result);
//  }).catch(err=>{
//     console.log(err);
//  });


module.exports = { create_order, get_payment_details, verify_raz_signature, verify_raz_transfer, razor_refund, create_plan, fetch_plans, plan, subscribe, customer, get_subscription, update_subscription, cancel_subscription, raz_addOn, raz_addOn_delete, deprecate_subscription };
