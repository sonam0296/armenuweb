const router = require('express').Router();
const themeCtrl = require('../controller/web.theme.controller');
const validate = require('express-validation');
const { cartValidation, orderValidation, reviewsValidation } = require('../helpers/joi.validation');
const { protect, owned, authorize } = require('../middleware/auth');

router.get('/masterWebTheme',
// routprotecter,
// upload.fields([{ name: "item_image" }]),
// validate(Joivalidate),
// themeCtrl.get_page_ui
);

router.post('/myWebThemes',
// routprotecter,
// upload.fields([{ name: "item_image" }]),
// validate(Joivalidate),
// themeCtrl.get_page_ui
);


router.post('/getWebTheme',
// routprotecter,
// upload.fields([{ name: "item_image" }]),
// validate(Joivalidate),
themeCtrl.get_page_ui
);

router.post('/addWebPage',
protect,
// upload.fields([{ name: "item_image" }]),
// validate(Joivalidate),
themeCtrl.add_page_ui
);

module.exports = router;