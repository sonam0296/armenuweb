const mongoose = require('mongoose')

const TourModel = new mongoose.Schema({
   userType: {
      type: String,
      default: undefined
   },
   title: {
      type: String,
      default: undefined
   },
   content: {
      type: String,
      default: undefined
   },
   source_url: {
      type: String,
      default: undefined
   },
   is_outlet: {
      type: Boolean,
      default: function () {
         if (this.userType === "owner") {
            return false;
         } else {
            return undefined;
         }
      }
   },
   master_brand: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: function () {
         if (this.is_outlet === false) {
            return undefined;
         }
      }
   }
}, {
   timestamps: true
});

module.exports = mongoose.model("Tour", TourModel)