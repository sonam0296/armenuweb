import React from "react";
// react plugin used to create google maps
import i18next from "i18next";
import {
  Card,
  CardHeader,
  Container,
  Row,
  Col,
  Button,
  Table,
} from "reactstrap";

// For Redux Data
import { bindActionCreators } from "redux";
import { ActCreators } from "../../../../redux/bindActionCreator";
import { connect } from "react-redux";
import instance from "../../../../axios";
import requests from "../../../../requests";

import ManulPagination from "../../../common/Pagination/Pagination";

// Notification
import {errorToaster, successToaster} from "../../../common/common-validation/common";

// // Table
// import TableData from "../../../common/Table/table";


let token = null;
let pageLinks = [];
let numberOfPages = 0;

const mapStateToProps = (state) => {
  token = state.token;
};
const mapDispatchToProps = (dispatch) => {
  return bindActionCreators(ActCreators, dispatch);
};
class CityList extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      datas: [],
      currentPage: 1,
      total: 10,
    };
  }

  handlePageNext = () => {
    const { currentPage } = this.state;
    this.setState({ currentPage: currentPage + 1 }, () => {
      this.getCityList();
    });
  };

  handlePagePrev = () => {
    const { currentPage } = this.state;
    this.setState({ currentPage: currentPage - 1 }, () => {
      this.getCityList();
    });
  };

  handlePageNum = (num) => {
    this.setState({ currentPage: num }, () => {
      this.getCityList();
    });
  };


  getCityList = async() => {
    let bodyAPI = {
      pageno: this.state.currentPage,
      perpage: 10,
    };
    const response = await instance
      .post(requests.fetchCityForAdmin, bodyAPI, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .catch((error) => {
        let errorMessage = error.response.data.error.message;
        errorToaster(errorMessage);
      });
    if (response && response.data) {
      this.setState(
        {
          datas: response.data.data.cities,
          currentPage: response.data.data.page,
          total: response.data.data.total,
        }
      );
    }
  }

  componentDidMount = async () => {
    this.getCityList();
  };

  redirectNewCity = () => {
    const { history } = this.props;
    if (history) history.push("/cities/create");
  };
  redirectEditCity = (index, item) => {
    this.props.GET_EDIT_CITY_DETAIL(item);
    const { history } = this.props;
    if (history) history.push(`/city/edit/${index}`);
  };
  onCallDelete = async (id) => {
    const response = await instance
      .delete(requests.fetchDeleteCity + `/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .catch((error) => {
        let errorMessage = error.response.data.error.message;
        errorToaster(errorMessage);
      });
    if (response && response.data) {
      successToaster("Record Successfully Deleted");
      this.getCityList();
    }
  };
  render() {
    return (
      <>
        {/* header */}
        {/* <div className="header pt-5 pt-md-8">
          <Container fluid>
            <div >
              
            </div>
          </Container>
        </div> */}

        <Container className="pt-7">
          <Row>
            <div className="col">
              <Card className="shadow">
                <CardHeader className="border-0">
                  <div className="d-flex justify-content-between">
                    <div className="md-7">
                      <h1 className="mb-0">{i18next.t("Cities")}</h1>
                    </div>
                    <div className="md-5">
                      <Row>
                        <Col>
                          <Button
                            color="primary"
                            size="sm"
                            type="button"
                            onClick={this.redirectNewCity}
                          >
                            {i18next.t("Add new City")}
                          </Button>
                        </Col>
                      </Row>
                    </div>
                  </div>
                </CardHeader>
                {/* <TableData 
                  total = {total} 
                  currentPage = {currentPage}
                  datas = {this.state.datas}
                  ColumnHeader = {ColumnHeader}
                  Columdata = {Columdata}
                  Actions = {Actions}
                  //redirectEditCity = {this.redirectEditCity(index + 1, item)}
                  //onCallDelete={this.onCallDelete(item._id)}
                /> */}


                <Table className="align-items-center table-flush" responsive>
                  <thead className="thead-light">
                    <tr>
                      <th scope="col">NAME</th>
                      <th scope="col">SHORT NAME</th>
                      <th scope="col">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {this.state.datas.map((item, index) => (
                      <tr key={index + 1}>
                        <td>{item.city_name}</td>
                        <td>{item.short_code}</td>
                        <td>
                          <Button
                            color="primary"
                            size="sm"
                            type="button"
                            onClick={() =>
                              this.redirectEditCity(index + 1, item)
                            }
                          >
                            {i18next.t("Edit")}
                          </Button>
                          <Button
                            color="danger"
                            size="sm"
                            type="button"
                            onClick={() => this.onCallDelete(item._id)}
                          >
                            {i18next.t("Delete")}
                          </Button>
                        </td>
                      </tr>
                    ))}
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

export default connect(mapStateToProps, mapDispatchToProps)(CityList);
