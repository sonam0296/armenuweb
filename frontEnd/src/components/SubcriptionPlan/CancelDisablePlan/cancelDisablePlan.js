import React, { Component } from "react";
import { errorToaster, successToaster } from "../../common/common-validation/common"
import i18next from "i18next"
import {
    Card,
    CardBody,
    Row,
    Col,
    Button,
    FormGroup,
    Input,
    Modal,
} from "reactstrap";

import { bindActionCreators } from "redux";
import { ActCreators } from "../../../redux/bindActionCreator";
import { connect } from "react-redux";

import instance from "../../../axios";
import requests from "../../../requests";

let token = null;
let userData = {};

const mapStateToProps = (state) => {
    token = state.token;
    userData = state.userData;
};
const mapDispatchToProps = (dispatch) => {
    return bindActionCreators(ActCreators, dispatch);
};


export class CancelPlanModal extends Component {
    constructor(props) {
        super(props);
        this.state = {
            msg: "",
            cancel_now: true
        };
    }


    handleChange = (e) => {
        this.setState({
            [e.target.name]: e.target.value,
        });
    };

    handleCheckboxChange = event => {
        this.setState({ cancel_now: event.target.checked })
    }

    onCloseCall = () => {
        this.props.onClose()
    }

    disablePlan = async () => {
        let apiBody = {}
        let API = null
        if (this.props.disablePlan.country === "India") {
            apiBody = {
                "plan_id": this.props.disablePlan._id,
                "is_active": false,
                "message": this.state.msg,
            }
            API = requests.fetchRazorpayDisablePlan
        } else {
            apiBody = {
                "plan_id": this.props.disablePlan._id,
                "is_active": false,
                "message": this.state.msg,
                "stripe_product": {
                    "id": this.props.disablePlan.stripe_product.id
                }
            }
            API = requests.fetchDisablePlan
        }
        const response = await instance
            .patch(API, apiBody, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })
            .catch((error) => {
                let errorMessage = error.response.data.error.message;
                errorToaster(errorMessage);

            });
        if (response && response.data) {
            successToaster("Successfully archive your plan");
            this.onCloseCall();
        }
    }

    UnsubscribeStripeUser = async () => {
        let apiBody = {}

        if (this.props.is_subscription_schedule === true) {
            apiBody = {
                "is_subscription_schedule": this.props.is_subscription_schedule,
                "cancel_now": true,
                "cancellation_reason": this.state.msg
            };
        } else {
            apiBody = {
                "is_subscription_schedule": this.props.is_subscription_schedule,
                "cancel_now": this.state.cancel_now,
                "cancellation_reason": this.state.msg
            };
        }


        const response = await instance
            .patch(requests.fetchUnsubscribePlan, apiBody, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })
            .catch((error) => {
                console.log("Response => ", error)
                let errorMessage = error.response.data.error.message;
                errorToaster(errorMessage);

            });
        if (response && response.data) {
            successToaster("Successfully Unsubscribe your plan");
            this.onCloseCall();
        }
    }

    UnsubscribeRazorpayUser = async () => {
        let cancel_plan_detail = this.props.cancellationPlan;
        let apiBody = {
            "subscription_id": cancel_plan_detail._id,
            "cancellation_reason": this.state.msg,
            "cancel_at_cycle_end": !this.state.cancel_now
        }

        const response = await instance
            .patch(requests.fetchUnsubscribeRazorpayPlan, apiBody, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })
            .catch((error) => {
                console.log("Response => ", error)
                let errorMessage = error.response.data.error.message;
                errorToaster(errorMessage);

            });
        if (response && response.data) {
            successToaster("Successfully Unsubscribe your plan");
            this.onCloseCall();
        }
    }

    OnCallAPI = async () => {
        if (userData.userType === "admin") {
            this.disablePlan()
        } else {
            if (userData.country_name !== "India") {
                this.UnsubscribeStripeUser();
            } else {
                this.UnsubscribeRazorpayUser();
            }
        }
    }

    componentDidMount() {
    }

    render() {
        const { msg, cancel_now } = this.state
        return (
            <>
                <Modal className="modal-dialog-centered modal-lg" isOpen={this.props.show}>
                    <div className="modal-header">
                        <h3 className="modal-title " id="exampleModalLabel">
                            {i18next.t("Disable Your Plan...!")}
                        </h3>
                        <button
                            aria-label="Close"
                            className="close"
                            data-dismiss="modal"
                            type="button"
                            onClick={this.onCloseCall}
                        >
                            <span aria-hidden={true}>×</span>
                        </button>
                    </div>
                    <div className="modal-body p-0">
                        <Card className="bg-secondary shadow border-0">
                            <CardBody className="p-lg-5">
                                <Row>
                                    <div className="col">
                                        <Col md="12">
                                            {
                                                (userData.userType !== "admin" && this.props.is_subscription_schedule === false) &&
                                                <>
                                                    <b> Important: This action can not be undone. The subscription will move to cancelled state.
                                                    </b><br /><br />
                                                    <b> Note: if Cancel Now is unchecked then this plan is cancel at end of the current shedule
                                                    </b>
                                                    <br /><br />

                                                    <div className="card-content mt-2">
                                                        <div onChange={this.handleChange}>
                                                            <div className="custom-control custom-radio mb-3">
                                                                <input
                                                                    disabled={userData.subscription_status.status === "authenticated" || userData.subscription_status.status === "created"}
                                                                    
                                                                    id="cancel_now_true"
                                                                    name="cancel_now"
                                                                    type="radio"
                                                                    value={false}
                                                                />
                                                                <label className="ml-3">
                                                                    Cancel at end of current billing cycle   <br />
                                                                </label>
                                                            </div>
                                                            <div className="custom-control custom-radio mb-3">
                                                                <input
                                                                    defaultChecked
                                                                    disabled={userData.subscription_status.status === "authenticated" || userData.subscription_status.status === "created"}
                                                                    id="cancel_now_true"
                                                                    name="cancel_now"
                                                                    type="radio"
                                                                    value={true}
                                                                />
                                                                <label
                                                                    className="ml-3"
                                                                >
                                                                   Cancel Immediately
                                                        </label>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {/* <div className="card-content mt-2">
                                                        <div onChange={this.handleChange}>
                                                            <div className="custom-control custom-radio mb-3">
                                                                <input
                                                                    disabled={userData.subscription_status.status === "authenticated" || userData.subscription_status.status === "created"}
                                                                    className="custom-control-input"
                                                                    id="cancel_now_true"
                                                                    name="cancel_now"
                                                                    type="radio"
                                                                    value={false}
                                                                    onClick={(e) => this.handleChange(e)}
                                                                />
                                                                <label className="custom-control-label" htmlFor="cancel_now_true">
                                                                    <b> Cancel at end of current billing cycle </b> <br />
                                                                Next payment will not be charged
                                                            </label>
                                                            </div>
                                                            <div className="custom-control custom-radio mb-3">
                                                                <input
                                                                    disabled={userData.subscription_status.status === "authenticated" || userData.subscription_status.status === "created"}
                                                                    defaultChecked
                                                                    className="custom-control-input"
                                                                    onClick={(e) => this.handleChange(e)}
                                                                    id="cancel_now_false"
                                                                    name="cancel_now"
                                                                    value={true}
                                                                    type="radio"
                                                                />
                                                                <label
                                                                    className="custom-control-label"
                                                                    htmlFor="input-Cancel Immediately"
                                                                >
                                                                    Cancel Immediately
                                                            </label>
                                                            </div>
                                                        </div>
                                                    </div> */}
                                                </>
                                                // <FormGroup>
                                                //     <div style={{ fontFamily: 'system-ui' }}>
                                                //         <label>
                                                //             <Checkbox
                                                //                 checked={cancel_now}
                                                //                 onChange={this.handleCheckboxChange}
                                                //             />
                                                //             <label
                                                //                 className="ml-2 form-control-label"
                                                //                 htmlFor="input- Cancel Now"
                                                //             >
                                                //                 {i18next.t(" Cancel Now")}
                                                //             </label>
                                                //             {/* <span style={{ marginLeft: 8 }}> Cancel Now </span> */}
                                                //             <br />
                                                //             <b> ( Note: if Cancel Now is unchecked then this plan is cancel at end of the current shedule )
                                                //             </b>

                                                //         </label>
                                                //     </div>
                                                // </FormGroup>

                                            }

                                            <FormGroup>
                                                <label
                                                    className="form-control-label"
                                                    htmlFor="input-Cancellation Message"
                                                >
                                                    {i18next.t("Cancellation Message")}
                                                </label>
                                                <div>
                                                    <Input
                                                        className="form-control-alternative"
                                                        placeholder={i18next.t("Cancellation Message")}
                                                        type="text"
                                                        name="msg"
                                                        value={msg}
                                                        onChange={(e) => this.handleChange(e)}
                                                    />
                                                </div>
                                            </FormGroup>
                                        </Col>

                                    </div>
                                </Row>
                                <center>
                                    <Row>
                                        <Col>
                                            <Button
                                                className="my-4"
                                                color="danger"
                                                type="button"
                                                onClick={() => {
                                                    if (userData.userType === "owner") {
                                                        if (window.confirm('Are you sure you want to un-subscribe your plan?')) {
                                                            this.OnCallAPI()
                                                        }
                                                    } else {
                                                        if (window.confirm('Are you sure you want to disable plan?')) {
                                                            this.OnCallAPI()
                                                        }
                                                    }

                                                }}
                                            >
                                                {
                                                    userData.userType === "admin" ?
                                                        i18next.t("Disable plan")
                                                        :
                                                        i18next.t("Unsubscribe your plan")

                                                }
                                            </Button>
                                        </Col>
                                    </Row>
                                </center>
                            </CardBody>
                        </Card>
                    </div>
                </Modal>
            </>
        )
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(CancelPlanModal)

