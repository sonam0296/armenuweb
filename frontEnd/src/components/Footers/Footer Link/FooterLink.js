import React from "react";
import instance from "../../../axios";
import requests from "../../../requests";

import 'react-notifications/lib/notifications.css';
import {errorToaster, successToaster} from "../../common/common-validation/common"; 
import HomeHeader from "../../common/header/HomeHeader";
import 'components/common/Home/home.css';

import {bindActionCreators} from "redux";
import {ActCreators} from "../../../redux/bindActionCreator";
import {connect} from "react-redux";

// Footer 
import HomeFooter from "components/Footers/HomeFooter";

import {
    Row,
    Col,
    Container
} from "reactstrap";

let Page_Id = null;

const mapStateToProps = state => {
    Page_Id=state.Page_Id;
};

const mapDispatchToProps = dispatch => {
    return bindActionCreators(ActCreators, dispatch)
}
class FooterLink extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
           datas:{}
        }
    }
    handleChange(e) {
        this.setState({
            [e.target.name]: e.target.value
        })
    };
    componentDidMount = async () => {
        
        // Restuarant City API integration
        let bodyAPI = {
            "page_id":Page_Id
        }
        const response = await instance.post(requests.fetchGetPagesDetailForClient,bodyAPI).catch((error) => {
            let errorMessage = error.response.data.error.message;
            errorToaster(errorMessage)
        });
        if(response && response.data){
            this.setState({
                datas:response.data.data.pages
            })
        }
    }
    
    render() {
        let {datas}= this.state
        let restaurant_cover_image = process.env.REACT_APP_DEFAULT_IMAGE
        return (
            <>
              <HomeHeader />
                <div
                className="header pb-8 pt-5 pt-lg-8 d-flex align-items-center"
                style={{
                    minHeight: "450px",
                    backgroundImage:
                    "url("+ restaurant_cover_image +")",
                    backgroundSize: "cover",
                    backgroundPosition: "center top",
                }}
                >
                {/* " + require('../../../assets/img/theme/food-5.jpg') + ") <span className="mask bg-gradient-default opacity-3" /> */}
                <Container className="d-flex align-items-center">
                    <div>
                    <h1
                        className="display-1 text-white"
                        type="button"
                    >
                        {datas.title}
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
                <Container >
                    <Row>
                      <Col xs={12} lg={12} sm={12} xl={12}>
                        <Col xs={12} lg={12} sm={12} xl={12}>
                          <p className="display-5 text">
                              {datas.content}
                          </p>
                        </Col>
                        </Col>
                    </Row>
                </Container> 
           
              <HomeFooter />
            </>
        );
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(FooterLink);
