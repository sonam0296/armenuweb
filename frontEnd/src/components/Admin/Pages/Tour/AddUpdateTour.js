import React, { Component } from "react";

// reactstrap for styling
import {
    Button,
    Modal,
    FormGroup,
    Input,
    CardBody,
    Form,
    Label,
    Progress
} from "reactstrap";

// for api integration
import instance from "../../../../axios";
import requests from "../../../../requests";

// for Redux
import { bindActionCreators } from "redux";
import { ActCreators } from "../../../../redux/bindActionCreator";
import { connect } from "react-redux";

// for notification
import { errorToaster, successToaster } from "../../../common/common-validation/common";


import i18next from "i18next";
import Loader from "../../../common/Loader";

import axios from "axios"

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

export class AddUpdateTour extends Component {
    constructor(props) {
        super(props);
        this.state = {
            title: "",
            content: "",
            multerItem_image: "",
            item_image: "",
            UplodProgress: 0,
            Status: "",
            selectedTour: {},

            flagForProgressBar: false
        };
    }

    componentDidMount = () => {
        this.setState({
            Status: this.props.status,
            selectedTour: this.props.selectedTour
        }, () => {
            if (this.state.Status !== "Add") {
                this.setState({
                    title: this.state.selectedTour.title,
                    content: this.state.selectedTour.content,
                    item_image: this.state.selectedTour.hasOwnProperty("source_url") ? this.state.selectedTour.source_url : "",
                    multerItem_image: this.state.selectedTour.hasOwnProperty("source_url") ? this.state.selectedTour.source_url : ""
                })
            }
        })
    }

    handlechangeall = (e) => {
        this.setState({
            [e.target.name]: e.target.value,
        });
    };

    handleFileChange = async (e) => {
        this.setState({
            flagForProgressBar: true
        })
        const data = e.target.files[0];
        if (e.target.files[0].size <= 1048576) {
            this.setState(
                {
                    item_image: data,
                    multerItem_image: URL.createObjectURL(data)
                },
                async () => {
                    const fd = new FormData();
                    if (this.state.item_image.length !== 0) {
                        fd.append("item_image", this.state.item_image, this.state.item_image.name);
                    }

                    // const response = await axios({
                    //     method: 'post',
                    //     url: 'https://api.appetizar.io/api/service/upload-image',
                    //     data: fd,
                    //     headers: {
                    //         "Authorization": `Bearer ${token}`
                    //     },

                    //     // New version
                    //     onUploadProgress(progressEvent) {
                    //         console.log({ progressEvent });
                    //     }
                    // })

                    const config = {
                        headers: {
                            "Authorization": `Bearer ${token}`
                        },
                        onUploadProgress: (progressEvent) => {

                            var percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
                            if (percentCompleted <= 100) {
                                this.setState({
                                    UplodProgress: percentCompleted
                                })
                            }
                        }
                    }

                    const response = await instance.post(
                        "/service/upload-image", fd, config
                    ).catch((error) => {
                        let errorMessage = error.response.data.error.message;
                        errorToaster(errorMessage)
                    });
                    if (response && response.data) {
                        successToaster("Image successfully uploaded ");
                        this.state.image_url = response.data.data.reqFiles.item_image[0].location
                        this.setState({
                            UplodProgress: 100
                        })
                    }
                }
            );
        } else {
            errorToaster("Your file is too large, please select lessthan 1 mb file")
        }

    };


    handleChange(e) {
        this.setState({
            [e.target.name]: e.target.value
        })
    };

    handleCloseModal = () => {
        this.setState({
            title: "",
            content: "",
            multerItem_image: "",
            item_image: "",
            UplodProgress: 0,
        })
        this.props.onClose();
    };

    onAddUpdateTour = async () => {
        let {Status} = this.state 

        let userType = this.props.userType;
        let is_outlet = this.props.is_outlet;
        let bodyAPI = {};
        if(Status === "Add"){
            bodyAPI = {
                "userType": userType,
                "is_outlet": is_outlet,
                "title": this.state.title,
                "content": this.state.content,
                "source_url": this.state.image_url
            };
        }else{
            bodyAPI = {
                "tour_id":this.state.selectedTour._id,
                "userType": userType,
                "is_outlet": is_outlet,
                "title": this.state.title,
                "content": this.state.content,
                "source_url": this.state.image_url
            };  
        }

        
        const response = await instance
            .post(requests.fetchAddTourForAdmin, bodyAPI, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })
            .catch((error) => {
                let errorMessage = error.response.data.error.message;
                errorToaster(errorMessage);
            });
        if (response && response.data) {
            this.setState({
                datas: response.data.data.tourData,
            });
            this.props.getTourDetail();
            this.handleCloseModal();
        }
    }

    render() {
        let {
            title,
            content,
            item_image,
            multerItem_image,
            UplodProgress,
            Status,
            flagForProgressBar
        } = this.state;
        return (
            <div>
                <Modal className="modal-dialog-centered" isOpen={this.props.show}>
                    <div className="modal-header">
                        <h3 className="modal-title " id="exampleModalLabel">
                            {
                                Status === "Add" ?
                                    i18next.t("Add New Tour/Hint")
                                    :
                                    i18next.t("Update Tour/Hint")
                            }
                        </h3>
                        <button 
                            aria-label="Close"
                            className="close"
                            data-dismiss="modal"
                            type="button"
                            onClick={this.handleCloseModal}
                        >
                            <span aria-hidden={true}>×</span>
                        </button>
                    </div>
                    <div className="modal-body p-0">
                        <CardBody>
                            <Form>
                                {/* Address */}
                                {/* <h6 className="heading-small text-muted mb-4">
                                    {i18next.t("OUTLET OWNER INFORMATION")}
                                </h6> */}

                                <FormGroup>
                                    <label
                                        className="form-control-label"
                                        htmlFor="input-address"
                                    >
                                        {i18next.t("Title")}
                                    </label>
                                    <Input
                                        required
                                        className="form-control-alternative"
                                        placeholder={i18next.t("Title")}
                                        type="text" name="title"
                                        value={title}
                                        onChange={(e) => this.handleChange(e)}
                                    />
                                </FormGroup>

                                <FormGroup>
                                    <label
                                        className="form-control-label"
                                        htmlFor="input-address"
                                    >
                                        {i18next.t("Content")}
                                    </label>
                                    <Input
                                        required
                                        className="form-control-alternative"
                                        placeholder={i18next.t("Content")}
                                        type="textarea" name="content"
                                        value={content}
                                        onChange={(e) => this.handleChange(e)}
                                    />
                                </FormGroup>

                                <FormGroup className="text-center font-weight-bold">
                                    <Label for="input-name">{i18next.t("Tour/Hint Image")}</Label>
                                    <div className="text-center">
                                        <div
                                            className="fileinput fileinput-new"
                                            dataprovider="fileinput"
                                        >
                                            <div className="fileinput-preview img-thumbnail">
                                                <img
                                                    src={
                                                        multerItem_image.length !== 0
                                                            ? multerItem_image : process.env.REACT_APP_DEFAULT_IMAGE
                                                    }
                                                    style={{
                                                        width: "100%",
                                                        height: "200px",
                                                        objectFit: "cover",
                                                    }}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <span className="btn btn-outline-secondary btn-file mt-3">
                                                {item_image.length === 0 && (
                                                    <span className="fileinput-new">{i18next.t("Upload Image")}</span>
                                                )}
                                                <input
                                                    type="file"
                                                    name="item_image"
                                                    onChange={this.handleFileChange}
                                                    accept="image/x-png,image/gif,image/jpeg,image/png"

                                                />
                                            </span>
                                        </div>
                                        {
                                            flagForProgressBar === true &&
                                                <div className="progress-wrapper">
                                                    <div className="progress-info">
                                                        <div className="progress-label">
                                                            <span>Task completed</span>
                                                        </div>
                                                        <div className="progress-percentage">
                                                            <span>{UplodProgress}</span>
                                                        </div>
                                                    </div>
                                                    <Progress animated
                                                        max="100"
                                                        value={UplodProgress}
                                                        color="danger"
                                                    />
                                                </div>
                                        }
                                    </div>
                                </FormGroup>

                                <center>
                                    {
                                        Status === "Add" ?
                                            <Button
                                                disabled={(!title || !content || UplodProgress !== 100)}
                                                className="my-4"
                                                color="success"
                                                type="button" onClick={() => this.onAddUpdateTour()}>
                                                {i18next.t("save")}
                                            </Button>
                                            : <Button
                                                className="my-4"
                                                color="success"
                                                type="button" onClick={() => this.onAddUpdateTour()}>
                                                {i18next.t("save")}
                                            </Button>
                                    }

                                </center>
                            </Form>
                        </CardBody>

                    </div>
                </Modal>
            </div>
        );
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(AddUpdateTour);
