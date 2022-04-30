import React, { Component } from "react";
import "./HomeHeader.css";
import Button from "reactstrap/es/Button";
import { FormGroup, Input } from "reactstrap/es";
import { Link } from "react-router-dom";

import instance from "../../../axios";
import requests from "../../../requests";
import i18next from "i18next";

import { bindActionCreators } from "redux";
import { ActCreators } from "../../../redux/bindActionCreator";
import { connect } from "react-redux";

import CartSlidePen from "../header/SlidePen";
import { PopoverBody, UncontrolledPopover } from "reactstrap";

// All Routes
import adminRoutes from "../../../routes.js";
import ownerRoutes from "../../../ownerRoutes.js";
import driverRoutes from "../../../driverRouts.js";
import clientsRoutes from "../../../clientRouts.js";
import driverAggregatorRoute from "../../../driverAggregatorRoute";
import { errorToaster, successToaster } from "../common-validation/common";

let userData = {};
let token = null;
let get_fcm_registration_token = null;
const mapStateToProps = (state) => {
  userData = state.userData;
  get_fcm_registration_token = state.get_fcm_registration_token;
  token = state.token;
};

const mapDispatchToProps = (dispatch) => {
  return bindActionCreators(ActCreators, dispatch);
};

export class HomeHeader extends Component {
  constructor(props) {
    super(props);

    this.state = {
      flagShowCart:false,
      showCart: false,
      allLanguages: [
        { value: "en", key: "en", text: "English" },
        { value: "hi", key: "hi", text: "Hindi" },
      ],
    };
  }

  onLogout = async () => {
    if (this.state.isSafari === true) {
      const { history } = this.props;
      this.props.DESTOROY_SESSION();
      successToaster("Logout Successfully");
      setTimeout(() => {
        this.setState({ redirect: true });
        //  history.push('/');
      }, 2000);
    } else {
      if (get_fcm_registration_token === null) {
        const { history } = this.props;
        this.props.DESTOROY_SESSION();
        successToaster("Logout Successfully");
        setTimeout(() => {
          this.setState({ redirect: true });
          //  history.push('/');
        }, 2000);
      } else {
        const data = {
          fcm_regi_token: true,
          fcm_registration_token: get_fcm_registration_token,
        };
        const response = await instance
          .post(requests.fetchLogout, data, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          })
          .catch((error) => {
            const errorMessage = error.response.data.error.message;
            errorToaster(errorMessage);
            console.log(errorMessage);
          });
        if (response && response.data) {
          const { history } = this.props;
          this.props.DESTOROY_SESSION();
          successToaster("Logout Successfully");
          this.props.GET_FCM_REGISTRATION_TOKEN(null);
          setTimeout(() => {
            this.setState({ redirect: true });
            //  history.push('/');
          }, 2000);
        }
      }
    }
  };

  handelShowCart = () => {
    this.setState({
      flagShowCart: true,
      showCart: !this.state.showCart,
    });
    //alert("Cart Show = ",this.state.showCart)
  };
  handelCloseCart = () => {
    this.setState({
      flagShowCart:false,
      showCart: false,
    });
  };

  handleSelectChange = (e) => {
    localStorage.setItem("lang", e.target.value);
    window.location.reload();
    this.setState({ [e.target.name]: e.target.value });
  };

  componentDidMount = async () => {
      var isSafari =
      navigator.vendor &&
      navigator.vendor.indexOf("Apple") > -1 &&
      navigator.userAgent &&
      navigator.userAgent.indexOf("CriOS") == -1 &&
      navigator.userAgent.indexOf("FxiOS") == -1;
    this.setState({ isSafari: isSafari });
  };

  render() {
    const lang = localStorage.getItem("lang") || "en";
    const { location } = window;
    let routes = adminRoutes;
    if (userData.userType === "admin") {
      routes = adminRoutes;
    } else if (userData.userType === "owner") {
      routes = ownerRoutes;
    } else if (userData.userType === "driver") {
      routes = driverRoutes;
    } else if (userData.userType==='driver_aggregator'){
      routes=driverAggregatorRoute;
    }else {
      routes = clientsRoutes;
    }
    return (
      <>
        <div className="home__header">
          <nav className="navbar1">
            {location.hash === "#/" && (
              <label
                className="navbar-toggle1"
                id="js-navbar-toggle"
                for="chkToggle"
              >
                <i className="fa fa-bars" />
              </label>
            )}
            <Link to={"/"}>
              <div className="logo1">Appetizar</div>
            </Link>
            {Object.entries(userData).length === 0 ? (
              <>
                <input type="checkbox" id="chkToggle" />
                <ul className="main-nav1" id="js-menu">
                  {/* <li className="mr-2">
                    <select
                      name="transl"
                      onChange={this.handleSelectChange}
                      value={lang}
                      style={{
                        padding: "0.671rem",
                        borderRadius: "0.38rem",
                        fontSize: "0.875rem",
                      }}
                    >
                      {this.state.allLanguages.map((lange) => {
                        return (
                          <>
                            <option value={lange.value}>{lange.text}</option>
                          </>
                        );
                      })}
                    </select>
                  </li> */}
                  <li className="mr-2">
                    <Link to={"/login"}>
                      <Button
                        className="registerRestaurant__button"
                        type="button"
                      >
                        {" "}
                        {i18next.t("Login")}{" "}
                      </Button>
                    </Link>
                  </li>

                  <li>
                    {/* <Link to={"/restaurantRegistration"}> */}
                    <Link to={`/registration/owner/selected-plan/${"608fc60fb21e4765dc37a9cc"}`}>
                      <Button className="registerRestaurant__button"
                         >
                        {" "}
                        {i18next.t("Register your Restaurant")}
                      </Button>
                    </Link>
                  </li>
                  <li>
                    {/* <Link to={"/restaurantRegistration"}> */}
                    <Link to={`/registration/driver-aggregator/selected-plan/${"608d0177ce60de5d62a32612"}`}>
                      <Button className="ml-2 registerRestaurant__button"
                         >
                        {" "}
                        {i18next.t("Registration For Driver Aggregator")}
                      </Button>
                    </Link>
                  </li>
                </ul>
              </>
            ) : (
              <>
                <input type="checkbox" id="chkToggle" />
                <ul className="main-nav1" id="js-menu">
                  <li className="mr-2">
                    <select
                      name="transl"
                      onChange={this.handleSelectChange}
                      value={lang}
                      style={{
                        padding: "0.671rem",
                        borderRadius: "0.38rem",
                        fontSize: "0.875rem",
                      }}
                    >
                      {this.state.allLanguages.map((lange) => {
                        return (
                          <>
                            <option value={lange.value}>{lange.text}</option>
                          </>
                        );
                      })}
                    </select>
                  </li>
                  <li className="mr-2">
                    {/* <Button className='registerRestaurant__button'
                                            onClick={() => this.onLogout()}> Logout </Button> */}
                    <Button
                      className="registerRestaurant__button"
                      id="tooltip765206973"
                      type="button"
                    >
                      <span class="btn-inner--icon">
                        <i class="fa fa-user mr-2"></i>
                      </span>
                      {userData.name}
                    </Button>
                    <UncontrolledPopover
                      placement="bottom"
                      target="tooltip765206973"
                    >
                      <PopoverBody>
                        {/* <Button className='registerRestaurant__button'
                                                        onClick={() => this.onLogout()}> 
                                                        Logout 
                                                    </Button> */}
                        <Link to="/profile">
                          <li
                            className="dropdown-item"
                            style={{ cursor: "pointer" }}
                          >
                            {i18next.t("Profile")}
                          </li>
                        </Link>
                        {routes.map((data, i) => (
                          <Link to={data.path}>
                            <li
                              className="dropdown-item"
                              style={{ cursor: "pointer" }}
                            >
                              {data.name}
                            </li>
                          </Link>
                        ))}

                        <li
                          className="dropdown-item"
                          style={{ cursor: "pointer" }}
                          onClick={() => this.onLogout()}
                        >
                          {i18next.t("Logout")}
                        </li>
                      </PopoverBody>
                    </UncontrolledPopover>
                  </li>
                  <li>
                    {
                      userData.userType !== "owner" &&
                      <Button
                      className="registerRestaurant__button"
                      onClick={this.handelShowCart}
                    >
                      <div>
                        <i class="ni ni-cart"></i>
                        <span>{i18next.t("Cart")}</span>
                      </div>
                    </Button>
                    }
                    
                    {/* <ShoppingCart /> */}
                  </li>
                </ul>
              </>
            )}
          </nav>
        </div>
        {
          this.state.flagShowCart===true && 
            <CartSlidePen
              onClose={this.handelCloseCart}
              show={this.state.showCart}
            />
        }
      </>
    );
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(HomeHeader);
