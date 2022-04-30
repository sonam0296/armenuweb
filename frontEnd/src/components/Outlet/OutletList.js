import React from "react";
// react plugin used to create google maps

import Loader from "../common/Loader";
import i18next from "i18next";
import {
  Card,
  CardHeader,
  Table,
  Container,
  Row,
  Col,
  Button,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
  UncontrolledDropdown,
} from "reactstrap";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEllipsisV } from "@fortawesome/free-solid-svg-icons";

// for Redux
import { bindActionCreators } from "redux";
import { ActCreators } from "../../redux/bindActionCreator";
import { connect } from "react-redux";

// for api integration
import instance from "../../axios";
import requests from "../../requests";

// for notification
import "react-notifications/lib/notifications.css";
import { errorToaster, successToaster } from "../common/common-validation/common";

import Moment from "react-moment";
import AddNewOutlet from "./AddNewOutlet";

//Navbar
import Navbar from "../Navbars/AdminNavbar";

// core components
import Sidebar from "../Sidebar/Sidebar.js";

import routes from "../../routes.js";
import ownerRoutes from "../../ownerRoutes";

import ManulPagination from "../common/Pagination/Pagination";


let token = null;
let GetRestaurantDeatilAdmin = {};
let userData = {};
let StoreRestaurantId = {};

const mapStateToProps = (state) => {
  token = state.token;
  userData = state.userData;
  GetRestaurantDeatilAdmin = state.GetRestaurantDeatilAdmin;
  StoreRestaurantId = state.StoreRestaurantId;

};

const mapDispatchToProps = (dispatch) => {
  return bindActionCreators(ActCreators, dispatch);
};

class OutletList extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      Loader: false,
      datas: undefined,
      currentPage: 1,
      total: undefined,
      AddNewItem: false
    };
  }

  getOutlets = async () => {
    let API = userData.userType === "admin" ? requests.fetchOutlets :
      requests.fetchOutlets

    let body = userData.userType === "admin" ? {
      owner_id: StoreRestaurantId.id,
      only_outlets: true,
      pageno: this.state.currentPage,
      perpage: 10
    }
      : {
        owner_id: userData._id,
        only_outlets: true,
        pageno: this.state.currentPage,
        perpage: 10
      }

    // const body = {
    //   owner_id: StoreRestaurantId.id,
    //   only_outlets:true,
    //   pageno: this.state.currentPage,
    //   perpage: 10
    //  };
    const response = await instance
      .post(API, body, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .catch((error) => {
        let errorMessage = error.response.data.error.message;
        errorToaster(errorMessage);
        console.log(errorMessage);
        this.setState({ Loader: false });
      });
    if (response && response.data) {
      //this.props.GET_RESTAURANT_DEATIL_ADMIN(response.data.data.Restaurants);
      this.setState(
        {
          datas: response.data.data.Restaurants,
          total: response.data.data.total,
          currentPage: response.data.data.page,
        },
        () => {
          this.setState({ Loader: false });
        }
      );
      this.setState({ Loader: false });
    }
  };

  handleActiveDeactivate = async (id, active) => {
    const body = {
      userid: id,
      isActive: !active,
    };
    const response = await instance
      .patch(requests.fetchActiveDeactivate, body, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .catch((error) => {
        let errorMessage = error.response.data.error.message;
        errorToaster(errorMessage);
        console.log(errorMessage);
      });

    if (response && response.data) {
      this.getOutlets();
    }
  };

  componentDidMount = (props) => {
    this.getOutlets();
  };

  addNewOutlets = () => {
    this.setState({
      AddNewOutlet: !this.state.AddNewOutlet,
    });
  };



  handleCloseItem = () => {
    this.setState({
      AddNewOutlet: false,
    });
  };

  handlePageNum = (num) => {
    this.setState({ currentPage: num }, () => {
      this.getOutlets();
    });
  };

  handleMoveToEditPage = (id, index) => {
    let old_data = StoreRestaurantId
    const r_id = { id: id, userType: "outlet", qrcode: old_data.qrcode };
    this.props.STORE_RESTAURANT_ID(r_id);

    const { history } = this.props;
    if (history) {
      history.push(`/update/restaurants/${index}`);
    }

  };

  handlePageNext = () => {
    const { currentPage } = this.state;
    this.setState({ currentPage: currentPage + 1 }, () => {
      this.getOutlets();
    });
  };

  handlePagePrev = () => {
    const { currentPage } = this.state;
    this.setState({ currentPage: currentPage - 1 }, () => {
      this.getOutlets();
    });
  };

  render() {
    let route = userData.userType === "admin" ? routes : ownerRoutes
    const { datas } = this.state;
  
    if (datas) {
      return (
        <>
          {/* <Header /> */}
          {/* Page content */}

          {/* header */}
          <Sidebar
            {...this.props}
            routes={route}
            logo={{
              innerLink: "/dashboard",
              imgSrc: require("assets/img/brand/argon-react.png"),
              imgAlt: "..."
            }}
          />
          <div className="main-content" ref="mainContent">
            <Navbar />

            <Container className="pt-7 text-uppercase" fluid>
              <Row>
                <Col>
                  {
                    userData.userType === "owner" ?
                      <h1>
                        All outlets for {userData.restaurant_Name}
                      </h1>
                      :
                      <h1>
                        All outlets for {StoreRestaurantId.restaurant_Name}
                      </h1>

                  }
                </Col>
              </Row>
            </Container>
            <Container className="pt-5" fluid>
              <Row>
                <Loader open={this.state.Loader} />
                <div className="col">
                  <Card className="shadow">
                    <CardHeader className="border-0">
                      <div className="d-flex justify-content-between">
                        <div className="md-7">
                          <h1 className="mb-0">{i18next.t("Outlets")}</h1>
                        </div>
                        <div className="md-5">
                          <Row>
                            <Col>
                              <Button
                                color="primary"
                                size="sm"
                                type="button"
                                onClick={this.addNewOutlets}
                              >
                                {i18next.t("Add Outlets")}
                              </Button>
                              {/* <Button 
                                onClick={this.props.history.goBack}
                                color="primary" size="sm" type="button">
                                Back
                              </Button> */}
                            </Col>

                          </Row>
                        </div>
                      </div>
                    </CardHeader>
                    <Table className="align-items-center table-flush" responsive>
                      <thead className="thead-light">
                        <tr>
                          <th scope="col">LOGO</th>
                          <th scope="col">RESTAURANT Name</th>
                          <th scope="col">OWNER</th>
                          <th scope="col">OWNER EMAIL</th>
                          <th scope="col">CREATION DATE</th>
                          <th scope="col">ACTIVE</th>
                          <th scope="col"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {

                          this.state.datas.map((item, index) => {
                            let id = item._id;
                            let isActive = item.isActive;

                            return (
                              <tr>

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
                                        //src={require("assets/img/theme/team-1-800x800.jpg")}
                                        src={item.hasOwnProperty("restaurant_image") ? item.restaurant_image.image_url : process.env.REACT_APP_DEFAULT_IMAGE}
                                      />

                                    </a>
                                  </div>
                                </td>
                                <th scope="row">{item.restaurant_Name}</th>
                                <td>{item.name}</td>
                                <td>{item.email}</td>
                                <td>
                                  <Moment format="Do MMM YYYY, hh:mm">
                                    {item.createdAt}
                                  </Moment>
                                </td>
                                <td>
                                  {item.isActive ? (
                                    <Button
                                      disabled
                                      color="success"
                                      size="sm"
                                      type="button"
                                    >
                                      {i18next.t("Active")}
                                    </Button>
                                  ) : (
                                    <Button
                                      disabled
                                      color="danger"
                                      size="sm"
                                      type="button"
                                    >
                                      {i18next.t("Inactive")}
                                    </Button>
                                  )}
                                </td>

                                <td>
                                  <UncontrolledDropdown>
                                    <Button
                                      style={{ padding: 0, border: "none" }}
                                      color="secondary"
                                      outline
                                      type="button"
                                      className="text-muted"
                                    >
                                      <DropdownToggle
                                        style={{ border: "none" }}
                                        outline
                                      >
                                        <FontAwesomeIcon icon={faEllipsisV} />
                                      </DropdownToggle>
                                    </Button>
                                    <DropdownMenu right>
                                      <DropdownItem
                                        onClick={() => {
                                          this.handleMoveToEditPage(id, index);
                                        }}
                                      >
                                        {i18next.t("Edit")}
                                      </DropdownItem>
                                      {item.isActive ? (
                                        <DropdownItem
                                          onClick={() => {
                                            this.handleActiveDeactivate(
                                              id,
                                              isActive
                                            );
                                          }}
                                        >
                                          {i18next.t("Deactivate")}
                                        </DropdownItem>
                                      ) : (
                                        <DropdownItem
                                          onClick={() => {
                                            this.handleActiveDeactivate(
                                              id,
                                              isActive
                                            );
                                          }}
                                        >
                                          {i18next.t("Activate")}
                                        </DropdownItem>
                                      )}
                                    </DropdownMenu>
                                  </UncontrolledDropdown>
                                </td>

                              </tr>
                            );
                          })}
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
            <AddNewOutlet
              onClose={this.handleCloseItem}
              show={this.state.AddNewOutlet}
              callGetOutlet={this.getOutlets}

            />
          </div>

        </>
      );
    }
    else {
      return (
        <h6> ... </h6>
      )
    }

  }
}

export default connect(mapStateToProps, mapDispatchToProps)(OutletList);
