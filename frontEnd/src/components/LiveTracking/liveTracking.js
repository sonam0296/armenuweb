import React, { Component } from "react";

import { MapContainer, TileLayer, Marker, Popup, Tooltip } from "react-leaflet"
import L from 'leaflet'
import "leaflet/dist/leaflet.css";
import {geolocated} from 'react-geolocated'
import mapLogo from "../../assets/img/icons/common/Map-Pin.svg";


import Navbar from "../Navbars/AdminNavbar";

import {
    Container,
  } from "reactstrap";

navigator.serviceWorker.register("../../serviceWorker");



const DEFAULT_LONGITUDE = 72.8277404;
const DEFAULT_LATITUDE = 21.185378;

class liveTracking extends Component {

  constructor(props) {
    super(props);
    this.mapRef = React.createRef();
    this.state = {
      longitude:null,
      latitude:null
    }
  }
  componentDidMount () {
  }
  
  getIcon = (iSize) => {
    return L.icon({
      iconUrl: mapLogo,
      iconSize: [iSize],
    });
  };

  render (){
    const longitude = this.props.coords ? this.props.coords.longitude: DEFAULT_LONGITUDE;
    const latitude = this.props.coords ? this.props.coords.latitude: DEFAULT_LATITUDE;
    //const longitude = DEFAULT_LATITUDE ;
    //const latitude =  DEFAULT_LONGITUDE;
    // let {longitude, latitude} = this.state;
    console.log("latitude",latitude);
    console.log("longitude",longitude);

    return (
        <div className="main-content" ref="mainContent">
        <Navbar />
          <Container className="pt-7" fluid>
            <MapContainer
              //ref={this.mapRef}
              center={{lon:longitude,lat:latitude}}
              zoom={13}
              style={{ height: "33rem", width: "100%", zIndex:0 }}
              zIndexOffset={1000}
              scrollWheelZoom={true}
            >
            <TileLayer
                attribution='&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <Marker
              //ref={this.mapRef}
              center={{lon:latitude,lat: longitude}}
              position={{lon:longitude,lat:latitude}}
              icon={this.getIcon()}
              zIndexOffset={1000}
              // draggable={true}
              //onDragend={this.eventHandlersGetLOcation}
            >
              <Tooltip>You are hear!</Tooltip>
              {/* <Popup>                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               
                
              </Popup> */}
            </Marker>
            </MapContainer>
          </Container>
        </div>        
    );
  }
    
}
export default geolocated({
  positionOptions:{
    enableHighAccuracy: true,
  },
  userDecisionTimeout:10000,
  watchPosition:true,
})(liveTracking)
