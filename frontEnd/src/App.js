import React, { lazy, Suspense } from "react";
import {
  HashRouter as Router,
  Route,
  Switch,
  Redirect,
} from "react-router-dom";

// For Notification
import { errorToaster } from "./components/common/common-validation/common";

import instance from "./axios";
import requests from "./requests";
// For Redux Data
import { bindActionCreators } from "redux";
import { ActCreators } from "./redux/bindActionCreator";
import { connect } from "react-redux";

import { suspenseFallbackLoader } from "./components/common/Loader/Loader";

// import Home from "./components/common/Home/home";

import { ToastContainer } from 'react-toastify';

import 'react-toastify/dist/ReactToastify.css';

// const ExplorePlan = lazy(() => import("./components/Owner/SubscriptionPlan/ExplorePlan/ExpolrePlan")) ;
// import ExplorePlan from "./components/Owner/SubscriptionPlan/ExplorePlan/ExpolrePlan";


import { messaging } from "./firebase";
import "./i18n";
import i18next from "i18next";
import RestaurantRegistration from "./components/common/OwnerRgistration/ResturantRegistration";



const Home = lazy(() => import("./components/common/Home/home"));
const Login = lazy(() => import("./components/common/login/Login1.js"));
const Forgot = lazy(() => import("./components/common/forgotPassword/ForgotPassword"));
const ClientRegistration = lazy(() => import("./components/common/signUp/ClientRegistration"));
const ResetPassword = lazy(() => import("./components/common/resetPassword/ResetPassword"));
const AdminRoutes = lazy(() => import("./components/Admin/Admin"));
const Details = lazy(() => import("./components/OrderFile/Details"));
const OwnerRegistration = lazy(() => import("components/Admin/Pages/Restaurants/OwnerRegistration.js"));


const otpVerification = lazy(() => import("./components/common/otpVerification/otpVerification"));
const Profile = lazy(() => import("./components/MyProfile/Profile.js"));

// Diriver
const DriverRegistration = lazy(() => import("./components/Admin/Pages/Driver/DriverRegistration"));

// Addmin side City
const CityRegistration = lazy(() => import("components/Admin/Pages/City/CityRegistration"));
const CityEdit = lazy(() => import("components/Admin/Pages/City/CityRegistration"));

const PageNew = lazy(() => import("./components/Admin/Pages/PagesFooterLink/PageNew"));
const CityResturant = lazy(() => import("./components/common/Home/CityResturant"));
const Restaurant = lazy(() => import("./components/common/Home/ResturantDish"));
const EditVarient = lazy(() => import("./components/Owner/Menu/EditMenu/EditVarient"));
const UpdateItem = lazy(() => import("./components/Owner/Menu/EditMenu/UpdateItem"));
const AddNewVariant = lazy(() => import("./components/Owner/Menu/EditMenu/AddNewVariant"));
const EditNewVariant = lazy(() => import("./components/Owner/Menu/EditMenu/AddNewVariant"));
const PageEdit = lazy(() => import("./components/Admin/Pages/PagesFooterLink/PageEdit"));
const FooterLink = lazy(() => import("./components/Footers/Footer Link/FooterLink"));

const updateRestaurant = lazy(() => import("./components/Owner/Restaurants/Restaurants"));
//const updateRestaurant = lazy(() => import( "./components/Admin/Pages/Restaurants/UpdateRestaurant"));

const OrderOwner = lazy(() => import("./components/OrderFile/Details"));
const Checkout = lazy(() => import("./components/CheckoutPayment/Checkout"));
const ConnectStripe = lazy(() => import("./components/Owner/Finance/ConnectStripe"));
const InjectedCheckoutForm = lazy(() => import("./components/CheckoutPayment/Stripe/CheckoutForm"));
const OrderDetailClient = lazy(() => import("./components/OrderFile/Details"));

const NewSubscriptionPlan = lazy(() => import("components/Admin/Pages/SubScriptionPlan/NewSubscriptionPlan"));
const StripePlan = lazy(() => import("components/common/OwnerRgistration/StripePlan"));

const ExplorePlan = lazy(() => import("./components/Owner/SubscriptionPlan/StripeUser/ExplorePlan/ExpolrePlan"));

const AddUpdateAggregator = lazy(() => import("./components/Admin/Pages/Aggregator/AddUpdateAggregator"));

const Outlet = lazy(() => import("./components/Owner/Restaurants/Restaurants"));
const OutletList = lazy(() => import("components/Outlet/OutletList"));

const Index = lazy(() => import("components/Dashboard/Index"));




let token = null;
let get_fcm_registration_token = null;
const mapStateToProps = (state) => {
  token = state.token;
  get_fcm_registration_token = state.get_fcm_registration_token;
};
const mapDispatchToProps = (dispatch) => {
  return bindActionCreators(ActCreators, dispatch);
};

class App extends React.Component {
  constructor(props) {
    super(props);
  }

  componentDidMount = () => {
    const lang = localStorage.getItem("lang") || "en";
    i18next.changeLanguage(lang);
    if (token === null) {
      return null;
    }
    else {
      if (messaging) {
        Notification.requestPermission().then(() => {
          return messaging.getToken();
        })
          .then((fcmToken) => {
            this.setState(
              { fcm_registration_token: fcmToken, fcm_flag: false },
              async () => {
                const data = {
                  fcm_regi_token: true,
                  fcm_deprecated_token: get_fcm_registration_token,
                  fcm_registration_token: this.state.fcm_registration_token,
                };
                const response = await instance
                  .post(requests.fetchRefreshFcmToken, data, {
                    headers: {
                      Authorization: `Bearer ${token}`,
                    },
                  })
                  .catch((error) => {
                    let errorMessage = error.response.data.error.message;
                    errorToaster(errorMessage);
                  });
                if (response && response.data) {
                  const rToken = this.state.fcm_registration_token
                  this.props.GET_FCM_REGISTRATION_TOKEN(rToken);
                  const userData = response.data.data.user;
                  this.props.LOGIN_USER_DETAIL(userData);
                }
              }
            );
          })
          .catch((err) => {
            console.log(err.message);
          });
      }
    }
  };

  render() {
    const appLoader = suspenseFallbackLoader();
    // Register your service worker:


    return (
      <>
        <Router>
          <Suspense fallback={appLoader}>
            <Switch>
              {/* <Route exact path="/" render={(props) => <Home {...props} />} /> */}
              <Route exact path="/" render={
                (props) => {
                  if (token) {
                    return <Redirect to={
                      {
                        pathname: '/dashboard',
                      }
                    } />
                  } else {
                    return (<Login {...props} />)
                  }
                }
              } />
              <Route exact path="/login" render={
                (props) => {
                  if (token) {
                    return <Redirect to={
                      {
                        pathname: '/dashboard',
                      }
                    } />
                  } else {
                    return (<Login {...props} />)
                  }
                }
              }
              />

              <Route exact path="/plan/in" render={(props) => <StripePlan {...props} />} />
              <Route
                path="/forgot-password"
                render={(props) => <Forgot {...props} />}
              />
              <Route
                path="/signup"
                render={(props) => <ClientRegistration {...props} />}
              />
              <Route
                path="/reset-password"
                render={(props) => <ResetPassword {...props} />}
              />
              <Route path="/admin/orderdetail/:id" component={Details} />
              <Route
                exact
                path="/Create"
                render={(props) => <OwnerRegistration {...props} />}
              />
              <Route
                exact
                path="/registration/owner/selected-plan/:id"
                component={RestaurantRegistration}
              />
              <Route
                exact
                path="/registration/driver-aggregator/selected-plan/:id"
                component={RestaurantRegistration}
              />

              <Route exact path="/otp-verification" component={otpVerification} />
              <Route exact path="/profile" component={Profile} />

              <Route exact path="/checkout-form" component={InjectedCheckoutForm} />

              <Route
                exact
                path="/subscription-plan/create"
                render={(props) => <NewSubscriptionPlan {...props} />}
              />

              <Route exact path="/client/orders/detail/:id" component={OrderDetailClient} />
              <Route
                exact
                path="/cities/create"
                render={(props) => <CityRegistration {...props} />}
              />

              <Route exact path="/cart-checkout" render={(props) => <Checkout />} />

              <Route
                exact
                path="/pages/create"
                render={(props) => <PageNew {...props} />}
              />

              {/* <Suspense fallback={"..."}>  
            <Route
              path="/subscription-plan/explorePlan"
              render={(props) => <ExplorePlan {...props}/>}
            />
          </Suspense> */}
              <Route
                path="/subscription-plan/explorePlan"
                render={(props) => <ExplorePlan {...props} />}
              />
              <Route exact path="/pages/edit/:id" component={PageEdit} />
              <Route exact path="/pages/:id" component={FooterLink} />

              <Route exact path="/driver/edit/:id" component={DriverRegistration} />

              <Route
                exact
                path="/drivers/create"
                render={(props) => <DriverRegistration {...props} />}
              />


              <Route exact path="/city/edit/:id" component={CityEdit} />
              <Route exact path="/menu/item/edit/:id" component={UpdateItem} />
              <Route
                exact
                path="/menu/item/edit/variant/:id"
                component={EditVarient}
              />
              <Route
                exact
                path="/menu/item/edit/variant/create/:id"
                component={AddNewVariant}
              />
              <Route
                exact
                path="/menu/item/edit/variant/edit/:id"
                component={EditNewVariant}
              />
              <Route exact path="/city/:name" component={CityResturant} />
              <Route
                exact
                path="/restaurant/:restaurantName"
                component={Restaurant}
              />
              <Route exact path="/orders/detail/:id" component={OrderOwner} />
              <Route
                exact
                path="/update/restaurants/:id"
                component={updateRestaurant}
              />
              <Route exact path="/connect-stripe" component={ConnectStripe} />
              <Route
                exact
                path="/aggregator/update/:id"
                component={AddUpdateAggregator}
              />
              <Route
                exact
                path="/aggregator/create"
                component={AddUpdateAggregator}

              />
              <Route
                exact
                path="/outlets/create"
                component={Outlet}
              />
              <Route
                exact
                path="/outlets"
                component={OutletList}
              />
              <AdminRoutes />
              <Redirect from="/" to="/login" />
            </Switch>

          </Suspense>
        </Router>
        <ToastContainer />
      </>
    );
  }
}
export default connect(mapStateToProps, mapDispatchToProps)(App);
