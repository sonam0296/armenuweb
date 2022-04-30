import React, { Component } from "react";

//
import { Button, Modal, FormGroup, Input, Card, CardBody, Label } from "reactstrap";

// for api integration
import instance from "../../../axios";
import requests from "../../../requests";

// for Redux
import { bindActionCreators } from "redux";
import { ActCreators } from "../../../redux/bindActionCreator";
import { connect } from "react-redux";

// for notification
import {errorToaster, successToaster} from "../../common/common-validation/common";

import i18next from "i18next"

let token = null;


const mapStateToProps = (state) => {
  token = state.token;
};

const mapDispatchToProps = (dispatch) => {
  return bindActionCreators(ActCreators, dispatch);
};

class AddUpdateCategory extends Component {
  constructor(props) {
    super(props);
    this.state = {
      category_id: "",
      category: "",
      item_image: "",
      multerItem_image: "",
      categoryStatus:""
    };
  }

  handleChange = (e) => {
    this.setState(
      {
        [e.target.name]: e.target.value,
      }
    );
  };

  handleFileChange = (e) => {
    const data = e.target.files[0];
    if(e.target.files[0].size <= 1048576){
      this.setState(
        { item_image: data, multerItem_image: URL.createObjectURL(data) }
      );
    }else{
      errorToaster("Your file is too large, please select lessthan 1 mb file")
    }
    
  };

  toBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });

  componentDidMount = () => {
      this.setState({
        category_id:this.props.category_id,
        category:this.props.selectedCategory,
        multerItem_image:this.props.selectedImage,
        categoryStatus:this.props.categoryStatus

      })
  }  

  handleRemoveFile = (e) => {
    e.preventDefault();
    this.setState({ item_image: "", multerItem_image: "" });
  };

  onUpdateCategory = async () => {
    const { category_id, category, item_image, categoryStatus } = this.state;
    const fd = new FormData();
       
    this.state.categoryStatus==="update"&&
    fd.append("category_id", category_id);

    if(category.length > 0){
      fd.append("category", category);
    }
    if(item_image.length !== 0){
      fd.append("category_image", item_image, item_image.name);
    }

    const response = this.state.categoryStatus==="update" ?
      await instance.patch(requests.fetchUpdateCategory, fd, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-type": "multipart/form-data",
        },
      }).catch((error) => {
        let errorMessage = error.response.data.error.message;
        errorToaster(errorMessage);
        console.log(errorMessage);
      })
    : await instance.post(requests.fetchAddNewCategory, fd, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-type": "multipart/form-data",
        },
      })
      .catch((error) => {
        let errorMessage = error.response.data.error.message;
        errorToaster(errorMessage);
        console.log(errorMessage);
      });
    if (response && response.data) {
      this.props.getMenu();
      categoryStatus==="add"
      ?
        this.props.notification("Record successfully added!")
      :
        this.props.notification("Record successfully updated!");
      
        this.props.onClose();
      this.setState({
        category: "",
        item_image: "",
        multerItem_image: "",
      })

    }
  };

  render() {
    const {
      category,
      item_image,
      multerItem_image,
      categoryStatus
    } = this.state;
    return (
      <>
        <Modal className="modal-dialog-centered" isOpen={this.props.show}>
          <div className="modal-header">
            <h3 className="modal-title " id="exampleModalLabel">
              {
                categoryStatus==="add"?
                  i18next.t("Add New Category")
                : i18next.t("Update Category")
              }
            </h3>
            <button
              aria-label="Close"
              className="close"
              data-dismiss="modal"
              type="button"
              onClick={this.props.onClose}
            >
              <span aria-hidden={true}>×</span>
            </button>
          </div>
          <div className="modal-body p-0">
            <Card className="bg-secondary shadow border-0">
              <CardBody className="p-lg-5">
                <FormGroup className="pb-3">
                  <Input
                    className="px-2 py-4"
                    type="text"
                    placeholder={i18next.t("Category")}
                    name="category"
                    value={category}
                    onChange={this.handleChange}
                  />
                </FormGroup>
                <FormGroup className="text-center font-weight-bold mb-6">
                    <Label for="input-name">{i18next.t("Item Image")}</Label>
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

                <div className="text-center my-">
                      <Button
                        className="my-3 p-3"
                        color="primary"
                        type="button"
                        onClick={this.onUpdateCategory}
                      >
                        {i18next.t("Save")}
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

export default connect(mapStateToProps, mapDispatchToProps)(AddUpdateCategory);
