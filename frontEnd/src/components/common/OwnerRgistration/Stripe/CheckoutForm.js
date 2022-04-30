import React from 'react';
import { ElementsConsumer, CardElement } from '@stripe/react-stripe-js';

import i18next from "i18next";
import {
  Card,
  CardBody,
  Label,
  FormGroup,
} from "reactstrap";

// for notification
import { errorToaster, successToaster } from "../../common-validation/common";

// for redux
import { bindActionCreators } from "redux";
import { ActCreators } from "../../../../redux/bindActionCreator";
import { connect } from "react-redux";

import { Link, Redirect } from 'react-router-dom'

import instance from "../../../../axios";
import requests from "../../../../requests";
import Row from 'reactstrap/lib/Row';
import Col from 'reactstrap/lib/Col';

let tempUserData = {};
let selectedPlan = {};
let tempToken = null;


const mapStateToProps = state => {
  tempUserData = state.tempUserData;
  selectedPlan = state.selectedPlan;
  tempToken = state.tempToken;

};

const mapDispatchToProps = dispatch => {
  return bindActionCreators(ActCreators, dispatch)
}

class CheckoutForm extends React.Component {
  constructor(...props) {
    super(...props)

    this.state = {
      SubscriptionStatus: false,
      visible: false,
      paymentMethodId: "",
      waitingStatus: false
    }
  }
  onDismiss = () => {
    this.setState({
      visible: !this.state.visible
    })
  }

  onCallRegistration = async (paymentMethodId) => {
    const response = await instance
      .post(requests.fetchRestuarantRegistration, tempUserData)
      .catch((error) => {
        let errorMessage = error.response.data.error.message;
        errorToaster(errorMessage);
        console.log(errorMessage);
      });
    if (response && response.data) {
      let userdata = response.data.data.user;
      this.props.TEMP_USER_DATA(userdata);
      let tempToken = response.data.data.token;
      this.props.TEMP_TOKEN(tempToken);
      this.createSubscription(paymentMethodId);
    }
  }

  handleSubmit = async (event) => {


    // Block native form submission.
    event.preventDefault();
    const { stripe, elements } = this.props;
    if (!stripe || !elements) {
      // Stripe.js has not loaded yet. Make sure to disable
      // form submission until Stripe.js has loaded.
      return;
    } 

    // Get a reference to a mounted CardElement. Elements knows how
    // to find your CardElement because there can only ever be one of
    // each type of element.
    const cardElement = elements.getElement(CardElement);

    let name=tempUserData.userType==="owner" ? tempUserData.restaurant_Name : tempUserData.name;

    this.setState({
      waitingStatus:true
    })
    const { error, paymentMethod } = await stripe.createPaymentMethod({
      type: 'card',
      card: cardElement,
      billing_details: {
        name: `${name}`,
        email: `${tempUserData.email}`
      }
    });

    if (error) {
      console.log('[error]', error);
      errorToaster(error.message)
      this.setState({
        waitingStatus: false
      })
    } else {
      const paymentMethodId = paymentMethod.id;
      this.onCallRegistration(paymentMethodId);

      //this.createSubscription(paymentMethodId);
    }
  };

  createSubscription = async (paymentMethodId) => {
    let requestBody = {}
    let trial_days = selectedPlan.hasOwnProperty(trial_days) ? selectedPlan.trial_days : null
    if (trial_days === null) {
      requestBody = {
        "plan_id": selectedPlan._id,
        "customer": tempUserData.stripe_customer.id,
        "paymentMethodId": paymentMethodId,
        "price": selectedPlan.stripe_price.id,
      }
    } else {
      requestBody = {
        "plan_id": selectedPlan._id,
        "customer": tempUserData.stripe_customer.id,
        "paymentMethodId": paymentMethodId,
        "price": selectedPlan.stripe_price.id,
        "trial_days": trial_days
      }
    }
    const response = await instance
      .post(requests.fetchSubscribePlan, requestBody, {
        headers: {
          Authorization: `Bearer ${tempToken}`,
        },
      })
      .catch((error) => {
        let errorMessage = error.message;
        errorToaster(errorMessage);
      });
    if (response && response.data) {
      this.props.TempDataStoreInRedux(tempToken, tempUserData)
      this.setState({
        SubscriptionStatus: true,
      }, () => {
        this.setState({
          waitingStatus:false
        })
        successToaster("Subscription successfully done!")
      })
    }
  };

  render() {
    const { stripe } = this.props;
    const { SubscriptionStatus } = this.state;
    if (SubscriptionStatus) {
      return (<Redirect to="/dashboard" />)
    }
    return (
      <>
        {
          <form onSubmit={this.handleSubmit}>
            <Card className="bg-secondary shadow border-0">
              <CardBody className="p-lg-5">
                <FormGroup>
                  <Label>
                    Your subscription will start now...
                  </Label>
                </FormGroup>
                <FormGroup>
                  <div className="display-3">
                    {selectedPlan.title}
                  </div>
                  <div className="display-4" >
                    Total Due Amount: <br />
                    {tempUserData.currencies.symbol} {" "}
                    {selectedPlan.unit_amount} / {" "}{selectedPlan.stripe_price.recurring.interval}
                  </div>
                </FormGroup>
                <FormGroup>
                  <Label for="Name">Enter your card details</Label>
                </FormGroup>
                <FormGroup>
                  <CardElement
                    options={{
                      style: {
                        base: {
                          fontSize: '16px',
                          color: '#424770',
                          '::placeholder': {
                            color: '#aab7c4',
                          },
                        },
                        invalid: {
                          color: '#9e2146',
                        },
                      },
                    }}
                  />
                </FormGroup>
                <FormGroup>
                  {
                    this.state.waitingStatus === false ?
                      <button className="btn btn-outline-success btn-lg" type="submit" disabled={!stripe}>
                        Subscribe Now
                      </button>
                    :
                      <button className="btn btn-success btn-lg" type="submit" >
                        <Row className="">
                          <Col>
                            Subscribing...
                          </Col>
                          <Col>
                            <i class="fa fa-spinner fa-spin"></i>
                          </Col>
                        </Row>
                      </button>
                  }
                </FormGroup>
              </CardBody>
            </Card>
          </form>
        }

      </>
    );
  }
}

function InjectedCheckoutForm({ TempDataStoreInRedux, ...props }) {
  return (
    <ElementsConsumer>
      {({ stripe, elements }) => (
        <CheckoutForm stripe={stripe} elements={elements} TempDataStoreInRedux={TempDataStoreInRedux} {...props} />
      )}
    </ElementsConsumer>
  );
}

export default connect(mapStateToProps, mapDispatchToProps)(InjectedCheckoutForm)
