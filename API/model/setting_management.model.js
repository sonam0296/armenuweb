const mongoose = require("mongoose")
const link = "https://appetizar.nyc3.digitaloceanspaces.com/1611485121216-default.jpg"
const image_name = "1611485121216-default.jpg"

const siteInfo = new mongoose.Schema({
    site_Name:{
        type:String,
        default:undefined
    },
    site_Description:{
        type:String,
        default:undefined
    },
    title:{
        type:String,
        default:undefined
    },
    subtitle:{
        type:String,
        default:undefined
    },
    delievery_Cost_fixed:{
        type:Number,
        default:undefined
    },
    facebook_link:{
        type:String,
        default:undefined
    },
    instagram_link:{
        type:String,
        default:undefined
    },
    info_title:{
        type:String,
        default:undefined
    },
    info_subtitle:{
        type:String,
        default:undefined
    },
    playstore_link:{
        type:String,
        default:undefined
    },
    appstore_link:{
        type:String,
        default:undefined
    },
    site_logo:{
        image_name: {
			type: String,
			default: undefined
		},
		image_url: {
			type: String,
			default: undefined
		}
    },
    restaurant_cover_image:{
        image_name: {
			type: String,
			default: undefined
		},
		image_url: {
			type: String,
			default: undefined
		}
    },
    search_cover:{
        image_name: {
			type: String,
			default: undefined
		},
		image_url: {
			type: String,
			default: undefined
		}
    },
    favicon:{
        image_name: {
			type: String,
			default: undefined
		},
		image_url: {
			type: String,
			default: undefined
		}
    },
    restaurant_default_image:{
        image_name: {
			type: String,
			default: undefined
		},
		image_url: {
			type: String,
			default: undefined
		}        
    },
    default_image: {
		image_name: {
			type: String,
			default:undefined
		},
		image_url: {
			type: String,
			default:undefined
		}
	},
    site_content:{
        type:Array,
        default:undefined
    }

}, 
{
    timestamps: true
})





module.exports =  mongoose.model('Site',siteInfo)