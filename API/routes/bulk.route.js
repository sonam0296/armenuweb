const router = require('express').Router();
const bulkCtrl = require('../controller/bulk.controller');
const validate = require('express-validation');
const { authParamsValidation, userParamsValidation } = require('../helpers/joi.validation');
const { protect } = require('../middleware/auth');


router.post('/add-users',
// routprotecter,
// upload.fields([{ name: "item_image" }]),
// validate(Joivalidate),
bulkCtrl.add_users
);

router.post('/add-cities',
// routprotecter,
// upload.fields([{ name: "item_image" }]),
// validate(Joivalidate),
bulkCtrl.add_city
);

router.post('/add-menu-categories',
// routprotecter,
// upload.fields([{ name: "item_image" }]),
// validate(Joivalidate),
bulkCtrl.add_menu_categories
);

router.post('/add-menus',
// routprotecter,
// upload.fields([{ name: "item_image" }]),
// validate(Joivalidate),
bulkCtrl.add_menus
);

router.post('/add-orders',
// routprotecter,
// upload.fields([{ name: "item_image" }]),
// validate(Joivalidate),
bulkCtrl.add_orders
);

module.exports = router;