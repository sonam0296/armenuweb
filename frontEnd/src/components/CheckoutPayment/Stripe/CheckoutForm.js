import React from 'react';
import {ElementsConsumer, CardElement} from '@stripe/react-stripe-js';

import i18next from "i18next";
import CardSection from '../Stripe/CardSection';
import {
  Alert,
} from "reactstrap";

import { errorToaster, successToaster} from "../../common/common-validation/common";

// for redux
import {bindActionCreators} from "redux";
import {ActCreators} from "../../../redux/bindActionCreator";
import {connect} from "react-redux";

import  { Link, Redirect } from 'react-router-dom'

import instance from "../../../axios";
import requests from "../../../requests";

let userData = {};
let orderDetails={};
let client_secret=null;
let stripeUserId=null;
let token=null;

const mapStateToProps = state => {
    userData= state.userData;
    orderDetails=state.orderDetails;
    client_secret=state.client_secret;
    stripeUserId=state.stripeUserId;
    token=state.token
};

const mapDispatchToProps = dispatch => {
    return bindActionCreators(ActCreators, dispatch)
}

class CheckoutForm extends React.Component {
  constructor(props) {
    super(props)
  
    this.state = {
      paymentStatus:false,
      visible:false,
    }
  }
  onDismiss = () => {
    this.setState({
      visible:!this.state.visible
    })
  }
  ClearCart = async () =>{
    const response = await instance
      .delete(requests.fetchDeleteCart,{
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .catch((error) => {
        let errorMessage = error.response.data.error.message;
        errorToaster(errorMessage);
      });
      if (response && response.data) {
        console.log("Cart is Clear");      
      }
    
  }
  handleSubmit = async (event) => {
    // We don't want to let default form submission happen here,
    // which would refresh the page.
    event.preventDefault();

    const {stripe, elements} = this.props

    if (!stripe || !elements) {
      // Stripe.js has not yet loaded.
      // Make  sure to disable form submission until Stripe.js has loaded.
      return;
    }
    // Client Secrete key
    const result = await stripe.confirmCardPayment(`${client_secret}`, {
      payment_method: {
        card: elements.getElement(CardElement),
        billing_details: {
          name: orderDetails.client_name,
          email: userData.email,
        },
      }
    });

    if (result.error) {
      errorToaster(result.error.message);
    } else {
      // The payment has been processed!
      if (result.paymentIntent.status === 'succeeded') {
        successToaster('Payment Successfully Done!');
        this.ClearCart();
        this.setState({
          paymentStatus:true,
          visible:true
        })
        
        // Show a success message to your customer
        // There's a risk of the customer closing the window before callback
        // execution. Set up a webhook or plugin to listen for the
        // payment_intent.succeeded event that handles any business critical
        // post-payment actions.
        
      }
    }
  };

  render() {
    const {paymentStatus} = this.state;
    if(paymentStatus){
      return (<Redirect to="/orders" />)
    }
    return (
      <>
      {
        <form onSubmit={this.handleSubmit}>
          <CardSection /> 
          <br/><br/>
          <center>
          <button
            className="btn btn-outline-success btn-lg"
            disabled={!this.props.stripe}
          >
          
            {i18next.t("Pay")}
          </button>
          <Alert autofocus color="success" isOpen={this.state.visible} toggle={this.onDismiss} >
            {i18next.t("Payment Successfully Done..!")}
          </Alert>        
          </center>
        </form>
      }
      </>
    );
  }
}

function InjectedCheckoutForm() {
  return (
    <ElementsConsumer>
      {({stripe, elements}) => (
        <CheckoutForm  stripe={stripe} elements={elements} />
      )}
    </ElementsConsumer>
  );
}

export default connect(mapStateToProps, mapDispatchToProps) (InjectedCheckoutForm)
