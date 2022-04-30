import React, { Component } from "react";
import { errorToaster, successToaster } from "../../../common/common-validation/common"
import i18next from "i18next"
import {
    Card,
    CardBody,
    CardTitle,
    CardText,
    Row,
    Col,
    Button,
    FormGroup,
    Input,
    Modal,
} from "reactstrap";

import { bindActionCreators } from "redux";
import { ActCreators } from "../../../../redux/bindActionCreator";
import { connect } from "react-redux";

import instance from "../../../../axios";
import requests from "../../../../requests";

let token = null;
let userData = {};

const mapStateToProps = (state) => {
    token = state.token;
    userData = state.userData;
};
const mapDispatchToProps = (dispatch) => {
    return bindActionCreators(ActCreators, dispatch);
};


export class RazorpayUpdatePlan extends Component {
    constructor(props) {
        super(props);
        this.state = {
            msg: "",
            update_now: "true"
        };
    }


    handleChange = (e) => {
        this.setState({
            [e.target.name]: e.target.value,
        });
    };

    onCloseCall = () => {
        this.props.onClose()
    }

    OnCallUpdate = () => {
        let schedule_change_at = this.state.update_now === "true" ? "now" : "cycle_end"
        this.props.UpdateRazorpayUserPlan(schedule_change_at)
    }

    componentDidMount() {
    }

    render() {
        const { msg, update_now } = this.state
        const plan = this.props.selectedPlan
        return (
            <>
                <Modal className="modal-dialog-centered modal-lg" isOpen={this.props.show}>
                    <div className="modal-header">
                        <h3 className="modal-title " id="exampleModalLabel">
                            {i18next.t("Update your plan")}
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
                                            <div>
                                                Selected Plan:
                                            </div>
                                            <Card className="p-3 mt-3 ml-3 mr-3 mb-3" >
                                                <div className="display-4">
                                                    Title: {plan.title}
                                                </div>
                                                <div className="display-4">
                                                    Amount:
                                                    {plan.currency_symbol} {" "}
                                                    {plan.unit_amount} / {
                                                        plan.hasOwnProperty("stripe_price") ? plan.stripe_price.recurring.interval : plan.hasOwnProperty("recurring") ? plan.recurring.interval : ""
                                                    }
                                                </div>
                                                <div className="display-4"> Features </div>
                                                <div>
                                                    {plan.content}
                                                </div>
                                            </Card >

                                            <div className="card-content mt-2">
                                                <div onChange={this.handleChange}>
                                                    <div className="custom-control custom-radio mb-3">
                                                        <input
                                                            type="radio"
                                                            value="false"
                                                            name="update_now"
                                                        />
                                                        <label className="ml-3">
                                                            Update at end of current billing cycle  <br />
                                                        </label>
                                                    </div>
                                                    <div className="custom-control custom-radio mb-3">
                                                        <input
                                                            defaultChecked
                                                            type="radio"
                                                            value="true"
                                                            name="update_now"
                                                        />
                                                        <label
                                                            className="ml-3"
                                                        >
                                                            Update Immediately
                                                        </label>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* <div className="custom-control custom-radio mb-3">
                                                <input

                                                    className="custom-control-input"
                                                    id="update_now_true"
                                                    name="update_now"
                                                    type="radio"
                                                    value={update_now}
                                                    onClick={(e) => this.handleChange(e)}
                                                />
                                                <label className="custom-control-label" htmlFor="update_now_true">
                                                    Update at end of current billing cycle  <br />
                                                </label>
                                            </div>
                                            <div className="custom-control custom-radio mb-3">
                                                <input
                                                    className="custom-control-input"
                                                    onClick={(e) => this.handleChange(e)}
                                                    id="update_now_true"
                                                    name="update_now"
                                                    value={update_now}
                                                    type="radio"
                                                />
                                                <label
                                                    className="custom-control-label"
                                                    htmlFor="input-update Immediately"
                                                >
                                                    Update Immediately
                                                </label>
                                            </div> */}

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
                                                onClick={
                                                    () => this.OnCallUpdate()
                                                }>
                                                {i18next.t("Update your plan")}
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

export default connect(mapStateToProps, mapDispatchToProps)(RazorpayUpdatePlan)

