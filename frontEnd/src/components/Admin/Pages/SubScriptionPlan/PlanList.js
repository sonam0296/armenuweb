import React from "react";
// react plugin used to create google maps
import i18next from "i18next";
import {
  Card,
  CardHeader,
  CardBody,
  CardTitle,
  CardText,
  FormGroup,
  InputGroup,
  Container,
  Row,
  Col,
  Label,
  Button,
  NavItem,
  Nav,
  NavLink,
  TabContent,
  TabPane,
} from "reactstrap";

import classnames from "classnames";

// For Redux Data
import { bindActionCreators } from "redux";
import { ActCreators } from "../../../../redux/bindActionCreator";
import { connect } from "react-redux";
import instance from "../../../../axios";
import requests from "../../../../requests";

import axios from "axios";

import { Dropdown } from "semantic-ui-react";

import CancelPlanModal from "../../../SubcriptionPlan/CancelDisablePlan/cancelDisablePlan"
// Notification
import { errorToaster, successToaster } from "../../../common/common-validation/common";
import EditSubscriptionModal from "./EditSubscriptionModal";

let token = null;

const mapStateToProps = (state) => {
  token = state.token;
};
const mapDispatchToProps = (dispatch) => {
  return bindActionCreators(ActCreators, dispatch);
};
class PlanList extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      datas: undefined,
      newPlanShow: false,
      countries: [],
      country: ["India"],
      plans: [],
      ShowEditModal: false,
      ShowCancellationModal: false,
      flagShowCancelModal: false,
      disablePlan: {},
      tabs: 1,
      userType: "owner"

    };
  }

  toggleNavs = (e, state, index) => {
    e.preventDefault();
    this.setState({
      [state]: index,
    }, () => {
      if (this.state.tabs === 1) {
        this.setState({
          userType: "owner"
        }, () => {
          this.getPlan(this.state.country.map((data) => data));
        })

      } else if (this.state.tabs === 2) {
        this.setState({
          userType: "driver_aggregator"
        }, () => {
          this.getPlan(this.state.country.map((data) => data));
        })
      }
    });
  };

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

  handleSelectChange = (e, data) => {
    // let oldValues = this.state.country;
    // //let intersection = oldValues.filter(x => !data.value.includes(x));

    // let difference = oldValues
    //              .filter(x => !data.value.includes(x))
    //              .concat(data.value.filter(x => !oldValues.includes(x)));


    // console.log("Difference === > ", difference);

    this.setState({
      [data.name]: data.value,
    }, () => {
      this.getPlan(this.state.country.map((data) => data))
    });
  };

  getPlan = async (Countries) => {
    if (Countries.length > 0) {
      let apiBody = {
        "country": `${Countries}`,
        "userType": `${this.state.userType}`
      };
      // , {
      //   headers: {
      //     Authorization: `Bearer ${token}`,
      //   },
      // }
      const response = await instance
        .post(requests.fetchPlan, apiBody)
        .catch((error) => {
          let errorMessage = error.message;
          // errorToaster(errorMessage);
          errorToaster("No plan found for " + Countries);

        });
      if (response && response.data) {
        this.setState({
          plans: response.data.data.length > 0 ? response.data.data : []
        })
      }
    }

  }

  onCloseCancelPlan = () => {
    this.setState({
      ShowCancellationModal: false,
      flagShowCancelModal: false
    }, () => {
      this.getPlan(this.state.country.map((data) => data))
    });
  }

  componentDidMount = () => {
    this.getOrsetCountries();
    this.getPlan(this.state.country.map((data) => data));
  };

  createSubscriptionPlan = () => {
    const { history } = this.props;
    if (history) history.push("/subscription-plan/create");
  };

  editPlan = (selectedPlan) => {
    this.setState({
      flagShowEditModal: true,
      ShowEditModal: true
    })
    this.props.SELECTED_PLAN_INFO(selectedPlan);
  }

  onCloseEditModal = () => {
    this.setState({
      ShowEditModal: false,
      flagShowEditModal: false,
    }, () => {
      this.getPlan(this.state.country.map((data) => data));
    })
  }

  disablePlan = (selectedPlan) => {
    // this.props.SELECTED_PLAN_INFO(selectedPlan)
    this.setState({
      disablePlan: selectedPlan,
      flagShowCancelModal: true,
      ShowCancellationModal: true
    })

  }

  render() {
    const { countries, plans } = this.state;
    const IsActive = {

    };
    const IsDisable = {
      pointerEvents: "none",
      opacity: "0.4",
    };

    return (
      <>
        {/* header */}
        <Container className="pt-7" fluid>
          <Row>
            <div className="col">
              <Card className="shadow">
                <CardHeader className="border-0">
                  <div className="d-flex justify-content-between">
                    <div className="md-7 xs-12">
                      <h1 className="mb-0">{i18next.t("Subscription Plans")}</h1>
                    </div>
                    <div className="md-5">
                      <Row>
                        <Col>
                          <Button
                            color="primary"
                            size="sm"
                            type="button"
                            onClick={this.createSubscriptionPlan}
                          >
                            {i18next.t("Add New Subscription Plans")}
                          </Button>
                        </Col>
                      </Row>
                    </div>
                  </div>
                </CardHeader>
                <CardBody>
                  <Row>
                    <Col className="p-5" md={12} lg={12} xl={12} xs={12} sm={12}>
                      <Nav
                        // className="nav-fill flex-column flex-md-row tabbable sticky "
                        className="nav-fill flex-column flex-md-row"
                        id="tabs-icons-text"
                        pills
                        role="tablist"
                      >
                        <NavItem className="p-3">
                          <NavLink
                            aria-selected={this.state.tabs === 1}
                            className={classnames("mb-sm-3 mb-md-0", {
                              active: this.state.tabs === 1,
                            })}
                            onClick={(e) => this.toggleNavs(e, "tabs", 1)}
                            href="#pablo"
                            role="tab"
                          >
                            <i className="ni ni-shop text-info mr-2"></i>
                            {/* <i className="ni ni-cloud-upload-96 mr-2" /> */}
                            {("Subscription Plan For Owner")}
                          </NavLink>
                        </NavItem>
                        <NavItem className="p-3">
                          <NavLink
                            aria-selected={this.state.tabs === 2}
                            className={classnames("mb-sm-3 mb-md-0", {
                              active: this.state.tabs === 2,
                            })}
                            onClick={(e) => this.toggleNavs(e, "tabs", 2)}
                            href="#pablo"
                            role="tab"
                          >
                            <i className="fas fa-biking text-info mr-2"></i>
                            {i18next.t("Subscription Plan For Driver Aggregator")}
                          </NavLink>
                        </NavItem>
                      </Nav>

                    </Col>
                  </Row>

                  <Row>
                    <Col md={12} lg={12} xl={12} xs={12} sm={6}>
                      <FormGroup>
                        <Label for="DateFrom"> {i18next.t("Filter By Country")} </Label>
                        <InputGroup className="input-group-alternative">
                          <Dropdown
                            placeholder={i18next.t("Select Country")}
                            fluid
                            search
                            selection
                            clearable
                            multiple
                            name="country"
                            options={countries}
                            defaultValue={"India"}
                            onChange={this.handleSelectChange}
                          // name="client"
                          />
                        </InputGroup>
                      </FormGroup>
                    </Col>
                  </Row>
                  <TabContent
                    activeTab={this.state.tabs}
                    sm={12}
                    md={12}
                    xl={12}
                    xs={12}
                  >
                    <Row>
                      {
                        plans.map((country, i) => {
                          return (
                            <>
                              <TabPane tabId={i} md={12} ld={12} sm={12} xs={12} lg={12}>
                                <Row className="p-3" md={12} ld={12} sm={12} xs={12} lg={12}>
                                  <Col md={12} ld={12} sm={12} xs={12} lg={12}>
                                    <h2>{country._id}</h2>
                                  </Col>
                                </Row>
                                <Row className="p-3" md={12} ld={12} sm={12} xs={12} lg={12}>
                                  {
                                    country.data.map((plan, j) => {
                                      return (
                                        <>
                                          <Card className="ml-4 mb-4" style={{ width: "18rem" }}>
                                            <CardBody style={{ pointerEvents: plan.is_active === false ? "none" : "auto", opacity: plan.is_active === false ? "0.4" : "1", }}>
                                              {
                                                plan.is_active === true ?
                                                  <CardTitle className="display-3"> {plan.title} </CardTitle>
                                                  :
                                                  <CardTitle className="display-3"> <del>{plan.title} </del></CardTitle>
                                              }
                                              <CardTitle className="display-4">
                                                {
                                                  plan.hasOwnProperty("currency_symbol") ?
                                                    plan.currency_symbol
                                                    :
                                                    "₹"
                                                }

                                                {" "}
                                                {plan.unit_amount} /
                                                {" "}
                                                {
                                                  plan.hasOwnProperty("stripe_price") ? plan.stripe_price.recurring.interval : plan.hasOwnProperty("recurring") ? plan.recurring.interval : ""
                                                }
                                              </CardTitle>
                                              <Button
                                                color="primary"
                                                onClick={() => this.editPlan(plan)}
                                                disabled = {plan.is_active===false ? true : false}
                                              >
                                                Edit
                                              </Button>
                                              <Button
                                                color="danger"
                                                onClick={() => this.disablePlan(plan)}
                                                disabled = {plan.is_active===false ? true : false}
                                              >
                                                Archive
                                              </Button>
                                              <CardTitle className="display-4 mt-4"> Features </CardTitle>
                                              <CardText>
                                                {plan.content}
                                              </CardText>
                                            </CardBody>
                                          </Card>
                                        </>
                                      )
                                    })
                                  }
                                </Row>
                              </TabPane>
                            </>
                          )
                        })
                      }
                    </Row>

                  </TabContent>

                </CardBody>
              </Card>
            </div>
          </Row>
          {this.state.flagShowEditModal === true &&
            <EditSubscriptionModal
              show={this.state.ShowEditModal}
              onClose={() => this.onCloseEditModal()}
            />
          }
          {
            this.state.flagShowCancelModal === true &&
            <CancelPlanModal
              show={this.state.ShowCancellationModal}
              onClose={() => this.onCloseCancelPlan()}
              disablePlan={this.state.disablePlan}

            />
          }
        </Container>
      </>
    );
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(PlanList);
