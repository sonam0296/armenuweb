import React from "react";
import axios from "axios";

import {
    Card,
    CardHeader,
    CardTitle,
    CardFooter,
    CardText,
    CardBody,
    Container,
    Row,
    Col,
    FormGroup,
    Form,
    Input,
    FormFeedback,
} from "reactstrap";
import HomeHeader from "../header/HomeHeader";
import instance from "../../../axios";
import requests from "../../../requests";

import { Link, Redirect } from 'react-router-dom'

//for Redux
import { bindActionCreators } from "redux";
import { ActCreators } from "../../../redux/bindActionCreator";
import { connect } from "react-redux";

//Phone Number Input
import PhoneInput from 'react-phone-input-2'
import 'react-phone-input-2/lib/material.css'

import i18next from "i18next";

import { errorToaster, successToaster } from "../common-validation/common";

import PaymentModal from "./Stripe/paymentModal";

import HomeFooter from "../../Footers/HomeFooter";

import BackImage from "../../../assets/img/theme/food-8.webp";

import TextField from '@material-ui/core/TextField';

import Button from '@material-ui/core/Button';

import "../OwnerRgistration/StripePlan.css";
import ConfirmationModal  from "../DialogBox/ConfirmationModal";



let userData = {};
let token = null;
let get_fcm_registration_token = null;
let tempUserData = {};
let tempToken = "";

const mapStateToProps = (state) => {
    userData = state.userData;
    get_fcm_registration_token = state.get_fcm_registration_token;
    token = state.token;
    tempUserData = state.tempUserData;
    tempToken = state.tempToken;
};

const mapDispatchToProps = (dispatch) => {
    return bindActionCreators(ActCreators, dispatch);
};

class RestaurantRegistration extends React.Component {

    constructor(props) {
        super(props)

        this.state = {
            restaurant_name: '',
            Name: '',
            Email: '',

            password: '',
            confirmPassword: '',
            //hostName:'',
            Phone: '',
            dial_code: null,
            country_name: '',
            country_code: '',

            currencies: {},
            languages: [],

            countries: [],

            flagPaymentModalShow: false,
            paymentModalShow: false,

            planData: {},
            planid: "",
            valid: false,
            invalid: false,

            emailState: "",
            cwdState: "",
            PhoneState: "",
            pathStatus: "",
            redirectDashboard: false,
            loaderStatus: false,
            buttonStatus: "Register Now",

            razor_oto_id: "",
            isExistOrNot: null,
            openAlert: false

        }
    }

    onClose = async () => {
        this.setState({
            flagPaymentModalShow: false,
            paymentModalShow: false
        });
    }

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

    getCountryCode = async () => {
        const response = await instance
            .get(requests.fetchCountryCode)
            .catch((error) => {
                let errorMessage = error.message;
                errorToaster(errorMessage);
            });
        if (response && response.data) {
            this.setState({
                countries: response.data.data
            })
        }
    }

    componentDidMount = async () => {
        // this.setState({
        //     planid: this.state.pathStatus === "owner" ? "5ff00a9de40b9641e8150ded" : "6018d50ee72ca97b275af888"
        // })
        this.getCountryCode();

        const { history } = this.props;
        const path = history.location.pathname;
        let splitPath = path.split("/");


        this.setState({
            pathStatus: splitPath[2],
            planid: splitPath[4]
        }, async () => {
            // Razorpay := 5ffe7011d9c70468b77ce8f4
            // 

            // let planId = this.state.pathStatus === "owner" ? "5ff00a9de40b9641e8150ded" : "6018d50ee72ca97b275af888"
            let apiBody = {
                "plan_id": this.state.planid,
            }
            const response = await instance
                .post(requests.fetchPlanFromOwner, apiBody)
                .catch((error) => {
                    let errorMessage = error.message;
                    errorToaster(errorMessage);

                });
            if (response && response.data) {
                this.props.SELECTED_PLAN_INFO(response.data.data);
                this.setState({
                    planData: response.data.data
                })
            }
        })

    }

    ResetAll = () => {
        this.getCountryCode();
        this.setState({
            restaurant_name: '',
            ownerName: '',
            Email: '',
            password: '',
            confirmPassword: '',
            Phone: '',
            emailState: ''
        })
    }

    onCallAddUser = async () => {
        this.setState({
            loader: true,
            buttonStatus: "Processing... "
        })
        const response = await instance
            .post(requests.fetchRestuarantRegistration, tempUserData)
            .catch((error) => {
                let errorMessage = error.response.data.error.message;
                errorToaster(errorMessage);
                console.log(errorMessage);
                this.setState({
                    buttonStatus: "Register Now"
                })
            });
        if (response && response.data) {
            
            let userdata = response.data.data.user;
            this.props.TEMP_USER_DATA(userdata);
            let tempToken = response.data.data.token;
            this.props.TEMP_TOKEN(tempToken);
            successToaster("Your Registration is successfully done!");
            //this.ShowRazorpay();

            this.CreateRazorpaySubscription(response)

        }
    }

    CreateRazorpaySubscription = async () => {
        this.setState({
            loader: true,
            buttonStatus: "Subscribing... "
        })
        let APIBody = {
            "plan_id": this.state.planid
        }
        const response = await instance
            .post(requests.fetchRazorpayOnetimeSubscription, APIBody, {
                headers: {
                    Authorization: `Bearer ${tempToken}`,
                },
            })
            .catch((error) => {
                let errorMessage = error.response.data.error.message;
                errorToaster(errorMessage);
                console.log(errorMessage);
                this.setState({
                    buttonStatus: "Register Now"
                })
            });
        if (response && response.data) {
            this.setState({
                razor_oto_id: response.data.data.razor_oto_id
            })
            // let userdata = response.data.data.user;
            // this.props.TEMP_USER_DATA(userdata);
            // let tempToken = response.data.data.token;
            // this.props.TEMP_TOKEN(tempToken);
            successToaster("Your subscription is successfully created.");
            this.ShowRazorpay(response, this.props);
        }
    }

    ShowRazorpay = (response, props) => {
        var options = {
            "order_id": this.state.razor_oto_id,
            "key": process.env.REACT_APP_RAZOR_PAY_KEY,
            //"subscription_id": response.data.data.razor_subscription_id,
            "currency": "INR",
            "name": "Ipangram",
            "description": "Test Transaction",
            "modal": {
                "ondismiss": async function () {
                    let UserData = tempUserData;
                    let token = tempToken;
                    props.LOGIN_USER_DETAIL(UserData);
                    props.TOKEN_KEY(token);
                    props.TEMP_USER_DATA({});
                    props.TEMP_TOKEN(null);
                    let Greetings = {
                        status: true,
                        completedStatus: "0%"
                    }
                    props.STORE_GREETINGS_INFORMATION(Greetings);
                    const { history } = props;
                    history.push("/subscription-plan");
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
                    successToaster("Subscription successfully done!");

                    let UserData = tempUserData;
                    let token = tempToken;
                    props.LOGIN_USER_DETAIL(UserData);
                    props.TOKEN_KEY(token);
                    props.TEMP_USER_DATA({});
                    props.TEMP_TOKEN(null);
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
                "name": tempUserData.name,
                "email": tempUserData.email,
                "contact": tempUserData.phone
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

    onCloseAlert = () => {
        this.setState({
            openAlert:false
        });
    }


    // CreateRazorpaySubscription = async () => {
    //     this.setState({
    //         loader: true,
    //         buttonStatus: "Subscribing... "
    //     })
    //     let APIBody = {
    //         "plan_id": "60640af031fc1a03da610ab1"
    //     }
    //     const response = await instance
    //         .post(requests.fetchCreateRazorpaySubscription, APIBody, {
    //             headers: {
    //                 Authorization: `Bearer ${tempToken}`,
    //             },
    //         })
    //         .catch((error) => {
    //             let errorMessage = error.response.data.error.message;
    //             errorToaster(errorMessage);
    //             console.log(errorMessage);
    //         });
    //     if (response && response.data) {
    //         // let userdata = response.data.data.user;
    //         // this.props.TEMP_USER_DATA(userdata);
    //         // let tempToken = response.data.data.token;
    //         // this.props.TEMP_TOKEN(tempToken);
    //         successToaster("Your subscription is successfully created.");
    //         this.ShowRazorpay(response, this.props);
    //     }
    // }

    // ShowRazorpay = (response, props) => {
    //     var options = {
    //         "key": process.env.REACT_APP_RAZOR_PAY_KEY,
    //         "subscription_id": response.data.data.razor_subscription_id,
    //         "name": "E hallo !!",
    //         "description": "Ipsum est repudiandae illo. Esse soluta sint est provident qui doloremque occaecati. Repellendus qui iusto hic deserunt amet est omnis rerum cum.",

    //         "modal": {
    //             "ondismiss": async function () {
    //                 let UserData = tempUserData;
    //                 let token = tempToken;
    //                 props.LOGIN_USER_DETAIL(UserData);
    //                 props.TOKEN_KEY(token);
    //                 props.TEMP_USER_DATA({});
    //                 props.TEMP_TOKEN(null);
    //                 let Greetings = {
    //                     status: true,
    //                     completedStatus: "0%"
    //                 }
    //                 props.STORE_GREETINGS_INFORMATION(Greetings);
    //                 const { history } = props;
    //                 history.push("/subscription-plan");
    //             },
    //             escape: false,
    //             confirm_close: true,
    //             handleback: false,
    //         },

    //         "handler": function (response) {
    //             // alert(response.razorpay_payment_id),
    //             // alert(response.razorpay_subscription_id),
    //             // alert(response.razorpay_signature);
    //             if (response.razorpay_signature) {

    //                 //this.ClearCart();
    //                 // const { history } = this.props;
    //                 // if (history) history.push(`/orders`);
    //                 successToaster("Subscription successfully done!");

    //                 let UserData = tempUserData;
    //                 let token = tempToken;
    //                 props.LOGIN_USER_DETAIL(UserData);
    //                 props.TOKEN_KEY(token);
    //                 props.TEMP_USER_DATA({});
    //                 props.TEMP_TOKEN(null);
    //                 let Greetings = {
    //                     status: true,
    //                     completedStatus: "0%"
    //                 }
    //                 props.STORE_GREETINGS_INFORMATION(Greetings);
    //                 const { history } = props;
    //                 history.push("/dashboard");
    //             }
    //             else {
    //                 console.log("Razor Pay Error : => ", response);
    //             }
    //         },
    //         "prefill": {
    //             "name": tempUserData.name,
    //             "email": tempUserData.email,
    //             "contact": tempUserData.phone
    //         },
    //         "notes": {
    //             "note_key_1": "Tea. Earl Grey. Hot",
    //             "note_key_2": "Make it so."
    //         },
    //         "theme": { "color": "#F37254" },

    //     }
    //     var rzp1 = new window.Razorpay(options);
    //     rzp1.open();
    // }

    // callEmailExistOrNot = async (email) => {
    //     let reqBody = {
    //         "email":email,
    //         "userType":"owner"
    //     }
    //     const response = await instance
    //         .post(requests.isEmailRegisterdOrNot, reqBody)
    //         .catch((error) => {
    //             let errorMessage = error.response.data.error.message;
    //             errorToaster(errorMessage);
    //             console.log(errorMessage);

    //         });
    //     if (response && response.data) {
    //         console.log("Response ===> ",response);
    //         this.setState({
    //             isExistOrNot: response.data.data.is_email_regi
    //         }) 
    //     }
    // }


    onRegisterRestaurant = async () => {

        const {
            restaurant_name,
            Name,
            Email,
            password,
            confirmPassword,
            Phone, dial_code,
            country_name,
            country_code,
            languages,
            //hostName
            pathStatus,
            buttonStatus,
        } = this.state;

        let reqBody = {
            "email": this.state.Email,
	    "userType": this.state.pathStatus === "owner" ? "owner" : "driver_aggregator",
     //     "userType": "owner"
        }
        const response = await instance
            .post(requests.isEmailRegisterdOrNot, reqBody)
            .catch((error) => {
                let errorMessage = error.response.data.error.message;
                errorToaster("Email already exists");
                console.log(errorMessage);
            });
        if (response && response.data) {
            this.setState({
                isExistOrNot: response.data.data.is_email_regi
            }, () => {
                console.log("validOrNot ==> ", this.state.isExistOrNot);
            })
        }

        // let mailFormat = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
        let mailFormat = /^[\w-\.]+@([\w-]+\.)+[\D-]{2,4}$/;
        let checkNullValidation = pathStatus === "owner" ?
            (restaurant_name && Email && Phone && password && confirmPassword) ? true : false
            :
            (Name && Email && Phone && password && confirmPassword) ? true : false
        if (this.state.country_code === this.state.planData.country_code) {
            if (checkNullValidation) {
                if (Email.match(mailFormat)) {
                    if (password === confirmPassword) {
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
                                        let registerRestaurantData = this.state.pathStatus === "owner" === true ?
                                            {
                                                "name": restaurant_name,
                                                "restaurant_Name": restaurant_name,
                                                "email": Email,
                                                "phone": Phone,
                                                "password": password,
                                                "userType": "owner",
                                                "country_name": country_name,
                                                "country_code": country_code,
                                                "currencies": currencies1,
                                                "user_languages": languages,
                                                "dial_code": dial_code,
                                                "is_outlet": false,
                                            }
                                            :
                                            {
                                                "name": Name,
                                                "email": Email,
                                                "phone": Phone,
                                                "password": password,
                                                "userType": "driver_aggregator",
                                                "country_name": country_name,
                                                "country_code": country_code,
                                                "currencies": currencies1,
                                                "user_languages": languages,
                                                "dial_code": dial_code,
                                            }
    
                                        this.props.TEMP_USER_DATA(registerRestaurantData);
                                        if(this.state.isExistOrNot !== true){
                                            if (country_name !== "India") {
                                                this.setState({
                                                    flagPaymentModalShow: true,
                                                    paymentModalShow: true
                                                })
                                            } else {
                                                this.onCallAddUser();
                                            }
                                        }else{
                                            this.setState({
                                                openAlert: true
                                            });
                                        }
                                     })
                                })
                                .catch(error => {
                                    this.setState({
                                        buttonStatus: "Register Now"
                                    }, () => console.log(this.state.buttonStatus))
                                    console.log(error);
                                    errorToaster(error);
    
                                })
                        } else {
                            errorToaster("Invalid Phone Number!")
                        }
    
                    } else {
                        errorToaster("Password and Confirm Password doesn't match!");
                    }
                } else {
                    errorToaster("Invalid Email Address!");
                }
            }
            else {
                errorToaster(`All fields are mandatory!`);
            }
        } else {
            errorToaster(`Plan id doesnot match Country code!`);
        }   
         

    }

    render() {
        let {
            restaurant_name,
            Name,
            Email,
            Phone,
            password,
            confirmPassword,
            countries, flagPaymentModalShow, paymentModalShow,
            planData,
            pathStatus,
            redirectDashboard,
            loaderStatus,
            buttonStatus
        } = this.state;

        if (redirectDashboard) {
            return (<Redirect to="/dashboard" />)
        }
        return (
            <>
                {/* <HomeHeader /> */}
                {/* <div className="md-12 sm-12 ld-12 xs-12 lg-12"> */}
                <Row md={12} sm={12} ld={12} xs={12} lg={12}
                    style={{
                        height: '100vh',

                    }} >
                    {/* <Container md={6} sm={6} ld={6} xs={12} lg={6} className="pt-4 pb-6" fluid style={{ backgroundColor: "red" }} >
                            <Row>



                            </Row>
                        </Container> */}
                    <Col md={7} sm={7} ld={7} xs={12} lg={7} className="text-white"
                        style={{
                            backgroundImage: `url(${BackImage})`,
                            backgroundRepeat: 'no-repeat',
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            boxShadow: "inset 0 0 0 2000px rgba(0, 0, 0, 0.5)",
                            //filter: " blur(3px)",
                        }}
                    >
                        {/* <div className="bg-image"
                        // style={{
                        //     backgroundImage: `url(${BackImage})`,
                        //     backgroundRepeat: 'no-repeat',
                        //     backgroundSize: 'cover',
                        //     backgroundPosition: 'center',
                        //     boxShadow: "inset 0 0 0 2000px rgba(0, 0, 0, 0.5)",
                        //     filter: " blur(3px)",
                        // }}

                        ></div> */}
                        {/* <div  className="mt-8 ml-5 mb-5 mr-4 text-white border p-5" */}
                        <div className="mt-8 ml-5 mb-5 mr-4 text-white p-5"
                            style={{
                                borderRadius: "25px",
                                border: "3px solid #FFFFFF",
                                padding: "20px",
                                transform: "translate(50 %, 50 %)",
                                zIndex: "2",
                                position: "relative",
                                backgroundColor: "rgba(0, 0, 0, 0.4)"

                            }}
                        >

                            <div className="d-flex justify-content-between">
                                <div className="md-7 display-2" >
                                    Selected Subscription Plan Detail
                                </div>
                            </div>

                            <CardText>
                                Your subscription plan will start now...
                            </CardText>

                            <CardTitle className="display-5 mt-0 mb-0">
                                Plan Name:
                            </CardTitle>
                            <CardTitle className="display-4 ">
                                {planData.title}
                            </CardTitle>

                            <CardTitle className="display-5 mt-0 mb-0">
                                Plan Amount:
                            </CardTitle>
                            <CardTitle className="display-4 ">
                                {planData.currency_symbol}{" "}{planData.unit_amount}
                            </CardTitle>


                            <CardTitle className="display-4"> Features </CardTitle>
                            <CardText>
                                {planData.content}
                            </CardText>
                        </div>


                        {/* <Card className="bg-secondary shadow">
                            <CardHeader className="border-0">
                                <div className="d-flex justify-content-between">
                                    <div className="md-7">
                                        <h3 className="mb-0">{"Selected Subscription Plan Detail"}</h3>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardBody>
                                <CardText>
                                    Your subscription plan will start now...
                                        </CardText>

                                <CardTitle className="display-5 mt-0 mb-0">
                                    Plan Name:
                                        </CardTitle>
                                <CardTitle className="display-4 ">
                                    {planData.title}
                                </CardTitle>

                                <CardTitle className="display-5 mt-0 mb-0">
                                    Plan Amount:
                                        </CardTitle>
                                <CardTitle className="display-4 ">
                                    {planData.currency_symbol}{" "}{planData.unit_amount}
                                </CardTitle>
                            </CardBody>
                            <CardFooter style={{ height: "100%" }}>
                                <CardTitle className="display-4"> Features </CardTitle>
                                <CardText>
                                    {planData.content}
                                </CardText>
                            </CardFooter>
                        </Card>
                     */}
                    </Col>

                    {/* <Col md={7} sm={7} ld={7} xs={12} lg={7} className="text-white" >
                        <div className="bg-image"

                        ></div>

                        <div className="bg-text">
                            <h2>Blurred Background</h2>
                            <h1 style={{fontSize:"50px"}}>I am John Doe</h1>
                            <p>And I'm a Photographer</p>
                        </div>
                    </Col> */}

                    <Col md={5} sm={5} ld={5} xs={12} lg={5}
                        style={{ boxShadow: "-1px -1px 8px #2C3539" }}
                    >
                        <div className="mt-4 text-muted text-center">
                            <i class="fab fa-wpforms fa-3x"></i><br />
                            {/* <i class="fas fa-sign-in-alt fa-5x"></i><br /> */}
                            <strong> Registration </strong>
                        </div>

                        {/* <div className="d-flex justify-content-between"> */}
                        <div className="text-center mt-4">
                            <h3 className="mb-0">
                                {
                                    pathStatus === "owner" ?
                                        i18next.t("Register Your Restaurant")
                                        :
                                        i18next.t("Registration For Driver Aggregator")

                                }
                            </h3>
                        </div>
                        {/* </div> */}
                        <Form className="mt-4 ml-3">
                            {
                                pathStatus === "owner" &&
                                <>
                                    {/* <h6 className="heading-small text-muted mb-4">
                                                        {i18next.t("RESTAURANT INFORMATION")}
                                                    </h6> */}
                                    <div className="pl-lg-4 ">
                                        <Row>
                                            <Col md="12">
                                                <FormGroup>

                                                    <TextField id="outlined-basic"
                                                        style={{ width: '90%' }}
                                                        label="Restaurant Name"
                                                        variant="outlined"
                                                        required
                                                        className="form-control-alternative"
                                                        placeholder={i18next.t("Restaurant Name")}
                                                        type="text" name="restaurant_name"
                                                        value={restaurant_name}
                                                        onChange={(e) => this.handleChange(e)} />
                                                    {/* <Input
                                                                required
                                                                className="form-control-alternative"
                                                                placeholder={i18next.t("Restaurant Name")}
                                                                type="text" name="restaurant_name"
                                                                value={restaurant_name}
                                                                onChange={(e) => this.handleChange(e)}
                                                            /> */}
                                                </FormGroup>
                                            </Col>
                                        </Row>

                                    </div>
                                </>

                            }

                            {/* Address */}
                            {/* <h6 className="heading-small text-muted mb-4">
                                                {i18next.t("CONTACT INFORMATION")}
                                            </h6> */}
                            <div className="pl-lg-4">
                                {
                                    pathStatus === "driver-aggregator" &&
                                    <Row>
                                        <Col md="12">
                                            <FormGroup>
                                                {/* <label
                                                                className="form-control-label"
                                                                htmlFor="input-address"
                                                            >
                                                                {i18next.t("Name")}
                                                            </label> */}
                                                <TextField id="outlined-basic"
                                                    style={{ width: '90%' }}
                                                    label="Name"
                                                    variant="outlined"
                                                    required
                                                    className="form-control-alternative"
                                                    placeholder={i18next.t("Name")}
                                                    type="text" name="Name"
                                                    value={Name}
                                                    onChange={(e) => this.handleChange(e)} />
                                                {/* <Input
                                                            required
                                                            className="form-control-alternative"
                                                            placeholder={i18next.t("Name")}
                                                            type="text" name="Name"
                                                            value={Name}
                                                            onChange={(e) => this.handleChange(e)}
                                                        /> */}
                                            </FormGroup>
                                        </Col>
                                    </Row>

                                }

                                <Row>
                                    <Col md="12">
                                        <FormGroup>
                                            {/* <label
                                                                className="form-control-label"
                                                                htmlFor="input-address"
                                                            >
                                                                {i18next.t("Email")}
                                                            </label> */}
                                            <TextField id="outlined-basic"
                                                error={this.state.emailState === 'has-danger' ? true : false}
                                                id="filled-error-helper-text"
                                                helperText={this.state.emailState === 'has-danger' ? "Uh oh! Looks like there is an issue with your email. Please input a correct email." : ""}

                                                style={{ width: '90%' }}
                                                label="Email"
                                                variant="outlined"
                                                required
                                                valid={this.state.emailState === 'has-success'}
                                                invalid={this.state.emailState === 'has-danger'}
                                                className="form-control-alternative"
                                                placeholder={i18next.t("Email")}
                                                type="email" name="Email"
                                                value={Email}
                                                onChange={(e) => this.handleChange(e)}
                                            />
                                            {/* <Input
                                                        required
                                                        valid={this.state.emailState === 'has-success'}
                                                        invalid={this.state.emailState === 'has-danger'}
                                                        className="form-control-alternative"
                                                        placeholder={i18next.t("Email")}
                                                        type="email" name="Email"
                                                        value={Email}
                                                        onChange={(e) => this.handleChange(e)}
                                                    /> */}

                                            <FormFeedback invalid>
                                                Uh oh! Looks like there is an issue with your email. Please input a correct email.
                                            </FormFeedback>
                                        </FormGroup>
                                    </Col>
                                    <Col md="12">
                                        <FormGroup>
                                            {/* <label
                                                                className="form-control-label"
                                                                htmlFor="input-address"
                                                            >
                                                                {i18next.t("Password")}
                                                            </label> */}

                                            <TextField id="outlined-basic"
                                                style={{ width: '90%' }}
                                                label="Password"
                                                variant="outlined"
                                                required
                                                className="form-control-alternative"
                                                placeholder={i18next.t("Password")}
                                                type="password" name="password"
                                                value={password}
                                                onChange={(e) => this.handleChange(e)}
                                            />
                                            {/* <Input
                                                        required
                                                        className="form-control-alternative"
                                                        placeholder={i18next.t("Password")}
                                                        type="password" name="password"
                                                        value={password}
                                                        onChange={(e) => this.handleChange(e)}
                                                    /> */}
                                        </FormGroup>
                                    </Col>
                                    <Col md="12">
                                        <FormGroup>
                                            {/* <label
                                                                className="form-control-label"
                                                                htmlFor="input-address"
                                                            >
                                                                {i18next.t("Confirm Password")}
                                                            </label> */}
                                            <TextField id="outlined-basic"
                                                style={{ width: '90%' }}
                                                label="Confirm Password"
                                                variant="outlined"
                                                required
                                                className="form-control-alternative"
                                                placeholder={i18next.t("Confirm Password")}
                                                type="password" name="confirmPassword"
                                                value={confirmPassword}
                                                onChange={(e) => this.handleChange(e)}
                                            />
                                            {/* <Input
                                                        required
                                                        className="form-control-alternative"
                                                        placeholder={i18next.t("Confirm Password")}
                                                        type="password" name="confirmPassword"
                                                        value={confirmPassword}
                                                        onChange={(e) => this.handleChange(e)}
                                                    /> */}

                                        </FormGroup>
                                    </Col>
                                    {
                                        countries.length > 0
                                        &&
                                        <Col md="12">
                                            <FormGroup>
                                                {/* <label
                                                                    className="form-control-label"
                                                                    htmlFor="input-address"
                                                                >
                                                                    {i18next.t("Phone")}
                                                                </label> */}
                                                <PhoneInput className="p-3 form-control-alternative"
                                                    variant="outlined"
                                                    id="outlined-basic"

                                                    // isValid={(value, country) => {
                                                    //     if (value.length<12) {
                                                    //         return 'Invalid value: '+value+', '+country.name;
                                                    //     }else if(value===null){
                                                    //         return true;
                                                    //     } else {
                                                    //         return true;
                                                    //     }
                                                    //   }}
                                                    inputStyle={{ width: "90%" }}
                                                    inputProps={{
                                                        name: 'Phno',
                                                        required: true,
                                                        autoFocus: false,
                                                        maxlength: "13",
                                                    }}
                                                    onlyCountries={countries}
                                                    placeholder={i18next.t("Enter Phone no")}
                                                    country={this.state.planData.country_code}
                                                    value={Phone}
                                                    autoFormat={false}
                                                    onChange={(value, data, event, formattedValue) => this.handleChangeForPhone(value, data, event, formattedValue)}
                                                />
                                            </FormGroup>
                                        </Col>
                                    }
                                </Row>

                            </div>
                            <center>
                                <Button
                                    variant="contained"
                                    className="my-4"
                                    color="primary"
                                    type="button" onClick={this.ResetAll}>
                                    {i18next.t("Reset")}
                                </Button>

                                <Button
                                    variant="contained"
                                    className="ml-4 my-4"
                                    color="primary"
                                    disabled={(!Email || !Phone || !password || !confirmPassword) || buttonStatus === 'Processing... ' || buttonStatus === "Subscribing... " ? true : false}
                                    type="button" onClick={() => this.onRegisterRestaurant()}>
                                    {
                                        loaderStatus === true &&
                                        <i class="fa fa-spinner fa-spin"></i>
                                    }
                                    {i18next.t(`${buttonStatus}`)}
                                </Button>
                            </center>
                            <center>
                                <div>
                                    <small> Already have an account?
                                        <Link to="/"> Login </Link>
                                    </small>
                                </div>
                            </center>
                        </Form>

                    </Col>

                    {/* <Container md={6} sm={6} ld={6} xs={12} lg={6} className="pt-4 pb-6" fluid style={{ backgroundColor: "green" }} >
                            <Row> */}

                    {/* </Row>
                        </Container> */}

                </Row>
                {
                    flagPaymentModalShow === true &&
                    <PaymentModal
                        show={paymentModalShow}
                        onClose={() => this.onClose()}
                        state={this.state}
                    />
                }
                {
                    this.state.openAlert === true && 
                    <ConfirmationModal
                        show={this.state.openAlert}
                        onClose={() => this.onCloseAlert()}
                        msg="You are already registerd with this email!"
                        type="ok"
                    />
                }
                {/* </div> */}
                {/* <HomeFooter /> */}
            </>
        );
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(RestaurantRegistration);
