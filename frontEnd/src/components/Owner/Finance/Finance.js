import React, { Component } from "react";
import HeaderFinance from "./HeaderFinance";

import i18next from "i18next";
// reactstrap components
import {
  Container,
  Row,
  Col,
  Card,
  CardHeader,
  Button,
  CardBody,
} from "reactstrap";

import { bindActionCreators } from "redux";
import { ActCreators } from "../../../redux/bindActionCreator";
import { connect } from "react-redux";
import instance from "../../../axios";
import requests from "../../../requests";
import Loader from "../../common/Loader";
// For Notification
import {errorToaster, successToaster} from "../../common/common-validation/common";

let token = null;
let pageLinks = [];
let numberOfPages = 0;
let userData = {};

const mapStateToProps = (state) => {
  token = state.token;
  userData = state.userData;
};
const mapDispatchToProps = (dispatch) => {
  return bindActionCreators(ActCreators, dispatch);
};

export class Finance extends Component {
  constructor(props) {
    super(props);
    this.state = {
      clientData: [],
      driversData: [],
      collapse: false,
      LoaderShow: true,
      dateFrom: "",
      dateTo: "",
      client: "",
      driver: "",
      currentPage: 1,
      total: 1,
      datas: [],
    };
  }

  handlePageNext = () => {
    const { currentPage } = this.state;
    this.setState({ currentPage: currentPage + 1 }, () => {
      this.getFinanceDetail();
    });
  };

  handlePagePrev = () => {
    const { currentPage } = this.state;
    this.setState({ currentPage: currentPage - 1 }, () => {
      this.getFinanceDetail();
    });
  };

  handlePageNum = (num) => {
    this.setState({ currentPage: num }, () => {
      this.getFinanceDetail();
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

  handleMovetoODetail = (O_id, index) => {
    this.props.ALL_ID({ O_id });
    const { history } = this.props;
    if (history) {
      history.push(`/orders/detail/${index}`);
    }
  };

  handleChange = (e) => {
    this.setState({
      [e.target.name]: e.target.value,
    });
  };

  handleSelectChange = (e, data) => {
    this.setState({
      [data.name]: data.value,
    });
  };

  toggler = () => {
    this.setState({ collapse: !this.state.collapse });
  };

  handleConnectToStripe = () => {
    
    //window.location = `https://connect.stripe.com/oauth/authorize?response_type=code&client_id=${process.env.REACT_APP_STRIPE_USER_KEY}&scope=read_write`;
    window.location = `https://connect.stripe.com/oauth/authorize?response_type=code&client_id=${process.env.REACT_APP_STRIPE_USER_KEY}&scope=read_write`;
  };

  handleDeactivateToStripe = async (id) => {
    const response = await instance
      .get(`${requests.fetchDeactiveStripeOAuth}?code=${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .catch((error) => {
        let errorMessage = error;
        console.log(errorMessage);
        errorToaster(errorMessage);
      });
    if (response && response.data) {
      this.getFinanceDetail();
    }
  };

  getFinanceDetail = async () => {
    const data = {
      startDate: this.state.dateFrom,
      endDate: this.state.dateTo,
      client_id: this.state.client,
      driver_id: this.state.driver,
      items_in_page: 10,
      page_number: this.state.currentPage,
    };

    const response = await instance
      .post(requests.fetchFinanceOwner, data, {
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
      if (response.data.data.result.length > 0) {
        const cardData = [
          {
            cardTitle: i18next.t("ORDERS"),
            state_value:
              response.data.data.result[0].stats.length === 0
                ? 0
                : response.data.data.result[0].stats[0].hasOwnProperty(
                    "orders"
                  ) === true
                ? response.data.data.result[0].stats[0].orders
                : "",
          },
          {
            cardTitle: i18next.t("TOTAL"),
            state_value:
              response.data.data.result[0].stats.length === 0
                ? 0
                : response.data.data.result[0].stats[0].hasOwnProperty(
                    "total"
                  ) === true
                ? parseFloat(
                    response.data.data.result[0].stats[0].total.toFixed(2)
                  )
                : "",
          },
          {
            cardTitle: i18next.t("NET"),
            state_value:
              response.data.data.result[0].stats.length === 0
                ? 0
                : response.data.data.result[0].stats[0].hasOwnProperty(
                    "net_value"
                  ) === true
                ? parseFloat(
                    response.data.data.result[0].stats[0].net_value.toFixed(2)
                  )
                : "",
          },
          {
            cardTitle: i18next.t("DELIVERED"),
            state_value:
              response.data.data.result[0].stats.length === 0
                ? 0
                : response.data.data.result[0].stats[0].hasOwnProperty(
                    "deliveries"
                  ) === true
                ? response.data.data.result[0].stats[0].deliveries
                : "",
          },
          {
            cardTitle: i18next.t("VAT"),
            state_value:
              response.data.data.result[0].stats.length === 0
                ? 0
                : response.data.data.result[0].stats[0].hasOwnProperty(
                    "vat_value"
                  ) === true
                ? parseFloat(
                    response.data.data.result[0].stats[0].vat_value.toFixed(2)
                  )
                : "",
          },
        ];
        
        this.setState(
          {
            stateCard: cardData,
            
            stipe_acc_status: response.data.data.stipe_acc_status,
            user_acc:
              response.data.data.stipe_acc_status === true
                ? response.data.data.user_acc
                : "",
          },
          () => {
            this.setState({ LoaderShow: false });
          }
        );
      } else {
        const cardData = [
          {
            cardTitle: i18next.t("ORDERS"),
            state_value: 0,
          },
          {
            cardTitle: i18next.t("TOTAL"),
            state_value: 0,
          },
          {
            cardTitle: i18next.t("NET"),
            state_value: 0,
          },
          {
            cardTitle: i18next.t("DELIVERED"),
            state_value: 0,
          },
          {
            cardTitle: i18next.t("VAT"),
            state_value: 0,
          },
        ];
        this.setState(
          {
            stateCard: cardData,
            stipe_acc_status: response.data.data.stipe_acc_status,
            user_acc:
              response.data.data.stipe_acc_status === true
                ? response.data.data.user_acc
                : "",
          },
          () => {
            this.setState({ LoaderShow: false });
          }
        );
      }
    }
  };

  componentDidMount = () => {
    if (this.state.LoaderShow === true) {
      this.getFinanceDetail();
    }
  };

  render() {
    const { total, currentPage, user_acc, stipe_acc_status } = this.state;
    const date = new Date();
    let styleStripe = "mt--7";
    if (userData.country_code === "in") {
      styleStripe = "mt--9";
    } else {
      styleStripe = "mt--7";
    }
    pageLinks = [];
    numberOfPages = 0;
    if (this.state.total % 10 === 0) {
      numberOfPages = Math.floor(total / 10);
    } else {
      numberOfPages = Math.floor(total / 10) + 1;
    }
    for (let i = 1; i <= numberOfPages; i++) {
      pageLinks.push(i);
    }
    return (
      <>
        <Container className={styleStripe,"pt-7"} fluid>
          <Loader open={this.state.LoaderShow} />
          <Row>
            {userData.country_code === "in" ? (
              ""
            ) : (
              <>
                <Col xs={12} sm="12 mb-4" xl={12}>
                  <Card className="bg-secondary shadow">
                    <CardHeader className="bg-white border-0">
                      <Row className="align-items-center">
                        <Col xs="8">
                          <h3 className="mb-0">{i18next.t("Stripe connect")}</h3>
                        </Col>
                      </Row>
                    </CardHeader>
                    <CardBody>
                      <div className="pl-lg-4 px-lg-4">
                        <p>
                          {i18next.t(
                            "We use Stripe to collect payments. Connect now, and we will send your funds from cart payments directly to Stripe account."
                          )}
                        </p>

                        {this.state.LoaderShow === false &&
                        stipe_acc_status === false ? (
                          <>
                            <hr className="my-4" />
                            <Button
                              color="primary"
                              type="button"
                              onClick={this.handleConnectToStripe}
                            >
                              {i18next.t("Connect With Stripe Account")}
                            </Button>
                          </>
                        ) : (
                          <>
                            <hr className="my-4" />
                            <Row>
                              <Col xs="12 my-3" sm="6" xl={6}>
                                <b>{i18next.t("Stripe account")}</b>
                                {"  "}
                                {this.state.LoaderShow === false &&
                                  user_acc.stripe_user_id}
                              </Col>
                              <Col xs="12 my-3" sm="6" xl={6}>
                                <b>{i18next.t("Stripe details")}</b>
                                {"  "}
                                {this.state.LoaderShow === false &&
                                user_acc.details_submitted === true
                                  ? i18next.t("Submited")
                                  : i18next.t("Not Submited")}
                              </Col>
                            </Row>
                            {this.state.LoaderShow === false &&
                            user_acc.details_submitted === true ? (
                              <>
                                <hr className="my-4" />
                                <Button
                                  color="danger"
                                  type="button"
                                  onClick={() => {
                                    this.handleDeactivateToStripe(
                                      user_acc.stripe_user_id
                                    );
                                  }}
                                >
                                  {i18next.t("Deactivate Stripe Account")}
                                </Button>
                              </>
                            ) : (
                              <>
                                <hr className="my-4" />
                                <Button
                                  color="primary"
                                  type="button"
                                  onClick={this.handleConnectToStripe}
                                >
                                  {i18next.t("Update to Stripe Account")}
                                </Button>
                                <Button
                                  color="danger"
                                  type="button"
                                  onClick={() => {
                                    this.handleDeactivateToStripe(
                                      user_acc.stripe_user_id
                                    );
                                  }}
                                >
                                  {i18next.t("Deactivate Stripe Account")}
                                </Button>
                              </>
                            )}
                          </>
                        )}

                        {/* <hr className="my-4" />
                    <Button
                      color="primary"
                      type="button"
                      onClick={this.handleTest}
                    >
                      Connect With Stripe Connect
                    </Button> */}
                      </div>
                    </CardBody>
                  </Card>
                </Col>
              </>
            )}
          </Row>
          {this.state.LoaderShow === false && (
            <HeaderFinance states={this.state.stateCard} />
          )}

        </Container>
      </>
    );
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(Finance);
