const httpStatus = require("http-status");
const APIError = require("../helpers/APIError");
const resPattern = require("../helpers/resPattern");
const User = require("../model/user.model");
const Reservation = require("../model/reservation.model");
const mongoose = require("mongoose");
const { send_notification } = require('../helpers/fcm_notification');

const reservations = async (req, res, next) => {
    try {
        let reqData = new Reservation(req.body);
        const owner_hunt = await Reservation.findOne({ owner_id: reqData.owner_id })
        let reservation = undefined;
        if (owner_hunt) {

            let arr = []
            for (let i = 0; i < reqData.capacity; i++) {
                arr.push({})
            }
            reservation = await Reservation.findByIdAndUpdate(owner_hunt._id, {
                $set: {
                    capacity: reqData.capacity,
                    arrangement: arr
                }
            }, { new: true })
        } else {
            reservation = await reqData.save();
        }
        let obj = resPattern.successPattern(httpStatus.OK, reservation, 'success');
        return res.status(obj.code).json(obj);
    } catch (e) {
        return next(new APIError(e.message, httpStatus.BAD_REQUEST, true));
    }
}


const notify_for_service = async (req, res, next) => {
    try {
        // const user = req.user;
        const reqData = req.body;
        const owner = await User.findById(reqData.owner_id).select({ fcm_registration_token: 1, hosting_Address: 1 });
        let data = undefined;
        if (reqData.userType === 'client') {

            data = await Reservation.updateOne(
                {
                    owner_id: owner._id,
                    // $elemMatch: { "arrangement._id": mongoose.Types.ObjectId(reqData.arrangement_id) } 
                },
                {
                    $set:{
                        'arrangement.$[element].client_id': mongoose.Types.ObjectId(reqData.client_id),
                        'arrangement.$[element].order_id': mongoose.Types.ObjectId(reqData.order_id)
                    },
                    $addToSet: {
                        'arrangement.$[element].messages': { $each: reqData.message },
                    }
                },
                { arrayFilters: [{ "element._id": mongoose.Types.ObjectId(reqData.arrangement_id) }] }
            )
            const message = reqData.message.pop();
            // const message = reqData.message;
            const payload = {
                tokens: owner.fcm_registration_token,
                headers: {
                    message: message,
                    table: reqData.table.toString(),
                    Urgency: "high"
                },
                notification: {
                    title: reqData.table.toString(),
                    body: message,
                },
                data: {
                    owner_id: reqData.owner_id.toString(),
                    table: reqData.table.toString(),
                    message: message,
                    userType: "owner"
                },
                link: "https://app.appetizar.io/#/in-dine"
                // link: "http://localhost:3000/#/in-dine"
            }
            owner.fcm_registration_token && owner.fcm_registration_token.length > 0 && await send_notification(payload);
        } else {
            let query = {
                $set: {
                    'arrangement.$[element].messages': reqData.message,
                    'arrangement.$[element].client_id': mongoose.Types.ObjectId(reqData.client_id),
                    'arrangement.$[element].order_id': mongoose.Types.ObjectId(reqData.order_id)
                }
            }
            if (reqData.message.length === 0) {
                const client = await User.findById(reqData.client_id).select({ fcm_registration_token: 1 });
                const message = "In-Dine served,drop by again!"
                const payload = {
                    tokens: client.fcm_registration_token,
                    headers: {
                        message: message,
                        table: reqData.table.toString(),
                        Urgency: "high"
                    },
                    notification: {
                        title: reqData.table.toString(),
                        body: message,
                    },
                    data: {
                        owner_id: reqData.owner_id.toString(),
                        table: reqData.table.toString(),
                        message: message,
                        userType: "owner"
                    },
                    link: `https://${owner.hosting_Address}/#/`
                    // link: "http://localhost:3000/#/in-dine"
                }
                client.fcm_registration_token && client.fcm_registration_token.length > 0 && await send_notification(payload);
                query = {
                    $set: {
                        'arrangement.$[element].messages': reqData.message,
                        'arrangement.$[element].client_id': null,
                        'arrangement.$[element].order_id': null
                    }
                }
            }
            data = await Reservation.updateOne(
                {
                    owner_id: owner._id,
                    // $elemMatch: { "arrangement._id": mongoose.Types.ObjectId(reqData.arrangement_id) } 
                },
                query,
                { arrayFilters: [{ "element._id": mongoose.Types.ObjectId(reqData.arrangement_id) }] }
            )
        }

        let obj = resPattern.successPattern(httpStatus.OK, data, 'success');
        return res.status(obj.code).json(obj);
    } catch (e) {
        return next(new APIError(e.message, httpStatus.BAD_REQUEST, true));
    }
}

const get_reservations = async (req, res, next) => {
    try {
        const reqData = req.body;
        const arrangement = await Reservation.findOne({ owner_id: mongoose.Types.ObjectId(reqData.owner_id) })
        let obj = resPattern.successPattern(httpStatus.OK, arrangement, 'success');
        return res.status(obj.code).json(obj);
    } catch (e) {
        return next(new APIError(e.message, httpStatus.BAD_REQUEST, true));
    }
}

module.exports = {
    reservations,
    notify_for_service,
    get_reservations,
};