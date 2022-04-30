import React from "react";
// react plugin used to create google maps

import { Dropdown } from "semantic-ui-react";
import i18next from "i18next";

import ExportCsv from "../Owner/OwnerDriver/ExportCsv";

import { messaging } from "../../firebase";

import {
  Card,
  CardHeader,
  CardBody,
  Table,
  Container,
  Row,
  Col,
  Label,
  Button,
  FormGroup,
  Form,
  InputGroupAddon,
  InputGroupText,
  InputGroup,
  Badge,
} from "reactstrap";


import ReactDatetime from "react-datetime";

import { Popup } from 'semantic-ui-react'

// For Notification
import { errorToaster, successToaster, DarkToaster } from "../common/common-validation/common";

import "./order.css";

// For Redux Data
import { bindActionCreators } from "redux";
import { ActCreators } from "../../redux/bindActionCreator";
import { connect } from "react-redux";
import instance from "../../axios";
import requests from "../../requests";

import Moment from "moment";

import ActionOrder from "../Owner/Order/ActionOrder";
import DeliveryAction from "components/Owner/Order/DeliveryAction";

import ding from "../../assets/sounds/ding.mp3";

import ManulPagination from "../common/Pagination/Pagination";

let token = null;
let userData = {}
let get_fcm_registration_token = null;


const mapStateToProps = (state) => {
  token = state.token;
  userData = state.userData;
  get_fcm_registration_token = state.get_fcm_registration_token;
};
const mapDispatchToProps = (dispatch) => {
  return bindActionCreators(ActCreators, dispatch);
};

class Orders extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      clientData: [],
      ownerData: [],
      driversData: [],
      show: false,
      dateFrom: "",
      dateTo: "",
      restaurant: "",
      client: "",
      driver: "",
      datas: [],
      currentPage: 1,
      total: 10,
    };
  }
  handlePageNext = () => {
    const { currentPage } = this.state;
    this.setState({ currentPage: currentPage + 1 }, () => {
      this.applyFilter();
    });
  };

  handlePagePrev = () => {
    const { currentPage } = this.state;
    this.setState({ currentPage: currentPage - 1 }, () => {
      this.applyFilter();
    });
  };

  handlePageNum = (num) => {
    this.setState({ currentPage: num }, () => {
      this.applyFilter();
    });
  };
  handleDateFromChange = (newDate) => {
    this.setState({
      dateFrom: newDate,
    });
  };
  handleDateToChange = (newDate) => {
    this.setState({
      dateTo: newDate,
    });
  };
  handleChange = (e) => {
    this.setState({
      [e.target.name]: e.target.value,
    });
  };

  ShowHideFilters = (e) => {
    this.setState({
      show: !this.state.show,
    });
  };

  handleSelectChange = (e, data) => {
    this.setState({
      [data.name]: data.value,
    });
  };

  componentDidMount = async () => {
    this.applyFilter();
    if (get_fcm_registration_token === null) {
      return null;
    } else {
      messaging.onMessage(async (payload) => {
        // DarkToaster(payload.notification.body +" "+ payload.notification.title );
        this.applyFilter();
        const PlayDing = document.getElementsByClassName("audio-element")[0]
        PlayDing.play();
      });


    }
  };

  handleMovetoODetail = (O_id, index) => {
    this.props.ALL_ID({ O_id });
    const { history } = this.props;
    if (history) {
      history.push(`/orders/detail/${index}`);
    }
  };

  applyFilter = async () => {

    let API = null
    if (userData.userType === "admin") {
      API = requests.fetchOrdersForAdmin
    } else if (userData.userType === "owner") {
      API = requests.fetchOrdersForOwner
    } else if (userData.userType === "driver") {
      API = requests.fetchDriverOrder
    } else if (userData.userType === "client") {
      API = requests.fetchMyOrdersForClient
    } else if (userData.userType === "driver_aggregator") {
      API = requests.FetchGetAggregatorOrders
    }
    let filterData = {
      startDate: this.state.dateFrom,
      endDate: this.state.dateTo,
      client_id: this.state.client,
      driver_id: this.state.driver,
      owner_id: this.state.restaurant,
      items_in_page: 10,
      page_number: this.state.currentPage,
    };
    const response = await instance
      .post(API, filterData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .catch((error) => {
        let errorMessage = error.response.data.error.message;
        this.state.datas.length > 0 &&
          errorToaster(errorMessage)
      });
    if (response && response.data) {
      if (response.data.data.result.length > 0) {
        let ad = [];
        const CData =
          response.data.data.clients != null
            ? response.data.data.clients.map((Cd, i) => {
              const pf =
                Cd.hasOwnProperty("profile_image") === true
                  ? `${Cd.profile_image.image_url}`
                  : process.env.REACT_APP_DEFAULT_IMAGE;
              ad[i] = {
                value: Cd._id,
                key: Cd.name,
                text: Cd.name,
                image: { avatar: true, src: pf },
              };
            })
            : [{ value: "", label: "", key: "", text: "" }];

        let bd = [];
        const DData =
          response.data.data.drivers != null
            ? response.data.data.drivers.map((Dd, i) => {
              const dpf =
                Dd.hasOwnProperty("profile_image") === true
                  ? `${Dd.profile_image.image_url}`
                  : process.env.REACT_APP_DEFAULT_IMAGE;
              bd[i] = {
                value: Dd._id,
                key: Dd.name,
                text: Dd.name,
                image: { avatar: true, src: dpf },
              };
            })
            : [{ value: "", label: "", key: "", image: "" }];

        let cd = [];
        const OData =
          response.data.data.owners != null
            ? response.data.data.owners.map((Od, i) => {
              const Opf =
                Od.hasOwnProperty("restaurant_image") === true
                  ? `${Od.restaurant_image.image_url}`
                  : process.env.REACT_APP_DEFAULT_IMAGE;
              cd[i] = {
                value: Od._id,
                key: Od.restaurant_Name,
                text: Od.restaurant_Name,
                image: { avatar: true, src: Opf },
              }
            })
            : [{ value: "", label: "", key: "", image: "" }];

        this.setState({
          datas: response.data.data.result[0].docs,
          clientData: ad,
          driversData: bd,
          ownerData: cd,
          currentPage: response.data.data.result[0].pageInfo.page_number,
          total: response.data.data.result[0].pageInfo.count,
        })
      } else {
        let ad = [];
        const CData =
          response.data.data.clients != null
            ? response.data.data.clients.map((Cd, i) => {
              const pf =
                Cd.hasOwnProperty("profile_image") === true
                  ? `${Cd.profile_image.image_url}`
                  : process.env.REACT_APP_DEFAULT_IMAGE;
              ad[i] = {
                value: Cd._id,
                key: Cd.name,
                text: Cd.name,
                image: { avatar: true, src: pf },
              };
            })
            : [{ value: "", label: "", key: "", text: "" }];

        let bd = [];
        const DData =
          response.data.data.drivers != null
            ? response.data.data.drivers.map((Dd, i) => {
              const dpf =
                Dd.hasOwnProperty("profile_image") === true
                  ? `${Dd.profile_image.image_url}`
                  : process.env.REACT_APP_DEFAULT_IMAGE;
              bd[i] = {
                value: Dd._id,
                key: Dd.name,
                text: Dd.name,
                image: { avatar: true, src: dpf },
              };
            })
            : [{ value: "", label: "", key: "", image: "" }];

        let cd = [];

        const OData =
          response.data.data.owners != null
            ? response.data.data.owners.map((Od, i) => {
              const Opf =
                Od.hasOwnProperty("restaurant_image") === true
                  ? `${Od.restaurant_image.image_url}`
                  : process.env.REACT_APP_DEFAULT_IMAGE;
              cd[i] = {
                value: Od._id,
                key: Od.restaurant_Name,
                text: Od.restaurant_Name,
                image: { avatar: true, src: Opf },
              };
            })
            : [{ value: "", label: "", key: "", image: "" }];
        this.setState(
          {
            datas: response.data.data.result,
            clientData: ad,
            driversData: bd,
            ownerData: cd,
            currentPage: response.data.data.page,
            total: response.data.data.total,
          }
        );
      }
    }
  };

  handleActionMethod = async (owner_id, Amethod, driver_id) => {
    const data = {
      order_id: owner_id,
      last_status: Amethod,
      driver_id: driver_id,
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
      this.applyFilter();
    }
  };

  handleChangeCallDeliveryStatus = async (owner_id, Amethod, driver_id) => {
    const APIBody = {}
    if (Amethod === "Assigned to Driver") {
      APIBody = {
        "order_id": owner_id,
        "delivery_status": Amethod,
        "driver_id": driver_id,
        "employer_id": userData._id,
      }
    } else if (Amethod === "Picked Up") {
      APIBody = {
        "order_id": owner_id,
        "delivery_status": Amethod,
        "driver_id": driver_id,
        "employer_id": userData._id,
      }
    } else if (Amethod === "Delivered") {
      APIBody = {
        "order_id": owner_id,
        "delivery_status": Amethod,
        "driver_id": driver_id,
        "employer_id": userData._id,
      }
    } else if (Amethod === "Broadcast to Drivers") {
      APIBody = {
        "order_id": owner_id,
        "delivery_status": Amethod,
        "employer_id": userData._id,
      }
    }
    else if (Amethod === "Assigned to Aggregator") {
      APIBody = {
        "order_id": owner_id,
        "delivery_status": Amethod,
        "aggregator_id": userData.aggregator_id,
      }
    }
    else if (Amethod === "Picked Up Client") {
      APIBody = {
        "order_id": owner_id,
        "delivery_status": "Picked Up"
      }
    }

    const response = await instance
      .post(requests.fetchUpdateDeliverStatus, APIBody, {
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
      this.applyFilter();
    }
  }


  updateorderStatus = async (id, status) => {
    const data = {
      order_id: id,
      last_status: status,
    };
    const response = await instance
      .post(requests.fetchUpdateOrdersForDriver, data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .catch((error) => {
        let errorMessage = error.response.data.error.message;
        errorToaster(errorMessage);
      });
    if (response && response.data) {
      this.applyFilter();
    }
  };

  render() {
    const { total, currentPage } = this.state;
    
    return (
      <>
        {/* header */}
        <Container className="pt-7" fluid>
          <Row>
            <Col className="col">
              <Card className=" shadow">
                <CardHeader className="bg-transparent">
                  <div className="d-flex justify-content-between">
                    <div>
                      <h1 className=" mb-0">{i18next.t("Orders")}</h1>
                    </div>
                    <div>
                      <div className="col-4 text-right">
                        <button
                          id="show-hide-filters"
                          className="btn btn-icon btn-1 btn-sm btn-outline-secondary"
                          type="button"
                          onClick={this.ShowHideFilters}
                        >
                          {this.state.show ? (
                            <span className="btn-inner--icon">
                              <i
                                id="button-filters"
                                className="ni ni-bold-up"
                              ></i>
                            </span>
                          ) : (
                            <span className="btn-inner--icon">
                              <i
                                id="button-filters"
                                className="ni ni-bold-down"
                              ></i>
                            </span>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                {this.state.show && (
                  <CardBody id="filter">
                    <Form >
                      <Row>
                        <Col md={6} lg={4} xl={4} xs={12} sm={12}>
                          <FormGroup>
                            <Label for="DateFrom"> {i18next.t("Filter by Date From")} </Label>
                            <InputGroup className="input-group-alternative">
                              <InputGroupAddon addonType="prepend">
                                <InputGroupText>
                                  <i className="ni ni-calendar-grid-58" />
                                </InputGroupText>
                              </InputGroupAddon>
                              <ReactDatetime
                                onChange={this.handleDateFromChange}
                                value={this.state.dateFrom}
                                inputProps={{
                                  placeholder: i18next.t("Date From")
                                }}
                                utc={true}
                              />
                            </InputGroup>
                          </FormGroup>
                        </Col>
                        <Col md={6} lg={4} xl={4} xs={12} sm={12}>
                          <FormGroup>
                            <Label for="DateTo">{i18next.t("to")}</Label>
                            <InputGroup className="input-group-alternative">
                              <InputGroupAddon addonType="prepend">
                                <InputGroupText>
                                  <i className="ni ni-calendar-grid-58" />
                                </InputGroupText>
                              </InputGroupAddon>
                              <ReactDatetime
                                utc={true}
                                onChange={this.handleDateToChange}
                                value={this.state.dateTo}
                                inputProps={{
                                  placeholder: i18next.t("Date To"),
                                }}
                              />
                            </InputGroup>
                          </FormGroup>
                        </Col>
                        {
                          userData.userType !== "owner" &&
                          <Col md={6} lg={4} xl={4} xs={12} sm={12}>
                            <FormGroup>
                              <Label for="Restaurant">{i18next.t("Filter by Restaurant")}</Label>
                              <Dropdown
                                placeholder={i18next.t("Select Restaurant")}
                                fluid
                                search
                                selection
                                clearable
                                name="restaurant"
                                options={this.state.ownerData}
                                onChange={this.handleSelectChange}
                              // name="client"
                              />
                            </FormGroup>
                          </Col>
                        }
                        {
                          userData.userType !== "client" &&
                          <Col md={6} lg={4} xl={4} xs={12} sm={12}>
                            <FormGroup>
                              <Label for="client">{i18next.t("Filter by Client")}</Label>
                              <Dropdown
                                placeholder={i18next.t("Select Client")}
                                fluid
                                search
                                selection
                                clearable
                                name="client"
                                options={this.state.clientData}
                                onChange={this.handleSelectChange}
                              // name="client"
                              />
                            </FormGroup>
                          </Col>
                        }
                        {
                          userData.userType !== "driver" &&
                          <Col md={6} lg={4} xl={4} xs={12} sm={12}>
                            <FormGroup>
                              <Label for="exampleSelect">{i18next.t("Filter by Driver")}</Label>
                              <Dropdown
                                placeholder={i18next.t("Select Driver")}
                                fluid
                                search
                                selection
                                clearable
                                name="driver"
                                options={this.state.driversData}
                                onChange={this.handleSelectChange}
                              // name="client"
                              />
                            </FormGroup>
                          </Col>
                        }
                      </Row>

                      <Row className="d-flex justify-content-between">
                        <Col md={3} lg={3} sm={6}></Col>
                        <Col md={3} lg={3} sm={6}></Col>
                        <Col md={3} lg={3} sm={6}></Col>
                        <Col md={3} lg={3} sm={6}>
                          <div className="text-right">
                            <Button
                              className="mt-4 btn-md btn-block"
                              color="primary"
                              type="button"
                              size="lg"
                              onClick={this.applyFilter}
                            >
                              {i18next.t("Filter")}
                            </Button>
                          </div>
                        </Col>
                      </Row>
                    </Form>
                  </CardBody>
                )}
              </Card>
            </Col>
          </Row>
          <Row>
            <div className="col">
              <Card className="shadow">
                <CardHeader className="border-0">
                  <div className="d-flex justify-content-between">
                    <div>
                      <h3 className="mb-0">{i18next.t("Order Tables")}</h3>
                    </div>
                    <div
                      className="col-4 text-right"
                      style={{ marginBottom: "auto", marginTop: "auto" }}
                    >
                      <Col className=" text-right" style={{ float: "right" }}>
                        <ExportCsv
                          csvData={this.state.datas}
                          fileName={"orderList"}
                        />
                      </Col>
                    </div>
                  </div>
                </CardHeader>
                <Table className="align-items-center table-flush" responsive>
                  <thead className="thead-light">
                    <tr className="text-center">

                      <th scope="col">ID</th>
                      {
                        userData.userType !== "owner" &&
                        <>
                          <th scope="col">LOGO</th>
                          <th scope="col">RESTUARANT</th>
                        </>
                      }
                      <th scope="col">PRICE</th>
                      {
                        (userData.userType === "owner") &&
                        <th scope="col">ACTION</th>
                      }
                      {
                        ((userData.userType === "driver_aggregator") || (userData.userType === "driver") || (userData.userType === "owner")) &&
                        <th scope="col">DELIVERY ACTION</th>
                      }

                      <th scope="col">METHOD</th>
                      <th scope="col">TIME SLOT</th>

                    </tr>
                  </thead>
                  <tbody>
                    {this.state.datas.length > 0 ? (
                      this.state.datas.map((item, index) => (
                        <tr>
                          <td>
                            <Popup trigger={<Badge
                              style={{ cursor: "pointer" }}
                              color="success"
                              href=""
                              position='right center'
                              onClick={() => {
                                this.handleMovetoODetail(item._id, index);
                              }}
                            >
                              {item.o_id}
                            </Badge>} flowing hoverable>
                              <Table>
                                <tr>
                                  <td >
                                    <i className="fa-lg fas fa-utensils text-green "></i>
                                    <b className="ml-3"> LAST STATUS:</b>
                                  </td>
                                  <td>
                                    {item.last_status}
                                  </td>
                                </tr>
                                <tr>
                                  <td>
                                    <i class="fas fa-user fa-lg text-orange"></i>
                                    <b className="ml-3">CLIENT NAME:</b>
                                  </td>
                                  <td className="ml-3">
                                    {
                                      userData.userType !== "client" &&
                                      item.client_name.name
                                    }
                                  </td>
                                </tr>
                                <tr>
                                  <td >
                                    <i class="fas fa-home fa-lg text-info"></i>
                                    <b className="ml-3">DELIVERY ADDRESS:</b>
                                  </td>
                                  <td >
                                    {item.delivery_address}
                                  </td>
                                </tr>
                                <tr>
                                  <td>
                                    <i class="fas fa-shipping-fast fa-lg text-red"></i>
                                    <b className="ml-3">DRIVER NAME:</b>
                                  </td>
                                  <td >
                                    {
                                      userData.userType !== "driver" &&
                                      item.driver_id && (
                                        item.hasOwnProperty("driver_name") ? item.driver_name.name : ""
                                      )
                                    }
                                  </td>
                                </tr>
                                <tr>
                                  <td>
                                    <i class="fas fa-history fa-lg text-blue"></i>
                                    <b className="ml-3">CREATED:</b>
                                  </td>
                                  <td >
                                    {Moment(item.createdAt).format("DD-MMM-YYYY hh:mm")}
                                  </td>
                                </tr>
                                <tr>
                                  <td style={{ cursor: "pointer" }}
                                    onClick={() => {
                                      this.handleMovetoODetail(item._id, index);
                                    }} >
                                    <b> More </b> <i className="ml-3 fas fa-angle-double-right fa-lg text-green"></i>
                                  </td>
                                </tr>

                              </Table>
                            </Popup>
                            {/* <Badge
                              style={{ cursor: "pointer" }}
                              color="success"
                              href=""
                              onClick={() => {
                                this.handleMovetoODetail(item._id, index);
                              }}
                            >
                              {item.o_id}
                            </Badge> */}

                          </td>
                          {
                            userData.userType !== "owner" &&
                            <>
                              <td>
                                <div className="avatar-group">
                                  <a
                                    className="avatar avatar-sm"
                                    href="#pablo"
                                    id="tooltip742438047"
                                    onClick={(e) => e.preventDefault()}
                                  >
                                    <img
                                      alt="..."
                                      className="avatar avatar-sm"
                                      src={
                                      item.hasOwnProperty("restaurant_Name") && 
                                        item.restaurant_Name.hasOwnProperty("restaurant_image") 
                                          ? item.restaurant_Name.restaurant_image.image_url 
                                          : process.env.REACT_APP_DEFAULT_IMAGE
                                        }
                                    //{item.restaurant_Name.hasOwnProperty("restaurant_image") ? item.restaurant_Name.restaurant_image.image_url :
                                    //src={require("assets/img/theme/team-1-800x800.jpg")}
                                    /> 
                                  </a>
                                </div>
                              </td>
                              <td>
                                {item.hasOwnProperty("restaurant_Name") ? item.restaurant_Name.restaurant_Name : <strike>Restaurant Deleted</strike>}
                              </td>
                            </>
                          }
                          <td>{item.total}</td>
                          {
                            (userData.userType === "owner") &&
                            <td>
                              <ActionOrder
                                last_status={item.last_status}
                                delivery_status={item.delivery_status}
                                delivery_type={item.delivery_type}
                                owner_id={item._id}
                                onActionMethod={this.handleActionMethod}
                                handleChangeCallDeliveryStatus={this.handleChangeCallDeliveryStatus}
                              />
                            </td>
                          }
                          {
                            (userData.userType !== "admin") &&
                              item.delivery_type === "Deliver" ?
                              <td>
                                <DeliveryAction
                                  last_status={item.last_status}
                                  delivery_status={item.delivery_status}
                                  delivery_type={item.delivery_type}
                                  owner_id={item._id}
                                  onActionMethod={this.handleActionMethod}
                                  handleChangeCallDeliveryStatus={this.handleChangeCallDeliveryStatus}
                                />
                              </td>
                              :
                              (userData.userType !== "admin") && <td></td>
                          }
                          {item.delivery_type === "Deliver" ? (
                            <td class="table-web">
                              <span class="badge badge-success badge-pill">
                                {i18next.t("Delivery")}
                              </span>
                            </td>
                          ) : item.delivery_type === "Pickup" ? (
                            <td class="table-web">
                              <span class="badge badge-success badge-pill">
                                {i18next.t("Pickup")}
                              </span>
                            </td>)
                            :
                            <td class="table-web">
                              <span class="badge badge-primary badge-pill">
                                {i18next.t("Dine")}
                              </span>
                            </td>
                          }

                          <td>{item.time_slot}</td>

                          {/* {
                            userData.userType==="driver" &&
                              <>
                              <ActionOrder
                                last_status={item.last_status}
                                delivery_type={item.delivery_type}
                                owner_id={item._id}
                                onActionMethod={this.handleActionMethod}
                                handleAssignedToAggregator = {this.handleAssignedToAggregator}
                              />
                               <td>
                                   {item.last_status === "Assigned to Driver" ? (
                                      <Button
                                      color="primary"
                                      size="sm"
                                      type="button"
                                      onClick={() => {
                                          this.updateorderStatus(item._id, "Delivered");
                                      }}
                                      >
                                      {i18next.t("Delivered")}
                                      </Button>
                                  ) : (
                                      <>{i18next.t("No actions for you right now!")}</>
                                  )}
                              </td>
                              </>
                          } */}

                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td> {i18next.t("Data Not Found ..!")} </td>
                      </tr>
                    )}
                  </tbody>
                </Table>

                <ManulPagination
                  total={this.state.total}
                  currentPage={this.state.currentPage}
                  handlePageNum={this.handlePageNum}
                  handlePagePrev={this.handlePagePrev}
                  handlePageNext={this.handlePageNext}
                />
              </Card>
            </div>
          </Row>
        </Container>

        <audio className="audio-element">
          <source src={ding} type="audio/mpeg" />
        </audio>

      </>
    );
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(Orders);
