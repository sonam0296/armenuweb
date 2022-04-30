const router = require('express').Router();
const authCtrl = require('../controller/auth.controller');
const validate = require('express-validation');
const { authParamsValidation, userParamsValidation } = require('../helpers/joi.validation');
const { protect } = require('../middleware/auth');


router.route('/mobile-registration')
    /** POST /api/auth/send-otp - send otp */
    .post(validate(authParamsValidation.mobi_registration), authCtrl.mobi_registration);

router.route('/verify-otp')
    /** POST /api/auth/send-otp - verify otp */
    .post(
        validate(authParamsValidation.verifyOTP),
        authCtrl.verifyOTP
    );

router.route('/social')
    /** POST /api/auth/social - social authentication */
    .post(
        validate(authParamsValidation.socialAuth),
        authCtrl.socialAuth
    );

router.route('/register')
    /** POST /api/auth/register - user registration(munual) */
    .post(
        validate(userParamsValidation.createUser),
        authCtrl.createUser
    );

//  log in user
router.route('/login')
    /** POST /api/auth/login - login user */
    .post(
        validate(authParamsValidation.login),
        authCtrl.loginUser
    );


// logout user
router.route('/logout')
    /** POST /api/auth/login - login user */
    .post(
        validate(authParamsValidation.logoutUser),
        protect,
        authCtrl.logoutUser
    );
//refresh fcm token
router.route('/refreshtoken')
/** POST /api/auth/login - login user */
.post(
    protect,
    authCtrl.refreshtoken
);

/** PATCH /api/auth/password/change - change user password */
router.route('/password/change')
    .patch(
        protect,
        validate(authParamsValidation.changePassword),
        authCtrl.changePassword
    );

/** POST /api/auth/password/forgot - forgot password */
router.route('/password/forgot')
    .post(
        validate(authParamsValidation.forgotPassword),
        authCtrl.forgotPassword
    );
/** POST /api/auth/password/verify - verify OTP */
router.route('/password/verify')
    .post(
        validate(authParamsValidation.reset_otp_verify),
        authCtrl.reset_otp_verify
    );

/** PATCH /api/auth/password/reset - reset password */
router.route('/password/reset')
    .patch(
        validate(authParamsValidation.resetPassword),
        authCtrl.resetPassword
    );

module.exports = router;