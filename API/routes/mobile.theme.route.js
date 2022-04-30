const router = require('express').Router();
const themeCtrl = require('../controller/mobile.theme.controller');
const validate = require('express-validation');
const { cartValidation, orderValidation, reviewsValidation } = require('../helpers/joi.validation');
const { protect, owned, authorize } = require('../middleware/auth');

router.get('/masterMobileTheme',
// routprotecter,
// upload.fields([{ name: "item_image" }]),
// validate(Joivalidate),
// themeCtrl.get_page_ui
);

router.post('/myMobileThemes',
// routprotecter,
// upload.fields([{ name: "item_image" }]),
// validate(Joivalidate),
// themeCtrl.get_page_ui
);


router.post('/getMobileTheme',
// routprotecter,
// upload.fields([{ name: "item_image" }]),
// validate(Joivalidate),
themeCtrl.get_page_ui
);

router.post('/addMobilePage',
protect,
// upload.fields([{ name: "item_image" }]),
// validate(Joivalidate),
themeCtrl.add_page_ui
);

module.exports = router;