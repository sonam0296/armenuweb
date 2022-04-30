import React, { useState } from "react";
import {

  Row,
  Col,
  Button,

} from "reactstrap";


import i18next from "i18next";

import PreparedMode from "./OwnerOrderDetail/PreparedMode";
import AssignToDriver from "./AssignToDriver";

// For Notification
import { errorToaster, successToaster } from "../../common/common-validation/common";

// For Redux Data
import { bindActionCreators } from "redux";
import { ActCreators } from "../../../redux/bindActionCreator";
import { connect } from "react-redux";
import instance from "../../../axios";
import requests from "../../../requests";



let token = null;
let userData = {};

const mapStateToProps = (state) => {
  token = state.token;
  userData = state.userData;
};
const mapDispatchToProps = (dispatch) => {
  return bindActionCreators(ActCreators, dispatch);
};


class DeliveryAction extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      prepareShow: false,
      AssignDriverModal: false,
      AssignDriverModalFlag: false,
      driverData: [],
    };
  }


  getAllDriver = async () => {
    const response = await instance.get(requests.fetchGetAllDriverForOwner, {
      headers: {
        Authorization: `Bearer ${token}`,
      }
    })
      .catch((error) => {
        let errorMessage = error.response.data.error.message;
        console.log(errorMessage);
        errorToaster(errorMessage);
      });

    if (response && response.data) {
      this.setState({ driverData: response.data.data })
    }
  }

  componentDidMount = () => {

  }

  handleModalP = () => {
    this.setState({ prepareShow: true });
  };

  prepareClose = () => {
    this.setState({ prepareShow: false });
  };

  handleModalA = () => {
    this.getAllDriver();
    this.setState({
      AssignDriverModalFlag: true,
      AssignDriverModal: true
    });
  };

  AssignDriverClose = () => {
    this.setState({ AssignDriverModal: false });
  };

  render() {
    if (userData.userType === "owner") {
      if ((this.props.delivery_status === "Pending" && this.props.last_status === "Accepted by Restaurant") || 
      (this.props.delivery_status === "Pending" && this.props.last_status === "Prepared"))  {
        if (userData.use_driver_aggregator === true) {
          return (
            <td>
              <Col>
                <Button
                  size="sm"
                  color="primary"
                  type="button"
                  onClick={() => {
                    this.props.handleChangeCallDeliveryStatus(this.props.owner_id, "Assigned to Aggregator")
                  }
                  }
                >
                  {i18next.t("Assign To Aggregator")}
                </Button>
              </Col>
            </td>
          )
        }
        else {
          return (
            <>
              <td>
                <Col>
                  <Button
                    size="sm"
                    color="primary"
                    type="button"
                    onClick={this.handleModalA}
                  >
                    {i18next.t("Assigned to Driver")}
                  </Button>

                  <Button
                    size="sm"
                    color="primary"
                    type="button"
                    onClick={() => this.props.handleChangeCallDeliveryStatus(
                      this.props.owner_id,
                      "Broadcast to Drivers",
                      userData._id
                    )}
                  >
                    {i18next.t("Broadcast to Drivers")}
                  </Button>
                </Col>
                <AssignToDriver
                  onshow={this.state.AssignDriverModal}
                  onClose={this.AssignDriverClose}
                  passData={this.props.handleChangeCallDeliveryStatus}
                  id={this.props.owner_id}
                  driverData={this.state.driverData}
                />
              </td>
            </>
          )
        }
      }
      else if (this.props.delivery_status === "Assigned to Aggregator") {
        return (
          <>
            <td>
              {i18next.t("No actions for you right now!")}
            </td>
          </>
        )
      }
      else if (this.props.delivery_status === "Accepted by Driver") {
        return (
          <td>
            <Button
              size="sm"
              color="primary"
              type="button"
              onClick={
                this.props.detailsPage == true
                  ? this.handleModalP
                  : () => {
                    this.props.onActionMethod(
                      this.props.owner_id,
                      "Picked Up",
                      null
                    );
                  }
              }
            >
              {i18next.t("Picked Up")}
            </Button>
          </td>
        )
      }
      else if(this.props.delivery_type==="Pickup" && this.props.delivery_status === "Picked Up" ){
        return(
          <>
            <td>
              {i18next.t("No actions for you right now!")}
            </td>
          </>
        )
      }
      else {
        return (
          <>
            <td>
              {i18next.t("No actions for you right now!")}
            </td>
          </>
        )
      }
    }
    else if (userData.userType === "driver_aggregator") {
      if (this.props.delivery_status === "Assigned to Aggregator") {
        return (
          <>
            <td>
              <Col>
                <Button
                  size="sm"
                  color="primary"
                  type="button"
                  onClick={this.handleModalA}
                >
                  {i18next.t("Assigned to Driver")}
                </Button>

                <Button
                  size="sm"
                  color="primary"
                  type="button"
                  onClick={() => this.props.handleChangeCallDeliveryStatus(
                    this.props.owner_id,
                    "Broadcast to Drivers",
                    userData._id
                  )}
                >
                  {i18next.t("Broadcast to Drivers")}
                </Button>
              </Col>
              <AssignToDriver
                onshow={this.state.AssignDriverModal}
                onClose={this.AssignDriverClose}
                passData={this.props.handleChangeCallDeliveryStatus}
                id={this.props.owner_id}
                driverData={this.state.driverData}
              />
            </td>
          </>
        )
      }
      else {
        return (
          <>
            <td>
              {i18next.t("No actions for you right now!")}
            </td>
          </>
        )
      }
    }
    else if (userData.userType === "driver") {
      if (this.props.delivery_status === "Broadcast to Drivers") {
        return (
          <td>
            <Button
              size="sm"
              color="primary"
              type="button"
              onClick={
                this.props.detailsPage == true
                  ? this.handleModalP
                  : () => {
                    this.props.onActionMethod(
                      this.props.owner_id,
                      "Accepted by Driver",
                      userData._id
                    );
                  }
              }
            >
              {i18next.t("Accept")}
            </Button>
          </td>
        )
      }
      else if (this.props.delivery_status === "Assigned to Driver" && this.props.last_status === "Accepted by Restaurant") {
        return (
          <td class="table-web">
            <span class="badge badge-warning badge-pill">
              {i18next.t("Waiting for Prepared")}
            </span>
          </td>
        )
      }
      else if (this.props.delivery_status === "Accepted by Driver" || this.props.delivery_status === "Assigned to Driver") {
        return (
          <td>
            <Button
              size="sm"
              color="primary"
              type="button"
              onClick={
                this.props.detailsPage == true
                  ? this.handleModalP
                  : () => {
                    this.props.handleChangeCallDeliveryStatus(
                      this.props.owner_id,
                      "Picked Up",
                      null
                    );
                  }
              }
            >
              {i18next.t("Picked Up")}
            </Button>
          </td>
        )
      }
      else if (this.props.delivery_status === "Picked Up") {
        return (
          <td>
            <Button
              size="sm"
              color="success"
              type="button"
              onClick={
                this.props.detailsPage == true
                  ? this.handleModalP
                  : () => {
                    this.props.handleChangeCallDeliveryStatus(
                      this.props.owner_id,
                      "Delivered",
                      userData._id
                    );
                  }
              }
            >
              {i18next.t("Delivered")}
            </Button>
          </td>
        )
      }
      else {
        return (
          <>
            <td>
              {i18next.t("No actions for you right now!")}
            </td>
          </>
        )
      }
    }
    else {
      return (
        <>
          <td>
            {i18next.t("No actions for you right now!")}
          </td>
        </>
      )
    }


    //else if(this.props.last_status === "Prepared" &&
    // this.props.delivery_type === "Deliver"){
    //   if(userData.userType==="owner"){
    //     if(userData.use_driver_aggregator === true){
    //       return(
    //         <td>
    //           <Col>
    //             {/* <Button
    //               size="sm"
    //               color="primary"
    //               type="button"
    //               onClick={() =>
    //                 this.props.handleAssignedToAggregator(this.props.owner_id, "Assigned to Aggregator")
    //               }
    //             >
    //               {i18next.t("Assign To Aggregator")}
    //             </Button> */}
    //           </Col>
    //         </td>
    //       )
    //     }else{
    //       return (
    //         <>
    //           <td>
    //           <Col>
    //             <Button
    //               size="sm"
    //               color="primary"
    //               type="button"
    //               onClick={this.handleModalA}
    //             >
    //               {i18next.t("Manully Assign Driver")}
    //             </Button>

    //             <Button
    //               size="sm"
    //               color="primary"
    //               type="button"
    //               //onClick={this.handleModalA}
    //             >
    //               {i18next.t("Send Notification To All Driver")}
    //             </Button>
    //           </Col>
    //           <AssignToDriver
    //             onshow={this.state.AssignDriverModal}
    //             onClose={this.AssignDriverClose}
    //             passData={this.props.onActionMethod}
    //             id={this.props.owner_id}
    //             driverData={this.state.driverData}
    //           />
    //           </td>
    //         </>
    //       )
    //     }
    //   }else{
    //     return(
    //       <>
    //         <td>
    //           {i18next.t("No actions for you right now!")}
    //         </td>
    //       </>
    //     )
    //   } 
    // }
    // else if(userData.userType==="driver"){
    //   if(this.props.last_status === "Assigned to Aggregator"){
    //     return(
    //       <td>
    //         <Button
    //           size="sm"
    //           color="primary"
    //           type="button"
    //           onClick={
    //             this.props.detailsPage == true
    //               ? this.handleModalP
    //               : () => {
    //                   this.props.onActionMethod(
    //                     this.props.owner_id,
    //                     "Accepted by Driver", 
    //                     userData._id
    //                   );
    //                 }
    //           }
    //         >
    //           {i18next.t("Accept")}
    //         </Button>
    //       </td>
    //     )
    //   }
    //   else if(this.props.last_status === "Accepted by Driver"){
    //     return(
    //       <td>
    //         <Button
    //           size="sm"
    //           color="success"
    //           type="button"
    //           onClick={
    //             this.props.detailsPage == true
    //               ? this.handleModalP
    //               : () => {
    //                   this.props.onActionMethod(
    //                     this.props.owner_id,
    //                     "Delivered", 
    //                     userData._id
    //                   );
    //                 }
    //           }
    //         >
    //           {i18next.t("Delivered")}
    //         </Button>
    //       </td>
    //     )
    //   }
    //   else if(this.props.last_status === "Delivered" ){
    //     return(
    //       <>
    //         <td>
    //           {i18next.t("No actions for you right now!")}
    //         </td>
    //       </>
    //     ) 
    //   }
    //   else{
    //     return(
    //       <>
    //         <td>
    //           {i18next.t("No actions for you right now!")}
    //         </td>
    //       </>
    //     )
    //   }
    // }
    // else{
    //   return(
    //     <>
    //       <td>
    //         {i18next.t("No actions for you right now!")}
    //       </td>
    //     </>
    //   )
    // }

    // return (
    //   <>
    //     <td>
    //       {
    //         this.props.last_status === "Just Created" 
    //         ? (
    //             <>
    //               <Row>
    //                 <Col>
    //                   <Button
    //                     size="sm"
    //                     color="success"
    //                     type="button"
    //                     onClick={
    //                       this.props.detailsPage == true
    //                         ? this.handleModalP
    //                         : () => {
    //                             this.props.onActionMethod(
    //                               this.props.owner_id,
    //                               "Accepted by Restaurant", 
    //                               null
    //                             );
    //                           }
    //                     }
    //                   >
    //                     {i18next.t("Accept")}
    //                   </Button>
    //                 </Col>
    //                 <Col>
    //                   <Button
    //                     size="sm"
    //                     color="danger"
    //                     type="button"
    //                     onClick={() =>
    //                       this.props.onActionMethod(
    //                         this.props.owner_id,
    //                         "Rejected by Restaurant", null
    //                       )
    //                     }
    //                   >
    //                     {i18next.t("Reject")}
    //                   </Button>
    //                 </Col>
    //               </Row>
    //               <PreparedMode
    //                 onshow={this.state.prepareShow}
    //                 onClose={this.prepareClose}
    //                 id={this.props.owner_id}
    //                 passData={this.props.onActionMethod}
    //               />
    //             </>
    //           ) 
    //         : 
    //           this.props.last_status === "Rejected by Restaurant" 
    //           ? 
    //             (
    //               i18next.t("No actions for you right now!")
    //             ) 
    //           : 
    //             this.props.last_status === "Accepted by Restaurant" 
    //             ? 
    //               (
    //                 <>
    //                   <Col>
    //                     <Button
    //                       size="sm"
    //                       color="primary"
    //                       type="button"
    //                       onClick={() =>
    //                         this.props.onActionMethod(this.props.owner_id, "Prepared", null)
    //                       }
    //                     >
    //                       {i18next.t("Prepared")}
    //                     </Button>
    //                   </Col>
    //                 </>
    //               ) 
    //             : 
    //               this.props.last_status === "Prepared" &&
    //                 this.props.is_delivery === false 
    //                 ? 
    //                   (
    //                     <>
    //                       <Col>
    //                         <Button
    //                           size="sm"
    //                           color="primary"
    //                           type="button"
    //                           onClick={() =>
    //                             this.props.onActionMethod(this.props.owner_id, "Delivered")
    //                           }
    //                         >
    //                           {i18next.t("Delivered")}
    //                         </Button>
    //                       </Col>
    //                     </>
    //                   ) 
    //                 : 
    //                   this.props.last_status === "Prepared" &&
    //                   this.props.is_delivery === true 
    //                   ?
    //                     userData.use_driver_aggregator ===false 
    //                     ?
    //                       (
    //                         <>
    //                           <Col>
    //                             <Button
    //                               size="sm"
    //                               color="primary"
    //                               type="button"
    //                               onClick={this.handleModalA}
    //                             >
    //                               {i18next.t("Assign Driver")}
    //                             </Button>
    //                           </Col>
    //                           <AssignToDriver
    //                             onshow={this.state.AssignDriverModal}
    //                             onClose={this.AssignDriverClose}
    //                             passData={this.props.onActionMethod}
    //                             id={this.props.owner_id}
    //                             driverData={this.state.driverData}
    //                           />
    //                         </>
    //                       )
    //                     :
    //                       (
    //                         <Col>
    //                             <Button
    //                               size="sm"
    //                               color="primary"
    //                               type="button"
    //                               onClick={() =>
    //                                 this.props.handleAssignedToAggregator(this.props.owner_id, "Assigned to Aggregator")
    //                               }
    //                             >
    //                               {i18next.t("Assign To Aggregator")}
    //                             </Button>
    //                           </Col>
    //                       )
    //                   : 
    //                     this.props.last_status === "Assigned to Aggregator"
    //                     ? (
    //                         <Button
    //                           size="sm"
    //                           color="success"
    //                           type="button"
    //                           onClick={
    //                             this.props.detailsPage == true
    //                               ? this.handleModalP
    //                               : () => {
    //                                   this.props.onActionMethod(
    //                                     this.props.owner_id,
    //                                     "Accepted by Driver", 
    //                                     null
    //                                   );
    //                                 }
    //                           }
    //                         >
    //                           {i18next.t("Accept")}
    //                         </Button>
    //                       )
    //                     :
    //                     this.props.last_status === "Delivered" 
    //                     && 
    //                       (
    //                         i18next.t("No actions for you right now!")
    //                       ) 
    //       }
    //     </td>

    //     <td>
    //       {

    //       }
    //     </td>
    //   </>
    // );
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(DeliveryAction);
