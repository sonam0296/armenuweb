
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

import { errorToaster, successToaster } from "../../../common/common-validation/common";

// React Moment
import Moment from "react-moment";

import AddUpdateTour from "./AddUpdateTour";


let token = null;

const mapStateToProps = (state) => {
    token = state.token;
};
const mapDispatchToProps = (dispatch) => {
    return bindActionCreators(ActCreators, dispatch);
};
class TourData extends React.Component {
    constructor(props) {
        super(props)

        this.state = {
            datas: [],
            showAddModal: false,
            flagForModal: false,
            Status: "",
            selectedTour: {}
        }
    }

    openModal = (status, item) => {
        this.setState({
            Status: status,
            selectedTour: item,
            flagForModal: true,
            showAddModal: true
        })
    }

    handleCloseModal = () => {
        this.setState({
            flagForModal: false,
            showAddModal: false,
        });
    };

    //   driversRegistration = () => {
    //       const {history} = this.props;
    //       if (history) history.push('/drivers/create')
    //   };

    //   handlePageNext = () => {
    //     const { currentPage } = this.state;
    //     this.setState({ currentPage: currentPage + 1 }, () => {
    //       this.getDriverList();
    //     });
    //   };

    //   handlePagePrev = () => {
    //     const { currentPage } = this.state;
    //     this.setState({ currentPage: currentPage - 1 }, () => {
    //       this.getDriverList();
    //     });
    //   };

    //   handlePageNum = (num) => {
    //     this.setState({ currentPage: num }, () => {
    //       this.getDriverList();
    //     });
    //   };

    onCallDelete = async (id) => {

        const response = await instance
            .delete(requests.fetchDeleteTourForAdmin + `/${id}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })
            .catch((error) => {
                let errorMessage = error.response.data.error.message;
                errorToaster(errorMessage);
            });
        if (response && response.data) {
            successToaster("Record Successfully Deleted!");
            this.getTourDetail()
        }
    };

    getTourDetail = async () => {
        let userType = this.props.userType;
        let is_outlet = this.props.is_outlet;
        let bodyAPI = {};
        if (userType === "owner") {
            bodyAPI = {
                "userType": userType,
                "is_outlet": is_outlet
            }
        } else {
            bodyAPI = {
                "userType": userType,
            }
        }

        const response = await instance
            .post(requests.fetchGetTourForAdmin, bodyAPI, {
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
                datas: response.data.data.tourData,
            });
        }
    }

    componentDidMount = async () => {
        this.getTourDetail();
    }
    render() {
        let userType = this.props.userType
        return (
            <>
                {/* header */}
                <Container className="pt-3" fluid>
                    <Row>
                        <div className="col">
                            <Card className="shadow">
                                <CardHeader className="border-0">
                                    <div className="d-flex justify-content-between">
                                        <div className="md-7">
                                            <h3 className="mb-0">
                                                {
                                                    userType === "owner" ?
                                                        i18next.t("Restaurant Tour")
                                                        :
                                                        i18next.t("Aggregator Tour")
                                                }
                                            </h3>
                                        </div>
                                        <div className="md-5">
                                            <Row>
                                                <Col>
                                                    <Button color="primary" size="sm" type="button"
                                                        onClick={() => this.openModal("Add")}>
                                                        {
                                                            userType === "owner" ?
                                                                i18next.t("Add Tour For Restaurant")
                                                                :
                                                                i18next.t("Add Tour For Aggregator")
                                                        }
                                                    </Button>
                                                </Col>
                                            </Row>
                                        </div>
                                    </div>
                                    <br />
                                </CardHeader>
                                <Table className="align-items-center table-flush" responsive>
                                    <thead className="thead-light">
                                        <tr>
                                            <th scope="col">INDEX</th>
                                            <th scope="col">TITLE</th>
                                            {/* <th scope="col">CONTENT</th> */}
                                            <th scope="col">CREATION DATE</th>
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
                                                        {item.title}
                                                    </td>
                                                    {/* <td>
                                                        {item.content}
                                                    </td> */}
                                                    <td>
                                                        <Moment format="Do MMM YYYY, hh:mm">
                                                            {item.createdAt}
                                                        </Moment>
                                                    </td>
                                                    <td>
                                                        <Button
                                                            color="primary"
                                                            size="sm"
                                                            type="button"
                                                            onClick={() => this.openModal("Edit", item)}
                                                        >
                                                            {i18next.t("Edit")}
                                                        </Button>
                                                        <Button
                                                            color="danger"
                                                            size="sm"
                                                            type="button"
                                                            onClick={() => { if (window.confirm('Are you sure you want to delete this record?')) { this.onCallDelete(item._id) } }}
                                                        >
                                                            {i18next.t("Delete")}
                                                        </Button>
                                                    </td>
                                                </tr>
                                            )}
                                    </tbody>
                                </Table>
                            </Card>
                        </div>
                    </Row>
                </Container>

                {
                    this.state.flagForModal === true &&
                    <AddUpdateTour
                        status={this.state.Status}
                        selectedTour={this.state.selectedTour}
                        show={this.state.showAddModal}
                        onClose={this.handleCloseModal}
                        userType={this.props.userType}
                        is_outlet={this.props.is_outlet}
                        getTourDetail={this.getTourDetail}
                    />
                }

            </>
        );
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(TourData);
