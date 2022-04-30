import React, { Component } from 'react';

import {
  Table,
} from "reactstrap";

import { errorToaster, successToaster } from "../../../common/common-validation/common";

// for Redux
import { bindActionCreators } from "redux";
import { ActCreators } from "../../../../redux/bindActionCreator";
import { connect } from "react-redux";

// for api integration
import instance from "../../../../axios";
import requests from "../../../../requests";

let token = null;


const mapStateToProps = (state) => {
  token = state.token;
};

const mapDispatchToProps = (dispatch) => {
  return bindActionCreators(ActCreators, dispatch);
};

class UpdateDishOutlet extends Component {
  constructor(props) {
    super(props);
    this.state = {
      datas: undefined,
      currentPage: 1,
      total: undefined,
    }

  }
  handleChange = async (e, index, item) => {
    const name = e.target.name;
    const value = e.target.checked;

    let bodyAPI = {
      "dish_id": this.props.dish_id,
      "outlet_id": item.outlet_id._id,
      "item_available": value
    }
    const response = await instance.post(requests.fetchUpdateMenuAvailability, bodyAPI, {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    }).catch((error) => {
      let errorMessage = error.response.data.error.message;
      errorToaster(errorMessage)
    });
    if (response && response.data) {
      successToaster("Outlets successfully updated");
      this.getOutlets();
    }
  }

  getOutlets = async () => {
    let API = requests.fetchDishOutlet
    const body = {
      dish_id: this.props.dish_id,
      // pageno: this.state.currentPage,
      // perpage: 10,
    };
    const response = await instance
      .post(API, body, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .catch((error) => {
        let errorMessage = error.response.data.error.message;
        errorToaster(errorMessage);
        console.log(errorMessage);
        this.setState({ Loader: false });
      });
    if (response && response.data) {
      //this.props.GET_RESTAURANT_DEATIL_ADMIN(response.data.data.Restaurants);
      this.setState(
        {
          datas: response.data.data.outlets,
          // total: response.data.data.total,
          // currentPage: response.data.data.page,
        }
      );
    }
  };

  componentDidMount() {
    this.getOutlets();
  }


  render() {
    const { datas, total, currentPage } = this.state;
    
    if (datas) {
      return (
        <Table className="align-items-center" responsive>
          <thead className="thead-light">
            <tr>
              <th>NAME</th>
              <th>Location</th>
              <th>Available </th>
            </tr>
          </thead>
          <tbody>
            {
              this.state.datas.map((item, index) => {
                if (item.outlet_id) {
                  return (
                    <tr>
                      <td>{item.outlet_id.restaurant_Name}</td>
                      <td>
                        {
                          item.outlet_id.address.length > 0 ? item.outlet_id.address[0].user_address : ""
                        }
                        {" "}
                        {item.outlet_id.hasOwnProperty("restaurant_city") ? ", " + item.outlet_id.restaurant_city.city_name : ""}

                      </td>
                      <td>
                        <label className="custom-toggle">
                          {item.item_available === true ? (
                            <input
                              defaultChecked
                              type="checkbox"
                              name="item_available"
                              onChange={(e) => { this.handleChange(e, index, item) }}
                            />
                          ) : (
                              <input
                                type="checkbox"
                                name="item_available"
                                onChange={(e) => { this.handleChange(e, index, item) }}
                              />
                            )}
                          <span className="custom-toggle-slider rounded-circle" />
                        </label>
                      </td>
                    </tr>
                  )
                }

              })
            }
          </tbody>
        </Table>
      );
    }
    else {
      return (
        <p>No data found</p>
      )
    }

  }
}

export default connect(mapStateToProps, mapDispatchToProps)(UpdateDishOutlet);