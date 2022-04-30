
import React from "react";
// reactstrap components

import axios from "axios";
import i18next from "i18next";
  import {
    Card,
    CardHeader,
    CardBody,
    Container,
    Row,
    Col,
    Button,
    FormGroup,
    Form,
    Input,
  } from "reactstrap";

import instance from "../../../../axios";
import requests from "../../../../requests";
import PhoneInput from 'react-phone-input-2'
import 'react-phone-input-2/lib/bootstrap.css'
//Navbar
import Navbar from "../../../Navbars/AdminNavbar";
import {errorToaster, successToaster} from "../../../common/common-validation/common";

// reactstrap components
// core components
import AdminFooter from "../../../Footers/AdminFooter.js";
import Sidebar from "../../../Sidebar/Sidebar.js";
import { bindActionCreators } from "redux";
import { ActCreators } from "../../../../redux/bindActionCreator";
import { connect } from "react-redux";
import routes from "../../../../routes.js";

import "../../../OrderFile/Details.css"
let token = null;
let flag = true;
const mapStateToProps = (state) => {
  token = state.token;
};
const mapDispatchToProps = (dispatch) => {
  return bindActionCreators(ActCreators, dispatch);
};
class OwnerRegistration extends React.Component {
  constructor(props) {
    super(props)
  
    this.state = {
      restaurentName: '',
            ownerName: '',
            ownerEmail: '',
            
            passoword: '',
            confirmPassword: '',

            ownerPhone: '',
            dial_code:null,
            country_name:'',
            country_code:'',

            currencies:{},
            languages:[],

    }
  }
  handleChange (e) {
    this.setState({
        [e.target.name]: e.target.value
    })
  };
  redirectToList = () =>{
    const {history} = this.props;
    if (history) history.push('/Restaurants')
  }

  handleChangeForPhone = (value, data, event, formattedValue) => {
    this.setState ({
      ownerPhone: formattedValue,
      dial_code: data.dialCode,
      country_name: data.name,
      country_code: data.countryCode
    })
  }

  onRegisterResturant = async () => {
    axios.get('https://restcountries.eu/rest/v2/callingcode/'+this.state.dial_code+'?fields=name;callingCodes;languages;currencies')
        .then(response => {
        this.setState({
            currencies: response.data[0].currencies[0],
            languages:response.data[0].languages
        },async () => {
                let currencies = {
                code:this.state.currencies.code.toLowerCase(),
                curr_name:this.state.currencies.name,
                symbol:this.state.currencies.symbol
              }
            let registerResturatData = {
                "restaurant_Name":this.state.restaurentName,
                "name": this.state.ownerName,
                "email": this.state.ownerEmail,
                "phone": this.state.ownerPhone,
                "userType": "owner",
                "country_name": this.state.country_name,
                "country_code": this.state.country_code,
                "currencies":currencies,
                "user_languages":this.state.languages,
                "dial_code":this.state.dial_code,
                "profile_image": "",
                "is_outlet": false
            };
            const response = await instance
            .post(requests.addOwnerViaAdmin, registerResturatData,{
              headers: {
                Authorization: `Bearer ${token}`,
              },
            })
            .catch((error) => {
                let errorMessage = error.response.data.error.message;
                errorToaster(errorMessage);
            });
            if (response && response.data) {
                const {history} = this.props;
                if (history) {
                    successToaster("Registration Successful..!");
                    setTimeout(() => {
                        history.push('/restaurants')
                    }, 2000)
                }
            }
        })
        })
        .catch(error => {
            console.log(error);
        })

    
}
  
  render() {
    const { restaurentName,
      ownerName,
      ownerEmail,
      ownerPhone,
      passoword,
      confirmPassword}= this.state;
    return (
      <>
       
       <Sidebar
          {...this.props}
          routes={routes}
          logo={{
            innerLink: "/dashboard",
            imgSrc: require("assets/img/brand/argon-react.png"),
            imgAlt: "..."
          }}
        />
        <div className="main-content" ref="mainContent">
          <Navbar />
        <Container className="pt-7" fluid>
          <Row>
            <Col className="col">
              <Card className="bg-secondary shadow">
              <CardHeader className="border-0">
                <div className="d-flex justify-content-between">
                    <div className="md-7">
                      <h1 className="mb-0">{i18next.t("Restaurant Management")}</h1>  
                    </div>
                    <div className="md-5">
                        <Row>
                            <Col>
                                <Button color="primary" size="sm" type="button"
                                  onClick= {this.redirectToList}>
                                    {i18next.t("Back to List")}
                                </Button>
                            </Col>
                        </Row>
                    </div>     
                  </div>
                </CardHeader>
                <CardBody>
                <Form>
                                            <h6 className="heading-small text-muted mb-4">
                                                {i18next.t("RESTAURANT INFORMATION")}
                                            </h6>
                                            <div className="pl-lg-4">
                                                <Row>
                                                    <Col md="12">
                                                        <FormGroup>
                                                            <label
                                                                className="form-control-label"
                                                                htmlFor="input-address"
                                                            >
                                                                {i18next.t("Restaurant Name")}
                                                            </label>
                                                            <Input
                                                                className="form-control-alternative"
                                                                placeholder={i18next.t("Restaurant Name")}
                                                                type="text" name="restaurentName"
                                                                value={this.state.restaurentName}
                                                                onChange={(e) => this.handleChange(e)}
                                                            />
                                                        </FormGroup>
                                                    </Col>
                                                </Row>

                                            </div>
                                            <hr className="my-4"/>
                                            {/* Address */}
                                            <h6 className="heading-small text-muted mb-4">
                                                {i18next.t("CONTACT INFORMATION")}
                                            </h6>
                                            <div className="pl-lg-4">
                                                <Row>
                                                    <Col md="12">
                                                        <FormGroup>
                                                            <label
                                                                className="form-control-label"
                                                                htmlFor="input-address"
                                                            >
                                                                {i18next.t("Owner Name")}
                                                            </label>
                                                            <Input
                                                                className="form-control-alternative"
                                                                placeholder={i18next.t("Owner Name")}
                                                                type="text" name="ownerName"
                                                                value={this.state.ownerName}
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
                                                                {i18next.t("Owner Email")}
                                                            </label>
                                                            <Input
                                                                className="form-control-alternative"
                                                                placeholder={i18next.t("Owner Email")}
                                                                type="email" name="ownerEmail"
                                                                value={this.state.ownerEmail}
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
                                                                {i18next.t("Owner Phone")}
                                                            </label>
                                                            <PhoneInput
                                                                inputProps={{
                                                                    name: 'Phno',
                                                                    required: true,
                                                                    autoFocus: true
                                                                }}
                                                                inputStyle={{ width: "100%" }}
                                                                placeholder={i18next.t("Enter Phone no")}
                                                                country={'in'}
                                                                value={this.state.ownerPhone}
                                                                autoFormat={false}
                                                                onChange={ (value, data, event, formattedValue) => this.handleChangeForPhone(value, data, event, formattedValue) }
                                                            />
                                                        </FormGroup>
                                                    </Col>
                                                </Row>
                                            </div>
                                            <center>
                                                <Button
                                                    className="my-4"
                                                    color="success"
                                                    disabled = { (!restaurentName || !ownerName || !ownerEmail || !ownerPhone ) ? true : false }
                                                    type="button" onClick={() => this.onRegisterResturant()}>
                                                    {i18next.t("save")}
                                                </Button>
                                                {/* disabled={
                                                        (!restaurentName || !ownerName || 
                                                        !ownerEmail || !ownerPhone || !passoword ||
                                                        !confirmPassword) ? true : false} */}
                                            </center>
                                        </Form>
                </CardBody>
              </Card>
            </Col>
          </Row>  
        </Container>
            
        <Container fluid>
            <AdminFooter />
        </Container>
        </div>
      </>
    );
  }
}
export default connect(mapStateToProps, mapDispatchToProps)(OwnerRegistration);
