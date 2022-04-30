import React from "react";
// reactstrap components
import {
  
  Container,
  Row,
  Col,
  NavItem,
  Nav,
  NavLink,
  
} from "reactstrap";


import i18next from "i18next";

// For Notification
import {errorToaster, successToaster} from "../common/common-validation/common";
// For Redux Data
import { bindActionCreators } from "redux";
import { ActCreators } from "../../redux/bindActionCreator";
import { connect } from "react-redux";
import classnames from "classnames";
import ShowOrder from "./ShowOrder";

let token = null;
let get_fcm_registration_token = null;
let userData = {};

const mapStateToProps = (state) => {
  token = state.token;
  userData = state.userData;
  get_fcm_registration_token = state.get_fcm_registration_token;
};
const mapDispatchToProps = (dispatch) => {
  return bindActionCreators(ActCreators, dispatch);
};
class LiveOrder extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      maintabs: 1
    };
  }

  toggleNavs = (e, state, index) => {
    e.preventDefault();
    this.setState({
      [state]: index,
    });
  };

  render() {
    return (
      <>
        {/* <Header /> */}
          <Container className="pt-7" fluid>
            <div className="header-body">
              {/* Card stats */}
              <br />
              <br />

              <Row>
                <Col className="pb-3" md={12} lg={12} xl={12} xs={12} sm={12}>
                  <Nav
                    className="nav-fill flex-column flex-md-row"
                    id="tabs-icons-text-1"
                    pills
                    role="tablist"
                  >
                    <NavItem className="p-3">
                      <NavLink
                        aria-selected={this.state.maintabs === 1}
                        className={classnames("mb-sm-3 mb-md-0", {
                          active: this.state.maintabs === 1,
                        })}
                        onClick={(e) => this.toggleNavs(e, "maintabs", 1)}
                        href="#pablo"
                        role="tab"
                      >
                        <i className="ni ni-shop text-info mr-2"></i>
                        {/* <i className="ni ni-cloud-upload-96 mr-2" /> */}
                        {("Pending Orders")}
                      </NavLink>
                    </NavItem>
                    <NavItem className="p-3">
                      <NavLink
                        aria-selected={this.state.maintabs === 2}
                        className={classnames("mb-sm-3 mb-md-0", {
                          active: this.state.maintabs === 2,
                        })}
                        onClick={(e) => this.toggleNavs(e, "maintabs", 2)}
                        href="#pablo"
                        role="tab"
                      >
                        <i className="fas fa-biking text-info mr-2"></i>
                        {i18next.t("Active Orders")}
                      </NavLink>
                    </NavItem>
                  </Nav>
            
                </Col>
              </Row>
            </div>
          </Container>
          <ShowOrder ActiveTab={this.state.maintabs} props={this.props}/>
      </>
    );
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(LiveOrder);
