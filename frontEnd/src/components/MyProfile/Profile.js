import React from "react";
// reactstrap components

import {
  Card,
  CardHeader,
  CardBody,
  Container,
  Row,
  Col,
  Button,
  FormGroup,
  Form,
  Input,
  Label,
} from "reactstrap";

import { errorToaster, successToaster } from "../common/common-validation/common";

import { bindActionCreators } from "redux";
import { ActCreators } from "../../redux/bindActionCreator";
import { connect } from "react-redux";
import instance from "../../axios";
import requests from "../../requests";


// core components
import Navbar from "../Navbars/AdminNavbar";
import AdminFooter from "../Footers/AdminFooter.js";
import Sidebar from "../Sidebar/Sidebar.js";

import adminRoutes from "../../routes";
import ownerRoutes from "../../ownerRoutes";
import driverRoutes from "../../driverRouts";
import driverAggregatorRoutes from "../../driverAggregatorRoute";
import { clientsRoutes } from "../../clientRouts";

// Axios
import axios from "axios";

//Phone Number Input
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/bootstrap.css";

import i18next from "i18next";

// import routes from "../../../routes.js";

import "../OrderFile/Details.css";
import AlertSuccess from "../Admin/Pages/alertBox";


let userData = {};
let token = null;

const mapStateToProps = (state) => {
  userData = state.userData;
  token = state.token;
};

const mapDispatchToProps = (dispatch) => {
  return bindActionCreators(ActCreators, dispatch);
};
class Profile extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      name: userData.hasOwnProperty("name") ? userData.name : "",
      email: userData.hasOwnProperty("email") ? userData.email : "",
      phone: userData.hasOwnProperty("phone") ? userData.phone : "",
      address: userData.hasOwnProperty("address")
        ? userData.address.length > 0
          ? userData.address[0].user_address
          : ""
        : "",
      landmark: userData.hasOwnProperty("address")
        ? userData.address.length > 0
          ? userData.address[0].landmark
          : ""
        : "",
      password: "",
      newPassword: "",
      cofirmNewPassword: "",
      flage: false,
      dial_code: null,
      dial_value: false,
      image: "",
      imagePrev: userData.hasOwnProperty("profile_image")
        ? userData.profile_image.image_url
        : process.env.REACT_APP_DEFAULT_IMAGE,
      country_name: userData.hasOwnProperty("country_name")
        ? userData.country_name
        : "",
      country_code: userData.hasOwnProperty("country_code")
        ? userData.country_code
        : "",

      currencies: {},
      languages: userData.hasOwnProperty("user_languages")
        ? userData.user_languages
        : "",
      changeDataP: false,
      allLanguages: [
        { value: "en", key: "en", text: "English" },
        { value: "hi", key: "hi", text: "Hindi" },
      ],
      lang: userData.hasOwnProperty("language_preference")
        ? userData.language_preference
        : "",
    };
  }

  handleChangeForPhone = (value, data, event, formattedValue) => {
    this.setState({
      phone: formattedValue,
      dial_code: data.dialCode,
      country_name: data.name,
      country_code: data.countryCode,
      dial_value: true,
    });
  };
  handleFileChange = async (e, id) => {
    const filedata = e.target.files[0];
    const fd = new FormData();
    fd.append("profile_image", filedata, filedata.name);
    const response = await instance
      .post(requests.fetchProfileImage, fd, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-type": "multipart/form-data",
        },
      })
      .catch((error) => {
        let errorMessage = error.response.data.error.message;
        errorToaster(errorMessage);
        console.log(errorMessage);
      });
    if (response && response.data) {
      let userData = response.data.data;
      this.props.LOGIN_USER_DETAIL(userData);
      this.setState(
        {
          imagePrev: userData.profile_image.image_url,
        }
      );
    }
    // this.toBase64(e.target.files[0]).then((data) => {
    //   this.setState({ image: data });
    // });
  };
  handleChange(e) {
    this.setState({
      [e.target.name]: e.target.value,
    });
  }
  redirectToList = () => {
    const { history } = this.props;
    if (history) history.push("/Restaurants");
  };

  onUpdateWithoutDial = async () => {
    let UpdateProfileUserData = {
      name: this.state.name,
      email: this.state.email,
      phone: this.state.phone,
      address: [
        {
          landmark: this.state.landmark,
          user_address: this.state.address,
        },
      ],
      country_name: this.state.country_name,
      country_code: this.state.country_code,
      user_languages: this.state.languages,
    };
    const response = await instance
      .patch(requests.fetchUpdateProfile, UpdateProfileUserData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .catch((error) => {
        let errorMessage = error.response.data.error.message;
        errorToaster(errorMessage);
      });
    if (response && response.data) {
      let userData = response.data.data;
      this.props.LOGIN_USER_DETAIL(response.data.data);
      this.setState({
        flage: !this.state.flage,
      });
      this.setState({ changeDataP: true }, () => {
        this.getlanguagepreferences();
      });
    }
    if (this.state.changeDataP === false) {
      this.getlanguagepreferences();
    }
  };

  onUpdateWithDial = async () => {
    axios
      .get(
        "https://restcountries.eu/rest/v2/callingcode/" +
        this.state.dial_code +
        "?fields=name;callingCodes;languages;currencies"
      )
      .then((response) => {
        this.setState(
          {
            currencies: response.data[0].currencies[0],
            languages: response.data[0].languages,
          },
          async () => {
            let currencies = {
              code: this.state.currencies.code.toLowerCase(),
              curr_name: this.state.currencies.name,
              symbol: this.state.currencies.symbol,
            };
            let UpdateProfileUserData = {
              name: this.state.name,
              email: this.state.email,
              phone: this.state.phone,
              address: [
                {
                  landmark: this.state.landmark,
                  user_address: this.state.address,
                },
              ],
              country_name: this.state.country_name,
              country_code: this.state.country_code,
              currencies: currencies,
              user_languages: this.state.languages,
            };

            const response = await instance
              .patch(requests.fetchUpdateProfile, UpdateProfileUserData, {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              })
              .catch((error) => {
                let errorMessage = error.response.data.error.message;
                errorToaster(errorMessage);
              });
            if (response && response.data) {
              let userData = response.data.data;
              this.props.LOGIN_USER_DETAIL(userData);
              this.setState({
                flage: !this.state.flage,
              });
              if (this.state.changeDataP === false) {
                this.getlanguagepreferences();
              }
            }
          }
        );
      })
      .catch((error) => {
        console.log(error);
      });
    if (this.state.changeDataP === false) {
      this.getlanguagepreferences();
    }
  };

  onUpdateProfile = async () => {
    if (this.state.dial_value === true) {
      this.onUpdateWithDial();
    } else {
      this.onUpdateWithoutDial();
    }
  };

  onUpdatePassword = async () => {
    if (this.state.newPassword === this.state.cofirmNewPassword) {
      let updatePasswordUserData = {
        oldPassword: this.state.password,
        newPassword: this.state.newPassword,
      };
      const response = await instance
        .patch(requests.fetchChangePassword, updatePasswordUserData, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        .catch((error) => {
          let errorMessage = error.response.data.error.message;
          errorToaster(errorMessage);
        });

      if (response && response.data) {
        const { history } = this.props;
        successToaster("Successfully Changed Password");
        setTimeout(() => {
          history.push("/profile");
        }, 1000);
        this.setState({
          password: "",
          newPassword: "",
          cofirmNewPassword: "",
        })
      }
    } else {
      errorToaster("New password and confirm password dosen't match!");
    }
  };

  getlanguagepreferences = async () => {
    const data = {
      language_preference: this.state.lang,
    };
    const response = await instance
      .patch(requests.fetchLanguagePreference, data, {
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
      successToaster("Success Fully Update your profile");
      setTimeout(() => {
        history.push("/profile");
      }, 700);
    }
  };

  handleSelectChange = async (e) => {
    this.setState({ [e.target.name]: e.target.value });
  };

  render() {
    const userType = userData.userType;
    let routes = adminRoutes;
    if (userData.userType === "admin") {
      routes = adminRoutes;
    } else if (userData.userType === "owner") {
      routes = ownerRoutes;
    } else if (userData.userType === "driver_aggregator") {
      routes = driverAggregatorRoutes;
    } else {
      routes = clientsRoutes;
    }
    const { image, imagePrev } = this.state;
    return (
      <>
        <Sidebar
          {...this.props}
          routes={routes}
          logo={{
            innerLink: "/dashboard",
            imgSrc: require("assets/img/brand/argon-react.png"),
            imgAlt: "...",
          }}
          img={this.state.imagePrev}
          name={this.state.name}
          isProfileChanged={true}
        />
        <div className="main-content" ref="mainContent">
          <Navbar
            img={this.state.imagePrev}
            name={this.state.name}
            isProfileChanged={true}
          />
          <Container className="pt-7" fluid>
            <Row>
              <Col className="col">
                <Card className="bg-secondary shadow">
                  <CardHeader className="border-0">
                    <div className="d-flex justify-content-between">
                      <div className="md-7">
                        <h1 className="mb-0">{i18next.t("Edit Profile")}</h1>
                      </div>
                    </div>
                  </CardHeader>
                  <CardBody>
                    <Form>
                      <h6 className="heading-small text-muted mb-4">
                        {i18next.t("USER INFORMATION")}
                      </h6>
                      {this.state.flage && <AlertSuccess />}
                      <div className="pl-lg-4">
                        <Row>
                          <Col md="6" sm="6" lg="6" xl="4" ld="6">
                            <FormGroup className="text-center font-weight-bold mb-4">
                              <Label for="input-name">{i18next.t("Profile Image")}</Label>
                              <div className="text-center">
                                <div
                                  className="fileinput fileinput-new"
                                  dataprovider="fileinput"
                                >
                                  <div className="fileinput-preview img-thumbnail">
                                    <img
                                      src={
                                        image.length !== 0 ? image : imagePrev
                                      }
                                      style={{
                                        width: "100%",
                                        height: "200px",
                                        objectFit: "cover",
                                      }}
                                    />
                                  </div>
                                </div>
                                <div>
                                  <span className="btn btn-outline-secondary btn-file mt-3">
                                    {image.length === 0 ? (
                                      <span className="fileinput-new">
                                        {i18next.t("Upload Image")}
                                      </span>
                                    ) : (
                                      <span className="fileinput-exists">
                                        {i18next.t("Change")}
                                      </span>
                                    )}
                                    <input
                                      type="file"
                                      name="resto_logo"
                                      onChange={(e) => {
                                        this.handleFileChange(e, userData._id);
                                      }}
                                      accept="image/x-png,image/gif,image/jpeg"
                                    />
                                  </span>
                                  {image.length !== 0 && (
                                    <button
                                      onClick={this.handleRemoveFile}
                                      className="btn btn-outline-secondary fileinput-exists mt-3"
                                      data-dismiss="fileinput"
                                    >
                                      {i18next.t("Remove")}
                                    </button>
                                  )}
                                </div>
                              </div>
                            </FormGroup>
                          </Col>
                        </Row>
                        <Row>
                          <Col md="12">
                            <FormGroup>
                              <label
                                className="form-control-label"
                                htmlFor="input-address"
                              >
                                {i18next.t("Name")}
                              </label>
                              <Input
                                className="form-control-alternative"
                                type="text"
                                name="name"
                                placeholder={i18next.t("Name")}
                                value={this.state.name}
                                onChange={(e) => this.handleChange(e)}
                              />
                            </FormGroup>
                          </Col>
                        </Row>
                        <Row>
                          <Col md="12">
                            <FormGroup>
                              <label
                                className="form-control-label"
                                htmlFor="input-address"
                              >
                                {i18next.t("Email")}
                              </label>
                              <Input
                                className="form-control-alternative"
                                type="email"
                                name="email"
                                placeholder={i18next.t("Email")}
                                value={this.state.email}
                                onChange={(e) => this.handleChange(e)}
                              />
                            </FormGroup>
                          </Col>
                        </Row>
                        <Row>
                          <Col md="12">
                            <FormGroup>
                              <label
                                className="form-control-label"
                                htmlFor="input-address"
                              >
                                {i18next.t("Phone Number")}
                              </label>
                              <PhoneInput
                                inputProps={{
                                  name: "phone",
                                  required: true,
                                }}
                                inputStyle={{ width: "100%" }}
                                placeholder={i18next.t("Phone Number")}
                                country={"in"}
                                value={this.state.phone}
                                autoFormat={false}
                                onChange={(
                                  value,
                                  data,
                                  event,
                                  formattedValue
                                ) =>
                                  this.handleChangeForPhone(
                                    value,
                                    data,
                                    event,
                                    formattedValue
                                  )
                                }
                              />
                            </FormGroup>
                          </Col>
                        </Row>

                        <Row>
                          <Col md="12">
                            <FormGroup>
                              <label
                                className="form-control-label"
                                htmlFor="input-address"
                              >
                                {i18next.t("Address")}
                              </label>
                              <Input
                                type="textarea"
                                name="address"
                                value={this.state.address}
                                onChange={(e) => this.handleChange(e)}
                              />
                            </FormGroup>
                          </Col>
                        </Row>
                        <Row>
                          <Col md="12">
                            <FormGroup>
                              <label
                                className="form-control-label"
                                htmlFor="input-landmark"
                              >
                                {i18next.t("Landmark")}
                              </label>
                              <Input
                                type="text"
                                name="landmark"
                                value={this.state.landmark}
                                onChange={(e) => this.handleChange(e)}
                              />
                            </FormGroup>
                          </Col>
                        </Row>
                        <Row>
                          <Col md="12">
                            <FormGroup>
                              <label for="transl">
                                {i18next.t(
                                  "Select Language for your email and other Notification"
                                )}
                              </label>
                              <Input
                                type="select"
                                name="lang"
                                id="lang"
                                onChange={this.handleSelectChange}
                                value={this.state.lang}
                              >
                                <option value="">--select Language--</option>
                                {this.state.allLanguages.map((lange) => {
                                  return (
                                    <>
                                      <option value={lange.value}>
                                        {lange.text}
                                      </option>
                                    </>
                                  );
                                })}
                              </Input>
                            </FormGroup>
                          </Col>
                        </Row>
                        <center>
                          <Row>
                            <Col md="12">
                              <FormGroup>
                                <Button
                                  className="my-4"
                                  color="success"
                                  type="button"
                                  onClick={() => this.onUpdateProfile()}
                                >
                                  {i18next.t("save")}
                                </Button>
                              </FormGroup>
                            </Col>
                          </Row>
                        </center>
                      </div>
                      <hr className="my-4" />
                      {/* Address */}
                      <h6 className="heading-small text-muted mb-4">
                        {i18next.t("PASSWORD")}
                      </h6>
                      <div className="pl-lg-4">
                        <Row>
                          <Col md="12">
                            <FormGroup>
                              <label
                                className="form-control-label"
                                htmlFor="input-address"
                              >
                                {i18next.t("Current Password")}
                              </label>
                              <Input
                                className="form-control-alternative"
                                type="password"
                                name="password"
                                placeholder={i18next.t("Current Password")}
                                value={this.state.currentPassword}
                                onChange={(e) => this.handleChange(e)}
                              />
                            </FormGroup>
                          </Col>
                        </Row>
                        <Row>
                          <Col md="12">
                            <FormGroup>
                              <label
                                className="form-control-label"
                                htmlFor="input-address"
                              >
                                {i18next.t("New Password")}
                              </label>
                              <Input
                                className="form-control-alternative"
                                type="password"
                                name="newPassword"
                                placeholder={i18next.t("New Password")}
                                value={this.state.newPassword}
                                onChange={(e) => this.handleChange(e)}
                              />
                            </FormGroup>
                          </Col>
                        </Row>
                        <Row>
                          <Col md="12">
                            <FormGroup>
                              <label
                                className="form-control-label"
                                htmlFor="input-address"
                              >
                                {i18next.t("Confirm New Password")}
                              </label>
                              <Input
                                className="form-control-alternative"
                                type="password"
                                name="cofirmNewPassword"
                                placeholder={i18next.t("Confirm New Password")}
                                value={this.state.cofirmNewPassword}
                                onChange={(e) => this.handleChange(e)}
                              />
                            </FormGroup>
                          </Col>
                        </Row>
                      </div>
                      <center>
                        <Button
                          className="my-4"
                          color="success"
                          type="button"
                          onClick={() => this.onUpdatePassword()}
                        >
                          {i18next.t("Change Password")}
                        </Button>
                      </center>
                    </Form>
                  </CardBody>
                </Card>
              </Col>
            </Row>
          </Container>

          <Container fluid>
            <AdminFooter />
          </Container>
        </div>
      </>
    );
  }
}
export default connect(mapStateToProps, mapDispatchToProps)(Profile);
