importScripts("https://www.gstatic.com/firebasejs/8.2.6/firebase-app.js");
importScripts("https://www.gstatic.com/firebasejs/8.2.6/firebase.js");
importScripts("https://www.gstatic.com/firebasejs/8.2.6/firebase-messaging.js");

import FirebaseConfig from "./Config/firebaseConfig.json"

// import { bindActionCreators } from "redux";
// import { ActCreators } from "../../../redux/bindActionCreator";
// import { connect } from "react-redux";

// let token = null;
// let userData = {};
// let get_fcm_registration_token = null;
// let TableNotification = [];


// const mapStateToProps = (state) => {
//     token = state.token;
//     userData = state.userData;
//     get_fcm_registration_token = state.get_fcm_registration_token;
//     TableNotification = state.TableNotification;
// };
// const mapDispatchToProps = (dispatch) => {
//     return bindActionCreators(ActCreators, dispatch);
// };

 // Your web app's Firebase configuration
  // For Firebase JS SDK v7.20.0 and later, measurementId is optional
  var firebaseConfig = FirebaseConfig;


//   // Initialize Firebase
  firebase.initializeApp(firebaseConfig);

  const messaging = firebase.messaging() ;

  messaging.onBackgroundMessage(function(payload) {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);
  });

  self.addEventListener("push", payload => {
    console.log('Push Received.' ,payload);
  })