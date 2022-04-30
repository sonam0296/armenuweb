import React, { Component } from "react";
import classnames from "classnames";

import { Link } from "react-router-dom";

import i18next from "i18next"

import { Dropdown } from "semantic-ui-react";

// for api integration
import instance from "../../../axios";
import requests from "../../../requests";

// for Redux
import { bindActionCreators } from "redux";
import { ActCreators } from "../../../redux/bindActionCreator";
import { connect } from "react-redux";

// for notification
import { errorToaster, successToaster } from "../../common/common-validation/common";

// inner Component
import Workinghourse from "./Workinghourse";
import Loader from "../../common/Loader";

import Sidebar from "../../Sidebar/Sidebar";
import Navbar from "../../Navbars/AdminNavbar";

import adminRoutes from "../../../routes";
import ownerRoutes from "../../../ownerRoutes";

// for the map (leaflet)
import { MapContainer, Marker, Popup, Polygon, TileLayer } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
import "leaflet-draw";
import mapLogo from "../../../assets/img/icons/common/Map-Pin.svg";

import { Redirect } from "react-router-dom";

// reactstrap components
import {
  Container,
  Row,
  Col,
  Card,
  CardHeader,
  Button,
  CardBody,
  Form,
  FormGroup,
  Input,
  Label,
  Nav,
  NavItem,
  NavLink,
  TabContent,
  TabPane,
  FormFeedback
} from "reactstrap";

// restaurants css file
import "./Restaurantscss.css";

// Axios
import Axios from "axios";
import CityRegistration from "components/Admin/Pages/City/CityRegistration";
import CityList from "components/Admin/Pages/City/CityList";
import OutletList from "../../Outlet/OutletList";

let token = null;
let ownerprofileupdate = {};
let userData = {};
let getownerprofile = {};
let GetcityListWithId = {};
let polyGone = [];
let StoreRestaurantId = {};

const mapStateToProps = (state) => {
  token = state.token;
  ownerprofileupdate = state.ownerprofileupdate;
  userData = state.userData;
  getownerprofile = state.getownerprofile;
  GetcityListWithId = state.GetcityListWithId;
  StoreRestaurantId = state.StoreRestaurantId;
};

const mapDispatchToProps = (dispatch) => {
  return bindActionCreators(ActCreators, dispatch);
};

export class Restaurants extends Component {
  constructor(props) {
    super(props);
    this.mapRef = React.createRef();
    this.state = {
      AccountID: null,
      tabs: 1,
      tabsForManagement: 3,
      map: {},
      location: {
        type: "Point",
        coordinates: [21.1833, 72.8235],
      },

      day: [
        {
          isChecked: false, weekDay: 0, openingTime: "", closingTime: "",
        },
        {
          isChecked: false,
          _id: "5f7560c75e307a42445cbdd7",
          weekDay: 1,
          openingTime: "",
          closingTime: "",
        },
        {
          isChecked: false,
          _id: "5f7560c75e307a42445cbdd8",
          weekDay: 2,
          openingTime: "",
          closingTime: "",
        },
        {
          isChecked: false,
          _id: "5f7560c75e307a42445cbdd9",
          weekDay: 3,
          openingTime: "",
          closingTime: "",
        },
        {
          isChecked: false,
          _id: "5f7560c75e307a42445cbdda",
          weekDay: 4,
          openingTime: "",
          closingTime: "",
        },
        {
          isChecked: false,
          _id: "5f7560c75e307a42445cbddb",
          weekDay: 5,
          openingTime: "",
          closingTime: "",
        },
        {
          isChecked: false,
          _id: "5f7560c75e307a42445cbddc",
          weekDay: 6,
          openingTime: "",
          closingTime: "",
        },
      ],
      resturantName: "",
      resturantDescription: "",
      resturantAddress: "",
      clientCity: "",
      minimumorder: null,
      image: "",
      coverImage: "",
      LoaderShow: true,
      QRCode: "",
      ownerName: "",
      ownerEmail: "",
      ownerPhone: "",
      hostName: "",
      AggregatorsOption: [],

      selectedAggregator: null,
      use_driver_aggregator: false,
      pathStatus: "",
      self_service: true,
      is_outlet_user: false,

      country_name: "",
      currenciesOB: [],
      SelectedCurrency: {},
      currencies: {},
      finaleCurrency: "",
      OriginCurreciesOB: []

    };
  }

  storeOwnerId = () => {

    //window.location.assign(this.state.hostName);
    //window.location.href = this.state.hostName;

    // let ID = StoreRestaurantId.id;
    // if (userData.userType === "admin") {
    //   ID = StoreRestaurantId.id
    // } else {
    //   ID = userData._id
    // }
    // this.props.STORE_RESTAURANT(ID);
  };

  toggleNavs = (e, state, index) => {
    e.preventDefault();

    this.setState(
      {
        [state]: index,
      },
      () => {
        if (index === 2) {
          if (this.mapRef && this.mapRef.current) {
            const map = this.mapRef.current.leafletElement;
            map.invalidateSize();
          }
        }
      }
    );
  };

  getIcon = (iSize) => {
    return L.icon({
      iconUrl: mapLogo,
      iconSize: [iSize],
    });
  };

  // addMarker = (e) => {
  //   const newMarker = e.latlng;
  //   const mcord = {
  //     type: "Point",
  //     coordinates: [newMarker.lat, newMarker.lng],
  //   };
  //   this.setState({ location: mcord });
  // };

  eventHandlersGetLOcation = (e) => {
    const newMarker = e.target._latlng;
    const mcord = {
      type: "Point",
      coordinates: [newMarker.lat, newMarker.lng],
    };
    this.setState({ location: mcord });
  };

  handlechangeRadio = (e) => {
    const name = e.target.name;
    const value =
      e.target.type === "checkbox" ? e.target.checked : e.target.value;
    this.setState({
      [name]: value,
    });
  };

  handlechangeall = (e) => {
    const name = e.target.name;
    const value = e.target.value;
    this.setState({ [name]: value });
  };

  handleWorkingHours = (value, i, type) => {
    const days = Object.assign([], this.state.day);
    days[i][type] = value;
    if(type==="isChecked"){
      if(value === true){
        days[i]['openingTime'] = '08:00';
        days[i]['closingTime'] = '23:00';
      }else{
        days[i]['openingTime'] = '';
        days[i]['closingTime'] = '';
      }
    }
    this.setState({ day: days });
  };

  handleFileChange = async (e) => {
    this.setState({ LoaderShow: true });
    let ID = null;
    if (userData.userType === "admin") {
      ID = StoreRestaurantId.id
    } else {
      ID = userData._id
    }
    const filedata = e.target.files[0];
    const fd = new FormData();
    fd.append("restaurant_image", filedata, filedata.name);
    fd.append("userid", ID);

    const response = userData.userType === "admin" ?
      await instance.post(requests.fetchAddrestViaAdminImage, fd, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-type": "multipart/form-data",
        },
      })
      : await instance.post(requests.fetchAddRestImage, fd, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-type": "multipart/form-data",
        },
      })
        .catch((error) => {
          this.setState({ LoaderShow: false });
          let errorMessage = error.response.data.error.message;
          errorToaster(errorMessage);
          console.log(errorMessage);
        });
    if (response && response.data) {
      this.getrestaurantDetail();
    }

    // this.toBase64(e.target.files[0]).then((data) => {
    //   this.setState({ image: data });
    // });
  };
  handlecoverFileChange = async (e) => {
    this.setState({ LoaderShow: true });
    let ID = null;
    if (userData.userType === "admin") {
      ID = StoreRestaurantId.id
    } else {
      ID = userData._id
    }
    const filedata = e.target.files[0];
    const fd = new FormData();
    fd.append("restaurant_cover_image", filedata, filedata.name);
    fd.append("userid", ID);

    const response = userData.userType === "admin" ?
      await instance.post(requests.fetchAddrestViaAdminImage, fd, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-type": "multipart/form-data",
        },
      })
      : await instance.post(requests.fetchAddRestImage, fd, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-type": "multipart/form-data",
        },
      })
        .catch((error) => {
          this.setState({ LoaderShow: false });
          let errorMessage = error.response.data.error.message;
          errorToaster(errorMessage);
          console.log(errorMessage);
        });
    if (response && response.data) {
      this.getrestaurantDetail();
    }
  };
  toBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });

  handleRemoveFile = (e) => {
    e.preventDefault();
    const rm = Object.assign({}, this.state.RestaurantManagement);
    rm.image = "";
    this.setState({ RestaurantManagement: rm });
  };

  // handleRemoveFile = (e) => {
  //   e.preventDefault();
  //   this.setState({ image: "" });
  // };

  handleRemoveCoverFile = (e) => {
    e.preventDefault();
    this.setState({ coverImage: "" });
  };

  handleSelectChange = (e, data) => {
    this.setState(
      {
        [data.name]: data.value,
      }, () => {

      }
    );
  };

  download = async (QRCode) => {
    Axios({
      url: QRCode,
      method: 'GET',
      responseType: 'blob',
      withCredentials: false,
    }).then((response) => {
      const url = window.URL.createObjectURL(
        new Blob([response.data], {
          type: response.headers['content-type']
        }));
      const link = document.createElement('a');
      link.href = url
      link.setAttribute('download', 'image.png');
      document.body.appendChild(link)
      link.click();
    }).catch((error) => {
      console.log("Error = ", error)
    });
  };
  onUpdateOwnerProfile = async () => {
    let ID = StoreRestaurantId.id
    let Type = StoreRestaurantId.userType
    // if(userData.userType==="admin"){
    //   ID=StoreRestaurantId.id
    // }else{
    //   ID = userData._id
    // }
    const {
      resturantAddress,
      resturantDescription,
      clientCity,
      resturantName,
      day,
      minimumorder,
      location,
      resturantLandmark,
      currencies,
      ownerName,
      ownerEmail,
      hostName,
      selectedAggregator,
      use_driver_aggregator,
      AccountID,
      self_service,
      SelectedCurrency,
      currenciesOB,
      OriginCurreciesOB
    } = this.state;

    // SelectedCurrency. currencies.zero_decimal_currencies
    let finaleCurrency = []
    finaleCurrency = OriginCurreciesOB.filter(item => item.code.toLowerCase() === this.state.finaleCurrency)

    Object.assign(finaleCurrency[0], { zero_decimal_currencies: currencies.zero_decimal_currencies });
    Object.assign(finaleCurrency[0], { curr_name: finaleCurrency[0].name });
    Object.assign(finaleCurrency[0], { code: finaleCurrency[0].code.toLowerCase() });

    delete finaleCurrency[0].name;


    if (selectedAggregator === null || use_driver_aggregator === false) {
      // selectedAggregator = null
//	errorToaster("Please select aggregator")
    }
    

    if (clientCity != "") {
      let APIBody = {
        user_id: ID,
        raz_account_id: AccountID,
        name: ownerName,
        email: ownerEmail,
        userType: "owner",
        address: [
          {
            landmark: resturantLandmark,
            user_address: resturantAddress,
          },
        ],
        currencies: finaleCurrency[0],
        //location: location,
        //delivery_area: this.state.delivery_area,
        location: {
          "type": "Point",
          "coordinates": [
            21.2389536864171,
            72.8166706860065
          ]
        },
        delivery_area: {
          "type": "MultiPolygon",
          "coordinates": [
            [[[21.298698,
              72.744489
            ],
            [
              21.150921,
              72.731604
            ],
            [
              21.08997,
              72.92384
            ],
            [
              21.287689,
              72.962394
            ],
            [
              21.298698,
              72.744489
            ]]]
          ]
        },
        Working_hours: this.state.day,
        restaurant_Name: resturantName,
        restaurant_Description: resturantDescription,
        restaurant_city: clientCity,
        use_driver_aggregator: use_driver_aggregator,
        aggregator_id: selectedAggregator,
        restaurant_Minimum_order: minimumorder,
        self_service: self_service,
        hosting_Address: hostName
      }
      // let API = userData.userType === "admin" ?
      //   requests.fetchUpdateOwnerProfileByAdmin
      //   : requests.fetchUpdateProfile
      let API = null
      if (userData.userType === "admin") {
        API = requests.fetchUpdateOwnerProfileByAdmin
        Type === "outlet" ?
          delete APIBody.hosting_Address
          :
          Object.assign(APIBody, { hosting_Address: hostName })

      } else {
        if (Type === "outlet") {
          API = requests.fetchUpdateOutletProfile
          delete APIBody.hosting_Address
        } else {
          API = requests.fetchUpdateProfile
        }
      }
      const response = await instance
        .patch(API, APIBody, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        .catch((error) => {
          let errorMessage = error.response.data.error.message;
          // errorToaster(errorMessage);
          errorToaster("Please select driver aggregator")
          console.log(errorMessage);
        });

      if (response && response.data) {
        successToaster("Record successfully updated!")
        // let ownerData = response.data.data;
        // this.props.OWNER_PROFILE_UPDATE(ownerData);
        // userData.userType === "owner" &&
        // this.props.LOGIN_USER_DETAIL(ownerData);
        this.getrestaurantDetail()

      }
    } else {
      errorToaster("Please select your city");
    }

  };

  getrestaurantDetail = async () => {
    this.setState({ LoaderShow: true });
    let ID = null;
    // if (userData.userType === "admin") {
    //   ID = StoreRestaurantId.id
    // } else {
    //   ID = userData._id
    // }
    if (this.state.pathStatus === "restaurants") {
      ID = userData._id
    } else {
      ID = StoreRestaurantId.id;
    }

    const response = await instance
      .get(requests.fetchGetUserProfileData + "/" + ID, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .catch((error) => {
        this.setState({ LoaderShow: false });
        let errorMessage = error.response.data.error.message;
        console.log(errorMessage);
        errorToaster(errorMessage);
      });
    if (response && response.data) {
      const cityI = response.data.data.cities;
      this.props.GET_CITY_LIST_WITH_ID(cityI);
      const Initialdata = {
        day: [
          {
            isChecked: false,
            weekDay: 0,
            openingTime: "",
            closingTime: "",
          },
          {
            isChecked: false,
            _id: "5f7560c75e307a42445cbdd7",
            weekDay: 1,
            openingTime: "",
            closingTime: "",
          },
          {
            isChecked: false,
            _id: "5f7560c75e307a42445cbdd8",
            weekDay: 2,
            openingTime: "",
            closingTime: "",
          },
          {
            isChecked: false,
            _id: "5f7560c75e307a42445cbdd9",
            weekDay: 3,
            openingTime: "",
            closingTime: "",
          },
          {
            isChecked: false,
            _id: "5f7560c75e307a42445cbdda",
            weekDay: 4,
            openingTime: "",
            closingTime: "",
          },
          {
            isChecked: false,
            _id: "5f7560c75e307a42445cbddb",
            weekDay: 5,
            openingTime: "",
            closingTime: "",
          },
          {
            isChecked: false,
            _id: "5f7560c75e307a42445cbddc",
            weekDay: 6,
            openingTime: "",
            closingTime: "",
          },
        ],
      };
      const cd = [];
      const city_data =
        response.data.data.hasOwnProperty("cities") === true
          ? response.data.data.cities.map((Dd, i) => {
            cd[i] = {
              value: Dd._id,
              key: Dd.city_name,
              text: Dd.city_name,
            };
          })
          : [{ value: "", label: "", key: "" }];

      this.setState(
        {
          finaleCurrency: response.data.data.user.hasOwnProperty("currencies") ? response.data.data.user.currencies.code : "",
          country_name: response.data.data.user.country_name,
          country_code: response.data.data.user.country_code,
          resturantAddress:
            response.data.data.user.address.length === 0
              ? ""
              : response.data.data.user.address[0].user_address,
          resturantLandmark:
            response.data.data.user.address.length === 0
              ? ""
              : response.data.data.user.address[0].landmark,
          resturantDescription:
            response.data.data.user.hasOwnProperty("restaurant_Description") ===
              true
              ? response.data.data.user.restaurant_Description
              : "",
          currencies:
            response.data.data.user.hasOwnProperty("currencies") === true
              ? response.data.data.user.currencies
              : {},
          clientCity:
            response.data.data.user.hasOwnProperty("restaurant_city") === true
              ? response.data.data.user.restaurant_city
              : "",
          resturantName:
            response.data.data.user.hasOwnProperty("restaurant_Name") === true
              ? response.data.data.user.restaurant_Name
              : "",
          day:
            response.data.data.user.hasOwnProperty("Working_hours") === true
              ? response.data.data.user.Working_hours
              : Initialdata.day,
          minimumorder:
            response.data.data.user.hasOwnProperty(
              "restaurant_Minimum_order"
            ) === true
              ? response.data.data.user.restaurant_Minimum_order
              : null,
          location:
            response.data.data.user.hasOwnProperty("location") === true
              ? response.data.data.user.location
              : {},
          delivery_area:
            response.data.data.user.hasOwnProperty("delivery_area") === true
              ? response.data.data.user.delivery_area
              : {},
          Cities: cd,
          // response.data.data.hasOwnProperty("cities") === true
          //   ? response.data.data.cities
          //   : [],
          imagePrev:
            response.data.data.user.hasOwnProperty("restaurant_image") === true
              ? `${response.data.data.user.restaurant_image.image_url}`
              : process.env.REACT_APP_DEFAULT_IMAGE,
          coverImagePrev:
            response.data.data.user.hasOwnProperty("restaurant_cover_image") ===
              true
              ? `${response.data.data.user.restaurant_cover_image.image_url}`
              : process.env.REACT_APP_DEFAULT_IMAGE,
          QRCode:
            response.data.data.user.hasOwnProperty("qrcode") === true
              ? `${response.data.data.user.qrcode}`
              : (userData.userType === "owner" && userData.is_outlet === false) ? userData.qrcode : process.env.REACT_APP_DEFAULT_IMAGE,
          ownerName:
            response.data.data.user.hasOwnProperty("name") === true
              ? `${response.data.data.user.name}`
              : "",
          ownerEmail:
            response.data.data.user.hasOwnProperty("email") === true
              ? `${response.data.data.user.email}`
              : "",
          ownerPhone:
            response.data.data.user.hasOwnProperty("phone") === true
              ? `${response.data.data.user.phone}`
              : "",
          hostName:
            response.data.data.user.hasOwnProperty("hosting_Address") === true
              ? `${response.data.data.user.hosting_Address}`
              : "",
          selectedAggregator:
            response.data.data.user.hasOwnProperty("aggregator_id") === true
              ? `${response.data.data.user.aggregator_id}`
              : null,
          self_service:
            response.data.data.user.hasOwnProperty("self_service") === true
            && response.data.data.user.self_service,
          use_driver_aggregator:
            response.data.data.user.hasOwnProperty("use_driver_aggregator") === true
              ? response.data.data.user.use_driver_aggregator
              : false,
          flagForRender: true,
          AccountID:
            response.data.data.user.hasOwnProperty("raz_account_id") === true
              ? response.data.data.user.raz_account_id
              : null,
          is_outlet_user: response.data.data.user.hasOwnProperty("is_outlet") === true
            ? response.data.data.user.is_outlet
            : false,

        },
        () => {
          Axios.get(`https://restcountries.eu/rest/v2/name/${this.state.country_name.toLowerCase()}?fullText=true&fields=name;currencies;alpha2Code;`)
            .then((response) => {
              let currency = response.data[0].currencies
              let currencies = []
              currency.map((item, i) => {
                let currencyOB = {
                  value: item.code.toLowerCase(),
                  key: item.code,
                  text: `${item.code} ( ${item.name}  ${item.symbol} )`,
                };
                currencies.push(currencyOB)
              })
              this.setState({
                currenciesOB: currencies,
                OriginCurreciesOB: currency,
                LoaderShow: false
              })
            })
            .catch((error) => {
              errorToaster(error)
	      
            })

        }
      );
      // this.addEditPolyGon();
    }
  };

  addEditPolyGon = () => {
    if (this.mapRef && this.mapRef.current) {
      const map = this.mapRef.current.leafletElement;

      /** Add the feature group and draw control to the map. */
      let drawnItems = new L.FeatureGroup();
      map.addLayer(drawnItems);
      const drawControl = new L.Control.Draw({
        position: "topright",
        draw: {
          polyline: false,
          rectangle: false,
          circlemarker: false,
          polygon: true,
          circle: false,
          marker: false,
        },
        edit: {
          featureGroup: drawnItems,
          remove: true,
        },
      });
      map.addControl(drawControl);
      map.on(L.Draw.Event.CREATED, (e, i) => {
        const type = e.layerType;
        const layer = e.layer;
        // if (type === "marker") {
        //   layer.bindPopup("popup");
        // }

        drawnItems.addLayer(layer);

        const geoJSON = drawnItems.toGeoJSON();
        const layers = drawnItems.getLayers();


        geoJSON.features.map((poly, i) => {

          polyGone[i] = poly.geometry.coordinates;
        });


        const data = {
          type: "MultiPolygon",
          coordinates: polyGone,
        };
        this.setState(
          {
            delivery_area: data,
          }
        );
      });

      map.on(L.Draw.Event.DELETED, (e, i) => {
        const type = e.layerType;
        const layer = e.layer;
        // if (type === "marker") {
        //   layer.bindPopup("popup");
        // }


        const geoJSON = drawnItems.toGeoJSON();
        const layers = drawnItems.getLayers();


        const a = [];
        geoJSON.features.map((poly, i) => {

          a[i] = poly.geometry.coordinates;
        });

        polyGone = a;

        const data = {
          type: "MultiPolygon",
          coordinates: polyGone,
        };

        this.setState(
          {
            delivery_area: data,
          }
        );
      });

      map.on(L.Draw.Event.EDITED, (e) => {
        const layers = e.layers;
        let countOfEditedLayers = 0;
        layers.eachLayer((layer) => {
          countOfEditedLayers++;
        });
        const geoJSON = drawnItems.toGeoJSON();
        geoJSON.features.map((poly, i) => {
          polyGone[i] = poly.geometry.coordinates;
          const data = {
            type: "MultiPolygon",
            coordinates: polyGone,
          };
          this.setState(
            {
              delivery_area: data,
            }
          );
        });
      });

      this.setState({ map: map });
    }
  };

  componentDidMount = () => {
    const { history } = this.props;
    const path = history.location.pathname;

    let splitPath = path.split("/");
    this.setState({
      pathStatus: splitPath[1]
    }, () => {
      this.getrestaurantDetail();
      this.addEditPolyGon();
      this.getAggregator();
    })
  };

  getAggregator = async () => {
    const body = {
      "pageno": this.state.currentPage,
      "perpage": 10,
      "fetchAll": false,
    };
    const response = await instance
      .post(requests.fetchAggregatorDetailsForAdmin, body, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .catch((error) => {
        let errorMessage = error.response.data.error.message;
         errorToaster(errorMessage);
errorToaster("Please select aggregator")
        console.log(errorMessage);
      });
    if (response && response.data) {
      let Aggregators = [];
      const option =
        response.data.data.Aggregators != null
          ? response.data.data.Aggregators.filter((data) => data.isActive === true)
            .map((data, i) => {
              Aggregators[i] = {
                value: data._id,
                key: data._id,
                text: data.name,
              }
            })
          : [{ value: "", text: "", key: "" }];
      this.setState({
        AggregatorsOption: Aggregators,
      });
      this.setState({ Loader: false });
    }
  }

  clearPolygon = () => {
    const data = {
      type: "MultiPolygon",
      coordinates: polyGone,
    };
    this.setState(
      {
        delivery_area: data,
      }
    );
  };
  render() {
    const {
      country_code,
      AccountID,
      use_driver_aggregator,
      AggregatorsOption,
      selectedAggregator,
      resturantName,
      resturantDescription,
      resturantAddress,
      clientCity,
      minimumorder,
      image,
      coverImage,
      day,
      location,
      Cities,
      LoaderShow,
      imagePrev,
      coverImagePrev,
      resturantLandmark,
      QRCode,
      ownerName,
      ownerEmail,
      ownerPhone,
      self_service,
      is_outlet_user,
      currenciesOB,
      currencies,
      finaleCurrency,
      hostName
    } = this.state;
    let routes = null
    if (userData.userType === "admin") {
      routes = adminRoutes
    }
    else {
      routes = ownerRoutes
    }

    return (
      <>
        {/* <Header /> */}
        {
          this.state.pathStatus !== "restaurants" &&
          <Sidebar
            {...this.props}
            routes={routes}
            logo={{
              innerLink: "/dashboard",
              imgSrc: require("assets/img/brand/argon-react.png"),
              imgAlt: "...",
            }}
          />
        }


        <div className="main-content" ref="mainContent">
          <Navbar />
          {
            (userData.userType === "admin" && StoreRestaurantId.userType !== "outlet") &&
            <>
              <Container className="pt-7" fluid>
                <Row>
                  <Col md={12} lg={12} xl={12} xs={12} sm={12}>
                    <Nav
                      // className="nav-fill flex-column flex-md-row tabbable sticky "
                      className="nav-fill flex-column flex-md-row"
                      id="tabs-icons-text"
                      pills
                      role="tablist"
                    >
                      <NavItem >
                        <NavLink
                          aria-selected={this.state.tabsForManagement === 3}
                          className={classnames("mb-sm-3 mb-md-0", {
                            active: this.state.tabsForManagement === 3,
                          })}
                          onClick={(e) => this.toggleNavs(e, "tabsForManagement", 3)}
                          href="#pablo"
                          role="tab"
                        >
                          <i className="ni ni-shop text-info mr-2"></i>
                          {/* <i className="ni ni-cloud-upload-96 mr-2" /> */}
                          {("Main Branch Restaurant Information")}
                        </NavLink>
                      </NavItem>
                      <NavItem >
                        <NavLink
                          aria-selected={this.state.tabsForManagement === 4}
                          className={classnames("mb-sm-3 mb-md-0", {
                            active: this.state.tabsForManagement === 4,
                          })}
                          onClick={(e) => this.toggleNavs(e, "tabsForManagement", 4)}
                          href="#pablo"
                          role="tab"
                        >
                          <i className="fas fa-users text-info mr-2"></i>
                          {i18next.t("Outlets Management")}
                        </NavLink>
                      </NavItem>
                    </Nav>

                  </Col>
                </Row>
              </Container>
            </>
          }
          <TabContent
            activeTab={this.state.tabsForManagement}
            sm={12}
            md={12}
            xl={12}
            xs={12}
          >
            <TabPane tabId={3} md={12} ld={12} sm={12} xs={12} lg={12}>
              <Container className="pt-6" fluid>
                <Row>
                  <Loader open={this.state.LoaderShow} />
                  <Col xs={12} sm="12 mb-4" xl={6} className="card-left ">
                    <Card className="bg-secondary shadow">
                      <CardHeader className="bg-white border-0">
                        <Row className="align-items-center">
                          <Col className="p-3" md={7} xl={7} lg={7} sm={7} xs={12}>
                            <h3 className="mb-0">{i18next.t("Restaurant Management")} </h3>
                          </Col>
                          <Col className="p-3 text-center" md={5} xl={5} lg={5} sm={5} xs={12}>

                            {/* {
                              userData.userType === "admin" &&
                              <Link to={`/restaurants`}>
                                <Button color="primary" size="sm">
                                  {i18next.t("Back to List")}
                                </Button>
                              </Link>
                            } */}
                            {/* <Link to={`/restaurant/${resturantName}`}> */}
                            {/* <Link to={{ pathname: `${hostName}` }} target="_blank" > */}
                            <a href={`https://${hostName}/#/`} target="_blanck">
                              <Button
                                color="primary"
                                size="sm"
                                className="ml-2"
                                //onClick={this.storeOwnerId}
                              >
                                {i18next.t("View it")}
                              </Button>
                            </a>
                            {/* </Link> */}
                            {/* </Link> */}
                            <Button
                              color="primary"
                              size="sm"
                              className="ml-2"
                              onClick={this.props.history.goBack}
                            >
                              {i18next.t("Back")}
                            </Button>
                          </Col>
                        </Row>
                      </CardHeader>
                      <CardBody>
                        <div className="pl-lg-4 px-lg-4">
                          <Form>
                            {country_code === "in" && userData.userType === "admin" ? (
                              <>
                                <h6 className="heading-small text-muted mb-4">
                                  {i18next.t("RESTAURANT ACCOUNT INFORMATION")}
                                </h6>
                                <FormGroup>
                                  <Label
                                    className="mb-2 font-weight-bold"
                                    for="resturantAccountID"
                                  >
                                    {i18next.t("Razorpay Account ID")}
                                  </Label>
                                  <Input
                                    className="px-2 py-4"
                                    type="text"
                                    placeholder={i18next.t("Razorpay Account ID")}
                                    name="AccountID"
                                    value={AccountID}
                                    onChange={this.handlechangeall}
                                  />
                                </FormGroup>
                              </>
                            ) : null}
                            <h6 className="heading-small text-muted mb-4">
                              {i18next.t("RESTAURANT INFORMATION")}
                            </h6>
                            <FormGroup>
                              <Label
                                className="mb-2 font-weight-bold"
                                for="resturantName"
                              >
                                {i18next.t("Restaurant Name")}
                              </Label>
                              <Input
                                readOnly={is_outlet_user === true || userData.is_outlet === true ? true : false}
                                className="px-2 py-4"
                                type="text"
                                placeholder={i18next.t("Restaurant Name")}
                                name="resturantName"
                                value={resturantName}
                                onChange={this.handlechangeall}
                              />
                            </FormGroup>
                            <FormGroup>
                              <Label
                                className="mb-2 font-weight-bold"
                                for="Restaurant Description"
                              >
                                {i18next.t("Restaurant Description")}
                              </Label>
                              <Input
                                className="px-2 py-4"
                                type="text"
                                placeholder="Restaurant Description"
                                name={i18next.t("resturantDescription")}
                                value={resturantDescription}
                                onChange={this.handlechangeall}
                              />
                            </FormGroup>
                            <FormGroup>
                              <Label
                                className="mb-2 font-weight-bold"
                                for="resturantAddress"
                              >
                                {i18next.t("Restaurant Address")}
                              </Label>
                              <Input
                                className="px-2 py-4"
                                type="text"
                                placeholder={i18next.t("Restaurant Address")}
                                name="resturantAddress"
                                value={resturantAddress}
                                onChange={this.handlechangeall}
                              />
                            </FormGroup>
                            <FormGroup>
                              <Label className="mb-2 font-weight-bold" for="landmark">
                                {i18next.t("Restaurant Landmark")}
                              </Label>
                              <Input
                                className="px-2 py-4"
                                type="text"
                                placeholder={i18next.t("Restaurant landmark")}
                                name="resturantLandmark"
                                value={resturantLandmark}
                                onChange={this.handlechangeall}
                              />
                            </FormGroup>

                            <FormGroup>
                              <Label className="mb-2 font-weight-bold" for="client">
                                {i18next.t("Restaurant city")}
                              </Label>
                              <Dropdown
                                placeholder={i18next.t("Select City")}
                                fluid
                                search
                                selection
                                clearable
                                name="clientCity"
                                value={this.state.clientCity}
                                options={this.state.Cities}
                                onChange={this.handleSelectChange}
                              // name="client"
                              />
                            </FormGroup>
                            <FormGroup>
                              <Label
                                className="mb-2 mt-2 font-weight-bold"
                                for="resturantName"
                              >
                                {i18next.t("Assign Driver Aggregator")}
                              </Label><br />
                              <label className="custom-toggle">
                                {use_driver_aggregator === true ? (
                                  <input
                                    defaultChecked
                                    type="checkbox"
                                    name="use_driver_aggregator"
                                    value={use_driver_aggregator}
                                    onChange={this.handlechangeRadio}
                                  />
                                ) : (
                                  <input
                                    type="checkbox"
                                    name="use_driver_aggregator"
                                    value={use_driver_aggregator}
                                    onChange={this.handlechangeRadio}
                                  />
                                )}
                                <span className="custom-toggle-slider rounded-circle" />
                              </label>
                            </FormGroup>
                            {
                              use_driver_aggregator === true &&
                              <FormGroup>
                                <Label className="mb-2 font-weight-bold" for="client">
                                  {i18next.t("Driver Aggregator")}
                                </Label>
                                <Dropdown
                                  placeholder={i18next.t("Select Aggregator")}
                                  fluid
                                  search
                                  selection
                                  clearable
                                  name="selectedAggregator"
                                  value={selectedAggregator}
                                  options={AggregatorsOption}
                                  onChange={this.handleSelectChange}
                                // name="client"
                                />
                              </FormGroup>
                            }
                            <FormGroup>
                              <Label
                                className="mb-2 font-weight-bold"
                                for="minimumorder"
                              >
                                {i18next.t("Minimum Order Price")}
                              </Label>
                              <Input
                                className="px-2 py-4"
                                type="number"
                                placeholder={i18next.t("Enter Minimum Order Value")}
                                name="minimumorder"
                                value={minimumorder}
                                onChange={this.handlechangeall}
                                min="0"
                                invalid={minimumorder < 0}
                              />
                              <FormFeedback invalid>
                                Uh oh! please give a valid price.
                              </FormFeedback>
                            </FormGroup>
                            <FormGroup>
                              <Label
                                className="mb-2 mt-2 font-weight-bold"
                                for="self_service"
                              >
                                {i18next.t("Self Service")}
                              </Label><br />
                              <label className="custom-toggle">
                                {self_service === true ? (
                                  <input
                                    defaultChecked
                                    type="checkbox"
                                    name="self_service"
                                    value={self_service}
                                    onChange={this.handlechangeRadio}
                                  />
                                ) : (
                                  <input
                                    type="checkbox"
                                    name="self_service"
                                    value={self_service}
                                    onChange={this.handlechangeRadio}
                                  />
                                )}
                                <span className="custom-toggle-slider rounded-circle" />
                              </label>
                            </FormGroup>
                            <FormGroup>
                              <Label for="Currency Code">{i18next.t("Currency Code")}</Label>
                              <Dropdown
                                placeholder={i18next.t("Select Currency")}
                                fluid
                                search
                                selection
                                clearable
                                name="finaleCurrency"
                                value={finaleCurrency}
                                options={this.state.currenciesOB}
                                onChange={this.handleSelectChange}
                              // name="client"
                              />
                            </FormGroup>
                            <FormGroup>
                              <Label className="mb-2 font-weight-bold" for="input-hostname">
                                {i18next.t("Hosting Address")}
                              </Label>
                              <h6 className="text-muted mb-4">
                                {i18next.t("Ex. <restaurant_name>.appetizar.io")}
                              </h6>
                              <Input
                                required
                                className="px-2 py-4"
                                placeholder={i18next.t("Hosting Address")}
                                type="text" name="hostName"
                                value={this.state.hostName}
                                onChange={this.handlechangeall}
                                readOnly={is_outlet_user === true || userData.is_outlet === true ? true : false}
                              />
                            </FormGroup>
                            <Row>
                              <Col md={6}>
                                <FormGroup className="text-center font-weight-bold mb-6">
                                  <Label focdr="input-name">{i18next.t("Restaurant Image")}</Label>
                                  <div className="text-center">
                                    <div
                                      className="fileinput fileinput-new"
                                      dataprovider="fileinput"
                                    >
                                      <div className="fileinput-preview img-thumbnail">
                                        <img
                                          src={image.length !== 0 ? image : imagePrev}
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
                                        {image.length === 0 ? (
                                          <span className="fileinput-new">
                                            {i18next.t("Upload Image")}
                                          </span>
                                        ) : (
                                          <span className="fileinput-exists">
                                            {i18next.t("Change")}
                                          </span>
                                        )}
                                        <input
                                          type="file"
                                          name="resto_logo"
                                          onChange={(e) => this.handleFileChange(e)}
                                          accept="image/x-png,image/gif,image/jpeg"
                                        />
                                      </span>
                                      {image.length !== 0 && (
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

                              </Col>
                              <Col md={6}>
                                <FormGroup className="text-center font-weight-bold mb-6">
                                  <Label for="input-name">
                                    {i18next.t("Restaurant Cover Image")}
                                  </Label>
                                  <div className="text-center">
                                    <div
                                      className="fileinput fileinput-new"
                                      dataprovider="fileinput"
                                    >
                                      <div className="fileinput-preview img-thumbnail">
                                        <img
                                          src={
                                            coverImage.length !== 0
                                              ? coverImage
                                              : coverImagePrev
                                          }
                                          style={{
                                            width: "90%",
                                            height: "100px",
                                            objectFit: "cover",
                                          }}
                                        />
                                      </div>
                                    </div>
                                    <div>
                                      <span className="btn btn-outline-secondary btn-file mt-3">
                                        {coverImage.length === 0 ? (
                                          <span className="fileinput-new">
                                            {i18next.t("Upload Image")}
                                          </span>
                                        ) : (
                                          <span className="fileinput-exists">
                                            {i18next.t("Change")}
                                          </span>
                                        )}
                                        <input
                                          type="hidden"
                                          value=""
                                          name="resto_logo"
                                        />
                                        <input
                                          onChange={(e) => { this.handlecoverFileChange(e) }}
                                          type="file"
                                          name=""
                                          accept="image/x-png,image/gif,image/jpeg"
                                        />
                                      </span>
                                      {coverImage.length !== 0 && (
                                        <button
                                          className="btn btn-outline-secondary fileinput-exists mt-3"
                                          data-dismiss="fileinput"
                                          onClick={this.handleRemoveCoverFile}
                                        >
                                          {i18next.t("Remove")}
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                </FormGroup>
                              </Col>
                            </Row>
                          </Form>
                        </div>

                        <hr className="my-4" />

                        <h6 className="heading-small text-muted mb-4">
                          {i18next.t("Owner information")}
                        </h6>
                        <div className="pl-lg-4 px-lg-4">
                          <FormGroup className="focused">
                            <Label
                              className="mb-2 font-weight-bold "
                              for="OwnerName  "
                            >
                              {i18next.t("Owner Name")}
                            </Label>
                            <Input
                              className="px-2 py-4 form-control-alternative"
                              type="text"
                              placeholder={i18next.t("Owner Name")}
                              name="OwnerName"
                              value={ownerName}
                              readOnly
                            />
                          </FormGroup>

                          <FormGroup className="focused">
                            <Label
                              className="mb-2 font-weight-bold "
                              for="OwnerEmail  "
                            >
                              {i18next.t("Owner Email")}
                            </Label>
                            <Input
                              className="px-2 py-4 form-control-alternative"
                              type="email"
                              placeholder={i18next.t("Owner Email")}
                              name="OwnerEmail"
                              value={ownerEmail}
                              readOnly
                            />
                          </FormGroup>

                          <FormGroup className="focused">
                            <Label
                              className="mb-2 font-weight-bold "
                              for="OwnerPhone"
                            >
                              {i18next.t("Owner Phone")}
                            </Label>
                            <Input
                              className="px-2 py-4 form-control-alternative"
                              type="text"
                              placeholder={i18next.t("Owner Phone")}
                              name="OwnerPhone"
                              value={ownerPhone}
                              readOnly
                            />
                          </FormGroup>
                        </div>
                      </CardBody>
                    </Card>
                  </Col>

                  <Col className="card-right" xs={12} sm={12} xl={6}>
                    <Card className="card-profile shadow">
                      <CardHeader className="bg-white border-0">
                        <Row className="align-items-center">
                          <Col xs="8">
                            <h2 className="mb-0">{i18next.t("Restaurant Location")}</h2>
                          </Col>
                        </Row>
                      </CardHeader>
                      <hr className="my-1" />
                      <CardBody className="pt-0 pt-md-4">
                        <div className="nav-wrapper">
                          <Nav
                            className="nav-fill flex-column flex-md-row px-2"
                            id="tabs-icons-text"
                            pills
                            role="tablist"
                          >
                            <NavItem>
                              <NavLink
                                aria-selected={this.state.tabs === 1}
                                className={classnames("mb-sm-3 mb-md-0 btn", {
                                  active: this.state.tabs === 1,
                                })}
                                onClick={(e) => this.toggleNavs(e, "tabs", 1)}
                                role="tab"
                              >
                                {i18next.t("Location")}
                              </NavLink>
                            </NavItem>
                            <NavItem>
                              <NavLink
                                aria-selected={this.state.tabs === 2}
                                className={classnames("mb-sm-3 mb-md-0 btn", {
                                  active: this.state.tabs === 2,
                                })}
                                onClick={(e) => {
                                  this.toggleNavs(e, "tabs", 2);
                                }}
                                role="tab"
                              >
                                {i18next.t("Delivery Area")}
                              </NavLink>
                            </NavItem>
                          </Nav>
                        </div>
                        <Card className="shadow mt-4 mx-2">
                          <CardBody>
                            <TabContent activeTab={`tabs${this.state.tabs}`}>
                              <TabPane tabId="tabs1">
                                <MapContainer
                                  center={
                                    Object.keys(this.state.location).length === 0
                                      ? [21.1702, 72.8311]
                                      : location.coordinates
                                  }
                                  zoom={12}
                                  style={{ height: "33rem", width: "100%" }}
                                  ref={this.mapRef}
                                  scrollWheelZoom={false}
                                >
                                  <TileLayer
                                    attribution='&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                  />
                                  {LoaderShow === false && (
                                    <>
                                      {this.state.location.coordinates ? (
                                        <Marker
                                          position={location.coordinates}
                                          icon={this.getIcon()}
                                          zIndexOffset={1000}
                                          draggable={true}
                                          onDragend={this.eventHandlersGetLOcation}
                                        />
                                      ) : (
                                        <Marker
                                          position={[21.1702, 72.8311]}
                                          draggable={true}
                                          onDragend={this.eventHandlersGetLOcation}
                                          icon={this.getIcon()}
                                          zIndexOffset={1000}
                                        />
                                      )}
                                    </>
                                  )}
                                </MapContainer>
                              </TabPane>
                              <TabPane tabId="tabs2">
                                <MapContainer
                                  center={
                                    Object.keys(this.state.location).length === 0
                                      ? [21.1702, 72.8311]
                                      : location.coordinates
                                  }
                                  zoom={13}
                                  style={{ height: "33rem", width: "100%" }}
                                  ref={this.mapRef}
                                  scrollWheelZoom={false}
                                >
                                  <TileLayer
                                    attribution='&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                  />
                                  {LoaderShow === false &&
                                    this.state.location.coordinates && (
                                      <Marker
                                        position={location.coordinates}
                                        icon={this.getIcon()}
                                        zIndexOffset={1000}
                                      />
                                    )}
                                  {LoaderShow === false &&
                                    this.state.delivery_area.coordinates && (
                                      <Polygon
                                        positions={
                                          this.state.delivery_area.coordinates
                                        }
                                        zIndexOffset={1000}
                                        color="blue"
                                      />
                                    )}
                                </MapContainer>
                                <Button
                                  block
                                  color="danger"
                                  size="lg"
                                  type="button"
                                  className="mt-4 p-2"
                                  onClick={this.clearPolygon}
                                >
                                  {i18next.t("Clear Delivery Area")}
                                </Button>
                              </TabPane>
                            </TabContent>
                          </CardBody>
                        </Card>
                      </CardBody>
                    </Card>

                    <br />

                    <Card className="card-profile shadow">
                      <CardHeader className="bg-white border-0">
                        <Row className="align-items-center">
                          <Col xs="8">
                            <h2 className="mb-0">{i18next.t("Working Hours")}</h2>
                          </Col>
                        </Row>
                      </CardHeader>
                      <hr className="my-1" />
                      <CardBody className="pt-0 pt-md-4">
                        <Form>
                          <FormGroup>
                            <br />
                            {this.state.day.map((day, i) => {
                              return (
                                <Workinghourse
                                  key={i}
                                  i={i}
                                  data={day}
                                  handleWorkingHours={this.handleWorkingHours}
                                />
                              );
                            })}
                          </FormGroup>
                        </Form>
                      </CardBody>
                    </Card>
                    <br />

                    <Card className="card-profile shadow">
                      <CardHeader className="bg-white border-0">
                        <Row className="align-items-center">
                          <Col xs="8">
                            <h2 className="mb-0">{i18next.t("QR code")}</h2>
                          </Col>
                        </Row>
                      </CardHeader>
                      <hr className="my-1" />
                      <CardBody className="pt-0 pt-md-4">
                        <Form>
                          <FormGroup>
                            <br />
                            <div className="text-center">
                              <img
                                src={userData.userType === "admin" ? StoreRestaurantId.qrcode :
                                  QRCode}
                                style={{
                                  width: "50%",
                                  height: "50%",
                                }}
                              />
                              <br />
                              <Button
                                color="primary"
                                download
                                onClick={() => {
                                  this.download(
                                    userData.userType === "admin" ? StoreRestaurantId.qrcode : QRCode
                                  )
                                }}
                              >
                                <i className="fa fa-download" />
                                      &nbsp; Download
                                    </Button>
                            </div>

                          </FormGroup>
                        </Form>
                      </CardBody>
                    </Card>

                  </Col>

                  <Col md={12} lg={12} sm={12} xl={12} className="text-center">
                    <Button
                      size="lg"
                      type="button"
                      color="success"
                      onClick={this.onUpdateOwnerProfile}
                    >
                      {i18next.t("save")}
                    </Button>
                  </Col>
                </Row>

              </Container>
            </TabPane>

            <TabPane tabId={4} md={12} ld={12} sm={12} xs={12} lg={12}>
              <Container fluid>
                <Row>
                  {
                    this.state.tabsForManagement === 4 &&
                    <Redirect
                      to="/outlets"
                      state={StoreRestaurantId.restaurant_Name}
                    />
                    // <OutletList />
                  }
                  {/* <OutletList /> */}
                </Row>
              </Container>
            </TabPane>

          </TabContent>


        </div>


      </>
    );


  }
}

export default connect(mapStateToProps, mapDispatchToProps)(Restaurants);