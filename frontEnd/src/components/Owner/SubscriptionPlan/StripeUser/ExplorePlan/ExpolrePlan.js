import React from "react";
// react plugin used to create google maps
import i18next from "i18next";
import {
  Card,
  CardHeader,
  CardBody,
  CardTitle,
  CardText,
  Container,
  Row,
  Col,
  Button,
} from "reactstrap";

// For Redux Data
import { bindActionCreators } from "redux";
import { ActCreators } from "../../../../../redux/bindActionCreator";
import { connect } from "react-redux";
import instance from "../../../../../axios";
import requests from "../../../../../requests";

// core components
import Sidebar from "../../../../Sidebar/Sidebar";

//Navbar
import Navbar from "../../../../Navbars/AdminNavbar";

import routes from "../../../../../ownerRoutes";

// Notification
import { errorToaster, successToaster } from "../../../../common/common-validation/common";

import PreviewDetail from "../ExplorePlan/PriviewDetail"

import "../ExplorePlan/ExplorePlan.css"
import { RazorpayUpdatePlan } from "../../RazorpayUser/RazorpayUpdatePlan";

let token = null;
let userData = {};
let storeCurrentPlan = {};

const mapStateToProps = (state) => {
  token = state.token;
  userData = state.userData;
  storeCurrentPlan = state.storeCurrentPlan;
};
const mapDispatchToProps = (dispatch) => {
  return bindActionCreators(ActCreators, dispatch);
};

class ExplorePlan extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      plans: [],
      previewShow: false,
      planDetails: {},
      callGetSubscriptionPlan: false,
      Explore: false,

      FlagForRazorpayUpgradModal:false,
      RazorpayUpgradModal:false,
      selectedPlan:{}
    };
  }

  handleClosePreviewModal = () => {
    this.setState({
      previewShow: false
    })
  }

  handleCloseRazorpayModal = () => {
    this.setState({
      FlagForRazorpayUpgradModal:false,
      RazorpayUpgradModal:false
    })
  }

  getPlan = async () => {
    let apiBody = {
      "country": `${userData.country_name}`,
      "userType": `${userData.userType}`
    };
    const response = await instance
      .post(requests.fetchPlan, apiBody, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .catch((error) => {
        let errorMessage = error.message;
        errorToaster(errorMessage);

      });
    if (response && response.data) {
      this.setState({
        plans: response.data.data.length > 0 ? response.data.data : []
      })
    }
  }

  UpdateRazorpayUserPlan = async (schedule_change_at) => {
    let apiBody = {
      "new_plan_id": `${this.state.selectedPlan._id}`,
      "schedule_change_at": `${schedule_change_at}`
    };
    const response = await instance
      .patch(requests.fetchUpdateRazorpayPlan, apiBody, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .catch((error) => {
        let errorMessage = error.message;
        errorToaster(errorMessage);

      });
    if (response && response.data) {
      this.setState({
        plans: response.data.data.length > 0 ? response.data.data : []
      })
    }
  }

  selectPlan(selectedPlan) {
    this.setState({
      selectedPlan: selectedPlan,
    }, () => {
      if (userData.country_name === "India") {
        this.setState({
          FlagForRazorpayUpgradModal: true,
          RazorpayUpgradModal: true
        })
      } else {
        this.setState({
          previewShow: true
        })
      }
    })
  }

  redirectToSubscriptionPlan = () => {
    const { history } = this.props;
    if (history) {
      history.push(`/subscription-plan`);
    }
  }

  componentDidMount = () => {
    this.getPlan();
  };

  render() {
    const { countries, plans, planDetails, callGetSubscriptionPlan } = this.state;
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
              <div className="col">
                <Card className="shadow">
                  <CardHeader className="border-0">
                    <div className="d-flex justify-content-between">
                      <div className="md-7">
                        <h1 className="mb-0">{i18next.t("Explore Plans")}</h1>

                      </div>
                      <div className="md-5">
                        <Row>
                          <Col>
                            <Button
                              color="primary"
                              size="sm"
                              onClick={this.redirectToSubscriptionPlan}
                            >
                              Back
                            </Button>
                          </Col>
                        </Row>
                      </div>
                    </div>
                  </CardHeader>
                  <Row>
                    <Col className="p-3 ml-5" md={12} ld={12} sm={12} xs={12} lg={12}>
                      Select You Upgrade Plan
                    </Col>
                   
                    {
                      plans.map((country, i) => {
                        return (
                          <>
                            {/* <Col className="p-3 ml-5" md={12} ld={12} sm={12} xs={12} lg={12}> */}
                            {
                              country.data.map((plan, j) => {
                                if (plan.is_active === true && storeCurrentPlan.plan_id._id !== plan._id) {
                                  return (
                                    <>
                                      <Card md={3} ld={3} sm={6} xs={12} lg={3} className="Plan ml-5 mt-3 mb-3" style={{ width: "18rem" }}>
                                        <CardBody style={{ pointerEvents: "auto", opacity: "1", cursor: "pointer", }}
                                          onClick={() => this.selectPlan(plan)}
                                        >
                                          <CardTitle className="display-3"> {plan.title} </CardTitle>
                                          <CardTitle className="display-4">
                                            {plan.currency_symbol} {" "}
                                            {plan.unit_amount} / {
                                              plan.hasOwnProperty("stripe_price") ? plan.stripe_price.recurring.interval : plan.hasOwnProperty("recurring") ? plan.recurring.interval : ""
                                            }
                                          </CardTitle>
                                          <CardTitle className="display-4"> Features </CardTitle>
                                          <CardText>
                                            {plan.content}
                                          </CardText>
                                        </CardBody>
                                      </Card>
                                    </>
                                  )
                                }

                              })
                            }
                            {/* </Col> */}
                          </>
                        )
                      })
                    }
                  </Row>

                </Card>
              </div>
            </Row>
            {this.state.previewShow === true &&
              <PreviewDetail
                onClose={this.handleClosePreviewModal}
                show={this.state.previewShow}
                selectedPlan={this.state.selectedPlan}
                props={this.props}
              />
            }
            {
              this.state.FlagForRazorpayUpgradModal === true &&
              <RazorpayUpdatePlan
                onClose={this.handleCloseRazorpayModal}
                show={this.state.RazorpayUpgradModal}
                selectedPlan={this.state.selectedPlan}
                props={this.props}
                UpdateRazorpayUserPlan = {this.UpdateRazorpayUserPlan}
              />
            }
          </Container>
        </div>


      </>
    );
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(ExplorePlan);
