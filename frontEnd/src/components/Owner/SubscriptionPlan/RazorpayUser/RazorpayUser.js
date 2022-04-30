import React, { Component } from 'react';

import i18next from "i18next";
import {
    Card,
    CardHeader,
    CardBody,
    CardFooter,
    CardTitle,
    CardText,
    Container,
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

import { Link, Redirect } from "react-router-dom"
// Notification
import { errorToaster, successToaster } from "../../../common/common-validation/common";

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

class RazorpayUser extends Component {
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
            is_subscription_schedule: null,
            redirectToDashboard: false,
            razor_oto_id: null,

            redirectOnDashboard: false
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
            this.props.LOGIN_USER_DETAIL(response.data.data.user);
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

        let requestBody = {
            "plan_id": selectedPlan._id,
        };
        const response = await instance
            .post(requests.fetchRazorpayOnetimeSubscription, requestBody, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })
            .catch((error) => {
                let errorMessage = error.response.data.error.message;
                errorToaster(errorMessage);
            });
        if (response && response.data) {
            if (selectedPlan.hasOwnProperty("trial_days")) {
                successToaster("Subscription successfully done!");
                let Greetings = {
                    status: true,
                    completedStatus: "0%"
                }

                this.props.STORE_GREETINGS_INFORMATION(Greetings);

                const { history } = this.props;
                history.push("/dashboard");
            } else {
                successToaster("Subscription successfully done!");
                this.setState({
                    razor_oto_id: response.data.data.razor_oto_id
                })
                this.ShowRazorpay(response.data.data.razor_oto_id, this.props, this.callFunction);

            }
            // this.ShowRazorpay(selectedPlan, response.data.data.razor_subscription_id, this.props, userData, this.getUserInfo, this.getSubscriptionPlan, this.redirectOnDashboard );
        }
    }
    callLatestData = async () => {
        this.getUserInfo();
        this.getSubscriptionPlan();
    }

    cancelSubscriptionNew = async (data) => {
        let apiBody = {
            "subscription_id": `${data._id}`,
        };
        const response = await instance
            .post(requests.fetchRazorpayOnetimeUnsubscribe, apiBody, {
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
            this.getUserInfo();
            this.getPlan();
            const { history } = this.props;
            history.push("/dashboard");
        }
    }

    redirectOnDashboard = () => {
        this.setState({
            redirectToDashboard: true
        })
    }

    ShowRazorpay = (razor_oto_id, props, getSubscriptionPlan) => {
        console.log("Props ===== >", props);
        var options = {
            "order_id": razor_oto_id,
            "key": process.env.REACT_APP_RAZOR_PAY_KEY,
            //"subscription_id": response.data.data.razor_subscription_id,
            "currency": "INR",
            "name": "Ipangram",
            "description": "Test Transaction",
            "modal": {
                "ondismiss": async function () {
                    // const { history } = props;
                    // history.push("/subscription-plan");
                    getSubscriptionPlan();
                },
                escape: false,
                confirm_close: true,
                handleback: false,
            },

            "handler": function (response) {
                // alert(response.razorpay_payment_id),
                // alert(response.razorpay_subscription_id),
                // alert(response.razorpay_signature);
                if (response.razorpay_signature) {

                    //this.ClearCart();
                    // const { history } = this.props;
                    // if (history) history.push(`/orders`);
                    successToaster("Payment successfully done!");

                    let Greetings = {
                        status: true,
                        completedStatus: "0%"
                    }

                    props.STORE_GREETINGS_INFORMATION(Greetings);

                    const { history } = props;
                    history.push("/dashboard");
                }
                else {
                    console.log("Razor Pay Error : => ", response);
                }
            },
            "prefill": {
                "name": userData.name,
                "email": userData.email,
                "contact": userData.phone
            },
            "notes": {
                "note_key_1": "Tea. Earl Grey. Hot",
                "note_key_2": "Make it so."
            },
            "theme": { "color": "#F37254" },

        }
        var rzp1 = new window.Razorpay(options);
        rzp1.open();
    }


    // ShowRazorpay = (selectedPlan, razor_subscription_id, props, userData,getUserInfo,getSubscriptionPlan, redirectOnDashboard) => {
    //     let userDataValue = userData
    //     let name = selectedPlan.hasOwnProperty("plan_id") ? selectedPlan.plan_id.title : selectedPlan.title
    //     let description = selectedPlan.hasOwnProperty("plan_id") ? selectedPlan.plan_id.content : selectedPlan.content
    //     var options = {
    //         "key": process.env.REACT_APP_RAZOR_PAY_KEY,
    //         "subscription_id": razor_subscription_id,
    //         "name": name,
    //         "description": description,
    //         "modal": {
    //             // "ondismiss": async function () {
    //             //     let UserData = tempUserData;
    //             //     let token = tempToken;
    //             //     props.LOGIN_USER_DETAIL(UserData);
    //             //     props.TOKEN_KEY(token);
    //             //     props.TEMP_USER_DATA({});
    //             //     props.TEMP_TOKEN(null);
    //             //     let Greetings = {
    //             //         status: true,
    //             //         completedStatus: "0%"
    //             //     }
    //             //     props.STORE_GREETINGS_INFORMATION(Greetings);
    //             //     const { history } = props;
    //             //     history.push("/subscription-plan");
    //             // },
    //             escape: false,
    //             confirm_close: true,
    //             handleback: false,
    //         },
    //         handler: function (response) {
    //             // alert(response.razorpay_payment_id),
    //             // alert(response.razorpay_subscription_id),
    //             // alert(response.razorpay_signature);
    //             if (response.razorpay_signature) {

    //                 //this.ClearCart();
    //                 // const { history } = this.props;
    //                 // if (history) history.push(`/orders`);
    //                 successToaster("Subscription successfully done!");
    //                 getUserInfo();
    //                 getSubscriptionPlan();
    //                 redirectOnDashboard();

    //             }
    //             else {
    //                 console.log("Razor Pay Error : => ", response);
    //             }
    //         },
    //         "prefill": {
    //             "name": userDataValue.name,
    //             "email": userDataValue.email,
    //             "contact": userDataValue.phone
    //         },
    //         "notes": {
    //             "note_key_1": "Tea. Earl Grey. Hot",
    //             "note_key_2": "Make it so."
    //         },
    //         "theme": { "color": "#F37254" }
    //     }
    //     var rzp1 = new window.Razorpay(options);
    //     rzp1.open();
    // }

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

    // cancelSubscriptionPlan = (cancellationPlan, planType) => {
    //     this.setState({
    //         ShowCancellationModal: true,
    //         cancellationPlan: cancellationPlan,
    //         is_subscription_schedule: planType === "not_started" ? true : false
    //     })
    // }


    render() {
        const { Status, User, countries, plans, planDetails, callGetSubscriptionPlan } = this.state;
        if (this.state.Explore === true) {
            return (
                <Redirect to="/subscription-plan/explorePlan" />
            )
        }
        if (this.state.redirectToDashboard === true) {
            return (
                <Redirect to="/dashboard" />
            )
        }

        return (
            <div>
                {
                    Status === "no_plan_selected" || Status === "cancelled"
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
                                                                            <Card className="Plan mx-auto" style={{ height: "100%" }}
                                                                                style={{
                                                                                    pointerEvents: "auto",
                                                                                    opacity: "1",
                                                                                    cursor: "pointer"
                                                                                }}
                                                                                onClick={() => {
                                                                                    if (window.confirm('Are you sure you want to continue with selected plan?')) {
                                                                                        this.createNewSubscriptionPlan(plan)
                                                                                    }
                                                                                }}
                                                                            >
                                                                                <CardHeader>
                                                                                    <CardTitle className="display-4">
                                                                                        {plan.title}
                                                                                    </CardTitle>
                                                                                </CardHeader>
                                                                                <CardBody>
                                                                                    <CardTitle className="display-4">
                                                                                        {userData.currencies.symbol} {" "}
                                                                                        {plan.unit_amount} / {plan.recurring.interval}
                                                                                    </CardTitle>
                                                                                </CardBody>
                                                                                <CardFooter>
                                                                                    <CardTitle className="display-4">
                                                                                        Features
                                                                                    </CardTitle>
                                                                                    <CardText>
                                                                                        {plan.content}
                                                                                    </CardText>
                                                                                </CardFooter>
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
                                {/* <Row >
                                    <Col className="ml-4 mt-5">
                                        <h3>
                                            Your All Plan Detail
                                        </h3>
                                    </Col>
                                </Row> */}
                                <Row>
                                    {
                                        planDetails.map((data, i) => {
                                            if (data.subscription_status === "cancelled" || data.subscription_status === "canceled") {
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
                                                                            {data.plan_id.unit_amount} / {data.plan_id.hasOwnProperty("recurring") ? data.plan_id.recurring.interval : ""}
                                                                        </h3>
                                                                    </Col>
                                                                </Row>
                                                                <Row className="p-3">
                                                                    <Col md={12} ld={12} sm={12} xs={12} lg={12}>
                                                                        <CardTitle className="display-4">
                                                                            Features
                                                                        </CardTitle>
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
                                            if (data.subscription_status === "not_started") {
                                                return (
                                                    <Col className="p-3" md={12} ld={12} sm={12} xs={12} lg={12}>
                                                        <Card>
                                                            <CardBody style={{ pointerEvents: "auto", opacity: "1" }}>
                                                                <Row className="p-3">
                                                                    <Col>
                                                                        <h2> Schedular Plan </h2>
                                                                        <h2 className="GrayFont"> This Plan Starting After Current Subscription Plan End...  </h2>
                                                                    </Col>
                                                                </Row>
                                                                <Row className="p-3">
                                                                    <Col className="p-3" md={3} ld={3} sm={3} xs={12} lg={3}>
                                                                        <h3> Title: {data.plan_id.title} </h3>
                                                                    </Col>
                                                                    <Col className="p-3" md={3} ld={3} sm={3} xs={12} lg={3}>
                                                                        <h3>
                                                                            Amount/Period:<br />
                                                                            {/* {userData.currencies.symbol} {" "}
                                                                            {data.plan_id.unit_amount} / {data.plan_id.hasOwnProperty("recurring") ? data.plan_id.recurring.interval : ""} */}
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
                                                                            {data.plan_id.unit_amount} / {data.plan_id.hasOwnProperty("recurring") ? data.plan_id.recurring.interval : ""}
                                                                        </h3>
                                                                    </Col>
                                                                    <Col className="p-3" md={3} ld={3} sm={3} xs={12} lg={3}>
                                                                        <h3>
                                                                            Subscription Start Date:<br />
                                                                            {
                                                                                moment.unix(data.razor_subscription_cycle.payment.entity.created_at).format('Do MMM YYYY, hh:mm a')
                                                                            }
                                                                        </h3>
                                                                    </Col>
                                                                    <Col className="p-3" md={3} ld={3} sm={3} xs={12} lg={3}>
                                                                        <h3>
                                                                            Subscription End Date:<br />
                                                                            {
                                                                                moment.unix(userData.subscription_status.current_period_end).format('Do MMM YYYY, hh:mm a')
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
                                                                {/* <Row >
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

                                                                </Row> */}
                                                            </CardBody>
                                                        </Card>
                                                    </Col>
                                                )
                                            }
                                            else if (data.subscription_status === "authenticated" && data.is_subscription_canceled !== true) {
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
                                                                            {data.plan_id.unit_amount} / {data.plan_id.hasOwnProperty("recurring") ? data.plan_id.recurring.interval : ""}
                                                                        </h3>
                                                                    </Col>
                                                                    <Col className="p-3" md={3} ld={3} sm={3} xs={12} lg={3}>
                                                                        <h3 className="RedFont">
                                                                            Trial Ends:<br />
                                                                            {
                                                                                moment.unix(userData.subscription_status.current_period_end ).format('Do MMM YYYY, hh:mm a')
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
                                                                {/* <Row >
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
                                                                </Row> */}
                                                            </CardBody>
                                                        </Card>
                                                    </Col>
                                                )
                                            }
                                            else if (data.subscription_status === "created") {
                                                return (
                                                    <Col className=" p-3" md={12} ld={12} sm={12} xs={12} lg={12}>
                                                        <Card>
                                                            <CardBody style={{ pointerEvents: "auto", opacity: "1" }}>
                                                                <Row >
                                                                    <Col className="text-center">
                                                                        <div className="warningFont display-3">
                                                                            Your subscription is already created but your payment is not done!
                                                                        </div>

                                                                        <Button
                                                                            className="mt-3"
                                                                            color="danger"
                                                                            // onClick={() => this.cancelSubscriptionPlan(data, data.subscription_status)}
                                                                            onClick={() => {
                                                                                if (window.confirm('Are you sure you want to continue unsubscribe your plan?')) {
                                                                                    this.cancelSubscriptionNew(data)
                                                                                }
                                                                            }}
                                                                        >
                                                                            Cancel Your Plan
                                                                        </Button>
                                                                        <Button
                                                                            className="mt-3 "
                                                                            color="success"
                                                                            // onClick={() =>
                                                                            //     this.ShowRazorpay(data, userData.subscription_status.razor_subscription_id, this.props, userData,this.getUserInfo, this.getSubscriptionPlan,this.redirectOnDashboard)
                                                                            // }
                                                                            onClick={() => {
                                                                                this.ShowRazorpay(data.razor_subscription_cycle.id, this.props, this.getSubscriptionPlan);
                                                                            }}
                                                                        >
                                                                            Pay Now
                                                                        </Button>
                                                                    </Col>
                                                                </Row>
                                                                <Row className="p-3">
                                                                    <h2 className="GreenFont">Subscription Plan </h2>
                                                                </Row>

                                                                <Row className="p-3">
                                                                    <Col className="p-3" md={3} ld={3} sm={3} xs={12} lg={3}>
                                                                        <h3> Title: {data.plan_id.title} </h3>
                                                                    </Col>
                                                                    <Col className="p-3" md={3} ld={3} sm={3} xs={12} lg={3}>
                                                                        <h3>
                                                                            Amount/Period:<br />
                                                                            {userData.currencies.symbol} {" "}
                                                                            {data.plan_id.unit_amount} / {data.plan_id.hasOwnProperty("recurring") ? data.plan_id.recurring.interval : ""}
                                                                        </h3>
                                                                    </Col>
                                                                    <Col className="p-3" md={3} ld={3} sm={3} xs={12} lg={3}>
                                                                        <h3>
                                                                            Subscription Start Date:<br />
                                                                            {
                                                                                moment.unix(data.razor_subscription_cycle.current_start).format('Do MMM YYYY, hh:mm a')
                                                                            }
                                                                        </h3>
                                                                    </Col>
                                                                    <Col className="p-3" md={3} ld={3} sm={3} xs={12} lg={3}>
                                                                        <h3>
                                                                            Subscription End Date:<br />
                                                                            {
                                                                                moment.unix(data.razor_subscription_cycle.current_end).format('Do MMM YYYY, hh:mm a')
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

                                                            </CardBody>
                                                        </Card>
                                                    </Col>
                                                )
                                            }

                                            else if (data.subscription_status === "pending" || data.subscription_status === "halted") {
                                                return (
                                                    <Col className=" p-3" md={12} ld={12} sm={12} xs={12} lg={12}>
                                                        <Card>
                                                            <CardBody style={{ pointerEvents: "auto", opacity: "1" }}>
                                                                <Row >
                                                                    <Col className="text-center">
                                                                        <div className="warningFont display-4">
                                                                            Your subscription renew cycle was unsuccessful , please add sufficient balance in you current account or consider changing payment resource. Thank you.
                                                                        </div>
                                                                        <a
                                                                            target="_blanck"
                                                                            href={data.razor_subscription.short_url}
                                                                        >
                                                                            <div className="display-4"> Pay Now </div>
                                                                        </a>

                                                                    </Col>
                                                                </Row>
                                                                <Row className="p-3">
                                                                    <h2 className="GreenFont">Subscription Plan </h2>
                                                                </Row>

                                                                <Row className="p-3">
                                                                    <Col className="p-3" md={3} ld={3} sm={3} xs={12} lg={3}>
                                                                        <h3> Title: {data.plan_id.title} </h3>
                                                                    </Col>
                                                                    <Col className="p-3" md={3} ld={3} sm={3} xs={12} lg={3}>
                                                                        <h3>
                                                                            Amount/Period:<br />
                                                                            {userData.currencies.symbol} {" "}
                                                                            {data.plan_id.unit_amount} / {data.plan_id.hasOwnProperty("recurring") ? data.plan_id.recurring.interval : ""}
                                                                        </h3>
                                                                    </Col>
                                                                    <Col className="p-3" md={3} ld={3} sm={3} xs={12} lg={3}>
                                                                        <h3>
                                                                            Subscription Start Date:<br />
                                                                            {
                                                                                moment.unix(data.razor_subscription_cycle.current_start).format('Do MMM YYYY, hh:mm a')
                                                                            }
                                                                        </h3>
                                                                    </Col>
                                                                    <Col className="p-3" md={3} ld={3} sm={3} xs={12} lg={3}>
                                                                        <h3>
                                                                            Subscription End Date:<br />
                                                                            {
                                                                                moment.unix(data.razor_subscription_cycle.current_end).format('Do MMM YYYY, hh:mm a')
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

export default connect(mapStateToProps, mapDispatchToProps)(RazorpayUser);