import firebase from "firebase/app";
import "firebase/storage";
import "firebase/messaging"
import FirebaseConfig from "./Config/firebaseConfig.json"

const config = FirebaseConfig;

firebase.initializeApp(config);

const storage = firebase.storage();
const messaging = firebase.messaging.isSupported() ? firebase.messaging() : null;

// const notification = firebase

export { storage, messaging, firebase as default };
