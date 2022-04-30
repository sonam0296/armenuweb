import React, { Component } from "react";

// React-router
import { Link } from "react-router-dom";

// for Redux
import { bindActionCreators } from "redux";
import { ActCreators } from "../../../redux/bindActionCreator";
import { connect } from "react-redux";

import i18next from "i18next";

// for notification
import { errorToaster, successToaster } from "../../common/common-validation/common";

// for api integration
import instance from "../../../axios";
import requests from "../../../requests";

// Reactstarp for styling
import {
  Container,
  Row,
  Col,
  Card,
  CardHeader,
  Button,
  CardBody,
  Alert,
  CardImg,
  CardTitle,
  CardText,
  Badge,
  Label,
  CardFooter
} from "reactstrap";

// inner component
import AddNewItem from "./AddNewItem";
import AddUpdateCategory from "./AddUpdateCategory";

let getrestaurantmenu = {};
let token = null;
let userData = {};

const mapStateToProps = (state) => {
  getrestaurantmenu = state.getrestaurantmenu;
  token = state.token;
  userData = state.userData;
};

const mapDispatchToProps = (dispatch) => {
  return bindActionCreators(ActCreators, dispatch);
};

export class Menu extends Component {
  constructor(props) {
    super(props);
    this.state = {
      menu: [],
      AddNewCategory: false,
      AddNewItem: false,
      menu_temp_id: "",
      categoryStatus: "",
      AddUpdateCategory: false,
      flagAddUpdateCategory: false,

      category_id: "",
      selectedCategory: "",
      selectedImage: "",
    };
  }

  handleChangeAll = async (e, DishId) => {
    const name = e.target.name;
    const value = e.target.checked;

    let bodyAPI = {
      "dish_id": DishId,
      "outlet_id": userData._id,
      "item_available": value
    }
    const response = await instance.post(requests.fetchUpdateMenuAvailability, bodyAPI, {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    }).catch((error) => {
      let errorMessage = error.response.data.error.message;
      errorToaster(errorMessage)
    });
    if (response && response.data) {
      successToaster("Outlets successfully updated");
      this.getMenu();
    }

  };

  hadnleStoreDishidForEdit = (id, index, path) => {
    const detail = {
      id: id,
      index: index,
    };
    this.props.STORE_DISH_ID_FOR_EDIT(detail);
    if (userData.is_outlet === false) {
      const { history } = this.props;
      if (history) {
        history.push(path);
      }
    }

  };

  handleShowCategory = () => {
    // this.setState({ AddNewCategory: !this.state.AddNewCategory });
    this.setState({
      categoryStatus: "add",
      selectedCategory: "",
      selectedImage: "",
      category_id: "",
      flagAddUpdateCategory: true
    })
    this.setState({ AddUpdateCategory: !this.state.AddUpdateCategory });
  };

  handleShowUpdateCategory = (menu) => {
    this.setState({
      categoryStatus: "update",
      selectedCategory: menu.category,
      selectedImage: menu.category_image.image_url,
      category_id: menu._id,
      flagAddUpdateCategory: true
    })
    this.setState({ AddUpdateCategory: !this.state.AddUpdateCategory });
  };

  handleCloseCategory = () => {
    this.setState({
      flagAddUpdateCategory: false,
      AddUpdateCategory: !this.state.AddUpdateCategory,
    });
  };

  closeAfterAddDish = () => {
    this.setState({ AddNewItem: !this.state.AddNewItem });
  };

  handleShowItem = (id) => {
    this.setState({ AddNewItem: !this.state.AddNewItem, menu_temp_id: id });
  };

  handleCloseItem = () => {
    this.setState({
      AddNewItem: !this.state.AddNewItem,
    });
  };

  handleNotification = (message) => {
    successToaster(message);
  };

  ondelete = async (id) => {
    const response = await instance
      .delete(`${requests.fetchDeleteMenuCategory}${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .catch((error) => {
        let errorMessage = error.response.error.message;
        errorToaster(errorMessage);
        console.log(errorMessage);
      });

    if (response) {
      this.getMenu();
      successToaster("Successfully Deleted!");
    }
  };

  getMenu = async () => {
    let APIBody =
    {
      owner_id: userData.is_outlet === false ? userData._id : userData.master_brand
    }
    const response = await instance
      .post(requests.fetchRestaurantMenu, APIBody, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .catch((error) => {
        let errorMessage = error.response.data.error.message;
        errorToaster(errorMessage);
        console.log(errorMessage);
      });

    if (response && response.data) {
      const menu_data = response.data.data;
      this.setState({ menu: menu_data });
    }
  };

  componentDidMount = () => {
    this.getMenu();
  };

  render() {
    const { menu } = this.state;
    return (
      <>
        <Container className="pt-7" fluid>
          <Card className="bg-secondary shadow">
            <CardHeader className="bg-white border-0 p-4">
              <Row className="align-items-center">
                <Col sm={12} md={8}>
                  <h3 className="mb-0">
                    {i18next.t("Restaurant Menu Management")}{" "}
                  </h3>
                </Col>
                <Col sm="12 mt-2" lg="4 text-right">
                  {
                    userData.is_outlet === false &&
                    <Button
                      style={{ fontSize: "1rem" }}
                      color="primary"
                      onClick={this.handleShowCategory}
                      size="sm"
                    >
                      +
                      </Button>
                  }

                  {/* <Button
                    style={{ fontSize: "1rem" }}
                    color="primary"
                    onClick={(e) => e.preventDefault()}
                    size="sm"
                  >
                    Import From CSV
                  </Button> */}
                </Col>
              </Row>
            </CardHeader>
            {menu.map((menu) => {
              const id = menu._id;

              return (
                <CardBody className="mx-3">
                  <Alert className="alert-default">
                    {/* <Row className="align-items-center">
                      <Col className="display-4" md="8" xs="12">
                        {menu.category}{"  "}
                        {
                          userData.is_outlet === false &&
                          <Button
                            style={{ fontSize: "1rem" }}
                            color="primary"
                            onClick={() => this.handleShowUpdateCategory(menu, menu.category, menu.category_image)}
                            size="sm"
                          >
                            <i class="fas fa-edit"></i>
                          </Button>
                        }


                      </Col>
                      <Col md="4 text-right" xs="12 text-right">
                        <Button
                          disabled={userData.is_outlet === true ? true : false}
                          style={{ fontSize: "1rem" }}
                          color="primary"
                          onClick={() => {
                            this.handleShowItem(id);
                          }}
                          size="sm"
                        >
                          +
                        </Button>
                        <Button
                          disabled={userData.is_outlet === true ? true : false}
                          style={{ fontSize: "1rem" }}
                          color="danger"
                          onClick={() => {
                            if (
                              window.confirm(
                                "Are you sure to delete this Menu Category?"
                              )
                            ) {
                              this.ondelete(id);
                            }
                          }}
                          size="sm"
                        >
                          <i class="fas fa-trash"></i>
                        </Button>
                      </Col>
                    </Row> */}

                    <div className="d-flex justify-content-between">
                      <div className="display-4">
                        {menu.category}{"  "}
                        {
                          userData.is_outlet === false &&
                          <Button
                            style={{ fontSize: "1rem" }}
                            color="primary"
                            onClick={() => this.handleShowUpdateCategory(menu, menu.category, menu.category_image)}
                            size="sm"
                          >
                            {/* <i className="fas fa-marker"></i> */}
                            {/* <i class="fas fa-edit"></i> */}
                            <i class="fas fa-pen-alt"></i>
                          </Button>
                        }
                      </div>

                      <div
                        className="col-4 text-right"
                      >
                        <Button
                          className="mt-2 mr-3"
                          disabled={userData.is_outlet === true ? true : false}
                          style={{ fontSize: "1rem" }}
                          color="primary"
                          onClick={() => {
                            this.handleShowItem(id);
                          }}
                          size="sm"
                        >
                          <i class="fas fa-plus"></i>
                        </Button>
                        <Button
                          className="mt-2 mr-3"
                          disabled={userData.is_outlet === true ? true : false}
                          style={{ fontSize: "1rem" }}
                          color="danger"
                          onClick={() => {
                            if (
                              window.confirm(
                                "Are you sure to delete this Menu Category?"
                              )
                            ) {
                              this.ondelete(id);
                            }
                          }}
                          size="sm"
                        >
                          <i class="fas fa-trash"></i>
                        </Button>
                      </div>
                    </div>
                  </Alert>
                  <Row className="justify-content-center">
                    <Col lg={12}>
                      <Row className="row-grid">
                        {menu.Dish_List.map((dishList, index) => {
                          const path = userData.is_outlet === false ? `/menu/item/edit/${index + 1}` : "/menu";
                          const ImagePath = dishList.item_image.image_url
                            ? dishList.item_image.image_url
                            : process.env.REACT_APP_DEFAULT_IMAGE;

                          let outletLst = []
                          let CheckAvaibility = null;
                          if (userData.is_outlet === true) {
                            outletLst = dishList.outlets
                            let checkOutletAvaibility = outletLst.filter(outlet => outlet.outlet_id === userData._id)
                            if (checkOutletAvaibility) {
                              CheckAvaibility = checkOutletAvaibility[0].item_available
                            }
                          }

                          return (
                            <Col sm={6} md={6} xl="4 mt-4" lg={4}>
                              {/* <Link
                                to={{
                                  pathname: path,
                                  state: { id: dishList._id },
                                }}
                              > */}
                              <Card
                                className="ml-3 mb-4"
                                style={{ cursor: "pointer", height: "100%" }}
                                onClick={() => {
                                  this.hadnleStoreDishidForEdit(
                                    dishList._id,
                                    index + 1,
                                    path,
                                  );
                                }}
                              >
                                <CardImg alt="..." src={`${ImagePath}`} top
                                  style={{
                                    height: "150px",
                                    width: "100%",
                                    objectFit: "cover",
                                    pointerEvents: userData.is_outlet === true && CheckAvaibility === true ? "none" : "auto",
                                    opacity: userData.is_outlet === true && CheckAvaibility === false ? "0.4" : "1",
                                  }}
                                />
                                <CardBody
                                  style={{
                                    pointerEvents: userData.is_outlet === true && CheckAvaibility === true ? "none" : "auto",
                                    opacity: userData.is_outlet === true && CheckAvaibility === false ? "0.4" : "1",
                                  }}
                                >
                                  <CardTitle className="h2 text-primary text-uppercase">
                                    {
                                      dishList.veg === true ?
                                        <img className="mr-3"
                                          src="https://appetizar.nyc3.digitaloceanspaces.com/1614841978453-veg.png"
                                          height="25px"
                                          width="25px"
                                        />
                                        : <img className="mr-3"
                                          src={"https://appetizar.nyc3.digitaloceanspaces.com/1614842104702-non-veg.png"}
                                          height="25px"
                                          width="25px"
                                        />
                                    }
                                    {dishList.item_name}
                                  </CardTitle>
                                  <CardText>
                                    {dishList.item_description}
                                  </CardText>
                                  <Badge color="primary" pill>
                                    {userData.currencies.symbol}{" "}{dishList.item_price}
                                  </Badge>
                                  {
                                    userData.is_outlet === false &&
                                    <p className="mt-3 mb-o text-sm">
                                      {dishList.item_available ? (
                                        <span className="text-success mr-2">
                                          {" "}
                                          {i18next.t("AVAILABLE")}{" "}
                                        </span>
                                      ) : (
                                        <span className="text-danger mr-2">
                                          {i18next.t("UNAVAILABLE")}
                                        </span>
                                      )}
                                    </p>
                                  }
                                  <p className="mt-3 mb-o text-sm">
                                    {
                                      userData.is_outlet === true &&
                                      (CheckAvaibility === true ? (
                                        <span className="text-success mr-2">
                                          {" "}
                                          {i18next.t("AVAILABLE")}{" "}
                                        </span>)
                                        : (<span className="text-danger mr-2">
                                          {i18next.t("UNAVAILABLE")}
                                        </span>))
                                    }
                                  </p>
                                </CardBody>

                                {
                                  userData.is_outlet === true && <>
                                    <CardFooter>
                                      <CardTitle className="h2 text-primary text-uppercase">
                                        Set Avibility
                                      </CardTitle>
                                      <Row>
                                        <Col>
                                          <Label
                                            className="mb-2 font-weight-bold"
                                            for="resturantName"
                                          >
                                            {i18next.t("Item available")}
                                          </Label>
                                        </Col>
                                      </Row>
                                      <Row>
                                        <Col>
                                          <label className="custom-toggle">
                                            {CheckAvaibility === true ? (
                                              <input
                                                defaultChecked
                                                type="checkbox"
                                                name="CheckAvaibility"
                                                onChange={(e) => { this.handleChangeAll(e, dishList._id) }}
                                              />
                                            ) : (
                                              <input
                                                type="checkbox"
                                                name="CheckAvaibility"
                                                onChange={(e) => { this.handleChangeAll(e, dishList._id) }}
                                              />
                                            )}
                                            <span className="custom-toggle-slider rounded-circle" />
                                          </label>
                                        </Col>
                                      </Row>
                                    </CardFooter>
                                  </>
                                }

                              </Card>
                              {/* </Link> */}
                            </Col>
                          );
                        })}
                      </Row>
                    </Col>
                  </Row>
                </CardBody>
              );
            })}
          </Card>
        </Container>
        {/* <AddNewCategory
          onClose={this.handleCloseCategory}
          show={this.state.AddNewCategory}
          notification={this.handleNotification}
          getMenu={this.getMenu}
          afterAdd={this.closeAfterAddCategory}
        /> */}
        {
          this.state.flagAddUpdateCategory &&
          <AddUpdateCategory
            onClose={this.handleCloseCategory}
            show={this.state.AddUpdateCategory}
            notification={this.handleNotification}
            getMenu={this.getMenu}
            selectedCategory={this.state.selectedCategory}
            selectedImage={this.state.selectedImage}
            category_id={this.state.category_id}
            categoryStatus={this.state.categoryStatus}
          />
        }

        <AddNewItem
          onClose={this.handleCloseItem}
          show={this.state.AddNewItem}
          notification={this.handleNotification}
          getMenu={this.getMenu}
          afterAdd={this.closeAfterAddDish}
          id={this.state.menu_temp_id}
        />
      </>
    );
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(Menu);
