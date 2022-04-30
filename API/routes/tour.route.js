const router = require('express').Router();
const tourCtrl = require('../controller/tour.controller');
const { protect, owned, authorize, aggregator } = require('../middleware/auth');

router.post("/tourcontent", protect, authorize, tourCtrl.AddTourContent)
router.post("/gettourcontent_owner", protect, owned, tourCtrl.getTourContent)
router.post("/gettourcontent_admin", protect, authorize, tourCtrl.getTourContent)
router.post("/gettourcontent_aggregator", protect, aggregator, tourCtrl.getTourContent)
router.delete("/deletetour/:id", protect, authorize, tourCtrl.delTourContent)
module.exports = router;
