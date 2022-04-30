import React, { Component } from "react";
import Sidebar from "../../../../components/Sidebar/Sidebar";
import routes from "../../../../ownerRoutes";
import Navbar from "../../../../components/Navbars/AdminNavbar";

import { Link } from "react-router-dom";

import i18next from "i18next"

import Loader from "../../../common/Loader";

// font Awesome
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHome } from "@fortawesome/free-solid-svg-icons";

// reactstrap components
import {
  Container,
  Breadcrumb,
  BreadcrumbItem,
  Row,
  Col,
  Card,
  CardHeader,
  Button,
  CardBody,
  FormGroup,
  Input,
  Label,
  FormFeedback
} from "reactstrap";

// for Redux
import { bindActionCreators } from "redux";
import { ActCreators } from "../../../../redux/bindActionCreator";
import { connect } from "react-redux";

// for api integration
import instance from "../../../../axios";
import requests from "../../../../requests";

// for notification
import { errorToaster, successToaster } from "../../../common/common-validation/common";

let token = null;
let StoreDishidForEdit = {};
let StoreVariantForOption = {};
let StoreVariantOptionIdForOption = {};

const mapStateToProps = (state) => {
  token = state.token;
  StoreDishidForEdit = state.StoreDishidForEdit;
  StoreVariantForOption = state.StoreVariantForOption;
  StoreVariantOptionIdForOption = state.StoreVariantOptionIdForOption;
};

const mapDispatchToProps = (dispatch) => {
  return bindActionCreators(ActCreators, dispatch);
};

export class UpdateNewVarientOption extends Component {
  constructor(props) {
    super(props);
    this.state = {
      pathStatus: "",
      Variant_name: "",
      Variant_price: null,
      variant_op: null,
      variant_op_id: "",
      variant_id: "",
      variant_op_name: "",


      // variant: {},
    };
  }

  AddVariantApi = async () => {
    const data = this.state.pathStatus === "create" ? {
      dish_id: StoreVariantForOption.id,
      price: this.state.Variant_price,
      variant_op_id: this.state.variant_op_id,
      variant_name: this.state.Variant_name,
    }
      : {
        dish_id: StoreVariantForOption.id,
        variant_id: this.state.variant_id,
        price: this.state.Variant_price,
        variant_op_id: this.state.variant_op_id,
        variant_name: this.state.Variant_name,
      };

    const response = this.state.pathStatus === "create" ?
      await instance
        .post(requests.fetchAddNewVariant, data, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
      :
      await instance
        .patch(requests.fetchupdateNewVariant, data, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        .catch((error) => {
          let errorMessage = error.response.data.data;
          errorToaster(errorMessage);
          console.log(errorMessage);
        });
    if (response && response.data) {
      const match = response.data.data;
      this.props.GET_DISH_ITEM_IN_UPDATE(match);
      const { history } = this.props;
      if (history) {
        history.push(`/menu/item/edit/variant/${StoreDishidForEdit.index}`);
      }
    }
  };

  handleChangeAll = (e) => {
    const name = e.target.name;
    const value = e.target.value;
    this.setState({ [name]: value });
  };

  getVariantOpForSelection = async () => {

    const data = {
      dish_id: StoreVariantForOption.id,
    };

    const response = await instance
      .post(requests.fetchDishVariantOption, data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .catch((error) => {
        let errorMessage = error.response;
        console.log(errorMessage);
      });

    if (response && response.data) {


      const data =
        response.data.data.hasOwnProperty("variant_options") === true
          ? response.data.data.variant_options
          : "";

      this.setState(
        {
          variant_op: data,
        },
        () => {
          this.setState({ Loader: false });
        }
      );
    }
  };

  componentDidMount = () => {
    const { history } = this.props;
    const path = history.location.pathname;
    let splitPath = path.split("/");
    this.setState({
      pathStatus: splitPath[5]
    }, () => {
      this.state.pathStatus === "edit" &&
        this.setState({
          Variant_name: StoreVariantOptionIdForOption.name,
          Variant_price: StoreVariantOptionIdForOption.price,
          variant_op: null,
          variant_op_id: StoreVariantOptionIdForOption.variant_op_id,
          variant_id: StoreVariantOptionIdForOption.variant_id,
          variant_op_name: StoreVariantOptionIdForOption.variant_op_name,
        })
    })

    this.getVariantOpForSelection();
  };

  render() {
    const { Variant_name, Variant_price, variant_op_name } = this.state;

    return (
      <>
        <Sidebar
          style={{ zindex: 100 }}
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
          {/* <Header /> */}
          <Container className="pt-7" fluid>
            <Loader open={this.state.Loader} />
            <Row>
              <Col xs={12} sm={7}>
                <Breadcrumb sm={7} tag="nav" listTag="div">
                  <BreadcrumbItem
                    style={{ textDecoration: "none", color: "#000" }}
                    tag="a"
                  >
                    <Link
                      to="/dashboard"
                      style={{ textDecoration: "none", color: "#000" }}
                    >
                      <FontAwesomeIcon icon={faHome} />
                    </Link>
                  </BreadcrumbItem>
                  <BreadcrumbItem
                    style={{ textDecoration: "none", color: "#000" }}
                    tag="a"
                  >
                    <Link
                      to={"/menu"}
                      style={{ textDecoration: "none", color: "#000" }}
                    >
                      Menu
                      </Link>
                  </BreadcrumbItem>

                  <BreadcrumbItem
                    style={{ textDecoration: "none", color: "#000" }}
                    tag="a"
                  >
                    <Link
                      to={`/menu/item/edit/${StoreDishidForEdit.index}`}
                      style={{ textDecoration: "none", color: "#000" }}
                    >
                      {StoreVariantForOption.name}
                    </Link>
                  </BreadcrumbItem>
                  <BreadcrumbItem
                    style={{ textDecoration: "none", color: "#000" }}
                    tag="a"
                  >
                    <Link
                      to={`/menu/item/edit/variant/${StoreDishidForEdit.index}`}
                      style={{ textDecoration: "none", color: "#000" }}
                    >
                      Variant
                      </Link>
                  </BreadcrumbItem>
                  <BreadcrumbItem active tag="span">

                  </BreadcrumbItem>
                </Breadcrumb>
              </Col>
              <Col sm={5}></Col>
            </Row>
            <Card className="bg-profile shadow">
              <CardHeader className="bg-white border-0">
                <Row className="align-items-center">
                  <Col xs="6">
                    <h3 className="mb-0">{`Edit Option `}</h3>
                  </Col>
                  <Col className="text-right" xs="6">
                    <Link
                      to={`/menu/item/edit/variant/${StoreDishidForEdit.index}`}
                    >
                      <Button color="primary" size="sm">
                        {i18next.t("Back")}
                      </Button>
                    </Link>
                  </Col>
                </Row>
              </CardHeader>
              <CardBody>
                <FormGroup>
                  <Label className="mb-2 font-weight-bold" for="variant_option">
                    {i18next.t("Select Variant Option For Variant")}
                  </Label>
                  <Input
                    type="select"
                    name="variant_op_id"
                    id="variant_option"
                    onChange={this.handleChangeAll}
                    value={this.state.variant_op_id}
                    disabled={this.state.pathStatus === "edit"}
                  >
                    <option value="" selected>
                      -- Select optionVariant Option--
                    </option>
                    {this.state.Loader === false
                      ? this.state.variant_op === null
                        ? ""
                        : this.state.variant_op.map((v_op, i) => {
                          return (
                            <option value={v_op._id}>{v_op.option_name}</option>
                          );
                        })
                      : ""}
                  </Input>
                </FormGroup>
                <FormGroup>
                  <Label className="mb-2 font-weight-bold" for="item_name">
                    {i18next.t("Variant Name")}
                  </Label>
                  <Input
                    className="px-2 py-4"
                    type="text"
                    placeholder={i18next.t("Variant Name")}
                    name="Variant_name"
                    value={Variant_name}
                    onChange={this.handleChangeAll}
                  />
                </FormGroup>
                <FormGroup>
                  <Label className="mb-2 font-weight-bold" for="item_name">
                    {i18next.t("Variant Price")}
                  </Label>
                  <Input
                    className="px-2 py-4"
                    type="number"
                    placeholder={i18next.t("Variant Price")}
                    name="Variant_price"
                    value={Variant_price}
                    onChange={this.handleChangeAll}
                    invalid={Variant_price < 0}
                    min="0"
                  />
                  <FormFeedback invalid>
                    Uh oh! please give a valid price.
                  </FormFeedback>
                </FormGroup>

                <div className="text-center mt-4">
                  <Button
                    color="success"
                    type="button"
                    onClick={this.AddVariantApi}
                  >
                    {
                      this.state.pathStatus === "create"
                        ? i18next.t("Add Variants")
                        : i18next.t("Update Variant")
                    }
                  </Button>
                </div>
              </CardBody>
            </Card>
          </Container>
        </div>
      </>
    );
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(UpdateNewVarientOption);
