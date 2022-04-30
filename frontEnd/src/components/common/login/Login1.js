import React, { useState, useEffect } from "react";

import { useHistory } from "react-router-dom"

import { useSelector, useDispatch } from 'react-redux';

import { errorToaster, successToaster } from "../common-validation/common";

import i18next from "i18next";

import { messaging } from "../../../firebase";

import {
  GET_FCM_REGISTRATION_TOKEN,
  LOGIN_USER_DETAIL,
  TOKEN_KEY
} from "../../../redux/action";

import instance from "../../../axios";
import requests from "../../../requests";

import Avatar from '@material-ui/core/Avatar';
import Button from '@material-ui/core/Button';
// import CssBaseline from '@material-ui/core/CssBaseline';
import TextField from '@material-ui/core/TextField';

import Link from '@material-ui/core/Link';
import Paper from '@material-ui/core/Paper';
import Grid from '@material-ui/core/Grid';

import HomeHeader from "../header/HomeHeader.js";

//import LockOutlinedIcon from '@material-ui/icons/LockOutlined';

import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';

import SwiperCore, { Navigation, Pagination, Scrollbar, A11y, Autoplay, Virtual } from 'swiper';

import { Swiper, SwiperSlide } from 'swiper/react';

// import { LoginImage } from "../../../assets/img/theme/food banner.jpg"

// import loginimage from "../../../assets/img/theme/food-8.webp";
import loginimage from "../../../assets/img/theme/6992.jpg";

import "./login.css"

// Import Swiper styles
import 'swiper/swiper.scss';
import 'swiper/components/navigation/navigation.scss';
import 'swiper/components/pagination/pagination.scss';
import 'swiper/components/scrollbar/scrollbar.scss';
import 'swiper/components/controller/controller.scss';
import 'swiper/swiper-bundle.css';
import 'swiper/swiper-bundle.min.css'

SwiperCore.use([Navigation, Pagination, Scrollbar, A11y, Autoplay, Virtual]);



const useStyles = makeStyles((theme) => ({
  root: {
    height: '90vh',

  },
  image: {
    // backgroundImage: 'url(https://source.unsplash.com/random)',

    // backgroundImage: `url(https://appetizar.nyc3.digitaloceanspaces.com/1611484032538-food%20banner.jpg)`,

    backgroundImage: `url(${loginimage})`,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: "space-between",
    // boxShadow: "inset 0px 0px 100vh black",

    // boxShadow: "inset 0 0 0 2000px rgba(0, 0, 0, 0.3)",
    backgroundRepeat: 'no-repeat',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  },

  paper: {
    margin: theme.spacing(8, 4),
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  avatar: {
    margin: theme.spacing(1),
    backgroundColor: "#F18A48",
  },
  form: {
    width: '100%', // Fix IE 11 issue.
    marginTop: theme.spacing(1),
  },
  submit: {
    margin: theme.spacing(3, 0, 2),
  },
}));

function Login1() {
  const dispatch = useDispatch();
  let history = useHistory();

  const classes = useStyles();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fcm_registration_token, setFcm_registration_token] = useState("");
  const [isSafari, setIsSafari] = useState(false);
  const [scm_flag, setFcm_flag] = useState(true);
  const [site_id, setSite_id] = useState("5f896cf681eb0371e0dfba39");
  const [site_content, setSite_content] = useState([])
  const token = useSelector(state => state.token)



  const handleLogin = async () => {
    let loginUserData = {
      email: email,
      password: password,
      fcm_registration_token: fcm_registration_token
    }
    const response = await instance
      .post(requests.fetchLogin, loginUserData)
      .catch((error) => {
        let errorMessage = error.response.data.error.message;
        errorToaster(errorMessage);
      });

    if (response && response.data) {
      let userData = response.data.data.user;
      dispatch(LOGIN_USER_DETAIL(userData));
      let token = response.data.data.token;
      dispatch(TOKEN_KEY(token));
      
      if (userData.userType === "admin") {
        history.push("/dashboard");
        successToaster("Login Successfully");
      } else if (userData.userType === "owner") {
        history.push("/dashboard");
        successToaster("Login Successfully");
      } else if (userData.userType === "driver") {
        history.push("/orders");
        successToaster("Login Successfully");
      } else if (userData.userType === "driver_aggregator") {
        history.push("/dashboard");
        successToaster("Login Successfully");
       } 
      //else {
      //   history.push("/");
      else if(userData.userType === "client"){
        // dispatch(DESTROY_SESSION());
        
          errorToaster("This is a management login other users cannot login");
          // this.props.DESTROY_SESSION();
          
      }
    }

  }

  useEffect(() => {
    if (messaging) {
      Notification.requestPermission().then(() => {
          return messaging.getToken();
        })
        .then((token) => {
          dispatch(GET_FCM_REGISTRATION_TOKEN(token));
          setFcm_registration_token(token);
          setFcm_flag(false);
        })
        .catch((err) => {
          //alert("In Catch");
          console.log(err.message);
        });
      messaging.onMessage(function (payload) {
        console.log("payload :", payload);
      });
    }

    var isSafari =
      navigator.vendor &&
      navigator.vendor.indexOf("Apple") > -1 &&
      navigator.userAgent &&
      navigator.userAgent.indexOf("CriOS") === -1 &&
      navigator.userAgent.indexOf("FxiOS") === -1;
    setIsSafari(isSafari);

    GetLoginPageInfo();

  }, [])

  const GetLoginPageInfo = async () => {

    let APIBody = {
      "site_id": "5f896cf681eb0371e0dfba39",
    };
    const response = await instance
      .post(requests.fetchShowLoginContent, APIBody)
      .catch((error) => {
        let errorMessage = error.response.data.error.message;
        errorToaster(errorMessage);
      });
    if (response && response.data) {
      setSite_content(response.data.data.siteInfo.site_content);
    }
  }

  const ForgotPass = () => {
    history.push("/forgot-password");
  };


  const slides = site_content && site_content.map(
    (el, index) => `${el}`
  );

  return (
    <>
      <HomeHeader />
      <Grid container component="main" className={classes.root}>
        <Grid item xs={false} sm={4} md={7} className={`${classes.image} title_message`}
        >
          <div className="text-center mt-4 display-1" style={{
            color: "#F18A48"
          }}>
            <b>WELCOME TO APPETIZAR!</b>
          </div>

          <div className="text-center"
            style={{ color: "#2B468B" }}
          >
            <Swiper
              virtual
              className="p-3"
              autoplay={{ delay: 3000 }}
              spaceBetween={50}
              slidesPerView={1}
              pagination={{ clickable: true }}
            >
              {slides && slides.map((slideContent, index) => {
                return (
                  <SwiperSlide className="mb-2" key={slideContent} virtualIndex={index}>
                    <div style={{ fontSize: "20px" }}>
                      {slideContent}
                    </div>
                    <br />
                  </SwiperSlide>
                )
              })}
            </Swiper>
          </div>
        </Grid>
        <Grid item xs={12} sm={8} md={5} component={Paper} elevation={6} square>
          <div className={classes.paper}>
            <Avatar className={classes.avatar}>
              {/* <LockOutlinedIcon /> */}
              <i class="fas fa-user-lock text-white"></i>
            </Avatar>
            <div className="display-3" style={{ color: "#2B468B" }}>
              <strong>Sign in</strong>
            </div>
            <form className={classes.form} noValidate>
              <TextField
                variant="outlined"
                margin="normal"
                required
                fullWidth
                id="email"
                label="Email Address"
                name="email"
                onChange={(e) => setEmail(e.target.value)}
                autoFocus
              />
              <TextField
                variant="outlined"
                margin="normal"
                required
                fullWidth
                name="password"
                onChange={(e) => setPassword(e.target.value)}
                label="Password"
                type="password"
                id="password"
              />
              {/* <FormControlLabel
              control={<Checkbox value="remember" color="primary" />}
              label="Remember me"
            /> */}
              <Button
                type="button"
                fullWidth
                variant="contained"
                color="primary"
                className={classes.submit}
                onClick={handleLogin}
              >
                Sign In
            </Button>

            </form>
            <Grid className="text-cenrter">
              <Grid>
                <h4 onClick={ForgotPass} style={{ cursor: "pointer", color: "#2B468B" }}>
                  Forgot password?
                  </h4>
              </Grid>
            </Grid>
          </div>
        </Grid>
      </Grid>
    </>
  );
}

export default Login1;