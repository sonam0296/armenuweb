import React, { Component } from 'react';

import i18next from "i18next";
import {
    Card,
    CardBody,
    CardTitle,
    CardText,
    Row,
    Col,
    Button,
} from "reactstrap";

// For Redux Data
import { bindActionCreators } from "redux";
import { ActCreators } from "../../../../redux/bindActionCreator";
import { connect } from "react-redux";
import instance from "../../../../axios";
import requests from "../../../../requests";

import moment from "moment"

import { Redirect } from "react-router-dom"
// Notification
import { errorToaster, successToaster } from "../../../common/common-validation/common";

import "../StripeUser/ExplorePlan/ExplorePlan.css";
import CancelPlanModal from "../../../SubcriptionPlan/CancelDisablePlan/cancelDisablePlan";



let token = null;
let userData = {};


const mapStateToProps = (state) => {
    token = state.token;
    userData = state.userData
};
const mapDispatchToProps = (dispatch) => {
    return bindActionCreators(ActCreators, dispatch);
};

class StripeUser extends Component {
    constructor(props) {
        super(props);

        this.state = {

            flagOfUser: false,
            User: {},

            plans: [],
            planDetails: {},
            callGetSubscriptionPlan: false,
            Explore: false,
            Status: "",
            ShowCancellationModal: false,
            cancellationPlan: {},
            is_subscription_schedule: null
        };

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
                let errorMessage = error.response.data.error.message;
                errorToaster(errorMessage);
                console.log(error.response.data.error.message)
            });
        if (response && response.data) {
            this.setState({
                plans: response.data.data.length > 0 ? response.data.data : []
            })
        }
    }

    getUserInfo = async () => {
        const response = await instance
            .get(`${requests.fetchGetUserProfileData}/${userData._id}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })
            .catch((error) => {
                let errorMessage = error.response.data.error.message;
                console.log(errorMessage);
                errorToaster(errorMessage);

            });
        if (response && response.data) {
            this.setState({
                flagOfUser: true,
                User: response.data.data.user,
                Status: response.data.data.user.subscription_status.status,
            })

        }
    }

    getSubscriptionPlan = async () => {
        let API = userData.userType === "owner" ? requests.fetchGetParticularOwnerSubscriptionPlan
            : requests.fetchGetParticularDriverAggregatorSubscriptionPlan
        const response = await instance
            .get(API, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })
            .catch((error) => {
                let errorMessage = error.response.data.error.message;
                errorToaster(errorMessage);

            });
        if (response && response.data) {
            let storeCurrentPlan = response.data.data[0];
            this.props.STORE_CURRENT_PLAN(storeCurrentPlan);
            this.setState({ planDetails: response.data.data }, () => {
                this.setState({
                    callGetSubscriptionPlan: true
                })
            })
        }
    }

    createNewSubscriptionPlan = async (selectedPlan) => {
        const paymentMethodId = userData.stripe_customer.invoice_settings.default_payment_method;
        let requestBody = {
            "plan_id": selectedPlan._id,
            "customer": userData.stripe_customer.id,
            "paymentMethodId": paymentMethodId,
            "price": selectedPlan.stripe_price.id,
        };
        const response = await instance
            .post(requests.fetchSubscribePlan, requestBody, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })
            .catch((error) => {
                let errorMessage = error.response.data.error.message;
                errorToaster(errorMessage);
            });
        if (response && response.data) {
            successToaster("Subscription successfully done!");
            this.setState({
                SubscriptionStatus: true
            })
            this.getUserInfo();
            this.getSubscriptionPlan();
        }
    }

    onCloseCancelPlan = () => {
        this.setState({ ShowCancellationModal: false }, () => {
            this.getUserInfo();
            this.getSubscriptionPlan();
        });
    }

    componentDidMount = () => {
        this.getUserInfo();
        this.getPlan();
        this.getSubscriptionPlan();
    };

    redirectToExplore = () => {
        this.setState({
            Explore: true,
        })
        const { history } = this.props;
        if (history) {
            history.push(`/subscription-plan/explorePlan`);
        }
    }

    cancelSubscriptionPlan = (cancellationPlan, planType) => {
        this.setState({
            ShowCancellationModal: true,
            cancellationPlan: cancellationPlan,
            is_subscription_schedule: planType === "not_started" ? true : false
        })
    }


    render() {
        const { Status, User, countries, plans, planDetails, callGetSubscriptionPlan } = this.state;
        if (this.state.Explore === true) {
            return (
                <Redirect to="/subscription-plan/explorePlan" />
            )
        }
        return (
            <div>
                {
                    Status === "no_plan_selected" || Status === "canceled"
                        ?
                        <Row>
                            <div className="col">
                                <Row className="p-3" md={12} lg={12} xl={12} xs={12} sm={12} >
                                    <Col>
                                        <h4> Currently You have no plan. </h4>
                                        <h4> Please Select Your Subscription Plan. </h4>
                                    </Col>
                                </Row>
                                <Row className="p-3" md={12} lg={12} xl={12} xs={12} sm={12} >
                                    {
                                        plans.map((country, i) => {
                                            return (
                                                <>
                                                    {
                                                        country.data.map((plan, j) => {
                                                            if (plan.is_active === true) {
                                                                return (
                                                                    <>
                                                                        <Col className="p-3" md={6} lg={4} xl={4} xs={12} sm={6}>
                                                                            <Card className="Plan mx-auto" >
                                                                                <CardBody style={{ pointerEvents: "auto", opacity: "1", cursor: "pointer", }} onClick={() => { if (window.confirm('Are you sure you want to continue with selected plan?')) { this.createNewSubscriptionPlan(plan) } }}>
                                                                                    <CardTitle className="display-3"> {plan.title} </CardTitle>
                                                                                    <CardTitle className="display-4">
                                                                                        {userData.currencies.symbol} {" "}
                                                                                        {plan.unit_amount} / {plan.stripe_price.recurring.interval}
                                                                                    </CardTitle>
                                                                                    <CardTitle className="display-4"> Features </CardTitle>
                                                                                    <CardText>
                                                                                        {plan.content}
                                                                                    </CardText>

                                                                                </CardBody>
                                                                            </Card>
                                                                        </Col>
                                                                    </>
                                                                )
                                                            }
                                                        })
                                                    }
                                                </>
                                            )
                                        })
                                    }
                                </Row>
                            </div>
                        </Row>
                        :
                        callGetSubscriptionPlan === true &&
                        <Row>
                            <div className="col">
                                <Row >
                                    <Col className="ml-4 mt-5">
                                        <h3>
                                            Your All Plan Detail
                                    </h3>
                                    </Col>
                                </Row>
                                <Row>
                                    {
                                        planDetails.map((data, i) => {
                                            if (data.subscription_status === "canceled") {
                                                return (
                                                    <Col className="p-3" md={12} ld={12} sm={12} xs={12} lg={12}>
                                                        <Card>
                                                            <CardBody style={{ pointerEvents: "auto", opacity: "1" }}>
                                                                <Row className="p-3">
                                                                    <Col md={12} ld={12} sm={12} xs={12} lg={12}>
                                                                        <h2 className="RedFont"> Canceled Subscription Plan </h2>
                                                                    </Col>
                                                                </Row>
                                                                <Row className="p-3">
                                                                    <Col md={12} ld={12} sm={12} xs={12} lg={12}>
                                                                        <h3 className="RedFont"> Cancellation Reason: {data.cancellation_reason}  </h3>
                                                                    </Col>
                                                                </Row>

                                                                <Row className="p-3">
                                                                    <Col className="p-3" md={3} ld={3} sm={3} xs={12} lg={3}>
                                                                        <h3> Title: {data.plan_id.title} </h3>
                                                                    </Col>
                                                                    <Col className="p-3" md={3} ld={3} sm={3} xs={12} lg={3}>
                                                                        <h3>
                                                                            Amount/Period:<br />
                                                                            {userData.currencies.symbol} {" "}
                                                                            {data.plan_id.unit_amount} / {data.plan_id.stripe_price.recurring.interval}
                                                                        </h3>
                                                                    </Col>
                                                                </Row>
                                                                <Row className="p-3">
                                                                    <Col md={12} ld={12} sm={12} xs={12} lg={12}>
                                                                        <CardTitle className="display-4"> Features </CardTitle>
                                                                        <CardText>
                                                                            {data.plan_id.content}
                                                                        </CardText>
                                                                    </Col>
                                                                </Row>
                                                            </CardBody>
                                                        </Card>
                                                    </Col>
                                                )
                                            }
                                            else if (data.subscription_status === "deprecated") {
                                                return (
                                                    <Col className=" p-3" md={12} ld={12} sm={12} xs={12} lg={12}>
                                                        <Card>
                                                            <CardBody style={{ pointerEvents: "auto", opacity: "1" }}>
                                                                <Row className="p-3">
                                                                    <h2 className="GreenFont"> Active Subscription Plan </h2>
                                                                </Row>
                                                                <Row className="p-3">
                                                                    <Col className="p-3" md={3} ld={3} sm={3} xs={12} lg={3}>
                                                                        <h3> Title: {data.plan_id.title} </h3>
                                                                    </Col>
                                                                    <Col className="p-3" md={3} ld={3} sm={3} xs={12} lg={3}>
                                                                        <h3>
                                                                            Amount/Period:<br />
                                                                            {userData.currencies.symbol} {" "}
                                                                            {data.plan_id.unit_amount} / {data.plan_id.stripe_price.recurring.interval}
                                                                        </h3>
                                                                    </Col>
                                                                    <Col className="p-3" md={3} ld={3} sm={3} xs={12} lg={3}>
                                                                        <h3>
                                                                            Subscription Start Date:<br />
                                                                            {
                                                                                moment.unix(data.stripe_subscription_cycle.current_period_start).format('Do MMM YYYY, hh:mm a')
                                                                            }
                                                                        </h3>
                                                                    </Col>
                                                                    <Col className="p-3" md={3} ld={3} sm={3} xs={12} lg={3}>
                                                                        <h3>
                                                                            Subscription End Date:<br />
                                                                            {
                                                                                moment.unix(data.stripe_subscription_cycle.current_period_end).format('Do MMM YYYY, hh:mm a')
                                                                            }
                                                                        </h3>
                                                                    </Col>
                                                                </Row>
                                                                <Row className="p-3">
                                                                    <Col className="p-3" md={12} ld={12} sm={12} xs={12} lg={12}>
                                                                        <CardTitle className="display-4"> Features </CardTitle>
                                                                        <CardText>
                                                                            {data.plan_id.content}
                                                                        </CardText>
                                                                    </Col>
                                                                </Row>
                                                                {userData.subscription_status.status === "deprecated"
                                                                    ?
                                                                    <Row>
                                                                        <Col>
                                                                            <Button
                                                                                className="mt-3"
                                                                                color="primary"
                                                                                onClick={this.redirectToExplore}
                                                                            >
                                                                                Explore Your Plan
                                                                </Button>
                                                                            <Button
                                                                                className="mt-3"
                                                                                color="danger"
                                                                                onClick={() => this.cancelSubscriptionPlan(data, data.subscription_status)}
                                                                            >
                                                                                Cancel Your Plan
                                                                </Button>
                                                                        </Col>
                                                                    </Row>
                                                                    :
                                                                    <Row className="p-3">
                                                                        <Col md={12} ld={12} sm={12} xs={12} lg={12}>
                                                                            <h3> Note:</h3>
                                                                            <h4>
                                                                                If scheduler plan is available then you can't unsubscribe.
                                                                                First you need to unsubscribe schedular plan.
                                                                </h4>

                                                                        </Col>
                                                                    </Row>
                                                                }
                                                            </CardBody>
                                                        </Card>
                                                    </Col>
                                                )
                                            }
                                            else if (data.subscription_status === "not_started") {
                                                return (
                                                    <Col className="p-3" md={12} ld={12} sm={12} xs={12} lg={12}>
                                                        <Card>
                                                            <CardBody style={{ pointerEvents: "auto", opacity: "1" }}>
                                                                <Row className="p-3">
                                                                    <Col>
                                                                        <h2> Schedular Plan </h2>
                                                                        <h2 className="GrayFont"> This Plan Starts After the Current Subscription Plan End...  </h2>
                                                                    </Col>
                                                                </Row>
                                                                <Row className="p-3">
                                                                    <Col className="p-3" md={3} ld={3} sm={3} xs={12} lg={3}>
                                                                        <h3> Title: {data.plan_id.title} </h3>
                                                                    </Col>
                                                                    <Col className="p-3" md={3} ld={3} sm={3} xs={12} lg={3}>
                                                                        <h3>
                                                                            Amount/Period:<br />
                                                                            {userData.currencies.symbol} {" "}
                                                                            {data.plan_id.unit_amount} / {data.plan_id.stripe_price.recurring.interval}
                                                                        </h3>
                                                                    </Col>
                                                                    <Col className="p-3" md={3} ld={3} sm={3} xs={12} lg={3}>

                                                                    </Col>
                                                                    <Col className="p-3" md={3} ld={3} sm={3} xs={12} lg={3}>

                                                                    </Col>
                                                                </Row>
                                                                <Row className="p-3">
                                                                    <Col>
                                                                        <Button
                                                                            color="danger"
                                                                            onClick={() => this.cancelSubscriptionPlan(data, data.subscription_status)}
                                                                        >
                                                                            Cancel Your Plan
                                                                </Button>
                                                                    </Col>
                                                                </Row>
                                                                <Row className="p-3">
                                                                    <Col className="p-3" md={12} ld={12} sm={12} xs={12} lg={12}>
                                                                        <CardTitle className="display-4"> Features </CardTitle>
                                                                        <CardText>
                                                                            {data.plan_id.content}
                                                                        </CardText>
                                                                    </Col>
                                                                </Row>

                                                            </CardBody>
                                                        </Card>
                                                    </Col>
                                                )
                                            }
                                            else if (data.subscription_status === "active") {
                                                return (
                                                    <Col className="p-3" md={12} ld={12} sm={12} xs={12} lg={12}>
                                                        <Card>
                                                            <CardBody style={{ pointerEvents: "auto", opacity: "1" }}>
                                                                <Row className="p-3">
                                                                    <Col md={12} ld={12} sm={12} xs={12} lg={12}>
                                                                        <h2 className="GreenFont"> Active Subscription Plan </h2>
                                                                    </Col>
                                                                </Row>
                                                                <Row className="p-3">
                                                                    <Col className="p-3" md={3} ld={3} sm={3} xs={12} lg={3}>
                                                                        <h3> Title: {data.plan_id.title} </h3>
                                                                    </Col>
                                                                    <Col className="p-3" md={3} ld={3} sm={3} xs={12} lg={3}>
                                                                        <h3>
                                                                            Amount/Period:<br />
                                                                            {userData.currencies.symbol} {" "}
                                                                            {data.plan_id.unit_amount} / {data.plan_id.stripe_price.recurring.interval}
                                                                        </h3>
                                                                    </Col>
                                                                    <Col className="p-3" md={3} ld={3} sm={3} xs={12} lg={3}>
                                                                        <h3>
                                                                            Subscription Start Date:<br />
                                                                            {
                                                                                moment.unix(data.stripe_subscription_cycle.current_period_start).format('Do MMM YYYY, hh:mm a')
                                                                            }
                                                                        </h3>
                                                                    </Col>
                                                                    <Col className="p-3" md={3} ld={3} sm={3} xs={12} lg={3}>
                                                                        <h3>
                                                                            Subscription End Date:<br />
                                                                            {
                                                                                moment.unix(data.stripe_subscription_cycle.current_period_end).format('Do MMM YYYY, hh:mm a')
                                                                            }
                                                                        </h3>
                                                                    </Col>
                                                                </Row>
                                                                <Row className="p-3">
                                                                    <Col md={12} ld={12} sm={12} xs={12} lg={12}>
                                                                        <CardTitle className="display-4"> Features </CardTitle>
                                                                        <CardText>
                                                                            {data.plan_id.content}
                                                                        </CardText>
                                                                    </Col>
                                                                </Row>
                                                                <Row >
                                                                    <Col>
                                                                        <Button
                                                                            className="mt-3"
                                                                            color="primary"
                                                                            onClick={this.redirectToExplore}
                                                                        >
                                                                            Explore Your Plan
                                                                </Button>
                                                                        <Button
                                                                            className="mt-3"
                                                                            color="danger"
                                                                            onClick={() => this.cancelSubscriptionPlan(data, data.subscription_status)}
                                                                        >
                                                                            Cancel Your Plan
                                                                </Button>
                                                                    </Col>

                                                                </Row>
                                                            </CardBody>
                                                        </Card>
                                                    </Col>
                                                )
                                            }
                                            else if (data.subscription_status === "trialing") {
                                                return (
                                                    <Col className=" p-3" md={12} ld={12} sm={12} xs={12} lg={12}>
                                                        <Card>
                                                            <CardBody style={{ pointerEvents: "auto", opacity: "1" }}>
                                                                <Row className="p-3">
                                                                    <h2 className="GreenFont"> Active Subscription Plan </h2>
                                                                </Row>

                                                                <Row className="p-3">
                                                                    <Col className="p-3" md={3} ld={3} sm={3} xs={12} lg={3}>
                                                                        <h3> Title: {data.plan_id.title} </h3>
                                                                    </Col>
                                                                    <Col className="p-3" md={3} ld={3} sm={3} xs={12} lg={3}>
                                                                        <h3>
                                                                            Amount/Period:<br />
                                                                            {userData.currencies.symbol} {" "}
                                                                            {data.plan_id.unit_amount} / {data.plan_id.stripe_price.recurring.interval}
                                                                        </h3>
                                                                    </Col>
                                                                    <Col className="p-3" md={3} ld={3} sm={3} xs={12} lg={3}>
                                                                        <h3>
                                                                            Subscription Start Date:<br />
                                                                            {
                                                                                moment.unix(data.stripe_subscription_cycle.current_period_start).format('Do MMM YYYY, hh:mm a')
                                                                            }
                                                                        </h3>
                                                                    </Col>
                                                                    <Col className="p-3" md={3} ld={3} sm={3} xs={12} lg={3}>
                                                                        <h3>
                                                                            Subscription End Date:<br />
                                                                            {
                                                                                moment.unix(data.stripe_subscription_cycle.current_period_end).format('Do MMM YYYY, hh:mm a')
                                                                            }
                                                                        </h3>
                                                                    </Col>
                                                                </Row>
                                                                <Row className="p-3">
                                                                    <Col md={12} ld={12} sm={12} xs={12} lg={12}>
                                                                        <CardTitle className="display-4"> Features </CardTitle>
                                                                        <CardText>
                                                                            {data.plan_id.content}
                                                                        </CardText>
                                                                    </Col>
                                                                </Row>
                                                                <Row >
                                                                    <Col>
                                                                        <Button
                                                                            className="mt-3"
                                                                            color="primary"
                                                                            onClick={this.redirectToExplore}
                                                                        >
                                                                            Explore Your Plan
                                                                </Button>
                                                                        <Button
                                                                            className="mt-3"
                                                                            color="danger"
                                                                            onClick={() => this.cancelSubscriptionPlan(data, data.subscription_status)}
                                                                        >
                                                                            Cancel Your Plan
                                                                </Button>
                                                                    </Col>
                                                                </Row>
                                                            </CardBody>
                                                        </Card>
                                                    </Col>
                                                )
                                            }
                                        })
                                    }
                                </Row>
                            </div>
                        </Row>

                }
                <CancelPlanModal
                    show={this.state.ShowCancellationModal}
                    onClose={() => this.onCloseCancelPlan()}
                    cancellationPlan={this.state.cancellationPlan}
                    is_subscription_schedule={this.state.is_subscription_schedule}
                />
            </div>
        );
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(StripeUser);