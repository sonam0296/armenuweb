import {
  CardElement,
  Elements,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';

import { loadStripe } from '@stripe/stripe-js';

import React, { Component } from "react";
import axios from "axios";
//reactstrap
import {
  Button,
  Modal,
  FormGroup,
  Input,
  Card,
  CardBody,
  Label,
} from "reactstrap";

// For Notification
import { errorToaster, successToaster } from "../../common-validation/common";


import i18next from "i18next"

// For Redux Data
import { bindActionCreators } from "redux";
import { ActCreators } from "../../../../redux/bindActionCreator";
import { connect } from "react-redux";

import CheckoutForm from "../Stripe/CheckoutForm"

let userData = {};

const mapStateToProps = (state) => {
  userData = state.userData;
};

const mapDispatchToProps = (dispatch) => {
  return bindActionCreators(ActCreators, dispatch);
};

export class PaymentModal extends Component {
  constructor(props) {
    super(props);
    this.state = {

    };
  }

  TempDataStoreInRedux = (token, UserData) => {
    this.props.LOGIN_USER_DETAIL(UserData);
    this.props.TOKEN_KEY(token);
    this.props.TEMP_USER_DATA({})
    this.props.TEMP_TOKEN(null)
    let Greetings = {
      status: true,
      completedStatus: "0%"
    }
    this.props.STORE_GREETINGS_INFORMATION(Greetings);
  }
  componentDidMount = async () => {

  }

  handleSelectChange = (e, data) => {
    this.setState({
      [data.name]: data.value,
    });
  };

  oncloseModal = () => {
    this.props.onClose();
  };

  handleChange = (e) => {
    this.setState(
      {
        [e.target.name]: e.target.value,
      });
  };


  render() {
    return (
      <>
        <Modal className="modal-dialog-centered" isOpen={this.props.show}>
          <div className="modal-header">
            <h5 className="modal-title" id="exampleModalLabel">
              {i18next.t("Subscribe Your Plan...")}
            </h5>
            <button
              aria-label="Close"
              className="close"
              data-dismiss="modal"
              type="button"
              onClick={this.oncloseModal}
            >
              <span aria-hidden={true}>×</span>
            </button>
          </div>
          <div className="modal-body p-0">
            <Card className="bg-secondary shadow border-0">
              <CardBody className="p-lg-5">
                <FormGroup>
                  <Elements stripe={loadStripe(process.env.REACT_APP_STRIPE_PUBLIC_KEY)}>
                    <CheckoutForm
                      TempDataStoreInRedux={this.TempDataStoreInRedux}
                      props={this.props}
                    />
                  </Elements>
                </FormGroup>
              </CardBody>
            </Card>
          </div>
        </Modal>
      </>
    );
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(PaymentModal);



