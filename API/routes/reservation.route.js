const router = require('express').Router();
const ReservationCtrl = require('../controller/reservation.controller');
const validate = require('express-validation');
const { reservationValidation } = require('../helpers/joi.validation');
const { protect, owned, authorize } = require('../middleware/auth');

router.post('/get-reservations',
validate(reservationValidation.get_reservations),
ReservationCtrl.get_reservations
);

router.post('/add-reservation',
protect,
validate(reservationValidation.add_reservation),
ReservationCtrl.reservations
);

router.post('/notify-for-service',
// protect,
validate(reservationValidation.notify_for_service),
ReservationCtrl.notify_for_service
);



module.exports = router;