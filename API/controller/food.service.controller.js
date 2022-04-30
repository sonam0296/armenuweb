const httpStatus = require('http-status');
const APIError = require('../helpers/APIError');
const resPattern = require('../helpers/resPattern');
const User = require('../model/user.model');
const Review = require("../model/reviews.model");
const Dish = require('../model/menu_items.model');
const Cart = require('../model/cart.model');
const Order = require('../model/orders.model');
const mongoose = require('mongoose');
const moment = require('moment');
const { mail_template } = require('../helpers/sendEmail');
const { send_notification } = require('../helpers/fcm_notification');
const { create_order, verify_raz_transfer, razor_refund } = require('../helpers/razor.payment');
const { stripe_payintent, stripe_webhook_mgt, cancel_paymentIntent, stripe_refund } = require('../helpers/stripe.payment');
const { translate_meta, i18_notification_translate } = require('../helpers/i18n');

// --- lab controller ---



// ---------------- assist functions -----------------------------//


const cancel_order_notification = async (result, owner) => {
    const client = await User.findById(result.client_id, {
        name: 1,
        profile_image: 1,
        language_preference: 1,
        fcm_registration_token: 1
    })
    const status = '$t(order_status.' + result.last_status + ')';
    translate_meta.lan = owner.language_preference;
    translate_meta.key = 'update_notification.from_client';
    translate_meta.interpolation = {
        status: status,
        client_name: client.name,
        Order_cancel_time: moment(result.Order_cancel_time).fromNow()
    }
    translate_meta.payload = {
        tokens: owner.fcm_registration_token,
        headers: {
            Order_Time: moment(result.Ordered_time).fromNow(),
            Urgency: "high"
        },
        notification: {
            title: undefined,
            body: undefined,
            image: client.profile_image.image_url ? client.profile_image.image_url : "https://appetizar.nyc3.digitaloceanspaces.com/1611483081429-driver.png"
        },
        data: {
            client_id: result.client_id.toString(),
            order_id: result._id.toString(),
            order_status: result.last_status,
            userType: "owner"
        }
    }

    owner.fcm_registration_token && owner.fcm_registration_token.length > 0 && await i18_notification_translate(translate_meta, send_notification);
}

const place_order_notification = async (reqData, owner, order, loggedInUser) => {
    // if (owner.fcm_registration_token) {
    translate_meta.payload = {
        tokens: owner.fcm_registration_token,
        headers: {
            Order_Time: moment(reqData.Ordered_time).fromNow(),
            Urgency: "high"
        },
        notification: {
            title: undefined,
            body: undefined,
            image: loggedInUser.profile_image.image_url ? loggedInUser.profile_image.image_url : "https://appetizar.nyc3.digitaloceanspaces.com/1611482529889-undraw_cooking_lyxy.png",
        },
        data: {
            owner_id: order.owner_id.toString(),
            order_id: order._id.toString(),
            Total_Order: order.items.length.toString() + " items",
            Order_timings: moment(order.Ordered_time).fromNow().toString(),
            order_details: undefined,
            userType: "owner"
        }
    }
    if (reqData.delivery_type === 'Deliver' || reqData.delivery_type === 'Dine') {
        // --- send live notification for order type delivery ---
        translate_meta.lan = owner.language_preference;
        translate_meta.key = `liveOrder_notification.${reqData.delivery_type}`;
        translate_meta.interpolation = {
            eta_lower_bound: moment().fromNow(order.eta_lower_bound),
            client_name: loggedInUser.name,
            currency_symbol: loggedInUser.currencies.symbol,
            total_amount: order.total
        }
        owner.fcm_registration_token && owner.fcm_registration_token.length > 0 && owner.fcm_registration_token && await i18_notification_translate(translate_meta, send_notification);
    }
    if (reqData.delivery_type === 'Pickup') {
        // --- send live notification for order type pick-up ---
        translate_meta.lan = owner.language_preference;
        translate_meta.key = 'liveOrder_notification.Pickup';
        translate_meta.interpolation = {
            eta_lower_bound: moment(reqData.eta_lower_bound).format("hh:mm"),
            eta_upper_bound: moment(reqData.eta_upper_bound).format("hh:mm"),
            client_name: loggedInUser.name,
            currency_symbol: loggedInUser.currencies.symbol,
            total_amount: order.total
        }
        owner.fcm_registration_token && owner.fcm_registration_token.length > 0 && await i18_notification_translate(translate_meta, send_notification);
    }
    // }
    return 0;
}

const fetch_orders = async (req, res, next) => {
    try {
        const loggedInUser = req.user;
        let result = undefined;
        let startDate = {};
        let endDate = {};
        let driver = {};
        let client = {};
        let owner = {};
        let aggregator = {};
        let reqData = {};
        let query = [];
        reqData = {
            startDate: req.body.startDate ? new Date(req.body.startDate) : '',
            endDate: req.body.endDate ? new Date(req.body.endDate) : null,
            owner_id: req.body.owner_id ? mongoose.Types.ObjectId(req.body.owner_id) : '',
            client_id: req.body.client_id ? mongoose.Types.ObjectId(req.body.client_id) : '',
            driver_id: req.body.driver_id ? mongoose.Types.ObjectId(req.body.driver_id) : '',
            items_in_page: req.body.items_in_page ? req.body.items_in_page : 10,
            page_number: req.body.page_number ? req.body.page_number : 1,
        };
        reqData.endDate = req.body.endDate ? new Date(req.body.endDate) : reqData.startDate;

        if (reqData.startDate && reqData.endDate) {
            startDate = { "createdAt": { $gte: reqData.startDate } }
            endDate = { "createdAt": { $lte: reqData.endDate } }
        }
        if (reqData.driver_id) {
            driver = { "driver_id": reqData.driver_id }
        }
        if (reqData.client_id) {
            client = { "client_id": reqData.client_id }
        }
        if (reqData.owner_id) {
            owner = { "owner_id": reqData.owner_id }
        }
        if (reqData.aggregator_id) {
            aggregator = { "aggregator_id": reqData.aggregator_id }
        }
        // ------ query building -------
        let client_name = [
            {
                $lookup: {
                    from: 'users',
                    let: { 'user_id': '$client_id' },
                    pipeline: [{
                        "$match": {
                            "$expr": { "$eq": ["$_id", "$$user_id"] }
                        }
                    },
                    {
                        "$project": {
                            "_id": 1,
                            "name": 1,
                            "profile_image.image_url": 1
                        }
                    }
                    ],
                    as: 'client_name'
                }
            },
            { $unwind: '$client_name' }
        ];
        let driver_name = [
            {
                $lookup: {
                    from: 'users',
                    let: { 'user_id': '$driver_id' },
                    pipeline: [{
                        "$match": {
                            "$expr": { "$eq": ["$_id", "$$user_id"] }
                        }
                    },
                    {
                        "$project": {
                            "_id": 1,
                            "name": 1,
                            "profile_image.image_url": 1
                        }
                    }
                    ],
                    as: 'driver_name'
                }
            },
            { $unwind: { path: "$driver_name", preserveNullAndEmptyArrays: true } },
        ];
        let restaurant_Name = [
            {
                $lookup: {
                    from: 'users',
                    let: { 'user_id': '$owner_id' },
                    pipeline: [{
                        "$match": {
                            "$expr": { "$eq": ["$_id", "$$user_id"] }
                        }
                    },
                    {
                        "$project": {
                            "_id": 1,
                            "restaurant_Name": 1,
                            "restaurant_image.image_url": 1
                        }
                    }
                    ],
                    as: 'restaurant_Name'
                }
            },
            { $unwind: '$restaurant_Name' },
        ];
        let projection = [
            {
                $project: {
                    _id: 1,
                    // items:1,
                    o_id: 1,
                    createdAt: 1,
                    time_slot: {
                        $concat: [{
                            $dateToString: {
                                date: "$eta_upper_bound",
                                format: "%H:%M"
                            }
                        }, '-', {
                            $dateToString: {
                                date: "$eta_lower_bound",
                                format: "%H:%M"
                            }
                        }]
                    },
                    delivery_type: 1,
                    last_status: 1,
                    delivery_status: 1,
                    client_name: 1,
                    driver_name: 1,
                    restaurant_Name: 1,
                    delivery_address: 1,
                    items: { $size: '$items' },
                    total: 1,
                    driver_id: 1,
                    delivery_charge: 1,
                    created: 1,
                }
            },
            {
                $facet: {
                    docs: [
                        // { $sort: sort },
                        { $sort: { _id: -1 } },
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
        ]
        switch (loggedInUser.userType) {
            case "admin": query = [
                {
                    $match: {
                        $and:
                            [
                                startDate,
                                endDate,
                                driver,
                                client,
                                owner
                            ],
                    }
                },

                ...client_name,
                ...driver_name,
                ...restaurant_Name,
                ...projection

            ]
                break;
            case "driver_aggregator":
                aggregator = {
                    aggregator_id: mongoose.Types.ObjectId(loggedInUser._id)
                };
                query = [
                    {
                        $match: {
                            $and:
                                [
                                    startDate,
                                    endDate,
                                    aggregator,
                                    driver,
                                    client,
                                    owner
                                ],
                        }
                    },

                    ...client_name,
                    ...driver_name,
                    ...restaurant_Name,
                    ...projection

                ]
                break;
            case "owner":
                owner = {
                    owner_id: mongoose.Types.ObjectId(loggedInUser._id)
                };
                query = [
                    {
                        $match: {
                            $and:
                                [
                                    startDate,
                                    endDate,
                                    driver,
                                    client,
                                    owner
                                ],
                        }
                    },

                    ...client_name,
                    ...driver_name,
                    // ...restaurant_Name,
                    ...projection

                ]
                break;
            case "client":
                client = {
                    client_id: mongoose.Types.ObjectId(loggedInUser._id)
                };
                projection[0]["$project"].order_details = '$items.menu_item_id'
                query = [
                    {
                        $match: {
                            $and:
                                [
                                    startDate,
                                    endDate,
                                    driver,
                                    client,
                                    owner
                                ],
                        }
                    },

                    // ...client_name,
                    ...driver_name,
                    ...restaurant_Name,
                    ...projection

                ]
                break;
            case "driver":
                driver = {
                    driver_id: mongoose.Types.ObjectId(loggedInUser._id)
                };
                if (loggedInUser.isAggregatorDrivers) {
                    aggregator = {
                        aggregator_id: mongoose.Types.ObjectId(loggedInUser.employer_id)
                    };
                }

                query = [
                    {
                        $match: {
                            $and:
                                [
                                    startDate,
                                    endDate,
                                    driver,
                                    client,
                                    owner,
                                    aggregator
                                ],
                        }
                    },

                    ...client_name,
                    // ...driver_name,
                    ...restaurant_Name,
                    ...projection

                ]
                break;
            default:
                return next(new APIError("Not Authorized to access the data", httpStatus.UNAUTHORIZED, true));
        }

        result = await Order.aggregate(query);
        let owners, clients, drivers = undefined;
        if (loggedInUser.userType !== "owner") {
            owners = await get_owners(req, res, next);
            if (owners.length > 0) {
                owners = owners[0].owners
            }
        }
        if (loggedInUser.userType !== "client") {
            clients = await get_clients(req, res, next);
            if (clients) {
                clients = clients[0].clients
            }
        }
        if (loggedInUser.userType !== "driver") {
            drivers = await get_drivers(req, res, next);
            if (drivers[0].drivers) {
                drivers = drivers[0].drivers
            }
        }

        return { result, drivers, clients, owners }
    } catch (e) {
        console.log(e);
        return next(new APIError(e.message, httpStatus.BAD_REQUEST, true));
    }

}

const live_order_feeds = async (user) => {

    let owner_id = {}
    let client_id = {}
    let aggregator_id = {}
    let result = []
    if (user.userType === 'owner') {
        owner_id = { owner_id: mongoose.Types.ObjectId(user._id) }
    }
    if (user.userType === 'driver_aggregator') {
        aggregator_id = { aggregator_id: mongoose.Types.ObjectId(user._id) }
    }
    if (user.userType === 'client') {
        client_id = { client_id: mongoose.Types.ObjectId(user._id) }
    }
    let live_order_query = [
        {
            $match: {
                $and: [
                    owner_id,
                    aggregator_id,
                    client_id,
                    { is_live: true },
                    { createdAt: { $gte: new Date(new Date().setDate(new Date().getDate() - 1)) } }
                ]
            },
        },
        { $sort: { _id: -1 } },
        {
            $lookup: {
                from: 'users',
                let: { 'user_id': '$owner_id' },
                pipeline: [{
                    "$match": {
                        "$expr": { "$eq": ["$_id", "$$user_id"] }
                    }
                },
                {
                    "$project": {
                        "_id": 1,
                        "name": 1,
                        "restaurant_Name": 1,
                    }
                }
                ],
                as: 'owner_name'
            }
        },
        { $unwind: '$owner_name' },
        {
            $lookup: {
                from: 'users',
                let: { 'user_id': '$client_id' },
                pipeline: [{
                    "$match": {
                        "$expr": { "$eq": ["$_id", "$$user_id"] }
                    }
                },
                {
                    "$project": {
                        "_id": 1,
                        "name": 1
                    }
                }
                ],
                as: 'client_name'
            }
        },
        { $unwind: '$client_name' },
        {
            $project: {
                _id: 1,
                last_status: 1,
                delivery_status: 1,
                orders: {
                    order_id: '$_id',
                    o_id: '$o_id',
                    delivery_type: '$delivery_type',
                    client_name: '$client_name',
                    last_status: '$last_status',
                    delivery_status: '$delivery_status',
                    owner_name: '$owner_name',
                    total: '$total',
                    delivery_charge: '$delivery_charge',
                    createdAt: '$createdAt',
                    items_length: { $size: "$items" },
                    time_slot: {
                        $concat: [{
                            $dateToString: {
                                date: "$eta_upper_bound",
                                format: "%H:%M"
                            }
                        }, '-', {
                            $dateToString: {
                                date: "$eta_lower_bound",
                                format: "%H:%M"
                            }
                        }]
                    },
                }
            }
        },
        {
            $group: {
                _id: '$last_status',
                status_type: { $first: "restaurant" },
                orders: { $push: '$orders' }
            }
        }
    ]

    result = await Order.aggregate(
        live_order_query
    );

    live_order_query.splice(-1, 1, {
        $group: {
            _id: '$delivery_status',
            status_type: { $first: "delivery" },
            orders: { $push: '$orders' }
        }
    })
    const delivery_statuses = await Order.aggregate(
        live_order_query)
    result = [...result, ...delivery_statuses]
    return result
}

const dashBoard_stats = async (user) => {
    const month = new Date().getUTCMonth() + 1;
    const year = new Date().getUTCFullYear();
    // ---- common query blocks ----
    let query = [
        {
            $facet: {
                exposer_to: [
                    {
                        $group: {
                            _id: '$client_id',
                        }
                    },
                    {
                        $count: "exposer_to"
                    }
                ],

                orders_from: [
                    {

                        $lookup: {
                            from: 'users',
                            let: { 'user_id': '$client_id' },
                            pipeline: [{
                                "$match": {
                                    "$expr": { "$eq": ["$_id", "$$user_id"] }
                                }
                            },
                            {
                                "$project": {
                                    "_id": 1,
                                    "createdMonth": { $month: '$createdAt' }
                                }
                            },
                            {
                                "$match": {
                                    "createdMonth": month
                                }
                            },
                            {
                                "$group": {
                                    "_id": "$createdMonth",
                                    "unique_users": { "$addToSet": '$_id' }
                                }
                            },
                            ],
                            as: 'unique_users'
                        }
                    },
                    { $unwind: '$unique_users' },
                    {
                        $project: {
                            unique_users_count: { $size: "$unique_users.unique_users" }
                        }
                    },
                    {
                        $group: {
                            _id: null,
                            unique_users: { $first: '$unique_users_count' }
                        }
                    }
                ],

                stats: [
                    {
                        $group: {
                            _id: { $month: '$createdAt' },
                            orders: { $push: '$_id' },
                            sales_volume: { $sum: '$total' }
                        }
                    },
                    {
                        $project: {

                            orders: { $size: '$orders' },
                            sales_volume: 1
                        }
                    },
                    { $sort: { _id: -1 } }
                ],

                sales_value: [
                    {
                        $group: {
                            _id: { $month: "$createdAt" },
                            monthly_sales: { $sum: '$total' },
                            count: { $sum: 1 }
                        }
                    },
                    { $sort: { _id: -1 } }
                ],

                total_orders: [
                    {
                        $group: {
                            _id: { $month: "$createdAt" },
                            monthly_order: { $push: '$_id' },
                            count: { $sum: 1 }
                        }
                    },
                    {
                        $project: {
                            _id: 1,
                            monthly_order: { $size: '$monthly_order' },
                            count: 1
                        }
                    },
                    { $sort: { _id: 1 } }
                ],
            },
        }
    ]

    // ---- projection block with this year's current month only ----
    let project = {
        $project: {
            month: { $month: '$createdAt' },
            year: { $year: '$createdAt' },
            _id: 1,
            client_id: 1,
            owner_id: 1,
            aggregator_id: 1,
            total: 1,
            createdAt: 1
        }
    };

    // ---- when owner requests for dashboard stats ----
    let user_filter = {

        $match: {
            $and:
                [
                    // { month: month },
                    { year: year }
                ]
        }
    };


    if (user.userType === 'owner') {
        user_filter['$match']['$and'].unshift({ 'owner_id': mongoose.Types.ObjectId(user._id) })
        query.unshift(user_filter)
    }
    else if (user.userType === 'driver_aggregator') {
        delete query[0]['$facet']['exposer_to']
        delete query[0]['$facet']['orders_from']
        delete query[0]['$facet']['sales_value']
        user_filter['$match']['$and'].unshift({ 'aggregator_id': mongoose.Types.ObjectId(user._id) })
        query.unshift(user_filter)
    }
    else {
        query.unshift(user_filter)
    }
    query.unshift(project);
    const result = await Order.aggregate(query)
    return result
}


// ---------------------Main functions -----------------------------------------//


// get cart list.
const cart_list = async (req, res, next) => {
    try {
        const loggedInUser = req.user;
        let result = {
            cart_data: undefined,
            cart_data_id: undefined,
        };

        const cart = await Cart.findOne({ client_id: loggedInUser._id })
            .populate('myCart.menu_item_id', '_id item_name item_description item_price item_image vat_percentage item_available enable_variants')
            .populate(
                {
                    path: 'myCart.menu_item_id',
                    model: 'Menus',

                    populate: [{
                        path: 'menu_category_id',
                        model: 'MenuCategory',
                        select: '_id category'
                    }],

                    select: '_id item_name item_description item_price item_image vat_percentage item_available enable_variants _id'
                }
            ).populate('myCart.extras_id', '_id extras_name price')
            .populate(
                {
                    path: 'myCart.variant_id',
                    model: 'variants',
                    populate: [{
                        path: 'variant_op_id',
                        model: 'variant_options',
                        select: 'option_name _id'
                    }],
                    select: '_id price variant_name '
                }
            ).populate('owner_id', '_id restaurant_Name delivery_charge restaurant_image')
        // .exec();
        result.cart_data_id = await Cart.findOne({ client_id: loggedInUser._id });
        result.cart_data = cart
        let obj = resPattern.successPattern(httpStatus.OK, result, 'success');
        return res.status(obj.code).json(obj);

    } catch (e) {
        return next(new APIError(e.message, httpStatus.BAD_REQUEST, true));
    }
}


// add to cart
const addtoCart = async (req, res, next) => {
    try {
        const loggedInUser = req.user;
        const reqData = new Cart(req.body);
        let result = undefined;

        let cart = await Cart.findOne({ client_id: mongoose.Types.ObjectId(loggedInUser._id) });
        if (cart) {
            cart.myCart = reqData.myCart;
            cart.sub_total = reqData.sub_total;
            cart.owner_id = reqData.owner_id;
            //  use with save function
            result = await cart.save();
        } else {
            reqData.client_id = loggedInUser._id;
            result = await reqData.save();
        }

        if (result) {
            // send response
            let obj = resPattern.successPattern(httpStatus.OK, result, 'success');
            return res.status(obj.code).json(obj);
        }
    } catch (e) {
        return next(new APIError(e.message, httpStatus.BAD_REQUEST, true));
    }
}

// delete menu by admin
const deleteCart = async (req, res, next) => {
    try {
        const loggedInUser = req.user;
        const result = await Cart.findOneAndDelete({ client_id: mongoose.Types.ObjectId(loggedInUser._id) });

        // verify delete
        if (!result) {
            const message = `Cart not found with Id: '${loggedInUser._id}'.`;
            return next(new APIError(message, httpStatus.NOT_FOUND, true));
        }

        if (result) {
            // send response
            let obj = resPattern.successPattern(httpStatus.OK, result, 'success');
            return res.status(obj.code).json(obj);
        }
    } catch (e) {
        console.log(e);
        return next(new APIError(e.message, httpStatus.BAD_REQUEST, true));
    }
}


// ===================== Order services ==========================

// ---- get drivers associated with any order ----
const get_drivers = async (req, res, next) => {
    try {

        const loggedInUser = req.user;
        const reqData = req.body;
        let owner = {};
        let driver = {};
        let aggregator = {};
        if (loggedInUser.userType === 'driver_aggregator') {
            aggregator = {
                'aggregator_id': mongoose.Types.ObjectId(loggedInUser._id)
            }
        }
        if (loggedInUser.userType === 'owner') {
            owner = {
                owner_id: mongoose.Types.ObjectId(loggedInUser._id)
            }
        }
        if (reqData.driver_name) {
            driver = {
                'name': { $regex: reqData.driver_name, $options: 'i' }
            }
        }
        const result = await Order.aggregate([
            {
                $match: {
                    $and: [
                        owner,
                        aggregator
                    ]
                }
            },
            {
                $lookup: {
                    from: 'users',
                    let: { 'user_id': '$driver_id' },
                    pipeline: [{
                        "$match": {
                            $and: [
                                { "$expr": { "$eq": ["$_id", "$$user_id"] } },
                                driver,
                            ]
                        }
                    },
                    {
                        "$project": {
                            "_id": 1,
                            "name": 1,
                            "profile_image": 1
                        }
                    }
                    ],
                    as: 'drivers'
                }
            },

            { $unwind: { path: "$drivers", preserveNullAndEmptyArrays: true } },
            {
                $group: {
                    _id: null,
                    drivers: { $addToSet: '$drivers' }
                }
            },
            {
                $project: {
                    _id: 0,
                    drivers: 1
                }
            }
        ]);
        if (result.length > 0) {
            return result
        } else {
            return null
        }

    } catch (e) {
        return next(new APIError(e.message, httpStatus.BAD_REQUEST, true));
    }
}

// ---- get all drivers associated with owner and aggregator ----
const get_assoc_drivers = async (req, res, next) => {
    try {
        const loggedInUser = req.user;
        const employer_id = req.body.employer_id ? req.body.employer_id : loggedInUser._id;
        const finddrivers = await User.find({ employer_id: mongoose.Types.ObjectId(employer_id) }, { profile_image: 1, email: 1, phone: 1, name: 1, employer_id: 1 }).sort({ _id: -1 })
        let obj = resPattern.successPattern(httpStatus.OK, finddrivers, 'success');
        return res.status(obj.code).json(obj);
    } catch (error) {
        console.log(error);
        return next(new APIError(error.message, httpStatus.BAD_REQUEST, true))
    }

}

const delete_drivers = async (req, res, next) => {
    try {

        const driversid = req.params.driver_id

        const deletedriver = await User.findOneAndDelete({
            _id: driversid
        })


        let obj = resPattern.successPattern(httpStatus.CREATED, { Drivers: deletedriver }, 'success')
        return res.status(obj.code).json(obj)
    } catch (error) {
        console.log(error);
        return next(new APIError(error.message, httpStatus.BAD_REQUEST, true))
    }
}

// --- get owners associated with order ---
const get_owners = async (req, res, next) => {
    try {
        const reqData = req.body;
        const loggedInUser = req.user;
        let owner = {};
        let aggregator = {};
        if (loggedInUser.userType === 'driver_aggregator' || loggedInUser.isAggregatorDrivers) {
            const agg_id = loggedInUser.isAggregatorDrivers ? loggedInUser.employer_id : loggedInUser._id
            aggregator = {
                'aggregator_id': mongoose.Types.ObjectId(agg_id)
            }
        }
        if (reqData.owner_name) {
            owner = {
                'restaurant_Name': { $regex: reqData.owner_name, $options: 'i' }
            }
        }
        const result = await Order.aggregate([
            {
                $lookup: {
                    from: 'users',
                    let: { 'user_id': '$owner_id' },
                    pipeline: [{
                        "$match": {
                            $and: [
                                { "$expr": { "$eq": ["$_id", "$$user_id"] } },
                                owner,
                                aggregator
                            ]
                        }
                    },
                    {
                        "$project": {
                            "_id": 1,
                            "restaurant_Name": 1,
                            "restaurant_image.image_url": 1
                        }
                    }
                    ],
                    as: 'owners'
                }
            },
            { $unwind: "$owners" },
            {
                $group: {
                    _id: null,
                    owners: { $addToSet: '$owners' }
                }
            },
            {
                $project: {
                    _id: 0,
                    owners: 1
                }
            }
        ]);
        return result
    } catch (e) {
        return next(new APIError(e.message, httpStatus.BAD_REQUEST, true));
    }
}

// --- get clients associated with order ---
const get_clients = async (req, res, next) => {
    try {
        const loggedInUser = req.user;
        const reqData = req.body;
        let owner = {};
        let client = {};
        let aggregator = {};
        if (loggedInUser.userType === 'driver_aggregator' || loggedInUser.isAggregatorDrivers) {
            const agg_id = loggedInUser.isAggregatorDrivers ? loggedInUser.employer_id : loggedInUser._id
            aggregator = {
                'aggregator_id': mongoose.Types.ObjectId(agg_id)
            }
        }
        if (reqData.client_name) {
            client = {
                'name': { $regex: reqData.client_name, $options: 'i' }
            }
        }
        if (loggedInUser.userType === 'owner') {
            owner = { owner_id: mongoose.Types.ObjectId(loggedInUser._id) }
        }

        const result = await Order.aggregate([
            {
                $match: {
                    $and: [
                        owner,
                        aggregator
                    ]
                }
            },
            {
                $lookup: {
                    from: 'users',
                    let: { 'user_id': '$client_id' },
                    pipeline: [{
                        "$match": {
                            $and: [
                                { "$expr": { "$eq": ["$_id", "$$user_id"] } },
                                client

                            ]
                        }
                    },
                    {
                        "$project": {
                            "_id": 1,
                            "name": 1,
                            "profile_image.image_url": 1
                        }
                    }
                    ],
                    as: 'clients'
                }
            },
            { $unwind: "$clients" },
            {
                $group: {
                    _id: null,
                    clients: { $addToSet: '$clients' }
                }
            },
            {
                $project: {
                    _id: 0,
                    clients: 1,
                    "profile_image.image_url": 1
                }
            }
        ]);
        if (result.length > 0) {
            return result
        } else {
            return null
        }
    } catch (e) {
        return next(new APIError(e.message, httpStatus.BAD_REQUEST, true));
    }
}

// get owner order list.
const owner_dashboard = async (req, res, next) => {
    try {
        const loggedInUser = req.user;
        const result = await dashBoard_stats(loggedInUser)

        let obj = resPattern.successPattern(httpStatus.OK, result, 'success');
        return res.status(obj.code).json(obj);
    } catch (e) {
        return next(new APIError(e.message, httpStatus.BAD_REQUEST, true));
    }
}

// get owner order list.
const aggregator_dashboard = async (req, res, next) => {
    try {
        const loggedInUser = req.user;
        let result = await dashBoard_stats(loggedInUser)
        result[0].restaurants = await User.find({ aggregator_id: loggedInUser._id }).countDocuments();
        result[0].drivers = await User.find({ isAggregatorDrivers: true, employer_id: loggedInUser._id }).countDocuments();
        let obj = resPattern.successPattern(httpStatus.OK, result, 'success');
        return res.status(obj.code).json(obj);
    } catch (e) {
        return next(new APIError(e.message, httpStatus.BAD_REQUEST, true));
    }
}

// get owner order list.
const admin_dashboard = async (req, res, next) => {
    try {
        const loggedInUser = req.user;
        const result = await dashBoard_stats(loggedInUser)

        let obj = resPattern.successPattern(httpStatus.OK, result, 'success');
        return res.status(obj.code).json(obj);
    } catch (e) {
        return next(new APIError(e.message, httpStatus.BAD_REQUEST, true));
    }
}

// get live order list for admin.
const admin_live_orders = async (req, res, next) => {
    try {
        const loggedInUser = req.user;
        const result = await live_order_feeds(loggedInUser);
        let obj = resPattern.successPattern(httpStatus.OK, result, 'success');
        return res.status(obj.code).json(obj);
    } catch (e) {
        return next(new APIError(e.message, httpStatus.BAD_REQUEST, true));
    }
}

// get live order list for admin.
const client_live_orders = async (req, res, next) => {
    try {
        const loggedInUser = req.user;
        const result = await live_order_feeds(loggedInUser);
        let obj = resPattern.successPattern(httpStatus.OK, result, 'success');
        return res.status(obj.code).json(obj);
    } catch (e) {
        return next(new APIError(e.message, httpStatus.BAD_REQUEST, true));
    }
}

// get live order list for owner.
const owner_live_orders = async (req, res, next) => {
    try {
        const loggedInUser = req.user;
        const result = await live_order_feeds(loggedInUser);
        let obj = resPattern.successPattern(httpStatus.OK, result, 'success');
        return res.status(obj.code).json(obj);
    } catch (e) {
        return next(new APIError(e.message, httpStatus.BAD_REQUEST, true));
    }
}

// get live order list for aggregator.
const aggregator_live_orders = async (req, res, next) => {
    try {
        const loggedInUser = req.user;
        const result = await live_order_feeds(loggedInUser);
        let obj = resPattern.successPattern(httpStatus.OK, result, 'success');
        return res.status(obj.code).json(obj);
    } catch (e) {
        return next(new APIError(e.message, httpStatus.BAD_REQUEST, true));
    }
}


// get order list.
const my_orders = async (req, res, next) => {
    try {
        const { result, drivers, clients, owners } = await fetch_orders(req, res, next)

        let obj = resPattern.successPattern(httpStatus.OK, { result, drivers, clients, owners }, 'success');
        return res.status(obj.code).json(obj);
    } catch (e) {
        console.log(e);
        return next(new APIError(e.message, httpStatus.BAD_REQUEST, true));
    }
}

// --- get delivery request listing for driver---
const standBy_orders = async (req, res, next) => {
    try {
        const user = req.user;
        // const params = req.params;
        // const query = req.query;
        const reqData = req.body;
        let query = {};
        if (reqData.isAggregatorDrivers) {
            query = { aggregator_id: mongoose.Types.ObjectId(reqData.employer_id), delivery_status: reqData.delivery_status, is_live: true }
        }
        if (reqData.isRestaurantDrivers) {
            query = { owner_id: mongoose.Types.ObjectId(reqData.employer_id), delivery_status: reqData.delivery_status, is_live: true }
        }
        const orders = await Order.find(query).populate('owner_id', '_id restaurant_Name address restaurant_image').sort({ _id: -1 })
        let obj = resPattern.successPattern(httpStatus.OK, orders, 'success');
        return res.status(obj.code).json(obj);
    } catch (e) {
        return next(new APIError(e.message, httpStatus.BAD_REQUEST, true));
    }
}

// --- get delivery request listing for driver---
const ongoing_orders = async (req, res, next) => {
    try {
        const user = req.user;
        const reqData = req.body;
        let query = { driver_id: mongoose.Types.ObjectId(reqData.driver_id), delivery_status: { $nin: ["Delivered"] }, is_live: true };
        const orders = await Order.find(query).populate('owner_id', '_id restaurant_Name address restaurant_image').sort({ _id: -1 })
        let obj = resPattern.successPattern(httpStatus.OK, orders, 'success');
        return res.status(obj.code).json(obj);
    } catch (e) {
        return next(new APIError(e.message, httpStatus.BAD_REQUEST, true));
    }
}

// get owner order list.
const owner_finance = async (req, res, next) => {
    try {
        const loggedInUser = req.user;
        const user_acc = loggedInUser.stripe_account;
        const stipe_acc_status = loggedInUser.is_stripe_connected;
        let reqData = {
            startDate: req.body.startDate ? new Date(req.body.startDate) : '',
        };
        reqData.endDate = req.body.endDate ? new Date(req.body.endDate) : reqData.startDate;
        let result = undefined;
        let startDate = {};
        let endDate = {};
        if (reqData.startDate && reqData.endDate) {
            startDate = { "createdAt": { $gte: reqData.startDate } }
            endDate = { "createdAt": { $lte: reqData.endDate } }
        }
        result = await Order.aggregate([
            {
                $match: {
                    $and:
                        [
                            { 'owner_id': mongoose.Types.ObjectId(loggedInUser._id) },
                            startDate,
                            endDate,
                        ],
                }
            },
            {
                $project: {
                    _id: 1,

                    total: 1,
                    net_value: 1,
                    total_vat: 1,
                    last_status: 1,
                }
            },
            {
                $facet: {
                    stats: [
                        {
                            $group: {
                                _id: null,
                                orders: { $sum: 1 },
                                total: { $sum: '$total' },
                                net_value: { $sum: '$net_value' },
                                vat_value: { $sum: '$total_vat' },
                                deliveries: {
                                    $sum: {
                                        $cond: [
                                            { $eq: ['$last_status', 'Delivered'] },
                                            1, 0
                                        ]
                                    }
                                }
                            }
                        }
                    ],
                },
            }
        ]);
        let obj = resPattern.successPattern(httpStatus.OK, { stipe_acc_status, user_acc, result }, 'success');
        return res.status(obj.code).json(obj);
    } catch (e) {
        return next(new APIError(e.message, httpStatus.BAD_REQUEST, true));
    }
}

// get admin finance list.
const admin_finance = async (req, res, next) => {
    try {
        const loggedInUser = req.user;
        let reqData = {
            startDate: req.body.startDate ? new Date(req.body.startDate) : '',
            owner_id: req.body.owner_id ? mongoose.Types.ObjectId(req.body.owner_id) : '',
        };
        reqData.endDate = req.body.endDate ? new Date(req.body.endDate) : reqData.startDate;
        let result = undefined;
        let startDate = {};
        let endDate = {};
        let owner = {};
        if (reqData.startDate && reqData.endDate) {
            startDate = { "createdAt": { $gte: reqData.startDate } }
            endDate = { "createdAt": { $lte: reqData.endDate } }
        }
        if (reqData.owner_id) {
            owner = { "owner_id": reqData.owner_id }
        }
        if (loggedInUser.userType === 'owner') {
            owner = { "owner_id": loggedInUser._id }
        }
        result = await Order.aggregate([
            {
                $match: {
                    $and:
                        [
                            startDate,
                            endDate,
                            owner
                        ],
                }
            },
            {
                $project: {
                    _id: 1,
                    total: 1,
                    net_value: 1,
                    delivery_charge: 1,
                }
            },
            {
                $facet: {
                    stats: [
                        {
                            $group: {
                                _id: null,
                                orders: { $sum: 1 },
                                total: { $sum: '$total' },
                                net_value: { $sum: '$net_value' },
                                delivery_charge: { $sum: '$delivery_charge' },
                            }
                        }
                    ],
                },
            },
        ]);

        let obj = resPattern.successPattern(httpStatus.OK, { result }, 'success');
        return res.status(obj.code).json(obj);
    } catch (e) {
        return next(new APIError(e.message, httpStatus.BAD_REQUEST, true));
    }
}
// get order list.
const order_details = async (req, res, next) => {
    try {
        const loggedInUser = req.user;
        const reqData = req.body;
        const result = await Order
            .findById(mongoose.Types.ObjectId(reqData.order_id))
            .populate('client_id', '_id name email currencies profile_image address')
            .populate('owner_id', '_id name email currencies restaurant_Name restaurant_image address phone')
            .populate('status_history.status_from', '_id name profile_image')
            .populate('reviews_id', '-owners_id -client_id -orders_id')
        let obj = resPattern.successPattern(httpStatus.OK, [result], 'success');
        return res.status(obj.code).json(obj);
    } catch (e) {
        return next(new APIError(e.message, httpStatus.BAD_REQUEST, true));
    }
}
//Razor placeOrder order
const cash_placeOrder = async (req, res, next) => {
    try {
        const loggedInUser = req.user;
        let reqData = new Order(req.body);
        reqData.client_id = loggedInUser._id;
        reqData.last_status = 'Just Created';
        reqData.status_history = {
            status_from: loggedInUser._id,
            userType: loggedInUser.userType,
            status_message: 'Just Created'
        };

        const owner = await User.findById(reqData.owner_id, { _id: 1, fcm_registration_token: 1, language_preference: 1, currencies: 1, email: 1, restaurant_Name: 1 });


        reqData['total_vat'] = 0;
        // find vat value
        reqData['items'].forEach(async element => {
            element.menu_item_id.vat_value = parseFloat((((element.final_item_price / 100) * element.menu_item_id.vat_percentage) * element.menu_item_qty).toFixed(2));
            reqData['total_vat'] = reqData['total_vat'] + element.menu_item_id.vat_value;
            //  ------ update menu delivery count ------
            await Dish.findByIdAndUpdate(element.menu_item_id._id, {
                $inc: {
                    order_count: 1
                }
            }, { new: true })
        });
        //  ---- net value is only used to display at owner side the amount with and without taxes ----
        reqData['net_value'] = parseFloat((reqData['sub_total'] - reqData['total_vat']).toFixed(2));
        if (reqData['is_cod'] === true || reqData.delivery_type === 'Dine') {
            //  --- manage cash on delivery ---
            reqData['client_name'] = undefined;
            reqData['card_number'] = undefined;
            const order = await reqData.save();

            if (order) {
                // send response
                // --- send email of place order ---
                const email = loggedInUser.email;
                const payload = {
                    data: { owner, order, email },
                    template: "place_order",
                }

                await mail_template(payload);

                // --- Set notification body ---
                await place_order_notification(reqData, owner, order, loggedInUser)
                let obj = resPattern.successPattern(httpStatus.OK, order, 'success');
                return res.status(obj.code).json(obj);
            }
        }


    } catch (e) {
        console.log(e);
        return next(new APIError(e.message, httpStatus.BAD_REQUEST, true));
    }
}

const raz_placeOrder = async (req, res, next) => {
    try {
        const loggedInUser = req.user;
        let reqData = new Order(req.body);
        reqData.client_id = loggedInUser._id;
        reqData.last_status = 'Just Created';
        reqData.status_history = {
            status_from: loggedInUser._id,
            userType: loggedInUser.userType,
            status_message: 'Just Created'
        };

        const owner = await User.findById(reqData.owner_id, { _id: 1, fcm_registration_token: 1, language_preference: 1, currencies: 1, email: 1, restaurant_Name: 1 });


        reqData['total_vat'] = 0;
        // find vat value
        reqData['items'].forEach(async element => {
            element.menu_item_id.vat_value = parseFloat((((element.final_item_price / 100) * element.menu_item_id.vat_percentage) * element.menu_item_qty).toFixed(2));
            reqData['total_vat'] = reqData['total_vat'] + element.menu_item_id.vat_value;
            //  ------ update menu delivery count ------
            await Dish.findByIdAndUpdate(element.menu_item_id._id, {
                $inc: {
                    order_count: 1
                }
            }, { new: true })
        });
        //  ---- net value is only used to display at owner side the amount with and without taxes ----
        reqData['net_value'] = parseFloat((reqData['sub_total'] - reqData['total_vat']).toFixed(2));
        const owner_data = await User.findById(reqData.owner_id).select({
            _id: 0,
            restaurant_Name: 1,
            name: 1,
            raz_account_id: 1
        });
        const options = {
            amount: parseFloat((reqData.total * 100).toFixed(2)), // amount == Rs 10
            currency: "INR",
            receipt: "receipt#1",
            transfers: [
                {
                    account: owner_data.raz_account_id,
                    amount: parseFloat((reqData.total * 100).toFixed(2)),
                    currency: "INR",
                    notes: {
                        "branch": owner_data.restaurant_Name,
                        "name": owner_data.name
                    },
                    linked_account_notes: [
                        "branch"
                    ],
                    on_hold: 0,
                }],
            payment_capture: 1
            // 1 for automatic capture // 0 for manual capture
        };
        let order = undefined;
        const raz_account_id = owner_data.raz_account_id;
        const result = await create_order(options);
        if (result) {
            reqData.razorpay_order_id = result.id;
            order = await reqData.save();
        }

        if (result.status === 'created') {
            // send response
            // --- send email of place order ---
            const email = loggedInUser.email;
            const payload = {
                data: { owner, order, email },
                template: "place_order",
            }

            await mail_template(payload);

            // --- Set notification body ---
            await place_order_notification(reqData, owner, order, loggedInUser)


            let obj = resPattern.successPattern(httpStatus.OK, { order, raz_account_id }, 'success');
            return res.status(obj.code).json(obj);
        }
        if (result.statusCode === 400) {
            // send response
            return next(new APIError(order, httpStatus.BAD_REQUEST, true));
        }


    } catch (e) {
        console.log(e);
        return next(new APIError(e.message, httpStatus.BAD_REQUEST, true));
    }
}

//Stripe placeOrder order
const stripe_placeOrder = async (req, res, next) => {
    try {
        const loggedInUser = req.user;
        let reqData = new Order(req.body);
        reqData.client_id = loggedInUser._id;
        reqData.last_status = 'Just Created';
        reqData.status_history = {
            status_from: loggedInUser._id,
            userType: loggedInUser.userType,
            status_message: 'Just Created'
        };
        const owner = await User.findById(reqData.owner_id, { _id: 1, fcm_registration_token: 1, language_preference: 1, currencies: 1, email: 1, restaurant_Name: 1 });


        reqData['total_vat'] = 0;
        // find vat value
        reqData['items'].forEach(async element => {
            element.menu_item_id.vat_value = parseFloat((((element.final_item_price / 100) * element.menu_item_id.vat_percentage) * element.menu_item_qty).toFixed(2));
            reqData['total_vat'] = reqData['total_vat'] + element.menu_item_id.vat_value;
            //  ------ update menu delivery count ------
            await Dish.findByIdAndUpdate(element.menu_item_id._id, {
                $inc: {
                    order_count: 1
                }
            }, { new: true })
        });
        reqData['net_value'] = parseFloat((reqData['sub_total'] - reqData['total_vat']).toFixed(2));


        const owner_data = await User.findById(reqData.owner_id).select({
            _id: 0,
            restaurant_Name: 1,
            name: 1,
            is_stripe_connected: 1,
            stripe_account: 1
        });
        if (owner_data.is_stripe_connected) {
            const stripe_user_id = owner_data.stripe_account.stripe_user_id;
            const payment_data = {
                amount: loggedInUser.currencies.zero_decimal_currencies ? parseFloat((reqData.total).toFixed(0)) : parseFloat((reqData.total * 100).toFixed(0)),
                currency: loggedInUser.currencies.code ? loggedInUser.currencies.code : 'aud',
                email: loggedInUser.email,
            };
            const paymentIntent = await stripe_payintent(payment_data, stripe_user_id);
            if (paymentIntent) {
                reqData.stripe_payment_intent_id = paymentIntent.id;
                reqData.stripe_client_secret = paymentIntent.client_secret;
                order = await reqData.save();
            }

            // --- send email of place order ---
            const email = loggedInUser.email;
            const payload = {
                data: { owner, order, email },
                template: "place_order",
            }

            await mail_template(payload);

            // --- Set notification body ---
            await place_order_notification(reqData, owner, order, loggedInUser)

            let obj = resPattern.successPattern(httpStatus.OK, { payment_data, stripe_user_id, paymentIntent, order }, 'success');
            return res.status(obj.code).json(obj);
        }
        else {
            let obj = resPattern.errorPattern(httpStatus.BAD_REQUEST, "The stripe account in unavailable", 'failure');
            return res.status(obj.code).json(obj);
        }


    } catch (e) {
        console.log(e);
        return next(new APIError(e.message, httpStatus.BAD_REQUEST, true));
    }
}


//----------- razorpay responses----------

// -- payment capturing--
const razor_capture_payment = async (req, res, next) => {
    try {
        // const loggedInUser = req.user;
        const reqData = req.body;
        let order = await Order.findOne({ razorpay_order_id: reqData.payload.payment.entity.order_id });


        // -- to verify order (deprecated)---------
        const payment = await verify_raz_transfer(req);


        let result = undefined;

        if (payment == true) {
            order.razorpay_payment_id = reqData.payload.payment.entity.id;
            order.ispaid = true;
            result = await order.save();
        }
        if (payment == false) {
            return next(new APIError("wrong razorpay signature, payment unsuccessful", httpStatus.BAD_REQUEST, true));
        }

        if (result) {
            // send response
            let obj = resPattern.successPattern(httpStatus.OK, result, 'success');
            return res.status(obj.code).json(obj);
        }

    } catch (e) {
        console.log(e.message);
        return next(new APIError(e, httpStatus.BAD_REQUEST, true));
    }
}


// --razorpay transfer capturing --
const razor_capture_transfers = async (req, res, next) => {
    try {
        // const loggedInUser = req.user;

        let result = undefined;
        const reqData = req;
        // -- to verify transfer ------------------
        const payment = await verify_raz_transfer(reqData);

        if (payment == true) {
            const razorpay_order_id = reqData.body.payload.transfer.entity.source;
            let order = await Order.findOne({ razorpay_order_id: razorpay_order_id });
            order.razorpay_transfer_id = reqData.body.payload.transfer.entity.id;
            order.ispaid = true;
            result = await order.save();
        }
        if (payment == false) {
            return next(new APIError("wrong razorpay signature, payment unsuccessful", httpStatus.NOT_ACCEPTABLE, true));
        }

        if (result) {
            // send response
            let obj = resPattern.successPattern(httpStatus.CREATED, result, 'success');
            return res.status(obj.code).json(obj);
        }

    } catch (e) {
        console.log(e);
        return next(new APIError(e, httpStatus.BAD_REQUEST, true));
    }
}


//----------- stripe responses----------

// -- payment capturing--
const stripe_capture_payment = async (req, res, next) => {
    try {
        // const loggedInUser = req.user;
        const reqData = req.body;
        let result = undefined;
        // -- to verify order (deprecated)---------
        const webhook_result = await stripe_webhook_mgt(req, res, next);

        if (webhook_result.status === false) {
            return res.status(400).send(`Webhook Error:${webhook_result.message}`);
        }
        else {
            if (webhook_result.paymentIntent) {
                let order = await Order.findOne({ stripe_payment_intent_id: webhook_result.paymentIntent.id });
                order.stripe_payment_data.stripe_payment_status = reqData.type;
                order.stripe_payment_data.stripe_payment_receipt_url = webhook_result.paymentIntent.charges.data[0].receipt_url;
                order.ispaid = true;
                result = await order.save();
            }
            if (webhook_result.paymentMethod_payment_failed) {
                let order = await Order.findOne({ stripe_payment_intent_id: webhook_result.paymentMethod_payment_failed.id });
                order.stripe_payment_data.stripe_payment_status = reqData.type;
                order.stripe_payment_data.last_payment_error = webhook_result.paymentMethod_payment_failed.last_payment_error.message;
                result = await order.save();
            }

            return res.status(200).json({ received: true });
        }

    } catch (e) {
        console.log(e);
        console.log(e.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
        // return next(new APIError(e, httpStatus.BAD_REQUEST, true));
    }
}

// _new
// update order
const updateOrder = async (req, res, next) => {
    try {
        const loggedInUser = req.user;
        let reqData = req.body;

        let order = await Order.findOne({
            _id: mongoose.Types.ObjectId(reqData.order_id),
            status_history: {
                $not: { $elemMatch: { status_message: reqData['last_status'] } }
            }
        });

        if (order) {
            reqData.status_update = {
                status_from: loggedInUser._id,
                userType: loggedInUser.userType,
                status_message: reqData.last_status
            }
            if (reqData['last_status'] === 'Rejected by Restaurant' || reqData['last_status'] === 'Rejected by Admin' || reqData['last_status'] === 'served') {
                order['is_live'] = false;
            }
            if (reqData['last_status'] === 'Delivered' || order['razorpay_payment_id']) {
                order['ispaid'] = true;
            }
            if (req["prepare_time"]) {
                req["prepare_time"] = null;
            }


            let result = await Order.findOneAndUpdate({ _id: mongoose.Types.ObjectId(reqData.order_id) },
                {
                    $set: {
                        is_live: order['is_live'],
                        last_status: reqData["last_status"],
                        driver_id: reqData["driver_id"] ? reqData["driver_id"] : order["driver_id"],
                        ispaid: order['ispaid'],
                        prepare_time: order["prepare_time"] ? order["prepare_time"] : req["prepare_time"]
                    },
                    $addToSet: { status_history: [reqData.status_update] }
                }, { new: true }
            );

            if (result) {
                // send response   
                let driver = undefined;
                const client = await User.findById(result.client_id, {
                    name: 1,
                    profile_image: 1,
                    userType: 1,
                    language_preference: 1,
                    fcm_registration_token: 1
                })


                const owner = await User.findById(result.owner_id, {
                    restaurant_Name: 1,
                    restaurant_image: 1,
                    userType: 1,
                    language_preference: 1,
                    hosting_Address: 1,
                    fcm_registration_token: 1
                })

                const status = '$t(order_status.' + result.last_status + ')'
                if (client.fcm_registration_token && client.fcm_registration_token.length > 0) {
                    // ---interpolation translation of last status ----

                    // --- scenarios of sending notification to different user roles ---

                    // --- send notification from owner to client---
                    translate_meta.lan = client.language_preference;
                    translate_meta.key = 'update_notification.from_owner';
                    translate_meta.interpolation = {
                        status: status,
                        owner_name: owner.restaurant_Name
                    }
                    translate_meta.payload = {
                        tokens: client.fcm_registration_token,
                        headers: {
                            Order_Time: moment(result.Ordered_time).fromNow(),
                            Urgency: "high"
                        },
                        notification: {
                            title: undefined,
                            body: undefined,
                            image: owner.restaurant_image.image_url ? owner.restaurant_image.image_url : "https://appetizar.nyc3.digitaloceanspaces.com/1611482529889-undraw_cooking_lyxy.png"
                        },
                        data: {
                            owner_id: order.owner_id.toString(),
                            order_id: order._id.toString(),
                            order_status: order.last_status,
                            userType: "client"
                        },
                        link: `${'https://' + owner.hosting_Address + '/track-order'}`,
                    }
                    await i18_notification_translate(translate_meta, send_notification);
                }

                // ---- send notification to driver ---
                if (result.driver_id) {
                    driver = await User.findById(result.driver_id, {
                        name: 1,
                        profile_image: 1,
                        userType: 1,
                        language_preference: 1,
                        fcm_registration_token: 1
                    })
                    // --- send notification from owner ---
                    translate_meta.lan = driver.language_preference;
                    translate_meta.key = 'update_notification.from_owner';
                    translate_meta.interpolation = {
                        status: status,
                        owner_name: owner.restaurant_Name
                    }
                    translate_meta.payload = {
                        tokens: driver.fcm_registration_token,
                        headers: {
                            Order_Time: moment(result.Ordered_time).fromNow(),
                            Urgency: "high"
                        },
                        notification: {
                            title: undefined,
                            body: undefined,
                            image: owner.restaurant_image.image_url ? owner.restaurant_image.image_url : "https://appetizar.nyc3.digitaloceanspaces.com/1611482529889-undraw_cooking_lyxy.png"
                        },
                        data: {
                            owner_id: order.owner_id.toString(),
                            order_id: order._id.toString(),
                            order_status: order.last_status,
                            userType: "driver"
                        }
                    }
                    driver.fcm_registration_token && driver.fcm_registration_token.length > 0 && await i18_notification_translate(translate_meta, send_notification);
                }
                let obj = resPattern.successPattern(httpStatus.OK, result, 'success');
                return res.status(obj.code).json(obj);
            }
        } else {
            const result = "status is already updated to " + reqData["last_status"];
            let obj = resPattern.errorPattern(httpStatus.BAD_REQUEST, result, 'failure');
            return res.status(obj.code).json(obj);
        }

    } catch (e) {
        return next(new APIError(e.message, httpStatus.BAD_REQUEST, true));
    }
}
//  delivery request to aggregator's drivers
const delivery_request = async (req, res, next) => {
    try {
        const loggedInUser = req.user;
        let reqData = req.body;
        // --- can not set same delivery history twice ---
        let order = await Order.findOne({
            _id: mongoose.Types.ObjectId(reqData.order_id),
            delivery_history: {
                $not: { $elemMatch: { status_message: reqData['delivery_status'] } }
            }
        });
        // --- The Driver is already reserved ---
        if ((order && order['driver_id']) && (reqData['delivery_status'] !== 'Picked Up' && reqData['delivery_status'] !== 'Delivered')) {
            let error = {
                message: `The Driver is already reserved for order.${order['o_id']}`
            }
            throw error
        }

        // --- can not accept another delivery with driver having ongoing live order ---
        if (order && (reqData['delivery_status'] === 'Assigned to Driver' || reqData['delivery_status'] === 'Accepted by Driver')) {
            const live_order = await Order.findOne({ _id: { $ne: order._id }, driver_id: mongoose.Types.ObjectId(reqData.driver_id), delivery_status: { $nin: ["Delivered"] }, is_live: true })
            if (live_order) {
                error = { message: `The status for order with o_id: ${live_order.o_id} is not set to Delivered, can not accept another delivery with ongoing live order` }
                throw error
            }
        }

        if (order && (order['last_status'] !== 'Prepared' && (reqData['delivery_status'] === 'Picked Up' || reqData['delivery_status'] === 'Delivered'))) {
            error = { message: `Can not set delivery status to ${reqData['delivery_status']} till order is not prepared.` }
            throw error
        }

        if (order) {
            let client = await User.findById(order.client_id, {
                name: 1,
                profile_image: 1,
                userType: 1,
                language_preference: 1,
                fcm_registration_token: 1
            })
            let owner = await User.findById(order.owner_id, {
                restaurant_Name: 1,
                address: 1,
                userType: 1,
                aggregator_id: 1,
                use_driver_aggregator: 1,
                hosting_Address: 1,
                restaurant_image: 1,
                language_preference: 1,
                fcm_registration_token: 1
            })
            let driver = undefined;
            reqData.status_update = {
                status_from: loggedInUser._id,
                userType: loggedInUser.userType,
                status_message: reqData.delivery_status
            }

            let result = await Order.findOneAndUpdate({ _id: mongoose.Types.ObjectId(reqData.order_id) },
                {
                    $set: {
                        delivery_status: reqData["delivery_status"],
                        driver_id: reqData["driver_id"] ? reqData["driver_id"] : order["driver_id"],
                        aggregator_id: reqData["aggregator_id"] ? reqData["aggregator_id"] : order["aggregator_id"],
                        is_live: reqData["delivery_status"] === 'Delivered' ? false : true,
                    },
                    $addToSet: { delivery_history: [reqData.status_update] }
                }, { new: true }
            );
            // ---interpolation translation of last status ----
            const status = '$t(order_status.' + result.delivery_status + ')'
            if (result.driver_id && result.delivery_status === "Assigned to Driver") {
                driver = await User.findById(result.driver_id, {
                    name: 1,
                    profile_image: 1,
                    language_preference: 1,
                    userType: 1,
                    fcm_registration_token: 1
                })
                // ---- send notification to driver ----
                translate_meta.lan = driver.language_preference ? driver.language_preference : 'en';
                // send_driver_notification(loggedInUser, result);
                translate_meta.key = 'update_notification.to_driver';
                translate_meta.interpolation = {
                    status: status,
                    owner_name: owner.restaurant_Name,
                    client_name: client.name,
                    eta_lower_bound: moment(result.eta_lower_bound).format("hh:mm a"),
                    eta_upper_bound: moment(result.eta_upper_bound).format("hh:mm a"),
                }
                translate_meta.payload = {
                    tokens: driver.fcm_registration_token,
                    headers: {
                        Order_Time: moment(result.Ordered_time).fromNow(),
                        Urgency: "high"
                    },
                    notification: {
                        title: undefined,
                        body: undefined,
                        image: owner.restaurant_image.image_url ? owner.restaurant_image.image_url : "https://appetizar.nyc3.digitaloceanspaces.com/1611482529889-undraw_cooking_lyxy.png"
                    },
                    data: {
                        owner_id: order.owner_id.toString(),
                        order_id: order._id.toString(),
                        order_status: order.last_status,
                        userType: "driver"
                    }
                }
                driver.fcm_registration_token && driver.fcm_registration_token.length > 0 && await i18_notification_translate(translate_meta, send_notification);

                //  ---- send notification to client ---
                translate_meta.lan = client.language_preference ? client.language_preference : 'en';
                translate_meta.key = 'update_notification.about_driver';
                translate_meta.interpolation = {
                    status: status,
                    owner_name: owner.restaurant_Name,
                    driver_name: driver.name
                }
                translate_meta.payload = {
                    tokens: client.fcm_registration_token,
                    headers: {
                        Order_Time: moment(result.Ordered_time).fromNow(),
                        Urgency: "high"
                    },
                    notification: {
                        title: undefined,
                        body: undefined,
                        image: owner.restaurant_image.image_url ? owner.restaurant_image.image_url : "https://appetizar.nyc3.digitaloceanspaces.com/1611482529889-undraw_cooking_lyxy.png"
                    },
                    data: {
                        owner_id: order.owner_id.toString(),
                        order_id: order._id.toString(),
                        order_status: order.last_status,
                        userType: "client"
                    },
                    link: `${'https://' + owner.hosting_Address + '/track-order'}`,
                }
                result.delivery_type === "Deliver" && client.fcm_registration_token && client.fcm_registration_token.length > 0 && await i18_notification_translate(translate_meta, send_notification);
            }
            if (result.delivery_status === 'Broadcast to Drivers') {
                // send response
                // --- scenarios of sending notification to all drivers under aggregator or owner---
                const drivers = await User.find({ userType: "driver", employer_id: reqData.employer_id }, { name: 1, profile_image: 1, language_preference: 1, fcm_registration_token: 1 })
                let fcm_token = []

                await Promise.all(drivers.map(async driver => {
                    if (driver.fcm_registration_token && driver.fcm_registration_token.length > 0) {
                        fcm_token = [...fcm_token, ...driver.fcm_registration_token];
                    }
                }));
                // ---- send notification to driver ----
                translate_meta.lan = owner.language_preference ? owner.language_preference : 'en';
                // send_driver_notification(loggedInUser, result);
                translate_meta.key = 'update_notification.delivery_request';
                translate_meta.interpolation = {
                    status: status,
                    owner_name: owner.restaurant_Name,
                    client_name: client.name,
                    delivery_address: order.delivery_address,
                    package_address: owner.address[0]['user_address'],
                    package_landmark: owner.address[0]['landmark'],
                    eta_lower_bound: moment(result.eta_lower_bound).format("hh:mm a"),
                    eta_upper_bound: moment(result.eta_upper_bound).format("hh:mm a"),
                }
                translate_meta.payload = {
                    tokens: fcm_token,
                    headers: {
                        Order_Time: moment(result.Ordered_time).fromNow(),
                        Urgency: "high"
                    },
                    notification: {
                        title: undefined,
                        body: undefined,
                        image: owner.restaurant_image.image_url ? owner.restaurant_image.image_url : "https://appetizar.nyc3.digitaloceanspaces.com/1611482529889-undraw_cooking_lyxy.png"
                    },
                    data: {
                        owner_id: order.owner_id.toString(),
                        order_id: order._id.toString(),
                        order_status: order.last_status,
                        userType: "driver",
                    },
                }
                fcm_token && fcm_token.length > 0 && i18_notification_translate(translate_meta, send_notification);
            }
            if (result.delivery_status === 'Assigned to Aggregator') {
                const aggregator = await User.findById(owner.aggregator_id, {
                    restaurant_Name: 1,
                    address: 1,
                    aggregator_id: 1,
                    use_driver_aggregator: 1,
                    restaurant_image: 1,
                    language_preference: 1,
                    fcm_registration_token: 1
                })
                // ---- send notification to aggregator ----
                translate_meta.lan = owner.language_preference ? owner.language_preference : 'en';
                // send_driver_notification(loggedInUser, result);
                translate_meta.key = 'update_notification.aggregator_request';
                translate_meta.interpolation = {
                    status: status,
                    owner_name: owner.restaurant_Name,
                    client_name: client.name,
                    delivery_address: order.delivery_address,
                    package_address: owner.address[0]['user_address'],
                    package_landmark: owner.address[0]['landmark'],
                    eta_lower_bound: moment(result.eta_lower_bound).format("hh:mm a"),
                    eta_upper_bound: moment(result.eta_upper_bound).format("hh:mm a"),
                }
                translate_meta.payload = {
                    tokens: aggregator.fcm_registration_token,
                    headers: {
                        Order_Time: moment(result.Ordered_time).fromNow(),
                        Urgency: "high"
                    },
                    notification: {
                        title: undefined,
                        body: undefined,
                        image: owner.restaurant_image.image_url ? owner.restaurant_image.image_url : "https://appetizar.nyc3.digitaloceanspaces.com/1611482529889-undraw_cooking_lyxy.png"
                    },
                    data: {
                        owner_id: order.owner_id.toString(),
                        order_id: order._id.toString(),
                        order_status: order.last_status,
                        userType: "driver_aggregator",
                    },
                }
                aggregator.fcm_registration_token && aggregator.fcm_registration_token.length > 0 && i18_notification_translate(translate_meta, send_notification);
            }
            if ((loggedInUser.userType === 'driver' || loggedInUser.userType === 'owner') && (result.delivery_status === "Picked Up" || result.delivery_status === "Delivered" || result.delivery_status === "Accepted by Driver")) {
                //  ---- send notification from driver
                translate_meta.lan = client.language_preference ? client.language_preference : 'en';
                // ---if Accepted by Driver then send notification to owner and aggregator as well---

                translate_meta.key = 'update_notification.from_driver';
                translate_meta.interpolation = {
                    status: status,
                    driver_name: loggedInUser.name,
                }
                translate_meta.payload = {
                    tokens: client.fcm_registration_token,
                    headers: {
                        Order_Time: moment(result.Ordered_time).fromNow(),
                        Urgency: "high"
                    },
                    notification: {
                        title: undefined,
                        body: undefined,
                        image: loggedInUser.profile_image.image_url ? loggedInUser.profile_image.image_url : "https://appetizar.nyc3.digitaloceanspaces.com/1611483081429-driver.png"
                    },
                    data: {
                        owner_id: order.owner_id.toString(),
                        order_id: order._id.toString(),
                        order_status: order.last_status,
                        userType: "client"
                    },
                    link: `${'https://' + owner.hosting_Address + '/track-order'}`,
                }
                //  --- send notification to client ---
                result.delivery_type === "Deliver" && client.fcm_registration_token && client.fcm_registration_token.length > 0 && await i18_notification_translate(translate_meta, send_notification);

                //  --- send notification to owner ---
                translate_meta.payload.tokens = owner.fcm_registration_token;
                translate_meta.payload.data.userType = owner.userType;
                translate_meta.lan = owner.language_preference ? owner.language_preference : 'en';
                owner.fcm_registration_token && owner.fcm_registration_token.length > 0 && await i18_notification_translate(translate_meta, send_notification);

                if (result['aggregator_id']) {
                    let aggregator = undefined;
                    aggregator = await User.findById(order.aggregator_id, {
                        name: 1,
                        profile_image: 1,
                        userType: 1,
                        language_preference: 1,
                        fcm_registration_token: 1
                    })

                    //  --- send notification to aggregator ---
                    translate_meta.payload.tokens = aggregator.fcm_registration_token;
                    translate_meta.payload.data.userType = aggregator.userType;
                    translate_meta.lan = aggregator.language_preference ? aggregator.language_preference : 'en';
                    aggregator.fcm_registration_token && aggregator.fcm_registration_token.length > 0 && await i18_notification_translate(translate_meta, send_notification);
                }
            }
            let obj = resPattern.successPattern(httpStatus.OK, result, 'success');
            return res.status(obj.code).json(obj);
        } else {
            const result = "status is already updated to " + reqData["delivery_status"];
            let obj = resPattern.errorPattern(httpStatus.BAD_REQUEST, result, 'failure');
            return res.status(obj.code).json(obj);
        }

    } catch (e) {
        return next(new APIError(e.message, httpStatus.BAD_REQUEST, true));
    }
}


// cancel Order 
const cancelOrder = async (req, res, next) => {
    try {
        const loggedInUser = req.user;
        let reqData = req.body;
        reqData.client_id = loggedInUser._id
        let order = await Order.findOne({
            _id: mongoose.Types.ObjectId(reqData.order_id),
            status_history: {
                $not: { $elemMatch: { status_message: reqData['last_status'] } }
            }
        });
        if (!order) {
            let obj = resPattern.errorPattern(httpStatus.BAD_REQUEST, "No such order found, wrong order id.", 'failure');
            return res.status(obj.code).json(obj);
        }

        if ((order['is_live'] === true && reqData['last_status'] != 'Prepared')) {
            if (reqData['is_canceled'] === true && reqData['last_status'] === 'Canceled by Client') {
                order['is_live'] = false;
            }
            const owner = await User.findById(order.owner_id, { stripe_account: 1, fcm_registration_token: 1, language_preference: 1 });


            // order = reqData;
            reqData.status_update = {
                status_from: loggedInUser._id,
                userType: loggedInUser.userType,
                status_message: reqData.last_status
            }
            if (order.ispaid === true) {
                let obj = resPattern.errorPattern(httpStatus.BAD_REQUEST, "Can not cancel order as the payment has been made, please consider taking refund process", 'failure');
                return res.status(obj.code).json(obj);
            }
            let result = undefined;
            //  use with save function
            result = await Order.findOneAndUpdate({ _id: mongoose.Types.ObjectId(reqData.order_id) },
                {
                    $set: {
                        is_live: false,
                        is_canceled: reqData['is_canceled'],
                        last_status: reqData["last_status"],
                        // ispaid: order['ispaid'],
                        Order_cancel_time: reqData.Order_cancel_time,

                    },
                    $addToSet: { status_history: [reqData.status_update] }
                }, { new: true }
            );
            // send response to driver
            if (result.driver_id) {
                const driver = await User.findById(result.driver_id, { fcm_registration_token: 1, language_preference: 1 })
                await cancel_order_notification(result, driver)
            }
            // send response to aggregator
            if (result.aggregator_id) {
                const aggregator = await User.findById(result.aggregator_id, { fcm_registration_token: 1, language_preference: 1 })
                await cancel_order_notification(result, aggregator)
            }
            // send response to owner
            await cancel_order_notification(result, owner)
            let obj = resPattern.successPattern(httpStatus.OK, result, 'success');
            return res.status(obj.code).json(obj);
        }
        else {
            let obj = resPattern.errorPattern(httpStatus.BAD_REQUEST, "Can not cancel order with status except live", 'failure');
            return res.status(obj.code).json(obj);
        }


    } catch (e) {
        console.log(e);
        return next(new APIError(e.message, httpStatus.BAD_REQUEST, true));
    }
}


// refund stripe Order 
const stripe_refund_order = async (req, res, next) => {
    try {
        const loggedInUser = req.user;
        const reqData = req.body;
        reqData.client_id = loggedInUser._id
        let order = await Order.findOne({
            _id: mongoose.Types.ObjectId(reqData.order_id),
            status_history: {
                $not: { $elemMatch: { status_message: reqData['last_status'] } }
            }
        });
        if (!order) {
            let obj = resPattern.errorPattern(httpStatus.BAD_REQUEST, "No such order found, wrong order id.", 'failure');
            return res.status(obj.code).json(obj);
        }

        if (order.ispaid) {
            if ((order['is_live'] === true && reqData['last_status'] != 'Prepared') || (order['is_live'] === true && reqData['last_status'] != 'Picked Up')) {
                if (reqData['is_canceled'] === true && reqData['last_status'] === 'Canceled by Client') {
                    order['is_live'] = false;
                }
                const owner = await User.findById(order.owner_id, {
                    stripe_account: 1,
                    language_preference: 1,
                    fcm_registration_token: 1
                });
                let stripe_refund_reason = order.stripe_payment_intent_id ? order.stripe_payment_intent_id : undefined;
                order = reqData;
                reqData.status_update = {
                    status_from: loggedInUser._id,
                    userType: loggedInUser.userType,
                    status_message: reqData.last_status
                }
                if (stripe_refund_reason) {
                    stripe_refund_reason = await stripe_refund(stripe_refund_reason, owner);

                    let result = await Order.findOneAndUpdate({ _id: mongoose.Types.ObjectId(reqData.order_id) },
                        {
                            $set: {
                                is_live: false,
                                is_canceled: reqData['is_canceled'],
                                last_status: reqData["last_status"],
                                ispaid: order['ispaid'],
                                Order_cancel_time: reqData.Order_cancel_time,
                                stripe_payment_data: {
                                    stripe_payment_status: "stripe refund acknowledged",
                                    stripe_refund_reason: stripe_refund_reason.reason,
                                }

                            },
                            $addToSet: { status_history: [reqData.status_update] }
                        }, { new: true }
                    );
                    // send response to owner
                    await cancel_order_notification(result, owner)
                    // send response to driver
                    if (result.driver_id) {
                        const driver = await User.findById(result.driver_id, { fcm_registration_token: 1, language_preference: 1 })
                        await cancel_order_notification(result, driver)
                    }
                    // send response to aggregator           
                    if (result.aggregator_id) {
                        const aggregator = await User.findById(result.aggregator_id, { fcm_registration_token: 1, language_preference: 1 })
                        await cancel_order_notification(result, aggregator)
                    }

                    let obj = resPattern.successPattern(httpStatus.OK, result, 'success');
                    return res.status(obj.code).json(obj);
                }
                else {
                    let obj = resPattern.errorPattern(httpStatus.BAD_REQUEST, "Restaurant is not active to settle any transaction yet.", 'failure');
                    return res.status(obj.code).json(obj);
                }

            }
            else {
                let obj = resPattern.errorPattern(httpStatus.BAD_REQUEST, "Can not cancel order with status except \"live\"", 'failure');
                return res.status(obj.code).json(obj);
            }
        } else {
            let obj = resPattern.errorPattern(httpStatus.BAD_REQUEST, "No payment has been made yet. can not initiate refund process.", 'failure');
            return res.status(obj.code).json(obj);
        }

    } catch (e) {
        console.log(e);
        return next(new APIError(e.message, httpStatus.BAD_REQUEST, true));
    }
}

// refund razorpay Order 
const razorpay_refund_order = async (req, res, next) => {
    try {
        const loggedInUser = req.user;
        const reqData = req.body;
        reqData.client_id = loggedInUser._id
        let order = await Order.findOne({
            _id: mongoose.Types.ObjectId(reqData.order_id),
            status_history: {
                $not: { $elemMatch: { status_message: reqData['last_status'] } }
            }
        });
        if (!order) {
            let obj = resPattern.errorPattern(httpStatus.BAD_REQUEST, "No such order found, wrong order id.", 'failure');
            return res.status(obj.code).json(obj);
        }

        if (order.ispaid) {
            if ((order['is_live'] === true && reqData['last_status'] != 'Prepared')) {
                if (reqData['is_canceled'] === true && reqData['last_status'] === 'Canceled by Client') {
                    order['is_live'] = false;
                }

                const owner = await User.findById(order.owner_id, { stripe_account: 1, fcm_registration_token: 1, language_preference: 1 });
                let razor_refund_reason = order.razorpay_payment_id ? order.razorpay_payment_id : undefined;
                // order = reqData;
                reqData.status_update = {
                    status_from: loggedInUser._id,
                    userType: loggedInUser.userType,
                    status_message: reqData.last_status
                }
                if (razor_refund_reason) {
                    razor_refund_reason = await razor_refund(razor_refund_reason);
                    if (razor_refund_reason.status === 'processed') {
                        let result = await Order.findOneAndUpdate({ _id: mongoose.Types.ObjectId(reqData.order_id) },
                            {
                                $set: {
                                    is_live: false,
                                    is_canceled: reqData['is_canceled'],
                                    last_status: reqData["last_status"],
                                    Order_cancel_time: reqData.Order_cancel_time,
                                    razorpay_refund: {
                                        status: razor_refund_reason.status,
                                        reason: razor_refund_reason.notes.reason
                                    },
                                    // prepare_time: order["prepare_time"] ? order["prepare_time"] : req["prepare_time"]
                                },
                                $addToSet: { status_history: [reqData.status_update] }
                            }, { new: true }
                        );
                        // send response to owner
                        await cancel_order_notification(result, owner)
                        // send response to driver
                        if (result.driver_id) {
                            const driver = await User.findById(result.driver_id, { fcm_registration_token: 1, language_preference: 1 })
                            await cancel_order_notification(result, driver)
                        }
                        // send response to aggregator
                        if (result.aggregator_id) {
                            const aggregator = await User.findById(result.aggregator_id, { fcm_registration_token: 1, language_preference: 1 })
                            await cancel_order_notification(result, aggregator)
                        }
                        let obj = resPattern.successPattern(httpStatus.OK, result, 'success');
                        return res.status(obj.code).json(obj);
                    }
                    else {
                        let obj = resPattern.errorPattern(httpStatus.BAD_REQUEST, razor_refund_reason, 'failure');
                        return res.status(obj.code).json(obj);
                    }

                }
                else {
                    let obj = resPattern.errorPattern(httpStatus.BAD_REQUEST, "Restaurant is not active to settle any transaction yet.", 'failure');
                    return res.status(obj.code).json(obj);
                }

            }
            else {
                let obj = resPattern.errorPattern(httpStatus.BAD_REQUEST, "Can not cancel order with status except \"live\"", 'failure');
                return res.status(obj.code).json(obj);
            }
        } else {
            let obj = resPattern.errorPattern(httpStatus.BAD_REQUEST, "No payment has been made yet. can not initiate refund process.", 'failure');
            return res.status(obj.code).json(obj);
        }



    } catch (e) {
        console.log(e);
        return next(new APIError(e.message, httpStatus.BAD_REQUEST, true));
    }
}

//------------- orders reviews -------------

const addreviews = async (req, res, next) => {
    try {
        let reviewsData = req.body;
        const loggedInUser = req.user;
        reviewsData.client_id = loggedInUser._id;
        let reviews = undefined;
        const foundReviews = await Review.findOne({ orders_id: reviewsData.orders_id });
        //  ---- restaurant review management ----
        let owner = await User.findById(reviewsData.owners_id);
        const total_ratings = foundReviews ? (owner.restaurant_ratings * owner.total_reviews) + reviewsData.restaurant_ratings - foundReviews.restaurant_ratings : owner.restaurant_ratings + reviewsData.restaurant_ratings;
        const total_reviews = foundReviews ? owner.total_reviews : owner.total_reviews + 1;
        let rating = parseFloat(((total_ratings / total_reviews)).toFixed(2));
        owner.restaurant_ratings = rating;
        owner.total_reviews = total_reviews;
        await owner.save();
        //  --- Dish review management ---
        if (reviewsData['dish_review']) {
            await Promise.all(
                reviewsData['dish_review'].map(async (element, index) => {
                    let dish = await Dish.findById(element.dish_id);
                    const dish_ratings = foundReviews && foundReviews['dish_review'] ? (dish.dish_rating * dish.total_reviews) + element.dish_rating - foundReviews['dish_review'][index].dish_rating : dish.dish_rating + element.dish_rating;
                    const dish_reviews = foundReviews && foundReviews['dish_review'] ? dish.total_reviews : dish.total_reviews + 1
                    const dish_rating = parseFloat(((dish_ratings / dish_reviews)).toFixed(2));
                    dish.dish_rating = dish_rating;
                    dish.total_reviews = dish_reviews;
                    await dish.save();
                })
            )
        }
        if (foundReviews) {
            //  --- update review ---
            for (const key in reviewsData) {
                if (Object.hasOwnProperty.call(reviewsData, key)) {
                    foundReviews[key] = reviewsData[key];
                }
            }
            reviews = await foundReviews.save()
        } else {
            // --- add review ---
            const addreview = new Review(reviewsData);
            reviews = await addreview.save();
        }
        reviews && await Order.findByIdAndUpdate(reviews.orders_id, {
            $set: {
                reviews_id: reviews._id
            }
        })
        let obj = resPattern.successPattern(httpStatus.OK, reviews, 'success');
        return res.status(obj.code).json(obj);

    } catch (error) {
        console.log(error);
        return next(new APIError(error.message, httpStatus.BAD_REQUEST, true));
    }
}



const get_restaurant_reviews = async (req, res, next) => {
    try {
        const owners_id = mongoose.Types.ObjectId(req.body.ownerid)
        const getreviews = await Review.aggregate([
            {
                $lookup: {
                    from: "users",
                    let: { clientid: "$client_id", ownerid: "$owners_id" },
                    pipeline: [{
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ["$$ownerid", owners_id] },
                                    { $eq: ["$$clientid", "$_id"] },
                                ]
                            }
                        }
                    }],
                    as: "clientuser"
                }
            },
            { $unwind: "$clientuser" },
            {
                $project: {
                    "clientuser.name": 1,
                    "comments": 1,
                    "restaurant_ratings": 1,
                    "createdAt": 1
                }
            }
        ])
        const totalreviews = await Review.find({ owners_id: owners_id })
        const reviewlen = totalreviews.length
        let obj = resPattern.successPattern(httpStatus.OK, { reviews: getreviews, totalreviews: reviewlen }, 'success');
        return res.status(obj.code).json(obj);
    } catch (error) {
        console.log(error);
        return next(new APIError(error.message, httpStatus.BAD_REQUEST, true));
    }
}


const get_all_reviews_admin = async (req, res, next) => {
    try {

        const perpage = req.body.perpage ? parseInt(req.body.perpage) : 10
        const page = req.body.pageno ? req.body.pageno : 1;
        const owners_id = mongoose.Types.ObjectId(req.body.ownerid)
        const getreviews = await Review.aggregate([
            { $sort: { "_id": -1 } },
            {
                $lookup: {
                    from: "users",
                    let: { clientid: "$client_id", ownerid: "$owners_id" },
                    pipeline: [{
                        $match: {
                            $expr: {
                                $and: [
                                    // { $eq: ["$$ownerid", owners_id] },
                                    { $eq: ["$$clientid", "$_id"] },

                                ]
                            }
                        }
                    }],
                    as: "clientuser"
                }
            },

            { $unwind: "$clientuser" },
            {
                $project: {

                    "clientuser.name": 1,
                    "comments": 1,
                    "restaurant_ratings": 1,
                    "createdAt": 1
                }
            }
        ])
            .skip((page - 1) * perpage).limit(perpage).exec()


        const totalreviews = await Review.find({})
        const reviewlen = totalreviews.length
        let obj = resPattern.successPattern(httpStatus.OK, { reviews: getreviews, total: reviewlen, page: page }, 'success');
        return res.status(obj.code).json(obj);
    } catch (error) {
        console.log(error);
        return next(new APIError(error.message, httpStatus.BAD_REQUEST, true));
    }
}

const deletereviews = async (req, res, next) => {
    try {
        const reviewsid = req.params.review_id
        const deletereviews = await Review.findOneAndDelete({ _id: reviewsid })

        const perpage = req.body.perpage ? parseInt(req.body.perpage) : 10
        const page = req.body.pageno ? req.body.pageno : 1;
        const getreviews = await Review.aggregate([
            {
                $lookup: {
                    from: "users",
                    let: { clientid: "$client_id", ownerid: "$owners_id" },
                    pipeline: [{
                        $match: {
                            $expr: {
                                $and: [
                                    //      { $eq: ["$$ownerid", owners_id] },
                                    { $eq: ["$$clientid", "$_id"] },
                                ]
                            }
                        }
                    }],
                    as: "clientuser"
                }
            },
            { $unwind: "$clientuser" },
            {
                $project: {
                    "clientuser.name": 1,
                    "comments": 1,
                    "restaurant_ratings": 1,
                    "createdAt": 1
                }
            }
        ])
            .limit(perpage).skip((page - 1) * perpage).exec()
        const totalreviews = await Review.find({})
        let obj = resPattern.successPattern(httpStatus.OK, { reviews: getreviews, page: page, total: totalreviews.length }, 'success');
        return res.status(obj.code).json(obj);
    } catch (error) {
        console.log(error);
        return next(new APIError(error.message, httpStatus.BAD_REQUEST, true));
    }

}


module.exports = {
    cart_list,
    addtoCart,
    deleteCart,
    my_orders,
    client_live_orders,
    owner_live_orders,
    admin_live_orders,
    aggregator_live_orders,
    order_details,
    get_assoc_drivers,
    delete_drivers,
    fetch_orders,
    standBy_orders,
    ongoing_orders,

    addreviews,
    deletereviews,
    get_restaurant_reviews,
    get_all_reviews_admin,

    owner_dashboard,
    aggregator_dashboard,
    admin_dashboard,

    owner_finance,
    admin_finance,

    cash_placeOrder,

    raz_placeOrder,
    razor_capture_payment,
    razor_capture_transfers,
    razorpay_refund_order,

    stripe_placeOrder,
    stripe_capture_payment,
    stripe_refund_order,
    updateOrder,
    delivery_request,
    cancelOrder,
};
