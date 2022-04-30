import React, { Component } from "react";
//reactstrap
import {
  Button,
  Modal,
  FormGroup,
  Input,
  Card,
  CardBody,
  Label,
  FormFeedback

} from "reactstrap";

// For Notification
import { errorToaster, successToaster } from "../../common/common-validation/common";


import i18next from "i18next"

// For Redux Data
import { bindActionCreators } from "redux";
import { ActCreators } from "../../../redux/bindActionCreator";
import { connect } from "react-redux";
import instance from "../../../axios";
import requests from "../../../requests";

let userData = {};
let token = null;

const mapStateToProps = (state) => {
  userData = state.userData;
  token = state.token;
};
const mapDispatchToProps = (dispatch) => {
  return bindActionCreators(ActCreators, dispatch);
};

export class AddUpdateCoupon extends Component {
  constructor(props) {
    super(props);
    this.state = {
      coupon_code: "",
      coupon_terms: "",
      coupon_weight: "",
      coupon_threshold: "",
      coupon_archive: "",


      flat_discount: true,
      Status: "",
      SelectedCoupon: {},

      item_image: "",
      multerItem_image: "",
      image_url: ""

    };
  }

  oncloseModal = () => {
    this.props.onClose();
    this.setState({
      coupon_code: "",
      coupon_terms: "",
      coupon_weight: "",
      coupon_threshold: "",
      coupon_archive: ""
    });
  };

  handleFileChange = async (e) => {
    const data = e.target.files[0];
    if (e.target.files[0].size <= 1048576) {
      this.setState(
        {
          item_image: data,
          multerItem_image: URL.createObjectURL(data)
        },
        async () => {
          const fd = new FormData();
          if (this.state.item_image.length !== 0) {
            fd.append("item_image", this.state.item_image, this.state.item_image.name);
          }

          const response = await instance.post("/service/upload-image", fd, {
            headers: {
              "Authorization": `Bearer ${token}`
            }
          }).catch((error) => {
            let errorMessage = error.response.data.error.message;
            errorToaster(errorMessage)
          });
          if (response && response.data) {
            successToaster("Image successfully uploaded ");
            this.state.image_url = response.data.data.reqFiles.item_image[0].location
          }
        }
      );
    } else {
      errorToaster("Your file is too large, please select lessthan 1 mb file")
    }

  };

  handleRemoveFile = (e) => {
    e.preventDefault();
    this.setState({ item_image: "", multerItem_image: "" });
  };

  handleChange = (e) => {
    this.setState({
      [e.target.name]: e.target.value,
    });
  };

  handleChangeAll = (e) => {
    const name = e.target.name;
    const value =
      e.target.type === "checkbox" ? e.target.checked : e.target.value;
    this.setState({ [name]: value });
  };

  AddUpdateCoupon = async () => {
    let { coupon_code,
      coupon_terms,
      coupon_weight,
      coupon_threshold,
      Status,
      SelectedCoupon,
      flat_discount
    } = this.state;
    let minimum_order_price = userData.restaurant_Minimum_order
    if (minimum_order_price <= coupon_threshold) {
      errorToaster("Your coupon_threshold is very high. please check your minimum order price");
    } else {
      let item_image = {
        "image_name": this.state.item_image.name,
        "image_url": this.state.image_url
      }
      const APIBody = Status === "add" ?
        {
          "owner_id": userData._id,
          "coupon_code": coupon_code,
          "coupon_terms": coupon_terms,
          "coupon_weight": flat_discount === false ? coupon_weight : 0,
          "coupon_threshold": coupon_threshold,
          "flat_discount": flat_discount,
          "item_image": item_image
        }
        :
        {
          "coupon_id": SelectedCoupon._id,
          "coupon_code": coupon_code,
          "coupon_terms": coupon_terms,
          "item_image": item_image
        }
      const response = Status === "add" ?
        await instance
          .post(requests.fetchAddCoupon, APIBody, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }).catch((error) => {
            let errorMessage = error.response.data.error.message;
            console.log(errorMessage);
            errorToaster(errorMessage);
          })
        :
        await instance
          .patch(requests.fetchUpdateCoupon, APIBody, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }).catch((error) => {
            let errorMessage = error.response.data.error.message;
            console.log(errorMessage);
            errorToaster(errorMessage);
          })

      if (response && response.data) {
        this.state.Status === "add" ?
          successToaster("Record successfully added!")
          :
          successToaster("Record successfully updated!");
        this.props.getAllCoupon();
        this.setState(
          {
            coupon_code: "",
            coupon_terms: "",
            coupon_weight: "",
            coupon_threshold: ""
          },
          () => {
            this.props.onClose();
          }
        );
      }
    }
  };
  componentDidMount = () => {
    this.setState({
      Status: this.props.Status,
      SelectedCoupon: this.props.SelectedCoupon
    }, () => {
      this.state.Status === "add" ?
        this.setState({
          coupon_code: "",
          coupon_terms: "",
          coupon_weight: "",
          coupon_threshold: "",
          multerItem_image: "",
        })
        :
        this.setState({
          coupon_code: this.state.SelectedCoupon.coupon_code,
          coupon_terms: this.state.SelectedCoupon.coupon_terms,
          coupon_weight: this.state.SelectedCoupon.coupon_weight,
          coupon_threshold: this.state.SelectedCoupon.coupon_threshold,
          multerItem_image: this.state.SelectedCoupon.item_image.image_url,
          //multerItem_image:  process.env.REACT_APP_DEFAULT_IMAGE
          //process.env.REACT_APP_DEFAULT_IMAGE
        })
    })

  }

  render() {
    let { coupon_code,
      coupon_terms,
      coupon_weight,
      coupon_threshold,
      Status,
      flat_discount,
      item_image,
      multerItem_image,
    } = this.state
    return (
      <>
        <Modal className="modal-dialog-centered" style={{ zIndex: "1" }} isOpen={this.props.show}>
          <div className="modal-header">
            <h5 className="modal-title" id="exampleModalLabel">
              {
                Status === "add" ?
                  i18next.t("Add New Coupon")
                  :
                  i18next.t("Update Coupon")
              }
            </h5>
            <button
              aria-label="Close"
              className="close"
              data-dismiss="modal"
              type="button"
              onClick={this.oncloseModal}
            >
              <span aria-hidden={true}>×</span>
            </button>
          </div>
          <div className="modal-body p-0">
            <Card className="bg-secondary shadow border-0">
              <CardBody className="p-lg-5">
                <FormGroup className="text-center font-weight-bold mb-6">
                  <Label for="input-name">{i18next.t("Coupon Image")}</Label>
                  <div className="text-center">
                    <div
                      className="fileinput fileinput-new"
                      dataprovider="fileinput"
                    >
                      <div className="fileinput-preview img-thumbnail">
                        <img
                          src={
                            multerItem_image.length !== 0
                              ? multerItem_image : process.env.REACT_APP_DEFAULT_IMAGE
                          }
                          style={{
                            width: "100%",
                            height: "200px",
                            objectFit: "cover",
                          }}
                        />
                      </div>
                    </div>
                    <div>
                      <span className="btn btn-outline-secondary btn-file mt-3">
                        {item_image.length === 0 ? (
                          <span className="fileinput-new">{i18next.t("Upload Image")}</span>
                        ) : (
                          <span className="fileinput-exists">{i18next.t("Change")}</span>
                        )}
                        <input
                          type="file"
                          name="item_image"
                          onChange={this.handleFileChange}
                          accept="image/x-png,image/gif,image/jpeg,image/png"

                        />
                      </span>
                      {item_image.length !== 0 && (
                        <button
                          onClick={this.handleRemoveFile}
                          className="btn btn-outline-secondary fileinput-exists mt-3"
                          data-dismiss="fileinput"
                        >
                          {i18next.t("Remove")}
                        </button>
                      )}
                    </div>
                  </div>
                </FormGroup>

                <FormGroup >
                  <Label for="Coupon Code">{i18next.t("Coupon Code")}</Label>
                  <Input
                    className="px-2 py-4"
                    type="text"
                    placeholder={i18next.t("Coupon Code")}
                    name="coupon_code"
                    value={coupon_code}
                    onChange={this.handleChange}
                  />
                </FormGroup>
                <FormGroup >
                  <Label for="Coupon Discription">{i18next.t("Coupon Description")}</Label>
                  <Input
                    className="px-2 py-4"
                    type="textarea"
                    placeholder={i18next.t("Coupon Description")}
                    name="coupon_terms"
                    value={coupon_terms}
                    onChange={this.handleChange}
                  />
                </FormGroup>
                {
                  this.state.Status === "add" &&
                  <>
                    <FormGroup >
                      <Label
                        for="resturantName"
                      >
                        {i18next.t("Flat Discount ( Fix discount )")}
                      </Label>
                      <br />
                      <Label className="custom-toggle">
                        {flat_discount === true ? (
                          <input
                            defaultChecked
                            type="checkbox"
                            name="flat_discount"
                            onChange={this.handleChangeAll}
                          />
                        ) : (
                          <input
                            type="checkbox"
                            name="flat_discount"
                            onChange={this.handleChangeAll}
                          />
                        )}
                        <span className="custom-toggle-slider rounded-circle" />
                      </Label>
                    </FormGroup>
                    {
                      flat_discount === false &&
                      <FormGroup >
                        <Label for="Coupon Weight">{i18next.t("Coupon Weight ( % )")}</Label>
                        <Input
                          className="px-2 py-4"
                          type="number"
                          placeholder={i18next.t("Coupon Weight")}
                          name="coupon_weight"
                          value={coupon_weight}
                          onChange={this.handleChange}
                          min="0"
                          invalid={coupon_weight < 0}
                        />
                        <FormFeedback invalid>
                          Uh oh! please give a valid price.
                        </FormFeedback>
                      </FormGroup>
                    }

                    <FormGroup >
                      <Label for="Coupon Max Limit">
                        {i18next.t("Coupon Max Limit")}
                        {" ( " + userData.currencies.symbol + " )"}
                      </Label>
                      <Input
                        className="px-2 py-4"
                        type="number"
                        placeholder={i18next.t("Coupon Max Limit")}
                        name="coupon_threshold"
                        value={coupon_threshold}
                        onChange={this.handleChange}
                        min="0"
                        invalid={coupon_threshold < 0}
                      />
                      <FormFeedback invalid>
                        Uh oh! please give a valid price.
                      </FormFeedback>
                    </FormGroup>
                  </>
                }

                <div className="text-center my-">
                  <Button
                    className="my-3 p-3"
                    color="primary"
                    type="button"
                    onClick={this.AddUpdateCoupon}
                  >
                    {i18next.t('save')}
                  </Button>
                </div>
              </CardBody>
            </Card>
          </div>
        </Modal>
      </>
    );
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(AddUpdateCoupon);
