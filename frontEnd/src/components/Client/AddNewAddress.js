import React, {Component} from "react";

import i18next from "i18next";
import {
  Card,
  CardBody,
  Button,
  FormGroup,
  Input,
  Modal,
} from "reactstrap";

import { bindActionCreators } from "redux";
import { ActCreators } from "../../redux/bindActionCreator";
import { connect } from "react-redux";

import instance from "../../axios";
import requests from "../../requests";

import { errorToaster, successToaster} from "../common/common-validation/common";



let token = null;
const mapStateToProps = (state) => {
    token = state.token;
};
const mapDispatchToProps = (dispatch) => {
    return bindActionCreators(ActCreators, dispatch);
};

class AddNewAddress extends Component {
    constructor(props) {
        super(props);
        this.state = {
          address: "",
        };
      }
    
    handleChange = (e) => {
        this.setState({
            [e.target.name]: e.target.value,
        });
    };
    
    onAddNewAddress = async () => {
        let bodyAPI = {
            "address":this.state.address
        }
        const response = await instance.post(requests.fetchAddAddress,bodyAPI, {
           headers: {
            "Authorization": `Bearer ${token}`
          }
        }).catch((error) => {
          let errorMessage = error.response.data.error.message;
          errorToaster(errorMessage)
        });
        if (response && response.data) {
          let userData = response.data.data;
          this.props.LOGIN_USER_DETAIL(userData)
          successToaster("Address Successfully Added!")
          this.props.onClose();
        }
    }
    
    render() {

    return (
        <>
            <Modal className="modal-dialog-centered" isOpen={this.props.show}>
                <div className="modal-header">
                  <h3 className="modal-title " id="exampleModalLabel">
                  {i18next.t("Add New Address")}
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
                            placeholder={i18next.t("Address")}
                            name="address"
                            value={this.state.address}
                            onChange={this.handleChange}
                        />
                        </FormGroup>

                        <div className="text-center my-">
                        <Button
                            className="my-3 p-3"
                            color="primary"
                            type="button"
                            onClick={this.onAddNewAddress}
                        >
                            {i18next.t("save")}
                        </Button>
                        </div>
                    </CardBody>
                    </Card>
                </div>
            </Modal>
        </>
    )
  }
}

export default connect(mapStateToProps, mapDispatchToProps) (AddNewAddress)

