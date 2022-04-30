const i18n = require('i18next');
const english = require('./locales/en.json');
const hindi = require('./locales/hi.json');
const APIError = require('../helpers/APIError');
const httpStatus = require('http-status');
// const resPattern = require('../helpers/resPattern');


// i18n.createInstance({
//     lng: 'en',
//     debug: true,  // set to true in development environment
//     interpolation: true,
//     // keySeparator: true,
//     resources: {
//         en: {
//             translation: english
//         },
//         hi: {
//             translation: hindi
//         }
//     }
// });


const translate_meta = {
    lan: '',
    // ref:{},
    key: '',
    interpolation: {},
    payload: {}
}

const i18_translate = async (translate_meta, callback) => {
    i18n.createInstance(
        // 'hi'
        {
            lng: translate_meta.lan ? translate_meta.lan : 'en',
            debug: false,  // set to true in development environment
            interpolation: true,
            // keySeparator: true,
            resources: {
                en: {
                    translation: english
                },
                hi: {
                    translation: hindi
                }
            }
        }
        , (err, t) => {
            if (err) return next(new APIError("Something went wrong loading translation file.", httpStatus.BAD_REQUEST, true));
            const translation = t(translate_meta.key, translate_meta.interpolation);

            translate_meta.payload.message = translation
            return callback(translate_meta.payload)
        }
    );
}

const i18_notification_translate = async (translate_meta, callback) => {
    i18n.createInstance(
        // 'hi'
        {
            lng: translate_meta.lan ? translate_meta.lan : 'en',
            debug: false,  // set to true in development environment
            interpolation: true,
            // keySeparator: true,
            returnObjects: true,
            resources: {
                en: {
                    translation: english
                },
                hi: {
                    translation: hindi
                }
            }
        }
        , (err, t) => {
            if (err) return next(new APIError("Something went wrong loading translation file.", httpStatus.BAD_REQUEST, true));
            const translation = t(translate_meta.key, translate_meta.interpolation);


            translate_meta.payload.notification.title = translation.title
            translate_meta.payload.notification.body = translation.body
            translate_meta.payload.data.order_details = translation.order_details ? translation.order_details : ''
            return callback(translate_meta.payload)
        }
    );
}


const i18_translate_err = async (translate_meta, next, callback) => {
    i18n.createInstance({
        lng: translate_meta.lan ? translate_meta.lan : 'en',
        debug: false,  // set to true in development environment
        interpolation: true,
        // keySeparator: true,
        resources: {
            en: {
                translation: english
            },
            hi: {
                translation: hindi
            }
        }
    }
        , (err, t) => {
            if (err) return next(new APIError("Something went wrong loading translation file.", httpStatus.BAD_REQUEST, true));
            translation = t(translate_meta.key, translate_meta.interpolation);
            return next(new APIError(translation, httpStatus.BAD_REQUEST, true))
        }
    );
}



module.exports = { i18_translate, i18_translate_err, translate_meta, i18_notification_translate }