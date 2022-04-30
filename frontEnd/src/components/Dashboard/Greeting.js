import React, { Component } from "react";

// reactstrap for styling
import {
    Button,
    Modal,
   
} from "reactstrap";


// for Redux
import { bindActionCreators } from "redux";
import { ActCreators } from "../../redux/bindActionCreator";
import { connect } from "react-redux";

// for notification
import { errorToaster, successToaster } from "../common/common-validation/common";


import i18next from "i18next";

import Hint from "components/Hint/Hint";

let token = null;
let userData = {};
let StoreRestaurantId = {};


const mapStateToProps = (state) => {
    token = state.token;
    userData = state.userData;
    StoreRestaurantId = state.StoreRestaurantId
};

const mapDispatchToProps = (dispatch) => {
    return bindActionCreators(ActCreators, dispatch);
};

export class Greeting extends Component {
    constructor(props) {
        super(props);
        this.state = {
            showHintModal: false
        };
    }
    handlechangeall = (e) => {
        this.setState({
            [e.target.name]: e.target.value,
        });
    };

    handleCloseModal = () => {
        this.props.onClose();
    };

    componentDidMount = () => {
        if (this.props.ShowContent==="onlyHint") {
            this.setState({
                showHintModal: true
            })
        }
    }
   
    showHint = () => {
        this.setState({
            showHintModal: true
        })
        //this.props.onClose();

    }
    onClose = () => {
        this.setState({
            showHintModal: false
        })
    }
    render() {
        return (
            <div>
                <Modal className="modal-dialog modal-dialog-centered modal-lg"
                    isOpen={this.props.show}
                >
                    {
                        this.state.showHintModal !== true &&
                        <div className="bg-transparent"
                            style={{
                                background: "linear-gradient(45deg, rgb(106, 120, 209), rgb(0, 164, 189))"
                            }}
                        >
                            <div className="modal-header">
                                <button
                                    aria-label="Close"
                                    className="close"
                                    data-dismiss="modal"
                                    type="button"
                                    onClick={this.handleCloseModal}
                                >
                                    {/* <span className="text-white" aria-hidden={true}>×</span> */}
                                    <i class="fas fa-times text-white"></i>
                                </button>
                            </div>
                            <div className="text-center text-white">
                                <span style={{ fontSize: "50px", color: "white" }}>
                                    <i className="fas fa-check-circle"></i>
                                </span><br />
                                <span>
                                    <h3 className="text-center text-white mt-2" >Your Subscription Is Successfully Done! </h3>
                                </span>
                            </div>
                            <div className="text-white text-center display-3 p-3">
                                {i18next.t("Welcome to Appetizar")} {userData.name + "!"}
                            </div>
                            
                            <div className="text-white text-center display-4 mb-5 mt-3">

                                <Button
                                    onClick={this.handleCloseModal}
                                >
                                    Skip
                                </Button>
                                <Button onClick={this.showHint}>
                                    Take Tour
                                </Button>
                            </div>
                        </div>

                    }

                    {
                        this.state.showHintModal &&
                        <div className="bg-transparent"
                            style={{
                                background: "linear-gradient(45deg, rgb(106, 120, 209), rgb(0, 164, 189))"
                            }}
                        >
                            <div className="modal-header">
                                <button
                                    aria-label="Close"
                                    className="close"
                                    data-dismiss="modal"
                                    type="button"
                                    onClick={this.handleCloseModal}
                                >
                                    {/* <span className="text-white" aria-hidden={true}>×</span> */}
                                    <i class="fas fa-times text-white"></i>
                                </button>
                            </div>
                            <Hint />
                        </div>
                    }
                    {/* {
                        this.state.showHintModal &&
                        <Hint
                            show={this.showHint}
                            onClose={this.onClose()}
                        />
                    } */}

                </Modal>
            </div>
        );
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(Greeting);
