import React, { Component } from "react";

// reactstrap components
import {
  Button,
  Card,
  CardHeader,
  CardBody,
  Form,
  Container,
  Row,
  Col,
  Table,
} from "reactstrap";

import i18next from "i18next";

// core components
import Sidebar from "../../components/Sidebar/Sidebar";
import adminRoutes from "../../routes";
import ownerRoutes from "../../ownerRoutes";
import clientsRoutes from "../../clientRouts";
import driverRoutes from "../../driverRouts";
import driverAggregatorRoute from "../../driverAggregatorRoute";

import Navbar from "../../components/Navbars/AdminNavbar";

import Moment from "react-moment";
import "../../components/OrderFile/Details.css";
import { bindActionCreators } from "redux";
import { ActCreators } from "../../redux/bindActionCreator";
import { connect } from "react-redux";
import instance from "../../axios";
import requests from "../../requests";
import Loader from "../common/Loader";
// For Notification
import { errorToaster, successToaster } from "../common/common-validation/common";
import ActionOrder from "../Owner/Order/ActionOrder";
import DeliveryAction from "../Owner/Order/DeliveryAction";
import AdminFooter from "../Footers/AdminFooter";


let token = null;
let All_id = null;
let userData = {};

const mapStateToProps = (state) => {
  token = state.token;
  All_id = state.All_id;
  userData = state.userData;
};
const mapDispatchToProps = (dispatch) => {
  return bindActionCreators(ActCreators, dispatch);
};

export class OrderDetailClient extends Component {
  constructor(props) {
    super(props);
    this.state = {
      LoaderShow: true,
      detailsPage: true,
      prepareShow: true,
    };
  }

  getOrderdetail = async () => {
    const data = { order_id: All_id.O_id };
    const response = await instance
      .post(requests.fetchOrderDetail, data, {
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
      this.setState({ data: response.data.data }, () => {
        this.setState({ LoaderShow: false });
      });
    }
  };

  componentDidMount = () => {
    if (this.state.LoaderShow === true) {
      this.getOrderdetail();
    }
  };
  componentDidUpdate(e) {
    document.documentElement.scrollTop = 0;
    document.scrollingElement.scrollTop = 0;
    this.refs.mainContent.scrollTop = 0;
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
      const { history } = this.props;
      if (history) {
        history.push(`/orders`);
      }
    }
  };

  handleActionMethod = async (owner_id, Amethod, time, driver_id) => {
    if (Amethod === "Accepted by Restaurant") {
      const data = {
        order_id: owner_id,
        last_status: Amethod,
        driver_id: driver_id,
        prepare_time: time,
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
        const { history } = this.props;
        if (history) {
          history.push("/orders");
        }
      }
    } else {
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
        const { history } = this.props;
        if (history) {
          history.push("/orders");
        }
      }
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
      const { history } = this.props;
      if (history) {
        history.push("/orders");
      }
    }
  }

  handleBackToPage = () => {
    const { history } = this.props;
    if (history) {
      history.push("/orders");
    }
  };

  render() {
    const { data, LoaderShow } = this.state;
    let routes = adminRoutes;
    if (userData.userType === 'admin') {
      routes = adminRoutes
    } else if (userData.userType === 'owner') {
      routes = ownerRoutes;
    } else if (userData.userType === 'driver') {
      routes = driverRoutes;
    } else if (userData.userType === 'driver_aggregator') {
      routes = driverAggregatorRoute
    } else {
      routes = clientsRoutes;
    }
    return (
      <>
        <Sidebar
          {...this.props}
          routes={routes}
          logo={{
            innerLink: "/dashboard",
            imgSrc: require("assets/img/brand/argon-react.png"),
            imgAlt: "...",
          }}
        />
        <div className="main-content" ref="mainContent">
          <Navbar />

          <Container className="pt-7" fluid>
            <Row>
              <Loader open={this.state.LoaderShow} />
              <Col md={12} sm={12} xl={7} className="card-left">
                <Card className="bg-secondary shadow">
                  <CardHeader className="bg-white border-0">
                    <Row className="align-items-center">
                      <Col xs={8}>
                        <h3 className="mb-0">
                          {LoaderShow === false && data[0].o_id} -{" "}
                          <Moment format="Do MMM YYYY, hh:mm">
                            {LoaderShow === false && data[0].createdAt}
                          </Moment>{" "}
                        </h3>
                      </Col>
                      <Col className="text-right" xs={4}>
                        <Button
                          color="primary"
                          onClick={this.props.history.goBack}
                          size="sm"
                        >
                          {i18next.t("Back")}
                        </Button>
                      </Col>
                    </Row>
                  </CardHeader>
                  <CardBody>
                    <Form>
                      <h6 className="heading-small text-muted mb-4">
                        {i18next.t("RESTAURANT INFORMATION")}
                      </h6>
                      <div className="pl-lg-4">
                        <Row>
                          {LoaderShow === false ? (
                            <Col lg="9">
                              <h4>
                                {data[0].owner_id.restaurant_Name} <br />
                                {data[0].owner_id.address[0].user_address}{" "}
                                <br />
                                {data[0].owner_id.phone}
                                <br />
                                {data[0].owner_id.restaurant_Name}
                                <br />
                                {data[0].owner_id.email}{" "}
                              </h4>
                              <br />
                            </Col>
                          ) : (
                            ""
                          )}
                        </Row>
                      </div>
                      <hr className="my-4" />
                      {/* Order */}
                      <h6 className="heading-small text-muted mb-4">
                        {i18next.t("CLIENT INFORMATION")}
                      </h6>
                      <div className="pl-lg-4">
                        <Row>
                          {LoaderShow === false ? (
                            <>
                              <h4>
                                <Col md="12">{data[0].client_id.name}</Col>
                                <Col md="12">{data[0].client_id.email}</Col>
                                <Col md="12">{data[0].delivery_address}</Col>
                              </h4>
                            </>
                          ) : (
                            ""
                          )}
                        </Row>
                      </div>
                      <hr className="my-4" />
                      {/* Order */}
                      <h6 className="heading-small text-muted mb-4">{i18next.t("ORDER")}</h6>
                      <div className="pl-lg-4">
                        <Container fluid>
                          {LoaderShow === false
                            ? data[0].items.map((item, index) => {
                              return (
                                <>
                                  <ul>
                                    <li>
                                      <h3>
                                        {item.menu_item_qty} X{" "}
                                        {item.menu_item_id.item_name} - {data[0].owner_id.currencies.symbol}
                                        {item.menu_item_id.item_price} = (
                                          {item.menu_item_qty *
                                          item.menu_item_id.item_price}{" "}
                                          ) -- {i18next.t("VAT")}{" "}
                                        {item.menu_item_id.vat_percentage}%:{" "}
                                        {item.menu_item_id.vat_value}
                                      </h3>
                                    </li>
                                  </ul>

                                  {item.variant_id.length === 0 ? (
                                    <></>
                                  ) : (
                                    <>
                                      <Table
                                        className="align-items-center my-4"
                                        responsive
                                      >
                                        <thead className="thead-light">
                                          <tr>
                                            <th scope="col">{i18next.t("Variant")}</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {item.variant_id.map(
                                            (variant, index) => {
                                              return (
                                                <>
                                                  <tr>
                                                    <td>
                                                      {variant.variant_name}
                                                    </td>
                                                  </tr>
                                                </>
                                              );
                                            }
                                          )}
                                        </tbody>
                                      </Table>
                                    </>
                                  )}

                                  {item.extras_id.length === 0 ? (
                                    <>
                                      <hr className="my-4" />
                                    </>
                                  ) : (
                                    <>
                                      <div className="mb-6">
                                        <h3>{i18next.t("Extras")}</h3>
                                        <ul
                                          style={{
                                            marginLeft: "3rem",
                                            listStyleType: "circle",
                                          }}
                                        >
                                          {item.extras_id.map(
                                            (extra, index) => {
                                              return (
                                                <li>
                                                  {extra.extras_name} + {data[0].owner_id.currencies.symbol}
                                                  {extra.price}
                                                </li>
                                              );
                                            }
                                          )}
                                        </ul>
                                      </div>
                                      <hr className="my-4" />
                                    </>
                                  )}
                                </>
                              );
                            })
                            : ""}
                        </Container>
                        {LoaderShow === false ? (
                          <h4>
                            {i18next.t("Comment")}: {data[0].comment}
                            <br /> {i18next.t("NET")}: {`${data[0].owner_id.currencies.symbol} ${data[0].net_value}`}
                            <br /> {i18next.t("VAT")}: {`${data[0].owner_id.currencies.symbol} ${data[0].total_vat}`}
                            <br /> {i18next.t("Sub Total")}: {`${data[0].owner_id.currencies.symbol} ${data[0].sub_total}`}
                            {/* <br /> Delivery: {data[0].delivery_charge} */}
                          </h4>
                        ) : (
                          <p>
                            {i18next.t("Comment")}:
                            <br /> {i18next.t("NET")}:
                            <br /> {i18next.t("VAT")}:
                            <br /> {i18next.t("Sub Total")}:
                            {/* <br /> Delivery: */}
                          </p>
                        )}
                      </div>
                      <hr className="my-4" />
                      {LoaderShow === false ? (
                        <h3>{i18next.t("TOTAL")}: {`${data[0].owner_id.currencies.symbol} ${data[0].total}`}</h3>
                      ) : (
                        <h3>{i18next.t("TOTAL")}:</h3>
                      )}

                      <hr className="my-4" />
                      {LoaderShow === false ? (
                        <>
                          <div className="pl-lg-4">
                            <p>
                              <h4>
                                {i18next.t("Payment Method")}:{" "}
                                {data[0].is_cod === false ? "Online" : "COD"}
                                <br />
                                {i18next.t("Payment Status")}:{" "}
                                {data[0].ispaid === false ? "UnPaid" : "Paid"}
                              </h4>
                            </p>
                          </div>
                          <hr className="my-4" />
                          <div className="pl-lg-4">
                            <p>
                              <h4>
                                {i18next.t("Order Type")}:{" "}
                                {data[0].delivery_type === "Delivery"
                                  ? i18next.t("Delivery")
                                  :
                                  data[0].delivery_type === "Pickup"
                                    ? i18next.t("PickedUp")
                                    : i18next.t("Dine")
                                }
                                <br />
                                {i18next.t("Time Slot")}: {data[0].time_slot}
                              </h4>
                            </p>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="pl-lg-4">
                            <p>
                              <h4>
                                {i18next.t("Payment Method")}: <br />
                                {i18next.t("Payment Status")}:
                              </h4>
                            </p>
                          </div>
                          <hr className="my-4" />
                          <div className="pl-lg-4">
                            <p>
                              <h4>
                                {i18next.t("Delivery Method")}: <br />
                                {i18next.t("Time Slot")}: 10:30 - 11:00
                              </h4>
                            </p>
                          </div>
                        </>
                      )}
                      {
                        userData.userType === "driver" &&
                        <>
                          <hr className="my-4" />
                          <h6 className="heading-small text-muted mb-4">ACTION</h6>
                          <div className="pl-lg-4">
                            {LoaderShow === false ? (
                              <>
                                <ActionOrder
                                  last_status={data[0].last_status}
                                  delivery_type={data[0].delivery_type}
                                  owner_id={All_id.O_id}
                                  onActionMethod={this.handleActionMethod}
                                  detailsPage={this.state.detailsPage}
                                  prepareShow={this.state.prepareShow}
                                  prepareClose={this.prepareClose}
                                  handleChangeCallDeliveryStatus={this.handleChangeCallDeliveryStatus}
                                />
                              </>
                            ) : (
                              ""
                            )}
                          </div>
                        </>

                      }
                      {
                        userData.userType === "owner" &&
                        <>
                          <hr className="my-4" />
                          <h6 className="heading-small text-muted mb-4">ACTION</h6>
                          <div className="pl-lg-4">
                            {LoaderShow === false ? (
                              <>
                                <ActionOrder
                                  last_status={data[0].last_status}
                                  delivery_type={data[0].delivery_type}
                                  owner_id={All_id.O_id}
                                  onActionMethod={this.handleActionMethod}
                                  detailsPage={this.state.detailsPage}
                                  prepareShow={this.state.prepareShow}
                                  prepareClose={this.prepareClose}
                                  handleChangeCallDeliveryStatus={this.handleChangeCallDeliveryStatus}
                                />
                              </>
                            ) : (
                              ""
                            )}
                          </div>
                        </>
                      }
                      {
                        userData.userType === "owner" &&
                        <>
                          <hr className="my-4" />
                          <h6 className="heading-small text-muted mb-4">DELIVERY ACTION</h6>
                          <div className="pl-lg-4">
                            {LoaderShow === false ? (
                              <>
                                {
                                  data[0].delivery_type === "Deliver" ?
                                    <DeliveryAction
                                      last_status={data[0].last_status}
                                      delivery_status={data[0].delivery_status}
                                      delivery_type={data[0].delivery_type}
                                      owner_id={data[0]._id}
                                      onActionMethod={this.handleActionMethod}
                                      handleChangeCallDeliveryStatus={this.handleChangeCallDeliveryStatus}
                                    />
                                    :
                                    <p>No Delivery Action</p>
                                }
                              </>
                            ) : (
                              ""
                            )}
                          </div>
                        </>
                      }
                    </Form>
                  </CardBody>
                </Card>
              </Col>

              <Col className="card-right" md="12 " xl={5}>
                {/* <Card className="card-profile shadow">
                  <CardHeader className="bg-white border-0">
                    <Row className="align-items-center">
                      <Col xs="8">
                        <h2 className="mb-0">Order Tracking</h2>
                      </Col>
                    </Row>
                  </CardHeader>
                  <hr className="my-1" />
                  <CardBody className="pt-0 pt-md-4"></CardBody>
                </Card>
                <br /> */}

                <Card className="card-profile shadow">
                  <CardHeader className="bg-white border-0">
                    <Row className="align-items-center">
                      <Col xs="8">
                        <h2 className="mb-0">{i18next.t("Status History")}</h2>
                      </Col>
                    </Row>
                  </CardHeader>
                  <hr className="my-1" />

                  <CardBody className="pt-0 pt-md-4">
                    <div className="card-body">
                      <div>
                        <h3>Restaurant Status History</h3>
                        <div
                          className="mt-4 timeline timeline-one-side"
                          id="status-history"
                          data-timeline-content="axis"
                          data-timeline-axis-style="dashed"
                        >

                          {LoaderShow === false ? (
                            <>
                              {data[0].status_history.map((status, index) => {
                                return (
                                  <>
                                    <div className="timeline-block">
                                      <span className="timeline-step badge-success">
                                        <i className="ni ni-bell-55"></i>
                                      </span>
                                      <div className="timeline-content">
                                        <div className="d-flex justify-content-between pt-1">
                                          <div>
                                            <span className="text-muted text-sm font-weight-bold">
                                              {status.status_message}
                                            </span>
                                          </div>
                                          <div className="text-right">
                                            <small className="text-muted">
                                              <i className="fas fa-clock mr-1"></i>
                                              <Moment format="Do MMM YYYY, hh:mm">
                                                {status.updated_time}
                                              </Moment>
                                            </small>
                                          </div>
                                        </div>
                                        <h6 className="text-sm mt-1 mb-0">
                                          {i18next.t("Status from")}: {status.status_from.name}
                                        </h6>
                                      </div>
                                    </div>
                                  </>
                                );
                              })}
                            </>
                          ) : (
                            ""
                          )}
                        </div>

                      </div>
                      <hr />
                      <div>
                        <h3>Dilivery Status History</h3>
                        <div
                          className="mt-4 timeline timeline-one-side"
                          id="status-history"
                          data-timeline-content="axis"
                          data-timeline-axis-style="dashed"
                        >
                          {LoaderShow === false ? (
                            <>
                              {
                                data[0].hasOwnProperty("delivery_history") ?
                                data[0].delivery_history.map((status, index) => {
                                  return (
                                    <>
                                      <div className="timeline-block">
                                        <span className="timeline-step badge-success">
                                          <i className="ni ni-bell-55"></i>
                                        </span>
                                        <div className="timeline-content">
                                          <div className="d-flex justify-content-between pt-1">
                                            <div>
                                              <span className="text-muted text-sm font-weight-bold">
                                                {status.status_message}
                                              </span>
                                            </div>
                                            <div className="text-right">
                                              <small className="text-muted">
                                                <i className="fas fa-clock mr-1"></i>
                                                <Moment format="Do MMM YYYY, hh:mm">
                                                  {status.updated_time}
                                                </Moment>
                                              </small>
                                            </div>
                                          </div>
                                          <h6 className="text-sm mt-1 mb-0">
                                            {i18next.t("Status from")}: {status.status_from.name}
                                          </h6>
                                        </div>
                                      </div>
                                    </>
                                  );
                                })
                                :
                                <p>No delivery status right-now!</p>
                              }
                            </>
                          ) : (
                            ""
                          )}
                        </div>

                      </div>

                    </div>
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

export default connect(mapStateToProps, mapDispatchToProps)(OrderDetailClient);
