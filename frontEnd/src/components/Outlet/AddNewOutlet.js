import React, { Component } from "react";

// reactstrap for styling
import {
    Button,
    Modal,
    FormGroup,
    Input,
    CardBody,
    Form,
    Row,
    Col,
    FormFeedback
} from "reactstrap";

// for api integration
import instance from "../../axios";
import requests from "../../requests";

// for Redux
import { bindActionCreators } from "redux";
import { ActCreators } from "../../redux/bindActionCreator";
import { connect } from "react-redux";

// for notification
import { errorToaster, successToaster } from "../common/common-validation/common";


import i18next from "i18next";

import PhoneInput from 'react-phone-input-2'
import 'react-phone-input-2/lib/bootstrap.css'

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

export class AddNewOutlet extends Component {
    constructor(props) {
        super(props);
        this.state = {
            restaurant_name: "",
            Name: "",
            Email: "",
            Phone: null,
            dial_code: null,
            country_name: null,
            country_code: null,
            languages: null,
            password: null,
            confirmPassword: null
        };
    }
    handlechangeall = (e) => {
        this.setState({
            [e.target.name]: e.target.value,
        });
    };

    handleFileChange = (e) => {
        // this.toBase64(e.target.files[0]).then((data) => {
        //   this.setState({ image: data });
        // });
        const data = e.target.files[0];
        this.setState(
            { item_image: data, multerItem_image: URL.createObjectURL(data) }
        );
    };

    handleChangeForPhone = (value, data, event, formattedValue) => {
        this.setState({
            Phone: formattedValue,
            dial_code: data.dialCode,
            country_name: data.name,
            country_code: data.countryCode
        })
    }

    handleChange(e) {
        if (e.target.name === "Email") {
            this.setState({
                [e.target.name]: e.target.value
            })
            this.checkEmailValidation(e.target.value);
        } else {
            this.setState({
                [e.target.name]: e.target.value
            })
        }
    };

    checkEmailValidation = (value) => {
        let mailFormat = /^[\w-\.]+@([\w-]+\.)+[\D-]{2,4}$/;
        if (value.match(mailFormat)) {
            this.setState({
                emailState: "has-success"
            })
        } else {
            this.setState({
                emailState: "has-danger"
            })
        }
    }

    CallCloneMenuItems = async (status, outlet_id) => {
        let API = status === "menu_item" ? requests.fetchCloneMenuItemForOutlet
            : requests.fetchCloneCateogyForOutlet

        let APIBody = userData.userType === "owner" ? {
            "owner_id": userData._id,
            "outlet_id": outlet_id,
            "item_available": true
        }
            : {
                "owner_id": StoreRestaurantId.id,
                "outlet_id": outlet_id,
                "item_available": true
            }

        const response = await instance
            .post(API, APIBody, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })
            .catch((error) => {
                let errorMessage = error.response.data.error.message;
                errorToaster(errorMessage);
                console.log(errorMessage);
            });
        if (response && response.data) {
            //const { history } = this.props;
            //console.log("History ====> ", history);
            //if (history) history.push("/outlets");
            this.handleCloseModal();

        }
    }

    onAddNewOutlet = async () => {
        const {
            restaurant_name,
            password,
            confirmPassword,
            Name,
            Email,
            Phone, dial_code,
            country_name,
            country_code,
            languages,
        } = this.state;
        if(password === confirmPassword){
            if (Phone.length >= 13) {
                axios.get('https://restcountries.eu/rest/v2/callingcode/' + this.state.dial_code + '?fields=name;callingCodes;languages;currencies')
                    .then(response => {
                        this.setState({
                            currencies: response.data[0].currencies[0],
                            languages: response.data[0].languages
                        }, async () => {
                            let currencies1 = {
                                "code": this.state.currencies.code.toLowerCase(),
                                "curr_name": this.state.currencies.name,
                                "symbol": this.state.currencies.symbol
                            }
                            let APIBody = userData.userType === "admin" ? {
                                master_brand: StoreRestaurantId.id,
                                user_languages: this.state.languages,
                                password: this.state.password,
                                name: Name,
                                email: Email,
                                phone: Phone,
                                dial_code: dial_code,
                                country_code: country_code,
                                country_name: country_name,
                                userType: "owner",
                                is_outlet: true,
                                currencies: currencies1,
                                restaurant_Name: StoreRestaurantId.restaurant_Name,
                                hosting_Address: StoreRestaurantId.hosting_Address
                            }
                                : {
                                    master_brand: userData._id,
                                    user_languages: this.state.languages,
                                    password: this.state.password,
                                    name: Name,
                                    email: Email,
                                    phone: Phone,
                                    dial_code: dial_code,
                                    country_code: country_code,
                                    country_name: country_name,
                                    userType: "owner",
                                    is_outlet: true,
                                    currencies: currencies1,
                                    restaurant_Name: userData.restaurant_Name,
                                    hosting_Address: userData.hosting_Address
                                }
                            // let APIBody = {
                            //     master_brand: userData._id,
                            //     user_languages:this.state.languages,
                            //     password:"123",
                            //     name: Name,
                            //     email: Email,
                            //     phone: Phone,
                            //     dial_code: dial_code,  
                            //     country_code : country_code,
                            //     country_name : country_name,
                            //     userType: "owner",
                            //     is_outlet: true,
                            //     currencies: currencies1,
                            //     restaurant_Name: userData.restaurant_Name
                            // }
                            let API = requests.fetchAddOutletRegister;
                            const response = await instance
                                .post(API, APIBody, {
                                    headers: {
                                        Authorization: `Bearer ${token}`,
                                    },
                                })
                                .catch((error) => {
                                    let errorMessage = error.response.data.error.message;
                                    errorToaster(errorMessage);
                                    console.log(errorMessage);
                                });
    
                            if (response && response.data) {
                                successToaster("Record successfully added!");
                                this.props.callGetOutlet();
                                this.CallCloneMenuItems("menu_item", response.data.data.user._id);
                                this.CallCloneMenuItems("menu_category", response.data.data.user._id);
    
                            }
                        })
                    })
            } else {
                errorToaster("Invalid Phone Number!")
            }
        }else{
            errorToaster("Password and confirm password does't match");
        }
    }

    handleCloseModal = () => {
        this.props.onClose();
        this.setState({
            restaurant_name: "",
            Name: "",
            Email: "",
            Phone: null,
            password: null,
            confirmPassword: null,
        })
    };

    render() {
        let {
            password,
            confirmPassword,
            restaurant_name,
            Name,
            Email,
            Phone,
        } = this.state;
        return (
            <div>
                <Modal className="modal-dialog-centered" isOpen={this.props.show}>
                    <div className="modal-header">
                        <h3 className="modal-title " id="exampleModalLabel">
                            {i18next.t("Add New Outlet")}
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
                                <div className="pl-lg-4">
                                    <Row>
                                        <Col md="12">
                                            <FormGroup>
                                                <label
                                                    className="form-control-label"
                                                    htmlFor="input-address"
                                                >
                                                    {i18next.t("Outlet Owner Name")}
                                                </label>
                                                <Input
                                                    required
                                                    className="form-control-alternative"
                                                    placeholder={i18next.t("Name")}
                                                    type="text" name="Name"
                                                    value={Name}
                                                    onChange={(e) => this.handleChange(e)}
                                                />
                                            </FormGroup>
                                        </Col>
                                    </Row>
                                    <Row>
                                        <Col md="12">
                                            <FormGroup>
                                                <label
                                                    className="form-control-label"
                                                    htmlFor="input-address"
                                                >
                                                    {i18next.t("Password")}
                                                </label>
                                                <Input
                                                    required
                                                    className="form-control-alternative"
                                                    placeholder={i18next.t("Password")}
                                                    type="password" name="password"
                                                    value={password}
                                                    onChange={(e) => this.handleChange(e)}
                                                />
                                            </FormGroup>

                                        </Col>
                                    </Row>
                                    <Row>
                                        <Col md="12">
                                            <FormGroup>
                                                <label
                                                    className="form-control-label"
                                                    htmlFor="input-address"
                                                >
                                                    {i18next.t("Confirm Password")}
                                                </label>
                                                <Input
                                                    required
                                                    className="form-control-alternative"
                                                    placeholder={i18next.t("Confirm Password")}
                                                    type="password" name="confirmPassword"
                                                    value={confirmPassword}
                                                    onChange={(e) => this.handleChange(e)}
                                                />

                                            </FormGroup>
                                        </Col>
                                    </Row>
                                    <Row>
                                        <Col md="12">
                                            <FormGroup>
                                                <label
                                                    className="form-control-label"
                                                    htmlFor="input-address"
                                                >
                                                    {i18next.t("Email")}
                                                </label>
                                                <Input
                                                    required
                                                    valid={this.state.emailState === 'has-success'}
                                                    invalid={this.state.emailState === 'has-danger'}
                                                    className="form-control-alternative"
                                                    placeholder={i18next.t("Email")}
                                                    type="email" name="Email"
                                                    value={Email}
                                                    onChange={(e) => this.handleChange(e)}
                                                />

                                                <FormFeedback invalid>
                                                    Uh oh! Looks like there is an issue with your email. Please input a correct email.
                                    </FormFeedback>
                                            </FormGroup>
                                        </Col>
                                    </Row>

                                    <Row>
                                        <Col md="12">
                                            <FormGroup>
                                                <label
                                                    className="form-control-label"
                                                    htmlFor="input-address"
                                                >
                                                    {i18next.t("Phone")}
                                                </label>
                                                <PhoneInput className="p-3"
                                                    inputStyle={{ width: "100%" }}
                                                    inputProps={{
                                                        name: 'Phno',
                                                        required: true,
                                                        autoFocus: false,
                                                        maxlength: "13",
                                                    }}
                                                    placeholder={i18next.t("Enter Phone no")}
                                                    country={'in'}
                                                    value={Phone}
                                                    autoFormat={false}
                                                    onChange={(value, data, event, formattedValue) => this.handleChangeForPhone(value, data, event, formattedValue)}
                                                />
                                            </FormGroup>
                                        </Col>
                                    </Row>

                                </div>
                                <center>
                                    <Button
                                        className="my-4"
                                        color="success"
                                        disabled={(!Name || !Email || !Phone) ? true : false}
                                        type="button" onClick={() => this.onAddNewOutlet()}>
                                        {i18next.t("save")}
                                    </Button>
                                </center>
                            </Form>
                        </CardBody>

                    </div>
                </Modal>
            </div>
        );
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(AddNewOutlet);
