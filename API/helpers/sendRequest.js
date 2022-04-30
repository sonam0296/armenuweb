
const axios = require('axios');


const send_req = async (url, payload) => {
    try {
        const postData =JSON.stringify(payload);
        var options = {
            url: url,
            // auth: {
            //     'username': user name here,
            //     'password': pwd here
            // },
            data: postData,
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };
        return await axios(options)
    } catch (err) {
        console.log("error===>",err.response.data);
        err = {
            message: err.response.data.error.description ? err.response.data.error.description : err.response.data
        }
        throw err
    }
}

module.exports = {
    send_req
}