const httpStatus = require('http-status');
const APIError = require('../helpers/APIError');
const resPattern = require('../helpers/resPattern');
const User = require('../model/user.model');
const City = require('../model/cities.model');
const Review = require("../model/reviews.model");
const Dish = require('../model/menu_items.model');
const MenuCategory = require('../model/menu_category.model');
const Cart = require('../model/cart.model');
const Order = require('../model/orders.model');
const mongoose = require('mongoose');
const moment = require('moment');
const { mail_template } = require('../helpers/sendEmail');
const { send_notification } = require('../helpers/fcm_notification');
const { create_order, verify_raz_transfer, razor_refund } = require('../helpers/razor.payment');
const { stripe_payintent, stripe_webhook_mgt, cancel_paymentIntent, stripe_refund } = require('../helpers/stripe.payment');
const { translate_meta, i18_notification_translate } = require('../helpers/i18n');
const {send_req} = require('../helpers/sendRequest')

//  ---- bulk dependencies ----

const faker = require('faker');
const _ = require('lodash');
const times = require('lodash/times');
const { address } = require('faker');

// ------ helper functions -------

/**
 * @param {mongoose.Model} DataModel mongoose model Schema 
 * @param {object} query js object for feeding into aggregator argument
 * @param {String} ref_key the reference key which needs to be collected from collection
 * @returns {mongoose.ObjectId[]} The array returning mongoDB ObjectId
 * @description This function will return array of the relevant ids from the database collection to use in generating random data with referencing mongodb referenced ids.
 */
const collective_ids = async (DataModel,query,ref_key)=> {
    const result = await DataModel.aggregate().match(query).group({
        _id: null,
        ids_array: { $push: `$${ref_key}` }
    })
    return result[0]['ids_array']
}

const url = "https://untitled-b2sp64kueh2z.runkit.sh/owners"


const add_users = async (req, res, next) => {
    try {
        const reqData = req.body;

        const password = await new User().encryptPassword('123');
        const generate_user = () => {
            let userType = faker.random.arrayElement(['client', 'owner', 'driver_aggregator'])
            switch (userType) {
                case "client":
                    return {
                        "name": faker.name.findName(),
                        "email": faker.internet.exampleEmail(),
                        "password": password,
                        "userType": userType,
                        "dial_code": faker.random.arrayElement(['+91', '+61']),
                        "country_code": faker.random.arrayElement(['au', 'in']),
                        "country_name": faker.address.country(),
                        "phone": faker.phone.phoneNumberFormat(),
                        "user_languages": [
                            {
                                "iso639_1": "en",
                                "iso639_2": "eng",
                                "name": "English",
                                "nativeName": "English"
                            }
                        ],
                        "currencies": {
                            "code": "aud",
                            "curr_name": "Australian Dollar",
                            "symbol": "$"
                        }
                    }
                    // )
                    break;
                case "owner":
                    return {
                        "name": faker.name.findName(),
                        "restaurant_Name": faker.company.companyName(),
                        "email": faker.internet.exampleEmail(),
                        "password": password,
                        "userType": userType,
                        "dial_code": faker.random.arrayElement(['+91', '+61']),
                        "country_code": faker.random.arrayElement(['au', 'in']),
                        "country_name": faker.address.country(),
                        "phone": faker.phone.phoneNumberFormat(),
                        "user_languages": [
                            {
                                "iso639_1": "en",
                                "iso639_2": "eng",
                                "name": "English",
                                "nativeName": "English"
                            }
                        ],
                        "currencies": {
                            "code": "aud",
                            "curr_name": "Australian Dollar",
                            "symbol": "$"
                        }
                    }
                    // )
                    break;
                case "driver_aggregator":
                    return {
                        "name": faker.name.findName(),
                        "email": faker.internet.exampleEmail(),
                        "password": password,
                        "userType": userType,
                        "dial_code": faker.random.arrayElement(['+91', '+61']),
                        "country_code": faker.random.arrayElement(['au', 'in']),
                        "country_name": faker.address.country(),
                        "phone": faker.phone.phoneNumberFormat(),
                        "user_languages": [
                            {
                                "iso639_1": "en",
                                "iso639_2": "eng",
                                "name": "English",
                                "nativeName": "English"
                            }
                        ],
                        "currencies": {
                            "code": "aud",
                            "curr_name": "Australian Dollar",
                            "symbol": "$"
                        }
                    }
                    // )
                    break;
                default:
                    break;
            }
        }

        let users = [];
        // times(reqData.count, () => { users.push(generate_user()); })

        Promise.all([times(reqData.count, () => { users.push(generate_user()); }),User.insertMany(users)])
        .then(async (result) =>{
            
           await send_req(url,{"documents created":result[0].length,"documents":await User.countDocuments()})
        }).catch(async (err)=>{
            console.log(err.message);
            await send_req(url,{message:err.message})
        });
        let obj = resPattern.successPattern(httpStatus.OK, {message:`process started. you can see the result at : https://untitled-b2sp64kueh2z.runkit.sh`}, 'success');
        return res.status(obj.code).json(obj);
    } catch (e) {
        return next(new APIError(e.message, httpStatus.BAD_REQUEST, true));
    }
}

// console.log(faker.address());
const add_city = async (req, res, next) => {
    try {
        const reqData = req.body;
        const generate_city = () => {
            const city = faker.address.city();
            const abbr = city.match(/\b([A-Z])/g).join('');
            return {
                "city_image":
                {
                    "image_url": faker.image.city(),
                    "image_name": city + ".jpg"
                },
                "city_name": city,
                "short_code": abbr,
                "country_name": faker.address.country(),
                "state": faker.address.state()
            }
        }
        let cities = [];
        // times(reqData.count, () => { cities.push(generate_city()); })
        Promise.all([times(reqData.count, () => { cities.push(generate_city()); }),City.insertMany(cities)])
        .then(async (result) =>{
           await send_req(url,{"documents created":result[0].length,"documents":await City.countDocuments()})
        }).catch(async (err)=>{
            console.log(err.message);
            await send_req(url,{message:err.message})
        });
        let obj = resPattern.successPattern(httpStatus.OK, {message:`process started. you can see the result at : https://untitled-b2sp64kueh2z.runkit.sh`}, 'success');
        return res.status(obj.code).json(obj);
    } catch (e) {
        return next(new APIError(e.message, httpStatus.BAD_REQUEST, true));
    }
}

// console.log(faker.address());
const add_menu_categories = async (req, res, next) => {
    try {
        const reqData = req.body;
        const query = { userType: "owner" };
        const owners_id = await collective_ids(User,query,"_id");

        const generate_menuCategories = () => {
            return {
                "category_image":
                {
                    "image_name": faker.lorem.word()+'.jpg',
                    "image_url": faker.image.food(320,240)
                },
                "owner_id": faker.random.arrayElement(owners_id),
                "category": faker.lorem.word(),
            }
        }
        let menuCategories = [];
        // times(reqData.count, () => { menuCategories.push(generate_menuCategories()); })
        Promise.all([times(reqData.count, () => { menuCategories.push(generate_menuCategories()); }),MenuCategory.insertMany(menuCategories)])
        .then(async (result) =>{
           await send_req(url,{"documents created":result[0].length,"documents":await MenuCategory.countDocuments()})
        }).catch(async (err)=>{
            console.log(err.message);
            await send_req(url,{message:err.message})
        });
        let obj = resPattern.successPattern(httpStatus.OK, {message:`process started. you can see the result at : https://untitled-b2sp64kueh2z.runkit.sh`}, 'success');
        return res.status(obj.code).json(obj);
    } catch (e) {
        return next(new APIError(e.message, httpStatus.BAD_REQUEST, true));
    }
}

const add_menus = async (req, res, next) => {
    try {
        const reqData = req.body;
        let query = { };
        const menuCategories_id = await collective_ids(MenuCategory,query,"_id");
        query = { userType: "owner" };
        const owners_id = await collective_ids(User,query,"_id");
        const generate_menus = () => {
            return {
                "item_image":
                {
                    "image_name": faker.lorem.word()+'.jpg',
                    "image_url": faker.image.food(320,240)
                },
                "owner_id": faker.random.arrayElement(owners_id),
                "menu_category_id": faker.random.arrayElement(menuCategories_id),
                "category": faker.lorem.word(),
                "item_name": faker.lorem.word(),
                "item_description": faker.commerce.productDescription(),
                "item_price": faker.commerce.price(),
                "vat_percentage": 5,
                "item_available": true,
                "enable_variants": false,
            }
        }
        let menus = [];
        // times(reqData.count, () => { menus.push(generate_menus()); })
        Promise.all([times(reqData.count, () => { menus.push(generate_menus()); }),Dish.insertMany(menus)])
        .then(async (result) =>{
           await send_req(url,{"documents created":result[0].length,"documents":await Dish.countDocuments()})
        }).catch(async (err)=>{
            console.log(err.message);
            await send_req(url,{message:err.message})
        });
        let obj = resPattern.successPattern(httpStatus.OK, {message:`process started. you can see the result at : https://untitled-b2sp64kueh2z.runkit.sh`}, 'success');
        return res.status(obj.code).json(obj);
    } catch (e) {
        return next(new APIError(e.message, httpStatus.BAD_REQUEST, true));
    }
}

// console.log(faker.address.streetAddress(true));

const add_orders = async (req, res, next) => {
    try {
        const reqData = req.body;
        let query = { };
        const menuCategories_id = await collective_ids(MenuCategory,{},"_id");
        const owners_id = await collective_ids(User,{ userType: "owner" },"_id");
        const clients_id = await collective_ids(User,{ userType: "client" },"_id");
        const owner_id = faker.random.arrayElement(owners_id);
        const client_id = faker.random.arrayElement(clients_id);
        // const driver_id = await collective_ids(User,{ userType: "driver" },"_id");
        // const aggregator_id = await collective_ids(User,{ userType: "driver" },"_id");
        const amount = faker.commerce.price();
        const generate_menus = () => {
            return {
                "owner_id": owner_id,
                "client_id": client_id,
                // "driver_id": faker.random.arrayElement(driver_id),
                // "aggregator_id": faker.random.arrayElement(aggregator_id),
                "items":[{
                    "final_item_price":100,
                    "menu_item_id":{
                        "item_name":faker.commerce.productName(),
                        "item_price":100,
                        "vat_percentage":5,
                        "vat_value":5,
                    },
                    "menu_item_qty":1,
                }],
                "sub_total":100,
                "total":100,
                "total_vat":5,
                "net_value":95,
                "delivery_type":"Deliver",
                "is_live":true,
                "is_canceled":false,
                "is_cod":true,
                "owner_usage_charged":true,
                "Ordered_time":new Date(),
                "eta_upper_bound":moment().add(30, 'm').toDate(),
                "eta_lower_bound":moment().add(60, 'm').toDate(),
                "delivery_address":faker.address.streetAddress(true),
                "comment":"",
                "delivery_status":"Pending",
                "last_status":"Just Created",
                "status_history":[{
                    "status_message":"Just Created",
                    "status_from":"Just Created",
                    "userType":client_id,

                }],
                "delivery_status":"Just Created",
            }
        }
        let menus = [];
        // times(reqData.count, () => { menus.push(generate_menus()); })
        Promise.all([times(reqData.count, () => { menus.push(generate_menus()); }),Order.insertMany(menus)])
        .then(async (result) =>{
           await send_req(url,{"documents created":result[0].length,"documents":await Order.countDocuments()})
        }).catch(async (err)=>{
            console.log(err.message);
            await send_req(url,{message:err.message})
        });
        let obj = resPattern.successPattern(httpStatus.OK, {message:`process started. you can see the result at : https://untitled-b2sp64kueh2z.runkit.sh`}, 'success');
        return res.status(obj.code).json(obj);
    } catch (e) {
        return next(new APIError(e.message, httpStatus.BAD_REQUEST, true));
    }
}

module.exports = {
    add_users,
    add_city,
    add_menu_categories,
    add_menus,
    add_orders
}

