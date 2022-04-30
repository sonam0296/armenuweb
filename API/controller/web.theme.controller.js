const httpStatus = require("http-status");
const APIError = require("../helpers/APIError");
const resPattern = require("../helpers/resPattern");
const Plan = require("../model/plan.model");
const User = require("../model/user.model");
const Subscription = require("../model/subscription.model");
const themeUI = require("../model/web.theme.model");
const mongoose = require("mongoose");
const moment = require("moment");


const get_page_ui = async (req, res, next) => {
    try {
        const reqData = req.body;
        const page_list = reqData.page_list?reqData.page_list + " theme_author_id theme_type is_selected":"ui " + " theme_author_id theme_type is_selected";
        console.log({page_list});
        const result = await themeUI.findOne({ theme_author_id: reqData.theme_author_id, is_selected: true }).select(page_list);
        let obj = resPattern.successPattern(
            httpStatus.OK,
            result,
            "success"
        );
        return res.status(200).json(obj);
    } catch (e) {
        return next(new APIError(e.message, httpStatus.BAD_REQUEST, true));
    }
};


const add_page_ui = async (req, res, next) => {
    try {
        const loggedInUser = req.user;
        let reqData = new themeUI(req.body);
        reqData.theme_author_id = loggedInUser._id;
        reqData.theme_type = loggedInUser.userType === "admin" ? "Master" : "Custom";
        reqData.used_count = reqData.is_selected ? 1 : 0;
        let result = undefined;
        if (reqData.is_selected) {
            result = await themeUI.bulkWrite([
                {
                    updateMany: {
                        filter: { theme_author_id: reqData.theme_author_id, is_selected: true },
                        update: { is_selected: false }
                    }
                },
                { insertOne: { "document": reqData } }
            ])
        }
        else {
            result = await reqData.save()
        }
        let obj = resPattern.successPattern(
            httpStatus.OK,
            result,
            "success"
        );
        return res.status(200).json(obj);
    } catch (e) {
        return next(new APIError(e.message, httpStatus.BAD_REQUEST, true));
    }
};


module.exports = {
    get_page_ui,
    add_page_ui
};