const requests= {
    fetchLogin:'/auth/login',
    fetchLogout:'/auth/logout/',

    fetchClientRegister:"/auth/register",
    fetchForgotPassword:'/auth/password/forgot',
    fetchOTPverification:'/auth/password/verify',
    fetchResetPassword:'/auth/password/reset',

    fetchRestuarantRegistration:'/auth/register',
    // fetchRestuarantRegistration:'/auth/register', Live

    fetchUpdateProfile:'/user/update',
    fetchChangePassword: '/auth/password/change',
    fetchSocialAuthentication: '/auth/social',
    fetchCityOnHome: '/user/getallcity_client',
    fetchNearByRestaurants: '/service/restaurants_near_by', 
    fetchRestaurantsInCity: '/service/city',

    fetchGetUserProfileData: '/user/profile',
    
    fetchRestaurantDetails: '/service/restaurant',
    fetchRestaurantMenu: "/restaurant/menu",
    fetchAddNewCategory:"/restaurant/add_menu",
    fetchUpdateCategory:"/restaurant/update_menu",
    fetchDeleteMenuCategory: "/restaurant/delete_menu_category/",
    fetchAddDish: "restaurant/menu/add_dish",
    fetchItemDetail:"/service/restaurant/dish_details",
    fetchGetDishItem : "/restaurant/menu/dish_details",
    fetchUpdateDishItem : "/restaurant/menu/update_dish",
    fetchDishOption:"service/menu/get_variant_op",
    fetchDishVariantOption: "/restaurant/menu/get_variant_op",
    fetchAddNewVariantOption: "/restaurant/menu/add_variant_op",
    fetchupdateNewVariantOption: "/restaurant/menu/update_variant_op",
    fetchDeleteVariantOption: "restaurant/menu/delete_variant_op/",
    fetchAddNewVariant: "/restaurant/menu/add_variant",
    fetchGetVariant: "/restaurant/menu/get_variant",
    fetchDeleteVariant: "/restaurant/menu/delete_variant/",

    fetchMyOrdersForClient:"/order/my_orders",
    
    fetchAddExtras: "/restaurant/menu/add_extras",
    fetchDeleteExtras: "/restaurant/menu/delete_extras/",
    fetchupdateNewVariant: "/restaurant/menu/update_variant",
    fetchGetExtras: "/restaurant/menu/get_extras",
    fetchUpdateExtras: "/restaurant/menu/update_extras",
    fetchSiteInfo:"/user/site_info",
    fetchAddLoginPageInfo: "/user/add-site-content",
    fetchGetCites: "/service/get_cities",
    fetchUpdateSiteInfo:"/user/site_add",
    fetchSiteInfoForClient:"/user/site_info_client",
    fetchLinkInfoForAdmin:"/user/links_info",
    fetchUpdateLinkData:"/user/add_links",
    fetchDeleteDishInOwner: "/restaurant/menu/dish/",
    fetchRestaurantDetailsAtAdmin: "/user/get_restaurants",
    fetchLinkDataForClient:"/user/get_all_links",
    fetchCityForAdmin:"/user/get_all_city",
    fetchAddCity:"/user/add_city",
    fetchUpdateCity:"/user/edit_city",
    fetchDeleteCity:"/user/del_city",
    fetchGetAllPages:"/user/get_pages",
    fetchActiveDeactivate:"/user/active_deactive",
    fetchAddPage:"/user/add_page",
    fetchDeletePage:"/user/delete_page",
    fetchUpdatePage:"/user/update_page_details",
    fetchGetAllPagesForClient:"/user/get_client_pages",
    fetchGetPageDetails:"/user/get_page_details",
    fetchGetPagesDetailForClient:"/user/get_page_client_details",
    fetchUpdateOwnerProfileByAdmin: "/user/update_user",

    fetchOrdersForOwner: "/order/owner_orders",
    
    fetchUpdateOrdersForOwner: "/order/update_order",
    
    fetchUpdateDeliverStatus:"/order/delivery-request",

    fetchOrderDetail: "/order/order_details",
    
    fetchOrdersForAdmin:"/order/admin_orders",

    fetchClientForAdmin:"/user/get_clients",
    fetchDriverForAdmin:"/user/get_drivers",
    fetchAddDriverFromAdmin:"/user/add_drivers",
    fetchDeleteDriverFromAdmin:"/user/del_drivers",
    fetchUpdateDriverFromAdmin:"/user/update_drivers",
    fetchLiveOrdersForAdmin: "/order/admin_live_orders",
    fetchLiveOrdersForOwner: "/order/owner_live_orders",
    fetchReviewForAdmin:"/order/get_reviews_admin",
    fetchReviewDeleteFromAdmin: "/order/del_review",
    fetchOwnerReview:"/order/get_review",
    fetchDashBoardDetail : "/order/owner_dashboard",
    fetchGetAllDriverForOwner: "order/get_drivers_owners",
    fetchFinanceOrder:"/order/admin_finance",
    fetchCartInfo:"/cart/",
    fetchAddToCart:"/cart/add_cart",
    fetchDeleteCart:"/cart/delete_cart", // live
    fetchAddAddress:"/service/add_address",
    fetchFinanceOwner: "/order/owner_finance",
    fetchGetDriverOwner: "/order/get_drivers_owners",
    fetchAddDriverFromOwner: "/user/add_drivers_owner",
    fetchEditDriverFromOwner: "/user/update_user_drivers",
    fetchDeleteDriverFromOwner: "/order/del_drivers_owner/",
    fetchPlaceOrder:"/order/raz_place_order",
    fetchCancelOrder:"/order/cancel_order",  //Live
    fetchAdminDashboard: "/order/admin_dashboard",
    fetchConnectStripeOAuth: "/user/stripe/sign-in-user",
    fetchAddressList:"/service/get_address",
    fetchAddImage:"/user/add_images",
    fetchDeleteAddress:"/service/delete_address",
    fetchDeactiveStripeOAuth:"/user/stripe/deauth_acc",
    fetchAllDefaultImage: "/user/getallimages/5fbcfc737cf0606e8d4f9938",
    fetchAddRestImage: "/user/add_rest_images",
    fetchStripPlaceOrder:"/order/stripe_place_order", // live
    fetchAddrestViaAdminImage: "/user/add_rest_images_via_admin",
    fetchCityDetail:"/user/city_details/",
    fetchLanguagePreference:"/user/site_preference",

    fetchDriverOrder: "/order/driver_orders",
    
    fetchUpdateOrdersForDriver:"/order/update_order",
    fetchRefreshFcmToken: "auth/refreshtoken",
    fetchCountry:"/user/country_list",
    fetchProfileImage:"/user/profile_image",
    addOwnerViaAdmin: "user/add_owners",
    
    fetchRazorpayAddNewPlan: "/plans/create_razor_plan",
    fetchUpdateRazorpayPlanAdmin:"/plans/update_razor_plan",
    fetchRazorpayDisablePlan: "/plans/disable_razor_plan",
    fetchCreateRazorpaySubscription: "/plans/razor-subscribe",

    fetchRazorpayOnetimeSubscription: "/plans/razor-ot-subscribe",
    fetchRazorpayOnetimeUnsubscribe: "/plans/razor-ot-unsubscribe",

    
    fetchAddNewPlan:"/plans/create_stripe_plan",
    // fetchPlan:"/plans/fetch_stripe_plans",
    fetchPlan:"/plans/fetch_plans",
    fetchCountryCode:"/plans/fetch_plans_country",
    fetchSubscribePlan: "/plans/subscribe",
    fetchGetParticularOwnerSubscriptionPlan:"/plans/get_subscription",
    fetchPreviewPlanDetail:"/plans/preview_next_subscription",
    fetchChangeSubscription:"/plans/change_subscription",
    fetchUnsubscribePlan:"/plans/unsubscribe",
    fetchUpdateSubscriptionPlan:"/plans/update_stripe_plan",
    fetchDisablePlan:"/plans/disable_stripe_plan",

    fetchPlanFromOwner:"/plans/stripe_plan",

    fetchGetAllCoupon:"/coupon/get-coupons",
    fetchAddCoupon:"/coupon/add-coupons",
    fetchArchiveCoupon:"/coupon/archive-coupons",
    fetchUpdateCoupon:"/coupon/update-coupons",

    fetchGetParticularDriverAggregatorSubscriptionPlan:"/plans/get_subscription_aggregator",
    fetchAddDriverForAggregator:"/user/add_drivers_aggregator",
    fetchUpdateDriverForAggregator:"/user/update_aggregator_drivers",
    fetchDriverListForAggregator:"/order/get_drivers_aggregator",
    fetchDeleteDriverFromAggregator:"/order/del_drivers_aggregator/",

    fetchAggregatorDetailsForAdmin:"/user/get_aggregators",
    fetchUpdateAggregatrProfileByAdmin: "/user/update_user",
    fetchAggregatorRegistration:'/user/add_aggregator',
    fetchDeleteDriverFromAdmin:"/order/del_drivers_admin/",
    FetchRestaurantForAggregator: "/user/get_restaurants_aggregator",
    FetchGetAggregatorOrders : "/order/aggregator_orders",
    FetchLiveOrdersForAggregator: "/order/aggregator_live_orders",
    FetchDriverAggregatorDashBoard: "/order/aggregator_dashboard",

    fetchCashOrder:"/order/cash_place_order",
    fetchAddOutletRegister: "/auth/register",
    fetchAllCity: "/service/",
    fetchOutlets: "/user/get_outlets",
    fetchCloneMenuItemForOutlet: "/restaurant/menu-items-cloning",
    fetchUpdateOutletProfile: "/user/update_outlet",
    fetchDishOutlet:"/restaurant/list-outlet-menu-availability",
    fetchUpdateMenuAvailability: "/restaurant/menu-availability",

    fetchCloneCateogyForOutlet: "/restaurant/menu-category-cloning",

    fetchUpdateTableCapacity: "/reservation/add-reservation",
    fetchGetTableCapacity: "/reservation/get-reservations",
    fetchUpdateTableMessage: "/reservation/notify-for-service",

    fetchGetRestaurantForAddDriver:"/user/owners_self_delivery",
    fetchShowLoginContent:"/user/site_info",

    fetchGetTourForAdmin:"/tour/gettourcontent_admin",
    fetchAddTourForAdmin: "/tour/tourcontent",
    fetchDeleteTourForAdmin: "/tour/deletetour",
    
    fetchGetTourHintContentForOwner: "/tour/gettourcontent_owner",
    fetchGetTourHintContentForAggregator: "/tour/gettourcontent_aggregator",
    
    fetchUnsubscribeRazorpayPlan: "/plans/razor-unsubscribe",
    fetchUpdateRazorpayPlan: "/plans/razor-change-subscription",

    isEmailRegisterdOrNot: "/user/registered-mail"
    


};

export default requests;
