import React from "react";

import i18next from "i18next";

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
  
// core components
import AdminFooter from "../../../Footers/AdminFooter.js";
import Sidebar from "../../../Sidebar/Sidebar.js";

import routes from "../../../../routes.js";

// For Redux Data
import { bindActionCreators } from "redux";
import { ActCreators } from "../../../../redux/bindActionCreator";
import { connect } from "react-redux";
import instance from "../../../../axios";
import requests from "../../../../requests";
//import "./Details.css"

// Axios  
import axios from "axios";

//Phone Number Input
import PhoneInput from 'react-phone-input-2'
import 'react-phone-input-2/lib/bootstrap.css'

import OwnerOrder from "../../../Owner/OwnerDriver/OwnerDriver";

// Notification 
import {errorToaster, successToaster} from "../../../common/common-validation/common";


let token = null;
let StoreAggregatorId = null;


const mapStateToProps = (state) => {
  token = state.token;
  StoreAggregatorId = state.StoreAggregatorId;

};
const mapDispatchToProps = (dispatch) => {
  return bindActionCreators(ActCreators, dispatch);
};

class AddUpdateAggregator extends React.Component {
  constructor(props) {
    super(props)
  
    this.state = {
      Name:'',
      Email:'',
      Phone:'',
      dial_code:null,
      country_name:'',
      country_code:'',
      currencies:{},
      languages:[],
      employer_id:null,

      Aggregator:{},
      
      isActive:false,
      ownerData:[],
      restaurant:'',
      
      pathStatus:"",
    }
  }

  getUserInfo = async () => {
    const response = await instance
    .get(`${requests.fetchGetUserProfileData}/${StoreAggregatorId.id}` , {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    })
    .catch((error) => {
        let errorMessage = error.response.data.error.message;
        console.log(errorMessage);
        errorToaster(errorMessage);

    });
    if(response && response.data) {
        this.setState({
            Aggregator:response.data.data.user,
        },() => {
            const {Aggregator} = this.state;
            this.setState({
                Name: Aggregator.name,
                Email: Aggregator.email,
                Phone: Aggregator.phone,
                isActive: Aggregator.isActive,
                dial_code: Aggregator.dial_code,
                country_name: Aggregator.country_name,
                country_code: Aggregator.country_code,
                currencies: Aggregator.currencies,
                languages: Aggregator.languages,
                employer_id: Aggregator.employer_id
              })
        })
    }
  }

  componentDidMount = async () => {
    //this.getRestaurantDetail();
    const { history } = this.props;
    const path = history.location.pathname;
   
    let splitPath = path.split("/");
    this.setState({
      pathStatus:splitPath[2]
    }, () => {
      if(this.state.pathStatus==="update")
      {
        this.getUserInfo();
      }else{
        this.setState({
            Name: "",
            Email: "",
            Phone: "",
            dial_code: null,
            country_name: "",
            country_code: "",
            currencies: {},
            languages: [],
        })
      }
    })
  }

  handleSelectChange = (e, data) => {
    this.setState({
      [data.name]: data.value,
    });
  };
  
  handleChangeForPhone = (value, data, event, formattedValue) => {
    this.setState ({
      Phone: formattedValue,
      dial_code: data.dialCode,
      country_name: data.name,
      country_code: data.countryCode
    })
  }

  AddUpdateAggregator = async () => {
    axios.get('https://restcountries.eu/rest/v2/callingcode/'+this.state.dial_code+'?fields=name;callingCodes;languages;currencies')
    .then(response => {
      this.setState({
        currencies: response.data[0].currencies[0],
        languages:response.data[0].languages
      }, async () => {  
        let emp_id = null;
        if(this.state.restaurant){
          emp_id=this.state.restaurant
        }
        let currencies = {
          code:this.state.currencies.code.toLowerCase(),
          curr_name:this.state.currencies.name,
          symbol:this.state.currencies.symbol
        }
        let bodyAPI ={}
        if(this.state.pathStatus==="create"){
          bodyAPI = {
            "name":this.state.Name,
            "phone":this.state.Phone,
            "email":this.state.Email,
            "isActive":this.state.isActive,
            "country_name": this.state.country_name,
            "country_code": this.state.country_code,
            "currencies":currencies,
            "user_languages":this.state.languages
          }
        }else{
            bodyAPI = {
              user_id: StoreAggregatorId.id,
              name: this.state.Name,
              phone: this.state.Phone,
              email: this.state.Email,
              isActive: this.state.isActive,
              employer_id: this.state.employer_id,
              dial_code: this.state.dial_code,
              country_name: this.state.country_name,
              country_code: this.state.country_code,
              currencies: this.state.currencies,
              user_languages: this.state.languages,
            }
        }
        const response = this.state.pathStatus==="create" ?
            await instance.post(requests.fetchAggregatorRegistration,bodyAPI,{
              headers:{
                "Authorization":`Bearer ${token}`
              }
            }).catch((error) => {
                let errorMessage = error.response.data.error.message;
                errorToaster(errorMessage)
            })
          :
            await instance.patch(requests.fetchUpdateAggregatrProfileByAdmin, bodyAPI, {
                headers: {
                Authorization: `Bearer ${token}`,
                },
            }).catch((error) => {
                let errorMessage = error.response.data.error.message;
                errorToaster(errorMessage)
            });
        
        if(response && response.data){
          this.state.pathStatus==="create" ?
            successToaster("Record successfully added!")
          :
            successToaster("Record successfully updated!  ");
          const {history} = this.props;
            if (history)
             {history.push('/aggregator')}
        }
      })
    })
    .catch(error => {
        console.log(error);
    })

  }
 
  handleChange = (e) => {
    if(e.target.type != "checkbox")
    {
      this.setState({
        [e.target.name]: e.target.value
      })
    }
    else{
      const name = e.target.name;
      const value = e.target.checked;
      this.setState({
        [name]: value
      })
    }
  };
  redirectToList = () =>{
    const {history} = this.props;
    if (history) history.push('/aggregator')
  }
  
  render() {
    let { isActive } = this.state
    return (
      <>
       <Sidebar
          {...this.props}
          routes={routes}
          logo={{
            innerLink: "/dashboard",
            imgSrc: require("assets/img/brand/argon-react.png"),
            imgAlt: "..."
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
                      <h1 className="mb-0">{i18next.t("Driver Aggregator")}</h1>  
                    </div>
                    <div className="md-5">
                        <Row>
                            <Col>
                                <Button color="primary" size="sm" type="button"
                                  onClick= {this.redirectToList}>
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
                        {i18next.t("AGGREGATOR INFORMATION")}
                    </h6>
                    <div className="pl-lg-4">
                      <Row>
                        <Col md="12">
                          <FormGroup>
                            <label
                              className="form-control-label"
                              htmlFor="input-address"
                            >
                              {i18next.t("Name")}
                            </label>
                            <Input
                              className="form-control-alternative"
                              placeholder={i18next.t("Name")}
                              type="text" name="Name"
                              value={this.state.Name} onChange={(e) => this.handleChange(e)}                              
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
                              {i18next.t("Email")}
                            </label>
                            <Input
                              className="form-control-alternative"
                              placeholder={i18next.t("Email")}
                              type="email" name="Email"
                              value={this.state.Email} onChange={(e) => this.handleChange(e)}                              
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
                              {i18next.t("Phone")}
                            </label>
                            <PhoneInput
                              inputProps={{
                                  name: 'Phno',
                                  required: true,
                                  autoFocus: false
                              }}
                              inputStyle={{ width: "100%" }}
                              placeholder={i18next.t("Phone")}
                              country={'in'}
                              value={this.state.Phone}
                              autoFormat={false}
                              onChange={ (value, data, event, formattedValue) => this.handleChangeForPhone(value, data, event, formattedValue) }
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
                      onClick={this.AddUpdateAggregator}
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
        {
          this.state.pathStatus!=="create" &&
            <OwnerOrder />
        } 
        <Container fluid>
            <AdminFooter />
        </Container>
        </div>
      </>
    );
  }
}
export default connect(mapStateToProps, mapDispatchToProps) (AddUpdateAggregator);
