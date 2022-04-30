const express = require('express');
const router = express.Router();
const userRoutes = require('./user.route');
const restaurantRoutes = require('./menu.route');
const authRoutes = require('./auth.route');
const serviceRoutes = require('./service.route');
const foodServiceRoutes = require('./food.service.route');
const planRoutes = require('./plans.route');
const couponRoutes = require('./owner.preferences.route');
const reservationRoutes = require('./reservation.route');
const webThemeRoutes = require('./web.theme.route');
const mobThemeRoutes = require('./mobile.theme.route');
const bulkRoutes = require('./bulk.route');
const deliveryRoutes = require('./delivery.route');
const tourRoutes = require('./tour.route')

/** /api/user */
router.use('/user', userRoutes);

/** /api/auth */
router.use('/auth', authRoutes);

/** /api/payment */

/** /api/service */
router.use('/service', serviceRoutes);

/** /api/restaurant */
router.use('/restaurant', restaurantRoutes);

/** /api/coupon */
router.use('/coupon', couponRoutes);

/** /api/coupon */
router.use('/reservation', reservationRoutes);

/** /api/cart */
router.use('/cart', foodServiceRoutes);

/** /api/cart */
router.use('/order', foodServiceRoutes);

/** /api/cart */
router.use('/delivery', deliveryRoutes);

/** /api/plans */
router.use('/stripe', planRoutes);

/** /api/plans */
router.use('/plans', planRoutes);


/** /api/plans */
router.use('/WebTheme', webThemeRoutes);

/** /api/plans */
router.use('/AppTheme', mobThemeRoutes);

/** /api/bulk data */
router.use('/bulk', bulkRoutes);

/** /api/tour data */
router.use('/tour', tourRoutes);

module.exports = router;