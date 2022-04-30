import React from "react";

import {errorToaster, successToaster} from "../common-validation/common";

import {
    Card,
    CardHeader,
    CardBody,
    CardTitle,
    CardText,
    Container,
    Row,
    Col,
    Button,
} from "reactstrap";
import HomeHeader from "../header/HomeHeader";
import instance from "../../../axios";
import requests from "../../../requests";

import 'react-phone-input-2/lib/bootstrap.css'
import i18next from "i18next";

//for Redux
import { bindActionCreators } from "redux";
import { ActCreators } from "../../../redux/bindActionCreator";
import { connect } from "react-redux";

import { CardFooter } from "reactstrap/es";
import HomeFooter from "components/Footers/HomeFooter";

import restaurant_cover_image from "../../../assets/img/theme/Food-2.jpg"

import "./StripePlan.css"

let userData = {};

const mapStateToProps = (state) => {
  userData = state.userData;
};

const mapDispatchToProps = (dispatch) => {
  return bindActionCreators(ActCreators, dispatch);
};
class StripePlan extends React.Component {

    constructor(props) {
        super(props)

        this.state = {
            plans:[],
            flagPaymentModalShow:false,
            paymentModalShow:false,
            plan_id:"",
            price:"",
            trial_days:"",
            selectedPlan:{},
            interval:"",
        }
    }

    getPlan = async () => {
        let apiBody = {
            "country":"india"
        };
        const response = await instance
        .post(requests.fetchPlan, apiBody)
        .catch((error) => {
            let errorMessage = error.message;
            errorToaster(errorMessage);
        });
        if(response && response.data) {
            this.setState({
                plans: response.data.data.length > 0 ? response.data.data[0].data : []
            }) 
        }
    }
    componentDidMount () {
        this.getPlan();
    }

    handleChange(e) {
        this.setState({
            [e.target.name]: e.target.value
        })
    };

    selectPlan (selectedPlan) {
        this.props.SELECTED_PLAN_INFO(selectedPlan);
        this.setState({
            selectedPlan:selectedPlan,
        })
        const { history } = this.props;
        history.push("/registration");
    }
    
  
    render() {
        const { plans } = this.state
        return (
            <>
                <HomeHeader />
                <div className="main-content" ref="mainContent">
                    <div
                        className="header pb-8 pt-5 pt-lg-8 d-flex align-items-center"
                        style={{
                            minHeight: "450px",boxShadow: "inset 0px 0px 150px",
                            backgroundImage:
                            "url("+ restaurant_cover_image +")",
                            backgroundSize: "cover",
                            backgroundPosition: "center top"
                        }}
                    >
                    {/* Mask */}
                        <span className="mask bg-gradient-default opacity-2" style={{zIndex: "-1"}}  />
                        <Container className="d-flex align-items-center">
                            <div>
                                <h1
                                    className="display-1 text-white"
                                    type="button"
                                    style={{ cursor: "pointer" }}
                                    onClick={() => this.handleShowResturantDetail()}
                                >
                                    <font style={{textShadow: "2px 2px #000000"}}> {"Flexible Plans and Pricing"} </font>
                                </h1>
                            </div>
                        </Container>
                        <div class="separator separator-bottom zindex-100">
                            <svg
                                preserveAspectRatio="none"
                                version="1.1"
                                viewBox="0 0 2560 100"
                                x="0"
                                y="0"
                            >
                            <polygon
                                className="fill-white"
                                points="2560 0 2560 100 0 100"
                            ></polygon>
                            </svg>
                        </div>
                    </div>

                    <Container className="mt--7">
                        <Row>
                            <Col className="col">
                                <Card className="bg-secondary shadow ">
                                    <CardHeader className="border-0">
                                        <div className="d-flex justify-content-between">
                                            <div className="md-7">
                                                <h1 className="mb-0">{i18next.t("Plan Details")}</h1>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardBody>
                                        <Row>
                                            { 
                                                plans.map((plan,i) => {
                                                    if(plan.is_active===true){
                                                        return (
                                                            <Col className="p-3" md={4} ld={4} sm={4} xs={12} lg={4}>
                                                                <Card className="cardHeight" style={{ borderWidth: 1, borderColor: "grey" }}>
                                                                    <CardHeader>
                                                                        <CardTitle className="display-3"> {plan.title} </CardTitle>
                                                                    </CardHeader>
                                                                    <CardBody>
                                                                        
                                                                        <CardTitle className="display-4"> 
                                                                            {plan.currency_symbol} {" "} 
                                                                            {plan.unit_amount} / {plan.stripe_price.recurring.interval} 
                                                                        </CardTitle>
                                                                        
                                                                        <Button
                                                                            color="primary"
                                                                            onClick={() => this.selectPlan(plan)}
                                                                        >
                                                                            SUBSCRIBE
                                                                        </Button>
                                                                        <br/><br/>
                                                                    </CardBody>
                                                                    <CardFooter className="cardHeight">
                                                                        <CardTitle className="display-4"> Features </CardTitle>
                                                                        <CardText>
                                                                            {plan.content}
                                                                        </CardText>
                                                                    </CardFooter>
                                                                </Card>
                                                            </Col>
                                                        )
                                                    }
                                                    
                                                })
                                            }
                                        </Row>
                                    </CardBody>
                                </Card>
                                
                            </Col>
                        </Row>
                    </Container>
                    <HomeFooter />
                    
                </div>
            </>
        );
    }
}

export default connect(mapStateToProps, mapDispatchToProps) (StripePlan);
