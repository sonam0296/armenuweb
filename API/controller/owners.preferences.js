const httpStatus = require("http-status");
const APIError = require("../helpers/APIError");
const resPattern = require("../helpers/resPattern");
const User = require("../model/user.model");
const Coupon = require("../model/coupon.model");
const mongoose = require("mongoose");


const add_coupon = async (req, res, next) => {
    try {
        const user = req.user;
        if (await Coupon.findOne({owner_id:user._id,coupon_code:req.body.coupon_code,coupon_archive:false})) {
            return next(new APIError(`The coupon code ${req.body.coupon_code} already exist. change to another value`, httpStatus.BAD_REQUEST, true));
        }
        let reqData =new Coupon(req.body);
        reqData.owner_id = user._id;
        const coupon = await reqData.save();
        let obj = resPattern.successPattern(httpStatus.OK, coupon, 'success');
        return res.status(obj.code).json(obj);
    } catch (e) {
        return next(new APIError(e.message, httpStatus.BAD_REQUEST, true));
    }
}

const update_coupon = async (req, res, next) => {
    try {
        const user = req.user;
        const reqData = req.body;
        if (await Coupon.findOne({owner_id:user._id,_id:{$ne:req.body.coupon_id},coupon_code:req.body.coupon_code,coupon_archive:false})) {
            return next(new APIError(`The coupon code ${req.body.coupon_code} already exist. change to another value`, httpStatus.BAD_REQUEST, true));
        }
        const coupon = await Coupon.findByIdAndUpdate(reqData.coupon_id,{
            $set:{
                coupon_code:reqData.coupon_code,
                coupon_terms:reqData.coupon_terms,
                item_image:reqData.item_image,
            }
        },{new:true})
        let obj = resPattern.successPattern(httpStatus.OK, coupon, 'success');
        return res.status(obj.code).json(obj);
    } catch (e) {
        return next(new APIError(e.message, httpStatus.BAD_REQUEST, true));
    }
}

const get_coupon = async (req, res, next) => {
    try {
        let filter = {};
        let skip='';
        let page = '';
        let page_Info = {
            count:  undefined,
            page_number:  req.body.page_number
        };
        if (req.body.userType === "client") {
            filter = {coupon_archive:false}
        }
        const reqData = req.body;
        if (req.body.userType === "owner") {
            skip = reqData.items_in_page * (reqData.page_number - 1)
            page = reqData.items_in_page
        }
        const coupons = await Coupon.find({$and:[{owner_id:mongoose.Types.ObjectId(reqData.owner_id)},filter]}).sort({_id:-1}).skip(skip).limit(page);
        const length =(await Coupon.find({$and:[{owner_id:mongoose.Types.ObjectId(reqData.owner_id)},filter]})).length;
        page_Info.count = length;
        let obj = resPattern.successPattern(httpStatus.OK, {coupons,page_Info}, 'success');
        return res.status(obj.code).json(obj);
    } catch (e) {
        return next(new APIError(e.message, httpStatus.BAD_REQUEST, true));
    }
}

const archive_coupon = async (req, res, next) => {
    try {
        const reqData = req.body;
        const coupon = await Coupon.findByIdAndUpdate(reqData.coupon_id,{
            $set:{
                coupon_archive:true,
            }
        },{new:true})
        let obj = resPattern.successPattern(httpStatus.OK, coupon, 'success');
        return res.status(obj.code).json(obj);
    } catch (e) {
        return next(new APIError(e.message, httpStatus.BAD_REQUEST, true));
    }
}


module.exports = {
    add_coupon,
    update_coupon,
    get_coupon,
    archive_coupon
};