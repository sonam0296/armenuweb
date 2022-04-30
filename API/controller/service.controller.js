const httpStatus = require('http-status');
const APIError = require('../helpers/APIError');
const resPattern = require('../helpers/resPattern');
const User = require('../model/user.model');
const Dish = require('../model/menu_items.model');
const mongoose = require('mongoose');
const City = require('../model/cities.model');
const { fetch_orders } = require('./food.service.controller');

// get menu profiles. back up

//   -------- snippets ----------

// ------- hide unnecessary data -------
const hide_project = {
    $project: {
        "_id": 0,
        "name": 0,
        "email": 0,
        "password": 0,
        "phone": 0,
        "address": 0,
        "isActive": 0,
        "location": 0,
        "delivery_area": 0,
        "userType": 0,
        "socialCredentials": 0,
        "createdAt": 0,
        "updatedAt": 0,
        "restaurant_Description": 0,
        "restaurant_Minimum_order": 0,
        "restaurant_Name": 0,
        "restaurant_city": 0,
        "Working_hours": 0,
        "Mobile_user": 0,
        "favorite_dish": 0,
        "favorite_restaurant": 0,
        "IsFeatured": 0,
        "qrcode": 0,
        "delivery_charge": 0,
        "restaurant_cover_image": 0,
        "restaurant_image": 0,
        "raz_account_id": 0,
        "profile_image": 0,
        "currencies": 0,
        "user_languages": 0,
        "is_stripe_connected": 0,
        "fcm_registration_token": 0,
        "language_preference": 0,
        "country_code": 0,
        "country_name": 0,
        "stripe_account": 0,
        "restaurant_ratings": 0,
        "total_reviews": 0,
        "stripe_customer": 0,
        "subscription_status": 0,
        "static_fee": 0,
        "fee_percent": 0,
        "isRestaurantDrivers": 0,
        "isVerified": 0,
        "resetOTP": 0,
        "resetPasswordExpire": 0,
        "dial_code": 0,
        "hosting_Address": 0,
        "use_driver_aggregator": 0,
        "is_outlet": 0,
        "master_brand": 0,
        "aggregator_id": 0,
        "self_service": 0,
        "__v": 0,
    }
}

//  ------ show only relevant data ------
const project = {
    $project: {
        address: 1,
        country_code: 1,
        country_name: 1,
        currencies: 1,
        delivery_area: 1,
        delivery_charge: 1,
        email: 1,
        isActive: 1,
        IsFeatured: 1,
        name: 1,
        phone: 1,
        profile_image: 1,
        restaurant_city: 1,
        restaurant_cover_image: 1,
        restaurant_Description: 1,
        restaurant_image: 1,
        restaurant_Minimum_order: 1,
        restaurant_Name: 1,
        restaurant_ratings: 1,
        total_reviews: 1,
        userType: 1,
        user_languages: 1,
        Working_hours: 1,
        location: 1,
        hosting_Address: 1,
        master_brand: 1,
        is_outlet: 1,
        dist: 1
    }
}


// Find restaurants near by
const nearByRestaurants = async (req, res, next) => {
    try {

        let reqData = req.body;
        let result = undefined;
        // let restaurant_Name = {};
        if (reqData.queryString) {
            restaurant_Name = {
                "restaurant_Name": { $regex: reqData.queryString ? reqData.queryString : '', $options: 'i' }
            }
        }

        let query = [
            {
                $match: {
                    $and:
                        [
                            {
                                isActive: true
                            }
                        ]
                }
            },
            project,
            {
                $lookup:
                {
                    from: 'menucategories',
                    let: { owner_id: '$_id' },
                    pipeline: [{
                        "$match": {
                            $and: [{ "$expr": { "$eq": ["$owner_id", "$$owner_id"] } },
                            { 'category': { $regex: reqData.queryString, $options: 'ix' } }
                            ]
                        }
                    }],
                    as: 'Menu_List'
                }
            },
            {
                $lookup:
                {
                    from: 'menus',
                    let: { owner_id: '$_id' },
                    pipeline: [{
                        "$match": {
                            $and: [{ "$expr": { "$eq": ["$owner_id", "$$owner_id"] } },
                            { 'item_name': { $regex: reqData.queryString, $options: 'ix' } }
                            ]
                        }
                    }],
                    as: 'Dishes'
                }
            },
            {
                $facet: {
                    docs: [
                        // { $sort: sort },
                        { $skip: reqData.items_in_page * (reqData.page_number - 1) },
                        { $limit: reqData.items_in_page },
                    ],
                    pageInfo: [
                        { $addFields: { page_number: reqData.page_number } },
                        { $group: { _id: null, count: { $sum: 1 }, page_number: { $first: '$page_number' } } },
                        { $project: { _id: 0, count: 1, page_number: 1 } }
                    ],
                },
            },
            { $unwind: '$pageInfo' }
        ];
        // --------if location track is allowed  ------------
        if (reqData.longitude && reqData.latitude) {

            geoQuery = {
                $geoNear: {
                    near: { type: "Point", coordinates: [reqData.longitude, reqData.latitude] },
                    key: "delivery_area",
                    distanceField: "dist.calculated",
                    query: { userType: "owner" },
                    maxDistance: 0.3048,
                    includeLocs: "dist.location",
                    spherical: true
                }
            };
            query.unshift(geoQuery)
        }
        // ------ if location track is not available (country name is optional----
        if (reqData.country_name) {
            geoQuery = { "country_name": { $regex: reqData.country_name ? reqData.country_name : '', $options: 'i' } }
            query[0]['$match']['$and'].unshift(geoQuery)
        }
        result = await User.aggregate(
            query
        )
        if (result.length > 0) {
            let obj = resPattern.successPattern(httpStatus.OK, result, 'success');
            return res.status(obj.code).json(obj);
        }
        // ------------- no data found ---------------
        else {
            let e = { message: "Sorry no registered restaurants near your area for this moment" }
            throw e
        }
    } catch (e) {
        return next(new APIError(e.message, httpStatus.BAD_REQUEST, true));
    }
}

const dish_hunt = async (req, res, next) => {
    try {
        const reqData = req.body;
        // const owner_filter = reqData.is_outlet ? { master_brand: mongoose.Types.ObjectId(reqData.owner_id) } : { _id: mongoose.Types.ObjectId(reqData.owner_id) };
        const owner_hunt = await User.findById(reqData.owner_id);
        const owner_filter = owner_hunt.is_outlet ? { _id: owner_hunt.master_brand } : { _id: owner_hunt._id }
        if (typeof (req.body.veg) === "boolean") {
            veg = { "$expr": { "$eq": ["$veg", req.body.veg] } }
        }
        if (req.body.veg === null) {
            veg = {}
        }
        let outlet_id_filter = {};
        let outlet_avl_filter = {};
        let group_menus = {
            $group: {
                _id: '$_id',
                item_name: {
                    $first: '$item_name',
                },
                item_description: {
                    $first: '$item_description',
                },
                menu_category_id: {
                    $first: '$menu_category_id',
                },
                item_image: {
                    $first: '$item_image',
                },
                veg: {
                    $first: '$veg',
                },
                item_available: {
                    $first: '$item_available',
                },
                enable_variants: {
                    $first: '$enable_variants',
                },
                order_count: {
                    $first: '$order_count',
                },
                recommend: {
                    $first: '$recommend',
                },
                dish_rating: {
                    $first: '$dish_rating',
                },
                total_reviews: {
                    $first: '$total_reviews',
                },
                item_price: {
                    $first: '$item_price',
                },
                vat_percentage: {
                    $first: '$vat_percentage',
                },
                owner_id: {
                    $first: '$owner_id',
                },
                createdAt: {
                    $first: '$createdAt',
                },
                // outlets: {
                //     $first: '$outlets',
                // },
            },
        };
        let query = [];
        if (owner_hunt.is_outlet) {
            query.push({
                $unwind: '$outlets',
            });
            outlet_id_filter = { "$expr": { "$eq": ["$outlets.outlet_id", "$$outlet_id"] } }
            outlet_avl_filter = { "$expr": { "$eq": ["$outlets.item_available", "$$item_available"] } }
        }
        query = [...query,
        {
            "$match": {
                $and: [
                    { "$expr": { "$eq": ["$owner_id", "$$owner_id"] } },
                    { 'item_name': { $regex: reqData.queryString, $options: 'ix' } },
                    outlet_id_filter,
                    outlet_avl_filter,
                    veg,
                ]
            }
        },
            group_menus
        ]
        const result = await User.aggregate([
            { $match: owner_filter },
            {
                $lookup:
                {
                    from: 'menus',
                    let: { owner_id: '$_id', "item_available": true, "outlet_id": owner_hunt._id },
                    pipeline: query,
                    as: 'Dishes'
                }
            },
            hide_project
        ])
        let obj = resPattern.successPattern(httpStatus.OK, result, 'success');
        return res.status(obj.code).json(obj);
    } catch (e) {
        return next(new APIError(e.message, httpStatus.BAD_REQUEST, true));
    }
}
// --- an assist function to get the restaurant based on the request from restaurantDetails controller function --- 
const restaurant_hunt = async (req, res, next) => {
    try {
        const reqData = req.body;
        const userType = { userType: "owner" };
        const hosting_Address = { hosting_Address: reqData.hosting_Address };
        const isActive = { isActive: true }
        let owner = [userType, hosting_Address, isActive, { is_outlet: false }];
        let geoQuery = {};
        let query = []
        if (reqData.owner_id) {
            owner.pop()
            owner = [...owner, { _id: mongoose.Types.ObjectId(reqData.owner_id) }
            ]
        }
        query = [{ $match: { $and: owner } }];
        if (reqData.longitude && reqData.latitude && !reqData.owner_id) {
            owner.pop()
            const subQuery = { ...userType, ...hosting_Address, ...isActive }
            geoQuery = {
                $geoNear: {
                    near: { type: "Point", coordinates: [reqData.longitude, reqData.latitude] },
                    // key: "delivery_area",
                    key: "location",
                    distanceField: "dist.calculated",
                    includeLocs: "dist.location",
                    query: subQuery,
                    spherical: true
                },
            };
            query = [geoQuery, { $limit: 1 }]
        }

        // --- fetch only necessary data through projection object ---
        query.push(project)
        const restaurant = await User.aggregate(query);
        // let obj = resPattern.successPattern(httpStatus.OK, { restaurant, query }, 'success');
        // return res.status(obj.code).json(obj);
        return restaurant[0];
    } catch (error) {
        return next(new APIError(error.message, httpStatus.BAD_REQUEST, true));
    }
}

// --- after outlets ---
const restaurantDetails_v2 = async (req, res, next) => {
    try {
        let menu_category_id = {}
        let order_history = undefined;
        let menus = [];
        let active = await restaurant_hunt(req, res, next);

        // --- verify the restaurant availability before processing the query ---

        if (!active || active.isActive == false) {
            let obj = resPattern.errorPattern(httpStatus.BAD_REQUEST, 'Service of this restaurant is temporarily suspended, please contact the site owner', 'failure');
            return res.status(obj.code).json(obj);
        }
        // --- query building ---
        let userType = { userType: active.userType }
        let hosting_Address = { hosting_Address: active.hosting_Address }
        let isActive = { isActive: active.isActive }
        let restaurant_city = active.is_outlet ? { restaurant_city: active.restaurant_city } : {}
        let owner_filter = {}
        let veg = {}
        let outlet_id_filter = {}
        let outlet_avl_filter = {}
        let category_pipeline = []
        let menu_pipeline = []
        let preference_pipeline = []
        let recommended_pipeline = []
        let group_category = {
            $group: {
                _id: '$_id',
                category_image: {
                    $first: '$category_image',
                },
                owner_id: {
                    $first: '$owner_id',
                },
                category: {
                    $first: '$category',
                },
                createdAt: {
                    $first: '$createdAt',
                },
                // outlets: {
                //     $first: '$outlets',
                // },
            },
        }
        let group_menus = {
            $group: {
                _id: '$_id',
                item_name: {
                    $first: '$item_name',
                },
                item_description: {
                    $first: '$item_description',
                },
                menu_category_id: {
                    $first: '$menu_category_id',
                },
                item_image: {
                    $first: '$item_image',
                },
                veg: {
                    $first: '$veg',
                },
                item_available: {
                    $first: '$item_available',
                },
                enable_variants: {
                    $first: '$enable_variants',
                },
                order_count: {
                    $first: '$order_count',
                },
                recommend: {
                    $first: '$recommend',
                },
                dish_rating: {
                    $first: '$dish_rating',
                },
                total_reviews: {
                    $first: '$total_reviews',
                },
                item_price: {
                    $first: '$item_price',
                },
                vat_percentage: {
                    $first: '$vat_percentage',
                },
                owner_id: {
                    $first: '$owner_id',
                },
                createdAt: {
                    $first: '$createdAt',
                },
                // outlets: {
                //     $first: '$outlets',
                // },
            },
        }
        let dish_project = {
            $project: {
                item_id: "$Menu_List._id",
                menu_category_id: "$Menu_List.menu_category_id",
                item_available: "$Menu_List.item_available",
                item_description: "$Menu_List.item_description",
                item_name: "$Menu_List.item_name",
                veg: "$Menu_List.veg",
                dish_rating: "$Menu_List.dish_rating",
                total_reviews: "$Menu_List.total_reviews",
                item_price: "$Menu_List.item_price",
                item_image: "$Menu_List.item_image",
                order_count: "$Menu_List.order_count",
                recommend: "$Menu_List.recommend",
                createdAt: "$Menu_List.createdAt",
            }
        }
        let outlets = {
            $project: {
                address: 1,
                restaurant_city: 1,
                restaurant_cover_image: 1,
                restaurant_Description: 1,
                restaurant_image: 1,
                restaurant_Minimum_order: 1,
                restaurant_Name: 1,
                restaurant_ratings: 1,
                total_reviews: 1,
                is_outlet: 1,
                location: 1,
                dist: 1
            }
        }
        // ---- preferences based query building ----
        if (req.body.menu_category_id) {
            menu_category_id = { "$expr": { "$eq": ["$_id", mongoose.Types.ObjectId(req.body.menu_category_id)] } }
        }
        if (typeof (req.body.veg) === "boolean") {
            veg = { "$expr": { "$eq": ["$veg", req.body.veg] } }
        }
        if (req.body.veg === null) {
            veg = {}
        }
        if (active) {
            owner_filter = active._id
        }
        if (active && active.is_outlet) {
            owner_filter = active.master_brand

            outlet_id_filter = { "$expr": { "$eq": ["$outlets.outlet_id", "$$outlet_id"] } }
            outlet_avl_filter = { "$expr": { "$eq": ["$outlets.item_available", "$$item_available"] } }
            category_pipeline.push({
                $unwind: '$outlets',
            })
            menu_pipeline.push({
                $unwind: '$outlets',
            })
            preference_pipeline.push({
                $unwind: '$outlets',
            })
        }

        category_pipeline = [...category_pipeline,
        {
            "$match": {
                "$and": [{ "$expr": { "$eq": ["$owner_id", "$$owner_id"] } },
                    menu_category_id,
                    outlet_id_filter,
                    outlet_avl_filter
                ]
            }
        },
            group_category
        ]
        menu_pipeline = [...menu_pipeline,
        {
            "$match": {
                "$and":
                    [
                        { "$expr": { "$eq": ["$owner_id", "$$owner_id"] } },
                        { "$expr": { "$eq": ["$item_available", true] } },
                        { "$expr": { "$eq": ["$menu_category_id", "$$menu_category_id"] } },
                        veg,
                        outlet_id_filter,
                        outlet_avl_filter
                    ]
            }
        },
            group_menus
        ]
        recommended_pipeline = [...preference_pipeline,
        {
            "$match": {
                "$and":
                    [
                        { "$expr": { "$eq": ["$owner_id", "$$owner_id"] } },
                        { "$expr": { "$eq": ["$item_available", true] } },
                        { "$expr": { "$eq": ["$recommend", true] } },
                        veg,
                        outlet_id_filter,
                        outlet_avl_filter
                    ]
            }
        },
            group_menus
        ]
        preference_pipeline = [...preference_pipeline,
        {
            "$match": {
                "$and":
                    [
                        { "$expr": { "$eq": ["$owner_id", "$$owner_id"] } },
                        { "$expr": { "$eq": ["$item_available", true] } },
                        veg,
                        outlet_id_filter,
                        outlet_avl_filter
                    ]
            }
        },
            group_menus
        ]

        // --- if user is logged in  this block fetches the order history ---
        if (req.body.loggedInUser) {
            req.user = req.body.loggedInUser;
            order_history = await fetch_orders(req);
            if (order_history['result'].length > 0) {
                order_history = order_history['result'][0]['docs'];
            } else {
                order_history = ['No order history found.'];
            }
        }
        menus = await User.aggregate().facet({
            outlets: [
                { $match: { $and: [userType, hosting_Address, isActive, restaurant_city] } },
                outlets
            ],
            MenuCategories: [{ $match: { _id: active._id } },
            {
                $lookup: {
                    from: 'menucategories',
                    let: { "owner_id": owner_filter, "item_available": true, "outlet_id": active._id },
                    pipeline: category_pipeline,
                    as: 'Menu_category'
                }
            },
                hide_project
            ],
            Menu_items: [{ $match: { _id: active._id } },
            {
                $lookup: {
                    from: 'menucategories',
                    let: { "owner_id": owner_filter, "item_available": true, "outlet_id": active._id },
                    pipeline: category_pipeline,
                    as: 'Menu_category'
                }
            },
            { $unwind: { path: "$Menu_category", preserveNullAndEmptyArrays: true } },

            {
                $lookup: {
                    from: 'menus',
                    let: { "menu_category_id": "$Menu_category._id", "owner_id": owner_filter, "item_available": true, "outlet_id": active._id },
                    pipeline: menu_pipeline,
                    as: 'Menu_List'
                }
            },
                hide_project
            ],
            Coupon_codes: [{ $match: { _id: active._id } },
            // { $match: { owner_id: owner_id } },
            {
                $lookup: {
                    from: 'coupons',
                    let: { "owner_id": owner_filter },
                    pipeline: [{
                        "$match": {
                            "$and": [
                                { "$expr": { "$eq": ["$owner_id", "$$owner_id"] } },
                                { "$expr": { "$eq": ["$coupon_archive", false] } }
                            ]
                        }
                    }],
                    as: 'Coupons'
                }
            },
                hide_project
            ],
            Best_seller: [{ $match: { _id: active._id } },
            // { $match: { owner_id: owner_id } },
            {
                $lookup: {
                    from: 'menus',
                    let: { "owner_id": owner_filter, "item_available": true, "outlet_id": active._id },
                    pipeline: preference_pipeline,
                    as: 'Menu_List'
                }
            },
            { $unwind: { path: "$Menu_List", preserveNullAndEmptyArrays: true } },
            {
                $sort: {
                    "Menu_List.order_count": -1
                }
            },
            {
                $limit: 5
            },
                dish_project
            ],
            Reviews: [
                { $match: { _id: active._id } },
                // { $match: { owner_id: owner_id } },

                {
                    $lookup: {
                        from: 'menus',
                        let: { "owner_id": owner_filter, "item_available": true, "outlet_id": active._id },
                        pipeline: preference_pipeline,
                        as: 'Menu_List'
                    }
                },
                { $unwind: { path: "$Menu_List", preserveNullAndEmptyArrays: true } },
                {
                    $sort: {
                        "Menu_List.dish_rating": -1,
                        "Menu_List.total_reviews": -1,
                    }
                },
                {
                    $limit: 5
                },
                dish_project
            ],
            Recommended: [{ $match: { _id: active._id } },

            {
                $lookup: {
                    from: 'menus',
                    let: { "owner_id": owner_filter, "item_available": true, "outlet_id": active._id },
                    pipeline: recommended_pipeline,
                    as: 'Menu_List'
                }
            },
            { $unwind: { path: "$Menu_List", preserveNullAndEmptyArrays: true } },
                dish_project
            ]
        }).exec()

        menus[0].order_history = order_history;
        menus[0].restaurant = [active];
        let obj = resPattern.successPattern(httpStatus.OK, menus, 'success');
        return res.status(obj.code).json(obj);


    } catch (e) {
        return next(new APIError(e.message, httpStatus.BAD_REQUEST, true));
    }
}

// --- before outlets ---
const restaurantDetails = async (req, res, next) => {
    try {
        // const loggedUser = req.user;
        let menu_category_id = {}
        let hosting_Address = {};
        let owner_id = {};
        let menus = [];
        let order_history = undefined;
        let active = undefined;
        if (req.body.hosting_Address) {
            hosting_Address = { hosting_Address: req.body.hosting_Address };
            active = await User.findOne({ hosting_Address: req.body.hosting_Address, isActive: true, is_outlet: false });
        }
        if (req.body.owner_id) {
            owner_id = { _id: mongoose.Types.ObjectId(req.body.owner_id) }
            active = await User.findOne(mongoose.Types.ObjectId(req.body.owner_id), { isActive: 1 });
        }
        if (req.body.menu_category_id) {
            menu_category_id = { "$expr": { "$eq": ["$_id", mongoose.Types.ObjectId(req.body.menu_category_id)] } }
        }

        if (!active || active.isActive == false) {
            let obj = resPattern.errorPattern(httpStatus.BAD_REQUEST, 'Service of this restaurant is temporarily suspended, please contact the site owner', 'failure');
            return res.status(obj.code).json(obj);
        }

        // --- if user is logged in  this block fetches the order history ---
        if (req.body.loggedInUser) {
            req.user = req.body.loggedInUser;
            order_history = await fetch_orders(req);
            if (order_history['result'].length > 0) {
                order_history = order_history['result'][0]['docs'];
            } else {
                order_history = ['No order history found.'];
            }
        }
        menus = await User.aggregate().facet({
            restaurant: [
                { $match: { $and: [owner_id, hosting_Address] } },
                project
            ],
            MenuCategories: [{ $match: { _id: active._id } },
            // { $match: { owner_id: owner_id } },
            {
                $lookup: {
                    from: 'menucategories',
                    let: { "owner_id": active._id },
                    pipeline: [{ "$match": { "$and": [{ "$expr": { "$eq": ["$owner_id", "$$owner_id"] } }, menu_category_id] } }],
                    as: 'Menu_category'
                }
            },
                hide_project
            ],
            Coupon_codes: [{ $match: { _id: active._id } },
            // { $match: { owner_id: owner_id } },
            {
                $lookup: {
                    from: 'coupons',
                    let: { "owner_id": active._id },
                    pipeline: [{
                        "$match": {
                            "$and": [
                                { "$expr": { "$eq": ["$owner_id", "$$owner_id"] } },
                                { "$expr": { "$eq": ["$coupon_archive", false] } }
                            ]
                        }
                    }],
                    as: 'Coupons'
                }
            },
                hide_project
            ],
            Menu_items: [
                { $match: { _id: active._id } },
                // { $match: { owner_id: owner_id } },
                {
                    $lookup: {
                        from: 'menucategories',
                        let: { "owner_id": active._id },
                        pipeline: [{
                            "$match": {
                                "$and": [{ "$expr": { "$eq": ["$owner_id", "$$owner_id"] } },
                                    menu_category_id]
                            }
                        }],
                        as: 'Menu_category'
                    }
                },
                { $unwind: { path: "$Menu_category", preserveNullAndEmptyArrays: true } },

                {
                    $lookup: {
                        from: 'menus',
                        let: { "menu_category_id": "$Menu_category._id", "owner_id": "$_id" },
                        pipeline: [
                            {
                                "$match": {
                                    "$expr": {
                                        $and:
                                            [
                                                { "$eq": ["$owner_id", "$$owner_id"] },
                                                { "$eq": ["$item_available", true] },
                                                { "$eq": ["$menu_category_id", "$$menu_category_id"] },
                                            ]
                                    }
                                }
                            },

                        ],
                        as: 'Menu_List'
                    }
                },
                hide_project
            ],
            Best_seller: [
                { $match: { _id: active._id } },
                // { $match: { owner_id: owner_id } },

                {
                    $lookup: {
                        from: 'menus',
                        let: { "owner_id": "$_id" },
                        pipeline: [
                            {
                                "$match": {
                                    "$expr": {
                                        "$and":
                                            [
                                                { "$eq": ["$owner_id", "$$owner_id"] },
                                                { "$eq": ["$item_available", true] },
                                            ]
                                    }
                                }
                            }
                        ],
                        as: 'Menu_List'
                    }
                },
                { $unwind: { path: "$Menu_List", preserveNullAndEmptyArrays: true } },
                {
                    $sort: {
                        "Menu_List.order_count": -1
                    }
                },
                {
                    $limit: 5
                },
                // hide_project
                {
                    $project: {
                        item_id: "$Menu_List._id",
                        menu_category_id: "$Menu_List.menu_category_id",
                        item_available: "$Menu_List.item_available",
                        item_description: "$Menu_List.item_description",
                        item_name: "$Menu_List.item_name",
                        dish_rating: "$Menu_List.dish_rating",
                        total_reviews: "$Menu_List.total_reviews",
                        item_price: "$Menu_List.item_price",
                        item_image: "$Menu_List.item_image",
                        order_count: "$Menu_List.order_count",
                        createdAt: "$Menu_List.createdAt",
                    }
                }
            ],
            Reviews: [
                { $match: { _id: active._id } },
                // { $match: { owner_id: owner_id } },

                {
                    $lookup: {
                        from: 'menus',
                        let: { "owner_id": "$_id" },
                        pipeline: [
                            {
                                "$match": {
                                    "$expr": {
                                        "$and":
                                            [
                                                { "$eq": ["$owner_id", "$$owner_id"] },
                                                { "$eq": ["$item_available", true] },
                                            ]
                                    }
                                }
                            }
                        ],
                        as: 'Menu_List'
                    }
                },
                { $unwind: { path: "$Menu_List", preserveNullAndEmptyArrays: true } },
                {
                    $sort: {
                        "Menu_List.dish_rating": -1,
                        "Menu_List.total_reviews": -1,
                    }
                },
                {
                    $limit: 5
                },
                // hide_project
                {
                    $project: {
                        item_id: "$Menu_List._id",
                        menu_category_id: "$Menu_List.menu_category_id",
                        item_available: "$Menu_List.item_available",
                        item_description: "$Menu_List.item_description",
                        item_name: "$Menu_List.item_name",
                        dish_rating: "$Menu_List.dish_rating",
                        total_reviews: "$Menu_List.total_reviews",
                        item_price: "$Menu_List.item_price",
                        item_image: "$Menu_List.item_image",
                        order_count: "$Menu_List.order_count",
                        createdAt: "$Menu_List.createdAt",
                    }
                }
            ],
            Recommended: [
                { $match: { _id: active._id } },

                {
                    $lookup: {
                        from: 'menus',
                        let: { "owner_id": "$_id" },
                        pipeline: [
                            {
                                "$match": {
                                    "$expr": {
                                        "$and":
                                            [
                                                { "$eq": ["$owner_id", "$$owner_id"] },
                                                { "$eq": ["$item_available", true] },
                                                { "$eq": ["$recommend", true] },
                                            ]
                                    }
                                }
                            }
                        ],
                        as: 'Menu_List'
                    }
                },
                { $unwind: { path: "$Menu_List", preserveNullAndEmptyArrays: true } },
                // hide_project
                {
                    $project: {
                        item_id: "$Menu_List._id",
                        recommend: "$Menu_List.recommend",
                        menu_category_id: "$Menu_List.menu_category_id",
                        item_available: "$Menu_List.item_available",
                        item_description: "$Menu_List.item_description",
                        item_name: "$Menu_List.item_name",
                        dish_rating: "$Menu_List.dish_rating",
                        total_reviews: "$Menu_List.total_reviews",
                        item_price: "$Menu_List.item_price",
                        item_image: "$Menu_List.item_image",
                        order_count: "$Menu_List.order_count",
                        createdAt: "$Menu_List.createdAt",
                    }
                }
            ]
        }).exec()

        menus[0].order_history = order_history;
        let obj = resPattern.successPattern(httpStatus.OK, menus, 'success');
        return res.status(obj.code).json(obj);


    } catch (e) {
        return next(new APIError(e.message, httpStatus.BAD_REQUEST, true));
    }
}

// get restaurant briefing.

const restaurantBriefing = async (req, res, next) => {
    try {
        const hosting_Address = req.body.hosting_Address;
        let active = await User.findOne({ hosting_Address: hosting_Address, isActive: 1, is_outlet: false }).select('currencies location restaurant_image qrcode restaurant_Description restaurant_Minimum_order restaurant_Name restaurant_ratings total_reviews is_outlet self_service')
        if (!active || active.isActive == false) {
            return next(new APIError('Service of this restaurant is temporarily suspended, please contact the site owner', httpStatus.BAD_REQUEST, true));
        } else {
            let obj = resPattern.successPattern(httpStatus.OK, active, 'success');
            return res.status(obj.code).json(obj);
        }
    } catch (e) {
        return next(new APIError(e.message, httpStatus.BAD_REQUEST, true));
    }
}


//----  get all cites from city collection

const cities = async (req, res, next) => {
    try {
        const result = await City.distinct('city_name');
        let obj = resPattern.successPattern(httpStatus.OK, result, 'success');
        return res.status(obj.code).json(obj);
    } catch (e) {
        return next(new APIError(e.message, httpStatus.BAD_REQUEST, true));
    }
}


//---- get city restaurant
const incity = async (req, res, next) => {
    try {
        const reqData = req.body;
        const result = await City.findOne({
            city_name: reqData.city
        });
        const findrestaurants = await User.find({ userType: "owner", restaurant_city: result._id, is_outlet: false, isActive: true })
        let obj = resPattern.successPattern(httpStatus.OK, findrestaurants, 'success');
        return res.status(obj.code).json(obj);
    } catch (e) {
        return next(new APIError(e.message, httpStatus.BAD_REQUEST, true));
    }
}


const getAllcity = async (req, res, next) => {
    try {
        const allcity = await City.find()
        const city = []
        allcity.forEach((element) => {
            city.push(
                {
                    _id: element._id,
                    city_name: element.city_name
                }
            )

        })
        let obj = resPattern.successPattern(httpStatus.CREATED, { Cities: city }, 'success')
        return res.status(obj.code).json(obj)

    } catch (e) {
        return next(new APIError(e.message, httpStatus.BAD_REQUEST, true));
    }

}

// get variants op

//---------- Address Management client Side  -----------
const add_address = async (req, res, next) => {
    try {
        const loggedUser = req.user
        const address = req.body.address


        const addaddress = await User.findOneAndUpdate({ _id: loggedUser._id }, {
            $push: {
                address: {
                    user_address: address
                }
            }
        }, { new: true })
        let obj = resPattern.successPattern(httpStatus.OK, addaddress, 'success');
        return res.status(obj.code).json(obj);
    } catch (error) {
        return next(new APIError(error.message, httpStatus.BAD_REQUEST, true));
    }
}
const getaddress = async (req, res, next) => {
    try {
        const loggedUser = req.user
        const found_address = await User.findOne({ _id: loggedUser._id }, { address: 1 })
        let obj = resPattern.successPattern(httpStatus.OK, found_address, 'success');
        return res.status(obj.code).json(obj);
    } catch (error) {
        return next(new APIError(error.message, httpStatus.BAD_REQUEST, true));
    }
}
const deleteaddress = async (req, res, next) => {
    try {
        const loggedUser = req.user
        const userid = loggedUser._id
        const address_id = req.params.addressid
        const delete_address = await User.findOneAndUpdate({ _id: userid }, { $pull: { "address": { "_id": address_id } } }, { new: true })
        let obj = resPattern.successPattern(httpStatus.OK, delete_address, 'success');
        return res.status(obj.code).json(obj);
    } catch (error) {
        return next(new APIError(error.message, httpStatus.BAD_REQUEST, true));
    }
}

const image_upload = async (req, res, next) => {
    const reqData = req.body;
    const reqFiles = req.files;
    let obj = resPattern.successPattern(httpStatus.OK, { reqFiles }, 'success');
    return res.status(obj.code).json(obj);
}


module.exports = {
    nearByRestaurants,
    dish_hunt,
    restaurantBriefing,
    restaurantDetails,
    restaurantDetails_v2,
    restaurant_hunt,
    cities,
    incity,
    getAllcity,
    add_address,
    getaddress,
    deleteaddress,
    image_upload
}
