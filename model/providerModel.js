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
    providerImage:{
        type:String
    },
    providerType:{
        type:String,

    },
    providerReview:{
        type:String
    },
    status:{
        type:String,
        default:"Active"
    }
})

module.exports = mongoose.model("provider",providerSchema)