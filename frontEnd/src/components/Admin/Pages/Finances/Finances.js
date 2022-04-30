import React from "react";
// react plugin used to create google maps

import {
  Container,
} from "reactstrap";

// For Notification
import {errorToaster, successToaster} from "../../../common/common-validation/common";

// For Redux Data
import { bindActionCreators } from "redux";
import { ActCreators } from "../../../../redux/bindActionCreator";
import { connect } from "react-redux";
import instance from "../../../../axios";
import requests from "../../../../requests";

// Finance Header
import FinacesHeader from "../../../Headers/FinancesHeader";

let token = null;

const mapStateToProps = (state) => {
  token = state.token;
};
const mapDispatchToProps = (dispatch) => {
  return bindActionCreators(ActCreators, dispatch);
};
class Finances extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      stats:null
    };
  }

  handleSelectChange = (e, data) => {
    this.setState(
      {
        [data.name]: data.value,
      });
  };

  componentDidMount = async () => {
    this.applyFilter();
  };

  applyFilter = async () => {
    let filterData = {
      
    };
    const response = await instance
      .post(requests.fetchFinanceOrder, filterData, {
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
        stats: response.data.data.result[0].stats[0],
      });
    }
  };
  render() {
    return (
      <>
        {/* <Header /> */}
        
        {/* Page content */}
        <Container className="pt-7" fluid>
          <FinacesHeader state={this.state.stats} />
        </Container>
      </>
    );
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(Finances);
