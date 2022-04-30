// const client = require('twilio')(accountSid, authToken);
const dotenv = require('dotenv');
const APIError = require('../helpers/APIError');
const httpStatus = require('http-status');
dotenv.config();

let accountSid = process.env.Account_Sid; // Your Account SID from www.twilio.com/console
let authToken =  process.env.AuthToken;   // Your Auth Token from www.twilio.com/console
const twilio = require('twilio')
const client = new twilio(accountSid, authToken);

const sendSMS = async (sms,next=undefined) => {
    try {
        let option = {
            body:sms.message,
            to:sms.phone,  // Text this number
            from: process.env.twilio_phone // From a valid Twilio number
        }
        //console.log(option);
        await client.messages.create(option)
    } catch (e) {
        console.log(e);
        return next(new APIError(e.message, httpStatus.BAD_REQUEST, true));;
    }
    
}

module.exports = sendSMS