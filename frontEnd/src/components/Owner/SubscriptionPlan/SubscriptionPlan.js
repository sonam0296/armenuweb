import React from "react";
// react plugin used to create google maps
import i18next from "i18next";
import {
    Card,
    CardHeader,
    Container,
    Row,
} from "reactstrap";

// For Redux Data
import { bindActionCreators } from "redux";
import { ActCreators } from "../../../redux/bindActionCreator";
import { connect } from "react-redux";

import StripeUser from "./StripeUser/StripeUser";

import RazorpayUser from "./RazorpayUser/RazorpayUser";

let userData = {};


const mapStateToProps = (state) => {
    userData = state.userData
};
const mapDispatchToProps = (dispatch) => {
    return bindActionCreators(ActCreators, dispatch);
};
class SubscriptionPlan extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            
        };
    }

    render() {
        return (
            <>
                <Container className="pt-7" fluid>
                    <Row>
                        <div className="col">
                            <Card className="shadow">
                                <CardHeader className="border-0">
                                    <div className="d-flex justify-content-between">
                                        <div className="md-7">
                                            <h1 className="mb-0">{i18next.t("Subscription Plan")}</h1>
                                        </div>
                                    </div>
                                </CardHeader>
                                {
                                    userData.country_name !== "India" ?
                                        <StripeUser />
                                    :
                                        <RazorpayUser {...this.props} />
                                }
                            </Card>
                        </div>
                    </Row>
                </Container>
            </>
        );
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(SubscriptionPlan);
