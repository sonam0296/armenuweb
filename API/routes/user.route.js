const router = require('express').Router();
const userCtrl = require('../controller/user.controller');
const validate = require('express-validation');
const { userParamsValidation } = require('../helpers/joi.validation');
const { siteValidation } = require('../helpers/joi.validation')
const { protect, authorize, owned, aggregator } = require('../middleware/auth');
const { upload, multerFB_helper } = require('../helpers/fileUpload');

/** GET /api/user/profile - get user profile */
router.get('/profile/:userId', protect, userCtrl.userProfile);

/** GET /api/user/profile - get user profile */
router.post('/registered-mail',
validate(userParamsValidation.isEmailRegistered), userCtrl.isRegisteredMail);

/** PATCH /api/user/update - update user profile */
router.patch('/update', protect,
    upload.fields([{ name: "restaurant_image" }, { name: "profile_image" }, { name: "restaurant_cover_image" }]),
    validate(userParamsValidation.updateUser),
    userCtrl.updateProfile);

/** PATCH /api/user/update_user - update user profile via admin */
router.patch('/update_user', protect,
    authorize,
    validate(userParamsValidation.updateUser_via_admin),
    userCtrl.updateUser);

/** PATCH /api/user/update_user - update user profile via admin */
router.patch('/update_outlet', protect,
    // owned,
    validate(userParamsValidation.updateUser_via_admin),
    userCtrl.updateUser);

router.patch('/update_user_drivers', protect,
    owned,
    validate(userParamsValidation.updateUser_via_admin),
    userCtrl.updateUser);

router.patch('/update_aggregator_drivers', protect,
    aggregator,
    validate(userParamsValidation.updateUser_via_admin),
    userCtrl.updateUser);

    
/** GET /api/user/details - update user details with sort, select, 
 * filter and pagination  */
router.get('/details', protect, userCtrl.userDetails);

// /** DELETE /api/user/:userId - delete user by admin */
router.delete('/:userId', protect, authorize, userCtrl.deleteUser);

// /** PATCH /api/user/:userId - update user by admin */



// ----- stripe on board owner--------

// ---- in use ----
router.get('/stripe/sign-in-user',
    protect,
    owned,
    userCtrl.sign_in_stripe_user);



router.get('/stripe/deauth_acc',
    protect,
    owned,
    userCtrl.deauthorize_stripe_user);


// ------- deprecated apis ---------


router.post('/stripe/create-user',
    // owned,
    userCtrl.create_stripe_user);

router.get('/stripe/onboard-user',
    // owned,
    userCtrl.onboard_stripe_user);

router.post('/stripe/get_Stripe_response',
    // owned,
    userCtrl.get_stripe_response);

router.get('/stripe/get_Oauth_response',
    // owned,
    userCtrl.stripe_OAuth_response);


// -------- favorites -------------

// -dish-
router.get('/get_fav_dish', protect, userCtrl.getFavDish);

router.post('/add_fav_dish', protect,
    validate(userParamsValidation.favDish),
    userCtrl.addFavDish);

router.patch('/site_preference', protect,
    validate(userParamsValidation.site_preferences),
    userCtrl.site_preference);

router.patch('/remove_fav_dish', protect,
    validate(userParamsValidation.favDish),
    userCtrl.removeFavDish);

// -restaurant-
router.get('/get_fav_restaurant', protect, userCtrl.getFavRestaurant);

router.post('/add_fav_restaurant', protect,
    validate(userParamsValidation.favRestaurant),
    userCtrl.addFavRestaurant);

router.patch('/remove_fav_restaurant', protect,
    validate(userParamsValidation.favRestaurant),
    userCtrl.removeFavRestaurant);
// -------- site management -------------

//-siteinfo
router.post('/site_add', protect, authorize,
    validate(siteValidation.siteInfo),
    userCtrl.addSiteInfo)

router.post('/site_info', userCtrl.getsiteInfo)

router.post('/site_info_client', userCtrl.getsiteInfo)

// - site content
router.post('/add-site-content', protect, authorize,
    validate(siteValidation.content),
    userCtrl.add_content)


//-Link
router.post('/add_links', protect, authorize,
    validate(siteValidation.links),
    userCtrl.addLinks)
router.post('/links_info', protect, authorize, userCtrl.getLinks)

router.post('/get_all_links', userCtrl.getAllLinks)

// -------- setting management -------------

router.post('/add_page', protect, authorize, userCtrl.addPage)

router.post('/get_pages', protect, authorize, userCtrl.getAllPages)

// router.post('/get_pages', protect, authorize, userCtrl.getAllPages)

router.post('/get_page_details', protect, authorize,
    userCtrl.getPageDetails)

router.get('/get_client_pages', userCtrl.getAllPages)

router.post('/get_page_client_details',
    userCtrl.getPageDetails)


router.patch('/update_page_details', protect, authorize,
    userCtrl.updatepage)

router.delete('/delete_page/:page_id', protect, authorize,
    userCtrl.deletepage)

// -------- cities -------------
router.post('/add_city', upload.single("city_image"), protect, authorize, userCtrl.addcity)

// router.post('/add_city', protect, authorize, userCtrl.addcity)

router.patch('/edit_city', upload.single("city_image"), protect, authorize, userCtrl.editcity)

router.delete('/del_city/:city_id', protect, authorize, userCtrl.deletecity)

router.post('/get_all_city', protect, authorize, userCtrl.getallcity)

router.post('/getallcity_client', userCtrl.getallcity_client)

router.get('/city_details/:city_id',userCtrl.city_details)


// -------- drivers,restaurants,clients ------------
router.post('/get_drivers', protect, authorize, userCtrl.getdrivers)



router.post('/del_drivers/:driver_id', protect, authorize, userCtrl.deletedrivers)

router.post('/add_drivers', protect, authorize, userCtrl.adddrivers)

router.patch('/update_drivers', protect, authorize,userCtrl.updatedrivers)

router.post('/add_drivers_owner', protect, owned, userCtrl.adddrivers)

router.post('/add_drivers_aggregator', protect, aggregator, userCtrl.adddrivers)

router.patch('/active_deactive', protect, userCtrl.activedeactive)

router.post('/get_clients', protect, authorize, userCtrl.getclients)

router.post('/get_restaurants', protect, authorize, userCtrl.getrestaurantslist)

router.post('/get_outlets', protect, userCtrl.getrestaurantslist)

router.get('/owners_self_delivery', protect, authorize, userCtrl.owner_self_delivery_list)

router.post('/get_restaurants_aggregator', protect, aggregator, userCtrl.getrestaurantslist)

router.post('/get_aggregators', protect, userCtrl.getaggrgatorslist)

router.post('/add_owners', protect, authorize, userCtrl.addowners)

router.post('/add_aggregator', protect, authorize, userCtrl.addAggregator)



//-------- Images uploading ------------


//  ------ upload images through fireBase -------
router.post('/add_images',
    protect,
    authorize,
    upload.fields([{ name: "site_logo" }, { name: "default_image" }, { name: "favicon" }, { name: "search_cover" }, { name: "restaurant_default_image" }, { name: "restaurant_cover_image" }]),
    userCtrl.addimages);


// default_image
router.post('/add_rest_images', protect, owned,
    upload.fields([{ name: "restaurant_image" }, { name: "restaurant_cover_image" }, { name: "default_image" }]),
    userCtrl.add_restaurant_image);

router.post('/add_rest_images_via_admin', protect, authorize, upload.fields([{ name: "restaurant_image" }, { name: "restaurant_cover_image" }, { name: "default_image" }]),
    userCtrl.add_restaurant_image);


router.get('/getallimages/:imageid', protect, authorize, userCtrl.getallimages);

router.get('/get_images', protect, owned, userCtrl.get_restaurant_images);

router.get('/get_rest_images_via_admin/:userid', protect, authorize, userCtrl.get_restaurant_images_admin);



router.post('/profile_image', protect, upload.single("profile_image"), userCtrl.profile_image)


router.get("/country_list",userCtrl.country_list)






module.exports = router;

