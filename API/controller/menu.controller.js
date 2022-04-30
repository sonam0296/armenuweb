const httpStatus = require('http-status');
const APIError = require('../helpers/APIError');
const resPattern = require('../helpers/resPattern');
const MenuCategory = require('../model/menu_category.model');
const Dish = require('../model/menu_items.model')
const Variant_OP = require('../model/variant_options.model');
const Variant = require('../model/variants.model');
const Extras = require('../model/extras.model');
const User = require('../model/user.model');
const mongoose = require('mongoose');


// get menu profile.
const menu_list = async (req, res, next) => {
    try {
        const reqData = req.body;
        const menus = await MenuCategory.aggregate([
            {
                $match: { owner_id: mongoose.Types.ObjectId(reqData.owner_id) }
            },
            {
                $lookup: {
                    from: 'menus',
                    localField: '_id',
                    foreignField: 'menu_category_id',
                    as: 'Dish_List'
                }
            }
        ])

        let obj = resPattern.successPattern(httpStatus.OK, menus, 'success');
        return res.status(obj.code).json(obj);
    } catch (e) {
        return next(new APIError(e.message, httpStatus.BAD_REQUEST, true));
    }
}

// --------get dish details-----------
const dishDetails = async (req, res, next) => {
    const reqData = req.body;
    const dish = await Dish.findById(mongoose.Types.ObjectId(reqData.dish_id)).select('-outlets')
    const variants = await getVariant(req, res, next);

    const variant_op = await getVariantOP(req, res, next);

    const extras = await getExtras(req, res, next);

    if (dish) {
        let obj = resPattern.successPattern(httpStatus.OK, { dish, variants, extras, variant_op }, 'success');
        return res.status(obj.code).json(obj);
    }
    else {
        let obj = resPattern.errorPattern(httpStatus.BAD_REQUEST, "No such dish exist", 'failure');
        return res.status(obj.code).json(obj);
    }
}


// add menu profile
const addMenu = async (req, res, next) => {
    try {
        const loggedInUser = req.user;
        let reqData = new MenuCategory(req.body);
        if (Object.keys(req.files).length > 0) {
            const file = req.files;
            reqData.category_image.image_name = file.category_image[0].originalname;
            reqData.category_image.image_url = file.category_image[0].location;
        }
        reqData.owner_id = loggedInUser._id;
        //  use with save function

        const result = await reqData.save();
        let obj = resPattern.successPattern(httpStatus.OK, result, 'success');
        return res.status(obj.code).json(obj);
        // }
    } catch (e) {
        return next(new APIError(e.message, httpStatus.BAD_REQUEST, true));
    }
}

// update menu profile
const updateMenu = async (req, res, next) => {
    try {
        const loggedInUser = req.user;
        const reqData = req.body;
        const target_menu = await MenuCategory.findById(mongoose.Types.ObjectId(reqData.category_id));
        console.log('menu category ', target_menu);
        if (Object.keys(req.files).length > 0) {
            const file = JSON.parse(JSON.stringify(req.files));
            reqData.category_image = {
                image_name: file.category_image[0].originalname,
                image_url: file.category_image[0].location
            }
            reqData.category_image.image_name = file.category_image[0].originalname;
            reqData.category_image.image_url = file.category_image[0].location;
        }
        const result = await MenuCategory.findByIdAndUpdate(reqData.category_id, {
            $set: {
                category: reqData.category,
                category_image: {
                    image_name: reqData.category_image ? reqData.category_image.image_name : target_menu.category_image.image_name,
                    image_url: reqData.category_image ? reqData.category_image.image_url : target_menu.category_image.image_url,
                },
            }
        }, { new: true });
        //  use with save function
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
const deleteMenu = async (req, res, next) => {
    try {
        const user = req.user;

        // find and update user
        const menu = await MenuCategory.findOneAndDelete({ owner_id: user._id });
        const menu_items = await MenuCategory.deleteMany({ owner_id: user._id });

        // verify delete
        if (!menu || !menu_items) {
            const message = `Dish not found with Id: '${owner_id}'.`;
            return next(new APIError(message, httpStatus.NOT_FOUND, true));
        }

        // send response
        const response = { message: 'Dish deleted.' };
        let obj = resPattern.successPattern(httpStatus.OK, response, 'success');
        return res.status(obj.code).json(obj);
    } catch (e) {
        console.log(e);
        return next(new APIError(e.message, httpStatus.BAD_REQUEST, true));
    }
}


// add variants op
const addVariantOP = async (req, res, next) => {
    try {
        const loggedInUser = req.user;
        // const item = new Dish();
        const reqData = req.body;
        let variant_OP = new Variant_OP(req.body);
        variant_OP.dish_id = mongoose.Types.ObjectId(reqData.dish_id);
        variant_OP.owner_id = mongoose.Types.ObjectId(loggedInUser._id);
        variant_OP.option_name = variant_OP.option_name.toLowerCase();
        const variant_op_hunt = await Variant_OP.findOne(
            {
                dish_id: variant_OP.dish_id,
                option_name: variant_OP.option_name
            }
        );
        if (!variant_op_hunt) {
            const result = await variant_OP.save()
            if (result) {
                // send response
                let obj = resPattern.successPattern(httpStatus.OK, result, 'success');
                return res.status(obj.code).json(obj);
            }
        } else {
            result = 'The variant option already exist with name: ' + variant_OP.option_name
            let obj = resPattern.errorPattern(httpStatus.BAD_REQUEST, result, 'failure');
            return res.status(obj.code).json(obj);
        }

    } catch (e) {
        return next(new APIError(e.message, httpStatus.BAD_REQUEST, true));
    }
}


// update variants op
const updateVariantOP = async (req, res, next) => {
    try {
        const loggedInUser = req.user;
        const reqData = req.body;
        let variant_OP = new Variant_OP(req.body);
        variant_OP.dish_id = mongoose.Types.ObjectId(reqData.dish_id);
        variant_OP.owner_id = mongoose.Types.ObjectId(loggedInUser._id);
        variant_OP.option_name = variant_OP.option_name.toLowerCase();
        const variant_op_hunt = await Variant_OP.findOne(
            {
                dish_id: variant_OP.dish_id,
                option_name: variant_OP.option_name
            }
        );
        if (!variant_op_hunt) {
            let result = await Variant_OP.findByIdAndUpdate(mongoose.Types.ObjectId(reqData.variant_op_id), {
                option_name: variant_OP.option_name,
                // option_values: reqData.option_values
            }, { new: true })
            req.body = {
                dish_id: result.dish_id
            }
            if (result) {
                // send response
                result = await dishDetails(req, res, next);
            }
        } else {
            result = 'The variant option already exist with name: ' + variant_OP.option_name
            let obj = resPattern.errorPattern(httpStatus.BAD_REQUEST, result, 'failure');
            return res.status(obj.code).json(obj);
        }

    } catch (e) {
        return next(new APIError(e.message, httpStatus.BAD_REQUEST, true));
    }
}

// delete variants op
const deleteVariantOP = async (req, res, next) => {
    try {
        const loggedInUser = req.user;
        const variant_op_id = req.params.variant_op_id;
        let result = await Variant_OP.findByIdAndDelete(mongoose.Types.ObjectId(variant_op_id))
        req.body = {
            dish_id: result.dish_id
        }
        if (result) {
            await Variant.deleteMany({ variant_op_id: mongoose.Types.ObjectId(variant_op_id) })
        }
        if (result) {
            result = await dishDetails(req, res, next);
        }
    } catch (e) {
        return next(new APIError(e.message, httpStatus.BAD_REQUEST, true));
    }
}

// get variants op
const getVariantOP = async (req, res, next) => {
    try {
        const loggedInUser = req.user;
        const reqData = req.body;

        let result = undefined;
        if (reqData.variant_op_id) {
            result = await Variant_OP.aggregate([
                {
                    $match:
                    {
                        $and: [
                            { _id: mongoose.Types.ObjectId(reqData.variant_op_id) },
                            { dish_id: mongoose.Types.ObjectId(reqData.dish_id) },
                        ]
                    }
                },
                {
                    $group: {
                        _id: "$dish_id",
                        variant_options: { "$push": "$$ROOT" }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        dish_id: "$_id",
                        variant_options: "$variant_options"
                    }
                }

            ])
        } else {
            result = await Variant_OP.aggregate([
                { $match: { dish_id: mongoose.Types.ObjectId(reqData.dish_id) } },
                {
                    $project: {
                        _id: 1,
                        option_name: 1,
                        dish_id: 1
                    }
                },
                {
                    $group: {
                        _id: "$dish_id",
                        variant_options: { "$push": "$$ROOT" }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        dish_id: "$_id",
                        variant_options: "$variant_options"
                    }
                }

            ])
        }

        if (result) {
            result = result[0];
            return result;
        }
    } catch (e) {
        return next(new APIError(e.message, httpStatus.BAD_REQUEST, true));
    }
}

// add variants 
const addVariant = async (req, res, next) => {
    try {
        const loggedInUser = req.user;

        const reqData = req.body;
        let variant = new Variant(req.body);
        variant.dish_id = mongoose.Types.ObjectId(reqData.dish_id);
        variant.variant_op_id = mongoose.Types.ObjectId(reqData.variant_op_id);
        variant.owner_id = mongoose.Types.ObjectId(loggedInUser._id);
        variant.variant_name = variant.variant_name.toLowerCase();
        const variant_hunt = await Variant.findOne({
            dish_id: variant.dish_id,
            variant_name: variant.variant_name
        })
        if (variant_hunt) {
            // send response
            let message = "The variant name " + variant.variant_name + " already exist."
            let obj = resPattern.errorPattern(httpStatus.BAD_REQUEST, message, 'failure');
            return res.status(obj.code).json(obj);
        } else {
            const result = await variant.save()
            if (result) {

                req.body.variant_op_id = null
                const getdish = await dishDetails(req, res, next)
            }
        }

    } catch (e) {
        return next(new APIError(e.message, httpStatus.BAD_REQUEST, true));
    }
}

// update variants 
const updateVariant = async (req, res, next) => {
    try {
        const loggedInUser = req.user;
        const reqData = req.body;
        let variant = new Variant(req.body);
        variant.dish_id = mongoose.Types.ObjectId(reqData.dish_id);
        variant.variant_op_id = mongoose.Types.ObjectId(reqData.variant_op_id);
        variant.variant_id = mongoose.Types.ObjectId(reqData.variant_id);
        variant.owner_id = mongoose.Types.ObjectId(loggedInUser._id);
        variant.variant_name = variant.variant_name.toLowerCase();

        const variant_hunt = await Variant.findOne({
            dish_id: variant.dish_id,
            variant_op_id: variant.variant_op_id,
            variant_name: variant.variant_name
        })

        if (variant_hunt) {
            if (variant_hunt.variant_name === variant.variant_name && variant_hunt._id.toString() === variant.variant_id.toString()) {
                // send response
                let result = await Variant.findByIdAndUpdate(mongoose.Types.ObjectId(reqData.variant_id), {

                    price: req.body.price,
                }, { new: true })

                req.body = {
                    dish_id: result.dish_id
                }
                if (result) {
                    // send response
                    result = await dishDetails(req, res, next);
                }
            }
            else {

                let message = "The variant name " + variant.variant_name + " already exist."
                let obj = resPattern.errorPattern(httpStatus.BAD_REQUEST, message, 'failure');
                return res.status(obj.code).json(obj);
            }
        }
        else {
            let result = await Variant.findByIdAndUpdate(mongoose.Types.ObjectId(reqData.variant_id), {

                price: req.body.price,
                variant_name: req.body.variant_name
            }, { new: true })

            req.body = {
                dish_id: result.dish_id
            }
            if (result) {
                // send response
                result = await dishDetails(req, res, next);
                let obj = resPattern.successPattern(httpStatus.OK, result, 'success');
                return res.status(obj.code).json(obj);
            }
        }

    } catch (e) {
        return next(new APIError(e.message, httpStatus.BAD_REQUEST, true));
    }
}

// delete variants 
const deleteVariant = async (req, res, next) => {
    try {

        const loggedInUser = req.user;
        const variant_id = req.params.variant_id;

        const variant_op_id = req.body.variant_op_id

        let variant = await Variant.findByIdAndDelete(mongoose.Types.ObjectId(variant_id))

        req.body = {
            dish_id: variant.dish_id
        }
        if (variant) {
            // send response
            variant = await dishDetails(req, res, next);
        }
    } catch (e) {
        return next(new APIError(e.message, httpStatus.BAD_REQUEST, true));
    }
}

const getVariant_req = async (req, res, next) => {
    try {
        const result = await getVariant(req, res, next);
        if (result) {
            // send response
            let obj = resPattern.successPattern(httpStatus.OK, result, 'success');
            return res.status(obj.code).json(obj);
        }
    } catch (e) {
        return next(new APIError(e.message, httpStatus.BAD_REQUEST, true));
    }
}

const getVariantOP_req = async (req, res, next) => {
    try {
        const result = await getVariantOP(req, res, next);
        if (result) {
            // send response
            let obj = resPattern.successPattern(httpStatus.OK, result, 'success');
            return res.status(obj.code).json(obj);
        }
    } catch (e) {
        return next(new APIError(e.message, httpStatus.BAD_REQUEST, true));
    }
}

// get variants 
const getVariant = async (req, res, next) => {
    try {
        const loggedInUser = req.user;
        let reqData = req.body;
        let result = undefined;
        if (reqData.variant_op_id) {
            let variant_op_id = {
                _id: mongoose.Types.ObjectId(reqData.variant_op_id)
            }
            result = await Variant_OP.aggregate([
                {
                    $match:
                    {
                        $and: [
                            { dish_id: mongoose.Types.ObjectId(reqData.dish_id) },
                            variant_op_id,
                        ]
                    }
                },
                {
                    $lookup: {
                        from: 'variants',
                        let: { "variant_op_id": "$_id" },
                        pipeline: [
                            {
                                "$match":
                                {
                                    "$expr": { "$eq": ["$variant_op_id", "$$variant_op_id"] }
                                }
                            },
                            {
                                "$project": {
                                    'variant_name': 1,
                                    'price': 1,
                                },
                            }
                        ],
                        as: 'variants'
                    }
                },
                { $unwind: "$variants" },
                {
                    $group: {
                        _id: '$_id',
                        option_name: { $first: '$option_name' },
                        variants: { $push: '$variants' }
                    }
                }
            ])
        }
        else if (reqData.variant_id) {
            let variant_id = {
                _id: mongoose.Types.ObjectId(reqData.variant_id)
            }
            result = await Variant.findById(mongoose.Types.ObjectId(reqData.variant_id));
        }
        else {
            result = await Variant_OP.aggregate([
                {
                    $match:
                    {
                        $and: [
                            { dish_id: mongoose.Types.ObjectId(reqData.dish_id) },
                            // variant_id,
                        ]
                    }
                },
                {
                    $lookup: {
                        from: 'variants',
                        let: { "variant_op_id": "$_id" },
                        pipeline: [
                            {
                                "$match":
                                {
                                    "$expr": { "$eq": ["$variant_op_id", "$$variant_op_id"] }
                                }
                            },
                            {
                                "$project": {
                                    'variant_name': 1,
                                    'price': 1,
                                },
                            }
                        ],
                        as: 'variants'
                    }
                },
                { $unwind: "$variants" },
                {
                    $group: {
                        _id: '$_id',
                        option_name: { $first: '$option_name' },
                        variants: { $push: '$variants' }
                    }
                },
                {
                    $sort: {
                        _id: 1
                    }
                }
            ])
        }

        if (result) {
            return result;
        }
    } catch (e) {
        return next(new APIError(e.message, httpStatus.BAD_REQUEST, true));
    }
}

// add Extras
const addExtras = async (req, res, next) => {
    try {
        const loggedInUser = req.user;

        const reqData = req.body;

        let extras = new Extras(req.body);
        extras.dish_id = mongoose.Types.ObjectId(reqData.dish_id);
        extras.owner_id = mongoose.Types.ObjectId(loggedInUser._id);

        const extras_hunt = await Extras.findOne(
            {
                dish_id: reqData.dish_id,
                extras_name: reqData.extras_name
            }
        )
        if (!extras_hunt) {
            const result = await extras.save();
            if (result) {
                // send response
                let obj = resPattern.successPattern(httpStatus.OK, result, 'success');
                return res.status(obj.code).json(obj);
            }
        } else {
            result = "The extras name with " + reqData.extras_name + " already exist."
            let obj = resPattern.errorPattern(httpStatus.BAD_REQUEST, result, 'failure');
            return res.status(obj.code).json(obj);
        }

    } catch (e) {
        return next(new APIError(e.message, httpStatus.BAD_REQUEST, true));
    }
}


// update Extras 
const updateExtras = async (req, res, next) => {
    try {
        const loggedInUser = req.user;
        const reqData = req.body;
        let extras = new Extras(req.body);
        extras.dish_id = mongoose.Types.ObjectId(reqData.dish_id);
        extras.extras_id = mongoose.Types.ObjectId(reqData.extras_id);
        extras.owner_id = mongoose.Types.ObjectId(loggedInUser._id);

        const extras_hunt = await Extras.findOne(
            {
                dish_id: reqData.dish_id,
                extras_name: reqData.extras_name
            }
        )
        if (!extras_hunt || extras_hunt._id.toString() === extras.extras_id.toString()) {
            let result = await Extras.findByIdAndUpdate(extras.extras_id, {
                price: req.body.price,
                extras_name: req.body.extras_name,
                variants: req.body.variants
            }, { new: true })

            req.body = {
                dish_id: result.dish_id
            }
            if (result) {
                // send response
                req.body.variant_op_id = null
                const getdish = await dishDetails(req, res, next)

            }
        }
        else {
            result = "The extras name with " + reqData.extras_name + " already exist."
            let obj = resPattern.errorPattern(httpStatus.BAD_REQUEST, result, 'failure');
            return res.status(obj.code).json(obj);
        }


    } catch (e) {
        return next(new APIError(e.message, httpStatus.BAD_REQUEST, true));
    }
}

// delete Extras 
const deleteExtras = async (req, res, next) => {
    try {
        const loggedInUser = req.user;
        const extras_id = req.params.extras_id;
        let result = await Extras.findByIdAndDelete(mongoose.Types.ObjectId(extras_id))
        req.body = {
            dish_id: result.dish_id
        }
        if (result) {
            // send response
            result = await dishDetails(req, res, next);

        }
    } catch (e) {
        return next(new APIError(e.message, httpStatus.BAD_REQUEST, true));
    }
}

// get Extras 
const getExtras = async (req, res, next) => {
    try {
        const loggedInUser = req.user;
        const reqData = req.body;

        let extras_id = {};
        let result = undefined;
        if (reqData.extras_id) {
            extras_id = { _id: mongoose.Types.ObjectId(reqData.extras_id) }
        }

        result = await Extras.aggregate(
            [
                {
                    $match:
                    {
                        $and: [
                            extras_id,
                            { dish_id: mongoose.Types.ObjectId(reqData.dish_id) },
                        ]
                    }
                },

                {
                    $project: {
                        _id: 1,
                        extras_name: 1,
                        price: 1
                    }
                },

            ]
        )

        if (result) {
            // send response
            return result;
        }
    } catch (e) {
        return next(new APIError(e.message, httpStatus.BAD_REQUEST, true));
    }
}

// get extras
const getExtras_req = async (req, res, next) => {
    try {
        const result = await getExtras(req, res, next);
        if (result) {
            // send response
            let obj = resPattern.successPattern(httpStatus.OK, result, 'success');
            return res.status(obj.code).json(obj);
        }
    } catch (e) {
        return next(new APIError(e.message, httpStatus.BAD_REQUEST, true));
    }
}


// update dish profile
const addDish = async (req, res, next) => {
    try {

        const loggedInUser = req.user;
        let dish = new Dish(req.body);
        if (Object.keys(req.files).length > 0) {
            const file = req.files;
            dish.item_image.image_name = file.item_image[0].originalname;
            dish.item_image.image_url = file.item_image[0].location;
        }

        dish.owner_id = loggedInUser._id;
        //  use with save function
        const result = await dish.save();
        if (result) {
            // send response
            let obj = resPattern.successPattern(httpStatus.OK, result, 'success');
            return res.status(obj.code).json(obj);
        }
    } catch (e) {
        return next(new APIError(e.message, httpStatus.BAD_REQUEST, true));
    }
}

// update dish profile
const updateDish = async (req, res, next) => {
    try {
        const reqData = JSON.parse(JSON.stringify(req.body));
        const dish = await Dish.findById(mongoose.Types.ObjectId(reqData.dish_id));
        if (Object.keys(req.files).length > 0) {
            const file = req.files;
            dish.item_image.image_name = file.item_image[0].originalname;
            dish.item_image.image_url = file.item_image[0].location;
        }
        for (const key in reqData) {
            if (reqData.hasOwnProperty(key)) {
                dish[key] = reqData[key];
            }
        }
        //  use with save function
        const result = await dish.save();
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
const deleteMenuCategory = async (req, res, next) => {
    try {
        const category_id = req.params.category_id;

        const menu = await MenuCategory.findByIdAndDelete(category_id);

        if (menu) {

            const finddsih = await Dish.find({ menu_category_id: category_id }, { _id: 1 })

            for (let index = 0; index < finddsih.length; index++) {
                const element = finddsih[index];

                await Variant_OP.deleteMany({ dish_id: element._id })
                await Variant.deleteMany({ dish_id: element._id })
                await Extras.deleteMany({ dish_id: element._id })
            }
            await Dish.deleteMany({ menu_category_id: category_id })
        }

        // verify delete
        if (!menu) {
            const message = `Dish category not found with Id: '${category_id}'.`;
            return next(new APIError(message, httpStatus.NOT_FOUND, true));
        }

        // send response
        const response = { message: 'Category deleted.' };
        let obj = resPattern.successPattern(httpStatus.OK, response, 'success');
        return res.status(obj.code).json(obj);
    } catch (e) {
        console.log(e);
        return next(new APIError(e.message, httpStatus.BAD_REQUEST, true));
    }
}


// delete dish 
const deleteDish = async (req, res, next) => {
    try {

        const dish_id = req.params.dish_id;
        // find and update user
        const dish = await Dish.findByIdAndDelete(mongoose.Types.ObjectId(dish_id));
        console.log({dish});
        if (dish) {
            await Extras.deleteMany({ dish_id: dish._id })
            const deleteVariantOP = await Variant_OP.deleteMany({ dish_id: dish._id })
            if (deleteVariantOP) {
                const deleteVariant = await Variant.deleteMany({ dish_id: dish._id })
            }
        }
        // verify delete
        if (!dish) {
            const message = `Dish not found with Id: '${userId}'.`;
            return next(new APIError(message, httpStatus.NOT_FOUND, true));
        }

        // send response
        const response = { message: 'Dish deleted.' };
        let obj = resPattern.successPattern(httpStatus.OK, response, 'success');
        return res.status(obj.code).json(obj);
    } catch (e) {
        console.log(e);
        return next(new APIError(e.message, httpStatus.BAD_REQUEST, true));
    }
}

// --- menu cloning ---

// ---assist function cloning menu or menu category from master brand to outlets ---
const clones = async (reqData, schema_model) => {
    const outlet = { outlet_id: reqData.outlet_id, item_available: reqData.item_available }
    let cloned_menus = await schema_model.bulkWrite([
        {
            updateMany: {
                filter: {
                    owner_id: reqData.owner_id,
                    outlets: { $exists: true },
                    outlets: { $elemMatch: { outlet_id: reqData.outlet_id } },

                },
                update: { $set: { "outlets.$[element].outlet_id": reqData.outlet_id, "outlets.$[element].item_available": reqData.item_available } },
                arrayFilters: [{
                    $and: [
                        { "element.outlet_id": mongoose.Types.ObjectId(reqData.outlet_id) },

                        { "element.item_available": { $ne: reqData.item_available } }
                    ]
                }],
            },
        }
    ])
    if (!cloned_menus.matchedCount) {
        cloned_menus = await schema_model.bulkWrite([
            {
                updateMany: {
                    filter: {
                        owner_id: reqData.owner_id,
                        "outlets.outlet_id": { $ne: reqData.outlet_id }
                    },
                    update: { $addToSet: { outlets: outlet } },
                }
            }
        ])
    }
    return cloned_menus
}

// --- controller to clone menu category ---
const clone_menuCategory = async (req, res, next) => {
    try {
        const reqData = req.body;
        const result = await clones(reqData, MenuCategory);
        let obj = resPattern.successPattern(httpStatus.OK, result, 'success');
        return res.status(obj.code).json(obj);
    } catch (e) {
        return next(new APIError(e.message, httpStatus.BAD_REQUEST, true));
    }
}
const clone_menuItems = async (req, res, next) => {
    try {
        const reqData = req.body;
        const result = await clones(reqData, Dish);
        let obj = resPattern.successPattern(httpStatus.OK, result, 'success');
        return res.status(obj.code).json(obj);
    } catch (e) {
        return next(new APIError(e.message, httpStatus.BAD_REQUEST, true));
    }
}

const menuItems_availability = async (req, res, next) => {
    try {
        const reqData = req.body;
        // const result = await clones(reqData,Dish);
        const result = await Dish.bulkWrite([
            {
                updateOne: {
                    filter: {
                        _id: reqData.dish_id,
                        outlets: { $elemMatch: { outlet_id: reqData.outlet_id } },
                    },
                    update: {
                        $set: { "outlets.$[element].outlet_id": reqData.outlet_id, "outlets.$[element].item_available": reqData.item_available }
                    },
                    arrayFilters: [{
                        $and: [
                            { "element.outlet_id": mongoose.Types.ObjectId(reqData.outlet_id) },

                            { "element.item_available": { $ne: reqData.item_available } }
                        ]
                    }],
                }
            }])
        let obj = resPattern.successPattern(httpStatus.OK, result, 'success');
        return res.status(obj.code).json(obj);
    } catch (e) {
        return next(new APIError(e.message, httpStatus.BAD_REQUEST, true));
    }
}

const menu_outlet_list = async (req, res, next) => {
    try {
        const reqData = req.body;
        const result = await Dish.findById(reqData.dish_id)
        // .populate('outlets.outlet_id','restaurant_Name name email isActive restaurant_image country_name address restaurant_city createdAt is_outlet master_brand aggregator_id')
        .populate({
            path:'outlets.outlet_id',
            model:'User',
            populate: [{
                path: 'restaurant_city',
                model: 'Cities',
                select: '_id city_name'
            }],
            select:'restaurant_Name name email isActive restaurant_image country_name address restaurant_city createdAt is_outlet master_brand aggregator_id'
        }).select('outlets');
        let obj = resPattern.successPattern(httpStatus.OK, result, 'success');
        return res.status(obj.code).json(obj);
    } catch (e) {
        return next(new APIError(e.message, httpStatus.BAD_REQUEST, true));
    }
}

module.exports = {
    menu_list,
    addMenu,
    updateMenu,
    deleteMenu,
    deleteMenuCategory,
    dishDetails,
    addDish,
    updateDish,
    deleteDish,
    clone_menuItems,
    clone_menuCategory,
    menuItems_availability,
    menu_outlet_list,

    addVariantOP,
    updateVariantOP,
    deleteVariantOP,
    getVariantOP_req,
    getVariantOP,

    addVariant,
    updateVariant,
    deleteVariant,
    getVariant_req,
    getVariant,

    addExtras,
    updateExtras,
    deleteExtras,
    getExtras_req,
    getExtras
};
