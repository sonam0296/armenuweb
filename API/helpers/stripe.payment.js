const dotenv = require("dotenv");
dotenv.config();
const Stripe = require("stripe");
const stripe = Stripe(process.env.Strip_test_key_id);
const moment = require("moment");
const { date } = require("joi");

const on_boarding = async function (req, res, next) {
  // const query = req.query;
  const account = await stripe.oauth.token({
    grant_type: "authorization_code",
    code: query.code,
  });
  const accountLinkURL = await generateAccountLink(account.stripe_user_id);
  return accountLinkURL;
};

const stripe_platform_sign_in = async function (req) {
  const query = req.query;
  let account = await stripe.oauth.token({
    grant_type: "authorization_code",
    code: query.code,
  });
  account = await stripe.accounts.retrieve(account.stripe_user_id);
  return account;
};

const creating_stripe_acc = async function (req, res, next) {
  const account = await stripe.accounts.create({
    type: "standard",
  });
  // console.log('account: ', account);
  const accountLinkURL = await generateAccountLink(account.id);
  return accountLinkURL;
};



const generateAccountLink = async function (account_id) {
  const accountLinks = await stripe.accountLinks.create({
    account: account_id,
    refresh_url: "http://app.appetizar.io/#/connectstripe",
    return_url: "http://app.appetizar.io/#/connectstripe",
    // refresh_url: 'http://localhost:6001/api/user/stripe/get_Stripe_response',
    // return_url: 'http://localhost:6001/api/user/stripe/get_Stripe_response',
    type: "account_onboarding",
  });
  return accountLinks;
};

const deauth_stripe_account = async function (req, res, next) {
  const query = req.query;
  // const account = await stripe.oauth.token({
  //     grant_type: 'authorization_code',
  //     code: query.code,
  // });
  const response = await stripe.oauth.deauthorize({
    client_id: process.env.Stripe_client_id,
    stripe_user_id: query.code,
  });
  return response;
};

// ----- payment process -----

const stripe_payintent = async (payment_data, acc_id) => {
  const paymentIntent = await stripe.paymentIntents.create(
    {
      payment_method_types: ["card"],
      amount: payment_data.amount,
      currency: payment_data.currency,
      receipt_email: payment_data.email,
      // application_fee_amount: parseFloat(
      //   ((payment_data.amount * 10) / 100).toFixed(0)
      // ),
      description: "Created by Appetizar-food service",
    },
    {
      stripeAccount: acc_id,
    }
  );

  return paymentIntent;
};

const stripe_webhook_mgt = async (req, res, next) => {
  try {
    const event = req.body;
    // Handle the event
    switch (event.type) {
      case "payment_intent.succeeded":
        const paymentIntent = event.data.object;
        return { paymentIntent };
      // break;
      case "payment_method.attached":
        const paymentMethod_attached = event.data.object;
        return { paymentMethod_attached };
      // break;
      case "payment_intent.payment_failed":
        const paymentMethod_payment_failed = event.data.object;
        return { paymentMethod_payment_failed };
      // break;

      // ... handle other event types
      default:
        // console.log(`Unhandled event type ${event.type}`);
        return { event };
    }
  } catch (err) {
    console.log("error: ", err.message);
    return { status: false, message: err.message };
    // .send(`Webhook Error: ${err.message}`);
  }
};

const cancel_paymentIntent = async (payment_intent_id, owner) => {
  const result = await stripe.paymentIntents.cancel(
    payment_intent_id,
    {
      cancellation_reason: "requested_by_customer",
    },
    {
      stripeAccount: owner.stripe_account.stripe_user_id,
    }
  );
  return result;
};

const stripe_refund = async (payment_intent_id, owner) => {
  const result = await stripe.refunds.create(
    {
      payment_intent: payment_intent_id,
      reason: "requested_by_customer",
    },
    {
      stripeAccount: owner.stripe_account.stripe_user_id,
    }
  );
  return result;
};

//  --- stripe play ground ---


const create_customer = async (user) => {
  const customer = await stripe.customers.create(
    {
      name: user.name,
      email: user.email,
      phone: user.phone,
      // source: 'tok_mastercard',
      description: user.userType === 'owner' ? "Restaurant account plan-onboarding" : "Aggregator account plan-onboarding",
    }
    // , {
    //     stripeAccount: stripe_con_acc,
    // }
  );

  return customer;
};

const payment_method = async (req, res, next) => {
  const paymentMethod = await stripe.paymentMethods.create(
    {
      type: "card",
      card: {
        number: "4242424242424242",
        exp_month: 12,
        exp_year: 2021,
        cvc: "123",
      },
    }
    // , {
    //     stripeAccount: stripe_con_acc,
    // }
  );

  return paymentMethod;
};

const attach_payment_method = async (req, res, next) => {
  let result = undefined;
  const paymentMethod = await stripe.paymentMethods.attach(
    req.body.paymentMethod_id,
    {
      customer: req.body.customer_id,
    }
  );
  const customer = await stripe.customers.update(req.body.customer_id, {
    invoice_settings: { default_payment_method: paymentMethod.id },
  });
  result = {
    paymentMethod: paymentMethod,
    customer: customer,
  };
  return result;
};


const create_product = async (data) => {
  // const stripe_con_acc = req.body.stripe_con_acc;
  const product = await stripe.products.create({
    name: data.title,
    description: data.content,
  });

  return product;
};

const update_product = async (data) => {
  // const stripe_con_acc = req.body.stripe_con_acc;

  const product = await stripe.products.update(data.stripe_product.id, {
    name: data.title,
    description: data.content,
  });

  return product;
};

const disable_product = async (data) => {
  // const stripe_con_acc = req.body.stripe_con_acc;

  const product = await stripe.products.update(data.stripe_product.id, {
    active: false,
    metadata: {
      message: data.message ? data.message : "The package is disabled."
    },
  });

  return product;
};

const create_price_aggregator = async (data, product_id) => {
  // const stripe_con_acc = req.body.stripe_con_acc;
  const price = await stripe.prices.create({
    unit_amount: parseInt((data.unit_amount * 100).toFixed(2)),
    currency: data.currency,
    recurring: {
      interval: data.interval ? data.interval : "month",
      interval_count: data.interval_count ? data.interval_count : 1,
    },
    product: product_id,
  });

  return price;
};

const create_price = async (data, product_id) => {
  // const stripe_con_acc = req.body.stripe_con_acc;
  const price = await stripe.prices.create({
    // unit_amount: parseInt((data.unit_amount * 100).toFixed(2)),
    currency: data.currency,
    recurring: {
      interval: data.interval ? data.interval : "month",
      aggregate_usage: "last_during_period",
      usage_type: "metered",
      interval_count: data.interval_count ? data.interval_count : 1,
    },
    product: product_id,
    tiers_mode: "graduated",
    billing_scheme: "tiered",
    tiers: [
      {
        flat_amount_decimal: parseInt((data.unit_amount * 100).toFixed(2)),
        unit_amount_decimal: 0,
        up_to: data.usage_threshold,
      },
      {
        flat_amount_decimal: 0,
        unit_amount_decimal: parseInt((data.usage_charge_unit * 100).toFixed(2)),
        up_to: "inf",
      },
    ]
  });

  return price;
};


const get_price = async (data) => {
  // const stripe_con_acc = req.body.stripe_con_acc;
  const product = await stripe.prices.retrieve(
    data,
  );
  return product;
};

const get_subscription = async (data) => {
  // const stripe_con_acc = req.body.stripe_con_acc;
  const subscription = await await stripe.subscriptions.retrieve(
    data
  );

  return subscription;
};



const preview_next_subscription = async (data, customer_id, subscription_id) => {
  // const stripe_con_acc = req.body.stripe_con_acc;
  const proration_date = moment().unix();

  const subscription = await stripe.subscriptions.retrieve(subscription_id);

  // See what the next invoice would look like with a price switch
  // and proration set:
  const items = [{
    id: subscription.items.data[0].id,
    price: data.new_stripe_price_id, // Switch to new price
  }];

  const invoice = await stripe.invoices.retrieveUpcoming({
    customer: customer_id,
    subscription: subscription_id,
    subscription_items: items,
    subscription_proration_date: proration_date,
  });

  return invoice;
};


const create_subscription = async (data) => {
  // --attach payment method to customer (owner)
  let paymentMethod = await stripe.paymentMethods.attach(data.paymentMethodId, {
    customer: data.customer,
  });
  // Change the default invoice settings on the customer to the new payment method
  const customer = await stripe.customers.update(data.customer, {
    invoice_settings: {
      default_payment_method: data.paymentMethodId,
    },
  });
  sub = {
    customer: data.customer,
    default_payment_method: paymentMethod.id,
    items: [{ price: data.price }],
    expand: ["latest_invoice.payment_intent"],
    trial_period_days: data.trial_days
  };
  const subscription = await stripe.subscriptions.create(sub);
  const response = { customer, subscription };
  return response;
};


const update_subscription = async (data, subscription_status, stripe_customer) => {

  let subscription = undefined;
  if (data.change_now) {
    subscription = await stripe.subscriptions.update(subscription_status.stripe_subscription_id, {
      cancel_at_period_end: false,
      proration_behavior: 'always_invoice',
      items: [{
        id: data.old_subscription.stripe_subscription_cycle.items.data[0].id,
        price: data.new_price,
      }],
      expand: ["latest_invoice.payment_intent"],
    });
  } else {
    result = await stripe.subscriptions.update(subscription_status.stripe_subscription_id, {
      cancel_at_period_end: true
    });

    subscription = await stripe.subscriptionSchedules.create({
      customer: stripe_customer.id,
      start_date: result.cancel_at,
      // start_date: moment.unix(result.cancel_at).add(1,'d').unix(),
      end_behavior: 'release',
      phases: [
        {
          items: [
            {
              price: data.new_price
            },
          ]
        },
      ],
      expand: ['subscription'],
    });
  }
  // console.log('updated subscription schedule ',subscription_schedule);
  return subscription;
};

const cancel_subscription = async (data, subscription_status) => {
  let result = undefined;
  if (data.is_subscription_schedule) {
    result = await stripe.subscriptionSchedules.cancel(
      subscription_status.stripe_sub_schedule_id
    );
  } else {
    if (data.cancel_now) {
      result = await stripe.subscriptions.del(subscription_status.stripe_subscription_id, {
        prorate: true,
        invoice_now: true
      });
    } else {
      result = await stripe.subscriptions.update(subscription_status.stripe_subscription_id, {
        cancel_at_period_end: true
      });
    }
  }
  return result;
};

//  --- get all subscriptions with attached price id------ depreciated
const get_all_subscriptions = async (data) => {
  // const stripe_con_acc = req.body.stripe_con_acc;
  const subscriptions = await stripe.subscriptions.list({
    // customer:data.customer,
    price: data.price,
    // status:data.status,
  });

  return subscriptions;
};

const remove_subscribers = async (plan) => {

  stripe.subscriptions
    .list({ price: plan.stripe_price.id })
    .autoPagingEach((subscription) => {
      return stripe.subscriptions.update(subscription.id, {
        cancel_at_period_end: true,
        metadata: { is_archived: "true" }
      });
    })
    .then(() => {
      console.log('Done iterating.');
    })
    .catch((err) => { return err });

};


const sub_usage_charge = async (subscriptionId, quantity) => {
  let value = await stripe.subscriptionItems.createUsageRecord(
    subscriptionId,
    { quantity: quantity, timestamp: moment().unix() }
  );
  return value
}

const subscription_items = async (subscriptionId) => {
  let value = await stripe.subscriptionItems.list({
    subscription: subscriptionId,
  });
  return value
}

// sub_usage_charge("si_JFHBkTlFUcfGYt",3).then((data)=>{
//   console.log(data);
// }).catch((err)=>{
//   console.log(err.message);
// })

// get_subscription("sub_JFHBZer5y8r3et").then(result => {
//   console.log(result.items);
// }).catch(err => {
//   console.log(err.message);
// });

module.exports = {
  on_boarding,
  deauth_stripe_account,
  creating_stripe_acc,
  stripe_platform_sign_in,
  stripe_payintent,
  stripe_webhook_mgt,
  cancel_paymentIntent,
  stripe_refund,
  payment_method,
  create_customer,
  create_product,
  create_price,
  create_price_aggregator,
  create_subscription,
  get_price,
  attach_payment_method,
  disable_product,
  update_product,
  cancel_subscription,
  update_subscription,
  get_subscription,
  preview_next_subscription,
  get_all_subscriptions,
  remove_subscribers,
  subscription_items,
  sub_usage_charge,
};
