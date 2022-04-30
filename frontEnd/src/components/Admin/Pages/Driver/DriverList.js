                          
import React from "react";
// react plugin used to create google maps
import i18next from "i18next"
import {
  Card,
  CardHeader,
  Table,
  Container,
  Row,
  Col,
  Button,
} from "reactstrap";

// For Redux Data
import { bindActionCreators } from "redux";
import { ActCreators } from "../../../../redux/bindActionCreator";
import { connect } from "react-redux";
import instance from "../../../../axios";
import requests from "../../../../requests";

// css
import "../../../common/CSS/OnOffButton.css";

import {errorToaster, successToaster} from "../../../common/common-validation/common";

import AlertDeletedSuccess from "../../../common/AlertBox/alertBoxDeleted"

// React Moment
import Moment from "react-moment";

import ManulPagination from "../../../common/Pagination/Pagination";

let token = null;

const mapStateToProps = (state) => {
  token = state.token;
};
const mapDispatchToProps = (dispatch) => {
  return bindActionCreators(ActCreators, dispatch);
};
class DriverList extends React.Component {
  constructor(props) {
    super(props)
  
    this.state = {
      datas:[],
      currentPage: 1,
      total: 10,
      alertDeleteSuccess:false
    }
  }

  driversRegistration = () => {
      const {history} = this.props;
      if (history) history.push('/drivers/create')
  };

  handlePageNext = () => {
    const { currentPage } = this.state;
    this.setState({ currentPage: currentPage + 1 }, () => {
      this.getDriverList();
    });
  };

  handlePagePrev = () => {
    const { currentPage } = this.state;
    this.setState({ currentPage: currentPage - 1 }, () => {
      this.getDriverList();
    });
  };

  handlePageNum = (num) => {
    this.setState({ currentPage: num }, () => {
      this.getDriverList();
    });
  };

  getDriverList = async() => {
    this.setState({
      alertDeleteSuccess:false
    })
    let bodyAPI = {
      pageno: this.state.currentPage,
      perpage: 10,
    };
    const response = await instance
      .post(requests.fetchDriverForAdmin, bodyAPI, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .catch((error) => {
        let errorMessage = error.response.data.error.message;
        errorToaster(errorMessage);
      });
    if (response && response.data) {
      this.setState({
        datas: response.data.data.Drivers,
        currentPage: response.data.data.page,
        total: response.data.data.total,
      });
    }
  }
  
  componentDidMount = async () => {
    this.getDriverList();
  }

  handleChangeforCheckbox = async (e,index,id) => {
    const name = e.target.name;
    const value = e.target.checked;

    let bodyAPI = {
      "userid":id,
      "isActive":value
    }
    const response = await instance.patch(requests.fetchActiveDeactivate,bodyAPI,{
      headers:{
        "Authorization":`Bearer ${token}`
      }
    }).catch((error) => {
        let errorMessage = error.response.data.error.message;
        errorToaster(errorMessage)
    });
    if(response && response.data){
      let dataNew = this.state.datas
  
    dataNew[index].isActive=value
      this.setState ({
        datas:dataNew
      })
    }
  }
  onCallDelete = async (id) => {
    let bodyAPI = {
      "pageno":1,
      "perpage":10
    }
    const response = await instance
      .post(requests.fetchDeleteDriverFromAdmin + `/${id}`,bodyAPI, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .catch((error) => {
        let errorMessage = error.response.data.error.message;
        errorToaster(errorMessage);
      });
    if (response && response.data) {
      this.getDriverList();
      this.setState({
        alertDeleteSuccess:!this.state.alertDeleteSuccess
      });
    }
  };
  redirectEditDriver = (index, item) => {
    this.props.GET_EDIT_DRIVER_DETAIL(item);
    const { history } = this.props;
    if (history) history.push(`/driver/edit/${index}`);
  };
  
  render() {
    return (
      <>
        {/* header */}
        <Container className="pt-7" fluid>
          <Row>
            <div className="col">              
              <Card className="shadow">
                <CardHeader className="border-0">
                  <div className="d-flex justify-content-between">
                    <div className="md-7">
                      <h1 className="mb-0">{i18next.t("Drivers")}</h1>  
                    </div>
                    <div className="md-5">
                        <Row>
                            <Col>
                                <Button color="primary" size="sm" type="button"
                                  onClick={this.driversRegistration}>
                                    {i18next.t("Add Drivers")}
                                </Button>
                            </Col>
                        </Row>
                    </div>
                  </div>
                  <br/>
                  {
                    this.state.alertDeleteSuccess===true &&
                      <AlertDeletedSuccess />
                  }
                </CardHeader>
                <Table className="align-items-center table-flush" responsive>
                  <thead className="thead-light">
                    <tr>
                      <th scope="col">NAME</th>
                      <th scope="col">EMAIL</th>
                      <th scope="col">CREATION DATE</th>
                      <th scope="col">Active/Inactive</th>
                      <th scope="col">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                   {
                     this.state.datas.map((item,index) => 
                     <tr>
                      <td>
                        {item.name}                    
                      </td>
                      <td>
                        {item.email}
                      </td>    
                      <td>
                        <Moment format="Do MMM YYYY, hh:mm">
                          {item.createdAt}
                        </Moment>
                      </td>
                      <td>
                        <label className="custom-toggle">
                            {item.isActive === true ? (
                              <input
                                defaultChecked
                                type="checkbox"
                                name="isActive"
                                onChange={(e) => {this.handleChangeforCheckbox(e,index,item._id)}}
                              />
                            ) : (
                              <input
                                type="checkbox"
                                name="isActive"
                                onChange={(e) => {this.handleChangeforCheckbox(e,index,item._id)}}
                              />
                            )}
                            <span className="custom-toggle-slider rounded-circle" />
                          </label>
                      </td>
                      <td>
                          <Button
                            color="primary"
                            size="sm"
                            type="button"
                            onClick={() => this.redirectEditDriver(index + 1, item)}
                          >
                            {i18next.t("Edit")}
                          </Button>
                          <Button
                            color="danger"
                            size="sm"
                            type="button"
                            onClick={() => {if(window.confirm('Are you sure you want to delete this record?')) {this.onCallDelete(item._id)}}}
                          >
                            {i18next.t("Delete")}
                          </Button>
                        </td>
                    </tr>
                  )}  
                  </tbody>
                </Table>

                <ManulPagination 
                  total = {this.state.total}
                  currentPage = {this.state.currentPage}
                  handlePageNum = {this.handlePageNum}
                  handlePagePrev = {this.handlePagePrev}
                  handlePageNext = {this.handlePageNext}
                />
              </Card>
            </div>
          </Row>
        </Container>
      </>
    );
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(DriverList);
