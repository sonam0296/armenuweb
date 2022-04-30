const router = require('express').Router();
const serviceCtrl = require('../controller/service.controller');
const { upload } = require('../helpers/fileUpload');
const validate = require('express-validation');
const { protect, owned } = require('../middleware/auth');

const { serviceValidation, menuValidation } = require('../helpers/joi.validation');
const menuCtrl = require('../controller/menu.controller');


/** POST get unique city names with registered restaurant */
router.get('/', serviceCtrl.cities);

/** POST get unique city names with registered restaurant */
router.post('/city',
    validate(serviceValidation.inCity),
    serviceCtrl.incity);

/** Get  All city */
router.get('/get_cities', serviceCtrl.getAllcity);
//protect, owned


/** POST /api/service/restaurants_near_by - Search near by restaurants */
router.post('/restaurants_near_by',
    validate(serviceValidation.nearbyRestaurants),
    serviceCtrl.nearByRestaurants);

/** POST /api/service/restaurants_near_by - Search near by restaurants */
router.post('/look-up-dishes',
    validate(serviceValidation.lookup_dish),
    serviceCtrl.dish_hunt);

/** POST /api/service/restaurants_near_by - Search near by restaurants */
router.post('/restaurant',
    validate(serviceValidation.restaurantDetails),
    serviceCtrl.restaurantDetails);

/** POST /api/service/restaurants_near_by - Search near by restaurants */
router.post('/restaurantV2',
    validate(serviceValidation.restaurantDetails),
    serviceCtrl.restaurantDetails_v2);

/** POST /api/service/restaurants_near_by - Search near by restaurants */
router.post('/restaurant_briefing',
    validate(serviceValidation.restaurantDetails),
    serviceCtrl.restaurantBriefing);

/** POST /api/service/restaurants_near_by - Search near by restaurants */
router.post('/restaurant/dish_details',
    validate(serviceValidation.getDish),
    menuCtrl.dishDetails);


// --------- get variant options -------------


router.post('/menu/get_variant_op',
    validate(menuValidation.getVariantOp),
    menuCtrl.getVariantOP);

// --------- Address Management -------------
router.post('/add_address', protect, serviceCtrl.add_address)

router.get('/get_address', protect, serviceCtrl.getaddress)

router.delete('/delete_address/:addressid', protect, serviceCtrl.deleteaddress)


// ------ image upload route for manually uploading images from BE ---------
router.post('/upload-image',
    upload.fields([{ name: "item_image" }]),
    serviceCtrl.image_upload
);

module.exports = router;