
import React from "react";
import { Link, Redirect } from "react-router-dom";
import i18next from "i18next";
// reactstrap components
import {
  DropdownMenu,
  DropdownItem,
  UncontrolledDropdown,
  UncontrolledTooltip,
  DropdownToggle,
  Form,
  Navbar,
  Nav,
  Container,
  Media,
} from "reactstrap";
import { bindActionCreators } from "redux";
import { ActCreators } from "../../../src/redux/bindActionCreator";
import { connect } from "react-redux";
import { errorToaster, successToaster } from "../common/common-validation/common";

import instance from "../../axios";
import requests from "../../requests";
import Greeting from "../Dashboard/Greeting";

let userData = {};
let token = null;
let get_fcm_registration_token = null;

const mapStateToProps = (state) => {
  userData = state.userData;
  token = state.token;
  get_fcm_registration_token = state.get_fcm_registration_token;

};

const mapDispatchToProps = (dispatch) => {
  return bindActionCreators(ActCreators, dispatch);
};

class AdminNavbar extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      showModal: false,
      redirect: false,
      allLanguages: [
        { value: "en", key: "en", text: "English" },
        { value: "hi", key: "hi", text: "Hindi" },
      ],
      imageSrc: userData.hasOwnProperty("profile_image") ? userData.profile_image.image_url : process.env.REACT_APP_DEFAULT_IMAGE, //userData.profile_image.hasOwnProperty("image_url") ? userData.profile_image.image_url : 
      userName: userData.hasOwnProperty("name") ? userData.name : ""
    };
  }

  onLogout = async () => {
    if (this.state.isSafari === true) {
      const { history } = this.props;
      this.props.DESTOROY_SESSION();
      successToaster("Logout Successfully");
      setTimeout(() => {
        this.setState({ redirect: true });
        //  history.push('/');
      }, 2000);
    } else {
      if (get_fcm_registration_token === null) {
        const { history } = this.props;
        this.props.DESTOROY_SESSION();
        successToaster("Logout Successfully");
        setTimeout(() => {
          this.setState({ redirect: true });
          //  history.push('/');
        }, 2000);
      } else {
        const data = {
          fcm_regi_token: true,
          fcm_registration_token: get_fcm_registration_token,
        };
        const response = await instance
          .post(requests.fetchLogout, data, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          })
          .catch((error) => {
            const errorMessage = error.response.data.error.message;
            errorToaster(errorMessage);
            console.log(errorMessage);
          });
        if (response && response.data) {
          const { history } = this.props;
          this.props.DESTOROY_SESSION();
          successToaster("Logout Successfully");
          this.props.GET_FCM_REGISTRATION_TOKEN(null);
          setTimeout(() => {
            this.setState({ redirect: true });
            //  history.push('/');
          }, 2000);
        }
      }
    }
  };

  showHint = () => {
    this.setState({
      showModal: true
    })
  }
  onCloseModal = () => {
    this.setState({
      showModal: false
    })
  }


  componentWillReceiveProps(nextProps) {
    if (nextProps.img) {
      this.setState({
        imageSrc: nextProps.img
      })
    }
    if (nextProps.name) {
      this.setState({
        userName: nextProps.name
      })
    }
  }
  componentDidMount = () => {
    var isSafari =
      navigator.vendor &&
      navigator.vendor.indexOf("Apple") > -1 &&
      navigator.userAgent &&
      navigator.userAgent.indexOf("CriOS") == -1 &&
      navigator.userAgent.indexOf("FxiOS") == -1;
    this.setState({ isSafari: isSafari });
  };

  handleSelectChange = (e) => {
    localStorage.setItem("lang", e.target.value);
    window.location.reload();
    this.setState({ [e.target.name]: e.target.value });
  };

  render() {
    const lang = localStorage.getItem("lang") || "en";
    if (this.state.redirect) {
      return <Redirect to="/" />;
    }
    return (
      <>
        <Navbar className="navbar-top navbar-dark" expand="md" id="navbar-main">
          <Container fluid >
            <p
              className="h4 mb-0 text-black text-uppercase d-none d-lg-inline-block"
            >
              {this.props.brandText}
            </p>
            <Form className="navbar-search navbar-search-dark form-inline mr-3 d-none d-md-flex ml-lg-auto">
              {/* <FormGroup className="mb-0">
                <InputGroup className="input-group-alternative">
                  <InputGroupAddon addonType="prepend">
                    <InputGroupText>
                      <i className="fas fa-search" />
                    </InputGroupText>
                  </InputGroupAddon>
                  <Input placeholder="Search" type="text" />
                </InputGroup>
              </FormGroup> */}
            </Form>

            {
              userData.subscription_status.status === "cancelled" &&
                <span className="h4 mb-0 d-none d-lg-inline-block d-md-inline-block" style={{ cursor: "pointer", fontSize: "25px", color: "red" }}>

                  <i id="close" className="fas fa-calendar-times"></i>
                  <UncontrolledTooltip
                    delay={0}
                    placement="top"
                    target="close"
                  >
                    Your subscription plan has been closed. please select new plan.
                  </UncontrolledTooltip>
                </span>

            }



            <Nav className="align-items-center d-none d-md-flex" navbar>
              <UncontrolledDropdown nav>
                <DropdownToggle className="pr-0" nav>
                  <Media className="align-items-center">
                    <span className="avatar avatar-sm rounded-circle" >
                      <img
                        alt="..."
                        className="avatar avatar-sm rounded-circle"
                        style={{ objectFit: "cover" }}
                        src={this.state.imageSrc}
                      />
                    </span>
                    <Media className="ml-2 d-none d-lg-block">
                      <span className="mb-0 text-sm font-weight-bold" style={{ color: "black" }}>
                        {this.state.userName}
                      </span>
                    </Media>
                  </Media>
                </DropdownToggle>
                <DropdownMenu className="dropdown-menu-arrow" right>
                  <DropdownItem className="noti-title" header tag="div">
                    <h6 className="text-overflow m-0">Welcome!</h6>
                  </DropdownItem>
                  <DropdownItem to="/profile" tag={Link}>
                    <i className="ni ni-single-02" />
                    <span>{i18next.t("My profile")}</span>
                  </DropdownItem>
                  {/* <hr  style={{ margin: "0" }}/> */}
                  <DropdownItem divider />
                  <div className="my-3" style={{ paddingRight: "11px", paddingLeft: "11px" }}>
                    <span>
                      <select
                        name="transl"
                        onChange={this.handleSelectChange}
                        value={lang}
                        style={{
                          // padding: "0.671rem",
                          // borderRadius: "0.38rem",
                          width: "100%",
                          border: "none",
                          // fontSize: "0.875rem",
                        }}
                      >
                        {this.state.allLanguages.map((lange) => {

                          return (
                            <>
                              <option value={lange.value}>{lange.text}</option>
                            </>
                          );
                        })}
                      </select>
                    </span>
                  </div>
                  {/* <DropdownItem to="/admin/user-profile" tag={Link}>
                    <i className="ni ni-calendar-grid-58" />
                    <span>Activity</span>
                  </DropdownItem>
                  <DropdownItem to="/admin/user-profile" tag={Link}>
                    <i className="ni ni-support-16" />
                    <span>Support</span>
                  </DropdownItem> */}
                  <DropdownItem divider />
                  <DropdownItem
                    style={{ cursor: "pointer" }}
                    onClick={() => this.onLogout()}
                  >
                    <i className="ni ni-user-run" />
                    <span>{i18next.t("Logout")}</span>
                  </DropdownItem>

                  {
                    userData.userType !== "admin" &&
                    <>
                      <DropdownItem divider />
                      <DropdownItem
                        style={{ cursor: "pointer" }}
                        onClick={this.showHint}
                      >
                        <i className="fas fa-question-circle"
                          style={{ cursor: "pointer" }}
                          id="Hint"
                        ></i>
                        <span>{i18next.t("Take a Tour")}</span>
                      </DropdownItem>
                    </>
                  }

                </DropdownMenu>
              </UncontrolledDropdown>

            </Nav>
            {/* <div className="ml-3">
              <i className="fas fa-question-circle"
                style={{ cursor: "pointer" }}
                id="Hint"
                onClick={this.showHint}
              ></i>
              <UncontrolledTooltip
                delay={0}
                placement="top"
                target="Hint"
              >
                Take a Tour
                      </UncontrolledTooltip>
            </div> */}
            {/* <i className="fas fa-store-alt-slash"></i> */}


          </Container>
        </Navbar>
        {
          this.state.showModal &&
          <Greeting
            show={this.state.showModal === true}
            onClose={() => this.onCloseModal()}
            ShowContent="onlyHint"
          />
        }
      </>
    );
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(AdminNavbar);
