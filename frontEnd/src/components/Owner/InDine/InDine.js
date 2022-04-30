import React, { Component } from "react";

import i18next from "i18next";
// reactstrap components
import {
    Container,
    Row,
    Col,
    Card,
    CardHeader,
    FormGroup,
    Input,
    Label,
    Button,
    CardBody,
} from "reactstrap";

import { bindActionCreators } from "redux";
import { ActCreators } from "../../../redux/bindActionCreator";
import { connect } from "react-redux";
import instance from "../../../axios";
import requests from "../../../requests";
// For Notification
import { errorToaster, successToaster } from "../../common/common-validation/common";
import TablesNotification from "./TablesNotification";
import { messaging } from "../../../firebase";

// import BoopButton from "../../../assets/sounds/BoopButton"
// import ding from "./../../../assets/sounds/ding.mp3"
import ding from "../../../../src/assets/sounds/ding.mp3"

//frontEnd\src\assets\sounds
//frontEnd\src\assets\sounds\ding.mp3
//frontEnd\src\components\Owner\InDine\InDine.js



let token = null;
let userData = {};
let get_fcm_registration_token = null;


const mapStateToProps = (state) => {
    token = state.token;
    userData = state.userData;
    get_fcm_registration_token = state.get_fcm_registration_token;
};
const mapDispatchToProps = (dispatch) => {
    return bindActionCreators(ActCreators, dispatch);
};

export class InDine extends Component {
    constructor(props) {
        super(props);
        this.state = {
            capacity: null,
            stateCard: null,
            arrangement: null,
            flag: false
        };
    }

    handleChange = (e) => {
        this.setState({
            [e.target.name]: e.target.value,
        });
    };

    componentDidMount = async () => {
        this.GetTableCapacity();
        if (get_fcm_registration_token === null) {
            return null;
        } else {
            messaging.onMessage(async (payload) => {
                let payloadData = payload;
                this.GetTableCapacity();
                const PlayDing = document.getElementsByClassName("audio-element")[0]
                PlayDing.play();
            });
        }
    };

    GetTableCapacity = async () => {
        const APIBody = {
            "owner_id": userData._id
        };
        const response = await instance
            .post(requests.fetchGetTableCapacity, APIBody, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })
            .catch((error) => {
                let errorMessage = error.response;
                errorMessage(errorMessage)
                console.log(errorMessage);
            });

        if (response && response.data) {
            response.data.data != null &&
                this.setState({
                    capacity: response.data.data.capacity,
                    arrangement: response.data.data.arrangement
                }, () => {
                    let TableData = [];
                    this.state.arrangement.map((table, i) => {
                        let data = {
                            cardTitle: `${i + 1}`,
                            state_value: table.messages.length,
                            messages: table.messages,
                            id: table._id,
                            client_id: table.client_id,
                            order_id:table.order_id
                        }
                        TableData.push(data);
                    })
                    this.setState({
                        stateCard: TableData,
                        flag: true
                    })
                })
        }
    }

    onUpdateTableCapacity = async () => {
        const APIBody = {
            "capacity": this.state.capacity,
            "owner_id": userData._id
        };

        const response = await instance
            .post(requests.fetchUpdateTableCapacity, APIBody, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })
            .catch((error) => {
                let errorMessage = error.response;
                errorMessage(errorMessage)
                console.log(errorMessage);
            });

        if (response && response.data) {
            successToaster("Record Successfully Updated!");
        }
    }

    PopMessage = async (tableData, msgIndex) => {
        let selectedTable = tableData;
        let selectedMSGIndex = msgIndex;

        let clearStatus = "";
        if (msgIndex === 0) {
            selectedTable.messages = [];
            clearStatus="unreserved";
            this.CallUpdateMessages(selectedTable,clearStatus);
            this.handleActionMethod(selectedTable.order_id,"Served")
        } else {
            clearStatus="reserved";
            selectedTable.messages.splice(selectedMSGIndex, 1);
            this.CallUpdateMessages(selectedTable,clearStatus);
        }
    }

    handleActionMethod = async (order_id, Amethod) => {
        const data = {
          order_id: order_id,
          last_status: Amethod,
        };
        const response = await instance
          .post(requests.fetchUpdateOrdersForOwner, data, {
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
          //this.applyFilter();
        }
      };

    CallUpdateMessages = async (selectedTable, clearStatus) => {
        let tableData = selectedTable;
        const APIBody = {
            "arrangement_id": tableData.id,
            "owner_id": userData._id,
            "message": tableData.messages,
            "table": tableData.cardTitle,
            "client_id":tableData.client_id,
            "order_id":tableData.order_id,
            "userType": "owner"
        };
        const response = await instance
            .post(requests.fetchUpdateTableMessage, APIBody, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })
            .catch((error) => {
                let errorMessage = error.response;
                errorMessage(errorMessage)
                console.log(errorMessage);
            });

        if (response && response.data) {
            successToaster("Service Successfully Updated!");
            this.GetTableCapacity();
        }
    }

    render() {
        let { capacity } = this.state

        return (
            <>
                <Container className="pt-7" fluid>
                    <Row>
                        <Col md={12} lg={12} xl={12} xs={12} sm={12}>
                            <Card className="bg-secondary shadow">
                                <CardHeader className="bg-white border-0">
                                    <Row className="align-items-center">
                                        <Col className="p-3" md={7} xl={7} lg={7} sm={7} xs={12}>
                                            <h3 className="mb-0">{i18next.t("In-Dine Management")} </h3>
                                        </Col>
                                    </Row>
                                </CardHeader>
                                <CardBody>
                                    <FormGroup>
                                        <Label
                                            className="mb-2 font-weight-bold"
                                            for="resturant"
                                        >
                                            {i18next.t("Table Capacity")}
                                        </Label>
                                        <Row md={12} lg={12} xl={12} xs={12} sm={12}>
                                            <Col md={10} lg={10} xl={10} xs={8} sm={10}>
                                                <Input
                                                    className="px-2"
                                                    type="text"
                                                    placeholder={i18next.t("Table Capacity")}
                                                    name="capacity"
                                                    value={capacity}
                                                    onChange={this.handleChange}
                                                />
                                            </Col>
                                            <Col md={2} lg={2} xl={2} xs={4} sm={2}>
                                                <Button
                                                    type="button"
                                                    color="success"
                                                    onClick={this.onUpdateTableCapacity}
                                                >
                                                    {i18next.t("save")}
                                                </Button>
                                            </Col>
                                        </Row>
                                    </FormGroup>
                                </CardBody>
                            </Card>
                        </Col>
                    </Row>
                    <Row>
                        {
                            this.state.flag === true &&
                            <TablesNotification
                                states={this.state.stateCard}
                                PopMessage=
                                {(tableData, msgIndex) => { this.PopMessage(tableData, msgIndex) }}
                            />
                        }
                    </Row>

                    {/* <audio className="audio-element">
                        <source src="./../../../assets/sounds/ding.mp3"></source>
                    </audio> */}

                    <audio className="audio-element">
                        <source src={ding} type="audio/mpeg" />
                    </audio>


                </Container>
            </>
        );
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(InDine);
