import React from "react";
// reactstrap components
import i18next from "i18next";
import {
  Card,
  CardHeader,
  CardBody,
  Container,
  Row,
  Col,
  Label,
  Button,
  FormGroup,
  Form,
  Input,
} from "reactstrap";

//Navbar
import Navbar from "../../../Navbars/AdminNavbar";

// core components
import AdminFooter from "../../../Footers/AdminFooter";
import Sidebar from "../../../Sidebar/Sidebar";

import routes from "../../../../routes";

// For Redux Data
import { bindActionCreators } from "redux";
import { ActCreators } from "../../../../redux/bindActionCreator";
import { connect } from "react-redux";
import instance from "../../../../axios";
import requests from "../../../../requests";

// Notification
import {errorToaster, successToaster} from "../../../common/common-validation/common";

// Country and Rigion
import {
  CountryDropdown,
} from "react-country-region-selector";

let token = null;
let EditCityDetail = {};


const mapStateToProps = (state) => {
  token = state.token;
  EditCityDetail = state.EditCityDetail;

};
const mapDispatchToProps = (dispatch) => {
  return bindActionCreators(ActCreators, dispatch);
};

class CityRegistration extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      pathStatus:"",
      image: "",
      id: "",
      cityName: "",
      shortCode: "",
      headerTitle: "",
      headerSubtitle: "",
      state: "",
      country: "",
      imagePrev: process.env.REACT_APP_DEFAULT_IMAGE,
      City_image: "",
    };
  }
  selectCountry(val) {
    this.setState({ country: val });
  }

  componentDidMount = async () => {
    const { history } = this.props;
    const path = history.location.pathname;
    let splitPath = path.split("/");
    this.setState({
      pathStatus:splitPath[2]
    },() => {
      if(this.state.pathStatus==="edit"){
        this.setState({
          id: EditCityDetail.hasOwnProperty("_id") ? EditCityDetail._id : "",
          cityName: EditCityDetail.hasOwnProperty("city_name")
            ? EditCityDetail.city_name
            : "",
          shortCode: EditCityDetail.hasOwnProperty("short_code")
            ? EditCityDetail.short_code
            : "",
          headerTitle: EditCityDetail.hasOwnProperty("title")
            ? EditCityDetail.title
            : "",
          headerSubtitle: EditCityDetail.hasOwnProperty("sub_title")
            ? EditCityDetail.sub_title
            : "",
          state: EditCityDetail.hasOwnProperty("state") ? EditCityDetail.state : "",
          country: EditCityDetail.hasOwnProperty("country_name")
            ? EditCityDetail.country_name
            : "",
          imagePrev: EditCityDetail.hasOwnProperty("city_image") ? EditCityDetail.city_image.image_url : process.env.REACT_APP_DEFAULT_IMAGE,
          tempImage: EditCityDetail.hasOwnProperty("city_image") ? EditCityDetail.city_image.image_url : process.env.REACT_APP_DEFAULT_IMAGE,
          City_image: "",
        });
      }
    })
  }
  onCallAddCity = async () => {
    
    const fd = new FormData();
    if (this.state.pathStatus==="edit")
    {
      if(this.state.id.length > 0)
      {
        fd.append("city_id", this.state.id);
      }
    }  
    if(this.state.cityName.length > 0){
      fd.append("city_name", this.state.cityName);
    }
    if(this.state.shortCode.length > 0){
      fd.append("short_code", this.state.shortCode);
    }
    if(this.state.headerTitle.length > 0){
      fd.append("title", this.state.headerTitle);
    }
    if(this.state.headerSubtitle.length > 0){
      fd.append("sub_title", this.state.headerSubtitle);
    }
    if(this.state.country.length > 0){
      fd.append("country_name", this.state.country);
    }
    if(this.state.state.length > 0){
      fd.append("state", this.state.state);
    }

    if(this.state.City_image.length === 0){
      console.log("You don't upload image");
    }
    else{
      fd.append("city_image", this.state.City_image, this.state.City_image.name);
    }
    const response = this.state.pathStatus === "create" ? 
        await instance
          .post(requests.fetchAddCity, fd, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          })
      :
        await instance
        .patch(requests.fetchUpdateCity, fd, {
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
      this.state.pathStatus==="create" ? 
        successToaster("Record successfully added!")
      :
        successToaster("Record successfully updated!")

      setTimeout(() => {
        if (history) history.push("/city");
      }, 2000);
    }
  };
  
  handleChange(e) {
    this.setState({
      [e.target.name]: e.target.value,
    });
  }
  redirectToList = () => {
    const { history } = this.props;
    if (history) history.push("/city");
  };
  handleFileChange = (e) => {
    const data = e.target.files[0];
    this.setState(
      { City_image: data, imagePrev: URL.createObjectURL(data) }
    );
  };
  handleRemoveFile = (e) => {
    e.preventDefault(); 
    this.setState({ 
      imagePrev: this.state.pathStatus==="create" ? "" : this.state.tempImage,
      City_image: ""
    });
  };

  render() {
    const {
      City_image,
      imagePrev,
      state,
      cityName,
      shortCode,
      headerTitle,
      headerSubtitle,
      country,
    } = this.state;

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
        />
        <div className="main-content" ref="mainContent">
          <Navbar />
          
          <Container className="pt-7" fluid>
            <Row>
              <Col className="col">
                <Card className="bg-secondary shadow">
                  <CardHeader className="border-0">
                    <div className="d-flex justify-content-between">
                      <div className="md-7">
                        <h1 className="mb-0">{i18next.t("City Information")}</h1>
                      </div>
                      <div className="md-5">
                        <Row>
                          <Col>
                            <Button
                              color="primary"
                              size="sm"
                              type="button"
                              onClick={this.redirectToList}
                            >
                              {i18next.t("Back to List")}
                            </Button>
                          </Col>
                        </Row>
                      </div>
                    </div>
                  </CardHeader>
                  <CardBody>
                    <Form>
                      <h6 className="heading-small text-muted mb-4"></h6>

                      <div className="pl-lg-4">
                        <Row>
                          <Col md={12}>
                            <FormGroup className="text-center font-weight-bold mb-12">
                              <Label for="input-name">{i18next.t("City Image")}</Label>
                              <div>
                                <div
                                  className="fileinput fileinput-new"
                                  dataprovider="fileinput"
                                >
                                  <center>
                                    <div
                                      className="fileinput-preview img-thumbnail"
                                      style={{
                                        width: "280px",
                                        height: "210px",
                                      }}
                                    >
                                      {(
                                        <>
                                          <img
                                            src={imagePrev.length !== 0 ? imagePrev : process.env.REACT_APP_DEFAULT_IMAGE}
                                            style={{
                                              width: "270px",
                                              height: "200px",
                                              objectFit: "cover",
                                            }}
                                          />
                                        </>
                                      )}
                                    </div>
                                  </center>
                                </div>
                                <div>
                                  <span className="btn btn-outline-secondary btn-file mt-3">
                                    {City_image.length === 0 ? (
                                      <span className="fileinput-new">
                                        {i18next.t("Upload image")}
                                      </span>
                                    ) : (
                                      <span className="fileinput-exists">
                                        {i18next.t("Change")}
                                      </span>
                                    )}
                                    <input
                                      type="file"
                                      name="resto_logo"
                                      onChange={this.handleFileChange}
                                      accept="image/x-png,image/gif,image/jpeg"
                                    />
                                  </span>
                                  {City_image.length !== 0 && (
                                    <button
                                      className="btn btn-outline-secondary fileinput-exists mt-3"
                                      data-dismiss="fileinput"
                                      onClick={this.handleRemoveFile}
                                    >
                                      {i18next.t("Remove")}
                                    </button>
                                  )}
                                </div>
                              </div>
                            </FormGroup>
                          </Col>
                          <Col md="12">
                            <FormGroup>
                              <label
                                className="form-control-label"
                                htmlFor="input-address"
                              >
                                {i18next.t("Country Name")}
                              </label>
                              <div>
                                <CountryDropdown
                                  className="form-control"
                                  value={country}
                                  onChange={(val) => this.selectCountry(val)}
                                />
                              </div>
                            </FormGroup>
                          </Col>
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
                                placeholder={i18next.t("Name")}
                                type="text"
                                name="cityName"
                                value={cityName}
                                onChange={(e) => this.handleChange(e)}
                              />
                            </FormGroup>
                          </Col>
                          <Col md="12">
                            <FormGroup>
                              <label
                                className="form-control-label"
                                htmlFor="state"
                              >
                                {i18next.t("State")}
                              </label>
                              <Input
                                className="form-control-alternative"
                                placeholder={i18next.t("State")}
                                type="text"
                                name="state"
                                value={state}
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
                                {i18next.t("City 2 - 3 letter short code")}
                              </label>
                              <Input
                                className="form-control-alternative"
                                placeholder={i18next.t("City 2 - 3 letter short code")}
                                type="test"
                                name="shortCode"
                                value={shortCode}
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
                                {i18next.t("Header Title")}
                              </label>
                              <Input
                                className="form-control-alternative"
                                placeholder={i18next.t("Header Title")}
                                type="text"
                                name="headerTitle"
                                value={headerTitle}
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
                                {i18next.t("Header Subtitle")}
                              </label>
                              <Input
                                className="form-control-alternative"
                                placeholder={i18next.t("Header Subtitle")}
                                type="text"
                                name="headerSubtitle"
                                value={headerSubtitle}
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
                          onClick={this.onCallAddCity}
                          disabled={
                            !cityName ||
                            !shortCode ||
                            !headerTitle ||
                            !headerSubtitle
                              ? true
                              : false
                          }
                        >
                          {i18next.t("save")}
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
export default connect(mapStateToProps, mapDispatchToProps)(CityRegistration);
