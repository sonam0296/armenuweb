import React, { Component } from "react";
import axios from "axios";
//reactstrap
import {
  Button,
  Modal,
  FormGroup,
  Input,
  Card,
  CardBody,
  Label,
} from "reactstrap";

// For Notification
import {errorToaster, successToaster} from "../../common/common-validation/common";


import i18next from "i18next"

//Phone Number Input
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/bootstrap.css";

// For Redux Data
import { bindActionCreators } from "redux";
import { ActCreators } from "../../../redux/bindActionCreator";
import { connect } from "react-redux";
import instance from "../../../axios";
import requests from "../../../requests";

let token = null;
let userData = {};
let StoreAggregatorId = null;


const mapStateToProps = (state) => {
  token = state.token;
  userData = state.userData;
  StoreAggregatorId = state.StoreAggregatorId;

};
const mapDispatchToProps = (dispatch) => {
  return bindActionCreators(ActCreators, dispatch);
};

export class AddNewDriver extends Component {
  constructor(props) {
    super(props);
    this.state = {
      name: "",
      email: "",
      phone: "",
      dial_code: null,
      country_name: "",
      country_code: "",

      currencies: {},
      languages: [],
    };
  }

  oncloseModal = () => {
    this.props.onClose();
    this.setState({
      name: "",
      email: "",
      phone: "",
      status:"",
      EId:"",
      Did:""
    });
  };

  handleChangeForPhone = (value, data, event, formattedValue) => {
    this.setState(
      {
        phone: formattedValue,
        dial_code: data.dialCode,
        country_name: data.name,
        country_code: data.countryCode,
      },
      () => {
        axios
          .get(
            `https://restcountries.eu/rest/v2/callingcode/${this.state.dial_code}?fields=name;callingCodes;languages;currencies`
          )
          .then((response) => {
            this.setState(
              {
                currencies: response.data[0].currencies[0],
                languages: response.data[0].languages,
              }
            );
          })
          .catch((error) => {
            console.log(error);
          });
      }
    );
  };

  handleChange = (e) => {
    this.setState(
      {
        [e.target.name]: e.target.value,
      }
    );
  };

  AddNewDriverOwner = async () => {
    let API = null;
    const data = {};
    if (userData.userType === "owner") {
      API = requests.fetchAddDriverFromOwner;
      data = {
        name: this.state.name,
        phone: this.state.phone,
        email: this.state.email,
        dial_code: this.state.dial_code,
        country_name: this.state.country_name,
        country_code: this.state.country_code,
        user_languages: this.state.languages,
        currencies: {
          code: this.state.currencies.code,
          curr_name: this.state.currencies.name,
          symbol: this.state.currencies.symbol,
        },
        isRestaurantDrivers: true,
        isAggregatorDrivers: false
      };
    }else if(userData.userType === "driver_aggregator") {
      API = requests.fetchAddDriverForAggregator
      data = {
        name: this.state.name,
        phone: this.state.phone,
        email: this.state.email,
        dial_code: this.state.dial_code,
        country_name: this.state.country_name,
        country_code: this.state.country_code,
        user_languages: this.state.languages,
        currencies: {
          code: this.state.currencies.code,
          curr_name: this.state.currencies.name,
          symbol: this.state.currencies.symbol,
        },
        isRestaurantDrivers: false,
        isAggregatorDrivers: true
        
      };
    }else if(userData.userType === "admin"){
      API = requests.fetchAddDriverFromAdmin;
      data = {
        name: this.state.name,
        phone: this.state.phone,
        email: this.state.email,
        isAggregatorDrivers: true,
        employer_id: StoreAggregatorId.id,
        dial_code: this.state.dial_code,
        country_name: this.state.country_name,
        country_code: this.state.country_code,
        user_languages: this.state.languages,
        currencies: {
          code: this.state.currencies.code,
          curr_name: this.state.currencies.name,
          symbol: this.state.currencies.symbol,
        },
        isRestaurantDrivers: false,
        isAggregatorDrivers: true
      };
    }
               
    // const data = {
    //   name: this.state.name,
    //   phone: this.state.phone,
    //   email: this.state.email,
    //   dial_code: this.state.dial_code,
    //   country_name: this.state.country_name,
    //   country_code: this.state.country_code,
    //   user_languages: this.state.languages,
    //   currencies: {
    //     code: this.state.currencies.code,
    //     curr_name: this.state.currencies.name,
    //     symbol: this.state.currencies.symbol,
    //   },
    // };
    const response = await instance
      .post( API, data, {
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
      this.props.getDriverOwner();
      this.setState(
        {
          name: "",
          email: "",
          phone: "",
        },
        () => {
          this.props.onClose();
        }
      );
    }
  };

  componentDidMount = async () => {
    // console.log("Props =====> ",this.props);
    // this.setState({
    //   status:this.props.Status
    // }, () => {
    //   this.state.status==="add" ?
    //     this.setState({
    //       name: "",
    //       email: "",
    //       phone: "",
    //       status:"",
    //     })
    //   :
    //     this.setState({
    //       name: this.props.EditName,
    //       email: this.props.Editemail,
    //       phone: this.props.Editphone,
    //       EId: this.props.EId,
    //       Did: this.props.Did
    //     })
    // })
  }
  render() {
    return (
      <>
        <Modal className="modal-dialog-centered" isOpen={this.props.show}>
          <div className="modal-header">
            <h5 className="modal-title" id="exampleModalLabel">
              {i18next.t("Add New Driver")}
            </h5>
            <button
              aria-label="Close"
              className="close"
              data-dismiss="modal"
              type="button"
              onClick={this.oncloseModal}
            >
              <span aria-hidden={true}>×</span>
            </button>
          </div>
          <div className="modal-body p-0">
            <Card className="bg-secondary shadow border-0">
              <CardBody className="p-lg-5">
                <FormGroup className="pb-3">
                  <Label for="Name">{i18next.t("Name")}</Label>
                  <Input
                    className="px-2 py-4"
                    type="text"
                    placeholder={i18next.t("Driver Name")}
                    name="name"
                    onChange={this.handleChange}
                  />
                </FormGroup>

                <FormGroup className="pb-3">
                  <Label for="email">{i18next.t("Email")}</Label>
                  <Input
                    className="px-2 py-4"
                    type="email"
                    placeholder={i18next.t("Add Email Id")}
                    name="email"
                    onChange={this.handleChange}
                  />
                </FormGroup>

                <FormGroup className="pb-3">
                  <Label for="phone">{i18next.t("Phone Number")}</Label>
                  <PhoneInput
                    inputProps={{
                      name: "phone",
                      required: true,
                      autoFocus: false,
                    }}
                    inputStyle={{ width: "100%" }}
                    placeholder={i18next.t("Enter Phone no")}
                    country={"in"}
                    value={this.state.phone}
                    autoFormat={false}
                    onChange={(value, data, event, formattedValue) =>
                      this.handleChangeForPhone(
                        value,
                        data,
                        event,
                        formattedValue
                      )
                    }
                  />
                </FormGroup>

                <div className="text-center my-">
                  <Button
                    className="my-3 p-3"
                    color="primary"
                    type="button"
                    onClick={this.AddNewDriverOwner}
                  >
                    {i18next.t('save')}
                  </Button>
                </div>
              </CardBody>
            </Card>
          </div>
        </Modal>
      </>
    );
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(AddNewDriver);
