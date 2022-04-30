
import React from "react";
// react plugin used to create google maps


import i18next from "i18next";

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

import { errorToaster, successToaster } from "../../../common/common-validation/common";

import ManulPagination from "../../../common/Pagination/Pagination";

let token = null;

const mapStateToProps = (state) => {
  token = state.token;
};
const mapDispatchToProps = (dispatch) => {
  return bindActionCreators(ActCreators, dispatch);
};

class Review extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      datas: [],
      currentPage: 1,
      total: 10,
    }
  }

  handlePageNext = () => {
    const { currentPage } = this.state;
    this.setState({ currentPage: currentPage + 1 }, () => {
      this.getReviewList();
    });
  };

  handlePagePrev = () => {
    const { currentPage } = this.state;
    this.setState({ currentPage: currentPage - 1 }, () => {
      this.getReviewList();
    });
  };

  handlePageNum = (num) => {
    this.setState({ currentPage: num }, () => {
      this.getReviewList();
    });
  };

  getReviewList = async () => {
    let bodyAPI = {
      "pageno": this.state.currentPage,
      "perpage": 10,
    };
    const response = await instance
      .post(requests.fetchReviewForAdmin, bodyAPI, {
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
        datas: response.data.data.reviews,
        currentPage: response.data.data.page,
        total: response.data.data.total,
      });
    }
  }
  
  componentDidMount = async () => {
    this.getReviewList();
  }

  OnCallDelete = async (id) => {
    let bodyAPI = {
      "page": this.state.currentPage,
      "perpage": 10
    }
    const response = await instance
      .post(`${requests.fetchReviewDeleteFromAdmin}/${id}`, bodyAPI, {
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
        datas: response.data.data.reviews,
        currentPage: response.data.data.page,
        total: response.data.data.total,
      });
    }
  }

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
                      <h1 className="mb-0">{i18next.t("Orders Reviews")}</h1>
                    </div>
                    <div className="md-5">
                      <Row>
                        <Col>

                        </Col>
                      </Row>
                    </div>

                  </div>
                </CardHeader>
                <Table className="align-items-center table-flush" responsive>
                  <thead className="thead-light">
                    <tr>
                      <th scope="col">NO</th>
                      <th scope="col">RATING</th>
                      <th scope="col">COMMENT</th>
                      <th scope="col">USER</th>
                      <th scope="col">ACTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {
                      this.state.datas.map((item, index) =>
                        <tr>
                          <td>
                            {index + 1}
                          </td>
                          <td>
                            {item.restaurant_ratings}
                          </td>
                          <td>
                            {item.comments}
                          </td>
                          <td>
                            {item.clientuser.name}
                          </td>
                          <td>
                            {
                              <Button color="danger" size="sm" type="button"
                                onClick={() => {if(window.confirm('Are you sure you want to delete this record?')) {
                                  this.OnCallDelete(item._id)
                                }}}
                              >
                                {i18next.t("Delete")}
                              </Button>
                            }
                          </td>
                        </tr>
                      )
                    }
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
      </>
    );
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(Review);
