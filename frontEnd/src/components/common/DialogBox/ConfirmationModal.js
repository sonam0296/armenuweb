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


export class ConfirmationModal extends Component {
    constructor(props) {
        super(props);
        this.state = {

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

    componentDidMount() {
    }

    render() {
        return (
            <>
                <Modal className="modal-dialog-centered modal-sm " isOpen={this.props.show}>
                    <Row className="p-5">
                        <Col className="modal-body">
                            <h3 className="modal-title " id="exampleModalLabel">
                                {i18next.t(this.props.msg)}
                            </h3>
                            {/* <button
                                aria-label="Close"
                                className="close"
                                data-dismiss="modal"
                                type="button"
                                onClick={this.onCloseCall}
                            >
                                <span aria-hidden={true}>×</span>
                            </button> */}
                        </Col>
                        <Col style={{ textAlign: "right"}}>
                        {
                            this.props.type === "ok" &&
                            <Button
                                color="primary"
                                type="button"
                                onClick={this.onCloseCall}
                            >
                                Ok
                            </Button>
                        }

                        </Col>
                    </Row>
                    
                </Modal>
            </>
        )
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(ConfirmationModal)

