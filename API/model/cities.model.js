const { required } = require("joi");

const mongoose = require("mongoose")

const cityModel  = new mongoose.Schema({
    city_name:{
        type:String
    },
    country_name:{
        type:String
    },
    state:{
        type:String
    },
    short_code:{
        type:String
    },
    title:{
        type:String
    },
    sub_title:{
        type:String
    },
    city_image:{
        image_name:{
            type:String,
            default:undefined
        },
        image_url:{
            type:String,
            default:undefined
        }
    }   
},
{
    timestamps: true
}
)

module.exports = mongoose.model("Cities",cityModel)