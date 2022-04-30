import React from "react";
import instance from "../../../axios";
import requests from "../../../requests";
import i18next from "i18next";
import { messaging } from "../../../firebase";

import HomeHeader from "../header/HomeHeader.js";

import {
  Button,
  Card,
  CardHeader,
  CardBody,
  FormGroup,
  Form,
  Input,
  InputGroupAddon,
  InputGroupText,
  InputGroup,
  Row,
  Col,
  Container,
  UncontrolledAlert,
} from "reactstrap";
import "./login.css";
import { bindActionCreators } from "redux";
import { ActCreators } from "../../../redux/bindActionCreator";
import { connect } from "react-redux";
import GoogleLogin from "react-google-login";
import FacebookLogin from "react-facebook-login";

import { errorToaster, successToaster } from "../common-validation/common";
import Image from "../../../assets/img/theme/login.png";

import SwiperCore, { Navigation, Pagination, Scrollbar, A11y, Autoplay } from 'swiper';

import { Swiper, SwiperSlide } from 'swiper/react';

// Import Swiper styles
import 'swiper/swiper.scss';
import 'swiper/components/navigation/navigation.scss';
import 'swiper/components/pagination/pagination.scss';
import 'swiper/components/scrollbar/scrollbar.scss';
import 'swiper/components/controller/controller.scss';
import 'swiper/swiper-bundle.css';
import 'swiper/swiper-bundle.min.css'

SwiperCore.use([Navigation, Pagination, Scrollbar, A11y, Autoplay]);

const mapStateToProps = (state) => {
};

const mapDispatchToProps = (dispatch) => {
  return bindActionCreators(ActCreators, dispatch);
};
class Login extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      Email: "",
      Password: "",
      fcm_registration_token: "",
      isSafari: false,
      fcm_flag: true,
    };
  }

  handleChange(e) {
    this.setState({
      [e.target.name]: e.target.value,
    });
  }

  // redirectToSingUp = () => {
  //   const { history } = this.props;
  //   if (history) history.push("/signup");
  // };

  ForgotPass = () => {
    const { history } = this.props;
    if (history) history.push("/forgot-password");
  };
  backToHome = () => {
    const { history } = this.props;
    if (history) history.push("/");
  };
  onLogin = async () => {
    let loginUserData = {
      email: this.state.Email,
      password: this.state.Password,
      fcm_registration_token: this.state.fcm_registration_token,
    };

    // messaging.onMessage(function (payload) {
    //   console.log("payload :", payload);
    // });
    const response = await instance
      .post(requests.fetchLogin, loginUserData)
      .catch((error) => {
        let errorMessage = error.response.data.error.message;
        errorToaster(errorMessage);
      });
    if (response && response.data) {
      let userData = response.data.data.user;
      this.props.LOGIN_USER_DETAIL(userData);
      let token = response.data.data.token;
      this.props.TOKEN_KEY(token);
      const { history } = this.props;
      successToaster("Login Successfully");
      setTimeout(() => {
        if (userData.userType === "admin") {
          history.push("/dashboard");
        } else if (userData.userType === "owner") {
          history.push("/dashboard");
        } else if (userData.userType === "driver") {
          history.push("/orders");
        } else if (userData.userType === "driver_aggregator") {
          history.push("/dashboard");
        } else if(userData.userType === "client"){
          errorToaster("This is a management login other users cannot login");
          this.props.DESTROY_SESSION();
          history.push("/")
        }
      }, 2000);
    }
  };
  // responseSuccessGoogle = async (response) => {
  //   let userData = response.profileObj;
  //   let loginUserData = {
  //     socialId: userData.googleId,
  //     socialProvider: "google",
  //     email: userData.email,
  //     name: userData.givenName,
  //     userType: "client",
  //   };
  //   console.log(" Google API body ====================> ", loginUserData)
  //   const responseBE = await instance
  //     .post(requests.fetchSocialAuthentication, loginUserData)
  //     .catch((error) => {
  //       let errorMessage = error.responseBE.data.error.message;
  //       errorToaster(errorMessage);
  //     });
  //   if (responseBE && responseBE.data) {
  //     console.log("Response Of Google=======> ",responseBE)
  //     let userData = responseBE.data.data.user;
  //     this.props.LOGIN_USER_DETAIL(userData);
  //     let token = responseBE.data.data.token;
  //     this.props.TOKEN_KEY(token);
  //     const { history } = this.props;
  //     successToaster("Login Successfully");
  //     setTimeout(() => {
  //       if (userData.userType === "admin") {
  //         history.push("/dashboard");
  //       } else if (userData.userType === "owner") {
  //         history.push("/dashboard");
  //       } else if (userData.userType === "driver") {
  //         history.push("/order");
  //       } else {
  //         history.push("/");
  //       }
  //     }, 2000);
  //   }
  // };
  // responseErrorGoogle = (response) => {
  //   console.log(response);
  // };
  // responseFacebook = (response) => {
  //   console.log(response);
  // };

  componentDidMount = () => {
    // const messaging = firebase.messaging();
    if (messaging) {
      messaging
        .requestPermission()
        .then(() => {
          return messaging.getToken();
        })
        .then((token) => {
          this.props.GET_FCM_REGISTRATION_TOKEN(token);
          this.setState({ fcm_registration_token: token, fcm_flag: false });
        })
        .catch((err) => {
          //alert("In Catch");
          console.log(err.message);
        });
      messaging.onMessage(function (payload) {
        console.log("payload :", payload);
      });
    }

    // // Safari 3.0+ "[object HTMLElementConstructor]"
    // var isSafari =
    //   /constructor/i.test(window.HTMLElement) ||
    //   (function (p) {
    //     return p.toString() === "[object SafariRemoteNotification]";
    //   })(
    //     !window["safari"] ||
    //       (typeof safari !== "undefined" && safari.pushNotification)
    //   );

    var isSafari =
      navigator.vendor &&
      navigator.vendor.indexOf("Apple") > -1 &&
      navigator.userAgent &&
      navigator.userAgent.indexOf("CriOS") === -1 &&
      navigator.userAgent.indexOf("FxiOS") === -1;
    this.setState({ isSafari: isSafari });
  };

  render() {
    const { Email, Password } = this.state;

    return (
      <>
        <HomeHeader />
        <Container fluid>
          {this.state.fcm_flag && (
            <Row style={{ margin: "2rem auto" }}>
              <UncontrolledAlert
                color="warning"
                fade={false}
                style={{ margin: "auto" }}
              >
                <span className="alert-inner--icon">
                  <i className="ni ni-like-2" />
                </span>{" "}
                <span className="alert-inner--text">
                  <strong>Appetizar</strong>{" "}
                  {i18next.t(
                    "relies on your device's push notification to update you in real-time, this won't have any effect on the application's flow, however for better user experience we recommend you to allow push notification for our site in your browser's site settings."
                  )}
                </span>
              </UncontrolledAlert>
            </Row>
          )}
          {this.state.isSafari && (
            <Row style={{ margin: "2rem auto" }}>
              <UncontrolledAlert
                color="warning"
                fade={false}
                style={{ margin: "auto" }}
              >
                <span className="alert-inner--icon">
                  <i className="ni ni-like-2" />
                </span>{" "}
                <span className="alert-inner--text">
                  <strong>{i18next.t("hey,")}</strong>{" "}
                  {i18next.t(
                    "we noticed you are using Safari, for now, it doesn't support web-push notification, please note that this won't affect the application flow in any way. Push notification is only required to get real-time data. we recommend using a different browser which supports push notification."
                  )}
                </span>
              </UncontrolledAlert>
            </Row>
          )}
          <div>
            <Row className="mt-5" >
              <Col sm={6} md={6} lg={6} xs={12} >
                <Card
                  className="shadow border-5"
                  style={{ backgroundColor: "rgba(255, 255, 255, 0.7)" }}
                >
                  {/* <CardHeader className="bg-transparent pb-5">
                    <div className="text-muted text-center mt-2 mb-3">
                      <small>{i18next.t("Sign in with")}</small>
                    </div>
                    <div>
                      <Row>
                        <Col
                          className="btn-wrapper text-center"
                          sm={12}
                          md={3}
                          lg={3}
                        ></Col>
                        <Col
                          className="btn-wrapper text-center"
                          sm={12}
                          md={3}
                          lg={3}
                        >
                          <FacebookLogin
                            type="button"
                            size="small"
                            appId="883904368760310"
                            autoLoad={false}
                            cssClass="kep-login-facebook"
                            //icon="fa fa-facebook"
                            textButton="Facebook"
                            //onClick={componentClicked}
                            callback={this.responseFacebook}
                          />
                        </Col>
                        <Col
                          className="btn-wrapper text-center"
                          sm={12}
                          md={3}
                          lg={3}
                        >
                          <GoogleLogin
                            clientId="286274690055-3ir5fktq60nedqvm9nb8lgh0oofgub72.apps.googleusercontent.com"
                            buttonText="Google"
                            onSuccess={this.responseSuccessGoogle}
                            onFailure={this.responseErrorGoogle}
                            cookiePolicy={"single_host_origin"}
                          />
                        </Col>
                      </Row>
                    </div>
                  </CardHeader> */}
                  <CardHeader className="bg-transparent">
                    <div className="text-muted text-center ">
                      <i class="fas fa-sign-in-alt fa-5x"></i><br />
                      <strong> Login </strong>
                    </div>
                  </CardHeader>
                  <CardBody className="px-lg-5 py-lg-5">
                    {/* <div className="text-center text-muted mb-4">
                      <small>{i18next.t("Or sign in with credentials")}</small>
                    </div> */}
                    <Form role="form">
                      <FormGroup className="mb-3">
                        <InputGroup className="input-group-alternative">
                          <InputGroupAddon addonType="prepend">
                            <InputGroupText>
                              <i className="ni ni-email-83" />
                            </InputGroupText>
                          </InputGroupAddon>
                          <Input
                            name="Email"
                            value={this.state.Email}
                            placeholder={i18next.t("Email")}
                            type="email"
                            autoComplete="new-email"
                            onChange={(e) => this.handleChange(e)}
                          />
                        </InputGroup>
                      </FormGroup>
                      <FormGroup>
                        <InputGroup className="input-group-alternative">
                          <InputGroupAddon addonType="prepend">
                            <InputGroupText>
                              <i className="ni ni-lock-circle-open" />
                            </InputGroupText>
                          </InputGroupAddon>
                          <Input
                            name="Password"
                            placeholder={i18next.t("Password")}
                            type="password"
                            autoComplete="new-password"
                            value={this.state.Password}
                            onChange={(e) => this.handleChange(e)}
                          />
                        </InputGroup>
                      </FormGroup>
                      <div className="text-center">
                        <Button
                          className="my-4"
                          color="primary"
                          type="button"
                          onClick={this.backToHome}
                        >
                          {i18next.t("Back")}
                        </Button>
                        <Button
                          className="my-4"
                          color="primary"
                          type="button"
                          disabled={!Email || !Password ? true : false}
                          onClick={() => this.onLogin()}
                        >
                          {i18next.t("Sign in")}
                        </Button>

                      </div>
                    </Form>

                    <div className="text-center mt-2">
                      <div>
                        <p
                          className="text-dark"
                          style={{ cursor: "pointer" }}
                          onClick={this.ForgotPass}
                        >
                          {" "}
                          {i18next.t("Forgot password")}{" "}
                        </p>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              </Col>
              <Col sm={6} md={6} lg={6} xs={12}>
                <Card
                  className="shadow border-5 text-white"
                  style={{
                    height: "100%", width: "100%"
                  }}
                >
                  <CardHeader className="bg-transparent">
                    <div className="text-muted text-center display-2 m-3">
                      <strong> Welcome to Appetizar </strong>
                    </div>
                  </CardHeader>
                  <CardBody className="px-lg-5 py-lg-5">
                    <div className="text-muted display-3 ">
                      Did you know?
                    </div>
                    <div>
                      <Swiper
                        className="p-3 mb-3"
                        autoplay={{ delay: 2500 }}
                        spaceBetween={50}
                        slidesPerView={1}
                        pagination={{ clickable: true }}
                        onSwiper={(swiper) => console.log(swiper)}
                        onSlideChange={() => console.log('slide change')}
                      >
                        <SwiperSlide >
                          <div className="text-muted display-3 ">
                            Did you know?
                          </div>
                        </SwiperSlide>
                        <SwiperSlide>
                          {({ isDuplicate }) => (
                            <div>Current slide is {isDuplicate ? 'active' : 'not active'}</div>
                          )}
                          <div className="text-muted display-3 ">
                            Did you know?
                          </div><br /><br />
                        </SwiperSlide>
                        <SwiperSlide>
                          <div className="text-muted display-3 ">
                            Did you know?
                          </div>
                        </SwiperSlide>
                        <SwiperSlide>
                          <div className="text-muted display-3 ">
                            Did you know?
                          </div>
                        </SwiperSlide>
                      </Swiper>
                    </div>
                  </CardBody>
                </Card>
              </Col>
            </Row>
          </div>
        </Container>
      </>
    );
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(Login);


// <Container style={{ backgroundColor: "blue" }}>
// {this.state.fcm_flag && (
//   <Row style={{ margin: "2rem auto" }}>
//     <UncontrolledAlert
//       color="warning"
//       fade={false}
//       style={{ margin: "auto" }}
//     >
//       <span className="alert-inner--icon">
//         <i className="ni ni-like-2" />
//       </span>{" "}
//       <span className="alert-inner--text">
//         <strong>Appetizar</strong>{" "}
//         {i18next.t(
//           "relies on your device's push notification to update you in real-time, this won't have any effect on the application's flow, however for better user experience we recommend you to allow push notification for our site in your browser's site settings."
//         )}
//       </span>
//     </UncontrolledAlert>
//   </Row>
// )}
// {this.state.isSafari && (
//   <Row style={{ margin: "2rem auto" }}>
//     <UncontrolledAlert
//       color="warning"
//       fade={false}
//       style={{ margin: "auto" }}
//     >
//       <span className="alert-inner--icon">
//         <i className="ni ni-like-2" />
//       </span>{" "}
//       <span className="alert-inner--text">
//         <strong>{i18next.t("hey,")}</strong>{" "}
//         {i18next.t(
//           "we noticed you are using Safari, for now, it doesn't support web-push notification, please note that this won't affect the application flow in any way. Push notification is only required to get real-time data. we recommend using a different browser which supports push notification."
//         )}
//       </span>
//     </UncontrolledAlert>
//   </Row>
// )}

// <Row style={{ height: "100%", width: "100%", backgroundColor: "red" }} >
//   <Col sm={12} md={6} lg={6} xl={6} xs={12}>
//     <Card
//       className="shadow border-5"
//       style={{ height: "100%", width: "100%", backgroundColor: "rgba(255, 255, 255, 0.7)" }}
//     >
//       {/* <CardHeader className="bg-transparent pb-5">
//           <div className="text-muted text-center mt-2 mb-3">
//             <small>{i18next.t("Sign in with")}</small>
//           </div>
//           <div>
//             <Row>
//               <Col
//                 className="btn-wrapper text-center"
//                 sm={12}
//                 md={3}
//                 lg={3}
//               ></Col>
//               <Col
//                 className="btn-wrapper text-center"
//                 sm={12}
//                 md={3}
//                 lg={3}
//               >
//                 <FacebookLogin
//                   type="button"
//                   size="small"
//                   appId="883904368760310"
//                   autoLoad={false}
//                   cssClass="kep-login-facebook"
//                   //icon="fa fa-facebook"
//                   textButton="Facebook"
//                   //onClick={componentClicked}
//                   callback={this.responseFacebook}
//                 />
//               </Col>
//               <Col
//                 className="btn-wrapper text-center"
//                 sm={12}
//                 md={3}
//                 lg={3}
//               >
//                 <GoogleLogin
//                   clientId="286274690055-3ir5fktq60nedqvm9nb8lgh0oofgub72.apps.googleusercontent.com"
//                   buttonText="Google"
//                   onSuccess={this.responseSuccessGoogle}
//                   onFailure={this.responseErrorGoogle}
//                   cookiePolicy={"single_host_origin"}
//                 />
//               </Col>
//             </Row>
//           </div>
//         </CardHeader> */}
//       <CardHeader className="bg-transparent">
//         <div className="text-muted text-center ">
//           <i class="fas fa-sign-in-alt fa-5x"></i><br />
//           <strong> Login </strong>
//         </div>
//       </CardHeader>
//       <CardBody className="">
//         {/* <div className="text-center text-muted mb-4">
//             <small>{i18next.t("Or sign in with credentials")}</small>
//           </div> */}
//         <Form role="form">
//           <FormGroup className="">
//             <InputGroup className="input-group-alternative">
//               <InputGroupAddon addonType="prepend">
//                 <InputGroupText>
//                   <i className="ni ni-email-83" />
//                 </InputGroupText>
//               </InputGroupAddon>
//               <Input
//                 name="Email"
//                 value={this.state.Email}
//                 placeholder={i18next.t("Email")}
//                 type="email"
//                 autoComplete="new-email"
//                 onChange={(e) => this.handleChange(e)}
//               />
//             </InputGroup>
//           </FormGroup>
//           <FormGroup>
//             <InputGroup className="input-group-alternative">
//               <InputGroupAddon addonType="prepend">
//                 <InputGroupText>
//                   <i className="ni ni-lock-circle-open" />
//                 </InputGroupText>
//               </InputGroupAddon>
//               <Input
//                 name="Password"
//                 placeholder={i18next.t("Password")}
//                 type="password"
//                 autoComplete="new-password"
//                 value={this.state.Password}
//                 onChange={(e) => this.handleChange(e)}
//               />
//             </InputGroup>
//           </FormGroup>
//           <div className="text-center">
//             <Button
//               className="my-4"
//               color="primary"
//               type="button"
//               onClick={this.backToHome}
//             >
//               {i18next.t("Back")}
//             </Button>
//             <Button
//               className="my-4"
//               color="primary"
//               type="button"
//               disabled={!Email || !Password ? true : false}
//               onClick={() => this.onLogin()}
//             >
//               {i18next.t("Sign in")}
//             </Button>

//           </div>
//         </Form>

//         <div className="text-center mt-2">
//           <div>
//             <p
//               className="text-dark"
//               style={{ cursor: "pointer" }}
//               onClick={this.ForgotPass}
//             >
//               {" "}
//               {i18next.t("Forgot password")}{" "}
//             </p>
//           </div>
//         </div>
//       </CardBody>
//     </Card>
//   </Col>
//   <Col sm={12} md={6} lg={6} xl={6} xs={12} >
//     <Card
//       className="shadow border-5"

//     >

//     </Card>
//   </Col>
// </Row>

// </Container>
