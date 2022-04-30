import React, { Component } from "react";

// reactstrap for styling
import {
    Button,
   
    Row,
    Col,
} from "reactstrap";

import "../Hint/Hint.css"

import {
    SideBySideMagnifier,
} from "react-image-magnifiers";

import SwiperCore, { Navigation, Pagination, Scrollbar, A11y, Autoplay, Virtual } from 'swiper';

// for api integration
import instance from "../../axios";
import requests from "../../requests";

// for Redux
import { bindActionCreators } from "redux";
import { ActCreators } from "../../redux/bindActionCreator";
import { connect } from "react-redux";

// for notification
import { errorToaster, successToaster } from "../common/common-validation/common";


import i18next from "i18next";

let token = null;
let userData = {};

SwiperCore.use([Navigation, Pagination, Scrollbar, A11y, Autoplay, Virtual]);

const mapStateToProps = (state) => {
    token = state.token;
    userData = state.userData;
};

const mapDispatchToProps = (dispatch) => {
    return bindActionCreators(ActCreators, dispatch);
};

export class Hint extends Component {
    constructor(props) {
        super(props);
        this.state = {
            datas: [],
            current: 1,
        };
    }
    handlechangeall = (e) => {
        this.setState({
            [e.target.name]: e.target.value,
        });
    };

    handleCloseModal = () => {
        this.props.onClose();
    };

    getTourHintDetail = async () => {
        let userType = userData.userType;
        let is_outlet = userData.is_outlet;
        let bodyAPI = {};
        let API = null;
        if (userType === "owner") {
            bodyAPI = {
                "userType": userType,
                "is_outlet": is_outlet
            }
            API = requests.fetchGetTourHintContentForOwner
        } else {
            bodyAPI = {
                "userType": userType,
            }
            API = requests.fetchGetTourHintContentForAggregator
        }



        const response = await instance
            .post(API, bodyAPI, {
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
                datas: response.data.data.tourData,
            });
        }
    }

    componentDidMount = async () => {
        this.getTourHintDetail();
    }


    NextStep = () => {
        this.setState({
            current: this.state.current + 1
        })

        var div = document.querySelector(".fade1");
        var btn = document.querySelector(".fadeButton");

        div.classList.add("elementToFadeInAndOut");

        setTimeout(function () { div.classList.remove("elementToFadeInAndOut"); }, 10);

    }

    PrevStep = () => {
        this.setState({
            current: this.state.current - 1
        })
        var div = document.querySelector(".fade1");
        var btn = document.querySelector(".fadeButton");

        div.classList.add("elementToFadeInAndOut");

        setTimeout(function () { div.classList.remove("elementToFadeInAndOut"); }, 5);
    }

    render() {
        const { datas, current } = this.state;
        return (
            <Row className="p-3 fade1" >
                {/* <Swiper
                    virtual
                    className="p-3 mb-3"
                    //autoplay={{ delay: 3000 }}
                    navigation
                    spaceBetween={100}  
                    slidesPerView={1}
                    pagination={{ clickable: true }}
                    watchSlidesVisibility
                    watchSlidesProgress
                >
                    {datas && datas.map((slideContent, index) => {
                        console.log("slideContent  ===> ", slideContent);
                        return (
                            <SwiperSlide key={slideContent._id} virtualIndex={index}>
                                <Col className="text-white text-center display-3" md={12} lg={12} xl={12} xs={12} sm={12}>
                                    {datas[index].title}
                                </Col>
                                <Col md={12} lg={12} xl={12} xs={12} sm={12}
                                // style={{ height:"80%", width:"80%",backgroundImage: url(`${datas[0].source_url}`)}}
                                >
                                    <div className="text-center">
                                        <img style={{ height: "80%", width: "80%" }} src={datas[0].source_url} />
                                    </div>

                                    <div className="text-white text-left p-3 ml-3">
                                        <div className="display-4">
                                            Content:
                                    </div>
                                        <div className="display-4">
                                            {datas[0].content}
                                        </div>
                                    </div>

                                </Col>
                                <Col className="text-white text-center display-4" md={12} lg={12} xl={12} xs={12} sm={12}>
                                    <div>
                                        {
                                            datas.map((item, index) => {
                                                if (current === index + 1) {
                                                    return (
                                                        index + 1
                                                    )
                                                }
                                            })
                                        }
                                    </div>

                                </Col>
                            </SwiperSlide>
                        )
                    })}
                </Swiper>
                 */}
                <div >
                    {
                        datas.length > 0 &&
                        <>
                            <Col md={12} lg={12} xl={12} xs={12} sm={12}>
                                <h2 className="text-white text-left p-3 ml-3">
                                    {current}{". "} {datas[current - 1].title}
                                </h2>
                            </Col>
                            <Col md={12} lg={12} xl={12} xs={12} sm={12}
                            // style={{ height:"80%", width:"80%",backgroundImage: url(`${datas[0].source_url}`)}}
                            >
                                <div className="text-center">
                                    {/* <img style={{ height: "70%", width: "75%" }} src={datas[current - 1].source_url} /> */}
                                    <SideBySideMagnifier
                                        imageSrc={datas[current - 1].source_url}
                                        imageAlt="Example"
                                        alwaysInPlace={true}
                                        //largeImageSrc="./large-image.jpg" // Optional
                                    />
                                </div>

                                <div className="text-white text-left p-3 ml-3">
                                    <div className="display-4">
                                        Content:
                                    </div>
                                    <div>
                                        <h3 className="text-white">
                                            {datas[current - 1].content}
                                        </h3>
                                    </div>
                                </div>

                            </Col>
                            <Col md={12} lg={12} xl={12} xs={12} sm={12}>
                                <div className="text-white text-center display-4 mb-3">
                                    <Button
                                        id="previous"
                                        disabled={current === 1 ? true : false}
                                        color="white"
                                        size="sm"
                                        type="button"
                                        onClick={this.PrevStep}
                                    >
                                        <i class="fas fa-step-backward size-5x"></i>
                                    </Button>
                                    {
                                        datas.map((item, index) => {
                                            if (current === index + 1) {
                                                return (
                                                    <font className="ml-2 mr-3"> {index + 1} </font>
                                                )
                                            }
                                        })
                                    }
                                    <Button
                                        className="fadeButton"
                                        id="next"
                                        disabled={current === datas.length ? true : false}
                                        color="white"
                                        size="sm"
                                        type="button"
                                        onClick={this.NextStep}
                                    >
                                        <i class="fas fa-step-forward"></i>

                                    </Button>
                                </div>
                                <div className="text-right text-white">
                                    <font className="ml-2 mr-3"> {current} / {datas.length} </font>
                                </div>
                            </Col>
                        </>
                    }
                </div>

            </Row>
        );
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(Hint);
