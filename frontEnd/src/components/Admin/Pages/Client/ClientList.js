
import React from "react";
// react plugin used to create google maps

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
  UncontrolledDropdown
} from "reactstrap";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEllipsisV } from "@fortawesome/free-solid-svg-icons";

// For Redux Data
import { bindActionCreators } from "redux";
import { ActCreators } from "../../../../redux/bindActionCreator";
import { connect } from "react-redux";
import instance from "../../../../axios";
import requests from "../../../../requests";

import i18next from "i18next"
import {errorToaster, successToaster} from "../../../common/common-validation/common";

import ManulPagination from "../../../common/Pagination/Pagination";
                      

// React Moment
import Moment from "react-moment";

let token = null;

const mapStateToProps = (state) => {
  token = state.token;
};
const mapDispatchToProps = (dispatch) => {
  return bindActionCreators(ActCreators, dispatch);
};

class ClientList extends React.Component {
  constructor(props) {
    super(props)
  
    this.state = {
      datas:[],
      currentPage: 1,
      total: 10,
    }
  }

  handlePageNext = () => {
    const { currentPage } = this.state;
    this.setState({ currentPage: currentPage + 1 }, () => {
      this.getClientList();
    });
  };

  handlePagePrev = () => {
    const { currentPage } = this.state;
    this.setState({ currentPage: currentPage - 1 }, () => {
      this.getClientList();
    });
  };

  handlePageNum = (num) => {
    this.setState({ currentPage: num }, () => {
      this.getClientList();
    });
  };

  getClientList = async() => {
    let bodyAPI = {
      pageno: this.state.currentPage,
      perpage: 10,
    };
    const response = await instance
      .post(requests.fetchClientForAdmin, bodyAPI, {
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
        datas: response.data.data.Clients,
        currentPage: response.data.data.page,
        total: response.data.data.total,
      });
    }
  }
  componentDidMount = async () => {
    this.getClientList();
  }
  
  onCallIsActive = async (id,status,index) => {
    let bodyAPI = {
      "userid":id,
      "isActive":status
    }
    const response = await instance
      .patch(requests.fetchActiveDeactivate, bodyAPI, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .catch((error) => {
        let errorMessage = error.response.data.error.message;
        errorToaster(errorMessage);
      });
    if (response && response.data) {
      successToaster("Record Successfully updated!")
      this.getClientList();
    }
  }
  render() {
   
    return (
      <>
        {/* header */}
        <Container  className="pt-7" fluid>
          <Row>
            <div className="col">              
              <Card className="shadow">
                <CardHeader className="border-0">
                <div className="d-flex justify-content-between">
                    <div className="md-7">
                      <h1 className="mb-0">{i18next.t("Clients")}</h1>  
                    </div>
                    <div className="md-5">
                        <Row>
                            <Col>
                                
                            </Col>
                        </Row>
                    </div>     
                  </div><br/>
                </CardHeader>
                <Table className="align-items-center table-flush" responsive>
                  <thead className="thead-light">
                    <tr>
                      <th scope="col">NAME</th>
                      <th scope="col">EMAIL</th>
                      <th scope="col">CREATION DATE</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                   {
                     this.state.datas.map((item,index) => 
                     <tr>
                      <td>
                        {
                          item.name === null ? <small>Not inserted</small> : item.name
                        }
                                            
                      </td>
                      <td>
                        {item.email === null ? <small>Not inserted</small> : item.email}
                      </td>    
                      <td>
                        <Moment format="Do MMM YYYY, hh:mm">
                          {item.createdAt}
                        </Moment>
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
                          {
                            item.isActive ?
                              <DropdownItem 
                                onClick={ 
                                  () => {
                                    if(window.confirm('Are you sure you want to deactivate this record?')) {
                                      this.onCallIsActive(item._id,"false",index)
                                    }
                                  }
                                }
                              >
                                {i18next.t("Deactivate")}
                              </DropdownItem>
                            :
                              <DropdownItem 
                                onClick={ 
                                  () => { 
                                    if(window.confirm('Are you sure you want to activate this record?')) {
                                      this.onCallIsActive (item._id,"true",index)
                                    }
                                  }
                                }
                              >
                                  {i18next.t("Activate")}
                              </DropdownItem>
                          }
                          </DropdownMenu>
                        </UncontrolledDropdown>
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

export default connect(mapStateToProps, mapDispatchToProps)(ClientList);
