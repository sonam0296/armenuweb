import React, { Component } from "react";
//Loder
import Loader from "../../common/Loader";

// reactstrap components
import {
  Container,
  Row,
  Col,
  Card,
  CardHeader,
  Button,
  Table,
  UncontrolledTooltip,
} from "reactstrap";

// For Notification
import { errorToaster, successToaster } from "../../common/common-validation/common";
import i18next from "i18next";

// For Redux Data
import { bindActionCreators } from "redux";
import { ActCreators } from "../../../redux/bindActionCreator";
import { connect } from "react-redux";
import instance from "../../../axios";
import requests from "../../../requests";
import AddUpdateCoupon from "./AddUpdateCoupon";

import ManulPagination from "../../common/Pagination/Pagination";

let token = null;
let userData = {};

const mapStateToProps = (state) => {
  token = state.token;
  userData = state.userData;
}
const mapDispatchToProps = (dispatch) => {
  return bindActionCreators(ActCreators, dispatch);
}

export class CouponList extends Component {
  constructor(props) {
    super(props);
    this.state = {
      ShowAddUpdateModal: false,
      FlagShowAddUpdateModal: false,
      Status: "",
      Coupons: [],
      SelectedCoupon: {},
      Hide: false,
      currentPage: 1,
      total: 10,

    };
  }

  handleCloseModal = () => {
    this.setState({
      ShowAddUpdateModal: false,
      FlagShowAddUpdateModal: false
    });
  }
  addUpdateCoupon = (status, Coupon) => {
    this.setState({
      ShowAddUpdateModal: true,
      FlagShowAddUpdateModal: true,
      Status: status,
      SelectedCoupon: Coupon
    });
  }
  getAllCoupon = async () => {
    let userType = this.state.Hide === true ? "owner" : "client"

    let BodyApi = {
      "owner_id": userData.is_outlet === false ? userData._id : userData.master_brand,
      "userType": userType,
      "items_in_page": 10,
      "page_number": this.state.currentPage
    }
    const response = await instance
      .post(requests.fetchGetAllCoupon, BodyApi, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .catch((error) => {
        let errorMessage = error.responses.data.message;
        console.log(errorMessage);
        errorToaster(errorMessage);
      });
    if (response && response.data) {
      this.setState({
        Coupons: response.data.data.coupons,
        currentPage: response.data.data.page_Info.page_number,
        total: response.data.data.page_Info.count,
      })
    }
  }
  handleArchive = async (id) => {
    let ApiBody = {
      "coupon_id": id
    }
    const response = await instance
      .patch(requests.fetchArchiveCoupon, ApiBody, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .catch((error) => {
        let errorMessage = error.responses.data.message;
        console.log(errorMessage);
        errorToaster(errorMessage);
      });
    if (response && response.data) {
      this.getAllCoupon();
    }
  }
  componentDidMount = () => {
    this.getAllCoupon();
  };

  showHideArchive = () => {
    this.setState({
      Hide: !this.state.Hide
    }, () => {
      this.getAllCoupon();
    })
  }

  handlePageNext = () => {
    const { currentPage } = this.state;
    this.setState({ currentPage: currentPage + 1 }, () => {
      this.getAllCoupon();
    });
  };

  handlePagePrev = () => {
    const { currentPage } = this.state;
    this.setState({ currentPage: currentPage - 1 }, () => {
      this.getAllCoupon();
    });
  };

  handlePageNum = (num) => {
    this.setState({ currentPage: num }, () => {
      this.getAllCoupon();
    });
  };

  render() {
    const { Coupons } = this.state;
    
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
                      <h1 className=" mb-0">{i18next.t("Coupons")}</h1>
                    </div>
                    {
                      userData.is_outlet === false &&
                      <div
                        className="col-4 text-right"
                        style={{ marginBottom: "auto", marginTop: "auto" }}
                      >
                        <Row className="pt-3 text-right" style={{ float: "right" }}>
                          <Button
                            size="sm"
                            color="primary"
                            type="button"

                            onClick={() => { this.addUpdateCoupon("add") }}
                          >
                            {i18next.t("Add New Coupon")}
                          </Button>
                          <Button
                            size="sm"
                            id="tooltip611234743"
                            data-placement="top"
                            color="primary"
                            type="button"
                            onClick={this.showHideArchive}
                          >
                            {
                              this.state.Hide === false ?
                                <i class="fas fa-eye-slash"></i>
                                :
                                <i class="fas fa-eye"></i>
                            }
                            {/* <i class="far fa-eye-slash"></i> */}
                          </Button>
                          <UncontrolledTooltip
                            delay={0}
                            placement="top"
                            target="tooltip611234743"
                          >
                            {
                              this.state.Hide === true ?
                                i18next.t("Hide Archive Coupons")
                                :
                                i18next.t("Show Archive Coupons")
                            }
                          </UncontrolledTooltip>
                        </Row>
                      </div>
                    }

                  </div>
                </CardHeader>
              </Card>
            </Col>
          </Row>
          <Row>
            <div className="col">
              <Card>
                <Table className="align-items-center table-flush" style={{ zIndex: "-1" }} responsive>
                  <thead className="thead-light">
                    <tr>
                      <th scope="col">COUPON CODE</th>
                      {/* <th scope="col">DESCRIPTION</th> */}
                      <th scope="col">WEIGHT</th>
                      <th scope="col">THRESHOLD</th>
                      <th scope="col">FLAT DISCOUNT</th>
                      {
                        userData.is_outlet === false &&
                        <th scope="col">ACTION</th>
                      }

                    </tr>
                  </thead>
                  <tbody>
                    {Coupons.length > 0 ? (
                      <>
                        {Coupons.map((Coupon, index) => {
                          return (
                            <>
                              <tr>
                                <td>
                                  {
                                    Coupon.coupon_archive === true ?
                                      <del>{Coupon.coupon_code}</del>
                                      :
                                      Coupon.coupon_code
                                  }
                                </td>
                                {/* <td>{Coupon.coupon_terms}</td> */}
                                <td>{Coupon.coupon_weight}</td>
                                <td>{Coupon.coupon_threshold}</td>
                                <td>
                                  {
                                    Coupon.flat_discount === true ? "true" : "false"
                                  }
                                </td>
                                {
                                  userData.is_outlet === false &&
                                  <td>
                                    <Row>
                                      <Col>
                                        <Button
                                          color="primary"
                                          type="button"
                                          size="sm"
                                          disabled={Coupon.coupon_archive === true ? true : false}
                                          onClick={() => { this.addUpdateCoupon("edit", Coupon) }}
                                        >
                                          {i18next.t("Edit")}
                                        </Button>
                                        <Button
                                          color="danger"
                                          type="button"
                                          size="sm"
                                          disabled={Coupon.coupon_archive === true ? true : false}
                                          onClick={() => {
                                            if (window.confirm(
                                              "Are you sure to want to archive this coupon?"
                                            )) {
                                              this.handleArchive(Coupon._id);
                                            }
                                          }}
                                        >
                                          {i18next.t("Archive")}
                                        </Button>
                                      </Col>
                                    </Row>
                                  </td>
                                }

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

        {
          this.state.FlagShowAddUpdateModal === true &&
          <AddUpdateCoupon
            show={this.state.ShowAddUpdateModal}
            onClose={this.handleCloseModal}
            Status={this.state.Status}
            SelectedCoupon={this.state.SelectedCoupon}
            getAllCoupon={this.getAllCoupon}
          />
        }
      </>
    );
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(CouponList);
