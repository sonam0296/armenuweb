const router = require('express').Router();
const CouponCtrl = require('../controller/owners.preferences');
const validate = require('express-validation');
const { couponValidation } = require('../helpers/joi.validation');
const { protect, owned, authorize } = require('../middleware/auth');

router.post('/get-coupons',
validate(couponValidation.getCoupon),
CouponCtrl.get_coupon
);

router.post('/add-coupons',
protect,owned,
validate(couponValidation.addCoupon),
CouponCtrl.add_coupon
);

router.patch('/update-coupons',
protect,owned,
validate(couponValidation.updateCoupon),
CouponCtrl.update_coupon
);

router.patch('/archive-coupons',
protect,owned,
validate(couponValidation.archiveCoupon),
CouponCtrl.archive_coupon
);


module.exports = router;