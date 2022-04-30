import React from "react";
// reactstrap components
import {
  Card,
  CardHeader,
  CardBody,
  Container,
  Row,
  Col,
  Button,
  NavItem,
  Nav,
  NavLink,
  TabContent,
  TabPane,
  Badge,
} from "reactstrap";


import i18next from "i18next";

import { messaging } from "../../firebase";

// For Notification
import { errorToaster, successToaster } from "../common/common-validation/common";
// For Redux Data
import { bindActionCreators } from "redux";
import { ActCreators } from "../../redux/bindActionCreator";
import { connect } from "react-redux";
import instance from "../../axios";
import requests from "../../requests";
import classnames from "classnames";
import Moment from "react-moment";

let token = null;
let get_fcm_registration_token = null;
let userData = {};

const mapStateToProps = (state) => {
  token = state.token;
  userData = state.userData;
  get_fcm_registration_token = state.get_fcm_registration_token;
};
const mapDispatchToProps = (dispatch) => {
  return bindActionCreators(ActCreators, dispatch);
};

class ShowOrder extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      NewOrder: [],
      AcceptedByDriver: [],
      AssignToAggregator: [],
      AcceptedOrder: [],
      PreparedOrder: [],
      PickedUpOrder: [],
      RejectedbyRestaurant: [],
      Delivered: [],
      Pending: [],
      BroadcasttoDrivers: [],
      AssignToDriver: [],
      tabs: 1,
      maintabs: 1
    };
  }

  handleMovetoODetail = (O_id, index) => {
    this.props.ALL_ID({ O_id });
    const { history } = this.props.props;
    if (history) {
      history.push(`/orders/detail/${index}`);
    }
  };

  getLiveOrders = async () => {
    let API = null
    if (userData.userType === "admin") {
      API = requests.fetchLiveOrdersForAdmin
    } else if (userData.userType === "owner") {
      API = requests.fetchLiveOrdersForOwner
    } else if (userData.userType === "driver_aggregator") {
      API = requests.FetchLiveOrdersForAggregator
    }
    const response = await instance
      .get(API, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .catch((error) => {
        let errorMessage = error.response.data.error.message;
        errorToaster(errorMessage);
      });
    if (response && response.data) {
      console.log("Response ==== >", response.data.data);
      response.data.data.map((data, i) => {
        if (data._id === "Just Created") {
          this.setState({
            NewOrder: data.orders,
          });
        } else if (data._id === "Accepted by Restaurant") {
          this.setState({
            AcceptedOrder: data.orders,
          });
        } else if (data._id === "Prepared") {
          this.setState({
            PreparedOrder: data.orders,
          });
        } else if (data._id === "Picked Up") {
          this.setState({
            PickedUpOrder: data.orders,
          });
        } else if (data._id === "Delivered") {
          this.setState({
            Delivered: data.orders,
          });
        } else if (data._id === "Rejected by Restaurant") {
          this.setState({
            RejectedbyRestaurant: data.orders,
          });
        } else if (data._id === "Accepted by Driver") {
          if (userData.userType === "driver_aggregator") {
            this.setState({
              AcceptedOrder: data.orders,
            });
          }
        } else if (data._id === "Assigned to Aggregator") {
          if (userData.userType === "driver_aggregator") {
            this.setState({
              NewOrder: data.orders,
            });
          } else {
            this.setState({
              AssignToAggregator: data.orders,
            });
          }
        } else if (data._id === "Pending") {
          this.setState({
            Pending: data.orders,
          });
        } else if (data._id === "Broadcast to Drivers") {
          this.setState({
            BroadcasttoDrivers: data.orders,
          });
        } else if (data._id === "Assigned to Driver") {
          this.setState({
            AssignToDriver: data.orders,
          });
        }
      });
    }
  };

  componentDidMount = () => {
    this.getLiveOrders();
    //if(userData.userType === "owner" || userData.userType === "driver_aggregator")
    if (userData.userType === "owner" || userData.userType === "driver_aggregator") {
      if (get_fcm_registration_token === null) {
        return null;
      } else {
        messaging.onMessage(async (payload) => {
          console.log("payload :", payload);
          this.getLiveOrders();
        });
      }
    }
  };


  handleRefreshPage = () => {
    this.getLiveOrders();
  }

  redirectToDetails = (e) => {
    const { history } = this.props;
    if (history) history.push("/order");
  };
  toggleNavs = (e, state, index) => {
    e.preventDefault();
    this.setState({
      [state]: index,
    });
  };

  render() {
    let {
      NewOrder,
      AcceptedOrder,
      PreparedOrder,
      PickedUpOrder,
      Pending,
      AssignToAggregator,
      BroadcasttoDrivers,
      AssignToDriver

    } = this.state;
    console.log("State === > ", this.state);
    return (
      <>
        {/* <Header /> */}
        <Container fluid>
          <Row>
            <Nav
              // className="nav-fill flex-column flex-md-row tabbable sticky "
              className="nav-fill flex-column flex-md-row"
              id="tabs-icons-text"
              pills
              role="tablist"

            >
              {
                this.props.ActiveTab === 1 ?
                  <NavItem className="ml-5">
                    <NavLink sm={4} md={4} xl={4} xs={12}
                      aria-selected={this.state.tabs === 1}
                      className={classnames({
                        active: this.state.tabs === 1,
                      })}
                      onClick={(e) => this.toggleNavs(e, "tabs", 1)}
                      href="#pablo"
                      role="tab"
                    >
                      {/* <i className="ni ni-ui-04 mr-2"></i> */}
                      {i18next.t("New Orders")}
                    </NavLink>
                  </NavItem>
                  :
                  <>
                    <Nav
                      className="nav-fill mr-4"
                      id="tabs-icons-text"
                      role="tablist"
                    >
                      <NavItem className="ml-5" sm={4} md={4} xl={4} xs={12}>
                        <NavLink
                          aria-selected={this.state.tabs === 1}
                          className={classnames("mb-sm-3 mb-md-0 ", {
                            active: this.state.tabs === 1
                          })}
                          onClick={e => this.toggleNavs(e, "tabs", 1)}
                          href="#pablo"
                          role="tab"
                        >
                          {/* <i className="ni ni-cloud-upload-96 mr-2" /> */}
                          Accepted
                        </NavLink>
                      </NavItem>
                      <NavItem className="ml-3" sm={4} md={4} xl={4} xs={12}>
                        <NavLink
                          aria-selected={this.state.tabs === 2}
                          className={classnames({
                            active: this.state.tabs === 2
                          })}
                          onClick={e => this.toggleNavs(e, "tabs", 2)}
                          href="#pablo"
                          role="tab"
                        >
                          {/* <i className="ni ni-bell-55 mr-2" /> */}
                          Prepared
                        </NavLink>
                      </NavItem>
                      <NavItem className="ml-3" sm={4} md={4} xl={4} xs={12}>
                        <NavLink
                          aria-selected={this.state.tabs === 3}
                          className={classnames({
                            active: this.state.tabs === 3
                          })}
                          onClick={e => this.toggleNavs(e, "tabs", 3)}
                          href="#pablo"
                          role="tab"
                        >
                          {/* <i className="ni ni-calendar-grid-58 mr-2" /> */}
                            Picked Up
                        </NavLink>
                      </NavItem>
                      {
                        (userData.userType === "owner" && userData.use_driver_aggregator === true) &&
                        <NavItem className="ml-3" sm={4} md={4} xl={4} xs={12}>
                          <NavLink
                            aria-selected={this.state.tabs === 4}
                            className={classnames({
                              active: this.state.tabs === 4
                            })}
                            onClick={e => this.toggleNavs(e, "tabs", 4)}
                            href="#pablo"
                            role="tab"
                          >
                            {/* <i className="ni ni-bell-55 mr-2" /> */}
                          Assign To Aggregator
                        </NavLink>
                        </NavItem>
                      }
                      {
                        (userData.userType === "owner" && userData.use_driver_aggregator !== true) &&
                        <>
                          <NavItem className="ml-3" sm={4} md={4} xl={4} xs={12}>
                            <NavLink
                              aria-selected={this.state.tabs === 5}
                              className={classnames({
                                active: this.state.tabs === 5
                              })}
                              onClick={e => this.toggleNavs(e, "tabs", 5)}
                              href="#pablo"
                              role="tab"
                            >
                              {/* <i className="ni ni-bell-55 mr-2" /> */}
                              Broadcast To Drivers
                            </NavLink>
                          </NavItem>

                          <NavItem className="ml-3" sm={4} md={4} xl={4} xs={12}>
                            <NavLink
                              aria-selected={this.state.tabs === 6}
                              className={classnames({
                                active: this.state.tabs === 6
                              })}
                              onClick={e => this.toggleNavs(e, "tabs", 6)}
                              href="#pablo"
                              role="tab"
                            >
                              {/* <i className="ni ni-bell-55 mr-2" /> */}
                              Assign To Drivers
                            </NavLink>
                          </NavItem>

                        </>
                      }
                    </Nav>
                  </>
              }
            </Nav>
          </Row>
        </Container>

        <Container className="pt-7" fluid>
          <TabContent activeTab={this.state.tabs} sm={12} md={12} xl={12} xs={12}>

            <TabPane tabId={1}>
              <Container className="mt--5" fluid>
                <Row>
                  {
                    this.props.ActiveTab === 1 ?
                      <Col className="order-xl-2 mb-5 mb-xl-0" xl="12">
                        <Card className="card-profile shadow">
                          <CardHeader className="text-left ">
                            <h2 className="h3 mb-0">{i18next.t("New Orders")}</h2>
                          </CardHeader>
                          <CardBody className="pt-0 pt-md-4">
                            <div>
                              {NewOrder.map((item, index) => (
                                <div>
                                  <div>
                                    <small>{item.last_status}</small>
                                  </div>
                                  <div>
                                    <small>
                                      <Moment format="Do MMM YYYY, hh:mm">
                                        {item.createdAt}
                                      </Moment>
                                    </small>
                                  </div>
                                  <div
                                    style={{
                                      "justify-content": "space-between",
                                      display: "flex",
                                    }}
                                  >
                                    <Badge color="success">
                                      {item.o_id}
                                    </Badge>
                                    <button
                                      className="btn btn-sm btn-primary"
                                      onClick={() => {
                                        this.handleMovetoODetail(
                                          item.order_id,
                                          index
                                        );
                                      }}
                                    >
                                      {i18next.t("Details")}
                                    </button>
                                  </div>
                                  <div>
                                    Restaurant: {item.owner_name.name}
                                  </div>
                                  <div>
                                    <small>Client: {item.client_name.name}</small>
                                  </div>
                                  <div>
                                    <small>{item.total}</small>
                                  </div>
                                  <hr />
                                </div>
                              ))}
                            </div>
                          </CardBody>
                        </Card>
                      </Col>
                      :
                      <Col className="order-xl-2 mb-5 mb-xl-0" xl="12">
                        <Card className="card-profile shadow">
                          <CardHeader className="text-left ">
                            <h2 className="h3 mb-0">{i18next.t("Accepted")}</h2>
                          </CardHeader>
                          <CardBody className="pt-0 pt-md-4">
                            <div>
                              {AcceptedOrder.map((item, index) => (
                                <div>
                                  <div>
                                    <small>{item.last_status}</small>
                                  </div>
                                  <div>
                                    <small>
                                      <Moment format="Do MMM YYYY, hh:mm">
                                        {item.createdAt}
                                      </Moment>
                                    </small>
                                  </div>
                                  <div
                                    style={{
                                      "justify-content": "space-between",
                                      display: "flex",
                                    }}
                                  >
                                    <Badge color="success">
                                      {item.o_id}
                                    </Badge>
                                    <button
                                      onClick={() => {
                                        this.handleMovetoODetail(
                                          item.order_id,
                                          index
                                        );
                                      }}
                                      className="btn btn-sm btn-primary"
                                    >
                                      {i18next.t("Details")}
                                    </button>
                                  </div>
                                  <div>
                                    Restaurant: {item.owner_name.name}
                                  </div>
                                  <div>
                                    <small>Client: {item.client_name.name}</small>
                                  </div>
                                  <div>
                                    <small>{item.total}</small>
                                  </div>
                                  <hr />
                                </div>
                              ))}
                            </div>
                          </CardBody>
                        </Card>
                      </Col>
                  }
                </Row>
              </Container>
            </TabPane>
            {
              this.props.ActiveTab === 2 &&
              <>
                <TabPane tabId={2}>
                  <Container className="mt--5" fluid>
                    <Row>
                      <Col className="order-xl-2 mb-5 mb-xl-0" xl="12">
                        <Card className="card-profile shadow">
                          <CardHeader className="text-left ">
                            <h2 className="h3 mb-0">{i18next.t("Prepared")}</h2>
                          </CardHeader>
                          <CardBody className="pt-0 pt-md-4">
                            <div>
                              {PreparedOrder.map((item, index) => (
                                <div>
                                  <div>
                                    <small>{item.last_status}</small>
                                  </div>
                                  <div>
                                    <small>
                                      <Moment format="Do MMM YYYY, hh:mm">
                                        {item.createdAt}
                                      </Moment>
                                    </small>
                                  </div>
                                  <div
                                    style={{
                                      "justify-content": "space-between",
                                      display: "flex",
                                    }}
                                  >
                                    <Badge color="success">
                                      {item.o_id}
                                    </Badge>
                                    <button
                                      onClick={() => {
                                        this.handleMovetoODetail(
                                          item.order_id,
                                          index
                                        );
                                      }}
                                      className="btn btn-sm btn-primary"
                                    >
                                      {i18next.t("Details")}
                                    </button>
                                  </div>
                                  <div>
                                    Restaurant: {item.owner_name.name}
                                  </div>
                                  <div>
                                    <small>Client: {item.client_name.name}</small>
                                  </div>
                                  <div>
                                    <small>{item.total}</small>
                                  </div>
                                  <hr />
                                </div>
                              ))}
                            </div>
                          </CardBody>
                        </Card>
                      </Col>
                    </Row>
                  </Container>
                </TabPane>

                <TabPane tabId={3}>
                  <Container className="mt--5" fluid>
                    <Row>
                      <Col className="order-xl-2 mb-5 mb-xl-0" xl="12">
                        <Card className="card-profile shadow">
                          <CardHeader className="text-left ">
                            <h2 className="h3 mb-0">{i18next.t("Picked Up")}</h2>
                          </CardHeader>
                          <CardBody className="pt-0 pt-md-4">
                            <div>
                              {PickedUpOrder.map((item, index) => (
                                <div>
                                  <div>
                                    <small>{item.last_status}</small>
                                  </div>
                                  <div>
                                    <small>
                                      <Moment format="Do MMM YYYY, hh:mm">
                                        {item.createdAt}
                                      </Moment>
                                    </small>
                                  </div>
                                  <div
                                    style={{
                                      "justify-content": "space-between",
                                      display: "flex",
                                    }}
                                  >
                                    <Badge color="success">
                                      {item.o_id}
                                    </Badge>
                                    <button
                                      onClick={() => {
                                        this.handleMovetoODetail(
                                          item.order_id,
                                          index
                                        );
                                      }}
                                      className="btn btn-sm btn-primary"
                                    >
                                      {i18next.t("Details")}
                                    </button>
                                  </div>
                                  <div>
                                    Restaurant: {item.owner_name.name}
                                  </div>
                                  <div>
                                    <small>Client: {item.client_name.name}</small>
                                  </div>
                                  <div>
                                    <small>{item.total}</small>
                                  </div>
                                  <hr />
                                </div>
                              ))}
                            </div>
                          </CardBody>
                        </Card>
                      </Col>
                    </Row>
                  </Container>
                </TabPane>

                {
                  (userData.userType === "owner" && userData.use_driver_aggregator === true) &&
                  <TabPane tabId={4}>
                    <Container className="mt--5" fluid>
                      <Row>
                        <Col className="order-xl-2 mb-5 mb-xl-0" xl="12">
                          <Card className="card-profile shadow">
                            <CardHeader className="text-left ">
                              <h2 className="h3 mb-0">{i18next.t("Assign To Aggregator")}</h2>
                            </CardHeader>
                            <CardBody className="pt-0 pt-md-4">
                              <div>
                                {AssignToAggregator.map((item, index) => (
                                  <div>
                                    <div>
                                      <small>{item.last_status}</small>
                                    </div>
                                    <div>
                                      <small>
                                        <Moment format="Do MMM YYYY, hh:mm">
                                          {item.createdAt}
                                        </Moment>
                                      </small>
                                    </div>
                                    <div
                                      style={{
                                        "justify-content": "space-between",
                                        display: "flex",
                                      }}
                                    >
                                      <Badge color="success">
                                        {item.o_id}
                                      </Badge>
                                      <button
                                        onClick={() => {
                                          this.handleMovetoODetail(
                                            item.order_id,
                                            index
                                          );
                                        }}
                                        className="btn btn-sm btn-primary"
                                      >
                                        {i18next.t("Details")}
                                      </button>
                                    </div>
                                    <div>
                                      Restaurant: {item.owner_name.name}
                                    </div>
                                    <div>
                                      <small>Client: {item.client_name.name}</small>
                                    </div>
                                    <div>
                                      <small>{item.total}</small>
                                    </div>
                                    <hr />
                                  </div>
                                ))}
                              </div>
                            </CardBody>
                          </Card>
                        </Col>
                      </Row>
                    </Container>
                  </TabPane>
                }
                {
                  (userData.userType === "owner" && userData.use_driver_aggregator !== true) &&
                  <>
                    <TabPane tabId={5}>
                      <Container className="mt--5" fluid>
                        <Row>
                          <Col className="order-xl-2 mb-5 mb-xl-0" xl="12">
                            <Card className="card-profile shadow">
                              <CardHeader className="text-left ">
                                <h2 className="h3 mb-0">{i18next.t("Broadcast To Drivers")}</h2>
                              </CardHeader>
                              <CardBody className="pt-0 pt-md-4">
                                <div>
                                  {BroadcasttoDrivers.map((item, index) => (
                                    <div>
                                      <div>
                                        <small>{item.last_status}</small>
                                      </div>
                                      <div>
                                        <small>
                                          <Moment format="Do MMM YYYY, hh:mm">
                                            {item.createdAt}
                                          </Moment>
                                        </small>
                                      </div>
                                      <div
                                        style={{
                                          "justify-content": "space-between",
                                          display: "flex",
                                        }}
                                      >
                                        <Badge color="success">
                                          {item.o_id}
                                        </Badge>
                                        <button
                                          onClick={() => {
                                            this.handleMovetoODetail(
                                              item.order_id,
                                              index
                                            );
                                          }}
                                          className="btn btn-sm btn-primary"
                                        >
                                          {i18next.t("Details")}
                                        </button>
                                      </div>
                                      <div>
                                        Restaurant: {item.owner_name.name}
                                      </div>
                                      <div>
                                        <small>Client: {item.client_name.name}</small>
                                      </div>
                                      <div>
                                        <small>{item.total}</small>
                                      </div>
                                      <hr />
                                    </div>
                                  ))}
                                </div>
                              </CardBody>
                            </Card>
                          </Col>
                        </Row>
                      </Container>
                    </TabPane>
                  
                    <TabPane tabId={6}>
                      <Container className="mt--5" fluid>
                        <Row>
                          <Col className="order-xl-2 mb-5 mb-xl-0" xl="12">
                            <Card className="card-profile shadow">
                              <CardHeader className="text-left ">
                                <h2 className="h3 mb-0">{i18next.t("Assign To Drivers")}</h2>
                              </CardHeader>
                              <CardBody className="pt-0 pt-md-4">
                                <div>
                                  {AssignToDriver.map((item, index) => (
                                    <div>
                                      <div>
                                        <small>{item.last_status}</small>
                                      </div>
                                      <div>
                                        <small>
                                          <Moment format="Do MMM YYYY, hh:mm">
                                            {item.createdAt}
                                          </Moment>
                                        </small>
                                      </div>
                                      <div
                                        style={{
                                          "justify-content": "space-between",
                                          display: "flex",
                                        }}
                                      >
                                        <Badge color="success">
                                          {item.o_id}
                                        </Badge>
                                        <button
                                          onClick={() => {
                                            this.handleMovetoODetail(
                                              item.order_id,
                                              index
                                            );
                                          }}
                                          className="btn btn-sm btn-primary"
                                        >
                                          {i18next.t("Details")}
                                        </button>
                                      </div>
                                      <div>
                                        Restaurant: {item.owner_name.name}
                                      </div>
                                      <div>
                                        <small>Client: {item.client_name.name}</small>
                                      </div>
                                      <div>
                                        <small>{item.total}</small>
                                      </div>
                                      <hr />
                                    </div>
                                  ))}
                                </div>
                              </CardBody>
                            </Card>
                          </Col>
                        </Row>
                      </Container>
                    </TabPane>
                  
                  </>
                }
              </>
            }
          </TabContent>
        </Container>
      </>
    );
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(ShowOrder);
