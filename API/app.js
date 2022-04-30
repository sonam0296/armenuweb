const express = require('express');
const dotenv = require('dotenv');
const logger = require('morgan');
const bodyParser = require('body-parser');
const cors = require('cors');
const helmet = require('helmet');
const expressValidation = require('express-validation');
const httpStatus = require('http-status');
const APIError = require('./helpers/APIError');
const routes = require('./routes');


dotenv.config();


const app = express();
// set morgan logs onto the server...
if (process.env.NODE_ENV === 'development') {
    app.use(logger('dev'));
} else {
    app.use(logger('tiny'));
}


// set body parser...
app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(bodyParser.json());

// set cors...
app.use(cors());

// set helmet to protect server from malicious attacks...
app.use(helmet.frameguard({
    action: "deny",
}),
    helmet.contentSecurityPolicy({
        directives: {
            "frame-ancestors": ["'none'"],
        },
    })
);


// app.use('upload/', express.static(__dirname + 'documents'));
app.use('/uploads', express.static(__dirname + '/uploads'));

// Validating all the APIs with jwt token.
// app.use(expressJWT({ secret: process.env.JWT_SECRET }));

// declare all the routes...
// Need jwt token to visit this routes after uncommenting expressJWT code above.
app.use('/api', routes);



app.use((err, req, res, next) => {
    console.log(err);
    if (err instanceof expressValidation.ValidationError) {
        // validation error contains errors which is an array of error each containing message[]
        const unifiedErrorMessage = err.errors.map(error => error.messages.join('. ')).join(' and ');
        const error = new APIError(unifiedErrorMessage, err.status, true);
        return next(error);
    } else if (!(err instanceof APIError)) {
        const apiError = new APIError(err.message, err.status, err.name === 'UnauthorizedError' ? true : err.isPublic);
        return next(apiError);
    }
    return next(err);
});

app.use((req, res, next) => {
    const err = new APIError('API Not Found', httpStatus.NOT_FOUND, true);
    return next(err);
});

app.use((err, req, res, next) => {
    res.status(err.status).json({
        error: {
            message: err.isPublic ? err.message : httpStatus[err.status],
        }
    });
}
);
module.exports = app;
