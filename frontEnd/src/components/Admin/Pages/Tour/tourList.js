
import React from "react";
// react plugin used to create google maps
import i18next from "i18next"
import {
    Card,
    CardHeader,
    Container,
    Row,
    NavLink,
    Nav,
    NavItem,
    TabContent,
    TabPane,
} from "reactstrap";

import classnames from "classnames";

// For Redux Data
import { bindActionCreators } from "redux";
import { ActCreators } from "../../../../redux/bindActionCreator";
import { connect } from "react-redux";

import TourData from "./TourData";

let token = null;


const mapStateToProps = (state) => {
    token = state.token;
};
const mapDispatchToProps = (dispatch) => {
    return bindActionCreators(ActCreators, dispatch);
};
class tourList extends React.Component {
    constructor(props) {
        super(props)

        this.state = {
            tabs: 1,
            datas: [],
            showAddModal: false,
            flagForModal: false,
            flag: false
        }
    }

    componentDidMount = async () => {

    }

    toggleNavs = (e, state, index) => {
        e.preventDefault();
        this.setState({
            [state]: index,
            flag: true
        });
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
                                            <h1 className="mb-0">{i18next.t("Tour Management")}</h1>
                                        </div>
                                        <div className="md-5">
                                            {/* <Row>
                                                <Col>
                                                    <Button color="primary" size="sm" type="button"
                                                        onClick={this.openModal}>
                                                        {i18next.t("Add Tour")}
                                                    </Button>
                                                </Col>
                                            </Row> */}
                                        </div>
                                    </div>
                                    <br />

                                </CardHeader>
                                <CardHeader className="border-0">
                                    <div className="md-5 ">
                                        <Nav
                                            // className="nav-fill flex-column flex-md-row tabbable sticky "
                                            className="nav-fill flex-column flex-md-row "
                                            id="tabs-icons-text"
                                            pills
                                            role="tablist"
                                        >
                                            <NavItem>
                                                <NavLink
                                                    aria-selected={this.state.tabs === 1}
                                                    className={classnames("mb-sm-3 mb-md-0", {
                                                        active: this.state.tabs === 1,
                                                    })}
                                                    onClick={(e) => this.toggleNavs(e, "tabs", 1)}
                                                    href="#pablo"
                                                    role="tab"
                                                >
                                                    {("Tour For Restaurant")}
                                                </NavLink>
                                            </NavItem>
                                            <NavItem>
                                                <NavLink
                                                    aria-selected={this.state.tabs === 2}
                                                    className={classnames("mb-sm-3 mb-md-0", {
                                                        active: this.state.tabs === 2,
                                                    })}
                                                    onClick={(e) => this.toggleNavs(e, "tabs", 2)}
                                                    href="#pablo"
                                                    role="tab"
                                                >
                                                    {i18next.t("Tour For Outlet ")}
                                                </NavLink>
                                            </NavItem>
                                            <NavItem>
                                                <NavLink
                                                    aria-selected={this.state.tabs === 3}
                                                    className={classnames("mb-sm-3 mb-md-0", {
                                                        active: this.state.tabs === 3,
                                                    })}
                                                    onClick={(e) => this.toggleNavs(e, "tabs", 3)}
                                                    href="#pablo"
                                                    role="tab"
                                                >

                                                    {i18next.t("Tour For Aggregator")}
                                                </NavLink>
                                            </NavItem>
                                        </Nav>
                                    </div>
                                    <br />

                                </CardHeader>
                                <TabContent
                                    activeTab={this.state.tabs}
                                    sm={12}
                                    md={12}
                                    xl={12}
                                    xs={12}
                                >
                                    <TabPane tabId={1}>
                                        {
                                            this.state.tabs === 1 &&
                                            <TourData
                                                userType="owner"
                                                is_outlet={false}
                                            />
                                        }

                                    </TabPane>
                                    <TabPane tabId={2}>
                                        {
                                            this.state.tabs === 2 &&
                                            <TourData
                                                userType="owner"
                                                is_outlet={true}
                                            />

                                        }

                                    </TabPane>
                                    <TabPane tabId={3}>
                                        {
                                            this.state.tabs === 3 &&
                                            <TourData
                                                userType="driver_aggregator"
                                            />
                                        }

                                    </TabPane>
                                </TabContent>

                            </Card>
                        </div>
                    </Row>
                </Container>

            </>
        );
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(tourList);
