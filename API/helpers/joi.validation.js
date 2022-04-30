const Joi = require("joi");

const Working_hours = Joi.object({
  weekDay: Joi.number().allow(),
  openingTime: Joi.string()
    .regex(/^([0-9]{2})\:([0-9]{2})$/)
    .allow(""),
  closingTime: Joi.string()
    .regex(/^([0-9]{2})\:([0-9]{2})$/)
    .allow(""),
});

const myCart = Joi.object({
  menu_item_id: Joi.string().required(),
  menu_item_qty: Joi.number().required(),
  extras_id: Joi.array().items(Joi.string().allow("")).allow(),
  variant_id: Joi.array().items(Joi.string().allow("")).allow(),
});

const extras = Joi.object({
  name: Joi.string().required(),
  price: Joi.number().required(),
});

const variants_OP = Joi.object({
  variant_op_id: Joi.string().required(),
  option_value: Joi.string().allow(""),
});

const variants = Joi.object({
  variant_id: Joi.string().required(),
});

const userParamsValidation = {
  createUser: {
    body: {
      name: Joi.string().required(),
      userType: Joi.string()
        .valid("admin", "client", "driver", "owner", "driver_aggregator")
        .default("client")
        .insensitive(),
      restaurant_Name: Joi.string().when("userType", {
        is: "owner",
        then: Joi.string().required(),
      }),
      email: Joi.string()
        .email({ minDomainSegments: 2, tlds: { allow: ["com", "net"] } })
        .required(),
      password: Joi.string().required(),
      phone: Joi.string(),
      address: Joi.string(),
      location: Joi.object({
        latitude: Joi.string(),
        longitude: Joi.string(),
      }),
      currencies: Joi.object({
        code: Joi.string().allow(""),
        curr_name: Joi.string().allow(""),
        symbol: Joi.string().allow(""),
      }).allow(""),
      user_languages: Joi.array().required(),
    },
  },
  updateUser: {
    body: {
      name: Joi.string().required(),
      // restaurant_Name: Joi.string().required(),
      userType: Joi.string()
        .valid("admin", "client", "driver", "owner", "driver_aggregator")
        .insensitive(),
      restaurant_Name: Joi.string().when("userType", {
        is: "owner",
        then: Joi.string().required(),
      }),
      email: Joi.string()
        .email({ minDomainSegments: 2 })
        .required(),
      phone: Joi.string(),
      hosting_Address: Joi.string().when("userType", {
        is: "owner",
        then: Joi.string().required(),
      }),
      address: Joi.array(),
      Working_hours: Joi.array().items(Working_hours),
      currencies: Joi.object({
        code: Joi.string().allow(""),
        curr_name: Joi.string().allow(""),
        symbol: Joi.string().allow(""),
      }).allow(""),
      user_languages: Joi.array(),
      location: Joi.object().when('userType', {
        is: 'owner', then: Joi.object({
          type: Joi.string().required().default('Point'),
          coordinates: Joi.array().items(Joi.number().required())
        }).required()
      }),
      // delivery_area: Joi.object({
      //   type:Joi.string().required().default('Point'),
      //   coordinates:Joi.array().items(Joi.number().required())
      // }).when('userType',{is:'owner', then: Joi.object().required()}),
    },
  },
  updateUser_via_admin: {
    body: {
      address: Joi.array(),
      Working_hours: Joi.array().items(Working_hours),
    },
  },
  favDish: {
    body: {
      dish_id: Joi.string().required(),
    },
  },
  site_preferences: {
    body: {
      language_preference: Joi.string().default("en"),
    },
  },
  favRestaurant: {
    body: {
      owner_id: Joi.string().required(),
    },
  },
  isEmailRegistered: {
    body: {
      email: Joi.string().email({ minDomainSegments: 2 }).required(),
      userType: Joi.string().valid(['client','owner','driver_aggregator','driver']).required(),
    },
  },
};

const menuValidation = {
  addMenu: {
    body: {
      category: Joi.string().required(),
    },
  },
  updateMenu: {
    body: {
      category_id: Joi.string().required(),
      category: Joi.string().required(),
    },
  },
  deleteMenu: {
    body: {
      // owner_id: Joi.string().required(),
    },
  },
  deleteMenuCategory: {
    body: {
      // category_id: Joi.string().required(),
    },
  },
  getDish: {
    body: {
      dish_id: Joi.string().required(),
    },
  },
  addDish: {
    body: {
      item_name: Joi.string().required(),
      item_description: Joi.string().required(),
      item_price: Joi.number().required(),
      vat_percentage: Joi.number().allow(),
      // extras: Joi.array().items(extras).allow(),
      // variants: Joi.array().items(variants).allow()
    },
  },
  updateDish: {
    body: {
      item_name: Joi.string().required(),
      item_description: Joi.string().required(),
      item_price: Joi.number().required(),
      vat_percentage: Joi.number().required(),
      // extras: Joi.array().items(extras).allow(),
      // variants: Joi.array().items(variants).allow()
    },
  },
  deleteDish: {
    body: {
      // dish_id: Joi.string().required(),
    },
  },
  getVariantOp: {
    body: {
      dish_id: Joi.string().required(),
      variant_op_id: Joi.string().allow(""),
    },
  },
  addVariantOp: {
    body: {
      dish_id: Joi.string().required(),
      option_name: Joi.string().required(),
      // option_values: Joi.array().items(Joi.string()).required()
    },
  },
  updateVariantOp: {
    body: {
      dish_id: Joi.string().required(),
      variant_op_id: Joi.string().required(),
      option_name: Joi.string().required(),
      // option_values: Joi.array().items(Joi.string()).required()
    },
  },
  deleteVariantOp: {
    body: {
      // dish_id: Joi.string().required(),
      // variant_option_id: Joi.string().required(),
    },
  },
  getVariant: {
    body: {
      dish_id: Joi.string().required(),
      variant_id: Joi.string().allow(""),
    },
  },
  addVariant: {
    body: {
      dish_id: Joi.string().required(),
      variant_op_id: Joi.string().required(),
      variant_name: Joi.string().required(),
      price: Joi.number().required(),
      // option_values: Joi.array().items(variants_OP).required()
    },
  },
  updateVariant: {
    body: {
      variant_id: Joi.string().required(),
      variant_op_id: Joi.string().required(),
      variant_name: Joi.string().required(),
      price: Joi.number().required(),
      // option_values: Joi.array().items(variants_OP).required()
    },
  },
  deleteVariant: {
    body: {
      // dish_id: Joi.string().required(),
      // variant_option_id: Joi.string().required(),
    },
  },

  getExtras: {
    body: {
      dish_id: Joi.string().required(),
      extras_id: Joi.string().allow(""),
    },
  },
  addExtras: {
    body: {
      dish_id: Joi.string().required(),
      extras_name: Joi.string().required(),
      price: Joi.number().required(),
      // variants: Joi.array().items(variants).allow()
    },
  },
  updateExtras: {
    body: {
      dish_id: Joi.string().required(),
      extras_id: Joi.string().required(),
      extras_name: Joi.string().required(),
      price: Joi.number().required(),
      // variants: Joi.array().items(variants).required()
    },
  },
  deleteExtras: {
    body: {
      // dish_id: Joi.string().required(),
      // variant_option_id: Joi.string().required(),
    },
  },
};

const authParamsValidation = {
  mobi_registration: {
    body: {
      phone: Joi.string().required(),
      password: Joi.string().required(),
      country_name: Joi.string().required(),
      country_code: Joi.string().required(),
      dial_code: Joi.string().required(),
      userType: Joi.string()
        .valid("admin", "client", "driver", "owner", "driver_aggregator")
        .insensitive()
        .required().default("client"),

    },
  },
  verifyOTP: {
    body: {
      phone: Joi.string().required(),
      otp: Joi.number().required(),
    },
  },
  registerUser: {
    body: {
      userId: Joi.string()
        .regex(/^[0-9a-fA-F]{24}$/, "service Id")
        .required(),
      email: Joi.string()
        .email({ minDomainSegments: 2, tlds: { allow: ["com", "net"] } })
        .required(),
      password: Joi.string().required(),
      phone: Joi.string(),
      userType: Joi.string().valid("admin").default("admin").insensitive(),
    },
  },
  socialAuth: {
    body: {
      socialId: Joi.string().required(),
      socialProvider: Joi.string().required(),
      email: Joi.string(),
      name: Joi.string(),
      userType: Joi.string()
        .valid("admin", "client", "driver", "owner", "driver_aggregator")
        .insensitive()
        .required(),
    },
  },
  login: {
    body: {
      email: Joi.string().email().allow(''),
      phone: Joi.string().allow(''),
      password: Joi.string().required(),
    },
  },
  logoutUser: {
    body: {
      fcm_regi_token: Joi.boolean().required(),
      fcm_registration_token: Joi.string().allow(""),
    },
  },
  changePassword: {
    body: {
      oldPassword: Joi.string().required(),
      newPassword: Joi.string().required(),
    },
  },
  forgotPassword: {
    body: {
      email: Joi.string().required(),
    },
  },
  reset_otp_verify: {
    body: {
      OTP: Joi.string().required(),
    },
  },
  resetPassword: {
    body: {
      email: Joi.string().required(),
      password: Joi.string().required(),
    },
  },
};
//["{{$randomStreetAddress}}"]
const serviceValidation = {
  nearbyRestaurants: {
    body: {
      longitude: Joi.number().allow(null),
      latitude: Joi.number().allow(null),
      queryString: Joi.string().allow(""),
      items_in_page: Joi.number().required(),
      page_number: Joi.number().required(),
    },
  },
  lookup_dish: {
    body: {
      queryString: Joi.string().allow(""),
    },
  },
  restaurantDetails: {
    body: {
      owner_id: Joi.string().allow(""),
      items_in_page: Joi.number().allow("").default(5),
      page_number: Joi.number().allow("").default(1),
      longitude: Joi.number().allow(null).default(null),
      latitude: Joi.number().allow(null).default(null),
      hosting_Address: Joi.string().required(),
      menu_category_id: Joi.string().allow(""),
    },
  },
  getDish: {
    body: {
      dish_id: Joi.string().required(),
    },
  },
  inCity: {
    body: {
      city: Joi.string().required(),
    },
  },
};

const reviewsValidation = {
  order_rating: {
    body: {
      restaurant_ratings: Joi.number().integer().max(5).min(1),
      comments: Joi.string().allow(""),
      dish_review: Joi.array().items(Joi.object({
        dish_rating: Joi.number().integer().max(5).min(1),
        dish_id: Joi.string().required(),
      })).allow(""),
      owners_id: Joi.string().required(),
      orders_id: Joi.string().required(),
    },
  },
};

const reservationValidation = {
  get_reservations: {
    body: {
      owner_id: Joi.string().required(),
    },
  },
  notify_for_service: {
    body: {
      table: Joi.number().required(),
      owner_id: Joi.string().required(),
      arrangement_id: Joi.string().required(),
      // message: Joi.array().items(Joi.string()).required(),

      // client_id: Joi.string().required(),
    },
  },
  add_reservation: {
    body: {
      capacity: Joi.number().required(),
      floor: Joi.number().allow(null).default(0),
      sitingOf: Joi.number().allow(null).default(2),
      luxury: Joi.string().allow("").default("Non AC").valid("AC", "Non AC"),
      owner_id: Joi.string().required(),
    },
  },
  cancel_booking: {
    body: {
      reservation_id: Joi.string().required(),
      reservation_index: Joi.number().required(),
      client_id: Joi.string().required(),
    },
  },
};

const cartValidation = {
  addtoCart: {
    body: {
      myCart: Joi.array().items(myCart).required(),
      sub_total: Joi.number().allow().required(),
      owner_id: Joi.string().required(),
    },
  },
  updateCart: {
    body: {
      myCart: Joi.array().items(myCart).required(),
      sub_total: Joi.number().allow().required(),
    },
  },
  deleteCart: {
    body: {
      // owner_id: Joi.string().required(),
    },
  },
};

const orderValidation = {
  placeOrder: {
    body: {
      // owner_id: Joi.string().required(),
      items: Joi.array().required(),
      total_items: Joi.number().required(),
      sub_total: Joi.number().required(),
      total: Joi.number().required(),
      delivery_type: Joi.string().valid(
        "Dine",
        "Deliver",
        "Pickup"
      )
        .required(),
      is_cod: Joi.bool().required(),
      client_name: Joi.string().when("is_cod", {
        is: "false",
        then: Joi.string().required(),
      }),
      card_number: Joi.number().when("is_cod", {
        is: "false",
        then: Joi.number().required(),
      }),
      eta_upper_bound: Joi.string().allow(""),
      eta_lower_bound: Joi.string().allow(""),
      delivery_address: Joi.string().allow(""),
      comment: Joi.string().allow(""),
    },
  },
  updateOrder: {
    body: {
      order_id: Joi.string().required(),
      last_status: Joi.string()
        .valid(
          "Just Created",
          "Accepted by Restaurant",
          "Rejected by Restaurant",
          // "Accepted by Admin",
          // "Rejected by Admin",
          // "Assigned to Driver",
          // "Assigned to Aggregator",
          // "Broadcast to Drivers",
          // "Accepted by Driver",
          "Prepared",
          "Served"
          // "Picked Up",
          // "Delivered"
        )
        .default("Just Created")
        .required(),
    },
  },
  delivery_request: {
    body: {
      order_id: Joi.string().required(),
      delivery_status: Joi.string()
        .valid(
          // "Accepted by Restaurant",
          // "Rejected by Restaurant",
          // "Accepted by Admin",
          // "Rejected by Admin",
          // "Prepared",
          "Assigned to Aggregator",
          "Assigned to Driver",
          "Broadcast to Drivers",
          "Accepted by Driver",
          "Picked Up",
          "Delivered"
        )
        .required(),
      driver_id: Joi.string().allow(null),
    },
  },
  standBy_order: {
    body: {
      employer_id: Joi.string().required(),
      delivery_status: Joi.string()
        .valid(
          // "Accepted by Restaurant",
          // "Rejected by Restaurant",
          // "Accepted by Admin",
          // "Rejected by Admin",
          // "Prepared",
          "Pending",
          "Assigned to Aggregator",
          "Assigned to Driver",
          "Broadcast to Drivers",
          "Accepted by Driver",
          "Picked Up",
          "Delivered"
        )
        .required(),
      isAggregatorDrivers: Joi.boolean().required(),
    },
  },
  ongoing_orders: {
    body: {
      driver_id: Joi.string().required(),
    },
  },
  cancelOrder: {
    body: {
      order_id: Joi.string().required(),
      is_canceled: Joi.bool().allow(),
      Order_cancel_time: Joi.string().allow(""),
      last_status: Joi.string().valid("Canceled by Client").required(),
    },
  },
  orderDetails: {
    body: {
      order_id: Joi.string().required(),
    },
  },
  myOrders: {
    body: {
      startDate: Joi.date().allow(""),
      endDate: Joi.date().allow(""),
    },
  },
  ownerOrders: {
    body: {
      startDate: Joi.date().allow(""),
      endDate: Joi.date().allow(""),
      client_id: Joi.string().allow(""),
      driver_id: Joi.string().allow(""),
    },
  },
  aggregatorOrders: {
    body: {
      startDate: Joi.date().allow(""),
      endDate: Joi.date().allow(""),
      client_id: Joi.string().allow(""),
      driver_id: Joi.string().allow(""),
    },
  },
  driverOrders: {
    body: {
      startDate: Joi.date().allow(""),
      endDate: Joi.date().allow(""),
      owner_id: Joi.string().allow(""),
    },
  },
  adminOrders: {
    body: {
      startDate: Joi.date().allow(""),
      endDate: Joi.date().allow(""),
      owner_id: Joi.string().allow(""),
      client_id: Joi.string().allow(""),
      driver_id: Joi.string().allow(""),
    },
  },
  ownerFinance: {
    body: {
      startDate: Joi.date().allow(""),
      endDate: Joi.date().allow(""),
      client_id: Joi.string().allow(""),
      driver_id: Joi.string().allow(""),
    },
  },
  adminFinance: {
    body: {
      startDate: Joi.date().allow(""),
      endDate: Joi.date().allow(""),
      owner_id: Joi.string().allow(""),
      client_id: Joi.string().allow(""),
      driver_id: Joi.string().allow(""),
    },
  },
};

const siteValidation = {
  siteInfo: {
    body: {
      site_name: Joi.string().required(),
      delievery_Cost_fixed: Joi.number().required(),
      title: Joi.string().allow(""),
      subtitle: Joi.string().allow(""),
      site_Description: Joi.string().allow(""),
    },
  },
  links: {
    body: {
      facebook_link: Joi.string().uri().allow(""),
      instagram_link: Joi.string().allow(""),
      info_title: Joi.string().allow(""),
      info_subtitle: Joi.string().allow(""),
      playstore_link: Joi.string().allow(""),
      appstore_link: Joi.string().allow(""),
    },
  },
  content: {
    body: {
      site_id: Joi.string().required(),
      site_content: Joi.array().items(Joi.string()).required(),
    },
  },
};

const planValidation = {
  create_plan: {
    body: {
      title: Joi.string().required(),
      content: Joi.string().required(),
      country: Joi.string().required(),
      country_code: Joi.string().required(),
      currency: Joi.string().required(),
      currency_symbol: Joi.string().required(),
      unit_amount: Joi.number().required(),
      interval: Joi.string()
        .valid("day", "week", "month", "year")
        .default("month")
        .required(),
      interval_count: Joi.number().required(),
      is_active: Joi.boolean().default(true),
    },
  },
  update_plan: {
    body: {
      plan_id: Joi.string().required(),
      title: Joi.string().required(),
      content: Joi.string().required(),
      stripe_product: Joi.object({
        id: Joi.string().required(),
      }),
    },
  },
  get_plan: {
    body: {
      plan_id: Joi.string().required(),
    },
  },
  fetch_plans: {
    body: {
      country: Joi.string().required(),
    },
  },
  disable_plan: {
    body: {
      plan_id: Joi.string().required(),
      is_active: Joi.boolean().default(false),
      message: Joi.string().required(),
      stripe_product: Joi.object({
        id: Joi.string().required(),
      }),
    },
  },
  create_subscription: {
    body: {
      plan_id: Joi.string().required(),
      customer: Joi.string().required(),
      paymentMethodId: Joi.string().required(),
      price: Joi.string().required(),
    },
  },
  cancel_subscription: {
    body: {
      is_subscription_schedule: Joi.boolean().required(),
      cancel_now: Joi.boolean().required(),
      cancellation_reason: Joi.string().required(),
    },
  },
  update_subscription: {
    body: {
      change_now: Joi.boolean().required(),
      new_price: Joi.string().required(),
      new_plan_id: Joi.string().required(),
    },
  },
};

const razPlanValidation = {
  create_plan: {
    body: {
      title: Joi.string().required(),
      content: Joi.string().required(),
      country: Joi.string().required(),
      country_code: Joi.string().required(),
      currency: Joi.string().required(),
      currency_symbol: Joi.string().required(),
      unit_amount: Joi.number().required(),
      interval: Joi.string()
        .valid("daily", "weekly", "monthly", "yearly")
        .default("monthly")
        .required(),
      interval_count: Joi.number().required(),
      // total_count: Joi.number().required(),
      is_active: Joi.boolean().default(true),
    },
  },
  update_plan: {
    body: {
      plan_id: Joi.string().required(),
      title: Joi.string().required(),
      content: Joi.string().required(),
      // trial_days: Joi.number().required(),
    },
  },
  get_plan: {
    body: {
      plan_id: Joi.string().required(),
    },
  },
  fetch_plans: {
    body: {
      country: Joi.string().required(),
    },
  },
  disable_plan: {
    body: {
      plan_id: Joi.string().required(),
      is_active: Joi.boolean().default(false),
      message: Joi.string().required(),
    },
  },
  create_subscription: {
    body: {
      plan_id: Joi.string().required(),
      // customer: Joi.string().required(),
      // paymentMethodId: Joi.string().required(),
      // start_at: Joi.string().required(),
    },
  },
  cancel_v1_subscription: {
    body: {
      subscription_id: Joi.string().required(),
    },
  },
  cancel_subscription: {
    body: {
      // subscription_id: Joi.string().required(),
      cancel_at_cycle_end: Joi.boolean().required(),
      cancellation_reason: Joi.string().allow(''),
    },
  },
  update_subscription: {
    body: {
      new_plan_id: Joi.string().required(),
      schedule_change_at: Joi.string().required(),
    },
  },
};

const couponValidation = {
  addCoupon: {
    body: {
      owner_id: Joi.string().required(),
      coupon_code: Joi.string().required(),
      coupon_terms: Joi.string().required(),
      coupon_weight: Joi.number().required(),
      coupon_threshold: Joi.number().required(),
    },
  },
  updateCoupon: {
    body: {
      coupon_id: Joi.string().required(),
      coupon_code: Joi.string().required(),
      coupon_terms: Joi.string().required()
    },
  },
  archiveCoupon: {
    body: {
      coupon_id: Joi.string().required(),
    },
  },
  getCoupon: {
    body: {
      owner_id: Joi.string().required(),
      userType: Joi.string().valid("owner", "client").required(),
    },
  },
};


module.exports = {
  siteValidation,
  userParamsValidation,
  authParamsValidation,
  menuValidation,
  serviceValidation,
  cartValidation,
  orderValidation,
  reviewsValidation,
  reservationValidation,
  planValidation,
  razPlanValidation,
  couponValidation
};
