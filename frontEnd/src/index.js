import React from "react";
import ReactDOM from "react-dom";
import App from "./App";
// import './i18n';
// import i18next from "i18next";
import { Provider } from "react-redux";
import { store, persistor } from "./redux/store";
import { PersistGate } from "redux-persist/integration/react";
import "assets/plugins/nucleo/css/nucleo.css";
import "@fortawesome/fontawesome-free/css/all.min.css";
import "assets/scss/argon-dashboard-react.scss";
import 'semantic-ui-css/semantic.min.css';
//import * as serviceWorker from "../src/serviceWorker";

// const lang = localStorage.getItem('lang') || 'en';
// i18next.changeLanguage(lang);

ReactDOM.render(
    <Provider store={store}>
        <PersistGate loading={null} persistor={persistor}>
            <App/>
        </PersistGate>
    </Provider>,
    document.getElementById("root")
);

//serviceWorkerRegistration.register();
// navigator.serviceWorker.register('./serviceWorker');

// // Then later, request a one-off sync:
// navigator.serviceWorker.ready.then(function(swRegistration) {
//     return swRegistration.sync.register('myFirstSync');
// });

//serviceWorker.register()
