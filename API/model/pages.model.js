const { required } = require("joi");

const mongoose = require("mongoose")

const pageModel  = new mongoose.Schema({
    title:{
        type:String
    },
    content:{
        type:String
    },
    show_as_link:{
        type:Boolean,
        default:false
    }
},
{
    timestamps: true
}
)

module.exports = mongoose.model("Pages",pageModel)