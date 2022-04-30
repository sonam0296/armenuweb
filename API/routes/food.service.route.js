const router = require('express').Router();
const foodCtrl = require('../controller/food.service.controller');
const validate = require('express-validation');
const { cartValidation, orderValidation, reviewsValidation } = require('../helpers/joi.validation');
const { protect, owned, authorize, aggregator } = require('../middleware/auth');


/** get cart items*/
router.get('/', protect, foodCtrl.cart_list);

// /** Add and update cart */
router.post('/add_cart', protect,
    validate(cartValidation.addtoCart),
    foodCtrl.addtoCart);



// /** Add to cart */
router.delete('/delete_cart', protect,
    validate(cartValidation.deleteCart),
    foodCtrl.deleteCart);


// =========== order section =========================
/** get my orders*/
router.post('/my_orders', protect,
    validate(orderValidation.myOrders),
    foodCtrl.my_orders);

/** get my orders*/
router.post('/standby_orders', protect,
    validate(orderValidation.standBy_order),
    foodCtrl.standBy_orders);

/** get my orders*/
router.post('/ongoing_order', protect,
    validate(orderValidation.ongoing_orders),
    foodCtrl.ongoing_orders);

/** get owner orders*/
router.post('/owner_orders', protect, owned,
    validate(orderValidation.ownerOrders),
    foodCtrl.my_orders);

/** get owner orders*/
router.post('/aggregator_orders', protect, aggregator,
    validate(orderValidation.aggregatorOrders),
    foodCtrl.my_orders);

/** get owner finance*/
router.post('/owner_finance', protect, owned,
    validate(orderValidation.ownerFinance),
    foodCtrl.owner_finance);

/** get owner orders*/
router.post('/driver_orders', protect,
    validate(orderValidation.driverOrders),
    foodCtrl.my_orders);

/** get owner orders*/
router.get('/owner_dashboard', protect, owned,
    // validate(orderValidation.ownerOrders),
    foodCtrl.owner_dashboard);

/** get aggregator orders*/
router.get('/aggregator_dashboard', protect, aggregator,
    // validate(orderValidation.ownerOrders),
    foodCtrl.aggregator_dashboard);

/** get admin orders*/
router.get('/admin_dashboard', protect, authorize,
    // validate(orderValidation.ownerOrders),
    foodCtrl.admin_dashboard);

/** get admin orders*/
router.post('/admin_orders', protect,
    authorize,
    validate(orderValidation.adminOrders),
    foodCtrl.my_orders);

/** get admin finance*/
router.post('/admin_finance', protect,
    authorize,
    validate(orderValidation.adminFinance),
    foodCtrl.admin_finance);

/** get owner live orders*/
router.get('/owner_live_orders', protect, owned,
    foodCtrl.owner_live_orders);

/** get owner live orders*/
router.get('/client_live_orders', protect,
    foodCtrl.client_live_orders);

/** get aggregator live orders*/
router.get('/aggregator_live_orders', protect, aggregator,
    foodCtrl.aggregator_live_orders);

/** get live orders for admin*/
router.get('/admin_live_orders', protect,
    authorize,
    foodCtrl.admin_live_orders);

/** get my orders*/
router.post('/order_details', protect,
    validate(orderValidation.orderDetails),
    foodCtrl.order_details);

// /** place order */
router.post('/cash_place_order', protect,
    validate(orderValidation.placeOrder),
    foodCtrl.cash_placeOrder);

// /** place order */
router.post('/raz_place_order', protect,
    validate(orderValidation.placeOrder),
    foodCtrl.raz_placeOrder);

// /** place order */
router.post('/stripe_place_order', protect,
    validate(orderValidation.placeOrder),
    foodCtrl.stripe_placeOrder);

// ----------- payment gateway ---------------

// --------razor pay -------------

// /** capture payment razorpay */
router.post('/raz_transfer',
    // validate(orderValidation.placeOrder),
    foodCtrl.razor_capture_transfers);

// /** capture payment razorpay */
router.post('/raz_payment',
    // validate(orderValidation.placeOrder),
    foodCtrl.razor_capture_payment);


// --------Stripe payment webhook-------------

router.post('/stripe_payment',
    // validate(orderValidation.placeOrder),
    foodCtrl.stripe_capture_payment);




// /** update order */
router.post('/update_order', protect,
    validate(orderValidation.updateOrder),
    foodCtrl.updateOrder);

// /** cancel order */
router.post('/cancel_order', protect,
    validate(orderValidation.cancelOrder),
    foodCtrl.cancelOrder);

// /** delivery request to aggregator's drivers */
router.post('/delivery-request', protect,
    validate(orderValidation.delivery_request),
    foodCtrl.delivery_request);

// /** refund stripe order */
router.post('/stripe_refund_order', protect,
    validate(orderValidation.cancelOrder),
    foodCtrl.stripe_refund_order);

// /** refund razorPay order */
router.post('/razorPay_refund_order', protect,
    validate(orderValidation.cancelOrder),
    foodCtrl.razorpay_refund_order);

// /** orders review */   

router.post('/add-update-review', protect, validate(reviewsValidation.order_rating), foodCtrl.addreviews);

router.post('/get_review', foodCtrl.get_restaurant_reviews);

router.post('/get_reviews_admin', protect,
    authorize, foodCtrl.get_all_reviews_admin);

router.post('/del_review/:review_id', protect,
    authorize, foodCtrl.deletereviews);

router.get('/get_drivers_owners', protect, foodCtrl.get_assoc_drivers)

router.post('/get_drivers_aggregator', protect, foodCtrl.get_assoc_drivers)

router.delete('/del_drivers_owner/:driver_id', protect, owned, foodCtrl.delete_drivers)

router.delete('/del_drivers_aggregator/:driver_id', protect, aggregator, foodCtrl.delete_drivers)

router.delete('/del_drivers_admin/:driver_id', protect, authorize, foodCtrl.delete_drivers)


module.exports = router;