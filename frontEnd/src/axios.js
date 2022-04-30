import axios from 'axios';

const instance = axios.create({

    baseURL:"https://api.appetizar.io/api",
    // baseURL: 'https://a162402ce9c0.ngrok.io/api',
    //baseURL: 'http://199.43.206.194:6001/api',
});


export default instance;
