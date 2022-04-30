
import React from "react";
import { Route, Switch, Redirect } from "react-router-dom";
// reactstrap components
import { Container } from "reactstrap";
// core components
import AdminNavbar from "../Navbars/AdminNavbar.js";
import AdminFooter from "../Footers/AdminFooter.js";
import Sidebar from "../Sidebar/Sidebar.js";

import adminRoutes from "../../routes.js";
import ownerRoutes from "../../ownerRoutes";
import driverRoutes from "../../driverRouts";
import driverAggregatorRoute from "../../driverAggregatorRoute";
import clientsRoutes from "../../clientRouts";
import outletRoutes from "../../outletRoutes";

import {bindActionCreators} from "redux";
import {ActCreators} from "../../redux/bindActionCreator";
import {connect} from "react-redux";

let userData = {};

const mapStateToProps = state => {
  userData= state.userData
};

const mapDispatchToProps = dispatch => {
  return bindActionCreators(ActCreators, dispatch)
};


class Admin extends React.Component {
  componentDidUpdate(e) {
    document.documentElement.scrollTop = 0;
    document.scrollingElement.scrollTop = 0;
    this.refs.mainContent.scrollTop = 0;
  }
  getRoutes = routes => {
    return routes.map((prop, key) => {
      return (
          <Route
            path={prop.path}
            component={prop.component}
            key={key}
          />
        );
    });
  };
  getBrandText = (path,routes) => {
    for (let i = 0; i < routes.length; i++) {
      if (
        this.props.location.pathname.indexOf(routes[i].path) !== -1
      ) {
        return routes[i].name;
      }
    }
    return "Brand";
  };
  render() {
    let routes=adminRoutes;
    if(userData.userType==='admin'){
      routes=adminRoutes
    }else if(userData.userType==='owner'){
      userData.is_outlet === true ? routes=outletRoutes 
        : routes=ownerRoutes;
    }else if(userData.userType==='driver'){
      routes=driverRoutes;
    }else if (userData.userType==='driver_aggregator'){
      routes=driverAggregatorRoute;
    }else{
      routes=clientsRoutes;
    }
    return (
      <>
        <Sidebar
          {...this.props}
          routes={routes}
          logo={{
            innerLink: "/dashboard",
            imgSrc: require("assets/img/brand/argon-react.png"),
            imgAlt: "..."
          }}
        />
        <div className="main-content" ref="mainContent">
          <AdminNavbar
            {...this.props}
            brandText={this.getBrandText(this.props.location.pathname,routes)}
          />
          <Switch>
            {this.getRoutes(routes)}
            <Redirect from="*" to="/dashboard" />
          </Switch>
          <Container fluid>
            <AdminFooter />
          </Container>
        </div>
      </>
    );
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(Admin);
