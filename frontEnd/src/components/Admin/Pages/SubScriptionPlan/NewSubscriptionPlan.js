import React from "react";

import axios from "axios";

// react plugin used to create google maps


import NewSubScription from "./NewSubscriptionPlan";
import i18next from "i18next";
import {
  Card,
  CardHeader,
  CardBody,
  FormFeedback,
  Container,
  Row,
  Col,
  Label,
  Button,
  FormGroup,
  Form,
  Input,

} from "reactstrap";
import { Dropdown } from "semantic-ui-react";

import AdminFooter from "../../../Footers/AdminFooter.js";
import Sidebar from "../../../Sidebar/Sidebar.js";

import routes from "../../../../routes";

//Navbar
import Navbar from "../../../Navbars/AdminNavbar";

// For Notification 
import { errorToaster, successToaster } from "../../../common/common-validation/common"

// for Redux
import { bindActionCreators } from "redux";
import { ActCreators } from "../../../../redux/bindActionCreator";
import { connect } from "react-redux";

// for api integration
import instance from "../../../../axios";
import requests from "../../../../requests";

let token = null;
const mapStateToProps = (state) => {
  token = state.token;
};

const mapDispatchToProps = (dispatch) => {
  return bindActionCreators(ActCreators, dispatch);
};

class NewSubscriptionPlan extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      title: "",
      content: "",
      country: "",
      currency: "",
      unit_amount: "",
      interval: "",
      is_active: "",
      usage_threshold: "",
      usage_charge_unit: null,
      trial_days: "",
      intervalOBForStripe: [
        { value: "day", key: "Day", text: "Day" },
        { value: "week", key: "Week", text: "Week" },
        { value: "month", key: "Month", text: "Month" },
        { value: "year", key: "Year", text: "Year" }
      ],
      intervalOBForRazorpay: [
        { value: "daily", key: "Daily", text: "Daily" },
        { value: "weekly", key: "Weekly", text: "Weekly" },
        { value: "monthly", key: "Monthly", text: "Monthly" },
        { value: "yearly", key: "Yearly", text: "Yearly" }
      ],
      intervalCount: "",
      currencies: [],
      countries: [],
      country_code: '',

      consumer: "",
      consumerData: [
        { value: "owner", key: "Owner", text: "Owner" },
        { value: "driver_aggregator", key: "Driver Aggregator", text: "Driver Aggregator" }
      ],
      diver_capacity: null
    };
  }

  getOrsetCountries = () => {
    axios.get("https://restcountries.eu/rest/v2/?fields=name;")
      .then((response) => {
        let country = response.data
        let countries = []
        country.map((item, i) => {

          let countryOB = {
            value: item.name,
            key: item.name,
            text: item.name,
          };
          countries.push(countryOB)

        })
        this.setState({
          countries: countries
        })
      })
  }


  componentDidMount = async () => {
    this.getOrsetCountries();
  }

  handleSelectChange = (e, data) => {
    this.setState({
      [data.name]: data.value,
    });
  };

  handleSelectChangeForCountry = (e, data) => {
    this.setState({
      [data.name]: data.value,
    }, () => {
      axios.get(`https://restcountries.eu/rest/v2/name/${this.state.country.toLowerCase()}?fullText=true&fields=name;currencies;alpha2Code;`)
        .then((response) => {
          let currency = response.data[0].currencies
          let currencies = []
          currency.map((item, i) => {
            let currencyOB = {
              value: item,
              key: item.code,
              text: `${item.code} ( ${item.name}  ${item.symbol} )`,
            };
            currencies.push(currencyOB)
          })
          this.setState({
            currencies: currencies,
            country_code: response.data[0].alpha2Code
          })
        })
    });
  };

  handleChange = (e) => {
    this.setState(
      {
        [e.target.name]: e.target.value,
      });
  };

  redirectToList = () => {
    const { history } = this.props;
    if (history) history.push("/subscription-plan");
  }

  AddNewPlan = async () => {
    let trial_days = this.state.trial_days
    const apiBody = {}

    if (trial_days) {
      apiBody.trial_days = trial_days
    }

    if (this.state.consumer === "owner") {
      apiBody = {
        title: this.state.title,
        content: this.state.content,
        country: this.state.country,
        country_code: this.state.country_code.toLowerCase(),
        currency: this.state.currency.code.toLowerCase(),
        currency_symbol: this.state.currency.symbol,
        unit_amount: this.state.unit_amount,
        interval: this.state.interval,
        interval_count: this.state.intervalCount,
        is_active: "true",
        userType: this.state.consumer,
        usage_charge_unit: this.state.usage_charge_unit,
        usage_threshold: this.state.usage_threshold
      }
    } else {
      apiBody = {
        title: this.state.title,
        content: this.state.content,
        country: this.state.country,
        country_code: this.state.country_code.toLowerCase(),
        currency: this.state.currency.code.toLowerCase(),
        currency_symbol: this.state.currency.symbol,
        unit_amount: this.state.unit_amount,
        interval: this.state.interval,
        interval_count: this.state.intervalCount,
        is_active: "true",
        userType: this.state.consumer,
        diver_capacity: this.state.diver_capacity
      }
    }
    let API = null;
    if (this.state.country.toLowerCase() === "india") {
      API = requests.fetchRazorpayAddNewPlan;

    } else {
      API = requests.fetchAddNewPlan
    }
    const response = await instance
      .post(API, apiBody, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .catch((error) => {
        let errorMessage = error.response.data.error.message;
        console.log("Error => ", error);
        errorToaster(errorMessage);
      });
    if (response && response.data) {
      successToaster("Plan Successfully added!");
      const { history } = this.props;
      if (history) history.push("/subscription-plan");
    }
  };

  render() {
    const { countries, country, intervalOBForStripe, intervalOBForRazorpay, trial_days, diver_capacity, intervalCount } = this.state
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
                        <h1 className="mb-0">{i18next.t("Add New Subscription Plan")}</h1>
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
                          <Col md="12">
                            <FormGroup>
                              <Label for="Name">{i18next.t("Title")}</Label>
                              <Input
                                className="px-2 py-4"
                                type="text"
                                placeholder={i18next.t("Title")}
                                name="title"
                                onChange={this.handleChange}
                              />
                            </FormGroup>
                          </Col>
                        </Row>
                        <Row>
                          <Col md="12">
                            <FormGroup>
                              <Label for="Content">{i18next.t("Content")}</Label>
                              <Input
                                className="px-2 py-4"
                                type="text"
                                placeholder={i18next.t("Content")}
                                name="content"
                                onChange={this.handleChange}
                              />
                            </FormGroup>
                          </Col>
                        </Row>
                        <Row>
                          <Col md="12">
                            <FormGroup>
                              <Label for="country">{i18next.t("Country Name")}</Label>
                              <Dropdown
                                placeholder={i18next.t("Select Country")}
                                fluid
                                search
                                selection
                                clearable
                                name="country"
                                options={countries}
                                onChange={this.handleSelectChangeForCountry}
                              // name="client"
                              />
                            </FormGroup>
                          </Col>
                        </Row>
                        {
                          country &&
                          <Row>
                            <Col md="12">
                              <FormGroup>
                                <Label for="Currency Code">{i18next.t("Currency Code")}</Label>
                                <Dropdown
                                  placeholder={i18next.t("Currency Code")}
                                  fluid
                                  search
                                  selection
                                  clearable
                                  name="currency"
                                  options={this.state.currencies}
                                  onChange={this.handleSelectChange}
                                // name="client"
                                />
                              </FormGroup>
                            </Col>
                          </Row>
                        }

                        <Row>
                          <Col md="12">
                            <FormGroup>
                              <Label for="unit_amount">{i18next.t("Unit Amount")}</Label>
                              <Input
                                className="px-2 py-4"
                                type="text"
                                placeholder="Unit Amount"
                                name="unit_amount"
                                onChange={this.handleChange}
                              />
                            </FormGroup>
                          </Col>
                        </Row>
                        {
                          country &&
                          <Row>
                            <Col md="12">
                              <FormGroup>
                                <Label for="interval">{i18next.t("Interval")}</Label>
                                <Dropdown
                                  placeholder="Select Interval"
                                  fluid
                                  search
                                  selection
                                  clearable
                                  name="interval"
                                  options={country.toLowerCase() === "india" ? intervalOBForRazorpay : intervalOBForStripe}
                                  onChange={this.handleSelectChange}
                                // name="client"
                                />
                              </FormGroup>
                            </Col>
                          </Row>
                        }
                        <Row>
                          <Col md="12">
                            <FormGroup>
                              <Label for="Interval Count">{i18next.t("Interval Count")}</Label>
                              <Input
                                className="px-2 py-4"
                                type="number"
                                placeholder="Interval Count (Plan Periodically Interval)"
                                name="intervalCount"
                                onChange={this.handleChange}
                                min="1"
                                invalid={intervalCount < 0}
                              />
                              Note: if country is india and selected interval is daily than inteval must be greter then 6
                              <FormFeedback invalid>
                                Uh oh! please give a valid price.
                              </FormFeedback>
                            </FormGroup>
                          </Col>
                        </Row>
                        <Row>
                          <Col md="12">
                            <FormGroup>
                              <Label for="Restaurant">{i18next.t("Consumer")}</Label>
                              <Dropdown
                                placeholder={i18next.t("Select Consumer")}
                                fluid
                                //search
                                selection
                                //clearable
                                name="consumer"
                                options={this.state.consumerData}
                                onChange={this.handleSelectChange}
                              // name="client"
                              />
                            </FormGroup>
                          </Col>
                        </Row>
                        {
                          this.state.consumer === "driver_aggregator" &&
                          <Row>
                            <Col md="12">
                              <FormGroup>
                                <Label for="Driver Capacity">{i18next.t("Driver Capacity")}</Label>
                                <Input
                                  className="px-2 py-4"
                                  type="number"
                                  placeholder="Enter The Driver Capacity"
                                  name="diver_capacity"
                                  value={diver_capacity}
                                  onChange={this.handleChange}
                                  min="0"
                                  invalid={diver_capacity < 0}
                                />
                                <FormFeedback invalid>
                                  Uh oh! please give a valid price.
                                </FormFeedback>
                              </FormGroup>
                            </Col>
                          </Row>
                        }

                        {
                          this.state.consumer === "owner" &&
                          <>
                            <Row>
                              <Col md="12">
                                <FormGroup>
                                  <Label for="usage_charge_unit">{i18next.t("Usage Charge Unit")}</Label>
                                  <Input
                                    className="px-2 py-4"
                                    type="text"
                                    placeholder={i18next.t("Usage Charge Unit")}
                                    name="usage_charge_unit"
                                    onChange={this.handleChange}
                                  />
                                </FormGroup>
                              </Col>
                            </Row>
                            <Row>
                              <Col md="12">
                                <FormGroup>
                                  <Label for="usage_threshold">{i18next.t("Usage Threshold")}</Label>
                                  <Input
                                    className="px-2 py-4"
                                    type="text"
                                    placeholder={i18next.t("Usage Threshold")}
                                    name="usage_threshold"
                                    onChange={this.handleChange}
                                  />
                                </FormGroup>
                              </Col>
                            </Row>
                          </>
                        }

                        <Row>
                          <Col md="12">
                            <FormGroup>
                              <Label for="trial_days">{i18next.t("Trial Days ( Optional )")}</Label>
                              <Input
                                className="px-2 py-4"
                                type="text"
                                placeholder={i18next.t("Trial Days")}
                                name="trial_days"
                                onChange={this.handleChange}
                              />
                            </FormGroup>
                          </Col>
                        </Row>


                      </div>
                      <center>
                        <div className="text-center my-">
                          <Button
                            className="my-3 p-3"
                            color="primary"
                            type="button"
                            onClick={this.AddNewPlan}
                          >
                            {i18next.t('save')}
                          </Button>
                        </div>
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

export default connect(mapStateToProps, mapDispatchToProps)(NewSubscriptionPlan);
