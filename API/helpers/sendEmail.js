const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
const ejs = require("ejs");
const mails = require("../views/mail/mails.json")
dotenv.config();

const transporter =nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE,
    //secure:false, 
    auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD
    }
});


const mail_template = async (payload)=> {
    const {data,template} = payload;
    const message = {
        from: `Appetizar<${process.env.EMAIL_USERNAME}>`,
        to: data.email,
        subject: "Greetings from Appetizar",
        // text: options.data,
        html: ejs.render(mails[template], {data})
    };
    transporter.sendMail(message)
}

const sendEmail = async options => {
    const message = {
        from: `no-reply<${process.env.EMAIL_USERNAME}>`,
        to: options.email,
        subject: options.subject,
        text: options.message
    };
    await transporter.sendMail(message);
};

module.exports = { sendEmail, mail_template };
