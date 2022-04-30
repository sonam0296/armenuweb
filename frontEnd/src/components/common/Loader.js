import React, { Component } from "react";

import {
  Modal,
  ModalBody,
} from "reactstrap";

import PulseLoader from "react-spinners/PulseLoader";

import { css } from "@emotion/core";

// import LoaderLogo from "../../assets/img/Loader/hourglass-loader.gif";

const override = css`
  display: block;
  margin: 3rem auto;
  border-color: red;
  @media (max-width: 420px) {
    size: 70;
  }
`;

export class Loader extends Component {
  render() {
    return (
      <>
        {/* <Modal
          className="modal-dialog-centered "
          isOpen={true}
        >
          <div className="modal-body">
            
          </div>
        </Modal> */}
        {/*  */}
        
          <Modal isOpen={this.props.open}   className="modal-dialog-centered text-center" style={{ width:"65%", margin:"0 auto"}}>
            <ModalBody>
              <PulseLoader css={override} size={35} color={"#11CBEF"} />
            </ModalBody>
          </Modal>
        
      </>
    );
  }
}

export default Loader;
