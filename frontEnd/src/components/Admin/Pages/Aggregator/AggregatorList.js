import React from "react";
// react plugin used to create google maps

import Loader from "../../../common/Loader";
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
import { ActCreators } from "../../../../redux/bindActionCreator";
import { connect } from "react-redux";

// for api integration
import instance from "../../../../axios";
import requests from "../../../../requests";

// for notification
import { errorToaster, successToaster } from "../../../common/common-validation/common";

import Moment from "react-moment";

import ManulPagination from "../../../common/Pagination/Pagination";

let token = null;

const mapStateToProps = (state) => {
    token = state.token;
};

const mapDispatchToProps = (dispatch) => {
    return bindActionCreators(ActCreators, dispatch);
};

class AggregatorList extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            Loader: true,
            datas: undefined,
            currentPage: 1,
            total: undefined,
        };
    }

    getAggregatorDeatil = async () => {
        const body = {
            pageno: this.state.currentPage,
            perpage: 10,
        };
        const response = await instance
            .post(requests.fetchAggregatorDetailsForAdmin, body, {
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
            this.setState(
                {
                    datas: response.data.data.Aggregators,
                    total: response.data.data.total,
                    currentPage: response.data.data.page,
                },
                () => {
                    this.setState({ Loader: false });
                }
            );
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
            this.getAggregatorDeatil();
        }
    };

    componentDidMount = () => {
        this.getAggregatorDeatil();
    };

    aggregatorRegistration = () => {
        const { history } = this.props;
        if (history) history.push("/aggregator/create");
    };

    handlePageNum = (num) => {
        this.setState({ currentPage: num }, () => {
            this.getAggregatorDeatil();
        });
    };

    handleMoveToEditPage = (id, index) => {
        const a_id = { id: id };
        this.props.STORE_AGGREGATOR_ID(a_id);
        const { history } = this.props;
        if (history) {
            history.push(`/aggregator/update/${index}`);
        }
    };

    handlePageNext = () => {
        const { currentPage } = this.state;
        this.setState({ currentPage: currentPage + 1 }, () => {
            this.getAggregatorDeatil();
        });
    };

    handlePagePrev = () => {
        const { currentPage } = this.state;
        this.setState({ currentPage: currentPage - 1 }, () => {
            this.getAggregatorDeatil();
        });
    };

    render() {
        const { datas } = this.state;
        return (
            <>
                {/* <Header /> */}
                {/* Page content */}

                {/* header */}
                <Container className="pt-7" fluid>
                    <Row>
                        <Loader open={this.state.Loader} />
                        <div className="col">
                            <Card className="shadow">
                                <CardHeader className="border-0">
                                    <div className="d-flex justify-content-between">
                                        <div className="md-7">
                                            <h1 className="mb-0">{i18next.t("Aggregator")}</h1>
                                        </div>
                                        <div className="md-5">
                                            <Row>
                                                <Col>
                                                    <Button
                                                        color="primary"
                                                        size="sm"
                                                        type="button"
                                                        onClick={this.aggregatorRegistration}
                                                    >
                                                        {i18next.t("Add New Aggregator")}
                                                    </Button>
                                                </Col>
                                            </Row>
                                        </div>
                                    </div>
                                </CardHeader>
                                <Table className="align-items-center table-flush" responsive>
                                    <thead className="thead-light">
                                        <tr>
                                            <th scope="col">LOGO</th>
                                            <th scope="col">Name</th>
                                            <th scope="col">OWNER EMAIL</th>
                                            <th scope="col">CREATION DATE</th>
                                            <th scope="col">ACTIVE</th>
                                            <th scope="col"></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {this.state.Loader === false &&
                                            datas.map((item, index) => {
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
            </>
        );
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(AggregatorList);
