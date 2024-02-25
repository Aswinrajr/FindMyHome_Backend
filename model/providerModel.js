const mongoose = require('mongoose')

const providerSchema = new mongoose.Schema({
    providerName:{
        type:String,

    },
    providerEmail:{
        type:String,
        required:true,
        unique:true
    },
    providerMobile:{
        type:Number,
        required:true,
        unique:true

    },
    providerPassword:{
        type:String,
        required:true
    },
    providerAdress:{
        type:String,

    },
    ProviderCity:{
        type:String,

    },
    ProviderState:{
        type:String

    },
    providerImage:[{
        type:String
    }],
    providerType:{
        type:String,

    },
    providerRooms:{
        type:Number

    },
    providerReview:{
        type:String
    },
    status:{
        type:String,
        default:"Active"
    },
    Verified:{
        type:String,
        default:false
    },
    Profile:{
        type:String,
        default:"Not Completed"
    },
    coordinates:[{
        type:Number
    }]
})

module.exports = mongoose.model("provider",providerSchema)