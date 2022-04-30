import React, { Component } from "react";
import instance from "../../../axios";
import requests from "../../../requests";
// For Notification
import {errorToaster, successToaster} from "../../common/common-validation/common";

import { bindActionCreators } from "redux";
import { ActCreators } from "../../../redux/bindActionCreator";
import { connect } from "react-redux";


let token = null;

const mapStateToProps = (state) => {
  token = state.token;
};
const mapDispatchToProps = (dispatch) => {
  return bindActionCreators(ActCreators, dispatch);
};

export class ConnectStripe extends Component {
  constructor(props) {
    super(props);
    this.state = {
    };
  }

  componentDidMount = async () => {
    let searchParams = this.props.history.location.search; // history.location.search

    const response = await instance
      .get(
          `${requests.fetchConnectStripeOAuth}${searchParams}`
          , {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .catch((error) => {
        let errorMessage = error;
        console.log(errorMessage);
        errorToaster(errorMessage);
      });
    if (response && response.data) {
      const { history } = this.props;
      if (history) {
        history.push("/finance");
      }
    }
  };

  render() {
    return (
      <>
      </>
    );
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(ConnectStripe);
