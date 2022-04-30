const mongoose = require("mongoose")
const themeModel = new mongoose.Schema({
    // owner reference..
    theme_author_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },
    theme_type:{
        type: String,
        default:"Custom",
        enum:["Master","Custom"]
    },
    used_count: {
        type: Number,
    },
    is_selected: {
        type: Boolean,
        default:false
    },
    ui:{
        type:Object,
    }
},
    {
        timestamps: true
    }
)
module.exports = mongoose.model("web_themes", themeModel)