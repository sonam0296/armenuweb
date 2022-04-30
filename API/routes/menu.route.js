const router = require('express').Router();
const menuCtrl = require('../controller/menu.controller');
const validate = require('express-validation');
const { menuValidation } = require('../helpers/joi.validation');
const { protect, owned } = require('../middleware/auth');
const { upload } = require('../helpers/fileUpload');

/** GET /api/restaurant/profile - get restaurant profile */
router.post('/menu', protect, owned, menuCtrl.menu_list);

/** Post /api/restaurant/add_menu - update restaurant profile */
router.post('/add_menu', protect, owned,
    upload.fields([{ name: "category_image" }]),
    validate(menuValidation.addMenu),
    menuCtrl.addMenu);

/** PATCH /api/restaurant/update_menu - update restaurant profile */
router.patch('/update_menu', protect, owned,
    upload.fields([{ name: "category_image" }]),
    validate(menuValidation.updateMenu),
    menuCtrl.updateMenu);


/** GET /api/restaurant/menu - get restaurant profile */
router.delete('/delete_menu', protect, owned,
    validate(menuValidation.deleteMenu),
    menuCtrl.deleteMenu);

/** GET /api/restaurant/menu - get restaurant profile */
router.delete('/delete_menu_category/:category_id', protect, owned,
    validate(menuValidation.deleteMenuCategory),
    menuCtrl.deleteMenuCategory);


/** GET /api/restaurant/dish_details - update restaurant details with sort, select,   */
router.post('/menu/dish_details', protect, owned,
    validate(menuValidation.getDish),
    menuCtrl.dishDetails);



router.post('/menu/add_dish', protect, owned,
    upload.fields([{ name: "item_image" }]),
    validate(menuValidation.addDish),
    menuCtrl.addDish);

/** PATCH /api/restaurant/update_menu - update restaurant profile */
router.patch('/menu/update_dish', protect, owned,
    upload.fields([{ name: "item_image" }]),
    validate(menuValidation.updateDish),
    menuCtrl.updateDish);


/** GET /api/restaurant/menu/dish - get restaurant profile */
router.delete('/menu/dish/:dish_id', protect, owned,
    validate(menuValidation.deleteDish),
    menuCtrl.deleteDish);

// ------- Variant options management---------------
router.post('/menu/add_variant_op', protect, owned,
    validate(menuValidation.addVariantOp),
    menuCtrl.addVariantOP);

router.patch('/menu/update_variant_op', protect, owned,
    validate(menuValidation.updateVariantOp),
    menuCtrl.updateVariantOP);

router.delete('/menu/delete_variant_op/:variant_op_id', protect, owned,
    validate(menuValidation.deleteVariantOp),
    menuCtrl.deleteVariantOP);

router.post('/menu/get_variant_op', protect, owned,
    validate(menuValidation.getVariantOp),
    menuCtrl.getVariantOP_req);

// ------- Variants management---------------
router.post('/menu/add_variant', protect, owned,
    validate(menuValidation.addVariant),
    menuCtrl.addVariant);

router.patch('/menu/update_variant', protect, owned,
    validate(menuValidation.updateVariant),
    menuCtrl.updateVariant);

router.delete('/menu/delete_variant/:variant_id', protect, owned,
    validate(menuValidation.deleteVariant),
    menuCtrl.deleteVariant);

router.post('/menu/get_variant', protect, owned,
    validate(menuValidation.getVariant),
    menuCtrl.getVariant_req);

// ------- Extras management---------------
router.post('/menu/add_extras', protect, owned,
    validate(menuValidation.addExtras),
    menuCtrl.addExtras);

router.patch('/menu/update_extras', protect, owned,
    validate(menuValidation.updateExtras),
    menuCtrl.updateExtras);

router.delete('/menu/delete_extras/:extras_id', protect, owned,
    validate(menuValidation.deleteExtras),
    menuCtrl.deleteExtras);

router.post('/menu/get_extras', protect, owned,
    validate(menuValidation.getExtras),
    menuCtrl.getExtras_req);


// --- outlet management ---- 
router.post('/menu-items-cloning',
// validate(Joivalidate),
menuCtrl.clone_menuItems
);

router.post('/menu-category-cloning',
// validate(Joivalidate),
menuCtrl.clone_menuCategory
);

router.post('/menu-availability',
// validate(Joivalidate),
menuCtrl.menuItems_availability
);

router.post('/list-outlet-menu-availability',
// validate(Joivalidate),
menuCtrl.menu_outlet_list
);


module.exports = router;