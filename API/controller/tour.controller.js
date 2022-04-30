const Tour = require("../model/tour.model")
const APIError = require('../helpers/APIError');
const httpStatus = require('http-status');
const resPattern = require('../helpers/resPattern');
const mongoose = require("mongoose");

const AddTourContent = async (req, res, next) => {

  try {
    const reqData = req.body;
    let tour;
    console.log("tour id", reqData.tour_id);
    if (reqData.tour_id) {
      tour = await Tour.findByIdAndUpdate({ _id: mongoose.Types.ObjectId(reqData.tour_id) }, reqData, { new: true })
    } else {

      tour = await new Tour(reqData);
      await tour.save();
    }
    const obj = resPattern.successPattern(httpStatus.CREATED, { tour }, 'success');
    return res.status(obj.code).json(obj);
  }
  catch (error) {

    return next(new APIError(error.message, httpStatus.BAD_REQUEST, true));

  }

}
const getTourContent = async (req, res, next) => {

  try {
    let query = {}
    let master_id = {}
    let outlet = {}
    const { userType, is_outlet, master_brand } = req.body;

    if (userType) {
      query = { userType: userType }
    }
    if (is_outlet && userType == "owner") {
      outlet = { is_outlet: is_outlet }
    } else {
      outlet = { is_outlet: is_outlet }
    }
    if (master_brand) {
      master_id = { master_brand: master_brand }
    }

    const tourData = await Tour.find({ $and: [query, master_id, outlet] })


    const obj = resPattern.successPattern(httpStatus.OK, { tourData }, 'sucess')

    return res.status(obj.code).json(obj)

  } catch (error) {

    return next(new APIError(error.message, httpStatus.BAD_REQUEST, true))

  }

}
const delTourContent = async (req, res, next) => {
  try {
    const id = req.params.id;
    const deltour = await Tour.findOneAndDelete({ _id: mongoose.Types.ObjectId(id) })
    const obj = resPattern.successPattern(httpStatus.OK, { deltour }, 'sucess')

    return res.status(obj.code).json(obj)




  } catch (error) {
    return next(new APIError(error.message, httpStatus.BAD_REQUEST, true))
  }
}

module.exports = {
  AddTourContent,
  getTourContent,
  delTourContent
}