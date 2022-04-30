const router = require("express").Router();
const plansCtrl = require("../controller/plans.controller");
const validate = require("express-validation");
const { planValidation,razPlanValidation } = require("../helpers/joi.validation");
const { protect, authorize, owned, aggregator } = require("../middleware/auth");

// --- common features ---
router.post(
  "/fetch_plans",
  // protect,
  // authorize,
  // validate(planValidation.fetch_plans),
  plansCtrl.fetch_plans
);
router.post(
  "/active_plans",
  // protect,
  // authorize,
  // validate(planValidation.fetch_plans),
  plansCtrl.active_plans
);

//  --- stripe routes ----
router.post('/payment_method',
  // routprotecter,
  // upload.fields([{ name: "item_image" }]),
  // validate(Joivalidate),
  plansCtrl.payment_method
);

// - fetch all stripe plans-
router.post(
  "/fetch_stripe_plans",
  // protect,
  // authorize,
  // validate(planValidation.fetch_plans),
  plansCtrl.fetch_plans
);
// - fetch all stripe plans-
router.get(
  "/fetch_plans_country",
  // protect,
  // authorize,
  // validate(planValidation.fetch_plans),
  plansCtrl.fetch_plans_country
);

//  - get selected plan details
router.post(
  "/stripe_plan",
  // protect,
  // authorize,
  validate(planValidation.get_plan),
  plansCtrl.get_plan
);

// - create stripe plan
router.post(
  "/create_stripe_plan",
  protect,
  authorize,
  validate(planValidation.create_plan),
  plansCtrl.create_plan
);

// -update stripe plan editable fields only-
router.patch(
  "/update_stripe_plan",
  protect,
  authorize,
  validate(planValidation.update_plan),
  plansCtrl.update_plan
);

// - disable stripe plan -
router.patch(
  "/disable_stripe_plan",
  protect,
  authorize,
  validate(planValidation.disable_plan),
  plansCtrl.disable_plan
);

// - create stripe plan
router.post(
  "/subscribe",
  protect,
  // owned,
  validate(planValidation.create_subscription),
  plansCtrl.create_subscription
);

// - cancel stripe plan
router.patch(
  "/unsubscribe",
  protect,
  // owned,
  validate(planValidation.cancel_subscription),
  plansCtrl.cancel_subscription
);

// - update stripe plan
router.patch(
  "/change_subscription",
  protect,
  validate(planValidation.update_subscription),
  plansCtrl.update_subscription
);

router.post('/stripe_sub_schedule_webhook',
  // routprotecter,
  // upload.fields([{ name: "item_image" }]),
  // validate(Joivalidate),
  plansCtrl.subscription_schedule_webhook
);

router.post('/stripe_sub_renew_webhook',
  // routprotecter,
  // upload.fields([{ name: "item_image" }]),
  // validate(Joivalidate),
  plansCtrl.subscription_renew_webhook
);

router.get('/get_subscription',
  protect,
  owned,
  // upload.fields([{ name: "item_image" }]),
  // validate(Joivalidate),
  plansCtrl.get_subscription
);

router.get('/get_subscription_aggregator',
  protect,
  aggregator,
  // upload.fields([{ name: "item_image" }]),
  // validate(Joivalidate),
  plansCtrl.get_subscription
);

router.post('/preview_next_subscription',
  protect,
  // upload.fields([{ name: "item_image" }]),
  // validate(Joivalidate),
  plansCtrl.preview_subscription
);


router.post('/detach_active_subscribers',
  // routprotecter,
  // upload.fields([{ name: "item_image" }]),
  // validate(Joivalidate),
  plansCtrl.subscription_detach_subscribers_webhook
);

// razor pay routes

// - fetch all razor plans-
router.post(
  "/ping",
  // protect,
  // authorize,
  // validate(planValidation.fetch_plans),
  plansCtrl.raz_ping
);

router.post(
  "/pingV2",
  // protect,
  // authorize,
  // validate(planValidation.fetch_plans),
  plansCtrl.raz_pingV2
);

router.post(
  "/razor-customer",
  // protect,
  // authorize,
  // validate(planValidation.fetch_plans),
  plansCtrl.raz_customer
);

// - fetch all razor plans-
router.post(
  "/fetch_razor_plans",
  // protect,
  // authorize,
  // validate(planValidation.fetch_plans),
  plansCtrl.fetch_plans
);

// - fetch all razor plans-

//  - get selected plan details
router.post(
  "/razor_plan",
  // protect,
  // authorize,
  validate(razPlanValidation.get_plan),
  plansCtrl.get_plan
);

// - create razor plan
router.post(
  "/create_razor_plan",
  protect,
  authorize,
  validate(razPlanValidation.create_plan),
  plansCtrl.raz_create_plan
);

// -update razor plan editable fields only-
router.patch(
  "/update_razor_plan",
  protect,
  authorize,
  validate(razPlanValidation.update_plan),
  plansCtrl.raz_update_plan
);

// - disable razor plan -
router.patch(
  "/disable_razor_plan",
  protect,
  authorize,
  validate(razPlanValidation.disable_plan),
  plansCtrl.raz_disable_plan
);

// razorpay subscription
router.post(
  "/razor-subscribe",
  protect,
  // owned,
  validate(razPlanValidation.create_subscription),
  plansCtrl.raz_create_subscription
);

router.post(
  "/razor-ot-subscribe",
  protect,
  // owned,
  validate(razPlanValidation.create_subscription),
  plansCtrl.razor_oneTime_sub
);

router.post(
  "/razor-ot-unsubscribe",
  protect,
  // owned,
  validate(razPlanValidation.cancel_v1_subscription),
  plansCtrl.razor_oneTime_cancel
);

router.post(
  "/razor-ot-capture",
  // protect,
  // owned,
  // validate(razPlanValidation.create_subscription),
  plansCtrl.razor_oneTime_capture
);

// - cancel stripe plan
router.patch(
  "/razor-unsubscribe",
  protect,
  // owned,
  validate(razPlanValidation.cancel_subscription),
  plansCtrl.raz_unsubscribe
);

// - update stripe plan
router.patch(
  "/razor-change-subscription",
  protect,
  validate(razPlanValidation.update_subscription),
  plansCtrl.raz_update_subscription
);

// - update stripe plan
router.post(
  "/razor-web-hook",
  // protect,
  // validate(razPlanValidation.update_subscription),
  plansCtrl.raz_sub_hooks
);


module.exports = router;
