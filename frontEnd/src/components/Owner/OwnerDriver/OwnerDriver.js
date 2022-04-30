import React, { Component } from "react";
import axios from "axios";
import AddNewDriver from "./AddNewDriver";

//Loder
import Loader from "../../common/Loader";

import ExportCsv from "./ExportCsv";

//Phone Number Input
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/bootstrap.css";

// reactstrap components
import {
  Container,
  Row,
  Col,
  Card,
  CardHeader,
  Button,
  Table,
  CardBody,
  Modal,
  FormGroup,
  Input,
  Label,
} from "reactstrap";

// For Notification
import {errorToaster, successToaster} from "../../common/common-validation/common";
import i18next from "i18next";

// For Redux Data
import { bindActionCreators } from "redux";
import { ActCreators } from "../../../redux/bindActionCreator";
import { connect } from "react-redux";
import instance from "../../../axios";
import requests from "../../../requests";

let userData = {};
let token = null;
let StoreAggregatorId = {};
let pageLinks = [];
let numberOfPages = 0;

const mapStateToProps = (state) => {
  token = state.token;
  userData = state.userData;
  StoreAggregatorId = state.StoreAggregatorId;
};
const mapDispatchToProps = (dispatch) => {
  return bindActionCreators(ActCreators, dispatch);
};

export class OwnerOrder extends Component {
  constructor(props) {
    super(props);
    this.state = {
      flagDriverShow: false,
      driverShow: false,
      LoaderShow: true,
      EditDriverShow: false,
      EditName: null,
      Editemail: null,
      Editphone: null,
      dial_code: null,
      country_name: "",
      country_code: "",

      currencies: {},
      languages: [],

      Status:"",
      EId:"",
      Did:""
    };
  }
  handleChangeForPhone = (value, data, event, formattedValue) => {
    this.setState(
      {
        Editphone: formattedValue,
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

  getDriverOwner = async () => { 
    let APIBody = {
      "employer_id": StoreAggregatorId.hasOwnProperty("id") ? StoreAggregatorId.id : null
    }
    const response = userData.userType === "owner" ? 
      await instance.get( requests.fetchGetDriverOwner, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .catch((error) => {
        this.setState({ LoaderShow: false });
        let errorMessage = error.message;
        console.log(errorMessage);
        errorToaster(errorMessage);
      })
    :
      await instance.post(requests.fetchDriverListForAggregator, APIBody,{
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .catch((error) => {
        this.setState({ LoaderShow: false });
        let errorMessage = error.message;
        console.log(errorMessage);
        errorToaster(errorMessage);
      })
    if (response && response.data) {
      this.setState({ driver: response.data.data }, () => {
        this.setState({ LoaderShow: false });
      });
    }
  };

  handleEditDriverModal = (driver) => {
    this.setState(
      {
        Status:"edit",
        EditName: driver.name,
        Editemail: driver.email,
        Editphone: driver.phone,
        EId: driver.employer_id,
        Did: driver._id,
        dial_code: driver.dial_code,
        country_name: driver.country_name,
        country_code: driver.country_code,
        currencies: driver.currencies,
        languages: driver.languages,
      },
      () => {
        this.setState({
          //flagDriverShow: true, 
          //driverShow: true 
          EditDriverShow:true
        });
      }
    );
  };

  handleCloseEditDriverModal = () => {
    this.setState({ EditDriverShow: false }, () => {
      this.setState({
        EditName: null,
        Editemail: null,
        Editphone: null,
        EId: null,
        Did: null,
      });
    });
  };

  handleChange = (e) => {
    this.setState(
      {
        [e.target.name]: e.target.value,
      }
    );
  };

  handleAddDriverModal = () => {
    this.setState({
      Status:"add",
      flagDriverShow: true, 
      driverShow: true 
    });
  };

  handleCloseAddDriverModal = () => {
    this.setState({ driverShow: false });
  };

  handleEditDriver = async () => {
    let isRestaurantDrivers = userData.userType==="owner" ? true : false
    let isAggregatorDrivers = userData.userType==="owner" ? false : true
    let API = null;
    let employer_id = null;

    if(userData.userType==="owner"){
      API = requests.fetchEditDriverFromOwner
      employer_id = this.state.EId
    }else if(userData.userType === "driver_aggregator"){
      API = requests.fetchUpdateDriverForAggregator
      employer_id = this.state.EId
    }else if(userData.userType === "admin"){
      API = requests.fetchUpdateDriverFromAdmin
      employer_id = StoreAggregatorId.id
    }
              
    
    let data = {
      isRestaurantDrivers: isRestaurantDrivers,
      isAggregatorDrivers: isAggregatorDrivers,
      employer_id: employer_id,
      user_id: this.state.Did,
      name: this.state.EditName,
      email: this.state.Editemail,
      phone: this.state.Editphone,
      dial_code: this.state.dial_code,
      country_name: this.state.country_name,
      country_code: this.state.country_code,
      user_languages: this.state.languages,
      currencies: {
        code: this.state.currencies.code,
        curr_name: this.state.currencies.name,
        symbol: this.state.currencies.symbol,
      },
    };
    const response = await instance
      .patch(API, data, {
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
      this.getDriverOwner();
      this.handleCloseEditDriverModal();
    }
  };

  handleDeleteOwnerDriver = async (id) => {
    let API = null;
    if(userData.userType === "owner") {
      API = requests.fetchDeleteDriverFromOwner
    }else if (userData.userType === "driver_aggregator") {
      API = requests.fetchDeleteDriverFromAggregator
    }else if (userData.userType === "admin"){
      API = requests.fetchDeleteDriverFromAdmin
    }
    
    const response = await instance
      .delete(`${API}${id}`, {
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
      this.getDriverOwner();
    }
  };

  componentDidMount = () => {
    this.getDriverOwner();
  };

  render() {
    const { driver, 
      Status,
      EditName,
      Editemail,
      Editphone,
      EId,
      Did} = this.state;

    return (
      <>
        {/* <Header /> */}
        <Container className="pt-7" fluid>
          <Loader open={this.state.LoaderShow} />
          <Row>
            <Col className="col">
              <Card className=" shadow">
                <CardHeader className="bg-transparent">
                  <div className="d-flex justify-content-between">
                    <div>
                      <h1 className=" mb-0">{i18next.t("Drivers")}</h1>
                    </div>

                    <div
                      className="col-4 text-right"
                      style={{ marginBottom: "auto", marginTop: "auto"}}
                    >
                      <Row className=" text-right" style={{float: "right"}}>
                        
                          <ExportCsv csvData={driver} fileName={"driver"} />
                        
                          <Button
                            className="mt-2 ml-2"
                            size="sm"
                            color="primary"
                            type="button"
                            onClick={this.handleAddDriverModal}
                          >
                            {i18next.t("Add Driver")}
                          </Button>
                       
                      </Row>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </Col>
          </Row>
          {
            this.state.flagDriverShow === true &&
              <AddNewDriver
                show={this.state.driverShow}
                onClose={this.handleCloseAddDriverModal}
                getDriverOwner={this.getDriverOwner}
                // Status={Status}
                // EditName= {EditName}
                // Editemail= {Editemail}
                // Editphone= {Editphone}
                // EId= {EId}
                // Did= {Did}
              />
          }
         

          <Modal
            className="modal-dialog-centered"
            isOpen={this.state.EditDriverShow}
          >
            <div className="modal-header">
              <h5 className="modal-title" id="exampleModalLabel">
                {i18next.t("Edit Driver")}
              </h5>
              <button
                aria-label="Close"
                className="close"
                data-dismiss="modal"
                type="button"
                onClick={this.handleCloseEditDriverModal}
              >
                <span aria-hidden={true}>×</span>
              </button>
            </div>
            <div className="modal-body p-0">
              <Card className="bg-secondary shadow border-0">
                <CardBody className="p-lg-5">
                  <FormGroup className="pb-3">
                    <Label for="EditName">{i18next.t("Name")}</Label>
                    <Input
                      className="px-2 py-4"
                      type="text"
                      placeholder={i18next.t("Driver Name")}
                      name="EditName"
                      value={this.state.EditName}
                      onChange={this.handleChange}
                    />
                  </FormGroup>

                  <FormGroup className="pb-3">
                    <Label for="Editemail">{i18next.t("Email")}</Label>
                    <Input
                      className="px-2 py-4"
                      type="email"
                      placeholder={i18next.t("Add Email Id")}
                      name="Editemail"
                      value={this.state.Editemail}
                      onChange={this.handleChange}
                    />
                  </FormGroup>

                  <FormGroup className="pb-3">
                    <Label for="Editphone">{i18next.t("Phone Number")}</Label>
                    <PhoneInput
                      inputProps={{
                        name: "Editphone",
                        required: true,
                        autoFocus: true,
                      }}
                      inputStyle={{ width: "100%" }}
                      placeholder={i18next.t("Enter Phone no")}
                      country={"in"}
                      value={this.state.Editphone}
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
                      onClick={this.handleEditDriver}
                    >
                      {i18next.t("update")}
                    </Button>
                  </div>
                </CardBody>
              </Card>
            </div>
          </Modal>
          
          
          <Row>
            <div className="col">
              <Card>
                <Table className="align-items-center table-flush" responsive>
                  <thead className="thead-light">
                    <tr>
                      <th scope="col">NAME</th>
                      <th scope="col">EMAIL</th>
                      <th scope="col">PHONE NUMBER</th>
                      <th scope="col">ACTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {this.state.LoaderShow === false && driver.length > 0 ? (
                      <>
                        {driver.map((driver, index) => {
                          return (
                            <>
                              <tr>
                                <td>{driver.name}</td>
                                <td>{driver.email}</td>
                                <td>{driver.phone}</td>
                                <td>
                                  <Row>
                                    <Col>
                                      <Button
                                        color="primary"
                                        type="button"
                                        size="sm"
                                        onClick={() => {
                                          this.handleEditDriverModal(driver);
                                        }}
                                      >
                                        {i18next.t("Edit")}
                                      </Button>
                                      <Button
                                        color="danger"
                                        type="button"
                                        size="sm"
                                        onClick={() => {
                                          if(window.confirm('Are you sure you want to delete this record?')){
                                            this.handleDeleteOwnerDriver(driver._id);
                                          }
                                        }}
                                      >
                                        {i18next.t("Delete")}
                                      </Button>
                                    </Col>
                                  </Row>
                                </td>
                              </tr>
                            </>
                          );
                        })}
                      </>
                    ) : (
                      <tr>
                        <td> Data Not Found ..! </td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </Card>
            </div>
          </Row>
        </Container>
      </>
    );
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(OwnerOrder);
