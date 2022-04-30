const httpStatus = require("http-status");
const APIError = require("../helpers/APIError");
const resPattern = require("../helpers/resPattern");
const User = require("../model/user.model");
const Site = require("../model/setting_management.model");
const Page = require("../model/pages.model");
const City = require("../model/cities.model");
const mongoose = require("mongoose");
const generator = require("generate-password");
const { sendEmail } = require("../helpers/sendEmail");
const { qrupload } = require("../helpers/fileUpload");
const fs = require("fs");

const {
  on_boarding,
  deauth_stripe_account,
  creating_stripe_acc,
  stripe_platform_sign_in,
  create_customer,
} = require("../helpers/stripe.payment");

const {
  i18_translate,
  i18_translate_err,
  translate_meta,
} = require("../helpers/i18n");

const QRcode = require("qrcode");
const sendSMS = require("../helpers/sendSMS");

// get user profile.
const userProfile = async (req, res, next) => {
  try {
    const userId = req.params.userId;
    let cities = undefined;
    let user = await User.findById(mongoose.Types.ObjectId(userId));
    if (user.location.coordinates) {
      user.location.coordinates.reverse();
    }

    if (user.userType === "owner") {
      if (user.delivery_area.coordinates) {
        user.delivery_area.coordinates.forEach((element) => {
          element.forEach((poly) => {
            poly.forEach((coord) => {
              coord.reverse();
            });
          });
        });
      }
      cities = await City.find();
    }
    let obj = resPattern.successPattern(
      httpStatus.OK,
      { user, cities },
      "success"
    );
    return res.status(obj.code).json(obj);
  } catch (e) {
    return next(new APIError(e.message, httpStatus.BAD_REQUEST, true));
  }
};

const isRegisteredMail = async (req, res, next) => {
  try {
    const {email,userType} = req.body;
    const user = await User.findOne({ email: email, userType:userType });
    const is_email_regi = user && user.email ? true : false;
    const result = {
      is_email_regi,
      input_data:{
        ...req.body
      }
    }
    let obj = resPattern.successPattern(httpStatus.OK, result, 'success');
    return res.status(obj.code).json(obj);
  } catch (e) {
    return next(new APIError(e.message, httpStatus.BAD_REQUEST, true));
  }
}

const profile_image = async (req, res, next) => {
  try {
    let loggedInUser = req.user;
    const file = req.file;
    const profile = await User.findOne({
      _id: mongoose.Types.ObjectId(loggedInUser._id),
    });
    if (file) {
      (profile.profile_image.image_name = file.originalname),
        (profile.profile_image.image_url = file.location);
    }
    const saveprofile = await profile.save();
    if (saveprofile) {
      // send response
      let obj = resPattern.successPattern(
        httpStatus.OK,
        saveprofile,
        "success"
      );
      return res.status(obj.code).json(obj);
    }
  } catch (error) {
    console.log(error);
    return next(new APIError(error.message, httpStatus.BAD_REQUEST, true));
  }
};

// update user profile
const updateProfile = async (req, res, next) => {
  try {
    let loggedInUser = req.user;
    const reqData = JSON.parse(JSON.stringify(req.body));
    if (loggedInUser.userType === 'owner') {
      if (await User.findOne({ userType: "owner", hosting_Address: reqData.hosting_Address, is_outlet: false, _id: { $ne: loggedInUser._id } })) {
        const message = `The sub-domain ${reqData.hosting_Address} is already reserved. please try another value.`
        return next(new APIError(message, httpStatus.BAD_REQUEST, true));
      }

      if (!reqData.is_outlet && reqData.hosting_Address && (reqData.hosting_Address !== loggedInUser.hosting_Address)) {
        const domain = reqData.hosting_Address.replace(/ +/g, "").trim().toLowerCase() + ".appetizar.io";
        loggedInUser.hosting_Address = domain;
        const filename = Date.now() + "-" + `${reqData.restaurant_Name}` + "-qrcode.png";
        const path = "./uploads/" + filename;

        await QRcode.toFile(path, `${loggedInUser.hosting_Address}`)

        let url = await qrupload(filename, next);

        fs.unlinkSync(path);

        loggedInUser.qrcode = url;
      }
    }
    if (await User.findOne({ _id: { $ne: loggedInUser._id }, email: reqData.email })) {
      const message = `User already exist with email: '${reqData.email}'.`
      return next(new APIError(message, httpStatus.BAD_REQUEST, true));
    }
    for (const key in reqData) {
      if (reqData.hasOwnProperty(key)) {
        if (key == "location") {
          reqData.location.coordinates.reverse();
        }
        if (key == "delivery_area") {
          reqData.delivery_area.coordinates.forEach((poly) => {
            poly.forEach((coord) => {
              coord.reverse();
            });
          });
        }
        if (key !== "address") {
          loggedInUser[key] = reqData[key];
        }
      }
    }
    let result = await loggedInUser.save();
    if (reqData.address) {
      result = await User.findOneAndUpdate(
        { _id: loggedInUser._id },
        {
          $set: {
            address: reqData.address,
          },
        },
        { upsert: true, new: true }
      );
    }

    if (loggedInUser.userType == "owner") {
      if (loggedInUser.userType == "owner") {
        console.log("result.delivery_area && result.delivery_area.coordinates.length > 0", result.hasOwnProperty('delivery_area'));
        if (result.hasOwnProperty('delivery_area')) {
          if (result.delivery_area.coordinates.length > 0) {
            result.delivery_area.coordinates.forEach((element) => {
              element.forEach((poly) => {
                poly.forEach((coord) => {
                  coord.reverse();
                });
              });
            });
          } else {
            let message = "Please fill the delivery area properly.";
            return next(new APIError(message, httpStatus.BAD_REQUEST, true));
          }
        }
      }
    }
    if (result.location && result.location.coordinates) {
      result.location.coordinates.reverse();
    }
    if (result) {
      // send response
      let obj = resPattern.successPattern(httpStatus.OK, result, "success");
      return res.status(obj.code).json(obj);
    }
  } catch (e) {
    console.log(e);
    return next(new APIError(e.message, httpStatus.BAD_REQUEST, true));
  }
};

//add restaurant images

const add_restaurant_image = async (req, res, next) => {
  try {
    let loggedInUser = req.user;
    const file = JSON.parse(JSON.stringify(req.files));

    let addimages = await User.findOne({
      _id: mongoose.Types.ObjectId(req.body.userid),
    });

    for (const key in file) {
      if (file.hasOwnProperty(key)) {
        const element = file[key][0];
        addimages[key].image_name = element.originalname;
        addimages[key].image_url = element.location;
      }
    }
    const result = await addimages.save();

    if (result) {
      // send response
      let obj = resPattern.successPattern(httpStatus.OK, result, "success");
      return res.status(obj.code).json(obj);
    }
  } catch (error) {
    console.log(error);
    return next(new APIError(error.message, httpStatus.BAD_REQUEST, true));
  }
};

const get_restaurant_images = async (req, res, next) => {
  try {
    let loggedInUser = req.user;
    const findimages = await User.findOne(
      { _id: loggedInUser.id },
      { restaurant_image: 1, restaurant_cover_image: 1 }
    );

    let obj = resPattern.successPattern(httpStatus.OK, findimages, "success");
    return res.status(obj.code).json(obj);
  } catch (error) {
    return next(new APIError(e.message, httpStatus.BAD_REQUEST, true));
  }
};

const get_restaurant_images_admin = async (req, res, next) => {
  try {
    let loggedInUser = req.user;
    const findimages = await User.findOne(
      { _id: mongoose.Types.ObjectId(req.params.userid) },
      { restaurant_image: 1, restaurant_cover_image: 1 }
    );

    let obj = resPattern.successPattern(httpStatus.OK, findimages, "success");
    return res.status(obj.code).json(obj);
  } catch (error) {
    return next(new APIError(e.message, httpStatus.BAD_REQUEST, true));
  }
};

// update user profile
const getFavDish = async (req, res, next) => {
  try {
    const loggedInUser = req.user;
    const reqData = req.body;
    const result = await User.findById(loggedInUser._id)
      .select({
        favorite_dish: 1,
      })
      .populate({
        path: "favorite_dish",
        model: "Menus",
        select: "_id item_name item_description item_price item_available",
      });

    if (result) {
      let obj = resPattern.successPattern(httpStatus.OK, result, "success");
      return res.status(obj.code).json(obj);
    }
  } catch (e) {
    return next(new APIError(e.message, httpStatus.BAD_REQUEST, true));
  }
};

// update user profile

const site_preference = async (req, res, next) => {
  try {
    const loggedInUser = req.user;
    // const params = req.params;
    // const query = req.query;
    let reqData = req.body;
    let result = await User.findByIdAndUpdate(
      loggedInUser._id,
      {
        language_preference: reqData.language_preference,
      },
      {
        new: true,
      }
    );
    let obj = resPattern.successPattern(httpStatus.OK, result, "success");
    return res.status(obj.code).json(obj);
  } catch (e) {
    return next(new APIError(e.message, httpStatus.BAD_REQUEST, true));
  }
};

const addFavDish = async (req, res, next) => {
  try {
    const loggedInUser = req.user;
    const reqData = req.body;
    let result = await User.findByIdAndUpdate(
      loggedInUser._id,
      {
        $addToSet: {
          favorite_dish: reqData.dish_id,
        },
      },
      {
        new: true,
      }
    );

    if (result) {
      // send response
      let obj = resPattern.successPattern(httpStatus.OK, result, "success");
      return res.status(obj.code).json(obj);
    }
  } catch (e) {
    console.log(e);
    return next(new APIError(e.message, httpStatus.BAD_REQUEST, true));
  }
};

// update user profile
const removeFavDish = async (req, res, next) => {
  try {
    const loggedInUser = req.user;
    const reqData = req.body;
    let result = await User.findByIdAndUpdate(
      loggedInUser._id,
      {
        $pull: {
          favorite_dish: reqData.dish_id,
        },
      },
      {
        new: true,
      }
    );

    if (result) {
      // send response
      let obj = resPattern.successPattern(httpStatus.OK, result, "success");
      return res.status(obj.code).json(obj);
    }
  } catch (e) {
    return next(new APIError(e.message, httpStatus.BAD_REQUEST, true));
  }
};

// update user profile
const getFavRestaurant = async (req, res, next) => {
  try {
    const loggedInUser = req.user;
    const reqData = req.body;
    let result = await User.findById(loggedInUser._id)
      .select({
        favorite_restaurant: 1,
      })
      .populate({
        path: "favorite_restaurant",
        model: "User",
        select: "-password",
      });

    if (result) {
      // send response
      let obj = resPattern.successPattern(httpStatus.OK, result, "success");
      return res.status(obj.code).json(obj);
    }
  } catch (e) {
    return next(new APIError(e.message, httpStatus.BAD_REQUEST, true));
  }
};

// update user profile
const addFavRestaurant = async (req, res, next) => {
  try {
    const loggedInUser = req.user;
    const reqData = req.body;
    let result = await User.findByIdAndUpdate(
      loggedInUser._id,
      {
        $addToSet: {
          favorite_restaurant: reqData.owner_id,
        },
      },
      {
        new: true,
      }
    );

    if (result) {
      // send response
      let obj = resPattern.successPattern(httpStatus.OK, result, "success");
      return res.status(obj.code).json(obj);
    }
  } catch (e) {
    return next(new APIError(e.message, httpStatus.BAD_REQUEST, true));
  }
};

// update user profile
const removeFavRestaurant = async (req, res, next) => {
  try {
    const loggedInUser = req.user;
    const reqData = req.body;
    let result = await User.findByIdAndUpdate(
      loggedInUser._id,
      {
        $pull: {
          favorite_restaurant: reqData.owner_id,
        },
      },
      {
        new: true,
      }
    );

    if (result) {
      // send response
      let obj = resPattern.successPattern(httpStatus.OK, result, "success");
      return res.status(obj.code).json(obj);
    }
  } catch (e) {
    return next(new APIError(e.message, httpStatus.BAD_REQUEST, true));
  }
};

// user deatails
const userDetails = async (req, res, next) => {
  try {
    const reqQuery = { ...req.query };

    // Fields to exclude
    const removeFields = [
      "userId",
      "select",
      "search",
      "sort",
      "page",
      "limit",
    ];

    // Loop over removeFields and delete them from reqQuery
    removeFields.forEach((param) => delete reqQuery[param]);

    // Create query string
    let queryStr = JSON.parse(JSON.stringify(reqQuery));

    // finding resource
    let query = User.find(queryStr).lean();

    // user by user Id
    if (req.query.userId) {
      query = User.findById(req.query.userId);
    }

    // select user by user register type(client, service, company)
    if (req.query.select) {
      query = User.find({ userType: req.query.select }).lean();
    }

    // search users by user name
    if (req.query.search) {
      query = User.find({ name: new RegExp(req.query.search, "i") }).lean();
    }

    // sort users by name
    if (req.query.sort) {
      const sortBy = req.query.sort.split(",").join(" ");
      query = query.sort(sortBy);
    }

    // count total results
    const response = await query;
    const count = response.length;

    // pagination
    const page = parseInt(req.query.page);
    const limit = parseInt(req.query.limit);
    const startIndex = (page - 1) * limit;
    query = query.skip(startIndex).limit(limit);

    // executing query
    const results = await query;

    // send response
    let obj = resPattern.successPattern(
      httpStatus.OK,
      { count, results },
      "success"
    );
    return res.status(obj.code).json(obj);
  } catch (e) {
    console.log(e);
    return next(new APIError(e.message, httpStatus.BAD_REQUEST, true));
  }
};

// delete user by admin
const deleteUser = async (req, res, next) => {
  try {
    const userId = req.params.userId;
    // find and update user
    const user = await User.findByIdAndDelete(userId);

    // verify delete
    if (!user) {
      const message = `User not found with Id: '${userId}'.`;
      return next(new APIError(message, httpStatus.NOT_FOUND, true));
    }

    // send response
    const response = { message: "User deleted." };
    let obj = resPattern.successPattern(httpStatus.OK, response, "success");
    return res.status(obj.code).json(obj);
  } catch (e) {
    console.log(e);
    return next(new APIError(e.message, httpStatus.BAD_REQUEST, true));
  }
};

// update user by admin
const updateUser = async (req, res, next) => {
  try {
    let targetUser = await User.findById(
      mongoose.Types.ObjectId(req.body.user_id)
    );
    let reqData = req.body;
    if (reqData.userType === 'owner') {
      if (await User.findOne({ userType: "owner", hosting_Address: reqData.hosting_Address, is_outlet: false, _id: { $ne: reqData.user_id } })) {
        const message = `The sub-domain ${reqData.hosting_Address} is already reserved. please try another value.`
        return next(new APIError(message, httpStatus.BAD_REQUEST, true));
      }
      if (!reqData.is_outlet && reqData.hosting_Address && (reqData.hosting_Address !== targetUser.hosting_Address)) {
        const domain = reqData.hosting_Address.replace(/ +/g, "").trim().toLowerCase() + ".appetizar.io";
        targetUser.hosting_Address = domain;
        const filename = Date.now() + "-" + `${reqData.restaurant_Name}` + "-qrcode.png";
        const path = "./uploads/" + filename;

        await QRcode.toFile(path, `${targetUser.hosting_Address}`)

        let url = await qrupload(filename, next);

        fs.unlinkSync(path);

        targetUser.qrcode = url;
      }
    }
    if (await User.findOne({ _id: { $ne: targetUser._id }, email: reqData.email })) {
      const message = `User already exist with email: '${reqData.email}'.`
      return next(new APIError(message, httpStatus.BAD_REQUEST, true));
    }
    for (const key in reqData) {
      if (reqData.hasOwnProperty(key)) {
        //  reverse long lat
        if (key == "location") {
          reqData.location.coordinates.reverse();
        }
        if (key == "delivery_area") {
          reqData.delivery_area.coordinates[0].forEach((coord) => {
            coord.reverse();
          });
        }
        if (key !== "address") {
          targetUser[key] = reqData[key];
        }
      }
    }
    let result = await targetUser.save();

    if (reqData.address) {
      result = await User.findOneAndUpdate(
        { _id: targetUser._id },
        {
          $set: {
            address: reqData.address,
          },
        },
        { upsert: true, new: true }
      );
    }
    if (result.location.coordinates) {
      result.location.coordinates.reverse();
    }
    if (targetUser.userType == "owner") {
      result.delivery_area.coordinates[0].forEach((coord) => {
        coord.reverse();
      });
    }
    if (result) {
      // send response
      let obj = resPattern.successPattern(httpStatus.OK, result, "success");
      return res.status(obj.code).json(obj);
    }
  } catch (e) {
    return next(new APIError(e.message, httpStatus.BAD_REQUEST, true));
  }
};


const add_content = async (req, res, next) => {
  try {
    // const user = req.user;
    // const params = req.params;
    // const query = req.query;
    const reqData = req.body;
    const result = await Site.findByIdAndUpdate(reqData.site_id, {
      $set: {
        site_content: reqData.site_content
      }
    }, { new: true, upsert: true })
    let obj = resPattern.successPattern(httpStatus.OK, result, 'success');
    return res.status(obj.code).json(obj);
  } catch (e) {
    return next(new APIError(e.message, httpStatus.BAD_REQUEST, true));
  }
}

const update_content = async (req, res, next) => {
  try {
    // const user = req.user;
    // const params = req.params;
    // const query = req.query;
    const reqData = req.body;
    let obj = resPattern.successPattern(httpStatus.OK, result, 'success');
    return res.status(obj.code).json(obj);
  } catch (e) {
    return next(new APIError(e.message, httpStatus.BAD_REQUEST, true));
  }
}

// ---------- setting management -----------
//site info
const addSiteInfo = async (req, res, next) => {
  try {
    const {
      site_Name,
      site_Description,
      title,
      subtitle,
      delievery_Cost_fixed,
      site_id,
    } = req.body;
    if (site_id == null) {
      const reqData = req.body;
      const addsite = new Site(reqData);
      const siteInfo = await addsite.save();
      let obj = resPattern.successPattern(
        httpStatus.CREATED,
        { siteInfo: siteInfo },
        "success"
      );
      return res.status(obj.code).json(obj);
    } else {
      const updateSiteInfo = await Site.findOneAndUpdate(
        { _id: site_id },
        { site_Name, site_Description, title, subtitle, delievery_Cost_fixed },
        { new: true }
      );
      let obj = resPattern.successPattern(
        httpStatus.CREATED,
        { siteInfo: updateSiteInfo },
        "SiteInfo updated"
      );
      return res.status(obj.code).json(obj);
    }
  } catch (error) {
    console.log(error);
    return next(new APIError(error.message, httpStatus.BAD_REQUEST, true));
  }
};

const getsiteInfo = async (req, res, next) => {
  try {
    const siteid = req.body.site_id;
    const findsiteinfo = await Site.findById(siteid);
    let obj = resPattern.successPattern(
      httpStatus.CREATED,
      { siteInfo: findsiteinfo },
      "Site"
    );
    return res.status(obj.code).json(obj);
  } catch (error) {
    console.log(error);
    return next(new APIError(error.message, httpStatus.BAD_REQUEST, true));
  }
};

const getsiteInfo_client = async (req, res, next) => {
  try {
    const siteid = req.body.site_id;
    const findsiteinfo = await Site.findOne({ _id: siteid });
    let obj = resPattern.successPattern(
      httpStatus.CREATED,
      { siteInfo: findsiteinfo },
      "Site"
    );
    return res.status(obj.code).json(obj);
  } catch (error) {
    console.log(error);
    return next(new APIError(error.message, httpStatus.BAD_REQUEST, true));
  }
};

//Links
const addLinks = async (req, res, next) => {
  try {
    const {
      link_id,
      facebook_link,
      instagram_link,
      info_title,
      info_subtitle,
      playstore_link,
      appstore_link,
    } = req.body;
    const links = req.body;
    if (link_id == null) {
      const addLink = await new Site(links);
      const allinks = await addLink.save();
      let obj = resPattern.successPattern(
        httpStatus.CREATED,
        { links: allinks },
        "success"
      );
      return res.status(obj.code).json(obj);
    } else {
      const updateLinks = await Site.findOneAndUpdate(
        { _id: link_id },
        {
          facebook_link,
          instagram_link,
          info_title,
          info_subtitle,
          playstore_link,
          appstore_link,
        },
        { new: true }
      );
      let obj = resPattern.successPattern(
        httpStatus.CREATED,
        { links: updateLinks },
        "success"
      );
      return res.status(obj.code).json(obj);
    }
  } catch (error) {
    console.log(error);
    return next(new APIError(error.message, httpStatus.BAD_REQUEST, true));
  }
};

const getLinks = async (req, res, next) => {
  try {
    const link_id = req.body.link_id;
    const linksdetails = await Site.findOne({ _id: link_id });
    let obj = resPattern.successPattern(
      httpStatus.CREATED,
      { links: linksdetails },
      "success"
    );
    return res.status(obj.code).json(obj);
  } catch (error) {
    console.log(error);
    return next(new APIError(error.message, httpStatus.BAD_REQUEST, true));
  }
};

const getAllLinks = async (req, res, next) => {
  try {
    const link_id = req.body.link_id;
    const linksdetails = await Site.findOne({ _id: link_id });
    let obj = resPattern.successPattern(
      httpStatus.CREATED,
      { links: linksdetails },
      "success"
    );
    return res.status(obj.code).json(obj);
  } catch (error) {
    console.log(error);
    return next(new APIError(error.message, httpStatus.BAD_REQUEST, true));
  }
};

// ---------- Pages -----------
const addPage = async (req, res, next) => {
  try {
    const page = req.body;
    const addpage = await new Page(page);
    const pageInfo = await addpage.save();
    let obj = resPattern.successPattern(
      httpStatus.CREATED,
      { page: pageInfo },
      "success"
    );
    return res.status(obj.code).json(obj);
  } catch (error) {
    console.log(error);
    return next(new APIError(error.message, httpStatus.BAD_REQUEST, true));
  }
};
const getAllPages = async (req, res, next) => {
  try {
    const page_id = req.body.page_id ? req.body.page_id : "";
    const showlink = req.body.show_as_link ? req.body.show_as_link : false;

    if (page_id) {
      const updatelink = await Page.findOneAndUpdate(
        { _id: page_id },
        { show_as_link: showlink },
        { new: true }
      );
    }
    const allpage = await Page.find(
      {},
      { title: 1, _id: 1, show_as_link: 1 }
    ).sort({ _id: -1 });
    let obj = resPattern.successPattern(
      httpStatus.CREATED,
      { pages: allpage },
      "success"
    );
    return res.status(obj.code).json(obj);
  } catch (error) {
    console.log(error);
    return next(new APIError(error.message, httpStatus.BAD_REQUEST, true));
  }
};
const getPageDetails = async (req, res, next) => {
  try {
    const page_id = req.body.page_id;
    const foundPage = await Page.findOne({ _id: page_id });
    let obj = resPattern.successPattern(
      httpStatus.CREATED,
      { pages: foundPage },
      "success"
    );
    return res.status(obj.code).json(obj);
  } catch (error) {
    console.log(error);
    return next(new APIError(error.message, httpStatus.BAD_REQUEST, true));
  }
};
const updatepage = async (req, res, next) => {
  try {
    const { title, content } = req.body;
    const page_id = req.body.page_id;
    if (page_id) {
      const updatepage = await Page.findOneAndUpdate(
        { _id: page_id },
        { title: title, content: content },
        { new: true }
      );
      let obj = resPattern.successPattern(
        httpStatus.CREATED,
        { pages: updatepage },
        "success"
      );
      return res.status(obj.code).json(obj);
    }
  } catch (error) {
    console.log(error);
    return next(new APIError(error.message, httpStatus.BAD_REQUEST, true));
  }
};
const deletepage = async (req, res, next) => {
  try {
    const pageid = req.params.page_id;
    const deletedpage = await Page.findByIdAndDelete({ _id: pageid });
    const allpages = await Page.find({});
    let obj = resPattern.successPattern(
      httpStatus.CREATED,
      { pages: allpages },
      "success"
    );
    return res.status(obj.code).json(obj);
  } catch (error) {
    console.log(error);
    return next(new APIError(error.message, httpStatus.BAD_REQUEST, true));
  }
};

//---------- Cities -----------
const addcity = async (req, res, next) => {
  try {
    let status = undefined;
    let result = [];
    let file = req.file;

    const city_details = req.body;

    const addcity = await new City(city_details);
    addcity.city_image.image_url = file.location;
    addcity.city_image.image_name = file.originalname;
    const addedcity = await addcity.save();
    let obj = resPattern.successPattern(
      httpStatus.CREATED,
      { cities: addedcity },
      "success"
    );
    return res.status(obj.code).json(obj);
  } catch (error) {
    console.log(error);
    return next(new APIError(error.message, httpStatus.BAD_REQUEST, true));
  }
};

//edit city
const editcity = async (req, res, next) => {
  try {
    const city = JSON.parse(JSON.stringify(req.body));
    let file = req.file;

    const editcity = await City.findById(mongoose.Types.ObjectId(city.city_id));
    if (req.file) {
      (editcity.city_image.image_url = file.location),
        (editcity.city_image.image_name = file.originalname);
    }
    for (const key in city) {
      if (city.hasOwnProperty(key)) {
        const element = city[key];
        editcity[key] = element;
      }
    }
    const updatecity = await editcity.save();
    let obj = resPattern.successPattern(
      httpStatus.CREATED,
      { city: updatecity },
      "success"
    );
    return res.status(obj.code).json(obj);
  } catch (error) {
    console.log(error);
    return next(new APIError(error.message, httpStatus.BAD_REQUEST, true));
  }
};
const deletecity = async (req, res, next) => {
  try {
    const cityid = req.params.city_id;

    const deletecity = await City.findOneAndDelete({ _id: cityid });
    const allcity = await City.find({});
    let obj = resPattern.successPattern(
      httpStatus.CREATED,
      { cities: allcity },
      "success"
    );
    return res.status(obj.code).json(obj);
  } catch (error) {
    console.log(error);
    return next(new APIError(error.message, httpStatus.BAD_REQUEST, true));
  }
};
const getallcity = async (req, res, next) => {
  try {
    const perpage = req.body.perpage ? parseInt(req.body.perpage) : 10;
    const page = req.body.pageno ? req.body.pageno : 1;
    const findcity = await City.find()
      .limit(perpage)
      .skip((page - 1) * perpage)
      .sort({ _id: -1 })
      .exec();
    const totalcity = await City.find();
    let obj = resPattern.successPattern(
      httpStatus.CREATED,
      { cities: findcity, page: page, total: totalcity.length },
      "success"
    );
    return res.status(obj.code).json(obj);
  } catch (error) {
    console.log(error);
    return next(new APIError(error.message, httpStatus.BAD_REQUEST, true));
  }
};
const getallcity_client = async (req, res, next) => {
  try {
    const perpage = req.body.perpage ? parseInt(req.body.perpage) : 10;
    const page = req.body.pageno ? req.body.pageno : 1;
    const country_name = req.body.country_name;
    const findcity = await City.aggregate([
      {
        $lookup: {
          from: "users",
          let: {
            id: "$_id",
            isActive: "$isActive",
            country_name: "$country_name",
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$restaurant_city", "$$id"] },
                    {
                      $regexMatch: {
                        input: "$country_name",
                        regex: country_name,
                        options: "i",
                      },
                    },
                    { $eq: ["$isActive", true] },
                  ],
                },
              },
            },
          ],
          as: "restaurant",
        },
      },
      {
        $unwind: "$restaurant",
      },
      {
        $group: {
          _id: "$_id",
          restaurant: { $push: "$restaurant" },
          city_name: { $first: "$city_name" },
          short_code: { $first: "$short_code" },
          city_image: { $first: "$city_image" },
        },
      },
      {
        $project: {
          city_name: 1,
          short_code: 1,
          city_image: 1,
        },
      },
    ]);

    let obj = resPattern.successPattern(
      httpStatus.CREATED,
      { cities: findcity },
      "success"
    );
    return res.status(obj.code).json(obj);
  } catch (error) {
    console.log(error);
    return next(new APIError(error.message, httpStatus.BAD_REQUEST, true));
  }
};
const city_details = async (req, res, next) => {
  try {
    const id = req.params.city_id;
    const findcity = await City.findOne({ _id: mongoose.Types.ObjectId(id) });

    let obj = resPattern.successPattern(
      httpStatus.CREATED,
      { city: findcity },
      "success"
    );
    return res.status(obj.code).json(obj);
  } catch (error) {
    console.log(error);
    return next(new APIError(error.message, httpStatus.BAD_REQUEST, true));
  }
};

//---------- Driver Details -----------
const getdrivers = async (req, res, next) => {
  try {
    const perpage = req.body.perpage ? parseInt(req.body.perpage) : 10;
    const page = req.body.pageno ? req.body.pageno : 1;
    const totalriver = await User.find({ userType: "driver" });
    const founddriver = await User.find(
      { userType: "driver" },
      {
        email: 1,
        name: 1,
        createdAt: 1,
        isActive: 1,
        phone: 1,
        employer_id: 1,
        isRestaurantDrivers: 1,
        dial_code: 1,
        country_name: 1,
        country_code: 1,
        user_languages: 1,
        currencies: 1,
        language_preference: 1,
      }
    )
      .limit(perpage)
      .skip((page - 1) * perpage)
      .sort({ _id: -1 })
      .exec();
    let obj = resPattern.successPattern(
      httpStatus.CREATED,
      { Drivers: founddriver, total: totalriver.length, page: page },
      "success"
    );
    return res.status(obj.code).json(obj);
  } catch (error) {
    console.log(error);
    return next(new APIError(error.message, httpStatus.BAD_REQUEST, true));
  }
};

const adddrivers = async (req, res, next) => {
  try {
    const requestData = req.body;
    const loggedInUser = req.user;
    // find user by email and verify
    if (loggedInUser["userType"] === 'driver_aggregator' && loggedInUser['subscription_status']['status'] !== 'active' && loggedInUser['subscription_status']['status'] !== 'trialing' && loggedInUser['subscription_status']['status'] !== 'deprecated') {
      return next(new APIError("You are not subscribed to any active plan, consider subscribing to use this service.", httpStatus.BAD_REQUEST, true));
    }

    const password = generator.generate({
      length: 10,
      numbers: true,
      uppercase: true,
      lowercase: true,
    });
    let query = { $or: [] }
    if (requestData.email) {
      let email = { email: requestData.email };
      query['$or'].push(email);
    }
    if (requestData.phone) {
      let phone = { phone: requestData.phone };
      query['$or'].push(phone);
    }
    let userHunt = await User.findOne(query);
    if (userHunt) {
      const message = `There is already a registered user with credentials ${requestData.email ? requestData.email : ''}  ${requestData.phone ? requestData.phone : ''}.`;
      console.log(message);
      return next(new APIError(message, httpStatus.BAD_REQUEST, true));
    }
    translate_meta.lan = loggedInUser.language_preference;
    translate_meta.key = "addDriver.message";
    translate_meta.interpolation = {
      password: password,
    };
    if (!userHunt && requestData.email) {
      translate_meta.payload = {
        email: requestData.email,
        subject: "Appetizar driver registration",
      };
      await i18_translate(translate_meta, sendEmail);
    }
    if (!userHunt && requestData.phone) {
      translate_meta.payload = {
        phone: requestData.phone,
      };
      await i18_translate(translate_meta, sendSMS);
    }
    const encryptPassword = await new User().encryptPassword(password);
    const user = await new User({
      name: requestData.name,
      country_name: requestData.country_name,
      country_code: requestData.country_code,
      dial_code: requestData.dial_code,
      phone: requestData.phone,
      user_languages: requestData.user_languages,
      currencies: requestData.currencies,
      email: requestData.email,
      password: encryptPassword,
      userType: "driver",
      isActive: true,
      isRestaurantDrivers: requestData.isRestaurantDrivers,
    });
    const zero_decimal_country = [
      "BIF",
      "CLP",
      "DJF",
      "GNF",
      "JPY",
      "KMF",
      "KRW",
      "MGA",
      "PYG",
      "RWF",
      "UGX",
      "VND",
      "VUV",
      "XAF",
      "XOF",
      "XPF",
    ];
    zero_decimal_country.forEach((element) => {
      if (element == requestData.country_code) {
        user.currencies.zero_decimal_currencies = true;
      }
    });

    if (loggedInUser.userType == "admin") {
      if (requestData.isRestaurantDrivers) {
        user.isRestaurantDrivers = requestData.isRestaurantDrivers;
      }
      if (requestData.isAggregatorDrivers) {
        user.isAggregatorDrivers = requestData.isAggregatorDrivers;
      }

      if (requestData.isRestaurantDrivers == true || requestData.isAggregatorDrivers == true) {
        user.employer_id = requestData.employer_id;
      } else {
        user.employer_id = loggedInUser._id;
      }
    }
    else if (loggedInUser.userType == "driver_aggregator") {
      user.isAggregatorDrivers = true;
      user.employer_id = loggedInUser._id;
    }
    else {
      user.employer_id = loggedInUser._id;
      user.isRestaurantDrivers = true;
    }
    const adddrivers = await user.save();
    if (adddrivers) {
      adddrivers.password = undefined;
      let obj = resPattern.successPattern(
        httpStatus.CREATED,
        { user: adddrivers },
        "success"
      );
      return res.status(obj.code).json(obj);
    }
  } catch (error) {
    return next(new APIError(error.message, httpStatus.BAD_REQUEST, true));
  }
};

const addAggregator = async (req, res, next) => {
  try {
    const requestData = req.body;
    const loggedInUser = req.user;
    // find user by email and verify

    const password = generator.generate({
      length: 10,
      numbers: true,
      uppercase: true,
      lowercase: true,
    });
    let query = { $or: [] }
    if (requestData.email) {
      let email = { email: requestData.email };
      query['$or'].push(email);
    }
    if (requestData.phone) {
      let phone = { phone: requestData.phone };
      query['$or'].push(phone);
    }
    let userHunt = await User.findOne(query);
    if (userHunt) {
      const message = `There is already a registered user with credentials ${requestData.email ? requestData.email : ''}  ${requestData.phone ? requestData.phone : ''}.`;
      console.log(message);
      return next(new APIError(message, httpStatus.BAD_REQUEST, true));
    }
    translate_meta.lan = loggedInUser.language_preference;
    translate_meta.key = "addAggregator.message";
    translate_meta.interpolation = {
      password: password,
    };
    if (!userHunt && requestData.email) {
      translate_meta.payload = {
        email: requestData.email,
        subject: "Appetizar Driver Aggregator registration",
      };
      await i18_translate(translate_meta, sendEmail);
    }
    const encryptPassword = await new User().encryptPassword(password);
    const user = await new User({
      name: requestData.name,
      country_name: requestData.country_name,
      country_code: requestData.country_code,
      dial_code: requestData.dial_code,
      phone: requestData.phone,
      user_languages: requestData.user_languages,
      currencies: requestData.currencies,
      email: requestData.email,
      password: encryptPassword,
      userType: "driver_aggregator",
      isActive: true,
    });
    const zero_decimal_country = [
      "BIF",
      "CLP",
      "DJF",
      "GNF",
      "JPY",
      "KMF",
      "KRW",
      "MGA",
      "PYG",
      "RWF",
      "UGX",
      "VND",
      "VUV",
      "XAF",
      "XOF",
      "XPF",
    ];
    zero_decimal_country.forEach((element) => {
      if (element == requestData.country_code) {
        user.currencies.zero_decimal_currencies = true;
      }
    });

    const addAggregators = await user.save();
    if (addAggregators) {
      addAggregators.password = undefined;
      let obj = resPattern.successPattern(
        httpStatus.CREATED,
        { user: addAggregators },
        "success"
      );
      return res.status(obj.code).json(obj);
    }
  } catch (error) {
    return next(new APIError(error.message, httpStatus.BAD_REQUEST, true));
  }
};

const deletedrivers = async (req, res, next) => {
  try {
    const perpage = req.body.perpage ? parseInt(req.body.perpage) : 10;
    const page = req.body.pageno ? req.body.pageno : 1;

    const driversid = req.params.driver_id;
    await User.findOneAndDelete({ _id: driversid });

    const alldrivers = await User.find({ userType: "driver" })
      .skip((page - 1) * perpage)
      .limit(perpage)
      .exec();

    let obj = resPattern.successPattern(
      httpStatus.CREATED,
      { Drivers: alldrivers, total: alldrivers.length, page: page },
      "success"
    );
    return res.status(obj.code).json(obj);
  } catch (error) {
    console.log(error);
    return next(new APIError(error.message, httpStatus.BAD_REQUEST, true));
  }
};

const updatedrivers = async (req, res, next) => {
  try {
    const requestData = req.body;
    const loggedInUser = req.user;
    const link =
      "https://appetizar.nyc3.digitaloceanspaces.com/1611485121216-default.jpg";
    const image_name = "1611485121216-default.jpg";
    let target_driver = await User.findById(requestData.user_id);
    if (!target_driver._id) {
      return next(new APIError("No data aviliable for the given driver input", httpStatus.BAD_REQUEST, true));
    }

    if (await User.findOne({ _id: { $ne: target_driver._id }, phone: reqData.phone })) {
      const message = `User already exist with phone: '${reqData.phone}'.`
      return next(new APIError(message, httpStatus.BAD_REQUEST, true));
    }

    if (requestData.email && await User.findOne({ _id: { $ne: target_driver._id }, email: reqData.email })) {
      const message = `User already exist with email: '${reqData.email}'.`
      return next(new APIError(message, httpStatus.BAD_REQUEST, true));
    }

    for (const key in requestData) {
      if (Object.hasOwnProperty.call(requestData, key)) {
        target_driver[key] = requestData[key];
      }
    }
    if (req.files && req.files.length > 0) {
      const file = req.files;

      target_driver.profile_image.image_name =
        file.profile_image[0].originalname;
      target_driver.profile_image.image_url = file.profile_image[0].location;
    } else {
      target_driver.profile_image.image_name = image_name;
      target_driver.profile_image.image_url = link;
    }
    if (loggedInUser.userType == "admin") {
      if (requestData.isRestaurantDrivers) {
        target_driver.isRestaurantDrivers = requestData.isRestaurantDrivers;
      }
      if (requestData.isAggregatorDrivers) {
        target_driver.isAggregatorDrivers = requestData.isAggregatorDrivers;
      }

      if (requestData.isRestaurantDrivers || requestData.isAggregatorDrivers) {
        target_driver.employer_id = requestData.employer_id;
      } else {
        target_driver.employer_id = loggedInUser._id;
      }
    } else {
      target_driver.employer_id = loggedInUser._id;
    }
    const result = await target_driver.save()
    let obj = resPattern.successPattern(
      httpStatus.CREATED,
      { drivers: result },
      "success"
    );
    return res.status(obj.code).json(obj);
  } catch (error) {
    console.log(error);
    return next(new APIError(error.message, httpStatus.BAD_REQUEST, true));
  }
};

const addowners = async (req, res, next) => {
  try {
    const loggedInUser = req.user;
    const requestData = req.body;
    const domain = requestData.restaurant_Name.replace(/ +/g, "").trim().toLowerCase() + ".appetizar.io"
    let userByEmail = await User.findOne({
      email: requestData.email,
    });
    if (userByEmail) {
      const message = `You have already registered with email: '${requestData.email}'.`;
      return next(new APIError(message, httpStatus.BAD_REQUEST, true));
    }
    if (!requestData.is_outlet && await User.findOne({ userType: "owner", hosting_Address: domain })) {
      const message = `The sub-domain ${domain} is already reserved. please try another value.`
      return next(new APIError(message, httpStatus.BAD_REQUEST, true));
    }
    const password = generator.generate({
      length: 10,
      numbers: true,
      uppercase: true,
      lowercase: true,
    });

    translate_meta.lan = loggedInUser.language_preference;
    translate_meta.key = "addOwner.message";
    translate_meta.interpolation = {
      password: password,
    };
    translate_meta.payload = {
      email: requestData.email,
      subject: "Appetizar restaurant registration",
    };
    let message =
      "Greetings from Appetizar, your account has been created successfully and your login password is: " +
      password +
      "\n(Please do not share)";

    await i18_translate(translate_meta, sendEmail);

    const encryptPassword = await new User().encryptPassword(password);
    const user = await new User({
      restaurant_Name: requestData.restaurant_Name,
      name: requestData.name,
      email: requestData.email,
      phone: requestData.phone,
      address: requestData.address,
      password: encryptPassword,
      userType: "owner",
      isActive: false,
      hosting_Address: domain,
      country_name: requestData.country_name,
      country_code: requestData.country_code,
      dial_code: requestData.dial_code,
      user_languages: requestData.user_languages,
      currencies: requestData.currencies,
    });
    const zero_decimal_country = [
      "BIF",
      "CLP",
      "DJF",
      "GNF",
      "JPY",
      "KMF",
      "KRW",
      "MGA",
      "PYG",
      "RWF",
      "UGX",
      "VND",
      "VUV",
      "XAF",
      "XOF",
      "XPF",
    ];
    zero_decimal_country.forEach((element) => {
      if (element == requestData.country_code) {
        user.currencies.zero_decimal_currencies = true;
      }
    });

    if (requestData.is_outlet) {
      user.is_outlet = requestData.is_outlet;
      user.master_brand = mongoose.Types.ObjectId(requestData.master_brand)
    } else {
      const filename =
        Date.now() + "-" + `${user.restaurant_Name}` + "-qrcode.png";
      const path = "./uploads/" + filename;

      await QRcode.toFile(path, `${user.hosting_Address}`)

      let url = await qrupload(filename, next);

      fs.unlinkSync(path);

      user.qrcode = url;
    }
    const stripe_customer = await create_customer(user);
    user.stripe_customer = stripe_customer;


    const addowners = await user.save();
    if (addowners) {
      addowners.password = undefined;
      let obj = resPattern.successPattern(
        httpStatus.CREATED,
        { user: user },
        "success"
      );
      return res.status(obj.code).json(obj);
    }
  } catch (error) {
    console.log(error);
    return next(new APIError(error.message, httpStatus.BAD_REQUEST, true));
  }
};

const addimages = async (req, res, next) => {
  try {
    const file = JSON.parse(JSON.stringify(req.files));
    //let addimages = await Site(req.body)
    const addimages = await Site.findOne({
      _id: mongoose.Types.ObjectId(req.body.id),
    });

    for (const key in file) {
      if (file.hasOwnProperty(key)) {
        const element = file[key][0];
        (addimages[key].image_name = element.originalname),
          (addimages[key].image_url = element.location);
      }
    }
    const saveimages = await addimages.save();
    let obj = resPattern.successPattern(
      httpStatus.CREATED,
      { image: saveimages },
      "success"
    );
    return res.status(obj.code).json(obj);
  } catch (error) {
    console.log(error);
    return next(new APIError(error.message, httpStatus.BAD_REQUEST, true));
  }
};

const getallimages = async (req, res, next) => {
  try {
    const id = req.params.imageid;
    const findallimages = await Site.findOne({ _id: id });
    let obj = resPattern.successPattern(
      httpStatus.CREATED,
      findallimages,
      "success"
    );
    return res.status(obj.code).json(obj);
  } catch (error) {
    console.log(error);
    return next(new APIError(error.message, httpStatus.BAD_REQUEST, true));
  }
};

//---------- Clients List At Admin Side  -----------
const getclients = async (req, res, next) => {
  try {
    const perpage = req.body.perpage ? parseInt(req.body.perpage) : 10;
    const page = req.body.pageno ? req.body.pageno : 1;
    const foundclients = await User.find(
      { userType: "client" },
      { name: 1, email: 1, phone: 1, createdAt: 1, isActive: 1 }
    )
      .limit(perpage)
      .skip((page - 1) * perpage)
      .sort({ _id: -1 })
      .exec();
    const clientslength = await User.find({ userType: "client" });
    let obj = resPattern.successPattern(
      httpStatus.CREATED,
      { Clients: foundclients, total: clientslength.length, page: page },
      "success"
    );
    return res.status(obj.code).json(obj);
  } catch (error) {
    console.log(error);
    return next(new APIError(error.message, httpStatus.BAD_REQUEST, true));
  }
};
const activedeactive = async (req, res, next) => {
  try {
    const id = req.body.userid;
    const state = req.body.isActive;
    const founduser = await User.findOneAndUpdate(
      { _id: id },
      { isActive: state },
      { new: true }
    );
    let obj = resPattern.successPattern(
      httpStatus.CREATED,
      { acivation: founduser },
      "success"
    );
    return res.status(obj.code).json(obj);
  } catch (error) {
    console.log(error);
    return next(new APIError(error.message, httpStatus.BAD_REQUEST, true));
  }
};
// ---------- restaurant List At Admin Side  -----------
const getrestaurantslist = async (req, res, next) => {
  try {
    const user = req.user;
    const reqData = req.body;
    let filter = { userType: "owner", is_outlet: reqData.only_outlets };
    if (reqData.only_outlets) {
      filter = { userType: "owner", master_brand: mongoose.Types.ObjectId(reqData.owner_id), is_outlet: true };
    }
    if (!reqData.only_outlets) {
      filter = { userType: "owner", is_outlet: false };
    }
    if (user.userType === 'driver_aggregator') {
      filter = { userType: "owner", aggregator_id: mongoose.Types.ObjectId(user._id) };
    }

    const perpage = reqData.perpage ? parseInt(reqData.perpage) : 10;
    const page = reqData.pageno ? reqData.pageno : 1;
    const totaldoc = await User.find(filter).countDocuments();;
    const foundrestaurant = await User.find(
      filter,
      {
        restaurant_Name: 1,
        name: 1,
        email: 1,
        isActive: 1,
        restaurant_image: 1,
        country_name: 1,
        address: 1,
        restaurant_city: 1,
        createdAt: 1,
        is_outlet: 1,
        qrcode: 1,
        master_brand: 1,
        aggregator_id: 1
      }
    )
      .populate('restaurant_city', 'city_name')
      .limit(perpage)
      .skip((page - 1) * perpage)
      .sort({ _id: -1 })
      .exec();

    let obj = resPattern.successPattern(
      httpStatus.CREATED,
      { Restaurants: foundrestaurant, total: totaldoc, page: page },
      "success"
    );
    return res.status(obj.code).json(obj);
  } catch (error) {
    console.log(error);
    return next(new APIError(error.message, httpStatus.BAD_REQUEST, true));
  }
};

const owner_self_delivery_list = async (req, res, next) => {
  try {
    // const user = req.user;
    // const params = req.params;
    // const query = req.query;
    const reqData = req.body;
    const users = await User.find({ use_driver_aggregator: false, userType: "owner" }).select('_id restaurant_Name').sort({ _id: -1 })
    let obj = resPattern.successPattern(httpStatus.OK, users, 'success');
    return res.status(obj.code).json(obj);
  } catch (e) {
    return next(new APIError(e.message, httpStatus.BAD_REQUEST, true));
  }
}

const getaggrgatorslist = async (req, res, next) => {
  try {
    let perpage = req.body.perpage ? parseInt(req.body.perpage) : 10;
    const page = req.body.pageno ? req.body.pageno : 1;
    const totaldoc = await User.find({ userType: "driver_aggregator" }).countDocuments();
    if (req.body.fetchAll) {
      perpage = totaldoc;
    }
    const foundrestaurant = await User.find(
      { userType: "driver_aggregator" },
      {
        restaurant_Name: 1,
        name: 1,
        email: 1,
        isActive: 1,
        profile_image: 1,
        createdAt: 1,
      }
    )
      .limit(perpage)
      .skip((page - 1) * perpage)
      .sort({ _id: -1 })
      .exec();

    let obj = resPattern.successPattern(
      httpStatus.CREATED,
      { Aggregators: foundrestaurant, total: totaldoc, page: page },
      "success"
    );
    return res.status(obj.code).json(obj);
  } catch (error) {
    console.log(error);
    return next(new APIError(error.message, httpStatus.BAD_REQUEST, true));
  }
};

//  ----- stripe onboarding controllers ---------

const create_stripe_user = async (req, res, next) => {
  try {
    // console.log('---create stripe users:---');
    const result = await creating_stripe_acc(req, res, next);
    let obj = resPattern.successPattern(httpStatus.OK, result, "success");
    return res.status(obj.code).json(obj);
  } catch (e) {
    return next(new APIError(e.message, httpStatus.BAD_REQUEST, true));
  }
};

const onboard_stripe_user = async (req, res, next) => {
  try {
    //  console.log('---on-board user---');
    const result = await on_boarding(req, res, next);

    // --- update owner profile ---

    let obj = resPattern.successPattern(httpStatus.OK, result, "success");
    return res.status(obj.code).json(obj);
  } catch (e) {
    return next(new APIError(e.message, httpStatus.BAD_REQUEST, true));
  }
};

const sign_in_stripe_user = async (req, res, next) => {
  try {
    const user = req.user;

    const strip_acc = await stripe_platform_sign_in(req.query);
    // --- update owner profile ---
    const user_data = await User.findByIdAndUpdate(
      user._id,
      {
        is_stripe_connected: true,
        is_Active: strip_acc.details_submitted ? strip_acc.details_submitted : false,
        stripe_account: {
          details_submitted: strip_acc.details_submitted,
          stripe_user_id: strip_acc.id,
          stripe_account_status: strip_acc.requirements
        },
      },
      { new: true }
    );

    let obj = resPattern.successPattern(
      httpStatus.OK,
      { strip_acc, user_data },
      "success"
    );
    return res.status(obj.code).json(obj);
  } catch (e) {
    return next(new APIError(e.message, httpStatus.BAD_REQUEST, true));
  }
};

const deauthorize_stripe_user = async (req, res, next) => {
  try {
    const user = req.user;

    const result = await deauth_stripe_account(req.query);
    const user_data = await User.findByIdAndUpdate(
      user._id,
      {
        is_stripe_connected: false,
        stripe_account: undefined,
        isActive: false,
      },
      { new: true }
    );
    let obj = resPattern.successPattern(
      httpStatus.OK,
      { result, user_data },
      "success"
    );
    return res.status(obj.code).json(obj);
  } catch (e) {
    return next(new APIError(e.message, httpStatus.BAD_REQUEST, true));
  }
};

const stripe_OAuth_response = async (req, res, next) => {
  try {
    const query = req.query;

    let obj = resPattern.successPattern(httpStatus.OK, query, "success");
  } catch (e) {
    console.log(e);
    // return next(new APIError(e.message, httpStatus.BAD_REQUEST, true));
  }
};

const get_stripe_response = async (req, res, next) => {
  try {
    const result = req.body;
    const message = "from server";

    let obj = resPattern.successPattern(
      httpStatus.OK,
      { result, message },
      "success"
    );
    return res.status(obj.code).json(obj);
  } catch (e) {
    console.log(e);
    return next(new APIError(e.message, httpStatus.BAD_REQUEST, true));
  }
};

const country_list = async (req, res, next) => {
  try {
    const list = await User.distinct("country_name", {
      userType: { $eq: "owner" },
    });
    let obj = resPattern.successPattern(httpStatus.OK, list, "success");
    return res.status(obj.code).json(obj);
  } catch (error) {
    return next(new APIError(e.message, httpStatus.BAD_REQUEST, true));
  }
};

module.exports = {
  addcity,
  editcity,
  deletecity,
  getallcity,
  getallcity_client,
  city_details,

  country_list,

  get_restaurant_images,
  get_restaurant_images_admin,
  profile_image,
  addPage,
  getAllPages,
  getPageDetails,
  updatepage,
  deletepage,

  userProfile,
  isRegisteredMail,
  addSiteInfo,
  site_preference,
  getsiteInfo,
  getsiteInfo_client,

  addLinks,
  getLinks,
  getAllLinks,

  updateProfile,
  userDetails,
  deleteUser,
  updateUser,

  getFavDish,
  addFavDish,
  removeFavDish,

  getFavRestaurant,
  addFavRestaurant,
  removeFavRestaurant,
  addimages,
  getallimages,
  add_restaurant_image,

  getdrivers,
  adddrivers,
  deletedrivers,
  updatedrivers,

  addowners,
  addAggregator,
  getclients,
  activedeactive,
  getrestaurantslist,
  getaggrgatorslist,
  owner_self_delivery_list,

  create_stripe_user,
  onboard_stripe_user,
  deauthorize_stripe_user,
  sign_in_stripe_user,
  get_stripe_response,
  stripe_OAuth_response,

  add_content,
  update_content

};
