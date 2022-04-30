import React from "react";

// javascipt plugin for creating charts
import Chart from "chart.js";
// react plugin used to create charts
import { Line, Bar } from "react-chartjs-2";
import i18next from "i18next";
// reactstrap components
import {
  Card,
  CardHeader,
  CardBody,
  Container,
  Row,
  Col,
} from "reactstrap";

// core components
import {
  chartOptions,
  parseOptions,
} from "variables/charts.js";

import { bindActionCreators } from "redux";
import { ActCreators } from "../../redux/bindActionCreator";
import { connect } from "react-redux";
import instance from "../../axios";
import requests from "../../requests";
// For Notification
import { errorToaster, successToaster } from "../common/common-validation/common";
import Header from "../Headers/Header";

import Greeting from "./Greeting"

let token = null;
let userData = {};
let Greetings = {};
const mapStateToProps = (state) => {
  token = state.token;
  userData = state.userData;
  Greetings = state.Greetings;
};
const mapDispatchToProps = (dispatch) => {
  return bindActionCreators(ActCreators, dispatch);
};
class Index extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      activeNav: 1,
      chartExample1Data: "data1",
      stateCard: [],
      showModal: false
    };
    if (window.Chart) {
      parseOptions(Chart, chartOptions());
    }
  }

  getDashboardDetailsForAggregator = async () => {
    let API = requests.FetchDriverAggregatorDashBoard;
    const response = await instance
      .get(API, {
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
      const cardData = [
        {
          cardTitle: i18next.t("TOTAL DRIVERS"),
          state_value: response.data.data[0].drivers,
          icon: "fas fa-chart-bar",
          color: "bg-danger",
        },
        {
          cardTitle: i18next.t("TOTAL RESTAURANTS"),
          state_value: response.data.data[0].restaurants,
          icon: "fas fa-chart-bar",
          color: "bg-green",
        },
        {
          cardTitle: i18next.t("ORDERS ( CURRENT MONTH )"),
          state_value:
            response.data.data[0].total_orders[0],
            // response.data.data[0].total_orders[0].monthly_order,
          icon: "fas fa-chart-pie",
          color: "bg-warning",
        },
      ]
      const b = [];
      for (let i = 1; i <= 12; i++) {
        b[i - 1] = 0;
        response.data.data[0].total_orders.map((item, index) => {
          if (i === item._id) {
            b[item._id - 1] = item.monthly_order;
          }
        });
      }
      const bardata = {
        labels: [
          i18next.t("Jan"),
          i18next.t("Feb"),
          i18next.t("Mar"),
          i18next.t("Apr"),
          i18next.t("May"),
          i18next.t("Jun"),
          i18next.t("Jul"),
          i18next.t("Aug"),
          i18next.t("Sep"),
          i18next.t("Oct"),
          i18next.t("Nov"),
          i18next.t("Dec"),
        ],
        datasets: [
          {
            data: b,
          },
        ],
      };

      const baroptions = {
        scales: {
          yAxes: [
            {
              ticks: {
                beginAtZero: true,
                precision: 0,
                callback: (value, index, values) => {
                  return value;
                },
              },
            },
          ],
        },
      };
      this.setState({
        stateCard: cardData,
        baroptions: baroptions,
        bardata: bardata,
      })
    }
  }

  getDashboardDetails = async () => {
    let API = null
    if (userData.userType === "admin") {
      API = requests.fetchAdminDashboard
    } else if (userData.userType === "owner") {
      API = requests.fetchDashBoardDetail
    }
    // else if (userData.userType==="driver_aggregator"){
    //   API=requests.FetchDriverAggregatorDashBoard
    // }
    const month = new Date().getUTCMonth();
    const response = await instance
      .get(API, {
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
      const cardData = [
        {
          cardTitle: i18next.t("ORDERS ( CURRENT MONTH )"),
          state_value:
            response.data.data[0].stats.length === 0
              ? 0
              : response.data.data[0].stats[0].hasOwnProperty("orders") === true
                ? response.data.data[0].stats[0].orders
                : "",
          icon: "fas fa-chart-bar",
          color: "bg-danger",
        },
        {
          cardTitle: i18next.t("SALES VOLUME ( CURRENT MONTH )"),
          state_value:
            response.data.data[0].stats.length === 0
              ? 0
              : response.data.data[0].stats[0].hasOwnProperty(
                "sales_volume"
              ) === true
                ? userData.currencies.symbol + " " + parseFloat(
                  response.data.data[0].stats[0].sales_volume.toFixed(2)
                )
                : "",
          icon: "fas fa-chart-pie",
          color: "bg-warning",
        },
        {
          cardTitle: i18next.t("ORDERS FROM NEW USER ( CURRENT MONTH )"),
          state_value:
            response.data.data[0].orders_from.length === 0
              ? 0
              : response.data.data[0].orders_from[0].unique_users,
          icon: "fas fa-users",
          color: "bg-yellow",
        },
        {
          cardTitle: i18next.t("EXPOSURE TO ( CURRENT MONTH )"),
          state_value:
            response.data.data[0].exposer_to.length === 0
              ? 0
              : response.data.data[0].exposer_to[0].exposer_to,
          icon: "fas fa-percent",
          color: "bg-info",
        },
      ]
      const a = [];
      var d = new Date();
      var n = d.getMonth();
      for (let i = 1; i <= 12; i++) {
        if (i - 1 > n) {
          a[i - 1] = null;
        } else {
          a[i - 1] = 0;
        }

        response.data.data[0].sales_value.map((item, index) => {
          if (i === item._id) {
            a[item._id - 1] = item.monthly_sales;
          }
        });
      }
      const Linedata = {
        labels: [
          i18next.t("Jan"),
          i18next.t("Feb"),
          i18next.t("Mar"),
          i18next.t("Apr"),
          i18next.t("May"),
          i18next.t("Jun"),
          i18next.t("Jul"),
          i18next.t("Aug"),
          i18next.t("Sep"),
          i18next.t("Oct"),
          i18next.t("Nov"),
          i18next.t("Dec"),
        ],
        datasets: [
          {
            data: a,
          },
        ],
      };
      const b = [];
      for (let i = 1; i <= 12; i++) {
        b[i - 1] = 0;
        response.data.data[0].total_orders.map((item, index) => {
          if (i === item._id) {
            b[item._id - 1] = item.monthly_order;
          }
        });
      }
      const bardata = {
        labels: [
          i18next.t("Jan"),
          i18next.t("Feb"),
          i18next.t("Mar"),
          i18next.t("Apr"),
          i18next.t("May"),
          i18next.t("Jun"),
          i18next.t("Jul"),
          i18next.t("Aug"),
          i18next.t("Sep"),
          i18next.t("Oct"),
          i18next.t("Nov"),
          i18next.t("Dec"),
        ],
        datasets: [
          {
            data: b,
          },
        ],
      };

      const options = {
        scales: {
          yAxes: [
            {
              ticks: {
                beginAtZero: true,
                precision: 0,
                callback: (value, index, values) => {
                  return userData.currencies.symbol + value;
                },
              },
            },
          ],
        },
      };

      const baroptions = {
        scales: {
          yAxes: [
            {
              ticks: {
                beginAtZero: true,
                precision: 0,
                callback: (value, index, values) => {
                  return value;
                },
              },
            },
          ],
        },
      };

      this.setState(
        {
          stateCard: cardData,
          Linedata: Linedata,
          options: options,
          baroptions: baroptions,
          bardata: bardata,
        }
      );
    }
  };

  componentDidMount = () => {
    if (userData.userType !== "driver_aggregator") {
      this.getDashboardDetails();
    } else {
      this.getDashboardDetailsForAggregator();
    }

    if (Greetings.status === true) {

      this.setState({
        showModal: true
      })
    }
  };

  getUserProfile = async (ID,token_local) => {
    // console.log(userData);
    // let ID = userData._id;
    const response = await instance
      .get(requests.fetchGetUserProfileData + "/" + ID, {
        headers: {
          Authorization: `Bearer ${token_local}`,
        },
      })
      .catch((error) => {
        this.setState({ LoaderShow: false });
        let errorMessage = error.response.data.error.message;
        console.log(errorMessage);
        errorToaster(errorMessage);
      });
    if (response && response.data) {
      let userData = response.data.data.user;
      this.props.LOGIN_USER_DETAIL(userData);
      let Greetings = {
        status: false,
        completedStatus: "0%"
      }
      this.props.STORE_GREETINGS_INFORMATION(Greetings);
    }
  }

  onCloseModal = () => {
    if (Greetings.status === true) {
      this.getUserProfile(userData._id,token);     
    }
    this.setState({
      showModal: false
    })
  }

  render() {
    // if (this.state.showModal === true) {
    //   return (
    //     <Greeting
    //       show={this.state.showModal === true}
    //       onClose={this.onCloseModal()}
    //     />
    //   )
    // }
    return (
      <>
        {/* Page content */}
        <Container className="pt-7" fluid>
          <Header states={this.state.stateCard} />
          <Row>
            <Col className="mb-5 mb-xl-0" xl="8">
              <Card className="bg-gradient-default shadow">
                <CardHeader className="bg-transparent">
                  <Row className="align-items-center">
                    <div className="col">
                      <h6 className="text-uppercase text-light ls-1 mb-1">
                        {i18next.t("Overview")}
                      </h6>
                      <h2 className="text-white mb-0">{i18next.t("Sales value")}</h2>
                    </div>
                  </Row>
                </CardHeader>
                <CardBody>
                  {/* Chart */}
                  <div className="chart">
                    <Line
                      data={this.state.Linedata}
                      options={this.state.options}
                    />
                  </div>
                </CardBody>
              </Card>
            </Col>
            <Col xl="4">
              <Card className="shadow">
                <CardHeader className="bg-transparent">
                  <Row className="align-items-center">
                    <div className="col">
                      <h6 className="text-uppercase text-muted ls-1 mb-1">
                        {i18next.t("Performance")}
                      </h6>
                      <h2 className="mb-0">{i18next.t("Total orders")}</h2>
                    </div>
                  </Row>
                </CardHeader>
                <CardBody>
                  {/* Chart */}
                  <div className="chart">
                    <Bar
                      data={this.state.bardata}
                      options={this.state.baroptions}
                    />
                  </div>
                </CardBody>
              </Card>
            </Col>
          </Row>
        </Container>
        {
          this.state.showModal &&
          <Greeting
            show={this.state.showModal === true}
            onClose={() => this.onCloseModal()}
          />
        }
      </>
    );
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(Index);
