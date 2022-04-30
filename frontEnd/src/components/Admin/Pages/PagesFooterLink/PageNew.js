import React from "react";
// reactstrap components

import {
  Card,
  CardHeader,
  CardBody,
  Container,
  Row,
  Col,
  Button,
  FormGroup,
  Form,
  Input,
} from "reactstrap";

//Navbar
import Navbar from "../../../Navbars/AdminNavbar";

import i18next from "i18next";
// core components
import AdminFooter from "../../../Footers/AdminFooter.js";
import Sidebar from "../../../Sidebar/Sidebar.js";

import routes from "../../../../routes";

// For Redux Data
import { bindActionCreators } from "redux";
import { ActCreators } from "../../../../redux/bindActionCreator";
import { connect } from "react-redux";

// Server Port Instance
import instance from "../../../../axios";
import requests from "../../../../requests";

// Notification
import {errorToaster, successToaster} from "../../../common/common-validation/common";

let token = null;

const mapStateToProps = (state) => {
  token = state.token;
};
const mapDispatchToProps = (dispatch) => {
  return bindActionCreators(ActCreators, dispatch);
};

class PageNew extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      title: "",
      content: "",
    };
  }
  handleChange(e) {
    this.setState({
      [e.target.name]: e.target.value,
    });
  }
  onCallAddPage = async () => {
    let bodyAPI = {
      title: this.state.title,
      content: this.state.content,
    };
    const response = await instance
      .post(requests.fetchAddPage, bodyAPI, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .catch((error) => {
        let errorMessage = error.response.data.error.message;
        errorToaster(errorMessage);
      });
    if (response && response.data) {
      successToaster("Successfully Add New Page..!");
      const { history } = this.props;
      if (history) history.push("/pages");
    }
  };
  redirectToList = () => {
    const { history } = this.props;
    setTimeout(() => {
      if (history) history.push("/pages");
    }, 2000);
  };

  render() {
    const { image, coverImage } = this.state;
    return (
      <>
        <Sidebar
          {...this.props}
          routes={routes}
          logo={{
            innerLink: "/dashboard",
            imgSrc: require("assets/img/brand/argon-react.png"),
            imgAlt: "...",
          }}
        />
        <div className="main-content" ref="mainContent">
          <Navbar />
          <Container className="pt-7" fluid>
            <Row>
              <Col className="col">
                <Card className="bg-secondary shadow">
                  <CardHeader className="border-0">
                    <div className="d-flex justify-content-between">
                      <div className="md-7">
                        <h1 className="mb-0">{i18next.t("Page Management")}</h1>
                      </div>
                      <div className="md-5">
                        <Row>
                          <Col>
                            <Button
                              color="primary"
                              size="sm"
                              type="button"
                              onClick={() => this.redirectToList()}
                            >
                              {i18next.t("Back to List")}
                            </Button> 
                          </Col>
                        </Row>
                      </div>
                    </div>
                  </CardHeader>
                  <CardBody>
                    <Form>
                      <h6 className="heading-small text-muted mb-4">
                        {i18next.t("PAGE INFORMATION")}
                      </h6>
                      <div className="pl-lg-4">
                        <Row>
                          <Col md="12">
                            <FormGroup>
                              <label
                                className="form-control-label"
                                htmlFor="title"
                              >
                                {i18next.t("Title")}
                              </label>
                              <Input
                                className="form-control-alternative"
                                placeholder="Title here ..."
                                type="text"
                                name="title"
                                value={this.state.title}
                                onChange={(e) => this.handleChange(e)}
                              />
                            </FormGroup>
                          </Col>
                        </Row>
                        <Row>
                          <Col md="12">
                            <FormGroup>
                              <label
                                className="form-control-label"
                                htmlFor="input-address"
                              >
                                {i18next.t("Content")}
                              </label>
                              <Input
                                rows={8}
                                className="form-control-alternative"
                                type="textarea"
                                name="content"
                                value={this.state.content}
                                onChange={(e) => this.handleChange(e)}
                              />
                            </FormGroup>
                          </Col>
                        </Row>
                      </div>
                      <center>
                        <Button
                          className="my-4"
                          color="success"
                          type="button"
                          onClick={this.onCallAddPage}
                        >
                          {i18next.t("save")}
                        </Button>
                      </center>
                    </Form>
                  </CardBody>
                </Card>
              </Col>
            </Row>
          </Container>

          <Container fluid>
            <AdminFooter />
          </Container>
        </div>
      </>
    );
  }
}
export default connect(mapStateToProps, mapDispatchToProps)(PageNew);
