import React, { Component } from "react";
import { errorToaster, successToaster } from "../../../common/common-validation/common"
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


export class LoginContent extends Component {
    constructor(props) {
        super(props);
        this.state = {
            msg: "",
            site_content: [],
            editIndex: "",
            editData: "",
            status: ""
        };
    }


    handleChange = (e) => {
        this.setState({
            [e.target.name]: e.target.value,
        });
    };

    onCloseCall = () => {
        this.setState({
            msg: "",
            site_content: [],
            editIndex: "",
            editData: "",
            status: ""
        })
        this.props.onClose()
    }

    componentDidMount() {
        this.setState({
            status: this.props.status,
            editIndex: this.props.editIndex,
            editData: this.props.editData,
            msg: this.props.editData,
            site_content: this.props.site_content
        })
    }

    onCallAPI = async () => {
        let APIBody = {
            "site_id": "5f896cf681eb0371e0dfba39",
            "site_content": this.state.site_content
        };
        const response = await instance
            .post(requests.fetchAddLoginPageInfo, APIBody, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })
            .catch((error) => {
                let errorMessage = error.response.data.error.message;
                errorToaster(errorMessage);
            });
        if (response && response.data) {
            this.props.getSiteSettingData();
        }
    }

    addNewContent = () => {
        let { site_content, msg } = this.state;
        site_content.push(msg);
        this.setState({
            site_content: site_content
        }, async () => {
            this.onCallAPI();
            this.onCloseCall();

        })
    }

    UpdateContent = () => {
        let { site_content, msg, editIndex } = this.state;
        site_content[editIndex] = msg;
        this.setState({
            site_content:site_content
        })
        this.onCallAPI(); 
        this.onCloseCall();
    }

    deleteContent = () => {
        let { site_content, msg, editIndex } = this.state;
        site_content.splice(editIndex,1);
        this.setState({
            site_content:site_content
        })
        this.onCallAPI(); 
        this.onCloseCall();
    }

    render() {
        const { msg } = this.state
        return (
            <>
                <Modal className="modal-dialog-centered modal-lg" isOpen={this.props.show}>
                    <div className="modal-header">
                        <h3 className="modal-title " id="exampleModalLabel">
                            {this.state.status === "add" ?
                                i18next.t("Add New Content")
                                :
                                i18next.t("Update Content")
                            }
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
                                            <FormGroup>
                                                <label
                                                    className="form-control-label"
                                                    htmlFor="input-Cancellation Message"
                                                >
                                                    {i18next.t("Content")}
                                                </label>
                                                <div>
                                                    <Input
                                                        className="form-control-alternative"
                                                        placeholder={i18next.t("Content")}
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
                                            {   
                                               this.state.status === "add"
                                                    ? <Button
                                                        className="my-4"
                                                        color="primary"
                                                        type="button"
                                                        onClick={this.addNewContent}
                                                    >
                                                        {i18next.t("Add")}
                                                    </Button>
                                                    :
                                                    <Button
                                                        className="my-4"
                                                        color="primary"
                                                        type="button"
                                                        onClick={this.UpdateContent}
                                                    >
                                                        {i18next.t("Update")}
                                                    </Button>
                                            }

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

export default connect(mapStateToProps, mapDispatchToProps)(LoginContent)

